export interface Demand {
  id: string;
  city: string;
  organizationName: string;
  contactPerson: string;
  phoneNumber: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Performance {
  id: string;
  date: Date;
  organizationName: string;
  city: string; // 시/군 정보 추가
  program: '스포츠교실' | '스포츠체험존' | '스포츠이벤트'; // 프로그램 필드 추가
  maleCount: number;
  femaleCount: number;
  promotionCount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

export interface FilterState {
  startDate?: Date;
  endDate?: Date;
  organizationName?: string;
  city?: string;
  program?: string;
}

export interface StatisticsData {
  totalMale: number;
  totalFemale: number;
  totalPeople: number;
  totalPromotions: number;
  totalOrganizations: number;
  monthlyData: Array<{
    month: string;
    male: number;
    female: number;
    total: number;
    promotions: number;
  }>;
  organizationData: Array<{
    name: string;
    total: number;
    count: number;
    city: string;
  }>;
  cityData: Array<{
    name: string;
    total: number;
    count: number;
  }>;
}

// 예산 사용 현황 테이블용 타입
export interface BudgetItem {
  id: string;
  name: string; // 예산명 (수정 가능)
  amount: number; // 예산액 (수정 가능)
  order?: number; // 정렬 순서
  region?: '남부' | '북부'; // 지역 구분
}

// 예산 사용 내역 리스트용 타입
export interface BudgetUsage {
  id: string;
  budgetItemId: string; // 연결된 예산 항목 id
  description: string; // 적요
  vendor: string; // 채주
  amount: number; // 집행액
  date: string; // 회계일자 (YYYY-MM-DD)
  paymentMethod: string; // 결제방법
  note?: string; // 비고
}

// 엑셀 다운로드용 타입
export interface ExcelPerformanceData {
  날짜: string;
  단체명: string;
  시군: string;
  프로그램: string;
  남성: number;
  여성: number;
  총인원: number;
  홍보횟수: number;
  메모: string;
}