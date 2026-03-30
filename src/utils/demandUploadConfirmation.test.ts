import { describe, expect, it } from 'vitest';
import { buildDemandUploadConfirmation } from './demandUploadConfirmation';

describe('buildDemandUploadConfirmation', () => {
  it('includes the selected year and file name in the confirmation copy', () => {
    expect(buildDemandUploadConfirmation(2026, 'demands.csv')).toContain('2026년');
    expect(buildDemandUploadConfirmation(2026, 'demands.csv')).toContain('demands.csv');
  });
});
