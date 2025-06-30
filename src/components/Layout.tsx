import React from 'react';
import { Users, TrendingUp, FileText, BarChart3, Upload } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage, onPageChange }) => {
  const navigation = [
    { id: 'dashboard', name: '대시보드', icon: BarChart3 },
    { id: 'demand-register', name: '수요처 등록', icon: Upload },
    { id: 'demand-list', name: '수요처 관리', icon: FileText },
    { id: 'performance-input', name: '실적 입력', icon: TrendingUp },
    { id: 'performance-list', name: '실적 조회', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 사이드바 */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex h-16 items-center justify-center border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">관리자 대시보드</h1>
        </div>
        <nav className="mt-8">
          <div className="space-y-1 px-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onPageChange(item.id)}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    currentPage === item.id
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="pl-64">
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;