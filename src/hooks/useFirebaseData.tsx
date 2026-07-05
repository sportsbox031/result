import React, { createContext, useContext, useState, useEffect } from 'react';
import { firebaseStorage } from '../utils/firebaseStorage';
import { Demand, Performance, BudgetItem, BudgetUsage } from '../types';

interface FirebaseDataContextValue {
  demands: Demand[];
  performances: Performance[];
  budgetItems: BudgetItem[];
  budgetUsages: BudgetUsage[];
  loading: boolean;
  error: string | null;
  addDemand: typeof firebaseStorage.addDemand;
  updateDemand: typeof firebaseStorage.updateDemand;
  deleteDemand: typeof firebaseStorage.deleteDemand;
  addPerformance: typeof firebaseStorage.addPerformance;
  updatePerformance: typeof firebaseStorage.updatePerformance;
  deletePerformance: typeof firebaseStorage.deletePerformance;
}

const FirebaseDataContext = createContext<FirebaseDataContextValue | null>(null);

// Firestore 실시간 구독을 앱에서 단 한 번만 생성해 모든 페이지가 공유한다.
// (기존에는 페이지마다 useFirebaseData를 호출할 때마다 컬렉션 4개를 중복 구독했다)
export const FirebaseDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [demands, setDemands] = useState<Demand[]>([]);
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [budgetUsages, setBudgetUsages] = useState<BudgetUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribers: Array<() => void> = [];

    try {
      setLoading(true);
      setError(null);

      unsubscribers = [
        firebaseStorage.subscribeToDemands(setDemands),
        firebaseStorage.subscribeToPerformances(setPerformances),
        firebaseStorage.subscribeToBudgets(setBudgetItems),
        firebaseStorage.subscribeToBudgetUsages(setBudgetUsages)
      ];

      setLoading(false);
    } catch (err) {
      console.error('Firebase 데이터 초기화 실패:', err);
      setError('데이터를 불러오는데 실패했습니다. 네트워크 연결을 확인해주세요.');
      setLoading(false);
    }

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, []);

  const value: FirebaseDataContextValue = {
    demands,
    performances,
    budgetItems,
    budgetUsages,
    loading,
    error,
    addDemand: firebaseStorage.addDemand,
    updateDemand: firebaseStorage.updateDemand,
    deleteDemand: firebaseStorage.deleteDemand,
    addPerformance: firebaseStorage.addPerformance,
    updatePerformance: firebaseStorage.updatePerformance,
    deletePerformance: firebaseStorage.deletePerformance
  };

  return (
    <FirebaseDataContext.Provider value={value}>
      {children}
    </FirebaseDataContext.Provider>
  );
};

export const useFirebaseData = (): FirebaseDataContextValue => {
  const context = useContext(FirebaseDataContext);
  if (!context) {
    throw new Error('useFirebaseData는 FirebaseDataProvider 내부에서만 사용할 수 있습니다.');
  }
  return context;
};
