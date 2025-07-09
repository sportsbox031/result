import React, { useState, useEffect } from 'react';
import { BudgetItem, BudgetUsage } from '../types';
import { firebaseStorage } from '../utils/firebaseStorage';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import Modal from './Modal';

const BudgetUsagePage: React.FC = () => {
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [budgetUsages, setBudgetUsages] = useState<BudgetUsage[]>([]);
  const [editingId, setEditingId] = useState<string|null>(null);
  const [editForm, setEditForm] = useState<Partial<BudgetUsage>>({});
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add'|'edit'>('add');
  // 예산명 검색 상태 추가
  const [budgetSearch, setBudgetSearch] = useState('');
  // 한글 내림차순 정렬 및 검색 적용
  const filteredBudgetItems = budgetItems
    .filter(item => item.name.includes(budgetSearch))
    .sort((a, b) => b.name.localeCompare(a.name, 'ko'));

  // 예산사용내역을 최신 저장 순서로 정렬 (date 기준, 없으면 id 기준)
  const sortedBudgetUsages = budgetUsages.sort((a, b) => {
    // date가 있으면 date 기준, 없으면 id 기준 (최신순)
    if (a.date && b.date) {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    // date가 없는 경우 id 기준 (최신순)
    return b.id.localeCompare(a.id);
  });

  useEffect(() => {
    const unsubBudgets = firebaseStorage.subscribeToBudgets(setBudgetItems);
    const unsubUsages = firebaseStorage.subscribeToBudgetUsages(setBudgetUsages);
    return () => { unsubBudgets(); unsubUsages(); };
  }, []);

  const handleAddUsage = async () => {
    if (!budgetItems[0]) return;
    await firebaseStorage.addBudgetUsage({ budgetItemId: budgetItems[0].id, description: '', vendor: '', amount: 0, date: '', paymentMethod: '', note: '' });
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
  const handleDelete = async (id: string) => {
    await firebaseStorage.deleteBudgetUsage(id);
  };
  const handleChange = (field: keyof BudgetUsage, value: any) => {
    setEditForm(f => ({ ...f, [field]: value }));
  };

  const openAddModal = () => {
    setModalMode('add');
    setEditForm({ budgetItemId: budgetItems[0]?.id, description: '', vendor: '', amount: 0, date: '', paymentMethod: '', note: '' });
    setShowModal(true);
  };
  const openEditModal = (usage: BudgetUsage) => {
    setModalMode('edit');
    setEditingId(usage.id);
    setEditForm({ ...usage });
    setShowModal(true);
  };
  const handleModalSave = async () => {
    let form = { ...editForm };
    if (!form.budgetItemId && budgetItems[0]) {
      form.budgetItemId = budgetItems[0].id;
    }
    if (modalMode === 'add') {
      await firebaseStorage.addBudgetUsage(form as Omit<BudgetUsage, 'id'>);
    } else if (modalMode === 'edit' && editingId) {
      await firebaseStorage.updateBudgetUsage(editingId, form);
    }
    setShowModal(false);
    setEditingId(null);
    setEditForm({});
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">예산 사용 내역</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition" onClick={openAddModal}>
          <Plus className="w-4 h-4" /> 내역 추가
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">예산명</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">적요</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">채주</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">집행액</th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">회계일자</th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">결제방법</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">비고</th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">관리</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {sortedBudgetUsages.map((usage) => (
              <tr key={usage.id} className="hover:bg-blue-50 transition-colors duration-150">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {budgetItems.find(b => b.id === usage.budgetItemId)?.name || '-'}
                      </div>
                    </div>
                    {(() => {
                      const region = budgetItems.find(b => b.id === usage.budgetItemId)?.region;
                      if (region === '남부') return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">남부</span>;
                      if (region === '북부') return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">북부</span>;
                      return null;
                    })()}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-xs truncate" title={usage.description}>
                    {usage.description || '-'}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-32 truncate" title={usage.vendor}>
                    {usage.vendor || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-sm font-semibold text-gray-900">
                    {usage.amount.toLocaleString()}원
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-sm text-gray-600">
                    {usage.date || '-'}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-sm text-gray-600">
                    {usage.paymentMethod || '-'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-600 max-w-xs truncate" title={usage.note}>
                    {usage.note || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <button 
                      className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-md transition-colors duration-150" 
                      onClick={() => openEditModal(usage)}
                      title="수정"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-md transition-colors duration-150" 
                      onClick={() => handleDelete(usage.id)}
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <div className="p-4 w-[400px]">
            <h2 className="text-xl font-bold mb-4">{modalMode === 'add' ? '내역 추가' : '내역 수정'}</h2>
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">예산명</label>
                <input
                  type="text"
                  className="border rounded px-2 py-1 w-full mb-2"
                  placeholder="예산명 검색..."
                  value={budgetSearch}
                  onChange={e => setBudgetSearch(e.target.value)}
                />
                <select className="border rounded px-2 py-1 w-full" value={editForm.budgetItemId} onChange={e => setEditForm(f => ({ ...f, budgetItemId: e.target.value }))}>
                  {filteredBudgetItems.map(item => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">적요</label>
                <input className="border rounded px-2 py-1 w-full" value={editForm.description || ''} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">채주</label>
                <input className="border rounded px-2 py-1 w-full" value={editForm.vendor || ''} onChange={e => setEditForm(f => ({ ...f, vendor: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">집행액</label>
                <input
                  type="text"
                  className="border rounded px-2 py-1 w-full text-right"
                  value={editForm.amount !== undefined && editForm.amount !== null ? Number(editForm.amount).toLocaleString() : ''}
                  onChange={e => {
                    const raw = e.target.value.replace(/,/g, '');
                    if (!isNaN(Number(raw))) setEditForm(f => ({ ...f, amount: Number(raw) }));
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">회계일자</label>
                <input type="date" className="border rounded px-2 py-1 w-full" value={editForm.date || ''} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">결제방법</label>
                <input className="border rounded px-2 py-1 w-full" value={editForm.paymentMethod || ''} onChange={e => setEditForm(f => ({ ...f, paymentMethod: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">비고</label>
                <input className="border rounded px-2 py-1 w-full" value={editForm.note || ''} onChange={e => setEditForm(f => ({ ...f, note: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300" onClick={() => setShowModal(false)}>취소</button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={handleModalSave}>저장</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default BudgetUsagePage; 