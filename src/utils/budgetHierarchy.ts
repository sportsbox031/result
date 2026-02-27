import { BudgetItem } from '../types';

export interface BudgetHierarchyInfo {
  bimo: string;
  semok: string;
  detailName: string;
}

export interface BudgetSemokGroup {
  semok: string;
  items: BudgetItem[];
}

export interface BudgetBimoGroup {
  bimo: string;
  semokGroups: BudgetSemokGroup[];
}

const BIMO_ORDER = [
  '일반운영비',
  '업무추진비',
  '일반운영비(북부)',
  '업무추진비(북부)',
  '미분류',
] as const;
const SEMOK_ORDER = ['용역비', '공공운영비', '행사운영비', '사무관리비', '임차료', '차량선박비', '시책업무추진비', '미분류'] as const;

const NORTH_REGION_SEMOK = new Set(['사무관리비', '임차료', '차량선박비', '시책업무추진비']);
const NORTH_2026_ORDER_START = 20;
const NORTH_2026_ORDER_END = 29;

const removeRegionSuffix = (name: string): string =>
  name
    .replace(/_북부$/, '')
    .replace(/\(북부\)$/, '')
    .trim();
const normalizeText = (value: string): string => value.replace(/\s+/g, '').trim();
const includesAny = (source: string, keywords: string[]): boolean => keywords.some((keyword) => source.includes(keyword));
const isNorthOrderRange = (year?: number, order?: number): boolean =>
  year === 2026 && typeof order === 'number' && order >= NORTH_2026_ORDER_START && order <= NORTH_2026_ORDER_END;
const isNorthBudget = (itemOrName: Pick<BudgetItem, 'name' | 'region' | 'year' | 'order'> | string): boolean => {
  if (typeof itemOrName !== 'string') {
    if (itemOrName.region === '북부') return true;
    if (/(?:_북부|\(북부\)|북부)/.test(itemOrName.name)) return true;
    return isNorthOrderRange(itemOrName.year, itemOrName.order);
  }

  return /(?:_북부|\(북부\)|북부)/.test(itemOrName);
};
const appendNorthBimo = (bimo: string, semok: string, isNorth: boolean): string => {
  if (!isNorth) return bimo;
  if (!NORTH_REGION_SEMOK.has(semok)) return bimo;
  if (bimo !== '일반운영비' && bimo !== '업무추진비') return bimo;
  return `${bimo}(북부)`;
};

export const getBudgetHierarchyInfo = (itemOrName: Pick<BudgetItem, 'name' | 'region' | 'year' | 'order'> | string): BudgetHierarchyInfo => {
  const originalName = typeof itemOrName === 'string' ? itemOrName : itemOrName.name;
  const detailName = removeRegionSuffix(originalName);
  const normalizedName = normalizeText(detailName);
  const isNorth = isNorthBudget(itemOrName);

  if (includesAny(normalizedName, ['간담회', '회의운영', '업무추진'])) {
    const semok = '시책업무추진비';
    return { bimo: appendNorthBimo('업무추진비', semok, isNorth), semok, detailName };
  }

  if (includesAny(normalizedName, ['전산기능'])) {
    const semok = '용역비';
    return { bimo: appendNorthBimo('일반운영비', semok, isNorth), semok, detailName };
  }

  if (includesAny(normalizedName, ['주최자배상책임공제', '배상책임공제', '공제'])) {
    const semok = '공공운영비';
    return { bimo: appendNorthBimo('일반운영비', semok, isNorth), semok, detailName };
  }

  if (includesAny(normalizedName, ['스포츠이벤트', '행사'])) {
    const semok = '행사운영비';
    return { bimo: appendNorthBimo('일반운영비', semok, isNorth), semok, detailName };
  }

  if (includesAny(normalizedName, ['차량임차', '원복', '반납'])) {
    const semok = '임차료';
    return { bimo: appendNorthBimo('일반운영비', semok, isNorth), semok, detailName };
  }

  if (includesAny(normalizedName, ['차량관리', '차량개조', '유류', '세차'])) {
    const semok = '차량선박비';
    return { bimo: appendNorthBimo('일반운영비', semok, isNorth), semok, detailName };
  }

  if (includesAny(normalizedName, ['회계', '용품구입', '피복', '기타운영', '사업홍보'])) {
    const semok = '사무관리비';
    return { bimo: appendNorthBimo('일반운영비', semok, isNorth), semok, detailName };
  }

  if (includesAny(normalizedName, ['차량'])) {
    const semok = '차량선박비';
    return { bimo: appendNorthBimo('일반운영비', semok, isNorth), semok, detailName };
  }

  return { bimo: '미분류', semok: '미분류', detailName };
};

const getOrderIndex = (orderList: readonly string[], value: string): number => {
  const index = orderList.indexOf(value);
  return index === -1 ? orderList.length : index;
};

export const sortBimoNames = (names: string[]): string[] =>
  [...names].sort((a, b) => {
    const orderDiff = getOrderIndex(BIMO_ORDER, a) - getOrderIndex(BIMO_ORDER, b);
    if (orderDiff !== 0) return orderDiff;
    return a.localeCompare(b, 'ko');
  });

export const sortSemokNames = (names: string[]): string[] =>
  [...names].sort((a, b) => {
    const orderDiff = getOrderIndex(SEMOK_ORDER, a) - getOrderIndex(SEMOK_ORDER, b);
    if (orderDiff !== 0) return orderDiff;
    return a.localeCompare(b, 'ko');
  });

export const sortBudgetItemsByOrder = (items: BudgetItem[]): BudgetItem[] =>
  [...items].sort((a, b) => {
    const orderDiff = (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER);
    if (orderDiff !== 0) return orderDiff;
    return a.name.localeCompare(b.name, 'ko');
  });

export const buildBudgetHierarchy = (items: BudgetItem[]): BudgetBimoGroup[] => {
  const grouped = new Map<string, Map<string, BudgetItem[]>>();

  sortBudgetItemsByOrder(items).forEach((item) => {
    const { bimo, semok } = getBudgetHierarchyInfo(item);
    const semokMap = grouped.get(bimo) ?? new Map<string, BudgetItem[]>();
    const currentItems = semokMap.get(semok) ?? [];
    semokMap.set(semok, [...currentItems, item]);
    grouped.set(bimo, semokMap);
  });

  return sortBimoNames([...grouped.keys()]).map((bimo) => {
    const semokMap = grouped.get(bimo) ?? new Map<string, BudgetItem[]>();
    const semokGroups = sortSemokNames([...semokMap.keys()]).map((semok) => ({
      semok,
      items: semokMap.get(semok) ?? [],
    }));

    return { bimo, semokGroups };
  });
};
