import React from 'react';

interface RegionBadgeProps {
  region?: '남부' | '북부';
}

// 남부/북부 지역 배지 (남부=파랑, 북부=초록으로 통일)
const RegionBadge: React.FC<RegionBadgeProps> = ({ region }) => {
  if (!region) return null;
  return (
    <span className={`badge ${region === '남부' ? 'badge-blue' : 'badge-emerald'}`}>
      {region}
    </span>
  );
};

export default RegionBadge;
