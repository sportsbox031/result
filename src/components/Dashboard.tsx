import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  BarChart3,
  Calendar,
  Building2,
  PieChart,
  Activity,
  RefreshCw,
  MapPin,
  Wallet,
  TrendingDown,
  Percent,
  GripVertical,
  Trash2,
  X,
  ChevronRight
} from 'lucide-react';
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

  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_YEAR);
  const [isInitializing2026, setIsInitializing2026] = useState(false);
  const [regionFilter, setRegionFilter] = useState<'전체' | '경기남부' | '경기북부'>('전체');
  const [budgetRegionFilter, setBudgetRegionFilter] = useState<'전체' | '남부' | '북부'>('전체');

  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showProgramPopup, setShowProgramPopup] = useState(false);
  const [showBudgetUsagePopup, setShowBudgetUsagePopup] = useState(false);
  const [selectedBudgetItem, setSelectedBudgetItem] = useState<BudgetItem | null>(null);
  const [programStats, setProgramStats] = useState<{ [key: string]: { count: number; people: number } }>({});
  const [activeTab, setActiveTab] = useState<'overview' | 'city' | 'budget'>('overview');
  const [dateFilter, setDateFilter] = useState<{ startDate?: Date; endDate?: Date }>({});

  // Firebase 구독
  useEffect(() => {
    const unsubBudgets = firebaseStorage.subscribeToBudgets(setBudgetItems);
    const unsubUsages = firebaseStorage.subscribeToBudgetUsages(setBudgetUsages);
    return () => { unsubBudgets(); unsubUsages(); };
  }, []);

  // 연도별 필터 적용
  const yearFilteredPerformances = useMemo(() =>
    performances.filter((p: any) => p.date && getPerformanceYear(new Date(p.date)) === selectedYear),
    [performances, selectedYear]
  );

  // 지역 필터 적용
  const regionFilteredPerformances = useMemo(() => {
    if (regionFilter === '전체') return yearFilteredPerformances;
    const targetRegion = regionFilter === '경기남부' ? '남부' : '북부';
    return yearFilteredPerformances.filter((p: any) => getCityRegion(p.city) === targetRegion);
  }, [yearFilteredPerformances, regionFilter]);

  // 기간 필터 적용
  const filteredPerformances = useMemo(() =>
    regionFilteredPerformances.filter((p: any) => {
      const perfDate = new Date(p.date);
      const startDate = dateFilter.startDate instanceof Date ? dateFilter.startDate : (dateFilter.startDate ? new Date(dateFilter.startDate) : undefined);
      const endDate = dateFilter.endDate instanceof Date ? dateFilter.endDate : (dateFilter.endDate ? new Date(dateFilter.endDate) : undefined);
      if (startDate && perfDate < startDate) return false;
      if (endDate && perfDate > endDate) return false;
      return true;
    }),
    [regionFilteredPerformances, dateFilter]
  );

  // 예산 필터링
  const yearFilteredBudgetItems = useMemo(() =>
    budgetItems.filter(item => (item.year ?? 2025) === selectedYear),
    [budgetItems, selectedYear]
  );

  const regionFilteredBudgetItems = useMemo(() => {
    if (budgetRegionFilter === '전체') return yearFilteredBudgetItems;
    return yearFilteredBudgetItems.filter(item => item.region === budgetRegionFilter);
  }, [yearFilteredBudgetItems, budgetRegionFilter]);

  const yearFilteredBudgetUsages = useMemo(() =>
    budgetUsages.filter(usage => usage.date && getBudgetUsageYear(usage.date) === selectedYear),
    [budgetUsages, selectedYear]
  );

  const has2026Budgets = budgetItems.some(b => (b.year ?? 2025) === 2026);

  const handleInitialize2026Budget = async () => {
    if (isInitializing2026) return;
    if (!window.confirm('2026년 예산을 초기화하시겠습니까?')) return;
    setIsInitializing2026(true);
    try {
      await firebaseStorage.initializeBudget2026();
      alert('2026년 예산이 초기화되었습니다.');
    } catch (error) {
      console.error('예산 초기화 실패:', error);
      alert('예산 초기화에 실패했습니다.');
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

  useEffect(() => {
    const calculatedStats = calculateStatistics(filteredPerformances, demands);
    setStats({ ...calculatedStats, totalOrganizations: demands.length });
  }, [demands, filteredPerformances]);

  // 예산 관리 핸들러
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

  const handleDeleteBudget = async (id: string) => {
    if (!window.confirm('이 예산 항목을 삭제하시겠습니까?')) return;
    await firebaseStorage.deleteBudget(id);
  };

  const handleBudgetItemClick = (budgetItem: BudgetItem) => {
    setSelectedBudgetItem(budgetItem);
    setShowBudgetUsagePopup(true);
  };

  // 드래그 앤 드롭
  const sensors = useSensors(useSensor(PointerSensor));
  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = budgetItems.findIndex(b => b.id === active.id);
      const newIndex = budgetItems.findIndex(b => b.id === over.id);
      const newItems = arrayMove(budgetItems, oldIndex, newIndex).map((b, idx) => ({ ...b, order: idx }));
      await firebaseStorage.updateBudgetOrder(newItems);
    }
  };

  // 예산 계산
  const filteredBudgetUsages = useMemo(() =>
    yearFilteredBudgetUsages.filter(u => {
      if (dateFilter.startDate && new Date(u.date) < dateFilter.startDate) return false;
      if (dateFilter.endDate && new Date(u.date) > dateFilter.endDate) return false;
      return true;
    }),
    [yearFilteredBudgetUsages, dateFilter]
  );

  const getBudgetUsageSum = (budgetItemId: string) =>
    filteredBudgetUsages.filter(u => u.budgetItemId === budgetItemId).reduce((sum, u) => sum + (Number(u.amount) || 0), 0);

  const totalBudget = regionFilteredBudgetItems.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  const totalUsed = filteredBudgetUsages
    .filter(u => regionFilteredBudgetItems.some(b => b.id === u.budgetItemId))
    .reduce((sum, u) => sum + (Number(u.amount) || 0), 0);
  const totalRemain = totalBudget - totalUsed;
  const totalRate = totalBudget > 0 ? Math.round((totalUsed / totalBudget) * 1000) / 10 : 0;

  // 시군별 데이터
  const filteredCityData = useMemo(() =>
    stats.cityData.filter(item => {
      if (regionFilter === '전체') return true;
      const cityRegion = getCityRegion(item.name);
      return regionFilter === '경기남부' ? cityRegion === '남부' : cityRegion === '북부';
    }),
    [stats.cityData, regionFilter]
  );

  const selectedCityOrganizations = stats.organizationData.filter(org => org.city === selectedCity);

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">대시보드</h1>
          <p className="text-gray-500 mt-1">실적 현황을 한눈에 확인하세요</p>
        </div>
      </div>

      {/* 필터 패널 */}
      <div className="glass-card p-5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* 연도 선택 */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600 whitespace-nowrap">연도</span>
            <div className="flex gap-2">
              {AVAILABLE_YEARS.map(year => (
                <button
                  key={year}
                  type="button"
                  className={`btn-glass ${selectedYear === year ? 'active' : ''}`}
                  onClick={() => setSelectedYear(year)}
                >
                  {year}년
                </button>
              ))}
            </div>
            {selectedYear === 2026 && !has2026Budgets && (
              <button
                type="button"
                className="btn-primary flex items-center gap-2"
                onClick={handleInitialize2026Budget}
                disabled={isInitializing2026}
              >
                <RefreshCw className={`w-4 h-4 ${isInitializing2026 ? 'animate-spin' : ''}`} />
                예산 초기화
              </button>
            )}
          </div>

          <div className="hidden lg:block w-px h-8 bg-gray-200" />

          {/* 지역 필터 */}
          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-gray-400" />
            <div className="flex gap-2">
              {(['전체', '경기남부', '경기북부'] as const).map(region => (
                <button
                  key={region}
                  type="button"
                  className={`btn-glass ${regionFilter === region ? 'active' : ''}`}
                  onClick={() => setRegionFilter(region)}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 기간 필터 */}
        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">기간</span>
          </div>
          <input
            type="date"
            className="input-glass w-auto"
            value={dateFilter.startDate ? dateFilter.startDate.toISOString().split('T')[0] : ''}
            onChange={e => setDateFilter(f => ({ ...f, startDate: e.target.value ? new Date(e.target.value) : undefined }))}
          />
          <span className="text-gray-400">~</span>
          <input
            type="date"
            className="input-glass w-auto"
            value={dateFilter.endDate ? dateFilter.endDate.toISOString().split('T')[0] : ''}
            onChange={e => setDateFilter(f => ({ ...f, endDate: e.target.value ? new Date(e.target.value) : undefined }))}
          />
          <button
            type="button"
            className="btn-secondary text-sm"
            onClick={() => setDateFilter({})}
          >
            초기화
          </button>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="tab-container inline-flex">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`tab-item ${activeTab === 'overview' ? 'active' : ''}`}
        >
          <Activity className="w-4 h-4" />
          <span>현황 개요</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('city')}
          className={`tab-item ${activeTab === 'city' ? 'active' : ''}`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>시군별 현황</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('budget')}
          className={`tab-item ${activeTab === 'budget' ? 'active' : ''}`}
        >
          <PieChart className="w-4 h-4" />
          <span>예산 현황</span>
        </button>
      </div>

      {/* 탭 컨텐츠 */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fadeIn">
          {/* 실적 통계 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              실적 현황
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="stat-card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">등록 단체수</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalOrganizations.toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-1">개 단체</p>
                  </div>
                  <div className="stat-icon stat-icon-blue">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="stat-card cursor-pointer" onClick={handleTotalCountClick}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">총 실적 횟수</p>
                    <p className="text-3xl font-bold text-gray-900">{filteredPerformances.length.toLocaleString()}</p>
                    <p className="text-xs text-blue-500 mt-1 flex items-center gap-1">
                      프로그램별 보기 <ChevronRight className="w-3 h-3" />
                    </p>
                  </div>
                  <div className="stat-icon stat-icon-emerald">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">총 참여 인원</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {filteredPerformances.reduce((sum, p) => sum + (p.maleCount || 0) + (p.femaleCount || 0), 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">명</p>
                  </div>
                  <div className="stat-icon stat-icon-violet">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 예산 통계 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-indigo-500" />
              예산 현황
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="stat-card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">총 예산액</p>
                    <p className="text-xl lg:text-2xl font-bold text-gray-900">{(totalBudget / 10000).toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-1">만원</p>
                  </div>
                  <div className="stat-icon stat-icon-indigo">
                    <Wallet className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">집행액</p>
                    <p className="text-xl lg:text-2xl font-bold text-blue-600">{(totalUsed / 10000).toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-1">만원</p>
                  </div>
                  <div className="stat-icon stat-icon-blue">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">잔액</p>
                    <p className="text-xl lg:text-2xl font-bold text-gray-700">{(totalRemain / 10000).toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-1">만원</p>
                  </div>
                  <div className="stat-icon stat-icon-emerald">
                    <TrendingDown className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">집행율</p>
                    <p className="text-xl lg:text-2xl font-bold text-amber-600">{totalRate}%</p>
                    <div className="mt-2">
                      <div className="progress-bar w-20">
                        <div className="progress-bar-fill progress-bar-fill-amber" style={{ width: `${Math.min(totalRate, 100)}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="stat-icon stat-icon-amber">
                    <Percent className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'city' && (
        <div className="glass-card p-6 animate-fadeIn">
          <h2 className="text-xl font-bold text-gray-900 mb-6">시/군별 참여 현황</h2>
          {filteredCityData.length > 0 ? (
            <div className="space-y-3">
              {filteredCityData.map((item, index) => {
                const maxTotal = Math.max(...filteredCityData.map(d => d.total), 1);
                const percentage = (item.total / maxTotal) * 100;
                return (
                  <div
                    key={index}
                    className="glass p-4 rounded-2xl cursor-pointer hover:bg-white/80 transition-all"
                    onClick={() => { setSelectedCity(item.name); setShowPopup(true); }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 text-center">
                        <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-bold shadow-sm">
                          {item.name}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="progress-bar h-10">
                          <div
                            className="progress-bar-fill progress-bar-fill-blue h-10 flex items-center justify-end pr-4"
                            style={{ width: `${Math.max(percentage, 8)}%` }}
                          >
                            <span className="text-white font-semibold text-sm">{item.total.toLocaleString()}명</span>
                          </div>
                        </div>
                      </div>
                      <div className="w-20 text-right">
                        <span className="text-sm font-medium text-gray-600">{item.count}회</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-400">데이터가 없습니다</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'budget' && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={regionFilteredBudgetItems.map(b => b.id)} strategy={verticalListSortingStrategy}>
            <div className="glass-card p-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h2 className="text-xl font-bold text-gray-900">{selectedYear}년 예산 현황</h2>
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    {(['전체', '남부', '북부'] as const).map(region => (
                      <button
                        key={region}
                        type="button"
                        className={`btn-glass text-sm ${budgetRegionFilter === region ? 'active' : ''}`}
                        onClick={() => setBudgetRegionFilter(region)}
                      >
                        {region}
                      </button>
                    ))}
                  </div>
                  <button type="button" className="btn-primary text-sm" onClick={handleAddBudget}>
                    + 항목 추가
                  </button>
                </div>
              </div>

              {regionFilteredBudgetItems.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="table-glass">
                    <thead>
                      <tr>
                        <th className="w-10"></th>
                        <th>예산명</th>
                        <th className="text-right">예산액</th>
                        <th className="text-right">사용액</th>
                        <th className="text-right">잔액</th>
                        <th className="text-right">집행율</th>
                        <th className="text-center w-24">작업</th>
                      </tr>
                    </thead>
                    <tbody>
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
                      <tr className="bg-gray-50/80 font-semibold">
                        <td colSpan={2} className="px-4 py-3 text-gray-700">합계</td>
                        <td className="px-4 py-3 text-right text-gray-900">{totalBudget.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-blue-600">{totalUsed.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{totalRemain.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-amber-600">{totalRate}%</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="text-center py-16">
                  <PieChart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-400">예산 항목이 없습니다</p>
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* 시군 상세 모달 */}
      {showPopup && (
        <div className="modal-overlay animate-fadeIn" onClick={() => setShowPopup(false)}>
          <div className="modal-content w-full max-w-lg animate-scaleIn" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">{selectedCity} 수요처별 현황</h3>
              <button onClick={() => setShowPopup(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              {selectedCityOrganizations.length > 0 ? (
                <div className="space-y-3">
                  {selectedCityOrganizations.map((org, idx) => (
                    <div key={idx} className="glass p-4 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{org.name}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-500">{org.count}회</span>
                          <span className="font-semibold text-blue-600">{org.total.toLocaleString()}명</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-400 py-8">데이터가 없습니다</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 프로그램별 모달 */}
      {showProgramPopup && (
        <div className="modal-overlay animate-fadeIn" onClick={() => setShowProgramPopup(false)}>
          <div className="modal-content w-full max-w-md animate-scaleIn" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">프로그램별 실적</h3>
              <button onClick={() => setShowProgramPopup(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {['스포츠교실', '스포츠체험존', '스포츠이벤트'].map(prog => (
                <div key={prog} className="glass p-5 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-800">{prog}</span>
                    <div className="flex gap-6">
                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-1">횟수</p>
                        <p className="text-xl font-bold text-emerald-600">{programStats[prog]?.count || 0}회</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-1">인원</p>
                        <p className="text-xl font-bold text-blue-600">{(programStats[prog]?.people || 0).toLocaleString()}명</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 예산 사용 내역 모달 */}
      {showBudgetUsagePopup && selectedBudgetItem && (
        <div className="modal-overlay animate-fadeIn" onClick={() => setShowBudgetUsagePopup(false)}>
          <div className="modal-content w-full max-w-4xl animate-scaleIn" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">{selectedBudgetItem.name} 사용 내역</h3>
              <button onClick={() => setShowBudgetUsagePopup(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              {(() => {
                const usages = filteredBudgetUsages.filter(u => u.budgetItemId === selectedBudgetItem.id);
                return usages.length > 0 ? (
                  <div className="space-y-3">
                    {usages.map(usage => (
                      <div key={usage.id} className="glass p-4 rounded-xl">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{usage.description}</p>
                            <p className="text-sm text-gray-500">{usage.vendor} · {usage.date}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`badge ${usage.paymentMethod === '카드결제' ? 'badge-violet' : 'badge-emerald'}`}>
                              {usage.paymentMethod}
                            </span>
                            <span className="font-bold text-blue-600">{Number(usage.amount).toLocaleString()}원</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="glass-strong p-4 rounded-xl mt-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">총 사용액</span>
                        <span className="text-xl font-bold text-blue-600">
                          {usages.reduce((sum, u) => sum + Number(u.amount), 0).toLocaleString()}원
                        </span>
                      </div>
                    </div>
                  </div>
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

// BudgetRow 컴포넌트
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
    <tr ref={setNodeRef} style={style} {...attributes} className="hover:bg-blue-50/30 transition-colors">
      <td className="px-2 py-3 text-center cursor-grab" {...listeners}>
        <GripVertical className="w-4 h-4 text-gray-300 hover:text-gray-500" />
      </td>
      <td className="px-4 py-3">
        {editingBudgetId === item.id ? (
          <input
            className="input-glass"
            value={editingBudgetName}
            onChange={e => setEditingBudgetName(e.target.value)}
          />
        ) : (
          <div className="flex items-center gap-2">
            <span
              className="font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
              onClick={() => handleBudgetItemClick(item)}
            >
              {item.name || '(이름 없음)'}
            </span>
            {item.region && (
              <span className={`badge ${item.region === '남부' ? 'badge-blue' : 'badge-emerald'}`}>
                {item.region}
              </span>
            )}
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        {editingBudgetId === item.id ? (
          <input
            type="number"
            className="input-glass w-32 text-right"
            value={editingBudgetAmount}
            onChange={e => setEditingBudgetAmount(Number(e.target.value))}
          />
        ) : (
          <span className="text-gray-900">{item.amount.toLocaleString()}</span>
        )}
      </td>
      <td className="px-4 py-3 text-right font-medium text-blue-600">{used.toLocaleString()}</td>
      <td className="px-4 py-3 text-right text-gray-600">{remain.toLocaleString()}</td>
      <td className="px-4 py-3 text-right">
        <span className={`font-medium ${rate >= 100 ? 'text-rose-600' : rate >= 80 ? 'text-amber-600' : 'text-gray-600'}`}>
          {rate.toFixed(1)}%
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        {editingBudgetId === item.id ? (
          <div className="flex items-center justify-center gap-1">
            <button type="button" className="btn-glass text-xs text-emerald-600" onClick={() => handleSaveBudget(item.id)}>저장</button>
            <button type="button" className="btn-glass text-xs text-gray-500" onClick={() => setEditingBudgetId(null)}>취소</button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-1">
            <button
              type="button"
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              onClick={() => handleEditBudget(item)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              type="button"
              className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              onClick={() => handleDeleteBudget(item.id)}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

export default Dashboard;
