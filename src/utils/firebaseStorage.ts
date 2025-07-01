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
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Demand, Performance } from '../types';

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
      const docRef = await addDoc(collection(db, 'performances'), {
        ...performance,
        notes: performance.notes || '',
        date: Timestamp.fromDate(performance.date),
        createdAt: now,
        updatedAt: now
      });
      
      return {
        id: docRef.id,
        ...performance,
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
      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.now()
      };
      
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
  }
};