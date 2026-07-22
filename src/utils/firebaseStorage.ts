import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  onSnapshot,
  runTransaction,
  Timestamp,
  getDoc,
  setDoc,
  DocumentData
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Demand, Performance, BudgetItem, BudgetUsage } from '../types';
import { BUDGET_2026_ALL } from '../data/budget2026';
import { normalizeDemandYear } from './demandYear';
import { toDateInputValue } from './performanceDuplicates';

export class DuplicatePerformanceError extends Error {
  constructor() {
    super('같은 날짜에 같은 단체명의 실적이 이미 등록되어 있습니다.');
    this.name = 'DuplicatePerformanceError';
  }
}

// 같은 날짜+단체명 조합을 하나의 문서 ID로 고정해 동시 등록도 트랜잭션에서 충돌하게 만든다.
const getPerformanceKeyId = (date: Date, organizationName: string): string =>
  encodeURIComponent(`${toDateInputValue(date)}|${organizationName.trim()}`);

// performanceKeys 잠금 문서가 없는 기존 실적까지 커버하는 서버 조회 기반 중복 확인.
const assertNoServerDuplicate = async (
  date: Date,
  organizationName: string,
  excludeId?: string
): Promise<void> => {
  const normalizedName = organizationName.trim();
  const dateKey = toDateInputValue(date);
  if (!dateKey || !normalizedName) return;

  const q = query(collection(db, 'performances'), where('organizationName', '==', normalizedName));
  const snapshot = await getDocs(q);
  const hasDuplicate = snapshot.docs.some(docSnap => {
    if (docSnap.id === excludeId) return false;
    const existingDate = docSnap.data().date?.toDate?.();
    return existingDate instanceof Date && toDateInputValue(existingDate) === dateKey;
  });

  if (hasDuplicate) throw new DuplicatePerformanceError();
};

const NORTH_2026_ORDER_START = 20;
const NORTH_2026_ORDER_END = 29;
const SOUTH_2026_ORDER_START = 10;
const SOUTH_2026_ORDER_END = 19;

const inferBudgetRegionFromLegacy = (name: unknown, year: number, order: unknown): '남부' | '북부' | undefined => {
  const safeName = typeof name === 'string' ? name : '';
  const compactName = safeName.replace(/\s+/g, '');

  if (/(?:_북부|\(북부\)|북부)/.test(compactName)) return '북부';

  if (year === 2026 && typeof order === 'number') {
    if (order >= NORTH_2026_ORDER_START && order <= NORTH_2026_ORDER_END) return '북부';
    if (order >= SOUTH_2026_ORDER_START && order <= SOUTH_2026_ORDER_END) return '남부';
  }

  return undefined;
};

const normalizeBudgetRegion = (
  region: unknown,
  inferredRegion: '남부' | '북부' | undefined
): '남부' | '북부' | undefined => {
  const normalizedRegion = typeof region === 'string' ? region.trim() : '';
  if (normalizedRegion === '남부' || normalizedRegion === '북부') {
    if (inferredRegion === '북부') return '북부';
    return normalizedRegion;
  }
  return inferredRegion;
};

const normalizeBudgetItem = (id: string, data: DocumentData): BudgetItem => {
  const year = data.year ?? 2025;
  const inferredRegion = inferBudgetRegionFromLegacy(data.name, year, data.order);
  const region = normalizeBudgetRegion(data.region, inferredRegion);

  return {
    id,
    ...data,
    year,
    region
  } as BudgetItem;
};

const normalizeDemand = (id: string, data: DocumentData): Demand => {
  const createdAt = data.createdAt?.toDate?.() || new Date();
  const updatedAt = data.updatedAt?.toDate?.() || new Date();

  return {
    id,
    ...data,
    year: normalizeDemandYear({ year: data.year, createdAt }),
    email: data.email || '',
    createdAt,
    updatedAt
  } as Demand;
};

