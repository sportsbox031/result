// 2026년 예산 항목 초기 데이터
import { BudgetItem } from '../types';

// 공통 예산 항목 (남부/북부 공용)
export const BUDGET_2026_COMMON: Omit<BudgetItem, 'id'>[] = [
  { name: '전산기능강화', amount: 25000000, order: 0, year: 2026 },
  { name: '주최자배상책임공제', amount: 8000000, order: 1, year: 2026 },
  { name: '스포츠이벤트', amount: 140000000, order: 2, year: 2026 },
  { name: '회계법률비', amount: 1500000, order: 3, year: 2026 },
];

// 남부 예산 항목
export const BUDGET_2026_SOUTH: Omit<BudgetItem, 'id'>[] = [
  { name: '용품구입비', amount: 15000000, order: 10, region: '남부', year: 2026 },
  { name: '근무자피복비(동/하계)', amount: 1600000, order: 11, region: '남부', year: 2026 },
  { name: '기타운영비', amount: 1750000, order: 12, region: '남부', year: 2026 },
  { name: '사업홍보비', amount: 10000000, order: 13, region: '남부', year: 2026 },
  { name: '차량임차비(보험료포함)', amount: 18000000, order: 14, region: '남부', year: 2026 },
  { name: '차량반납현복비용', amount: 2000000, order: 15, region: '남부', year: 2026 },
  { name: '차량관리비(유류비,정비,세차등)', amount: 12000000, order: 16, region: '남부', year: 2026 },
  { name: '차량개조비(랩핑,앵글제작등)', amount: 4000000, order: 17, region: '남부', year: 2026 },
  { name: '간담회및회의운영', amount: 2000000, order: 18, region: '남부', year: 2026 },
];

// 북부 예산 항목
export const BUDGET_2026_NORTH: Omit<BudgetItem, 'id'>[] = [
  { name: '용품구입비_북부', amount: 15000000, order: 20, region: '북부', year: 2026 },
  { name: '근무자피복비(동/하계)_북부', amount: 1600000, order: 21, region: '북부', year: 2026 },
  { name: '기타운영비_북부', amount: 1750000, order: 22, region: '북부', year: 2026 },
  { name: '사업홍보비_북부', amount: 10000000, order: 23, region: '북부', year: 2026 },
  { name: '차량임차비(보험료포함)_북부', amount: 16800000, order: 24, region: '북부', year: 2026 },
  { name: '차량관리비(유류비,정비,세차등)_북부', amount: 12000000, order: 25, region: '북부', year: 2026 },
  { name: '간담회및회의운영_북부', amount: 2000000, order: 26, region: '북부', year: 2026 },
];

// 2026년 전체 예산 항목
export const BUDGET_2026_ALL: Omit<BudgetItem, 'id'>[] = [
  ...BUDGET_2026_COMMON,
  ...BUDGET_2026_SOUTH,
  ...BUDGET_2026_NORTH,
];
