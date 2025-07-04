import React, { useState, useEffect } from 'react';
import { Users, BarChart3, Calendar, Building2 } from 'lucide-react';
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
  const [editingBudgetId, setEditingBudgetId] = useState<string|null>(null);
  const [editingBudgetName, setEditingBudgetName] = useState<string>('');
  const [editingBudgetAmount, setEditingBudgetAmount] = useState<number>(0);

  const SOUTH_CITIES = [
    '과천시','광명시','광주시','군포시','김포시','부천시','성남시','수원시','시흥시','안산시','안성시','안양시','여주시','오산시','용인시','의왕시','이천시','평택시','하남시','화성시','양평군'
  ];
  const NORTH_CITIES = [
    '고양시','구리시','남양주시','동두천시','양주시','의정부시','파주시','포천시','가평군','연천군'
  ];

  const [regionFilter, setRegionFilter] = useState<'전체'|'남부'|'북부'>('전체');
  const [selectedCity, setSelectedCity] = useState<string|null>(null);
  const [showPopup, setShowPopup] = useState(false);

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

  // 기준일자 필터가 변경될 때마다 실적, 예산 사용 현황 데이터가 필터링되어 반영되도록 useEffect 및 집계 로직 개선
  useEffect(() => {
    const filteredPerformances = performances.filter(p => {
      if (dateFilter.startDate && new Date(p.date) < dateFilter.startDate) return false;
      if (dateFilter.endDate && new Date(p.date) > dateFilter.endDate) return false;
      return true;
    });
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

  // 예산명별 사용액 집계
  useEffect(() => {
    const calculatedStats = calculateStatistics(performances, demands);
    setStats({
      ...calculatedStats,
      totalOrganizations: demands.length
    });
  }, [demands, performances]);

  const StatCard: React.FC<{
    title: string;
    value: string;
    icon: React.ElementType;
    color: string;
  }> = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">시/군별 참여 현황</h2>
        <div className="flex gap-2 mb-4">
          {['전체','남부','북부'].map(region => (
            <button
              key={region}
              className={`px-4 py-2 rounded-full border font-semibold transition-colors duration-200 ${regionFilter===region ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'}`}
              onClick={() => setRegionFilter(region as any)}
            >
              {region}
            </button>
          ))}
        </div>
        {data.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
            {data.map((item, index) => (
              <div key={index} className={`flex items-center space-x-4 p-3 bg-gray-50 rounded-lg transition cursor-pointer hover:shadow-md ${onBarClick ? 'hover:bg-blue-100' : ''}`}
                onClick={onBarClick ? () => onBarClick(item.name) : undefined}
              >
                <div className="text-sm font-medium text-gray-700 min-w-[70px] text-center">
                  {item.name}
                </div>
                <div className="flex-1">
                  <div className="bg-gray-200 rounded-full h-6 relative">
                    <div
                      className="bg-blue-500 h-6 rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2"
                      style={{ width: `${Math.max((item.total / maxTotal) * 100, 8)}%` }}
                      title={`${item.count}회, ${item.total.toLocaleString()}명`}
                    >
                      <span className="text-xs text-white font-medium">
                        {item.total.toLocaleString()}명
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-600 font-mono min-w-[50px] text-right">
                  {item.count}회
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            데이터가 없습니다
          </div>
        )}
      </div>
    );
  };

  const OrganizationTable: React.FC<{ 
    data: Array<{ name: string; total: number; count: number; city: string }>;
  }> = ({ data }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">수요처별 참여 현황</h2>
      {data.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">순위</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">수요처명</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">시/군</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">횟수</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">총 참여인원</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-[200px] truncate" title={item.name}>
                    {item.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {item.city || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right font-mono">
                    {item.count}회
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right font-mono">
                    {item.total.toLocaleString()}명
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex items-center justify-center h-32 text-gray-500">
          데이터가 없습니다
        </div>
      )}
    </div>
  );

  const filteredCityData = stats.cityData.filter(item => {
    if(regionFilter === '전체') return true;
    if(regionFilter === '남부') return SOUTH_CITIES.includes(item.name);
    if(regionFilter === '북부') return NORTH_CITIES.includes(item.name);
    return true;
  });

  const selectedCityOrganizations = stats.organizationData.filter(org => org.city === selectedCity);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">대시보드</h1>
        <p className="text-gray-600">수요처 및 실적 현황 개요</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="등록 단체수"
          value={stats.totalOrganizations.toString()}
          icon={Building2}
          color="bg-blue-500"
        />
        <StatCard
          title="총 횟수"
          value={performances.length.toString()}
          icon={Calendar}
          color="bg-green-500"
        />
        <StatCard
          title="총 참여 인원"
          value={stats.totalPeople.toLocaleString() + '명'}
          icon={Users}
          color="bg-purple-500"
        />
        <StatCard
          title="평균 참여 인원"
          value={performances.length > 0 ? Math.round(stats.totalPeople / performances.length).toLocaleString() + '명' : '0명'}
          icon={BarChart3}
          color="bg-orange-500"
        />
      </div>

      {/* 기간 필터 UI */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <label className="block text-sm font-medium text-gray-700">시작 날짜</label>
          <input type="date" className="border rounded px-2 py-1" value={dateFilter.startDate ? dateFilter.startDate.toISOString().split('T')[0] : ''} onChange={e => setDateFilter(f => ({ ...f, startDate: e.target.value ? new Date(e.target.value) : undefined }))} />
          <label className="block text-sm font-medium text-gray-700">종료 날짜</label>
          <input type="date" className="border rounded px-2 py-1" value={dateFilter.endDate ? dateFilter.endDate.toISOString().split('T')[0] : ''} onChange={e => setDateFilter(f => ({ ...f, endDate: e.target.value ? new Date(e.target.value) : undefined }))} />
          <button className="ml-2 px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 text-sm" onClick={() => setDateFilter({})}>전체 초기화</button>
        </div>
      </div>

      {/* 예산 사용 현황 테이블 (드래그&드롭, 삭제, UI 개선) */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={budgetItems.map(b => b.id)} strategy={verticalListSortingStrategy}>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">예산 사용 현황</h2>
              <button className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={handleAddBudget}>+ 예산 항목 추가</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-center"></th>
                    <th className="px-2 py-2 text-left">예산명</th>
                    <th className="px-2 py-2 text-right">예산액</th>
                    <th className="px-2 py-2 text-right">사용액</th>
                    <th className="px-2 py-2 text-right">잔액</th>
                    <th className="px-2 py-2 text-right">집행율(%)</th>
                    <th className="px-2 py-2 text-center">수정</th>
                    <th className="px-2 py-2 text-center">삭제</th>
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

      {/* 예산 사용 내역 리스트 UI 제거 */}

      {/* 시/군별 통계 - 전체 화면 너비 사용 */}
      <div className="mb-8">
        <CityBarChart data={filteredCityData} onBarClick={cityName => { setSelectedCity(cityName); setShowPopup(true); }} />
      </div>

      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 relative animate-fadeIn">
            <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl" onClick={()=>setShowPopup(false)}>&times;</button>
            <h3 className="text-2xl font-bold mb-4 text-blue-700">{selectedCity} 수요처별 참여 현황</h3>
            {selectedCityOrganizations.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-2 py-2 text-left">수요처명</th>
                    <th className="px-2 py-2 text-right">횟수</th>
                    <th className="px-2 py-2 text-right">총 참여인원</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCityOrganizations.map((org, idx) => (
                    <tr key={idx} className="hover:bg-blue-50">
                      <td className="px-2 py-2 font-medium text-gray-900">{org.name}</td>
                      <td className="px-2 py-2 text-right">{org.count}회</td>
                      <td className="px-2 py-2 text-right">{org.total.toLocaleString()}명</td>
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
    </div>
  );
};

// BudgetRow 컴포넌트 정의 (드래그핸들, 삭제, 수정, UI 개선)
function BudgetRow({ item, editingBudgetId, editingBudgetName, editingBudgetAmount, setEditingBudgetName, setEditingBudgetAmount, setEditingBudgetId, handleEditBudget, handleSaveBudget, handleDeleteBudget, used, isDragging }: any) {
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
            <span>{item.name}</span>
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