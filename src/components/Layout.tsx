import React, { useState } from 'react';
import {
  LayoutDashboard,
  Upload,
  FileText,
  TrendingUp,
  ClipboardList,
  Wallet,
  BookOpen,
  Menu,
  X,
  Sparkles
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage, onPageChange }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { id: 'dashboard', name: '대시보드', icon: LayoutDashboard },
    { id: 'demand-register', name: '수요처 등록', icon: Upload },
    { id: 'demand-list', name: '수요처 관리', icon: FileText },
    { id: 'performance-input', name: '실적 입력', icon: TrendingUp },
    { id: 'performance-list', name: '실적 조회', icon: ClipboardList },
    { id: 'budget-usage', name: '예산 사용 내역', icon: Wallet },
    { id: 'manual', name: '사용매뉴얼', icon: BookOpen },
  ];

  const handleNavClick = (pageId: string) => {
    onPageChange(pageId);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-mesh">
      {/* 모바일 헤더 */}
      <div className="lg:hidden glass-strong fixed top-0 left-0 right-0 z-40 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            실적관리
          </h1>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2.5 rounded-xl glass hover:bg-white/80 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label={isMobileMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
        >
          {isMobileMenuOpen ? <X className="w-5 h-5 text-gray-700" /> : <Menu className="w-5 h-5 text-gray-700" />}
        </button>
      </div>

      {/* 모바일 오버레이 */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* 데스크톱 사이드바 */}
      <div className="hidden lg:flex fixed inset-y-0 left-0 z-50 w-72 flex-col glass-sidebar">
        {/* 로고 영역 */}
        <div className="flex h-20 items-center gap-3 px-6 border-b border-white/20">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">실적관리 시스템</h1>
            <p className="text-xs text-gray-500">Admin Dashboard</p>
          </div>
        </div>

        {/* 네비게이션 */}
        <nav className="flex-1 overflow-y-auto py-6 px-4">
          <div className="space-y-1.5">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                      : 'text-gray-600 hover:bg-white/60 hover:text-gray-900'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* 하단 정보 */}
        <div className="p-4 border-t border-white/20">
          <div className="glass-card p-4">
            <p className="text-xs text-gray-500 mb-1">경기도체육회</p>
            <p className="text-sm font-medium text-gray-700">스포츠박스</p>
          </div>
        </div>
      </div>

      {/* 모바일 사이드바 */}
      <div className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 flex-col glass-sidebar transform transition-transform duration-300 ease-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* 모바일 로고 */}
        <div className="flex h-16 items-center gap-3 px-5 border-b border-white/20">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900">실적관리</h1>
            <p className="text-xs text-gray-500">Dashboard</p>
          </div>
        </div>

        {/* 모바일 네비게이션 */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-white/60'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="lg:pl-72 pt-16 lg:pt-0">
        <main className="p-4 lg:p-8 min-h-screen">
          <div className="max-w-7xl mx-auto animate-fadeIn">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
