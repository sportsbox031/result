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
          <thead className="bg-blue-50">
            <tr>
              <th className="px-4 py-3 text-left">예산명</th>
              <th className="px-4 py-3 text-left">적요</th>
              <th className="px-4 py-3 text-left">채주</th>
              <th className="px-4 py-3 text-right">집행액</th>
              <th className="px-4 py-3 text-center">회계일자</th>
              <th className="px-4 py-3 text-center">결제방법</th>
              <th className="px-4 py-3 text-left">비고</th>
              <th className="px-4 py-3 text-center">관리</th>
            </tr>
          </thead>
          <tbody>
            {budgetUsages.map((usage) => (
              <tr key={usage.id} className="hover:bg-blue-50 transition">
                <td className="px-4 py-3 flex items-center gap-2 min-w-[160px]">
                  <span>{budgetItems.find(b => b.id === usage.budgetItemId)?.name || '-'}</span>
                  {(() => {
                    const region = budgetItems.find(b => b.id === usage.budgetItemId)?.region;
                    if (region === '남부') return <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">남부</span>;
                    if (region === '북부') return <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">북부</span>;
                    return null;
                  })()}
                </td>
                <td className="px-4 py-2 truncate max-w-[120px]">{usage.description}</td>
                <td className="px-4 py-2 truncate max-w-[100px]">{usage.vendor}</td>
                <td className="px-4 py-2 text-right">{usage.amount.toLocaleString()}</td>
                <td className="px-4 py-2 text-center">{usage.date}</td>
                <td className="px-4 py-2 text-center">{usage.paymentMethod}</td>
                <td className="px-4 py-2 truncate max-w-[120px]">{usage.note}</td>
                <td className="px-4 py-2 text-center">
                  <button className="px-2 py-1 text-blue-600 hover:underline" onClick={() => openEditModal(usage)}><Edit2 className="inline w-4 h-4" /></button>
                  <button className="px-2 py-1 text-red-500 hover:underline" onClick={() => handleDelete(usage.id)}><Trash2 className="inline w-4 h-4" /></button>
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
                <select className="border rounded px-2 py-1 w-full" value={editForm.budgetItemId} onChange={e => setEditForm(f => ({ ...f, budgetItemId: e.target.value }))}>
                  {budgetItems.map(item => (
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