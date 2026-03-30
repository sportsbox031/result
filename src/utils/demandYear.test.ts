import { describe, expect, it } from 'vitest';
import { getDefaultDemandYear, normalizeDemandYear } from './demandYear';

describe('demandYear utilities', () => {
  it('returns the current calendar year as the default demand year', () => {
    expect(getDefaultDemandYear()).toBe(new Date().getFullYear());
  });

  it('keeps an explicit year from stored demand data', () => {
    expect(normalizeDemandYear({ year: 2025, createdAt: new Date('2024-02-01') })).toBe(2025);
  });

  it('falls back to the createdAt year for legacy demand data', () => {
    expect(normalizeDemandYear({ createdAt: new Date('2024-02-01') })).toBe(2024);
  });

  it('uses the current year when legacy demand data has no createdAt', () => {
    expect(normalizeDemandYear({})).toBe(new Date().getFullYear());
  });
});
