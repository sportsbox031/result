import React, { useState, useEffect, useMemo } from 'react';
import { BudgetItem, BudgetUsage } from '../types';
import { firebaseStorage } from '../utils/firebaseStorage';
import {
  Plus,
  Trash2,
  Save,
  X,
  Search,
  Download,
  Calendar,
  CreditCard,
  FileText,
  MapPin,
  Wallet
} from 'lucide-react';
import { downloadBudgetUsageExcel } from '../utils/excel';
import { AVAILABLE_YEARS, CURRENT_YEAR, getBudgetUsageYear } from '../utils/yearUtils';

const BudgetUsagePage: React.FC = () => {
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [budgetUsages, setBudgetUsages] = useState<BudgetUsage[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<BudgetUsage>>({});
  const [regionFilter, setRegionFilter] = useState<'전체' | '남부' | '북부'>('전체');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_YEAR);
  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState<Partial<BudgetUsage>>({
    budgetItemId: '', description: '', vendor: '', amount: 0, date: '', paymentMethod: '', note: ''
  });

  useEffect(() => {
    const unsubBudgets = firebaseStorage.subscribeToBudgets(setBudgetItems);
    const unsubUsages = firebaseStorage.subscribeToBudgetUsages(setBudgetUsages);
    return () => { unsubBudgets(); unsubUsages(); };
  }, []);

  const yearFilteredBudgetItems = useMemo(() =>
    budgetItems.filter(item => (item.year ?? 2025) === selectedYear),
    [budgetItems, selectedYear]
  );

  const filteredBudgetItems = useMemo(() => {
    if (regionFilter === '전체') return yearFilteredBudgetItems;
    return yearFilteredBudgetItems.filter(item => item.region === regionFilter);
  }, [yearFilteredBudgetItems, regionFilter]);

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
        return (
          u.description?.toLowerCase().includes(term) ||
          u.vendor?.toLowerCase().includes(term) ||
          budgetItem?.name?.toLowerCase().includes(term) ||
          u.note?.toLowerCase().includes(term)
        );
      });
    }
    return [...result].sort((a, b) => {
      if (a.date && b.date) return new Date(b.date).getTime() - new Date(a.date).getTime();
      return b.id.localeCompare(a.id);
    });
  }, [yearFilteredBudgetUsages, regionFilter, searchTerm, yearFilteredBudgetItems, budgetItems]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editingId) { setEditingId(null); setEditForm({}); }
        if (adding) { setAdding(false); resetAddForm(); }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editingId, adding]);

  const resetAddForm = () => {
    setAddForm({
      budgetItemId: filteredBudgetItems[0]?.id || '',
      description: '', vendor: '', amount: 0, date: '', paymentMethod: '', note: ''
    });
  };

  const handleAddUsage = () => {
    setAdding(true);
    setAddForm({
      budgetItemId: filteredBudgetItems[0]?.id || yearFilteredBudgetItems[0]?.id || '',
      description: '', vendor: '', amount: 0, date: '', paymentMethod: '', note: ''
    });
  };

  const handleEdit = (usage: BudgetUsage) => {
    setEditingId(usage.id);
    setEditForm({ ...usage });
  };

  const handleSave = async () => {
    if (!editingId) return;
    await firebaseStorage.updateBudgetUsage(editingId, editForm);
    setEditingId(null);
    setEditForm({});
  };

  const handleDelete = async () => {
    if (!editingId) return;
    if (!window.confirm('이 내역을 삭제하시겠습니까?')) return;
    await firebaseStorage.deleteBudgetUsage(editingId);
    setEditingId(null);
    setEditForm({});
  };

  const handleChange = (field: keyof BudgetUsage, value: any) => {
    setEditForm(f => ({ ...f, [field]: value }));
  };

  const handleAddSave = async () => {
    await firebaseStorage.addBudgetUsage(addForm as Omit<BudgetUsage, 'id'>);
    setAdding(false);
    resetAddForm();
  };

  const handleAddChange = (field: keyof BudgetUsage, value: any) => {
    setAddForm(f => ({ ...f, [field]: value }));
  };

  const totalAmount = filteredUsages.reduce((sum, u) => sum + Number(u.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">예산 사용 내역</h1>
        <p className="text-gray-500 mt-1">예산 집행 내역을 관리하세요</p>
      </div>

      {/* 필터 패널 */}
      <div className="glass-card p-5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* 연도 선택 */}
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">연도</span>
            <div className="flex gap-2">
              {AVAILABLE_YEARS.map(year => (
                <button
                  key={year}
                  className={`btn-glass ${selectedYear === year ? 'active' : ''}`}
                  onClick={() => setSelectedYear(year)}
                >
                  {year}년
                </button>
              ))}
            </div>
          </div>

          <div className="hidden lg:block w-px h-8 bg-gray-200" />

          {/* 지역 필터 */}
          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">지역</span>
            <div className="flex gap-2">
              {(['전체', '남부', '북부'] as const).map(region => (
                <button
                  key={region}
                  className={`btn-glass ${regionFilter === region ? 'active' : ''}`}
                  onClick={() => setRegionFilter(region)}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 검색 및 액션 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="적요, 채주, 예산명 검색..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="input-glass pl-11 w-full"
          />
        </div>
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
      <div className="glass p-4 rounded-2xl">
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
        <div className="glass-card p-6 border-2 border-blue-200 animate-slideIn">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-500" />
            새 내역 추가
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">예산명</label>
              <select
                className="select-glass w-full"
                value={addForm.budgetItemId}
                onChange={e => handleAddChange('budgetItemId', e.target.value)}
              >
                {(regionFilter === '전체' ? yearFilteredBudgetItems : filteredBudgetItems).map(item => (
                  <option key={item.id} value={item.id}>{item.name}{item.region ? ` (${item.region})` : ''}</option>
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
                <option value="계좌입금">계좌입금</option>
                <option value="카드결제">카드결제</option>
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

      {/* 내역 목록 */}
      <div className="glass-card overflow-hidden">
        {filteredUsages.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table-glass">
              <thead>
                <tr>
                  <th>예산명</th>
                  <th>적요</th>
                  <th>채주</th>
                  <th className="text-right">집행액</th>
                  <th className="text-center">집행일자</th>
                  <th className="text-center">결제방법</th>
                  <th>메모</th>
                  <th className="text-center w-24">작업</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsages.map(usage => {
                  const isEditing = editingId === usage.id;
                  const budgetItem = budgetItems.find(b => b.id === (isEditing ? editForm.budgetItemId : usage.budgetItemId));

                  return (
                    <tr
                      key={usage.id}
                      className={`${isEditing ? 'bg-blue-50/50' : 'cursor-pointer'}`}
                      onClick={() => !isEditing && handleEdit(usage)}
                    >
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <select
                            className="select-glass text-sm"
                            value={editForm.budgetItemId}
                            onChange={e => handleChange('budgetItemId', e.target.value)}
                            onClick={e => e.stopPropagation()}
                          >
                            {yearFilteredBudgetItems.map(item => (
                              <option key={item.id} value={item.id}>{item.name}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{budgetItem?.name || '-'}</span>
                            {budgetItem?.region && (
                              <span className={`badge ${budgetItem.region === '남부' ? 'badge-blue' : 'badge-emerald'}`}>
                                {budgetItem.region}
                              </span>
                            )}
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
                            <option value="계좌입금">계좌입금</option>
                            <option value="카드결제">카드결제</option>
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
          <div className="text-center py-16">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-400">등록된 내역이 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetUsagePage;
