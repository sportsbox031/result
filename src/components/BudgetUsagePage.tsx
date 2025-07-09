import React, { useState, useEffect } from 'react';
import { BudgetItem, BudgetUsage } from '../types';
import { firebaseStorage } from '../utils/firebaseStorage';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';

const BudgetUsagePage: React.FC = () => {
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [budgetUsages, setBudgetUsages] = useState<BudgetUsage[]>([]);
  const [editingId, setEditingId] = useState<string|null>(null);
  const [editForm, setEditForm] = useState<Partial<BudgetUsage>>({});
  const [budgetSearch, setBudgetSearch] = useState('');
  const filteredBudgetItems = budgetItems
    .filter(item => item.name.includes(budgetSearch))
    .sort((a, b) => b.name.localeCompare(a.name, 'ko'));
  // 최신순 정렬 (집행일자 기준, 없으면 id 기준)
  const sortedBudgetUsages = [...budgetUsages].sort((a, b) => {
    if (a.date && b.date) {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    return b.id.localeCompare(a.id);
  });
  // 추가 내역 입력 상태
  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState<Partial<BudgetUsage>>({
    budgetItemId: budgetItems[0]?.id || '',
    description: '', vendor: '', amount: 0, date: '', paymentMethod: '', note: ''
  });

  useEffect(() => {
    const unsubBudgets = firebaseStorage.subscribeToBudgets(setBudgetItems);
    const unsubUsages = firebaseStorage.subscribeToBudgetUsages(setBudgetUsages);
    return () => { unsubBudgets(); unsubUsages(); };
  }, []);

  const handleAddUsage = () => {
    setAdding(true);
    setAddForm({
      budgetItemId: budgetItems[0]?.id || '',
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
    setAddForm({ budgetItemId: budgetItems[0]?.id || '', description: '', vendor: '', amount: 0, date: '', paymentMethod: '', note: '' });
  };
  const handleAddChange = (field: keyof BudgetUsage, value: any) => {
    setAddForm(f => ({ ...f, [field]: value }));
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-2">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">예산 사용 내역</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition" onClick={handleAddUsage}>
          <Plus className="w-4 h-4" /> 내역 추가
        </button>
      </div>
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          className="border rounded px-3 py-2 w-64"
          placeholder="예산명 검색..."
          value={budgetSearch}
          onChange={e => setBudgetSearch(e.target.value)}
        />
      </div>
      <div className="grid gap-4">
        {/* 추가 내역 입력 카드 (맨 위) */}
        {adding && (
          <div className="rounded-xl shadow-md border-2 border-blue-300 bg-white ring-2 ring-blue-400 overflow-x-auto">
            <div className="flex flex-col md:flex-row md:flex-wrap md:items-center gap-4 p-6 min-w-[1200px] max-w-full">
              {/* 예산명/지역 */}
              <div className="flex-1 min-w-[120px]">
                <label className="block text-xs font-medium text-gray-500 mb-1">예산명</label>
                <select
                  className="border rounded px-2 py-1 w-full"
                  value={addForm.budgetItemId}
                  onChange={e => handleAddChange('budgetItemId', e.target.value)}
                >
                  {filteredBudgetItems.map(item => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </div>
              {/* 적요 */}
              <div className="flex-[2] min-w-[220px]">
                <label className="block text-xs font-medium text-gray-500 mb-1">적요</label>
                <input className="border rounded px-2 py-1 w-full" value={addForm.description || ''} onChange={e => handleAddChange('description', e.target.value)} />
              </div>
              {/* 채주 */}
              <div className="flex-1 min-w-[80px]">
                <label className="block text-xs font-medium text-gray-500 mb-1">채주</label>
                <input className="border rounded px-2 py-1 w-full" value={addForm.vendor || ''} onChange={e => handleAddChange('vendor', e.target.value)} />
              </div>
              {/* 집행액 */}
              <div className="w-32 text-right min-w-[120px]">
                <label className="block text-xs font-medium text-gray-500 mb-1">집행액</label>
                <input
                  type="text"
                  className="border rounded px-2 py-1 w-full text-right"
                  value={addForm.amount !== undefined && addForm.amount !== null ? Number(addForm.amount).toLocaleString() : ''}
                  onChange={e => {
                    const raw = e.target.value.replace(/,/g, '');
                    if (!isNaN(Number(raw))) handleAddChange('amount', Number(raw));
                  }}
                />
              </div>
              {/* 집행일자 */}
              <div className="w-32 text-center min-w-[120px]">
                <label className="block text-xs font-medium text-gray-500 mb-1">집행일자</label>
                <input type="date" className="border rounded px-2 py-1 w-full" value={addForm.date || ''} onChange={e => handleAddChange('date', e.target.value)} />
              </div>
              {/* 결제방법 */}
              <div className="w-32 text-center min-w-[120px]">
                <label className="block text-xs font-medium text-gray-500 mb-1">결제방법</label>
                <select className="border rounded px-2 py-1 w-full" value={addForm.paymentMethod || ''} onChange={e => handleAddChange('paymentMethod', e.target.value)}>
                  <option value="">선택</option>
                  <option value="계좌입금">계좌입금</option>
                  <option value="카드결제">카드결제</option>
                </select>
              </div>
              {/* 메모 */}
              <div className="flex-1 min-w-[60px] max-w-[120px]">
                <label className="block text-xs font-medium text-gray-500 mb-1">메모</label>
                <input className="border rounded px-2 py-1 w-full" value={addForm.note || ''} onChange={e => handleAddChange('note', e.target.value)} />
              </div>
              {/* 저장/취소 버튼 */}
              <div className="flex flex-col gap-2 items-center justify-center min-w-[80px]">
                <button className="p-2 bg-blue-600 text-white rounded-full shadow hover:bg-blue-700 transition" onClick={handleAddSave} title="저장">
                  <Save className="w-5 h-5" />
                </button>
                <button className="p-2 bg-gray-200 text-gray-700 rounded-full shadow hover:bg-gray-300 transition" onClick={() => setAdding(false)} title="취소">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
        {/* 기존 내역 카드들 */}
        {sortedBudgetUsages.map((usage) => {
          const isEditing = editingId === usage.id;
          const budgetItem = budgetItems.find(b => b.id === (isEditing ? editForm.budgetItemId : usage.budgetItemId));
          return (
            <div
              key={usage.id}
              className={`rounded-xl shadow-md border border-gray-100 bg-white hover:shadow-lg transition cursor-pointer relative ${isEditing ? 'ring-2 ring-blue-400' : 'hover:ring-1 hover:ring-blue-200'} overflow-x-auto`}
              onClick={() => !isEditing && handleEdit(usage)}
            >
              <div className="flex flex-col md:flex-row md:flex-wrap md:items-center gap-4 p-6 min-w-[1200px] max-w-full">
                {/* 예산명/지역 */}
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-xs font-medium text-gray-500 mb-1">예산명</label>
                  {isEditing ? (
                    <select
                      className="border rounded px-2 py-1 w-full"
                      value={editForm.budgetItemId}
                      onChange={e => handleChange('budgetItemId', e.target.value)}
                    >
                      {filteredBudgetItems.map(item => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className={
                        (budgetItem?.name.includes('북부')
                          ? 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-semibold'
                          : 'bg-gray-100 text-gray-800 px-2 py-1 rounded font-semibold')
                      }
                    >
                      {budgetItem?.name || '-'}
                    </span>
                  )}
                </div>
                {/* 적요 */}
                <div className="flex-1 min-w-[100px]">
                  {isEditing ? (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">적요</label>
                      <input className="border rounded px-2 py-1 w-full" value={editForm.description || ''} onChange={e => handleChange('description', e.target.value)} />
                    </div>
                  ) : (
                    <div className="text-gray-800 truncate" title={usage.description}>{usage.description || '-'}</div>
                  )}
                </div>
                {/* 채주 */}
                <div className="flex-1 min-w-[80px]">
                  {isEditing ? (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">채주</label>
                      <input className="border rounded px-2 py-1 w-full" value={editForm.vendor || ''} onChange={e => handleChange('vendor', e.target.value)} />
                    </div>
                  ) : (
                    <div className="text-gray-700 truncate" title={usage.vendor}>{usage.vendor || '-'}</div>
                  )}
                </div>
                {/* 집행액 */}
                <div className="w-32 text-right">
                  {isEditing ? (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">집행액</label>
                      <input
                        type="text"
                        className="border rounded px-2 py-1 w-full text-right"
                        value={editForm.amount !== undefined && editForm.amount !== null ? Number(editForm.amount).toLocaleString() : ''}
                        onChange={e => {
                          const raw = e.target.value.replace(/,/g, '');
                          if (!isNaN(Number(raw))) handleChange('amount', Number(raw));
                        }}
                      />
                    </div>
                  ) : (
                    <span className="font-bold text-blue-700">{usage.amount.toLocaleString()}원</span>
                  )}
                </div>
                {/* 회계일자 */}
                <div className="w-32 text-center">
                  {isEditing ? (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">집행일자</label>
                      <input type="date" className="border rounded px-2 py-1 w-full" value={editForm.date || ''} onChange={e => handleChange('date', e.target.value)} />
                    </div>
                  ) : (
                    <span className="text-gray-600">{usage.date || '-'}</span>
                  )}
                </div>
                {/* 결제방법 */}
                <div className="w-32 text-center">
                  {isEditing ? (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">결제방법</label>
                      <select className="border rounded px-2 py-1 w-full" value={editForm.paymentMethod || ''} onChange={e => handleChange('paymentMethod', e.target.value)}>
                        <option value="">선택</option>
                        <option value="계좌입금">계좌입금</option>
                        <option value="카드결제">카드결제</option>
                      </select>
                    </div>
                  ) : (
                    <span className="text-gray-600">{usage.paymentMethod || '-'}</span>
                  )}
                </div>
                {/* 비고 */}
                <div className="flex-1 min-w-[80px]">
                  {isEditing ? (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">메모</label>
                      <input className="border rounded px-2 py-1 w-full" value={editForm.note || ''} onChange={e => handleChange('note', e.target.value)} />
                    </div>
                  ) : (
                    <div className="text-gray-500 truncate" title={usage.note}>{usage.note || '-'}</div>
                  )}
                </div>
                {/* 저장/취소 버튼 */}
                {isEditing && (
                  <div className="flex flex-col gap-2 items-center justify-center">
                    <button className="p-2 bg-blue-600 text-white rounded-full shadow hover:bg-blue-700 transition" onClick={handleSave} title="저장">
                      <Save className="w-5 h-5" />
                    </button>
                    <button className="p-2 bg-gray-200 text-gray-700 rounded-full shadow hover:bg-gray-300 transition" onClick={() => { setEditingId(null); setEditForm({}); }} title="취소">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
              {/* 하단 삭제 버튼 */}
              {isEditing && (
                <div className="flex justify-end border-t pt-3 pb-2 px-6 bg-gray-50 rounded-b-xl">
                  <button className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg shadow hover:bg-red-600 transition" onClick={handleDelete}>
                    <Trash2 className="w-4 h-4" /> 선택된 내역 삭제
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BudgetUsagePage; 