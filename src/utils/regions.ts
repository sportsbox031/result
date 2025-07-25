// 시/군별 남부/북부 구분 로직
export const getCityRegion = (city: string): '남부' | '북부' => {
  // 남부 지역 시/군
  const southernCities = [
    '수원시', '용인시', '화성시', '오산시', '평택시', '안성시', 
    '이천시', '여주시', '광주시', '하남시', '성남시', '과천시', 
    '의왕시', '군포시', '안양시'
  ];
  
  // 북부 지역 시/군
  const northernCities = [
    '고양시', '파주시', '김포시', '부천시', '시흥시', '안산시', 
    '광명시', '의정부시', '양주시', '동두천시', '연천군', 
    '포천시', '가평군', '남양주시', '구리시'
  ];

  if (southernCities.includes(city)) return '남부';
  if (northernCities.includes(city)) return '북부';
  
  // 기본값은 남부로 설정 (새로운 시/군이 추가될 경우를 대비)
  return '남부';
};

// 지역별 시/군 목록 반환
export const getCitiesByRegion = (region: '남부' | '북부'): string[] => {
  const southernCities = [
    '수원시', '용인시', '화성시', '오산시', '평택시', '안성시', 
    '이천시', '여주시', '광주시', '하남시', '성남시', '과천시', 
    '의왕시', '군포시', '안양시'
  ];
  
  const northernCities = [
    '고양시', '파주시', '김포시', '부천시', '시흥시', '안산시', 
    '광명시', '의정부시', '양주시', '동두천시', '연천군', 
    '포천시', '가평군', '남양주시', '구리시'
  ];

  return region === '남부' ? southernCities : northernCities;
};

// 모든 지역 목록 반환
export const getAllRegions = (): Array<{ value: '전체' | '남부' | '북부', label: string }> => [
  { value: '전체', label: '전체' },
  { value: '남부', label: '남부' },
  { value: '북부', label: '북부' }
];