import React, { useState, useEffect } from 'react';
import { BudgetItem, BudgetUsage } from '../types';
import { firebaseStorage } from '../utils/firebaseStorage';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';

const BudgetUsagePage: React.FC = () => {
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [budgetUsages, setBudgetUsages] = useState<BudgetUsage[]>([]);
  const [editingId, setEditingId] = useState<string|null>(null);
  const [editForm, setEditForm] = useState<Partial<BudgetUsage>>({});

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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">예산 사용 내역</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition" onClick={handleAddUsage}>
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
                  {editingId === usage.id ? (
                    <select className="border rounded px-2 py-1 w-40" value={editForm.budgetItemId} onChange={e => handleChange('budgetItemId', e.target.value)}>
                      {budgetItems.map(item => (
                        <option key={item.id} value={item.id}>{item.name} ({item.region || '미지정'})</option>
                      ))}
                    </select>
                  ) : (
                    <>
                      <span>{budgetItems.find(b => b.id === usage.budgetItemId)?.name || '-'}</span>
                      {(() => {
                        const region = budgetItems.find(b => b.id === usage.budgetItemId)?.region;
                        if (region === '남부') return <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">남부</span>;
                        if (region === '북부') return <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">북부</span>;
                        return null;
                      })()}
                    </>
                  )}
                </td>
                <td className="px-4 py-2">
                  {editingId === usage.id ? (
                    <input className="border rounded px-2 py-1 w-32" value={editForm.description || ''} onChange={e => handleChange('description', e.target.value)} />
                  ) : (
                    usage.description
                  )}
                </td>
                <td className="px-4 py-2">
                  {editingId === usage.id ? (
                    <input className="border rounded px-2 py-1 w-24" value={editForm.vendor || ''} onChange={e => handleChange('vendor', e.target.value)} />
                  ) : (
                    usage.vendor
                  )}
                </td>
                <td className="px-4 py-2 text-right">
                  {editingId === usage.id ? (
                    <input type="number" className="border rounded px-2 py-1 w-32 text-right" value={editForm.amount || 0} onChange={e => handleChange('amount', Number(e.target.value))} />
                  ) : (
                    usage.amount.toLocaleString()
                  )}
                </td>
                <td className="px-4 py-2 text-center">
                  {editingId === usage.id ? (
                    <input type="date" className="border rounded px-2 py-1 w-32" value={editForm.date || ''} onChange={e => handleChange('date', e.target.value)} />
                  ) : (
                    usage.date
                  )}
                </td>
                <td className="px-4 py-2 text-center">
                  {editingId === usage.id ? (
                    <input className="border rounded px-2 py-1 w-20" value={editForm.paymentMethod || ''} onChange={e => handleChange('paymentMethod', e.target.value)} />
                  ) : (
                    usage.paymentMethod
                  )}
                </td>
                <td className="px-4 py-2">
                  {editingId === usage.id ? (
                    <input className="border rounded px-2 py-1 w-32" value={editForm.note || ''} onChange={e => handleChange('note', e.target.value)} />
                  ) : (
                    usage.note
                  )}
                </td>
                <td className="px-4 py-2 text-center">
                  {editingId === usage.id ? (
                    <>
                      <button className="px-2 py-1 text-green-600 hover:underline" onClick={handleSave}><Save className="inline w-4 h-4" /></button>
                      <button className="px-2 py-1 text-gray-500 hover:underline" onClick={() => setEditingId(null)}><X className="inline w-4 h-4" /></button>
                    </>
                  ) : (
                    <>
                      <button className="px-2 py-1 text-blue-600 hover:underline" onClick={() => handleEdit(usage)}><Edit2 className="inline w-4 h-4" /></button>
                      <button className="px-2 py-1 text-red-500 hover:underline" onClick={() => handleDelete(usage.id)}><Trash2 className="inline w-4 h-4" /></button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BudgetUsagePage; 