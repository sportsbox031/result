import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  onSnapshot,
  Timestamp,
  getDoc,
  setDoc 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Demand, Performance, BudgetItem, BudgetUsage } from '../types';

export const firebaseStorage = {
  // 수요처 관련 작업
  async getDemands(): Promise<Demand[]> {
    try {
      const q = query(collection(db, 'demands'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Demand[];
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
      
      const docRef = await addDoc(collection(db, 'performances'), {
        ...performance,
        notes: safeNotes,
        date: Timestamp.fromDate(performance.date),
        createdAt: now,
        updatedAt: now
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
      
      const updateData: any = {
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
      
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('실적 수정 실패:', error);
      throw error;
    }
  },

  async deletePerformance(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'performances', id));
    } catch (error) {
      console.error('실적 삭제 실패:', error);
      throw error;
    }
  },

  // 실시간 데이터 구독
  subscribeToDemands(callback: (demands: Demand[]) => void): () => void {
    const q = query(collection(db, 'demands'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (querySnapshot) => {
      const demands = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Demand[];
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
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BudgetItem[];
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
      const budgets = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BudgetItem[];
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
  }
};