export const firebaseStorage = {
  // 수요처 관련 작업
  async getDemands(): Promise<Demand[]> {
    try {
      const q = query(collection(db, 'demands'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => normalizeDemand(doc.id, doc.data()));
    } catch (error) {
      console.error('수요처 데이터 로드 실패:', error);
      throw error;
    }
  },

  async addDemand(demand: Omit<Demand, 'id' | 'createdAt' | 'updatedAt'>): Promise<Demand> {
    try {
      const now = Timestamp.now();
      // email 필드가 undefined인 경우 빈 문자열로 처리
      const demandData = {
        ...demand,
        year: demand.year,
        email: demand.email || '',
        createdAt: now,
        updatedAt: now
      };
      const docRef = await addDoc(collection(db, 'demands'), demandData);
      
      return {
        id: docRef.id,
        ...demand,
        createdAt: now.toDate(),
        updatedAt: now.toDate()
      };
    } catch (error) {
      console.error('수요처 추가 실패:', error);
      throw error;
    }
  },

  async updateDemand(id: string, updates: Partial<Demand>): Promise<void> {
    try {
      const docRef = doc(db, 'demands', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('수요처 수정 실패:', error);
      throw error;
    }
  },

  async deleteDemand(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'demands', id));
    } catch (error) {
      console.error('수요처 삭제 실패:', error);
      throw error;
    }
  },

  // 실적 관련 작업
  async getPerformances(): Promise<Performance[]> {
    try {
      const q = query(collection(db, 'performances'), orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Performance[];
    } catch (error) {
      console.error('실적 데이터 로드 실패:', error);
      throw error;
    }
  },

  async addPerformance(performance: Omit<Performance, 'id' | 'createdAt' | 'updatedAt'>): Promise<Performance> {
    try {
      const now = Timestamp.now();

      // notes 필드를 안전하게 처리
      const safeNotes = performance.notes !== undefined && performance.notes !== null
        ? performance.notes.toString().trim()
        : '';

      // 잠금 문서가 없는 기존 실적과의 중복은 서버 조회로 차단
      await assertNoServerDuplicate(performance.date, performance.organizationName);

      const keyRef = doc(db, 'performanceKeys', getPerformanceKeyId(performance.date, performance.organizationName));
      const docRef = doc(collection(db, 'performances'));

      await runTransaction(db, async (transaction) => {
        const keySnap = await transaction.get(keyRef);
        if (keySnap.exists()) throw new DuplicatePerformanceError();

        transaction.set(keyRef, {
          performanceId: docRef.id,
          dateKey: toDateInputValue(performance.date),
          organizationName: performance.organizationName.trim(),
          createdAt: now
        });
        transaction.set(docRef, {
          ...performance,
          notes: safeNotes,
          date: Timestamp.fromDate(performance.date),
          createdAt: now,
          updatedAt: now
        });
      });

      return {
        id: docRef.id,
        ...performance,
        notes: safeNotes,
        createdAt: now.toDate(),
        updatedAt: now.toDate()
      };
    } catch (error) {
      console.error('실적 추가 실패:', error);
      throw error;
    }
  },

  async updatePerformance(id: string, updates: Partial<Performance>): Promise<void> {
    try {
      const docRef = doc(db, 'performances', id);

      // notes 필드를 안전하게 처리
      const safeNotes = updates.notes !== undefined && updates.notes !== null
        ? updates.notes.toString().trim()
        : undefined;

      const updateData: DocumentData = {
        ...updates,
        updatedAt: Timestamp.now()
      };

      // notes가 있는 경우에만 추가
      if (safeNotes !== undefined) {
        updateData.notes = safeNotes;
      }

      if (updates.date) {
        updateData.date = Timestamp.fromDate(updates.date);
      }

      const currentSnap = await getDoc(docRef);
      if (!currentSnap.exists()) throw new Error('수정할 실적을 찾을 수 없습니다.');

      const currentData = currentSnap.data();
      const currentDate = currentData.date?.toDate?.() || new Date();
      const currentName = (currentData.organizationName || '') as string;
      const nextDate = updates.date ?? currentDate;
      const nextName = updates.organizationName ?? currentName;
      const currentKeyId = getPerformanceKeyId(currentDate, currentName);
      const nextKeyId = getPerformanceKeyId(nextDate, nextName);

      if (nextKeyId !== currentKeyId) {
        await assertNoServerDuplicate(nextDate, nextName, id);
      }

      await runTransaction(db, async (transaction) => {
        const nextKeyRef = doc(db, 'performanceKeys', nextKeyId);
        const nextKeySnap = await transaction.get(nextKeyRef);
        if (nextKeySnap.exists() && nextKeySnap.data().performanceId !== id) {
          throw new DuplicatePerformanceError();
        }

        if (nextKeyId !== currentKeyId) {
          const currentKeyRef = doc(db, 'performanceKeys', currentKeyId);
          const currentKeySnap = await transaction.get(currentKeyRef);
          if (currentKeySnap.exists() && currentKeySnap.data().performanceId === id) {
            transaction.delete(currentKeyRef);
          }
        }

        transaction.set(nextKeyRef, {
          performanceId: id,
          dateKey: toDateInputValue(nextDate),
          organizationName: nextName.trim(),
          createdAt: nextKeySnap.exists() ? nextKeySnap.data().createdAt : Timestamp.now()
        });
        transaction.update(docRef, updateData);
      });
    } catch (error) {
      console.error('실적 수정 실패:', error);
      throw error;
    }
  },

  async deletePerformance(id: string): Promise<void> {
    try {
      const docRef = doc(db, 'performances', id);

      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(docRef);
        if (!snap.exists()) return;

        const data = snap.data();
        const date = data.date?.toDate?.();
        const keyId = date instanceof Date
          ? getPerformanceKeyId(date, (data.organizationName || '') as string)
          : null;

        if (keyId) {
          const keyRef = doc(db, 'performanceKeys', keyId);
          const keySnap = await transaction.get(keyRef);
          if (keySnap.exists() && keySnap.data().performanceId === id) {
            transaction.delete(keyRef);
          }
        }

        transaction.delete(docRef);
      });
    } catch (error) {
      console.error('실적 삭제 실패:', error);
      throw error;
    }
  },

  // 실시간 데이터 구독
  subscribeToDemands(callback: (demands: Demand[]) => void): () => void {
    const q = query(collection(db, 'demands'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (querySnapshot) => {
      const demands = querySnapshot.docs.map(doc => normalizeDemand(doc.id, doc.data()));
      callback(demands);
    });
  },

  subscribeToPerformances(callback: (performances: Performance[]) => void): () => void {
    const q = query(collection(db, 'performances'), orderBy('date', 'desc'));
    return onSnapshot(q, (querySnapshot) => {
      const performances = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Performance[];
      callback(performances);
    });
  },

  // 예산 항목 관련 작업
  async getBudgets(): Promise<BudgetItem[]> {
    try {
      const q = query(collection(db, 'budgets'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => normalizeBudgetItem(doc.id, doc.data()));
    } catch (error) {
      console.error('예산 항목 데이터 로드 실패:', error);
      throw error;
    }
  },

  async addBudget(budget: Omit<BudgetItem, 'id'>): Promise<BudgetItem> {
    try {
      const docRef = await addDoc(collection(db, 'budgets'), budget);
      return { id: docRef.id, ...budget };
    } catch (error) {
      console.error('예산 항목 추가 실패:', error);
      throw error;
    }
  },

  async updateBudget(id: string, updates: Partial<BudgetItem>): Promise<void> {
    try {
      const docRef = doc(db, 'budgets', id);
      await updateDoc(docRef, updates);
    } catch (error) {
      console.error('예산 항목 수정 실패:', error);
      throw error;
    }
  },

  async deleteBudget(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'budgets', id));
    } catch (error) {
      console.error('예산 항목 삭제 실패:', error);
      throw error;
    }
  },

  async updateBudgetOrder(budgets: BudgetItem[]): Promise<void> {
    const batch = [];
    for (const b of budgets) {
      const docRef = doc(db, 'budgets', b.id);
      batch.push(updateDoc(docRef, { order: b.order ?? 0 }));
    }
    await Promise.all(batch);
  },

  subscribeToBudgets(callback: (budgets: BudgetItem[]) => void): () => void {
    const q = query(collection(db, 'budgets'));
    return onSnapshot(q, (querySnapshot) => {
      const budgets = querySnapshot.docs.map((doc) => normalizeBudgetItem(doc.id, doc.data()));
      callback(budgets);
    });
  },

  // 예산 사용 내역 관련 작업
  async getBudgetUsages(): Promise<BudgetUsage[]> {
    try {
      const q = query(collection(db, 'budgetUsages'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BudgetUsage[];
    } catch (error) {
      console.error('예산 사용 내역 데이터 로드 실패:', error);
      throw error;
    }
  },

  async addBudgetUsage(usage: Omit<BudgetUsage, 'id'>): Promise<BudgetUsage> {
    try {
      const docRef = await addDoc(collection(db, 'budgetUsages'), usage);
      return { id: docRef.id, ...usage };
    } catch (error) {
      console.error('예산 사용 내역 추가 실패:', error);
      throw error;
    }
  },

  async updateBudgetUsage(id: string, updates: Partial<BudgetUsage>): Promise<void> {
    try {
      const docRef = doc(db, 'budgetUsages', id);
      await updateDoc(docRef, updates);
    } catch (error) {
      console.error('예산 사용 내역 수정 실패:', error);
      throw error;
    }
  },

  async deleteBudgetUsage(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'budgetUsages', id));
    } catch (error) {
      console.error('예산 사용 내역 삭제 실패:', error);
      throw error;
    }
  },

  subscribeToBudgetUsages(callback: (usages: BudgetUsage[]) => void): () => void {
    const q = query(collection(db, 'budgetUsages'));
    return onSnapshot(q, (querySnapshot) => {
      const usages = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BudgetUsage[];
      callback(usages);
    });
  },

  // 관리자 계정 관련 작업
  async getAdminUser(): Promise<{ username: string; passwordHash: string } | null> {
    try {
      const docRef = doc(db, 'admin', 'user');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as { username: string; passwordHash: string };
      }
      return null;
    } catch (error) {
      console.error('관리자 계정 로드 실패:', error);
      throw error;
    }
  },

  async saveAdminUser(user: { username: string; passwordHash: string }): Promise<void> {
    try {
      const docRef = doc(db, 'admin', 'user');
      await setDoc(docRef, user);
    } catch (error) {
      console.error('관리자 계정 저장 실패:', error);
      throw error;
    }
  },

  async createDefaultAdmin(): Promise<void> {
    try {
      const { hashPassword } = await import('./storage');
      const defaultHash = await hashPassword('admin123');
      await this.saveAdminUser({ username: 'admin', passwordHash: defaultHash });
    } catch (error) {
      console.error('기본 관리자 계정 생성 실패:', error);
      throw error;
    }
  },

  // 2026년 예산 초기화 함수
  async initializeBudget2026(): Promise<void> {
    try {
      // 기존 2026년 예산이 있는지 확인
      const budgets = await this.getBudgets();
      const has2026Budgets = budgets.some(b => b.year === 2026);

      if (has2026Budgets) {
        console.log('2026년 예산이 이미 존재합니다.');
        return;
      }

      // 2026년 예산 항목 추가
      for (const budget of BUDGET_2026_ALL) {
        await addDoc(collection(db, 'budgets'), budget);
      }

      console.log('2026년 예산 초기화 완료');
    } catch (error) {
      console.error('2026년 예산 초기화 실패:', error);
      throw error;
    }
  },

  // 특정 연도의 예산 항목 조회
  async getBudgetsByYear(year: number): Promise<BudgetItem[]> {
    try {
      const budgets = await this.getBudgets();
      return budgets.filter(b => (b.year ?? 2025) === year);
    } catch (error) {
      console.error(`${year}년 예산 데이터 로드 실패:`, error);
      throw error;
    }
  }
};
