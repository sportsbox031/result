// 연도 관련 유틸리티 함수

// 현재 연도
export const CURRENT_YEAR = 2026;

// 사용 가능한 연도 목록
export const AVAILABLE_YEARS = [2025, 2026];

// 과거 연도인지 판별 (현재 연도보다 이전이면 읽기 전용)
export function isReadOnlyYear(year: number): boolean {
  return year < CURRENT_YEAR;
}

// 날짜에서 연도 추출
export function getYearFromDate(date: Date | string): number {
  if (typeof date === 'string') {
    // YYYY-MM-DD 형식
    return parseInt(date.substring(0, 4), 10);
  }
  return date.getFullYear();
}

// Performance 날짜에서 연도 추출
export function getPerformanceYear(date: Date): number {
  return date.getFullYear();
}

// BudgetUsage 날짜에서 연도 추출 (YYYY-MM-DD 문자열)
export function getBudgetUsageYear(dateString: string): number {
  if (!dateString || dateString.length < 4) {
    return CURRENT_YEAR; // 기본값
  }
  return parseInt(dateString.substring(0, 4), 10);
}
