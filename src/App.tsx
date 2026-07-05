import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import DemandRegister from './components/DemandRegister';
import DemandList from './components/DemandList';
import PerformanceInput from './components/PerformanceInput';
import PerformanceList from './components/PerformanceList';
import Manual from './components/Manual';
import Login from './components/Login';
import ChangePassword from './components/ChangePassword';
import BudgetUsagePage from './components/BudgetUsagePage';
import { useFirebaseData } from './hooks/useFirebaseData';
import { Loader2, KeyRound, LogOut, AlertTriangle } from 'lucide-react';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
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
            <AlertTriangle className="w-8 h-8 text-rose-500" />
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

      {showChangePw && <ChangePassword onClose={() => setShowChangePw(false)} />}
    </div>
  );
}

export default App;
