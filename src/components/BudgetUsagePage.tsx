import React, { useState, useEffect } from 'react';
import { BudgetItem, BudgetUsage } from '../types';
import { firebaseStorage } from '../utils/firebaseStorage';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { downloadBudgetUsageExcel } from '../utils/excel';

const BudgetUsagePage: React.FC = () => {
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [budgetUsages, setBudgetUsages] = useState<BudgetUsage[]>([]);
  const [editingId, setEditingId] = useState<string|null>(null);
  const [editForm, setEditForm] = useState<Partial<BudgetUsage>>({});
  const [regionFilter, setRegionFilter] = useState<'전체' | '남부' | '북부'>('전체');
  
  // 남부/북부 예산명 매칭 함수
  const getRegionFromBudgetName = (budgetName: string): '남부' | '북부' | null => {
    const southBudgets = [
      '스포츠이벤트(동/하계)', '용품구입비', '근무자피복비(동/하계)', '간담회 및 회의운영', 
      '차량리스비', '차량관리비(유류비,정비,세차 등)', '차량보험료', '기타운영비', 
      '사업홍보비', '전산구축 및 유지보수', '주최자배상책임공제', '운동 영상장비 구입'
    ];
    const northBudgets = [
      '용품구입비_북부', '근무자 피복비_북부(동/하계)', '간담회 및 회의운영_북부', 
      '차량리스비_북부', '차량관리비_북부(유류비,정비,세차 등)', '차량개조비_북부(래핑,앵글제작 등)', 
      '차량보험료_북부', '기타운영비_북부', '사업홍보비_북부', '운영수당(스포츠박스)_북부'
    ];
    
    if (southBudgets.includes(budgetName)) return '남부';
    if (northBudgets.includes(budgetName)) return '북부';
    return null;
  };
  
  const filteredBudgetItems = budgetItems
    .filter(item => {
      const itemRegion = getRegionFromBudgetName(item.name);
      const matchesRegion = regionFilter === '전체' || itemRegion === regionFilter;
      return matchesRegion;
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
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

  // ESC 키로 수정모드 종료
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editingId) {
          setEditingId(null);
          setEditForm({});
        }
        if (adding) {
          setAdding(false);
          setAddForm({
            budgetItemId: budgetItems[0]?.id || '',
            description: '', vendor: '', amount: 0, date: '', paymentMethod: '', note: ''
          });
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editingId, adding, budgetItems]);

  const handleAddUsage = () => {
    setAdding(true);
    // 지역 필터에 맞는 첫 번째 예산을 기본값으로 설정
    const defaultBudgetItem = filteredBudgetItems[0];
    setAddForm({
      budgetItemId: defaultBudgetItem?.id || budgetItems[0]?.id || '',
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

  // 지역 필터가 변경될 때 addForm과 editForm의 budgetItemId를 유효한 값으로 업데이트
  useEffect(() => {
    if (adding && filteredBudgetItems.length > 0) {
      const currentBudgetItem = budgetItems.find(b => b.id === addForm.budgetItemId);
      const currentRegion = currentBudgetItem ? getRegionFromBudgetName(currentBudgetItem.name) : null;
      
      // 현재 선택된 예산이 현재 필터와 맞지 않으면 첫 번째 예산으로 변경
      if (regionFilter !== '전체' && currentRegion !== regionFilter) {
        setAddForm(f => ({ ...f, budgetItemId: filteredBudgetItems[0]?.id || '' }));
      }
    }
    
    if (editingId && filteredBudgetItems.length > 0) {
      const currentBudgetItem = budgetItems.find(b => b.id === editForm.budgetItemId);
      const currentRegion = currentBudgetItem ? getRegionFromBudgetName(currentBudgetItem.name) : null;
      
      // 현재 선택된 예산이 현재 필터와 맞지 않으면 첫 번째 예산으로 변경
      if (regionFilter !== '전체' && currentRegion !== regionFilter) {
        setEditForm(f => ({ ...f, budgetItemId: filteredBudgetItems[0]?.id || '' }));
      }
    }
  }, [regionFilter, adding, editingId, filteredBudgetItems, addForm.budgetItemId, editForm.budgetItemId, budgetItems]);

  return (
    <div className="w-full max-w-[2000px] mx-auto px-2 lg:px-4 overflow-x-hidden">
      <div className="mb-6 lg:mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900">예산 사용 내역</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <button 
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition min-h-[44px]" 
            onClick={handleAddUsage}
          >
            <Plus className="w-4 h-4" /> 내역 추가
          </button>
          <button 
            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition min-h-[44px]" 
            onClick={() => downloadBudgetUsageExcel(budgetUsages, budgetItems)}
          >
            엑셀 다운로드
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {/* 추가 내역 입력 카드 (맨 위) */}
        {adding && (
          <div className="rounded-xl shadow-md border-2 border-blue-300 bg-white ring-2 ring-blue-400">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4 p-4 lg:p-6 w-full">
              {/* 예산명/지역 */}
              <div className="flex-none w-full lg:w-48 lg:min-w-[180px]">
                <label className="block text-xs font-medium text-gray-500 mb-1">예산명</label>
                <div className="flex gap-2 mb-2">
                  {['전체', '남부', '북부'].map(region => (
                    <button
                      key={region}
                      type="button"
                      className={`px-3 py-1 rounded-full border text-xs font-semibold transition-colors duration-200 ${
                        regionFilter === region 
                          ? 'bg-blue-600 text-white border-blue-600' 
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'
                      }`}
                      onClick={() => setRegionFilter(region as '전체' | '남부' | '북부')}
                    >
                      {region}
                    </button>
                  ))}
                </div>
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
              <div className="flex-1 lg:flex-[3] lg:min-w-[400px]">
                <label className="block text-xs font-medium text-gray-500 mb-1">적요</label>
                <input className="border rounded px-3 py-2 w-full min-h-[44px]" value={addForm.description || ''} onChange={e => handleAddChange('description', e.target.value)} />
              </div>
              {/* 채주 */}
              <div className="flex-1 lg:flex-none lg:w-28 lg:min-w-[80px]">
                <label className="block text-xs font-medium text-gray-500 mb-1">채주</label>
                <input className="border rounded px-3 py-2 w-full min-h-[44px]" value={addForm.vendor || ''} onChange={e => handleAddChange('vendor', e.target.value)} />
              </div>
              {/* 집행액 */}
              <div className="flex-1 lg:flex-none lg:w-32 lg:min-w-[100px] text-right">
                <label className="block text-xs font-medium text-gray-500 mb-1">집행액</label>
                <input
                  type="text"
                  className="border rounded px-3 py-2 w-full text-right min-h-[44px]"
                  value={addForm.amount !== undefined && addForm.amount !== null ? Number(addForm.amount).toLocaleString() : ''}
                  onChange={e => {
                    const raw = e.target.value.replace(/,/g, '');
                    if (!isNaN(Number(raw))) handleAddChange('amount', Number(raw));
                  }}
                />
              </div>
              {/* 집행일자 */}
              <div className="flex-1 lg:flex-none lg:w-36 lg:min-w-[120px] text-center">
                <label className="block text-xs font-medium text-gray-500 mb-1">집행일자</label>
                <input type="date" className="border rounded px-3 py-2 w-full min-h-[44px]" value={addForm.date || ''} onChange={e => handleAddChange('date', e.target.value)} />
              </div>
              {/* 결제방법 */}
              <div className="flex-1 lg:flex-none lg:w-32 lg:min-w-[100px] text-center">
                <label className="block text-xs font-medium text-gray-500 mb-1">결제방법</label>
                <select className="border rounded px-3 py-2 w-full min-h-[44px]" value={addForm.paymentMethod || ''} onChange={e => handleAddChange('paymentMethod', e.target.value)}>
                  <option value="">선택</option>
                  <option value="계좌입금">계좌입금</option>
                  <option value="카드결제">카드결제</option>
                </select>
              </div>
              {/* 메모 */}
              <div className="flex-1 lg:flex-none lg:w-32 lg:min-w-[100px]">
                <label className="block text-xs font-medium text-gray-500 mb-1">메모</label>
                <input className="border rounded px-3 py-2 w-full min-h-[44px]" value={addForm.note || ''} onChange={e => handleAddChange('note', e.target.value)} />
              </div>
              {/* 저장/취소 버튼 */}
              <div className="flex flex-row lg:flex-col gap-2 items-center justify-center flex-none w-full lg:w-16 lg:min-w-[60px]">
                <button className="p-3 lg:p-2 bg-blue-600 text-white rounded-lg lg:rounded-full shadow hover:bg-blue-700 transition min-h-[44px] min-w-[44px] flex-1 lg:flex-none" onClick={handleAddSave} title="저장">
                  <Save className="w-5 h-5 mx-auto" />
                </button>
                <button className="p-3 lg:p-2 bg-gray-200 text-gray-700 rounded-lg lg:rounded-full shadow hover:bg-gray-300 transition min-h-[44px] min-w-[44px] flex-1 lg:flex-none" onClick={() => setAdding(false)} title="취소">
                  <X className="w-5 h-5 mx-auto" />
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
              className={`rounded-xl shadow-md border border-gray-100 bg-white hover:shadow-lg transition cursor-pointer relative ${isEditing ? 'ring-2 ring-blue-400' : 'hover:ring-1 hover:ring-blue-200'}`}
              onClick={() => !isEditing && handleEdit(usage)}
            >
              <div className="flex md:flex-row md:items-center gap-4 p-6 w-full">
                {/* 예산명/지역 */}
                <div className="flex-none w-48 min-w-[180px]">
                  <label className="block text-xs font-medium text-gray-500 mb-1">예산명</label>
                  {isEditing ? (
                    <>
                      <div className="flex gap-2 mb-2">
                        {['전체', '남부', '북부'].map(region => (
                          <button
                            key={region}
                            type="button"
                            className={`px-3 py-1 rounded-full border text-xs font-semibold transition-colors duration-200 ${
                              regionFilter === region 
                                ? 'bg-blue-600 text-white border-blue-600' 
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'
                            }`}
                            onClick={() => setRegionFilter(region as '전체' | '남부' | '북부')}
                          >
                            {region}
                          </button>
                        ))}
                      </div>
                      <select
                        className="border rounded px-2 py-1 w-full"
                        value={editForm.budgetItemId}
                        onChange={e => handleChange('budgetItemId', e.target.value)}
                      >
                        {filteredBudgetItems.map(item => (
                          <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                      </select>
                    </>
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
                <div className="flex-[3] min-w-[400px]">
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
                <div className="flex-none w-28 min-w-[80px]">
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
                <div className="flex-none w-32 min-w-[100px] text-right">
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
                <div className="flex-none w-36 min-w-[120px] text-center">
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
                <div className="flex-none w-32 min-w-[100px] text-center">
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
                <div className="flex-none w-32 min-w-[100px]">
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
                  <div className="flex flex-col gap-2 items-center justify-center flex-none w-16 min-w-[60px]">
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