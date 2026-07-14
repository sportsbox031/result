import { describe, expect, it } from 'vitest';
import type { Performance } from '../types';
import { hasDuplicatePerformance } from './performanceDuplicates';

const performance: Performance = {
  id: 'performance-1',
  date: new Date('2026-07-14'),
  organizationName: '테스트 단체',
  city: '수원시',
  program: '스포츠교실',
  maleCount: 1,
  femaleCount: 1,
  promotionCount: 0,
  createdAt: new Date('2026-07-14'),
  updatedAt: new Date('2026-07-14')
};

describe('hasDuplicatePerformance', () => {
  it('같은 날짜와 같은 단체의 실적을 중복으로 판단한다', () => {
    expect(hasDuplicatePerformance([performance], '2026-07-14', '테스트 단체')).toBe(true);
  });

  it('날짜나 단체가 다르면 중복으로 판단하지 않는다', () => {
    expect(hasDuplicatePerformance([performance], '2026-07-15', '테스트 단체')).toBe(false);
    expect(hasDuplicatePerformance([performance], '2026-07-14', '다른 단체')).toBe(false);
  });

  it('단체명 앞뒤 공백은 무시한다', () => {
    expect(hasDuplicatePerformance([performance], '2026-07-14', '  테스트 단체  ')).toBe(true);
  });
});
