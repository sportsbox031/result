import type { Performance } from '../types';

// UTC 기준(toISOString)으로 변환하면 로컬에서 생성된 날짜가 하루 어긋날 수 있어 로컬 기준으로 변환한다.
export const toDateInputValue = (date: Date): string => {
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 중복 판단 기준: 같은 날짜 + 같은 단체명
export const getPerformanceDuplicateKey = (date: Date, organizationName: string): string =>
  `${toDateInputValue(date)}|${organizationName.trim()}`;

export const hasDuplicatePerformance = (
  performances: Performance[],
  date: string,
  organizationName: string
): boolean => {
  const normalizedOrganizationName = organizationName.trim();

  if (!date || !normalizedOrganizationName) return false;

  return performances.some(
    performance =>
      toDateInputValue(performance.date) === date &&
      performance.organizationName.trim() === normalizedOrganizationName
  );
};
