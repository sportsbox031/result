import { Demand, Performance } from '../types';

const DEMANDS_KEY = 'demands';
const PERFORMANCES_KEY = 'performances';

// 관리자 계정 저장 키
const ADMIN_USER_KEY = 'admin_user';

// sha256 해시 함수 (브라우저 내장 SubtleCrypto 사용)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// 관리자 계정 저장
export function saveAdminUser(user: { username: string; passwordHash: string }) {
  localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
}

// 관리자 계정 불러오기
export function loadAdminUser(): { username: string; passwordHash: string } | null {
  const data = localStorage.getItem(ADMIN_USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export const storage = {
  // 수요처 관련 작업
  getDemands(): Demand[] {
    const data = localStorage.getItem(DEMANDS_KEY);
    return data ? JSON.parse(data).map((d: any) => ({
      ...d,
      createdAt: new Date(d.createdAt),
      updatedAt: new Date(d.updatedAt)
    })) : [];
  },

  saveDemands(demands: Demand[]): void {
    localStorage.setItem(DEMANDS_KEY, JSON.stringify(demands));
  },

  addDemand(demand: Omit<Demand, 'id' | 'createdAt' | 'updatedAt'>): Demand {
    const demands = this.getDemands();
    const newDemand: Demand = {
      ...demand,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    demands.push(newDemand);
    this.saveDemands(demands);
    return newDemand;
  },

  updateDemand(id: string, updates: Partial<Demand>): void {
    const demands = this.getDemands();
    const index = demands.findIndex(d => d.id === id);
    if (index !== -1) {
      demands[index] = { ...demands[index], ...updates, updatedAt: new Date() };
      this.saveDemands(demands);
    }
  },

  deleteDemand(id: string): void {
    const demands = this.getDemands();
    const filtered = demands.filter(d => d.id !== id);
    this.saveDemands(filtered);
  },

  // 실적 관련 작업
  getPerformances(): Performance[] {
    const data = localStorage.getItem(PERFORMANCES_KEY);
    return data ? JSON.parse(data).map((p: any) => ({
      ...p,
      date: new Date(p.date),
      createdAt: new Date(p.createdAt),
      updatedAt: new Date(p.updatedAt)
    })) : [];
  },

  savePerformances(performances: Performance[]): void {
    localStorage.setItem(PERFORMANCES_KEY, JSON.stringify(performances));
  },

  addPerformance(performance: Omit<Performance, 'id' | 'createdAt' | 'updatedAt'>): Performance {
    const performances = this.getPerformances();
    const newPerformance: Performance = {
      ...performance,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    performances.push(newPerformance);
    this.savePerformances(performances);
    return newPerformance;
  },

  updatePerformance(id: string, updates: Partial<Performance>): void {
    const performances = this.getPerformances();
    const index = performances.findIndex(p => p.id === id);
    if (index !== -1) {
      performances[index] = { ...performances[index], ...updates, updatedAt: new Date() };
      this.savePerformances(performances);
    }
  },

  deletePerformance(id: string): void {
    const performances = this.getPerformances();
    const filtered = performances.filter(p => p.id !== id);
    this.savePerformances(filtered);
  }
};