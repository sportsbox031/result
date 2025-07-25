// 시/군별 남부/북부 구분 로직
export const getCityRegion = (city: string): '남부' | '북부' => {
  // 북부 지역 시/군 (정확한 10개 시/군만)
  const northernCities = [
    '고양시', '구리시', '남양주시', '동두천시', '양주시', 
    '의정부시', '파주시', '포천시', '가평군', '연천군'
  ];

  // 북부에 해당하면 북부, 나머지는 모두 남부
  if (northernCities.includes(city)) return '북부';
  return '남부';
};

// 지역별 시/군 목록 반환
export const getCitiesByRegion = (region: '남부' | '북부'): string[] => {
  const northernCities = [
    '고양시', '구리시', '남양주시', '동두천시', '양주시', 
    '의정부시', '파주시', '포천시', '가평군', '연천군'
  ];
  
  // 경기도 전체 시/군 목록 (북부 제외한 나머지가 남부)
  const allCities = [
    '수원시', '용인시', '화성시', '오산시', '평택시', '안성시', 
    '이천시', '여주시', '광주시', '하남시', '성남시', '과천시', 
    '의왕시', '군포시', '안양시', '안산시', '광명시', '부천시', 
    '시흥시', '김포시', ...northernCities
  ];
  
  const southernCities = allCities.filter(city => !northernCities.includes(city));

  return region === '남부' ? southernCities : northernCities;
};

// 모든 지역 목록 반환
export const getAllRegions = (): Array<{ value: '전체' | '남부' | '북부', label: string }> => [
  { value: '전체', label: '전체' },
  { value: '남부', label: '남부' },
  { value: '북부', label: '북부' }
];