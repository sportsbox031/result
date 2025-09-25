import React, { useState, useEffect } from 'react';
import { Users, BarChart3, Calendar, Building2, TrendingUp, PieChart, Activity } from 'lucide-react';
import { GripVertical, Trash2 } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useFirebaseData } from '../hooks/useFirebaseData';
import { calculateStatistics } from '../utils/statistics';
import { StatisticsData, BudgetItem, BudgetUsage } from '../types';
import { firebaseStorage } from '../utils/firebaseStorage';

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

  const SOUTH_CITIES = [
    '과천시', '광명시', '광주시', '군포시', '김포시', '부천시', '성남시', '수원시', '시흥시', '안산시', '안성시', '안양시', '여주시', '오산시', '용인시', '의왕시', '이천시', '평택시', '하남시', '화성시', '양평군'
  ];
  const NORTH_CITIES = [
    '고양시', '구리시', '남양주시', '동두천시', '양주시', '의정부시', '파주시', '포천시', '가평군', '연천군'
  ];

  const [regionFilter, setRegionFilter] = useState<'전체' | '남부' | '북부'>('전체');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showProgramPopup, setShowProgramPopup] = useState(false);
  const [showBudgetUsagePopup, setShowBudgetUsagePopup] = useState(false);
  const [selectedBudgetItem, setSelectedBudgetItem] = useState<BudgetItem | null>(null);
  const [programStats, setProgramStats] = useState<{ [key: string]: { count: number; people: number } }>({});
  const [activeTab, setActiveTab] = useState<'overview' | 'city' | 'organization' | 'budget'>('overview');

  function handleTotalCountClick() {
    // 프로그램별 집계 (기준일자 필터 적용)
    const statsByProgram: { [key: string]: { count: number; people: number } } = {};
    filteredPerformances.forEach(p => {
      const prog = p.program || '스포츠교실';
      if (!statsByProgram[prog]) statsByProgram[prog] = { count: 0, people: 0 };
      statsByProgram[prog].count += 1;
      statsByProgram[prog].people += (p.maleCount || 0) + (p.femaleCount || 0);
    });
    setProgramStats(statsByProgram);
    setShowProgramPopup(true);
  }

  // 예산 데이터 실시간 구독
  useEffect(() => {
    const unsubBudgets = firebaseStorage.subscribeToBudgets(setBudgetItems);
    const unsubUsages = firebaseStorage.subscribeToBudgetUsages(setBudgetUsages);
    return () => {
      unsubBudgets();
      unsubUsages();
    };
  }, []);

  // 기간 필터 상태
  const [dateFilter, setDateFilter] = useState<{ startDate?: Date; endDate?: Date }>({});

  // 기준일자 필터가 적용된 실적 데이터
  const filteredPerformances = performances.filter((p: any) => {
    const perfDate = new Date(p.date);
    const startDate = dateFilter.startDate instanceof Date ? dateFilter.startDate : (dateFilter.startDate ? new Date(dateFilter.startDate) : undefined);
    const endDate = dateFilter.endDate instanceof Date ? dateFilter.endDate : (dateFilter.endDate ? new Date(dateFilter.endDate) : undefined);
    if (startDate && perfDate < startDate) return false;
    if (endDate && perfDate > endDate) return false;
    return true;
  });

  // 기준일자 필터가 변경될 때마다 실적, 예산 사용 현황 데이터가 필터링되어 반영되도록 useEffect 및 집계 로직 개선
  useEffect(() => {
    const filteredBudgetUsages = budgetUsages.filter(u => {
      if (dateFilter.startDate && new Date(u.date) < dateFilter.startDate) return false;
      if (dateFilter.endDate && new Date(u.date) > dateFilter.endDate) return false;
      return true;
    });

    const calculatedStats = calculateStatistics(filteredPerformances, demands);
    setStats({
      ...calculatedStats,
      totalOrganizations: demands.length
    });
  }, [demands, performances, dateFilter.startDate, dateFilter.endDate]);

  // 예산명/예산액 인라인 수정 핸들러 (파이어베이스 연동)
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
    await firebaseStorage.addBudget({ name: '', amount: 0 });
  };

  // 예산 사용 내역 추가/수정/삭제 핸들러 (파이어베이스 연동)
  const handleAddUsage = async () => {
    if (!budgetItems[0]) return;
    await firebaseStorage.addBudgetUsage({ budgetItemId: budgetItems[0].id, description: '', vendor: '', amount: 0, date: '', paymentMethod: '', note: '' });
  };
  const handleUsageChange = async (id: string, field: keyof BudgetUsage, value: any) => {
    const usage = budgetUsages.find(u => u.id === id);
    if (!usage) return;
    await firebaseStorage.updateBudgetUsage(id, { ...usage, [field]: value });
  };
  const handleDeleteUsage = async (id: string) => {
    await firebaseStorage.deleteBudgetUsage(id);
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

  // 필터링된 예산/실적 데이터 계산 (기간 필터 적용)
  const filteredBudgetUsages = budgetUsages.filter(u => {
    if (dateFilter.startDate && new Date(u.date) < dateFilter.startDate) return false;
    if (dateFilter.endDate && new Date(u.date) > dateFilter.endDate) return false;
    return true;
  });
  const getBudgetUsageSum = (budgetItemId: string) =>
    filteredBudgetUsages.filter(u => u.budgetItemId === budgetItemId).reduce((sum, u) => sum + (Number(u.amount) || 0), 0);

  // 예산 항목 삭제 핸들러
  const handleDeleteBudget = async (id: string) => {
    await firebaseStorage.deleteBudget(id);
  };

  // 예산명 클릭 핸들러
  const handleBudgetItemClick = (budgetItem: BudgetItem) => {
    setSelectedBudgetItem(budgetItem);
    setShowBudgetUsagePopup(true);
  };

  // 예산명별 사용액 집계
  useEffect(() => {
    const calculatedStats = calculateStatistics(performances, demands);
    setStats({
      ...calculatedStats,
      totalOrganizations: demands.length
    });
  }, [demands, performances]);

  // 전체 예산/사용/잔액/집행율 계산 (기준일자 필터 적용)
  const totalBudget = budgetItems.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  const totalUsed = filteredBudgetUsages.reduce((sum, u) => sum + (Number(u.amount) || 0), 0);
  const totalRemain = totalBudget - totalUsed;
  const totalRate = totalBudget > 0 ? Math.round((totalUsed / totalBudget) * 1000) / 10 : 0; // 소수점 1자리

  const StatCard: React.FC<{
    title: string;
    value: string;
    icon: React.ElementType;
    color: string;
    gradient?: string;
    onClick?: () => void;
  }> = ({ title, value, icon: Icon, color, gradient, onClick }) => (
    <div
      className={`bg-white rounded-xl shadow-lg border-0 p-6 min-h-[120px] transition-all duration-300 hover:shadow-xl hover:scale-105 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{title}</p>
          <div className={`p-3 rounded-xl ${gradient || color} flex-shrink-0`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
        <div className="w-full">
          <p className="text-xl lg:text-2xl font-bold text-gray-900 break-words leading-tight whitespace-normal">{value}</p>
        </div>
      </div>
    </div>
  );

  const CityBarChart: React.FC<{
    data: Array<{ name: string; total: number; count: number }>;
    onBarClick?: (cityName: string) => void;
  }> = ({ data, onBarClick }) => {
    const maxTotal = Math.max(...data.map(d => d.total), 1);

    return (
      <div className="bg-white rounded-xl shadow-lg border-0 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">시/군별 참여 현황</h2>
        <div className="flex flex-wrap gap-3 mb-6">
          {['전체', '남부', '북부'].map(region => (
            <button
              key={region}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 text-sm ${regionFilter === region
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:shadow-md'
                }`}
              onClick={() => setRegionFilter(region as any)}
            >
              {region}
            </button>
          ))}
        </div>
        {data.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto">
            {data.map((item, index) => (
              <div key={index} className={`flex items-center space-x-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl transition-all duration-200 cursor-pointer hover:shadow-lg hover:scale-[1.02] ${onBarClick ? 'hover:from-blue-100 hover:to-purple-100' : ''}`}
                onClick={onBarClick ? () => onBarClick(item.name) : undefined}
              >
                <div className="text-sm font-bold text-gray-700 min-w-[70px] text-center bg-white rounded-lg py-2 px-3 shadow-sm">
                  {item.name}
                </div>
                <div className="flex-1">
                  <div className="bg-gray-200 rounded-full h-6 relative overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-6 rounded-full transition-all duration-700 ease-out flex items-center justify-end pr-3"
                      style={{ width: `${Math.max((item.total / maxTotal) * 100, 8)}%` }}
                      title={`${item.count}회, ${item.total.toLocaleString()}명`}
                    >
                      <span className="text-xs text-white font-bold hidden sm:inline">
                        {item.total.toLocaleString()}명
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-600 font-mono min-w-[60px] text-right">
                  <div className="sm:hidden font-bold text-blue-600">{item.total.toLocaleString()}</div>
                  <div className="font-semibold">{item.count}회</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <div className="text-6xl mb-4">📊</div>
              <div className="text-lg font-medium">데이터가 없습니다</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const OrganizationTable: React.FC<{
    data: Array<{ name: string; total: number; count: number; city: string }>;
  }> = ({ data }) => (
    <div className="bg-white rounded-xl shadow-lg border-0 p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">수요처별 참여 현황</h2>
      {data.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">순위</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">수요처명</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">시/군</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">횟수</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">총 참여인원</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((item, index) => (
                <tr key={index} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <span className={`inline-flex items-center justify-center w-8 h-8 text-xs font-bold rounded-full ${index < 3
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
                        : 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800'
                      }`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 max-w-[200px] truncate" title={item.name}>
                    {item.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                    {item.city || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right font-bold">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                      {item.count}회
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right font-bold">
                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
                      {item.total.toLocaleString()}명
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex items-center justify-center h-32 text-gray-500">
          <div className="text-center">
            <div className="text-6xl mb-4">🏢</div>
            <div className="text-lg font-medium">데이터가 없습니다</div>
          </div>
        </div>
      )}
    </div>
  );

  const filteredCityData = stats.cityData.filter(item => {
    if (regionFilter === '전체') return true;
    if (regionFilter === '남부') return SOUTH_CITIES.includes(item.name);
    if (regionFilter === '북부') return NORTH_CITIES.includes(item.name);
    return true;
  });

  const selectedCityOrganizations = stats.organizationData.filter(org => org.city === selectedCity);

  const TabButton: React.FC<{
    id: string;
    label: string;
    icon: React.ElementType;
    isActive: boolean;
    onClick: () => void;
  }> = ({ id, label, icon: Icon, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`flex items-center px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${isActive
          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
          : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-gray-200'
        }`}
    >
      <Icon className="w-5 h-5 mr-2" />
      {label}
    </button>
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
          대시보드
        </h1>
        <p className="text-lg text-gray-600">수요처 및 실적 현황을 한눈에 확인하세요</p>
      </div>

      {/* 기간 필터 UI */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl shadow-sm border border-blue-100 p-6 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">시작 날짜</label>
              <input
                type="date"
                className="border-0 rounded-lg px-4 py-2 text-sm w-full sm:w-auto shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={dateFilter.startDate ? dateFilter.startDate.toISOString().split('T')[0] : ''}
                onChange={e => setDateFilter(f => ({ ...f, startDate: e.target.value ? new Date(e.target.value) : undefined }))}
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">종료 날짜</label>
              <input
                type="date"
                className="border-0 rounded-lg px-4 py-2 text-sm w-full sm:w-auto shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={dateFilter.endDate ? dateFilter.endDate.toISOString().split('T')[0] : ''}
                onChange={e => setDateFilter(f => ({ ...f, endDate: e.target.value ? new Date(e.target.value) : undefined }))}
              />
            </div>
          </div>
          <button
            className="px-6 py-2 bg-white rounded-lg hover:bg-gray-50 text-sm font-semibold whitespace-nowrap shadow-sm border border-gray-200 transition-colors"
            onClick={() => setDateFilter({})}
          >
            전체 초기화
          </button>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex flex-wrap gap-3 mb-8">
        <TabButton
          id="overview"
          label="수요처 및 실적 현황 개요"
          icon={Activity}
          isActive={activeTab === 'overview'}
          onClick={() => setActiveTab('overview')}
        />
        <TabButton
          id="city"
          label="시군별 참여현황"
          icon={BarChart3}
          isActive={activeTab === 'city'}
          onClick={() => setActiveTab('city')}
        />
        <TabButton
          id="organization"
          label="수요처별 참여현황"
          icon={Building2}
          isActive={activeTab === 'organization'}
          onClick={() => setActiveTab('organization')}
        />
        <TabButton
          id="budget"
          label="예산사용현황"
          icon={PieChart}
          isActive={activeTab === 'budget'}
          onClick={() => setActiveTab('budget')}
        />
      </div>

      {/* 탭 컨텐츠 */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* 통계 카드 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="등록 단체수"
              value={stats.totalOrganizations.toString()}
              icon={Building2}
              gradient="bg-gradient-to-br from-blue-500 to-blue-600"
            />
            <StatCard
              title="총 횟수"
              value={filteredPerformances.length.toString()}
              icon={Calendar}
              gradient="bg-gradient-to-br from-green-500 to-green-600"
              onClick={handleTotalCountClick}
            />
            <StatCard
              title="총 참여 인원"
              value={filteredPerformances.reduce((sum, p) => sum + (p.maleCount || 0) + (p.femaleCount || 0), 0).toLocaleString() + '명'}
              icon={Users}
              gradient="bg-gradient-to-br from-purple-500 to-purple-600"
            />
            <StatCard
              title="평균 참여 인원"
              value={filteredPerformances.length > 0 ? Math.round(filteredPerformances.reduce((sum, p) => sum + (p.maleCount || 0) + (p.femaleCount || 0), 0) / filteredPerformances.length).toLocaleString() + '명' : '0명'}
              icon={TrendingUp}
              gradient="bg-gradient-to-br from-orange-500 to-orange-600"
            />
          </div>

          {/* 전체 예산/사용/잔액/집행율 카드 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="전체 예산액" value={totalBudget.toLocaleString() + '원'} icon={BarChart3} gradient="bg-gradient-to-br from-indigo-500 to-indigo-600" />
            <StatCard title="전체 사용액" value={totalUsed.toLocaleString() + '원'} icon={Users} gradient="bg-gradient-to-br from-emerald-500 to-emerald-600" />
            <StatCard title="전체 잔액" value={totalRemain.toLocaleString() + '원'} icon={Building2} gradient="bg-gradient-to-br from-gray-500 to-gray-600" />
            <StatCard title="전체 집행율" value={totalRate + '%'} icon={Calendar} gradient="bg-gradient-to-br from-amber-500 to-amber-600" />
          </div>
        </div>
      )}

      {activeTab === 'city' && (
        <div className="mb-8">
          <CityBarChart data={filteredCityData} onBarClick={cityName => { setSelectedCity(cityName); setShowPopup(true); }} />
        </div>
      )}

      {activeTab === 'organization' && (
        <div className="mb-8">
          <OrganizationTable data={stats.organizationData} />
        </div>
      )}

      {activeTab === 'budget' && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={budgetItems.map(b => b.id)} strategy={verticalListSortingStrategy}>
            <div className="bg-white rounded-xl shadow-lg border-0 p-6 mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-900">예산 사용 현황</h2>
                <button
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 font-semibold shadow-lg transition-all duration-200 hover:shadow-xl"
                  onClick={handleAddBudget}
                >
                  + 예산 항목 추가
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-2 py-3 text-center w-8"></th>
                      <th className="px-2 py-3 text-left min-w-[120px] font-semibold text-gray-700">예산명</th>
                      <th className="px-2 py-3 text-right min-w-[80px] font-semibold text-gray-700">예산액</th>
                      <th className="px-2 py-3 text-right min-w-[80px] font-semibold text-gray-700">사용액</th>
                      <th className="px-2 py-3 text-right min-w-[80px] font-semibold text-gray-700">잔액</th>
                      <th className="px-2 py-3 text-right min-w-[60px] font-semibold text-gray-700">집행율</th>
                      <th className="px-2 py-3 text-center w-16 font-semibold text-gray-700">수정</th>
                      <th className="px-2 py-3 text-center w-16 font-semibold text-gray-700">삭제</th>
                    </tr>
                  </thead>
                  <tbody>
                    {budgetItems.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map(item => (
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
                        isDragging={false}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* 팝업들 */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 relative animate-fadeIn">
            <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl" onClick={() => setShowPopup(false)}>&times;</button>
            <h3 className="text-2xl font-bold mb-6 text-blue-700 pr-8">{selectedCity} 수요처별 참여 현황</h3>
            {selectedCityOrganizations.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <th className="px-3 py-3 text-left font-semibold text-gray-700">수요처명</th>
                    <th className="px-3 py-3 text-right font-semibold text-gray-700">횟수</th>
                    <th className="px-3 py-3 text-right font-semibold text-gray-700">총 참여인원</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCityOrganizations.map((org, idx) => (
                    <tr key={idx} className="hover:bg-blue-50 transition-colors">
                      <td className="px-3 py-3 font-medium text-gray-900">{org.name}</td>
                      <td className="px-3 py-3 text-right">{org.count}회</td>
                      <td className="px-3 py-3 text-right">{org.total.toLocaleString()}명</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-gray-500 text-center py-8">데이터가 없습니다</div>
            )}
          </div>
        </div>
      )}

      {showProgramPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-8 relative animate-fadeIn">
            <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl" onClick={() => setShowProgramPopup(false)}>&times;</button>
            <h3 className="text-2xl font-bold mb-8 text-green-700 text-center pr-8">프로그램별 실적 요약</h3>
            <div className="grid gap-6">
              {['스포츠교실', '스포츠체험존', '스포츠이벤트'].map(prog => (
                <div key={prog} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 flex items-center justify-between shadow-sm border border-green-100">
                  <div className="font-bold text-xl text-green-900">{prog}</div>
                  <div className="flex flex-col items-end">
                    <span className="text-sm text-gray-600 font-medium">총 횟수</span>
                    <span className="text-2xl font-bold text-green-700">{programStats[prog]?.count || 0}회</span>
                  </div>
                  <div className="flex flex-col items-end ml-6">
                    <span className="text-sm text-gray-600 font-medium">총 인원</span>
                    <span className="text-2xl font-bold text-green-700">{programStats[prog]?.people?.toLocaleString() || 0}명</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 예산 사용 내역 팝업 */}
      {showBudgetUsagePopup && selectedBudgetItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] p-6 relative animate-fadeIn">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl"
              onClick={() => setShowBudgetUsagePopup(false)}
            >
              &times;
            </button>
            <h3 className="text-2xl font-bold mb-6 text-blue-700 pr-8">
              {selectedBudgetItem.name} 사용 내역
            </h3>
            <div className="max-h-[60vh] overflow-y-auto">
              {(() => {
                const usages = filteredBudgetUsages.filter(u => u.budgetItemId === selectedBudgetItem.id);
                return usages.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">적요</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">채주</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700">집행액</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700">집행일자</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700">결제방법</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">메모</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usages.map((usage, idx) => (
                        <tr key={usage.id} className="hover:bg-blue-50 border-b transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-900">{usage.description}</td>
                          <td className="px-4 py-3 text-gray-700">{usage.vendor}</td>
                          <td className="px-4 py-3 text-right font-semibold text-blue-600">
                            {Number(usage.amount).toLocaleString()}원
                          </td>
                          <td className="px-4 py-3 text-center text-gray-700">{usage.date}</td>
                          <td className="px-4 py-3 text-center text-gray-700">{usage.paymentMethod}</td>
                          <td className="px-4 py-3 text-gray-600">{usage.note || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <td colSpan={2} className="px-4 py-3 font-bold text-gray-900">총 사용액</td>
                        <td className="px-4 py-3 text-right font-bold text-blue-600">
                          {usages.reduce((sum, u) => sum + Number(u.amount), 0).toLocaleString()}원
                        </td>
                        <td colSpan={3}></td>
                      </tr>
                    </tfoot>
                  </table>
                ) : (
                  <div className="text-gray-500 text-center py-8">사용 내역이 없습니다</div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// BudgetRow 컴포넌트 정의 (드래그핸들, 삭제, 수정, UI 개선)
function BudgetRow({ item, editingBudgetId, editingBudgetName, editingBudgetAmount, setEditingBudgetName, setEditingBudgetAmount, setEditingBudgetId, handleEditBudget, handleSaveBudget, handleDeleteBudget, handleBudgetItemClick, used, isDragging }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: dndDragging } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    background: dndDragging ? '#e0f2fe' : undefined
  };
  const remain = item.amount - used;
  const rate = item.amount > 0 ? (used / item.amount) * 100 : 0;
  return (
    <tr ref={setNodeRef} style={style} {...attributes}>
      <td className="px-2 py-2 text-center cursor-grab" {...listeners}><GripVertical className="w-4 h-4 text-gray-400" /></td>
      <td className="px-2 py-2 flex items-center gap-2">
        {editingBudgetId === item.id ? (
          <input className="border rounded px-2 py-1 w-32" value={editingBudgetName} onChange={e => setEditingBudgetName(e.target.value)} />
        ) : (
          <>
            <span
              className={`${item.name.includes('북부')
                ? 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-semibold'
                : 'bg-gray-100 text-gray-800 px-2 py-1 rounded font-semibold'} cursor-pointer hover:opacity-80 transition-opacity`}
              onClick={() => handleBudgetItemClick(item)}
              title="클릭하여 사용 내역 보기"
            >
              {item.name}
            </span>
            {item.region === '남부' && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">남부</span>
            )}
            {item.region === '북부' && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">북부</span>
            )}
          </>
        )}
      </td>
      <td className="px-2 py-2 text-right">
        {editingBudgetId === item.id ? (
          <input type="number" className="border rounded px-2 py-1 w-24 text-right" value={editingBudgetAmount} onChange={e => setEditingBudgetAmount(Number(e.target.value))} />
        ) : (
          item.amount.toLocaleString()
        )}
      </td>
      <td className="px-2 py-2 text-right">{used.toLocaleString()}</td>
      <td className="px-2 py-2 text-right">{remain.toLocaleString()}</td>
      <td className="px-2 py-2 text-right">{rate.toFixed(2)}</td>
      <td className="px-2 py-2 text-center">
        {editingBudgetId === item.id ? (
          <>
            <button className="px-2 py-1 text-green-600 hover:underline" onClick={() => handleSaveBudget(item.id)}>저장</button>
            <button className="px-2 py-1 text-gray-500 hover:underline" onClick={() => setEditingBudgetId(null)}>취소</button>
          </>
        ) : (
          <button className="px-2 py-1 text-blue-600 hover:underline" onClick={() => handleEditBudget(item)}>수정</button>
        )}
      </td>
      <td className="px-2 py-2 text-center">
        <button className="px-2 py-1 text-red-500 hover:underline" onClick={() => handleDeleteBudget(item.id)}><Trash2 className="inline w-4 h-4" /></button>
      </td>
    </tr>
  );
}

export default Dashboard;