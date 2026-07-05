import React, { useState, useMemo } from 'react';
import {
  Users, BarChart3, Calendar, Building2, PieChart, Activity, RefreshCw, MapPin,
  Wallet, TrendingDown, Percent, GripVertical, Trash2, ChevronDown, ChevronRight,
  Megaphone, Pencil
} from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useFirebaseData } from '../hooks/useFirebaseData';
import { useToast } from '../hooks/useToast';
import { calculateStatistics } from '../utils/statistics';
import { BudgetItem } from '../types';
import { firebaseStorage } from '../utils/firebaseStorage';
import { AVAILABLE_YEARS, CURRENT_YEAR, getPerformanceYear, getBudgetUsageYear } from '../utils/yearUtils';
import { getCityRegion } from '../utils/regions';
import { buildBudgetHierarchy, getBudgetHierarchyInfo, sortBudgetItemsByOrder } from '../utils/budgetHierarchy';
import { PROGRAMS } from '../constants';
import StatCard from './common/StatCard';
import SegmentedFilter from './common/SegmentedFilter';
import EmptyState from './common/EmptyState';
import RegionBadge from './common/RegionBadge';
import SearchInput from './common/SearchInput';
import Modal from './common/Modal';
import MonthlyTrendChart from './MonthlyTrendChart';

type DashboardTab = 'overview' | 'city' | 'organization' | 'budget';

const TABS: Array<{ id: DashboardTab; name: string; icon: React.ElementType }> = [
  { id: 'overview', name: '현황 개요', icon: Activity },
  { id: 'city', name: '시군별 현황', icon: BarChart3 },
  { id: 'organization', name: '수요처별 현황', icon: Building2 },
  { id: 'budget', name: '예산 현황', icon: PieChart },
];

