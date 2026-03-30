import { describe, expect, it } from 'vitest';
import type { Demand } from '../types';
import { countDemandsForYear } from './statistics';

const demands: Demand[] = [
  {
    id: '1',
    year: 2025,
    city: '수원시',
    organizationName: 'A기관',
    contactPerson: '홍길동',
    phoneNumber: '010-1111-1111',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },
  {
    id: '2',
    year: 2026,
    city: '성남시',
    organizationName: 'B기관',
    contactPerson: '김철수',
    phoneNumber: '010-2222-2222',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01')
  },
  {
    id: '3',
    year: 2026,
    city: '용인시',
    organizationName: 'C기관',
    contactPerson: '이영희',
    phoneNumber: '010-3333-3333',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01')
  }
];

describe('countDemandsForYear', () => {
  it('counts only demands from the selected year', () => {
    expect(countDemandsForYear(demands, 2026)).toBe(2);
  });
});
