import { describe, expect, it } from 'vitest';
import type { Demand } from '../types';
import { getDemandOptionsForPerformanceDate } from './performanceOrganizations';

const demands: Demand[] = [
  {
    id: '1',
    year: 2025,
    city: '수원시',
    organizationName: '작년 단체',
    contactPerson: '홍길동',
    phoneNumber: '010-1111-1111',
    email: 'old@example.com',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },
  {
    id: '2',
    year: 2026,
    city: '성남시',
    organizationName: '올해 단체',
    contactPerson: '김철수',
    phoneNumber: '010-2222-2222',
    email: 'current@example.com',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01')
  },
  {
    id: '3',
    year: 2026,
    city: '용인시',
    organizationName: '중복 단체',
    contactPerson: '이영희',
    phoneNumber: '010-3333-3333',
    email: 'dup@example.com',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01')
  },
  {
    id: '4',
    year: 2026,
    city: '용인시',
    organizationName: '중복 단체',
    contactPerson: '이영희',
    phoneNumber: '010-3333-3333',
    email: 'dup@example.com',
    createdAt: new Date('2026-02-01'),
    updatedAt: new Date('2026-02-01')
  }
];

describe('getDemandOptionsForPerformanceDate', () => {
  it('returns only demands from the same year as the selected performance date', () => {
    const options = getDemandOptionsForPerformanceDate(demands, '2026-03-30');

    expect(options).toEqual(['올해 단체', '중복 단체']);
  });

  it('falls back to all unique demands when the date is empty', () => {
    const options = getDemandOptionsForPerformanceDate(demands, '');

    expect(options).toEqual(['올해 단체', '작년 단체', '중복 단체']);
  });
});
