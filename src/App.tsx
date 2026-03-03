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
import { Loader2, KeyRound, LogOut } from 'lucide-react';
import BudgetUsagePage from './components/BudgetUsagePage';
import Manual from './components/Manual';
import Login from './components/Login';
import ChangePassword from './components/ChangePassword';
import { loadAdminUser } from './utils/storage';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const { toasts, addToast, removeToast } = useToast();
  const { loading, error } = useFirebaseData();
  const [loggedIn, setLoggedIn] = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('admin_logged_in') === 'true') {
      setLoggedIn(true);
    }
  }, []);

  function handleLogin() {
    setLoggedIn(true);
    localStorage.setItem('admin_logged_in', 'true');
  }

  function handleLogout() {
    setLoggedIn(false);
    localStorage.removeItem('admin_logged_in');
  }

  if (!loggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  const renderCurrentPage = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-500">데이터를 불러오는 중...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="glass-card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-gray-900 mb-2">연결 오류</p>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            다시 시도
          </button>
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
      case 'manual':
        return <Manual />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen">
      <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
        {/* 상단 액션 버튼 */}
        <div className="flex justify-end gap-2 mb-6">
          <button
            className="btn-glass flex items-center gap-2 text-sm"
            onClick={() => setShowChangePw(true)}
          >
            <KeyRound className="w-4 h-4" />
            <span className="hidden sm:inline">비밀번호 변경</span>
          </button>
          <button
            className="btn-glass flex items-center gap-2 text-sm text-rose-600 hover:bg-rose-50"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">로그아웃</span>
          </button>
        </div>

        {renderCurrentPage()}
      </Layout>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
      {showChangePw && <ChangePassword onClose={() => setShowChangePw(false)} />}
    </div>
  );
}

export default App;
