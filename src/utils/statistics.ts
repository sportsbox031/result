import { Performance, Demand } from '../types';

export const calculateStatistics = (performances: Performance[], demands: Demand[] = []) => {
  if (performances.length === 0) {
    return {
      totalMale: 0,
      totalFemale: 0,
      totalPeople: 0,
      totalPromotions: 0,
      totalOrganizations: 0,
      monthlyData: [],
      organizationData: [],
      cityData: []
    };
  }

  const totalMale = performances.reduce((sum, p) => sum + (p.maleCount || 0), 0);
  const totalFemale = performances.reduce((sum, p) => sum + (p.femaleCount || 0), 0);
  const totalPeople = totalMale + totalFemale;
  const totalPromotions = performances.reduce((sum, p) => sum + (p.promotionCount || 0), 0);
  const uniqueOrganizations = new Set(performances.map(p => p.organizationName));
  const totalOrganizations = uniqueOrganizations.size;

  // 최근 12개월 데이터
  const now = new Date();
  const monthlyData = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = date.toLocaleDateString('ko-KR', { month: 'short', year: '2-digit' });
    const monthPerformances = performances.filter(p => {
      if (!p.date) return false;
      const pDate = new Date(p.date);
      return pDate.getMonth() === date.getMonth() && pDate.getFullYear() === date.getFullYear();
    });
    const male = monthPerformances.reduce((sum, p) => sum + (p.maleCount || 0), 0);
    const female = monthPerformances.reduce((sum, p) => sum + (p.femaleCount || 0), 0);
    const promotions = monthPerformances.reduce((sum, p) => sum + (p.promotionCount || 0), 0);
    monthlyData.push({ 
      month: monthName, 
      male, 
      female, 
      total: male + female, 
      promotions 
    });
  }

  // 수요처별 데이터 (전체 표시)
  const orgMap = new Map<string, { total: number; count: number; city: string }>();
  performances.forEach(p => {
    const existing = orgMap.get(p.organizationName) || { total: 0, count: 0, city: '' };
    const demand = demands.find(d => d.organizationName === p.organizationName);
    orgMap.set(p.organizationName, {
      total: existing.total + (p.maleCount || 0) + (p.femaleCount || 0),
      count: existing.count + 1,
      city: demand?.city || existing.city || ''
    });
  });
  
  const organizationData = Array.from(orgMap.entries())
    .map(([name, data]) => ({ 
      name, 
      total: data.total,
      count: data.count,
      city: data.city
    }))
    .sort((a, b) => b.total - a.total);

  // 시/군별 데이터 (전체 31개 시/군)
  const cityMap = new Map<string, { total: number; count: number }>();
  
  // 모든 시/군을 0으로 초기화
  const allCities = [
    '가평군', '고양시', '과천시', '광명시', '광주시', '구리시', '군포시', '김포시',
    '남양주시', '동두천시', '부천시', '성남시', '수원시', '시흥시', '안산시', '안성시',
    '안양시', '양주시', '양평군', '여주시', '연천군', '오산시', '용인시', '의왕시',
    '의정부시', '이천시', '파주시', '평택시', '포천시', '하남시', '화성시'
  ];
  
  allCities.forEach(city => {
    cityMap.set(city, { total: 0, count: 0 });
  });
  
  performances.forEach(p => {
    const demand = demands.find(d => d.organizationName === p.organizationName);
    if (demand && cityMap.has(demand.city)) {
      const existing = cityMap.get(demand.city)!;
      cityMap.set(demand.city, {
        total: existing.total + (p.maleCount || 0) + (p.femaleCount || 0),
        count: existing.count + 1
      });
    }
  });

  const cityData = Array.from(cityMap.entries())
    .map(([name, data]) => ({ 
      name, 
      total: data.total,
      count: data.count
    }))
    .sort((a, b) => b.total - a.total);

  return {
    totalMale,
    totalFemale,
    totalPeople,
    totalPromotions,
    totalOrganizations,
    monthlyData,
    organizationData,
    cityData
  };
};