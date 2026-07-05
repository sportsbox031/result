import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  /** 아이콘 배경 그라디언트 tailwind 클래스 (예: 'from-blue-500 to-blue-600') */
  gradient: string;
  sub?: string;
  onClick?: () => void;
  /** 0~100. 지정하면 카드 하단에 진행바를 표시한다 (집행율 등) */
  progress?: number;
}

// 대시보드 통계 카드 공통 컴포넌트
const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, gradient, sub, onClick, progress }) => {
  const clickable = Boolean(onClick);

  return (
    <div
      className={`glass-stat rounded-2xl p-5 ${clickable ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.(); } : undefined}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900 break-words">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shrink-0`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      {progress !== undefined && (
        <div className="progress-bar mt-4">
          <div
            className={`progress-bar-fill ${progress >= 100 ? 'progress-bar-fill-rose' : progress >= 80 ? 'progress-bar-fill-amber' : 'progress-bar-fill-blue'}`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default StatCard;
