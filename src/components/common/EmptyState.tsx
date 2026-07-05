import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

// 데이터 없음 표시 공통 컴포넌트
const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description }) => (
  <div className="text-center py-16">
    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
      <Icon className="w-10 h-10 text-gray-300" />
    </div>
    <p className="text-lg font-medium text-gray-500 mb-2">{title}</p>
    {description && <p className="text-sm text-gray-400">{description}</p>}
  </div>
);

export default EmptyState;
