import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import DemandRegister from './components/DemandRegister';
import DemandList from './components/DemandList';
import PerformanceInput from './components/PerformanceInput';
import PerformanceList from './components/PerformanceList';
import FirebaseSetup from './components/FirebaseSetup';
import ToastContainer from './components/ToastContainer';
import { useToast } from './hooks/useToast';
import { useFirebaseData } from './hooks/useFirebaseData';
import { Loader2 } from 'lucide-react';
import BudgetUsagePage from './components/BudgetUsagePage';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const { toasts, addToast, removeToast } = useToast();
  const { loading, error } = useFirebaseData();

  const renderCurrentPage = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">데이터를 불러오는 중...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="text-center">
            <p className="text-red-800 font-medium mb-2">연결 오류</p>
            <p className="text-red-600 text-sm">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      );
    }

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'demand-register':
        return <DemandRegister />;
      case 'demand-list':
        return <DemandList />;
      case 'performance-input':
        return <PerformanceInput />;
      case 'performance-list':
        return <PerformanceList />;
      case 'budget-usage':
        return <BudgetUsagePage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
        {renderCurrentPage()}
      </Layout>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default App;