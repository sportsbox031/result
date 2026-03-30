import { describe, expect, it } from 'vitest';
import { parseExcelData } from './excel';

describe('parseExcelData', () => {
  it('applies the selected year to every parsed demand row', () => {
    const csv = [
      '시/군,단체명,담당자명,연락처,이메일',
      '수원시,예시 단체,홍길동,010-1234-5678,hong@example.com',
      '성남시,샘플 그룹,김철수,010-9876-5432,kim@example.com'
    ].join('\n');

    const demands = parseExcelData(csv, 2025);

    expect(demands).toHaveLength(2);
    expect(demands.every((demand) => demand.year === 2025)).toBe(true);
  });
});
