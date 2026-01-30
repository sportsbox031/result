import React, { useState, useEffect, useMemo } from 'react';
import { Users, BarChart3, Calendar, Building2, PieChart, Activity, RefreshCw, Search, MapPin, Wallet, TrendingDown, Percent } from 'lucide-react';
import { GripVertical, Trash2 } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useFirebaseData } from '../hooks/useFirebaseData';
import { calculateStatistics } from '../utils/statistics';
import { StatisticsData, BudgetItem, BudgetUsage } from '../types';
import { firebaseStorage } from '../utils/firebaseStorage';
import { AVAILABLE_YEARS, CURRENT_YEAR, getPerformanceYear, getBudgetUsageYear } from '../utils/yearUtils';
import { getCityRegion } from '../utils/regions';

const Dashboard: React.FC = () => {
  const { demands, performances } = useFirebaseData();
  const [stats, setStats] = useState<StatisticsData>({
    totalMale: 0,
    totalFemale: 0,
    totalPeople: 0,
    totalPromotions: 0,
    totalOrganizations: 0,
    monthlyData: [],
    organizationData: [],
    cityData: []
  });

  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [budgetUsages, setBudgetUsages] = useState<BudgetUsage[]>([]);
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [editingBudgetName, setEditingBudgetName] = useState<string>('');
  const [editingBudgetAmount, setEditingBudgetAmount] = useState<number>(0);

  // 연도 선택 상태 (기본값: 현재 연도)
  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_YEAR);
  const [isInitializing2026, setIsInitializing2026] = useState(false);

  // 지역 필터 상태
  const [regionFilter, setRegionFilter] = useState<'전체' | '경기남부' | '경기북부'>('전체');
  const [budgetRegionFilter, setBudgetRegionFilter] = useState<'전체' | '남부' | '북부'>('전체');

  // 수요처 검색어 상태
  const [organizationSearch, setOrganizationSearch] = useState('');

  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showProgramPopup, setShowProgramPopup] = useState(false);
  const [showBudgetUsagePopup, setShowBudgetUsagePopup] = useState(false);
  const [selectedBudgetItem, setSelectedBudgetItem] = useState<BudgetItem | null>(null);
  const [programStats, setProgramStats] = useState<{ [key: string]: { count: number; people: number } }>({});
  const [activeTab, setActiveTab] = useState<'overview' | 'city' | 'organization' | 'budget'>('overview');

  // 기간 필터 상태
  const [dateFilter, setDateFilter] = useState<{ startDate?: Date; endDate?: Date }>({});

  // 예산 데이터 실시간 구독
  useEffect(() => {
    const unsubBudgets = firebaseStorage.subscribeToBudgets(setBudgetItems);
    const unsubUsages = firebaseStorage.subscribeToBudgetUsages(setBudgetUsages);
    return () => {
      unsubBudgets();
      unsubUsages();
    };
  }, []);

  // 연도별 필터가 적용된 실적 데이터
  const yearFilteredPerformances = useMemo(() => {
    return performances.filter((p: any) => {
      if (!p.date) return false;
      return getPerformanceYear(new Date(p.date)) === selectedYear;
    });
  }, [performances, selectedYear]);

  // 지역 필터 적용
  const regionFilteredPerformances = useMemo(() => {
    if (regionFilter === '전체') return yearFilteredPerformances;
    const targetRegion = regionFilter === '경기남부' ? '남부' : '북부';
    return yearFilteredPerformances.filter((p: any) => getCityRegion(p.city) === targetRegion);
  }, [yearFilteredPerformances, regionFilter]);

  // 기준일자 필터가 적용된 실적 데이터
  const filteredPerformances = useMemo(() => {
    return regionFilteredPerformances.filter((p: any) => {
      const perfDate = new Date(p.date);
      const startDate = dateFilter.startDate instanceof Date ? dateFilter.startDate : (dateFilter.startDate ? new Date(dateFilter.startDate) : undefined);
      const endDate = dateFilter.endDate instanceof Date ? dateFilter.endDate : (dateFilter.endDate ? new Date(dateFilter.endDate) : undefined);
      if (startDate && perfDate < startDate) return false;
      if (endDate && perfDate > endDate) return false;
      return true;
    });
  }, [regionFilteredPerformances, dateFilter]);

  // 연도별 예산 항목 필터링
  const yearFilteredBudgetItems = useMemo(() => {
    return budgetItems.filter(item => (item.year ?? 2025) === selectedYear);
  }, [budgetItems, selectedYear]);

  // 예산 지역 필터 적용
  const regionFilteredBudgetItems = useMemo(() => {
    if (budgetRegionFilter === '전체') return yearFilteredBudgetItems;
    return yearFilteredBudgetItems.filter(item => {
      if (!item.region) return budgetRegionFilter === '전체';
      return item.region === budgetRegionFilter;
    });
  }, [yearFilteredBudgetItems, budgetRegionFilter]);

  // 연도별 예산 사용 내역 필터링
  const yearFilteredBudgetUsages = useMemo(() => {
    return budgetUsages.filter(usage => {
      if (!usage.date) return false;
      return getBudgetUsageYear(usage.date) === selectedYear;
    });
  }, [budgetUsages, selectedYear]);

  // 2026년 예산이 있는지 확인
  const has2026Budgets = budgetItems.some(b => (b.year ?? 2025) === 2026);

  // 2026년 예산 초기화 핸들러
  const handleInitialize2026Budget = async () => {
    if (isInitializing2026) return;
    if (!window.confirm('2026년 예산을 초기화하시겠습니까? 새로운 예산 항목이 추가됩니다.')) return;

    setIsInitializing2026(true);
    try {
      await firebaseStorage.initializeBudget2026();
      alert('2026년 예산이 성공적으로 초기화되었습니다.');
    } catch (error) {
      console.error('2026년 예산 초기화 실패:', error);
      alert('2026년 예산 초기화에 실패했습니다.');
    } finally {
      setIsInitializing2026(false);
    }
  };

  const handleTotalCountClick = () => {
    const statsByProgram: { [key: string]: { count: number; people: number } } = {};
    filteredPerformances.forEach(p => {
      const prog = p.program || '스포츠교실';
      if (!statsByProgram[prog]) statsByProgram[prog] = { count: 0, people: 0 };
      statsByProgram[prog].count += 1;
      statsByProgram[prog].people += (p.maleCount || 0) + (p.femaleCount || 0);
    });
    setProgramStats(statsByProgram);
    setShowProgramPopup(true);
  };

  // 통계 계산
  useEffect(() => {
    const calculatedStats = calculateStatistics(filteredPerformances, demands);
    setStats({
      ...calculatedStats,
      totalOrganizations: demands.length
    });
  }, [demands, filteredPerformances]);

  // 예산명/예산액 인라인 수정 핸들러
  const handleEditBudget = (item: BudgetItem) => {
    setEditingBudgetId(item.id);
    setEditingBudgetName(item.name);
    setEditingBudgetAmount(item.amount);
  };
  const handleSaveBudget = async (id: string) => {
    await firebaseStorage.updateBudget(id, { name: editingBudgetName, amount: editingBudgetAmount });
    setEditingBudgetId(null);
  };
  const handleAddBudget = async () => {
    await firebaseStorage.addBudget({ name: '', amount: 0, year: selectedYear });
  };

  // 드래그 센서
  const sensors = useSensors(useSensor(PointerSensor));

  // 드래그&드롭 핸들러
  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = budgetItems.findIndex(b => b.id === active.id);
      const newIndex = budgetItems.findIndex(b => b.id === over.id);
      const newItems = arrayMove(budgetItems, oldIndex, newIndex).map((b, idx) => ({ ...b, order: idx }));
      await firebaseStorage.updateBudgetOrder(newItems);
    }
  };

  // 필터링된 예산 사용 내역
  const filteredBudgetUsages = useMemo(() => {
    return yearFilteredBudgetUsages.filter(u => {
      if (dateFilter.startDate && new Date(u.date) < dateFilter.startDate) return false;
      if (dateFilter.endDate && new Date(u.date) > dateFilter.endDate) return false;
      return true;
    });
  }, [yearFilteredBudgetUsages, dateFilter]);

  const getBudgetUsageSum = (budgetItemId: string) =>
    filteredBudgetUsages.filter(u => u.budgetItemId === budgetItemId).reduce((sum, u) => sum + (Number(u.amount) || 0), 0);

  // 예산 항목 삭제 핸들러
  const handleDeleteBudget = async (id: string) => {
    if (!window.confirm('이 예산 항목을 삭제하시겠습니까?')) return;
    await firebaseStorage.deleteBudget(id);
  };

  // 예산명 클릭 핸들러
  const handleBudgetItemClick = (budgetItem: BudgetItem) => {
    setSelectedBudgetItem(budgetItem);
    setShowBudgetUsagePopup(true);
  };

  // 전체 예산/사용/잔액/집행율 계산
  const totalBudget = regionFilteredBudgetItems.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  const totalUsed = filteredBudgetUsages
    .filter(u => regionFilteredBudgetItems.some(b => b.id === u.budgetItemId))
    .reduce((sum, u) => sum + (Number(u.amount) || 0), 0);
  const totalRemain = totalBudget - totalUsed;
  const totalRate = totalBudget > 0 ? Math.round((totalUsed / totalBudget) * 1000) / 10 : 0;

  // 시군별 데이터 (지역 필터 적용)
  const filteredCityData = useMemo(() => {
    return stats.cityData.filter(item => {
      if (regionFilter === '전체') return true;
      const cityRegion = getCityRegion(item.name);
      if (regionFilter === '경기남부') return cityRegion === '남부';
      if (regionFilter === '경기북부') return cityRegion === '북부';
      return true;
    });
  }, [stats.cityData, regionFilter]);

  // 수요처별 데이터 (검색 + 지역 필터 적용)
  const filteredOrganizationData = useMemo(() => {
    let data = stats.organizationData;

    // 지역 필터
    if (regionFilter !== '전체') {
      const targetRegion = regionFilter === '경기남부' ? '남부' : '북부';
      data = data.filter(org => getCityRegion(org.city) === targetRegion);
    }

    // 검색 필터
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

  return (
    <div className="max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">대시보드</h1>
        <p className="text-gray-500">수요처 및 실적 현황을 한눈에 확인하세요</p>
      </div>

      {/* 연도 + 지역 필터 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* 연도 선택 */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600">연도:</span>
            <div className="flex gap-2">
              {AVAILABLE_YEARS.map(year => (
                <button
                  key={year}
                  type="button"
                  className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${selectedYear === year
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  onClick={() => setSelectedYear(year)}
                >
                  {year}년
                </button>
              ))}
            </div>
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

          {/* 지역 필터 */}
          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-gray-400" />
            <div className="flex gap-2">
              {(['전체', '경기남부', '경기북부'] as const).map(region => (
                <button
                  key={region}
                  type="button"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${regionFilter === region
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  onClick={() => setRegionFilter(region)}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 기간 필터 */}
      <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600">시작일</label>
              <input
                type="date"
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={dateFilter.startDate ? dateFilter.startDate.toISOString().split('T')[0] : ''}
                onChange={e => setDateFilter(f => ({ ...f, startDate: e.target.value ? new Date(e.target.value) : undefined }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600">종료일</label>
              <input
                type="date"
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={dateFilter.endDate ? dateFilter.endDate.toISOString().split('T')[0] : ''}
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
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'overview'
            ? 'bg-blue-600 text-white shadow-md'
            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          현황 개요
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('city')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'city'
            ? 'bg-blue-600 text-white shadow-md'
            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          시군별 현황
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('organization')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'organization'
            ? 'bg-blue-600 text-white shadow-md'
            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          수요처별 현황
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('budget')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'budget'
            ? 'bg-blue-600 text-white shadow-md'
            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <PieChart className="w-4 h-4" />
          예산 현황
        </button>
      </div>

      {/* 탭 컨텐츠 */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 실적 통계 카드 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">실적 현황</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* 등록 단체수 */}
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 mb-1">등록 단체수</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalOrganizations.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>

              {/* 총 실적 횟수 */}
              <div
                className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={handleTotalCountClick}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 mb-1">총 실적 횟수</p>
                    <p className="text-2xl font-bold text-gray-900">{filteredPerformances.length.toLocaleString()}회</p>
                    <p className="text-xs text-gray-400 mt-1">클릭하여 프로그램별 보기</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>

              {/* 총 참여 인원 */}
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 mb-1">총 참여 인원</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {filteredPerformances.reduce((sum, p) => sum + (p.maleCount || 0) + (p.femaleCount || 0), 0).toLocaleString()}명
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 예산 통계 카드 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">예산 현황</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 mb-1">총 예산액</p>
                    <p className="text-2xl font-bold text-gray-900">{totalBudget.toLocaleString()}원</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600">
                    <Wallet className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 mb-1">집행액</p>
                    <p className="text-2xl font-bold text-gray-900">{totalUsed.toLocaleString()}원</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 mb-1">잔액</p>
                    <p className="text-2xl font-bold text-gray-900">{totalRemain.toLocaleString()}원</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-gray-500 to-gray-600">
                    <TrendingDown className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 mb-1">집행율</p>
                    <p className="text-2xl font-bold text-gray-900">{totalRate}%</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600">
                    <Percent className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'city' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">시/군별 참여 현황</h2>
          {filteredCityData.length > 0 ? (
            <div className="space-y-3">
              {filteredCityData.map((item, index) => {
                const maxTotal = Math.max(...filteredCityData.map(d => d.total), 1);
                return (
                  <div
                    key={index}
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
            <div className="text-center py-16 text-gray-400">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>데이터가 없습니다</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'organization' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold text-gray-900">수요처별 참여 현황</h2>
            {/* 검색창 */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="수요처명 또는 시군 검색..."
                value={organizationSearch}
                onChange={e => setOrganizationSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
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
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
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
            <div className="text-center py-16 text-gray-400">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>데이터가 없습니다</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'budget' && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={regionFilteredBudgetItems.map(b => b.id)} strategy={verticalListSortingStrategy}>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h2 className="text-xl font-bold text-gray-900">{selectedYear}년 예산 현황</h2>
                <div className="flex items-center gap-3">
                  {/* 예산 지역 필터 */}
                  <div className="flex gap-2">
                    {(['전체', '남부', '북부'] as const).map(region => (
                      <button
                        key={region}
                        type="button"
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${budgetRegionFilter === region
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        onClick={() => setBudgetRegionFilter(region)}
                      >
                        {region}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                    onClick={handleAddBudget}
                  >
                    + 항목 추가
                  </button>
                </div>
              </div>

              {regionFilteredBudgetItems.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="px-2 py-3 w-8"></th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">예산명</th>
                        <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">예산액</th>
                        <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">사용액</th>
                        <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">잔액</th>
                        <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">집행율</th>
                        <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">작업</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {regionFilteredBudgetItems.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map(item => (
                        <BudgetRow
                          key={item.id}
                          item={item}
                          editingBudgetId={editingBudgetId}
                          editingBudgetName={editingBudgetName}
                          editingBudgetAmount={editingBudgetAmount}
                          setEditingBudgetName={setEditingBudgetName}
                          setEditingBudgetAmount={setEditingBudgetAmount}
                          setEditingBudgetId={setEditingBudgetId}
                          handleEditBudget={handleEditBudget}
                          handleSaveBudget={handleSaveBudget}
                          handleDeleteBudget={handleDeleteBudget}
                          handleBudgetItemClick={handleBudgetItemClick}
                          used={getBudgetUsageSum(item.id)}
                        />
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 font-semibold">
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
                <div className="text-center py-16 text-gray-400">
                  <PieChart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>예산 항목이 없습니다</p>
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* 시군 상세 팝업 */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowPopup(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">{selectedCity} 수요처별 현황</h3>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
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
                    {selectedCityOrganizations.map((org, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
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
            </div>
          </div>
        </div>
      )}

      {/* 프로그램별 팝업 */}
      {showProgramPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowProgramPopup(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 text-center">프로그램별 실적</h3>
            </div>
            <div className="p-6 space-y-4">
              {['스포츠교실', '스포츠체험존', '스포츠이벤트'].map(prog => (
                <div key={prog} className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
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
          </div>
        </div>
      )}

      {/* 예산 사용 내역 팝업 */}
      {showBudgetUsagePopup && selectedBudgetItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowBudgetUsagePopup(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">{selectedBudgetItem.name} 사용 내역</h3>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
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
                        <tr key={usage.id} className="hover:bg-gray-50">
                          <td className="px-3 py-3 text-sm text-gray-900">{usage.description}</td>
                          <td className="px-3 py-3 text-sm text-gray-600">{usage.vendor}</td>
                          <td className="px-3 py-3 text-sm text-right font-semibold text-blue-600">{Number(usage.amount).toLocaleString()}원</td>
                          <td className="px-3 py-3 text-sm text-center text-gray-600">{usage.date}</td>
                          <td className="px-3 py-3 text-sm text-center text-gray-600">{usage.paymentMethod}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 font-semibold">
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// BudgetRow 컴포넌트 (외부에 정의)
function BudgetRow({ item, editingBudgetId, editingBudgetName, editingBudgetAmount, setEditingBudgetName, setEditingBudgetAmount, setEditingBudgetId, handleEditBudget, handleSaveBudget, handleDeleteBudget, handleBudgetItemClick, used }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const remain = item.amount - used;
  const rate = item.amount > 0 ? (used / item.amount) * 100 : 0;

  return (
    <tr ref={setNodeRef} style={style} {...attributes} className="hover:bg-gray-50 transition-colors">
      <td className="px-2 py-3 text-center cursor-grab" {...listeners}>
        <GripVertical className="w-4 h-4 text-gray-300 hover:text-gray-500" />
      </td>
      <td className="px-3 py-3">
        {editingBudgetId === item.id ? (
          <input
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
            value={editingBudgetName}
            onChange={e => setEditingBudgetName(e.target.value)}
          />
        ) : (
          <div className="flex items-center gap-2">
            <span
              className="text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
              onClick={() => handleBudgetItemClick(item)}
            >
              {item.name || '(이름 없음)'}
            </span>
            {item.region && (
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${item.region === '남부' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                {item.region}
              </span>
            )}
          </div>
        )}
      </td>
      <td className="px-3 py-3 text-right">
        {editingBudgetId === item.id ? (
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
        {editingBudgetId === item.id ? (
          <div className="flex items-center justify-center gap-1">
            <button type="button" className="px-2 py-1 text-xs text-green-600 hover:bg-green-50 rounded transition-colors" onClick={() => handleSaveBudget(item.id)}>저장</button>
            <button type="button" className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded transition-colors" onClick={() => setEditingBudgetId(null)}>취소</button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-1">
            <button type="button" className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" onClick={() => handleEditBudget(item)}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </button>
            <button type="button" className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" onClick={() => handleDeleteBudget(item.id)}>
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

export default Dashboard;
