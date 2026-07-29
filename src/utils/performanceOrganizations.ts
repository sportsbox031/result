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

// 실적의 단체명 + 연도가 그 해 등록된 수요처와 정확히 일치하는지 찾는다.
// 수기 입력에서 단체명 선택 시 쓰는 것과 동일한 매칭 규칙 (단체명 + 연도 일치).
export const findDemandForPerformance = (
  demands: Demand[],
  organizationName: string,
  year: number
): Demand | undefined =>
  demands.find((demand) => demand.organizationName === organizationName && demand.year === year);

export type OrganizationPhoneLookup = (organizationName: string, year?: number) => string;

// 단체명(+연도)으로 수요처 연락처를 찾는 조회 함수를 만든다.
// 같은 연도에 등록된 수요처가 있으면 그 연락처를, 없으면 가장 최근에 등록된 연락처를 사용한다.
export const buildOrganizationPhoneLookup = (demands: Demand[]): OrganizationPhoneLookup => {
  const phoneByOrgAndYear = new Map<string, string>();
  const latestPhoneByOrg = new Map<string, { phoneNumber: string; updatedAt: Date }>();

  demands.forEach((demand) => {
    phoneByOrgAndYear.set(`${demand.organizationName}__${demand.year}`, demand.phoneNumber);

    const latest = latestPhoneByOrg.get(demand.organizationName);
    if (!latest || demand.updatedAt > latest.updatedAt) {
      latestPhoneByOrg.set(demand.organizationName, {
        phoneNumber: demand.phoneNumber,
        updatedAt: demand.updatedAt
      });
    }
  });

  return (organizationName, year) => {
    if (year !== undefined) {
      const exactMatch = phoneByOrgAndYear.get(`${organizationName}__${year}`);
      if (exactMatch) return exactMatch;
    }
    return latestPhoneByOrg.get(organizationName)?.phoneNumber || '';
  };
};
