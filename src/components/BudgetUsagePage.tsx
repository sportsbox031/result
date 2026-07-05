import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BudgetItem, BudgetUsage } from '../types';
import { firebaseStorage } from '../utils/firebaseStorage';
import { useFirebaseData } from '../hooks/useFirebaseData';
import { useToast } from '../hooks/useToast';
import { Plus, Trash2, Save, X, Download, Calendar, FileText, MapPin, Wallet } from 'lucide-react';
import { downloadBudgetUsageExcel } from '../utils/excel';
import { AVAILABLE_YEARS, CURRENT_YEAR, getBudgetUsageYear } from '../utils/yearUtils';
import { buildBudgetHierarchy, getBudgetHierarchyInfo, sortBudgetItemsByOrder } from '../utils/budgetHierarchy';
import { PAYMENT_METHODS } from '../constants';
import SegmentedFilter from './common/SegmentedFilter';
import SearchInput from './common/SearchInput';
import EmptyState from './common/EmptyState';
import RegionBadge from './common/RegionBadge';

const getInitialBudgetSelection = (items: BudgetItem[], preferredBudgetId?: string) => {
  if (!items.length) {
    return { budgetItemId: '', bimo: '', semok: '' };
  }

  const selectedItem = items.find((item) => item.id === preferredBudgetId) ?? items[0];
  const { bimo, semok } = getBudgetHierarchyInfo(selectedItem);
  return { budgetItemId: selectedItem.id, bimo, semok };
};