const Dashboard: React.FC = () => {
  const { demands, performances, budgetItems, budgetUsages } = useFirebaseData();
  const { addToast } = useToast();

  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [editingBudgetName, setEditingBudgetName] = useState<string>('');
  const [editingBudgetAmount, setEditingBudgetAmount] = useState<number>(0);

  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_YEAR);
  const [isInitializing2026, setIsInitializing2026] = useState(false);

  const [regionFilter, setRegionFilter] = useState<'전체' | '경기남부' | '경기북부'>('전체');
  const [budgetRegionFilter, setBudgetRegionFilter] = useState<'전체' | '남부' | '북부'>('전체');

  const [organizationSearch, setOrganizationSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showProgramPopup, setShowProgramPopup] = useState(false);
  const [showBudgetUsagePopup, setShowBudgetUsagePopup] = useState(false);
  const [selectedBudgetItem, setSelectedBudgetItem] = useState<BudgetItem | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [collapsedBimo, setCollapsedBimo] = useState<Record<string, boolean>>({});
  const [collapsedSemok, setCollapsedSemok] = useState<Record<string, boolean>>({});

  const [dateFilter, setDateFilter] = useState<{ startDate?: Date; endDate?: Date }>({});

  // 연도별 필터가 적용된 실적 데이터
  const yearFilteredPerformances = useMemo(() => {
    return performances.filter((p) => {
      if (!p.date) return false;
      return getPerformanceYear(new Date(p.date)) === selectedYear;
    });
  }, [performances, selectedYear]);

  const yearFilteredDemands = useMemo(() => {
    return demands.filter((demand) => demand.year === selectedYear);
  }, [demands, selectedYear]);

  // 지역 필터 적용
  const regionFilteredPerformances = useMemo(() => {
    if (regionFilter === '전체') return yearFilteredPerformances;
    const targetRegion = regionFilter === '경기남부' ? '남부' : '북부';
    return yearFilteredPerformances.filter((p) => getCityRegion(p.city) === targetRegion);
  }, [yearFilteredPerformances, regionFilter]);

  // 기간 필터가 적용된 실적 데이터
  const filteredPerformances = useMemo(() => {
    return regionFilteredPerformances.filter((p) => {
      const perfDate = new Date(p.date);
      if (dateFilter.startDate && perfDate < dateFilter.startDate) return false;
      if (dateFilter.endDate && perfDate > dateFilter.endDate) return false;
      return true;
    });
  }, [regionFilteredPerformances, dateFilter]);

  // 통계 (useMemo로 계산 — 이전에는 useEffect + setState로 불필요한 리렌더 발생)
  const stats = useMemo(() => {
    const calculated = calculateStatistics(filteredPerformances, yearFilteredDemands);
    return { ...calculated, totalOrganizations: yearFilteredDemands.length };
  }, [filteredPerformances, yearFilteredDemands]);

  // 프로그램별 통계
  const programStats = useMemo(() => {
    const byProgram: { [key: string]: { count: number; people: number } } = {};
    filteredPerformances.forEach(p => {
      const prog = p.program || '스포츠교실';
      if (!byProgram[prog]) byProgram[prog] = { count: 0, people: 0 };
      byProgram[prog].count += 1;
      byProgram[prog].people += (p.maleCount || 0) + (p.femaleCount || 0);
    });
    return byProgram;
  }, [filteredPerformances]);

  // 연도별 예산 항목 필터링
  const yearFilteredBudgetItems = useMemo(() => {
    return budgetItems.filter(item => (item.year ?? 2025) === selectedYear);
  }, [budgetItems, selectedYear]);

  const regionFilteredBudgetItems = useMemo(() => {
    if (budgetRegionFilter === '전체') return yearFilteredBudgetItems;
    return yearFilteredBudgetItems.filter(item => item.region === budgetRegionFilter);
  }, [yearFilteredBudgetItems, budgetRegionFilter]);

  // 연도별 예산 사용 내역 필터링
  const yearFilteredBudgetUsages = useMemo(() => {
    return budgetUsages.filter(usage => {
      if (!usage.date) return false;
      return getBudgetUsageYear(usage.date) === selectedYear;
    });
  }, [budgetUsages, selectedYear]);

  // 기간 필터가 적용된 예산 사용 내역
  const filteredBudgetUsages = useMemo(() => {
    return yearFilteredBudgetUsages.filter(u => {
      if (dateFilter.startDate && new Date(u.date) < dateFilter.startDate) return false;
      if (dateFilter.endDate && new Date(u.date) > dateFilter.endDate) return false;
      return true;
    });
  }, [yearFilteredBudgetUsages, dateFilter]);

  const budgetUsedMap = useMemo(() => {
    const usageMap = new Map<string, number>();
    filteredBudgetUsages.forEach((usage) => {
      usageMap.set(usage.budgetItemId, (usageMap.get(usage.budgetItemId) ?? 0) + (Number(usage.amount) || 0));
    });
    return usageMap;
  }, [filteredBudgetUsages]);

  const groupedBudgetItems = useMemo(() => {
    const hierarchy = buildBudgetHierarchy(regionFilteredBudgetItems);
    return hierarchy.map((bimoGroup) => {
      const semokGroups = bimoGroup.semokGroups.map((semokGroup) => {
        const totalBudgetAmount = semokGroup.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
        const totalUsedAmount = semokGroup.items.reduce((sum, item) => sum + (budgetUsedMap.get(item.id) ?? 0), 0);
        const totalRemainAmount = totalBudgetAmount - totalUsedAmount;
        const usageRate = totalBudgetAmount > 0 ? Math.round((totalUsedAmount / totalBudgetAmount) * 1000) / 10 : 0;
        return {
          ...semokGroup,
          key: `${bimoGroup.bimo}::${semokGroup.semok}`,
          totalBudgetAmount,
          totalUsedAmount,
          totalRemainAmount,
          usageRate,
        };
      });

      const totalBudgetAmount = semokGroups.reduce((sum, semokGroup) => sum + semokGroup.totalBudgetAmount, 0);
      const totalUsedAmount = semokGroups.reduce((sum, semokGroup) => sum + semokGroup.totalUsedAmount, 0);
      const totalRemainAmount = totalBudgetAmount - totalUsedAmount;
      const usageRate = totalBudgetAmount > 0 ? Math.round((totalUsedAmount / totalBudgetAmount) * 1000) / 10 : 0;

      return {
        ...bimoGroup,
        semokGroups,
        totalBudgetAmount,
        totalUsedAmount,
        totalRemainAmount,
        usageRate,
      };
    });
  }, [regionFilteredBudgetItems, budgetUsedMap]);

  const visibleBudgetItemIds = useMemo(() => {
    const ids: string[] = [];
    groupedBudgetItems.forEach((bimoGroup) => {
      if (collapsedBimo[bimoGroup.bimo] ?? true) return;
      bimoGroup.semokGroups.forEach((semokGroup) => {
        if (collapsedSemok[semokGroup.key] ?? true) return;
        semokGroup.items.forEach((item) => ids.push(item.id));
      });
    });
    return ids;
  }, [groupedBudgetItems, collapsedBimo, collapsedSemok]);

  // 전체 예산/사용/잔액/집행율
  const totalBudget = regionFilteredBudgetItems.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  const totalUsed = filteredBudgetUsages
    .filter(u => regionFilteredBudgetItems.some(b => b.id === u.budgetItemId))
    .reduce((sum, u) => sum + (Number(u.amount) || 0), 0);
  const totalRemain = totalBudget - totalUsed;
  const totalRate = totalBudget > 0 ? Math.round((totalUsed / totalBudget) * 1000) / 10 : 0;

  // 총 참여 인원 / 홍보 횟수
  const totalPeople = filteredPerformances.reduce((sum, p) => sum + (p.maleCount || 0) + (p.femaleCount || 0), 0);
  const totalPromotions = filteredPerformances.reduce((sum, p) => sum + (p.promotionCount || 0), 0);

  // 시군별 데이터 (지역 필터 적용)
  const filteredCityData = useMemo(() => {
    return stats.cityData.filter(item => {
      if (regionFilter === '전체') return true;
      const cityRegion = getCityRegion(item.name);
      return regionFilter === '경기남부' ? cityRegion === '남부' : cityRegion === '북부';
    });
  }, [stats.cityData, regionFilter]);

  // 수요처별 데이터 (검색 + 지역 필터 적용)
  const filteredOrganizationData = useMemo(() => {
    let data = stats.organizationData;

    if (regionFilter !== '전체') {
      const targetRegion = regionFilter === '경기남부' ? '남부' : '북부';
      data = data.filter(org => getCityRegion(org.city) === targetRegion);
    }

    if (organizationSearch) {
      const searchLower = organizationSearch.toLowerCase();
      data = data.filter(org =>
        org.name.toLowerCase().includes(searchLower) ||
        org.city.toLowerCase().includes(searchLower)
      );
    }

    return data;
  }, [stats.organizationData, regionFilter, organizationSearch]);

  const selectedCityOrganizations = stats.organizationData.filter(org => org.city === selectedCity);

  const has2026Budgets = budgetItems.some(b => (b.year ?? 2025) === 2026);

  // ----- 핸들러 -----

  const handleInitialize2026Budget = async () => {
    if (isInitializing2026) return;
    if (!window.confirm('2026년 예산을 초기화하시겠습니까? 새로운 예산 항목이 추가됩니다.')) return;

    setIsInitializing2026(true);
    try {
      await firebaseStorage.initializeBudget2026();
      addToast({ type: 'success', title: '초기화 완료', message: '2026년 예산이 성공적으로 초기화되었습니다' });
    } catch (error) {
      console.error('2026년 예산 초기화 실패:', error);
      addToast({ type: 'error', title: '초기화 실패', message: '2026년 예산 초기화에 실패했습니다' });
    } finally {
      setIsInitializing2026(false);
    }
  };

  const handleEditBudget = (item: BudgetItem) => {
    setEditingBudgetId(item.id);
    setEditingBudgetName(item.name);
    setEditingBudgetAmount(item.amount);
  };

  const handleSaveBudget = async (id: string) => {
    try {
      await firebaseStorage.updateBudget(id, { name: editingBudgetName, amount: editingBudgetAmount });
      setEditingBudgetId(null);
    } catch (error) {
      console.error('예산 항목 수정 실패:', error);
      addToast({ type: 'error', title: '저장 실패', message: '예산 항목 저장 중 오류가 발생했습니다' });
    }
  };

  const handleAddBudget = async () => {
    try {
      await firebaseStorage.addBudget({ name: '', amount: 0, year: selectedYear });
    } catch (error) {
      console.error('예산 항목 추가 실패:', error);
      addToast({ type: 'error', title: '추가 실패', message: '예산 항목 추가 중 오류가 발생했습니다' });
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (!window.confirm('이 예산 항목을 삭제하시겠습니까?')) return;
    try {
      await firebaseStorage.deleteBudget(id);
    } catch (error) {
      console.error('예산 항목 삭제 실패:', error);
      addToast({ type: 'error', title: '삭제 실패', message: '예산 항목 삭제 중 오류가 발생했습니다' });
    }
  };

  const handleBudgetItemClick = (budgetItem: BudgetItem) => {
    setSelectedBudgetItem(budgetItem);
    setShowBudgetUsagePopup(true);
  };

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const sortedYearItems = sortBudgetItemsByOrder(yearFilteredBudgetItems);
    const oldIndex = sortedYearItems.findIndex((b) => b.id === String(active.id));
    const newIndex = sortedYearItems.findIndex((b) => b.id === String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedItems = arrayMove(sortedYearItems, oldIndex, newIndex).map((item, index) => ({
      ...item,
      order: index,
    }));
    await firebaseStorage.updateBudgetOrder(reorderedItems);
  };

  const toggleBimo = (bimo: string) => {
    setCollapsedBimo((prev) => ({ ...prev, [bimo]: !(prev[bimo] ?? true) }));
  };

  const toggleSemok = (semokKey: string) => {
    setCollapsedSemok((prev) => ({ ...prev, [semokKey]: !(prev[semokKey] ?? true) }));
  };

  const toDateInputValue = (date?: Date) => (date ? date.toISOString().split('T')[0] : '');

  return (
    <div className="max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">대시보드</h1>
        <p className="text-gray-500">수요처 및 실적 현황을 한눈에 확인하세요</p>
      </div>

      {/* 연도 + 지역 필터 */}
      <div className="glass-card rounded-2xl p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-gray-600">연도:</span>
            <SegmentedFilter
              options={AVAILABLE_YEARS.map(year => ({ value: year, label: `${year}년` }))}
              value={selectedYear}
              onChange={setSelectedYear}
            />
            {selectedYear === 2026 && !has2026Budgets && (
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors disabled:opacity-50"
                onClick={handleInitialize2026Budget}
                disabled={isInitializing2026}
              >
                <RefreshCw className={`w-4 h-4 ${isInitializing2026 ? 'animate-spin' : ''}`} />
                {isInitializing2026 ? '초기화 중...' : '예산 초기화'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-gray-400" />
            <SegmentedFilter
              options={['전체', '경기남부', '경기북부'] as const}
              value={regionFilter}
              onChange={setRegionFilter}
            />
          </div>
        </div>
      </div>

      {/* 기간 필터 */}
      <div className="glass-panel rounded-2xl p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600">시작일</label>
              <input
                type="date"
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={toDateInputValue(dateFilter.startDate)}
                onChange={e => setDateFilter(f => ({ ...f, startDate: e.target.value ? new Date(e.target.value) : undefined }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600">종료일</label>
              <input
                type="date"
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={toDateInputValue(dateFilter.endDate)}
                onChange={e => setDateFilter(f => ({ ...f, endDate: e.target.value ? new Date(e.target.value) : undefined }))}
              />
            </div>
          </div>
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            onClick={() => setDateFilter({})}
          >
            초기화
          </button>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map(({ id, name, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === id
              ? 'bg-blue-600 text-white shadow-md'
              : 'glass-stat text-gray-600 hover:bg-white/40'
            }`}
          >
            <Icon className="w-4 h-4" />
            {name}
          </button>
        ))}
      </div>

      {/* 탭 컨텐츠 */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 실적 통계 카드 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">실적 현황</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="등록 단체수"
                value={stats.totalOrganizations.toLocaleString()}
                icon={Building2}
                gradient="from-blue-500 to-blue-600"
              />
              <StatCard
                label="총 실적 횟수"
                value={`${filteredPerformances.length.toLocaleString()}회`}
                sub="클릭하여 프로그램별 보기"
                icon={Calendar}
                gradient="from-green-500 to-green-600"
                onClick={() => setShowProgramPopup(true)}
              />
              <StatCard
                label="총 참여 인원"
                value={`${totalPeople.toLocaleString()}명`}
                icon={Users}
                gradient="from-purple-500 to-purple-600"
              />
              <StatCard
                label="총 홍보 횟수"
                value={`${totalPromotions.toLocaleString()}회`}
                icon={Megaphone}
                gradient="from-orange-500 to-orange-600"
              />
            </div>
          </div>

          {/* 월별 추이 차트 */}
          <MonthlyTrendChart performances={filteredPerformances} year={selectedYear} />

          {/* 예산 통계 카드 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">예산 현황</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="총 예산액"
                value={`${totalBudget.toLocaleString()}원`}
                icon={Wallet}
                gradient="from-indigo-500 to-indigo-600"
              />
              <StatCard
                label="집행액"
                value={`${totalUsed.toLocaleString()}원`}
                icon={BarChart3}
                gradient="from-emerald-500 to-emerald-600"
              />
              <StatCard
                label="잔액"
                value={`${totalRemain.toLocaleString()}원`}
                icon={TrendingDown}
                gradient="from-gray-500 to-gray-600"
              />
              <StatCard
                label="집행율"
                value={`${totalRate}%`}
                icon={Percent}
                gradient="from-amber-500 to-amber-600"
                progress={totalRate}
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'city' && (
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">시/군별 참여 현황</h2>
          {filteredCityData.length > 0 ? (
            <div className="space-y-3">
              {filteredCityData.map((item) => {
                const maxTotal = Math.max(...filteredCityData.map(d => d.total), 1);
                return (
                  <div
                    key={item.name}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors cursor-pointer"
                    onClick={() => { setSelectedCity(item.name); setShowPopup(true); }}
                  >
                    <div className="w-20 text-center">
                      <span className="text-sm font-bold text-gray-700 bg-white px-3 py-1.5 rounded-lg shadow-sm">
                        {item.name}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-200 rounded-full h-8 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-8 rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                          style={{ width: `${Math.max((item.total / maxTotal) * 100, 10)}%` }}
                        >
                          <span className="text-xs text-white font-semibold">{item.total.toLocaleString()}명</span>
                        </div>
                      </div>
                    </div>
                    <div className="w-16 text-right">
                      <span className="text-sm font-semibold text-gray-600">{item.count}회</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={BarChart3} title="데이터가 없습니다" />
          )}
        </div>
      )}

      {activeTab === 'organization' && (
        <div className="glass-card rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold text-gray-900">수요처별 참여 현황</h2>
            <SearchInput
              value={organizationSearch}
              onChange={setOrganizationSearch}
              placeholder="수요처명 또는 시군 검색..."
              className="w-full sm:w-72"
            />
          </div>

          {filteredOrganizationData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">순위</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">수요처명</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">시/군</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">횟수</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">참여인원</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredOrganizationData.map((item, index) => (
                    <tr key={item.name} className="hover:bg-white/40 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center justify-center w-7 h-7 text-xs font-bold rounded-full ${index < 3 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCityRegion(item.city) === '남부' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
                          {item.city}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-gray-700">{item.count}회</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-blue-600">{item.total.toLocaleString()}명</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={Building2} title="데이터가 없습니다" />
          )}
        </div>
      )}

      {activeTab === 'budget' && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={visibleBudgetItemIds} strategy={verticalListSortingStrategy}>
            <div className="glass-card rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h2 className="text-xl font-bold text-gray-900">{selectedYear}년 예산 현황</h2>
                <div className="flex items-center gap-3">
                  <SegmentedFilter
                    options={['전체', '남부', '북부'] as const}
                    value={budgetRegionFilter}
                    onChange={setBudgetRegionFilter}
                    size="sm"
                  />
                  <button
                    type="button"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                    onClick={handleAddBudget}
                  >
                    + 항목 추가
                  </button>
                </div>
              </div>

              {groupedBudgetItems.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="px-2 py-3 w-8"></th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">비목 / 세목 / 세세목</th>
                        <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">예산액</th>
                        <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">사용액</th>
                        <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">잔액</th>
                        <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">집행율</th>
                        <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">작업</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {groupedBudgetItems.map((bimoGroup) => {
                        const isBimoCollapsed = collapsedBimo[bimoGroup.bimo] ?? true;

                        return (
                          <React.Fragment key={bimoGroup.bimo}>
                            <tr className="bg-slate-100/90 border-y border-slate-200">
                              <td colSpan={2} className="px-3 py-3">
                                <button
                                  type="button"
                                  className="flex items-center gap-2 text-sm font-semibold text-slate-800 hover:text-blue-700 transition-colors"
                                  onClick={() => toggleBimo(bimoGroup.bimo)}
                                >
                                  {isBimoCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                  <span className="inline-flex items-center rounded-md bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                                    비목
                                  </span>
                                  <span>{bimoGroup.bimo}</span>
                                </button>
                              </td>
                              <td className="px-3 py-3 text-right text-sm font-semibold text-gray-900">{bimoGroup.totalBudgetAmount.toLocaleString()}</td>
                              <td className="px-3 py-3 text-right text-sm font-semibold text-blue-600">{bimoGroup.totalUsedAmount.toLocaleString()}</td>
                              <td className="px-3 py-3 text-right text-sm font-semibold text-gray-700">{bimoGroup.totalRemainAmount.toLocaleString()}</td>
                              <td className="px-3 py-3 text-right text-sm font-semibold text-amber-600">{bimoGroup.usageRate}%</td>
                              <td className="px-3 py-3 text-center text-xs text-gray-500">{bimoGroup.semokGroups.length}개 세목</td>
                            </tr>

                            {!isBimoCollapsed && bimoGroup.semokGroups.map((semokGroup) => {
                              const isSemokCollapsed = collapsedSemok[semokGroup.key] ?? true;

                              return (
                                <React.Fragment key={semokGroup.key}>
                                  <tr className="bg-blue-50/40 border-b border-blue-100/60">
                                    <td className="px-2 py-2"></td>
                                    <td className="px-3 py-2">
                                      <div className="flex items-center gap-2 pl-6">
                                        <span className="h-px w-4 shrink-0 bg-blue-300" aria-hidden="true"></span>
                                        <button
                                          type="button"
                                          className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-blue-700 transition-colors"
                                          onClick={() => toggleSemok(semokGroup.key)}
                                        >
                                          {isSemokCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                          <span className="inline-flex items-center rounded-md bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                                            세목
                                          </span>
                                          <span>{semokGroup.semok}</span>
                                        </button>
                                      </div>
                                    </td>
                                    <td className="px-3 py-2 text-right text-sm font-medium text-gray-900">{semokGroup.totalBudgetAmount.toLocaleString()}</td>
                                    <td className="px-3 py-2 text-right text-sm font-medium text-blue-600">{semokGroup.totalUsedAmount.toLocaleString()}</td>
                                    <td className="px-3 py-2 text-right text-sm text-gray-700">{semokGroup.totalRemainAmount.toLocaleString()}</td>
                                    <td className="px-3 py-2 text-right text-sm text-amber-600">{semokGroup.usageRate}%</td>
                                    <td className="px-3 py-2 text-center text-xs text-gray-500">{semokGroup.items.length}개 세세목</td>
                                  </tr>

                                  {!isSemokCollapsed && semokGroup.items.map((item) => (
                                    <BudgetRow
                                      key={item.id}
                                      item={item}
                                      isEditing={editingBudgetId === item.id}
                                      editingBudgetName={editingBudgetName}
                                      editingBudgetAmount={editingBudgetAmount}
                                      setEditingBudgetName={setEditingBudgetName}
                                      setEditingBudgetAmount={setEditingBudgetAmount}
                                      onCancelEdit={() => setEditingBudgetId(null)}
                                      onEdit={handleEditBudget}
                                      onSave={handleSaveBudget}
                                      onDelete={handleDeleteBudget}
                                      onItemClick={handleBudgetItemClick}
                                      used={budgetUsedMap.get(item.id) ?? 0}
                                    />
                                  ))}
                                </React.Fragment>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-white/40 font-semibold">
                        <td colSpan={2} className="px-3 py-3 text-sm text-gray-700">합계</td>
                        <td className="px-3 py-3 text-right text-sm text-gray-900">{totalBudget.toLocaleString()}</td>
                        <td className="px-3 py-3 text-right text-sm text-blue-600">{totalUsed.toLocaleString()}</td>
                        <td className="px-3 py-3 text-right text-sm text-gray-700">{totalRemain.toLocaleString()}</td>
                        <td className="px-3 py-3 text-right text-sm text-amber-600">{totalRate}%</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <EmptyState icon={PieChart} title="예산 항목이 없습니다" />
              )}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* 시군 상세 팝업 */}
      {showPopup && selectedCity && (
        <Modal onClose={() => setShowPopup(false)} title={`${selectedCity} 수요처별 현황`} size="lg">
          {selectedCityOrganizations.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">수요처명</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">횟수</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">참여인원</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {selectedCityOrganizations.map((org) => (
                  <tr key={org.name} className="hover:bg-white/40">
                    <td className="px-3 py-3 text-sm font-medium text-gray-900">{org.name}</td>
                    <td className="px-3 py-3 text-sm text-right text-gray-600">{org.count}회</td>
                    <td className="px-3 py-3 text-sm text-right font-semibold text-blue-600">{org.total.toLocaleString()}명</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-gray-400 py-8">데이터가 없습니다</p>
          )}
        </Modal>
      )}

      {/* 프로그램별 팝업 */}
      {showProgramPopup && (
        <Modal onClose={() => setShowProgramPopup(false)} title="프로그램별 실적" size="md">
          <div className="space-y-4">
            {PROGRAMS.map(prog => (
              <div key={prog} className="bg-white/40 rounded-xl p-4 flex items-center justify-between">
                <span className="font-semibold text-gray-800">{prog}</span>
                <div className="flex gap-6">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">횟수</p>
                    <p className="text-lg font-bold text-green-600">{programStats[prog]?.count || 0}회</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">인원</p>
                    <p className="text-lg font-bold text-blue-600">{(programStats[prog]?.people || 0).toLocaleString()}명</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* 예산 사용 내역 팝업 */}
      {showBudgetUsagePopup && selectedBudgetItem && (
        <Modal
          onClose={() => setShowBudgetUsagePopup(false)}
          title={`${getBudgetHierarchyInfo(selectedBudgetItem).detailName} 사용 내역`}
          size="xl"
        >
          {(() => {
            const usages = filteredBudgetUsages.filter(u => u.budgetItemId === selectedBudgetItem.id);
            return usages.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">적요</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">채주</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">집행액</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500">집행일자</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500">결제방법</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {usages.map(usage => (
                    <tr key={usage.id} className="hover:bg-white/40">
                      <td className="px-3 py-3 text-sm text-gray-900">{usage.description}</td>
                      <td className="px-3 py-3 text-sm text-gray-600">{usage.vendor}</td>
                      <td className="px-3 py-3 text-sm text-right font-semibold text-blue-600">{Number(usage.amount).toLocaleString()}원</td>
                      <td className="px-3 py-3 text-sm text-center text-gray-600">{usage.date}</td>
                      <td className="px-3 py-3 text-sm text-center text-gray-600">{usage.paymentMethod}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-white/40 font-semibold">
                    <td colSpan={2} className="px-3 py-3 text-sm">총 사용액</td>
                    <td className="px-3 py-3 text-sm text-right text-blue-600">{usages.reduce((sum, u) => sum + Number(u.amount), 0).toLocaleString()}원</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              <p className="text-center text-gray-400 py-8">사용 내역이 없습니다</p>
            );
          })()}
        </Modal>
      )}
    </div>
  );
};

// 예산 세세목 행 (드래그 정렬 지원)
interface BudgetRowProps {
  item: BudgetItem;
  isEditing: boolean;
  editingBudgetName: string;
  editingBudgetAmount: number;
  setEditingBudgetName: (name: string) => void;
  setEditingBudgetAmount: (amount: number) => void;
  onCancelEdit: () => void;
  onEdit: (item: BudgetItem) => void;
  onSave: (id: string) => void;
  onDelete: (id: string) => void;
  onItemClick: (item: BudgetItem) => void;
  used: number;
}

function BudgetRow({
  item, isEditing, editingBudgetName, editingBudgetAmount,
  setEditingBudgetName, setEditingBudgetAmount, onCancelEdit,
  onEdit, onSave, onDelete, onItemClick, used
}: BudgetRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const { detailName } = getBudgetHierarchyInfo(item);
  const remain = item.amount - used;
  const rate = item.amount > 0 ? (used / item.amount) * 100 : 0;

  return (
    <tr ref={setNodeRef} style={style} {...attributes} className="hover:bg-white/40 transition-colors">
      <td className="px-2 py-3 text-center cursor-grab" {...listeners}>
        <div className="flex items-center justify-center">
          <GripVertical className="w-4 h-4 text-gray-300 hover:text-gray-500" />
        </div>
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-2 pl-10">
          <span className="h-px w-5 shrink-0 bg-slate-300" aria-hidden="true"></span>
          <span className="inline-flex items-center rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">
            세세목
          </span>
          {isEditing ? (
            <input
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
              value={editingBudgetName}
              onChange={e => setEditingBudgetName(e.target.value)}
            />
          ) : (
            <div className="flex items-center gap-2">
              <span
                className="text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                onClick={() => onItemClick(item)}
              >
                {detailName || '(이름 없음)'}
              </span>
              <RegionBadge region={item.region} />
            </div>
          )}
        </div>
      </td>
      <td className="px-3 py-3 text-right">
        {isEditing ? (
          <input
            type="number"
            className="w-28 px-2 py-1 border border-gray-300 rounded text-sm text-right focus:ring-2 focus:ring-blue-500"
            value={editingBudgetAmount}
            onChange={e => setEditingBudgetAmount(Number(e.target.value))}
          />
        ) : (
          <span className="text-sm text-gray-900">{item.amount.toLocaleString()}</span>
        )}
      </td>
      <td className="px-3 py-3 text-right text-sm text-blue-600 font-medium">{used.toLocaleString()}</td>
      <td className="px-3 py-3 text-right text-sm text-gray-600">{remain.toLocaleString()}</td>
      <td className="px-3 py-3 text-right">
        <span className={`text-sm font-medium ${rate >= 100 ? 'text-red-600' : rate >= 80 ? 'text-amber-600' : 'text-gray-600'}`}>
          {rate.toFixed(1)}%
        </span>
      </td>
      <td className="px-3 py-3 text-center">
        {isEditing ? (
          <div className="flex items-center justify-center gap-1">
            <button type="button" className="px-2 py-1 text-xs text-green-600 hover:bg-green-50 rounded transition-colors" onClick={() => onSave(item.id)}>저장</button>
            <button type="button" className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded transition-colors" onClick={onCancelEdit}>취소</button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-1">
            <button type="button" className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" onClick={() => onEdit(item)} title="수정">
              <Pencil className="w-4 h-4" />
            </button>
            <button type="button" className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" onClick={() => onDelete(item.id)} title="삭제">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

export default Dashboard;
