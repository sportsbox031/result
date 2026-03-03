import { useState, useEffect } from 'react';
import { firebaseStorage } from '../utils/firebaseStorage';
import { Demand, Performance, BudgetItem, BudgetUsage } from '../types';

export const useFirebaseData = () => {
  const [demands, setDemands] = useState<Demand[]>([]);
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [budgetUsages, setBudgetUsages] = useState<BudgetUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeDemands: (() => void) | null = null;
    let unsubscribePerformances: (() => void) | null = null;
    let unsubscribeBudgets: (() => void) | null = null;
    let unsubscribeBudgetUsages: (() => void) | null = null;

    const initializeData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 실시간 구독 설정
        unsubscribeDemands = firebaseStorage.subscribeToDemands((newDemands) => {
          setDemands(newDemands);
        });

        unsubscribePerformances = firebaseStorage.subscribeToPerformances((newPerformances) => {
          setPerformances(newPerformances);
        });

        unsubscribeBudgets = firebaseStorage.subscribeToBudgets((newBudgetItems) => {
          setBudgetItems(newBudgetItems);
        });

        unsubscribeBudgetUsages = firebaseStorage.subscribeToBudgetUsages((newBudgetUsages) => {
          setBudgetUsages(newBudgetUsages);
        });

        setLoading(false);
      } catch (err) {
        console.error('Firebase 데이터 초기화 실패:', err);
        setError('데이터를 불러오는데 실패했습니다. 네트워크 연결을 확인해주세요.');
        setLoading(false);
      }
    };

    initializeData();

    // 컴포넌트 언마운트 시 구독 해제
    return () => {
      if (unsubscribeDemands) unsubscribeDemands();
      if (unsubscribePerformances) unsubscribePerformances();
      if (unsubscribeBudgets) unsubscribeBudgets();
      if (unsubscribeBudgetUsages) unsubscribeBudgetUsages();
    };
  }, []);

  return {
    demands,
    performances,
    budgetItems,
    budgetUsages,
    loading,
    error,
    // Firebase 작업 함수들
    addDemand: firebaseStorage.addDemand,
    updateDemand: firebaseStorage.updateDemand,
    deleteDemand: firebaseStorage.deleteDemand,
    addPerformance: firebaseStorage.addPerformance,
    updatePerformance: firebaseStorage.updatePerformance,
    deletePerformance: firebaseStorage.deletePerformance
  };
};