import type { Performance } from '../types';

const toDateInputValue = (date: Date): string => {
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

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
