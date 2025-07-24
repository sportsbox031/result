import React, { useState } from 'react';
import { Users, TrendingUp, FileText, BarChart3, Upload, BookOpen, Menu, X } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage, onPageChange }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const navigation = [
    { id: 'dashboard', name: '대시보드', icon: BarChart3 },
    { id: 'demand-register', name: '수요처 등록', icon: Upload },
    { id: 'demand-list', name: '수요처 관리', icon: FileText },
    { id: 'performance-input', name: '실적 입력', icon: TrendingUp },
    { id: 'performance-list', name: '실적 조회', icon: Users },
    { id: 'budget-usage', name: '예산 사용 내역', icon: FileText },
    { id: 'manual', name: '사용매뉴얼', icon: BookOpen },
  ];

  const handleNavClick = (pageId: string) => {
    onPageChange(pageId);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 모바일 헤더 */}
      <div className="lg:hidden mobile-header bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <h1 className="text-lg font-bold text-gray-900 truncate">관리자 대시보드</h1>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label={isMobileMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* 모바일 오버레이 */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50 touch-none"
          onClick={() => setIsMobileMenuOpen(false)}
          onTouchStart={(e) => e.preventDefault()}
        />
      )}

      {/* 데스크톱 사이드바 */}
      <div className="hidden lg:block fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex h-16 items-center justify-center border-b border-gray-200 px-4">
          <h1 className="text-xl font-bold text-gray-900 truncate">관리자 대시보드</h1>
        </div>
        <nav className="sidebar-nav mt-4 pb-4">
          <div className="space-y-1 px-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors min-h-[48px] ${
                    currentPage === item.id
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  aria-current={currentPage === item.id ? 'page' : undefined}
                >
                  <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  <span className="truncate text-left">{item.name}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* 모바일 사이드바 */}
      <div className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex h-16 items-center justify-center border-b border-gray-200 px-4">
          <h1 className="text-lg font-bold text-gray-900 truncate">메뉴</h1>
        </div>
        <nav className="sidebar-nav mt-4 pb-4">
          <div className="space-y-1 px-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors min-h-[48px] ${
                    currentPage === item.id
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  aria-current={currentPage === item.id ? 'page' : undefined}
                >
                  <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  <span className="truncate text-left">{item.name}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="lg:pl-64 pt-16 lg:pt-0">
        <main className="p-4 lg:p-8 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;