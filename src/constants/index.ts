// 앱 전역에서 공유하는 상수 모음

// 경기도 31개 시/군
export const CITIES = [
  '가평군', '고양시', '과천시', '광명시', '광주시', '구리시', '군포시', '김포시',
  '남양주시', '동두천시', '부천시', '성남시', '수원시', '시흥시', '안산시', '안성시',
  '안양시', '양주시', '양평군', '여주시', '연천군', '오산시', '용인시', '의왕시',
  '의정부시', '이천시', '파주시', '평택시', '포천시', '하남시', '화성시'
] as const;

// 프로그램 유형
export const PROGRAMS = ['스포츠교실', '스포츠체험존', '스포츠이벤트'] as const;
export type Program = (typeof PROGRAMS)[number];

// 결제 방법
export const PAYMENT_METHODS = ['계좌입금', '카드결제'] as const;

// 지역 구분
export const REGIONS = ['남부', '북부'] as const;
export type Region = (typeof REGIONS)[number];
