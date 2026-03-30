import type { Demand } from '../types';
import { getYearFromDate } from './yearUtils';

export const getDemandOptionsForPerformanceDate = (
  demands: Demand[],
  date: string
): string[] => {
  const scopedDemands = date
    ? demands.filter((demand) => demand.year === getYearFromDate(date))
    : demands;

  return Array.from(new Set(scopedDemands.map((demand) => demand.organizationName))).sort();
};