const BudgetUsagePage: React.FC = () => {
  const { budgetItems, budgetUsages } = useFirebaseData();
  const { addToast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<BudgetUsage>>({});
  const [regionFilter, setRegionFilter] = useState<'전체' | '남부' | '북부'>('전체');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_YEAR);
  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState<Partial<BudgetUsage>>({
    budgetItemId: '', description: '', vendor: '', amount: 0, date: '', paymentMethod: '', note: ''
  });
  const [addBimo, setAddBimo] = useState('');
  const [addSemok, setAddSemok] = useState('');
  const [editBimo, setEditBimo] = useState('');
  const [editSemok, setEditSemok] = useState('');

  const yearFilteredBudgetItems = useMemo(() =>
    budgetItems.filter(item => (item.year ?? 2025) === selectedYear),
    [budgetItems, selectedYear]
  );

  const filteredBudgetItems = useMemo(() => {
    if (regionFilter === '전체') return yearFilteredBudgetItems;
    return yearFilteredBudgetItems.filter(item => item.region === regionFilter);
  }, [yearFilteredBudgetItems, regionFilter]);

  const selectableBudgetItems = useMemo(
    () => sortBudgetItemsByOrder(regionFilter === '전체' ? yearFilteredBudgetItems : filteredBudgetItems),
    [regionFilter, yearFilteredBudgetItems, filteredBudgetItems]
  );
  const selectableBudgetHierarchy = useMemo(
    () => buildBudgetHierarchy(selectableBudgetItems),
    [selectableBudgetItems]
  );
  const editableBudgetItems = useMemo(
    () => sortBudgetItemsByOrder(yearFilteredBudgetItems),
    [yearFilteredBudgetItems]
  );
  const editableBudgetHierarchy = useMemo(
    () => buildBudgetHierarchy(editableBudgetItems),
    [editableBudgetItems]
  );

  const addSemokOptions = useMemo(() => {
    const bimoGroup = selectableBudgetHierarchy.find((group) => group.bimo === addBimo);
    return bimoGroup?.semokGroups ?? [];
  }, [selectableBudgetHierarchy, addBimo]);

  const addBudgetNameOptions = useMemo(() => {
    const semokGroup = addSemokOptions.find((group) => group.semok === addSemok);
    return semokGroup?.items ?? [];
  }, [addSemokOptions, addSemok]);

  const editSemokOptions = useMemo(() => {
    const bimoGroup = editableBudgetHierarchy.find((group) => group.bimo === editBimo);
    return bimoGroup?.semokGroups ?? [];
  }, [editableBudgetHierarchy, editBimo]);

  const editBudgetNameOptions = useMemo(() => {
    const semokGroup = editSemokOptions.find((group) => group.semok === editSemok);
    return semokGroup?.items ?? [];
  }, [editSemokOptions, editSemok]);

  // 연도별로 예산 사용 내역 필터링
  const yearFilteredBudgetUsages = useMemo(() =>
    budgetUsages.filter(usage => usage.date && getBudgetUsageYear(usage.date) === selectedYear),
    [budgetUsages, selectedYear]
  );

  const filteredUsages = useMemo(() => {
    let result = yearFilteredBudgetUsages;
    if (regionFilter !== '전체') {
      const regionBudgetIds = yearFilteredBudgetItems.filter(b => b.region === regionFilter).map(b => b.id);
      result = result.filter(u => regionBudgetIds.includes(u.budgetItemId));
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(u => {
        const budgetItem = budgetItems.find(b => b.id === u.budgetItemId);
        const budgetHierarchy = budgetItem ? getBudgetHierarchyInfo(budgetItem) : null;
        return (
          u.description?.toLowerCase().includes(term) ||
          u.vendor?.toLowerCase().includes(term) ||
          budgetItem?.name?.toLowerCase().includes(term) ||
          budgetHierarchy?.detailName.toLowerCase().includes(term) ||
          budgetHierarchy?.bimo.toLowerCase().includes(term) ||
          budgetHierarchy?.semok.toLowerCase().includes(term) ||
          u.note?.toLowerCase().includes(term)
        );
      });
    }
    return [...result].sort((a, b) => {
      if (a.date && b.date) return new Date(b.date).getTime() - new Date(a.date).getTime();
      return b.id.localeCompare(a.id);
    });
  }, [yearFilteredBudgetUsages, regionFilter, searchTerm, yearFilteredBudgetItems, budgetItems]);

  const resetAddForm = useCallback(() => {
    const initialSelection = getInitialBudgetSelection(selectableBudgetItems);
    setAddBimo(initialSelection.bimo);
    setAddSemok(initialSelection.semok);
    setAddForm({
      budgetItemId: initialSelection.budgetItemId,
      description: '', vendor: '', amount: 0, date: '', paymentMethod: '', note: ''
    });
  }, [selectableBudgetItems]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editingId) { setEditingId(null); setEditForm({}); }
        if (adding) { setAdding(false); resetAddForm(); }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editingId, adding, resetAddForm]);

  const handleAddUsage = () => {
    const initialSelection = getInitialBudgetSelection(selectableBudgetItems);
    setAddBimo(initialSelection.bimo);
    setAddSemok(initialSelection.semok);
    setAdding(true);
    setAddForm({
      budgetItemId: initialSelection.budgetItemId,
      description: '', vendor: '', amount: 0, date: '', paymentMethod: '', note: ''
    });
  };

  const handleEdit = (usage: BudgetUsage) => {
    const initialSelection = getInitialBudgetSelection(editableBudgetItems, usage.budgetItemId);
    setEditBimo(initialSelection.bimo);
    setEditSemok(initialSelection.semok);
    setEditingId(usage.id);
    setEditForm({ ...usage });
  };

  useEffect(() => {
    if (!adding) return;
    const initialSelection = getInitialBudgetSelection(selectableBudgetItems, addForm.budgetItemId);

    if (addForm.budgetItemId !== initialSelection.budgetItemId) {
      setAddForm((prev) => ({ ...prev, budgetItemId: initialSelection.budgetItemId }));
    }
    setAddBimo(initialSelection.bimo);
    setAddSemok(initialSelection.semok);
  }, [adding, selectableBudgetItems, addForm.budgetItemId]);

  useEffect(() => {
    if (!editingId) return;
    const initialSelection = getInitialBudgetSelection(editableBudgetItems, editForm.budgetItemId);

    if (editForm.budgetItemId !== initialSelection.budgetItemId) {
      setEditForm((prev) => ({ ...prev, budgetItemId: initialSelection.budgetItemId }));
    }
    setEditBimo(initialSelection.bimo);
    setEditSemok(initialSelection.semok);
  }, [editingId, editableBudgetItems, editForm.budgetItemId]);

  const handleSave = async () => {
    if (!editingId) return;
    try {
      await firebaseStorage.updateBudgetUsage(editingId, editForm);
      setEditingId(null);
      setEditForm({});
      addToast({ type: 'success', title: '수정 완료', message: '예산 사용 내역이 수정되었습니다' });
    } catch (error) {
      console.error('예산 사용 내역 수정 실패:', error);
      addToast({ type: 'error', title: '수정 실패', message: '예산 사용 내역 수정 중 오류가 발생했습니다' });
    }
  };

  const handleDelete = async () => {
    if (!editingId) return;
    if (!window.confirm('이 내역을 삭제하시겠습니까?')) return;
    try {
      await firebaseStorage.deleteBudgetUsage(editingId);
      setEditingId(null);
      setEditForm({});
      addToast({ type: 'success', title: '삭제 완료', message: '예산 사용 내역이 삭제되었습니다' });
    } catch (error) {
      console.error('예산 사용 내역 삭제 실패:', error);
      addToast({ type: 'error', title: '삭제 실패', message: '예산 사용 내역 삭제 중 오류가 발생했습니다' });
    }
  };

  const handleChange = <K extends keyof BudgetUsage>(field: K, value: BudgetUsage[K]) => {
    setEditForm(f => ({ ...f, [field]: value }));
  };

  const handleAddSave = async () => {
    if (!addForm.budgetItemId) {
      addToast({ type: 'warning', title: '입력 오류', message: '선택 가능한 세세목(예산명)이 없습니다' });
      return;
    }
    try {
      await firebaseStorage.addBudgetUsage(addForm as Omit<BudgetUsage, 'id'>);
      setAdding(false);
      resetAddForm();
      addToast({ type: 'success', title: '추가 완료', message: '예산 사용 내역이 추가되었습니다' });
    } catch (error) {
      console.error('예산 사용 내역 추가 실패:', error);
      addToast({ type: 'error', title: '추가 실패', message: '예산 사용 내역 추가 중 오류가 발생했습니다' });
    }
  };

  const handleAddChange = <K extends keyof BudgetUsage>(field: K, value: BudgetUsage[K]) => {
    setAddForm(f => ({ ...f, [field]: value }));
  };

  const handleAddBimoChange = (nextBimo: string) => {
    const nextBimoGroup = selectableBudgetHierarchy.find((group) => group.bimo === nextBimo);
    const nextSemokGroup = nextBimoGroup?.semokGroups[0];
    const nextBudgetItem = nextSemokGroup?.items[0];

    setAddBimo(nextBimo);
    setAddSemok(nextSemokGroup?.semok ?? '');
    handleAddChange('budgetItemId', nextBudgetItem?.id ?? '');
  };

  const handleAddSemokChange = (nextSemok: string) => {
    const nextSemokGroup = addSemokOptions.find((group) => group.semok === nextSemok);
    const nextBudgetItem = nextSemokGroup?.items[0];

    setAddSemok(nextSemok);
    handleAddChange('budgetItemId', nextBudgetItem?.id ?? '');
  };

  const handleAddBudgetItemChange = (budgetItemId: string) => {
    const selectedItem = selectableBudgetItems.find((item) => item.id === budgetItemId);
    if (selectedItem) {
      const { bimo, semok } = getBudgetHierarchyInfo(selectedItem);
      setAddBimo(bimo);
      setAddSemok(semok);
    }
    handleAddChange('budgetItemId', budgetItemId);
  };

  const handleEditBimoChange = (nextBimo: string) => {
    const nextBimoGroup = editableBudgetHierarchy.find((group) => group.bimo === nextBimo);
    const nextSemokGroup = nextBimoGroup?.semokGroups[0];
    const nextBudgetItem = nextSemokGroup?.items[0];

    setEditBimo(nextBimo);
    setEditSemok(nextSemokGroup?.semok ?? '');
    handleChange('budgetItemId', nextBudgetItem?.id ?? '');
  };

  const handleEditSemokChange = (nextSemok: string) => {
    const nextSemokGroup = editSemokOptions.find((group) => group.semok === nextSemok);
    const nextBudgetItem = nextSemokGroup?.items[0];

    setEditSemok(nextSemok);
    handleChange('budgetItemId', nextBudgetItem?.id ?? '');
  };

  const handleEditBudgetItemChange = (budgetItemId: string) => {
    const selectedItem = editableBudgetItems.find((item) => item.id === budgetItemId);
    if (selectedItem) {
      const { bimo, semok } = getBudgetHierarchyInfo(selectedItem);
      setEditBimo(bimo);
      setEditSemok(semok);
    }
    handleChange('budgetItemId', budgetItemId);
  };

  // 총 집행액 계산
  const totalAmount = filteredUsages.reduce((sum, u) => sum + Number(u.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">예산 사용 내역</h1>
        <p className="text-gray-500 mt-1">예산 집행 내역을 관리하세요</p>
      </div>

      {/* 연도 + 지역 필터 */}
      <div className="glass-card rounded-2xl p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* 연도 선택 */}
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">연도</span>
            <SegmentedFilter
              options={AVAILABLE_YEARS.map(year => ({ value: year, label: `${year}년` }))}
              value={selectedYear}
              onChange={setSelectedYear}
            />
          </div>

          <div className="hidden lg:block w-px h-8 bg-gray-200" />

          {/* 지역 필터 */}
          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">지역</span>
            <SegmentedFilter
              options={['전체', '남부', '북부'] as const}
              value={regionFilter}
              onChange={setRegionFilter}
            />
          </div>
        </div>
      </div>

      {/* 검색 및 액션 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="적요, 채주, 비목/세목/예산명 검색..."
          className="w-full sm:w-80"
        />
        <div className="flex gap-2">
          <button className="btn-primary flex items-center gap-2" onClick={handleAddUsage}>
            <Plus className="w-4 h-4" /> 내역 추가
          </button>
          <button
            className="btn-secondary flex items-center gap-2"
            onClick={() => downloadBudgetUsageExcel(filteredUsages, yearFilteredBudgetItems)}
          >
            <Download className="w-4 h-4" /> 엑셀
          </button>
        </div>
      </div>

      {/* 요약 정보 */}
      <div className="glass-panel rounded-xl p-4 mb-6">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">총 건수</p>
              <p className="text-lg font-bold text-gray-900">{filteredUsages.length}건</p>
            </div>
          </div>
          <div className="w-px h-10 bg-gray-200" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">총 집행액</p>
              <p className="text-lg font-bold text-blue-600">{totalAmount.toLocaleString()}원</p>
            </div>
          </div>
        </div>
      </div>

      {/* 추가 폼 */}
      {adding && (
        <div className="glass-form rounded-2xl p-6 mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">새 내역 추가</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">비목</label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500"
                value={addBimo}
                onChange={e => handleAddBimoChange(e.target.value)}
              >
                {selectableBudgetHierarchy.length === 0 && <option value="">선택 가능한 비목 없음</option>}
                {selectableBudgetHierarchy.map(group => (
                  <option key={group.bimo} value={group.bimo}>{group.bimo}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">세목</label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500"
                value={addSemok}
                onChange={e => handleAddSemokChange(e.target.value)}
              >
                {addSemokOptions.length === 0 && <option value="">선택 가능한 세목 없음</option>}
                {addSemokOptions.map(group => (
                  <option key={group.semok} value={group.semok}>{group.semok}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">세세목(예산명)</label>
              <select
                className="select-glass w-full"
                value={addForm.budgetItemId}
                onChange={e => handleAddBudgetItemChange(e.target.value)}
              >
                {addBudgetNameOptions.length === 0 && <option value="">선택 가능한 예산명 없음</option>}
                {addBudgetNameOptions.map(item => (
                  <option key={item.id} value={item.id}>
                    {getBudgetHierarchyInfo(item).detailName}{item.region ? ` (${item.region})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-2">적요</label>
              <input
                className="input-glass"
                value={addForm.description || ''}
                onChange={e => handleAddChange('description', e.target.value)}
                placeholder="내용 입력..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">채주</label>
              <input
                className="input-glass"
                value={addForm.vendor || ''}
                onChange={e => handleAddChange('vendor', e.target.value)}
                placeholder="거래처명"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">집행액</label>
              <input
                type="text"
                className="input-glass text-right"
                value={addForm.amount ? Number(addForm.amount).toLocaleString() : ''}
                onChange={e => {
                  const raw = e.target.value.replace(/,/g, '');
                  if (!isNaN(Number(raw))) handleAddChange('amount', Number(raw));
                }}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">집행일자</label>
              <input
                type="date"
                className="input-glass"
                value={addForm.date || ''}
                onChange={e => handleAddChange('date', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">결제방법</label>
              <select
                className="select-glass w-full"
                value={addForm.paymentMethod || ''}
                onChange={e => handleAddChange('paymentMethod', e.target.value)}
              >
                <option value="">선택</option>
                {PAYMENT_METHODS.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">메모</label>
              <input
                className="input-glass"
                value={addForm.note || ''}
                onChange={e => handleAddChange('note', e.target.value)}
                placeholder="비고"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button className="btn-secondary" onClick={() => { setAdding(false); resetAddForm(); }}>
              취소
            </button>
            <button className="btn-primary" onClick={handleAddSave}>
              저장
            </button>
          </div>
        </div>
      )}

      {/* 내역 테이블 */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {filteredUsages.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table-glass">
              <thead>
                <tr className="bg-white/40 border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">예산명</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">적요</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">채주</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">집행액</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">집행일자</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">결제방법</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">메모</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">작업</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsages.map(usage => {
                  const isEditing = editingId === usage.id;
                  const budgetItem = budgetItems.find(b => b.id === (isEditing ? editForm.budgetItemId : usage.budgetItemId));
                  const budgetHierarchy = budgetItem ? getBudgetHierarchyInfo(budgetItem) : null;

                  return (
                    <tr
                      key={usage.id}
                      className={`transition-colors ${isEditing ? 'bg-blue-50' : 'hover:bg-white/40 cursor-pointer'}`}
                      onClick={() => !isEditing && handleEdit(usage)}
                    >
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <div className="space-y-1">
                            <select
                              className="w-full px-2 py-1 rounded border border-gray-300 text-xs focus:ring-2 focus:ring-blue-500"
                              value={editBimo}
                              onChange={e => handleEditBimoChange(e.target.value)}
                              onClick={e => e.stopPropagation()}
                            >
                              {editableBudgetHierarchy.length === 0 && <option value="">비목 없음</option>}
                              {editableBudgetHierarchy.map(group => (
                                <option key={group.bimo} value={group.bimo}>{group.bimo}</option>
                              ))}
                            </select>
                            <select
                              className="w-full px-2 py-1 rounded border border-gray-300 text-xs focus:ring-2 focus:ring-blue-500"
                              value={editSemok}
                              onChange={e => handleEditSemokChange(e.target.value)}
                              onClick={e => e.stopPropagation()}
                            >
                              {editSemokOptions.length === 0 && <option value="">세목 없음</option>}
                              {editSemokOptions.map(group => (
                                <option key={group.semok} value={group.semok}>{group.semok}</option>
                              ))}
                            </select>
                            <select
                              className="w-full px-2 py-1 rounded border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500"
                              value={editForm.budgetItemId}
                              onChange={e => handleEditBudgetItemChange(e.target.value)}
                              onClick={e => e.stopPropagation()}
                            >
                              {editBudgetNameOptions.length === 0 && <option value="">예산명 없음</option>}
                              {editBudgetNameOptions.map(item => (
                                <option key={item.id} value={item.id}>
                                  {getBudgetHierarchyInfo(item).detailName}{item.region ? ` (${item.region})` : ''}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-900">{budgetHierarchy?.detailName || '-'}</span>
                              {budgetHierarchy && (
                                <span className="text-xs text-gray-400">
                                  {budgetHierarchy.bimo} / {budgetHierarchy.semok}
                                </span>
                              )}
                            </div>
                            <RegionBadge region={budgetItem?.region} />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            className="input-glass text-sm"
                            value={editForm.description || ''}
                            onChange={e => handleChange('description', e.target.value)}
                            onClick={e => e.stopPropagation()}
                          />
                        ) : (
                          <span className="text-gray-700">{usage.description || '-'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            className="input-glass text-sm"
                            value={editForm.vendor || ''}
                            onChange={e => handleChange('vendor', e.target.value)}
                            onClick={e => e.stopPropagation()}
                          />
                        ) : (
                          <span className="text-gray-600">{usage.vendor || '-'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isEditing ? (
                          <input
                            type="text"
                            className="input-glass text-sm text-right w-28"
                            value={editForm.amount ? Number(editForm.amount).toLocaleString() : ''}
                            onChange={e => {
                              const raw = e.target.value.replace(/,/g, '');
                              if (!isNaN(Number(raw))) handleChange('amount', Number(raw));
                            }}
                            onClick={e => e.stopPropagation()}
                          />
                        ) : (
                          <span className="font-semibold text-blue-600">{usage.amount.toLocaleString()}원</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isEditing ? (
                          <input
                            type="date"
                            className="input-glass text-sm"
                            value={editForm.date || ''}
                            onChange={e => handleChange('date', e.target.value)}
                            onClick={e => e.stopPropagation()}
                          />
                        ) : (
                          <span className="text-gray-600">{usage.date || '-'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isEditing ? (
                          <select
                            className="select-glass text-sm"
                            value={editForm.paymentMethod || ''}
                            onChange={e => handleChange('paymentMethod', e.target.value)}
                            onClick={e => e.stopPropagation()}
                          >
                            <option value="">선택</option>
                            {PAYMENT_METHODS.map(method => (
                              <option key={method} value={method}>{method}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`badge ${usage.paymentMethod === '카드결제' ? 'badge-violet' : usage.paymentMethod === '계좌입금' ? 'badge-emerald' : 'badge-gray'}`}>
                            {usage.paymentMethod || '-'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            className="input-glass text-sm"
                            value={editForm.note || ''}
                            onChange={e => handleChange('note', e.target.value)}
                            onClick={e => e.stopPropagation()}
                          />
                        ) : (
                          <span className="text-gray-500 text-sm">{usage.note || '-'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1" onClick={e => e.stopPropagation()}>
                            <button className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" onClick={handleSave} title="저장">
                              <Save className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" onClick={handleDelete} title="삭제">
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors" onClick={() => { setEditingId(null); setEditForm({}); }} title="취소">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">클릭하여 수정</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={Calendar} title="등록된 내역이 없습니다" />
        )}
      </div>
    </div>
  );
};

export default BudgetUsagePage;
