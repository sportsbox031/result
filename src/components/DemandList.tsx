import React, { useState } from 'react';
import { Edit2, Trash2, Save, X, Search, Building2, AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { Demand } from '../types';
import { useFirebaseData } from '../hooks/useFirebaseData';
import { AVAILABLE_YEARS, CURRENT_YEAR } from '../utils/yearUtils';

const CITIES = [
  '가평군', '고양시', '과천시', '광명시', '광주시', '구리시', '군포시', '김포시',
  '남양주시', '동두천시', '부천시', '성남시', '수원시', '시흥시', '안산시', '안성시',
  '안양시', '양주시', '양평군', '여주시', '연천군', '오산시', '용인시', '의왕시',
  '의정부시', '이천시', '파주시', '평택시', '포천시', '하남시', '화성시'
];

const DemandList: React.FC = () => {
  const { addToast } = useToast();
  const { demands, updateDemand, deleteDemand } = useFirebaseData();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | 'all'>(CURRENT_YEAR);
  const [editForm, setEditForm] = useState<Partial<Demand>>({});
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const yearFilteredDemands = selectedYear === 'all'
    ? demands
    : demands.filter(d => (d.year ?? 2025) === selectedYear);

  const filteredDemands = yearFilteredDemands.filter(demand =>
    demand.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    demand.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    demand.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (demand: Demand) => {
    setEditingId(demand.id);
    setEditForm(demand);
  };

  const handleSave = async () => {
    if (!editingId || !editForm.city || !editForm.organizationName || !editForm.contactPerson || !editForm.phoneNumber) {
      addToast({
        type: 'error',
        title: '입력 오류',
        message: '필수 항목을 모두 입력해주세요'
      });
      return;
    }

    try {
      await updateDemand(editingId, editForm);
      setEditingId(null);
      setEditForm({});

      addToast({
        type: 'success',
        title: '수정 완료',
        message: '수요처 정보가 성공적으로 수정되었습니다'
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: '수정 실패',
        message: '수요처 정보 수정 중 오류가 발생했습니다'
      });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleDelete = async (id: string, organizationName: string) => {
    if (window.confirm(`"${organizationName}"의 수요처 정보를 삭제하시겠습니까?`)) {
      try {
        await deleteDemand(id);

        addToast({
          type: 'success',
          title: '삭제 완료',
          message: '수요처 정보가 성공적으로 삭제되었습니다'
        });
      } catch (error) {
        addToast({
          type: 'error',
          title: '삭제 실패',
          message: '수요처 정보 삭제 중 오류가 발생했습니다'
        });
      }
    }
  };

  const handleInputChange = (field: keyof Demand, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: field === 'year' ? parseInt(value) : value }));
  };

  const handleBulkDelete = async () => {
    if (selectedYear === 'all') return;
    setIsBulkDeleting(true);
    try {
      for (const demand of yearFilteredDemands) {
        await deleteDemand(demand.id);
      }
      setShowBulkDeleteModal(false);
      addToast({ type: 'success', title: '일괄 삭제 완료', message: `${selectedYear}년 수요처 ${yearFilteredDemands.length}건이 삭제되었습니다` });
    } catch (error) {
      addToast({ type: 'error', title: '삭제 실패', message: '일괄 삭제 중 오류가 발생했습니다' });
    } finally {
      setIsBulkDeleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto animate-fadeIn">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">수요처 관리</h1>
            <p className="text-gray-500">등록된 수요처 정보를 조회, 수정, 삭제할 수 있습니다</p>
          </div>
        </div>
      </div>

      {/* 연도 필터 */}
      <div className="glass-card p-4 lg:p-5 mb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-gray-600">연도:</span>
            <button
              onClick={() => setSelectedYear('all')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                selectedYear === 'all' ? 'bg-violet-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              전체
            </button>
            {AVAILABLE_YEARS.map(year => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  selectedYear === year ? 'bg-violet-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {year}년
              </button>
            ))}
          </div>
          {selectedYear !== 'all' && yearFilteredDemands.length > 0 && (
            <button
              onClick={() => setShowBulkDeleteModal(true)}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-all duration-200"
            >
              <Trash2 className="w-4 h-4" />
              {selectedYear}년 일괄 삭제
            </button>
          )}
        </div>
      </div>

      {/* 검색 및 요약 */}
      <div className="glass-card p-4 lg:p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="stat-icon-violet">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{selectedYear === 'all' ? '전체' : `${selectedYear}년`} 수요처</p>
              <p className="text-xl font-bold text-gray-900">{yearFilteredDemands.length}건</p>
            </div>
            {searchTerm && (
              <div className="badge-blue ml-2">
                검색결과 {filteredDemands.length}건
              </div>
            )}
          </div>
          <div className="relative max-w-full lg:max-w-md flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="수요처명, 시/군, 담당자 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-glass pl-12 w-full"
            />
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-glass">
            <thead>
              <tr>
                <th className="hidden lg:table-cell">연도</th>
                <th>시/군</th>
                <th>단체명</th>
                <th>담당자</th>
                <th>연락처</th>
                <th className="hidden lg:table-cell">이메일</th>
                <th className="hidden lg:table-cell">등록일</th>
                <th className="text-right">작업</th>
              </tr>
            </thead>
            <tbody>
              {filteredDemands.map((demand) => (
                <tr key={demand.id}>
                  <td className="hidden lg:table-cell">
                    {editingId === demand.id ? (
                      <select
                        value={editForm.year ?? CURRENT_YEAR}
                        onChange={(e) => handleInputChange('year', e.target.value)}
                        className="select-glass text-sm py-2"
                      >
                        {AVAILABLE_YEARS.map(y => (
                          <option key={y} value={y}>{y}년</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-sm font-semibold text-gray-700">{demand.year ?? 2025}년</span>
                    )}
                  </td>
                  <td>
                    {editingId === demand.id ? (
                      <select
                        value={editForm.city || ''}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className="select-glass text-sm py-2"
                      >
                        <option value="">시/군 선택</option>
                        {CITIES.map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="badge-blue">{demand.city}</span>
                    )}
                  </td>
                  <td>
                    {editingId === demand.id ? (
                      <input
                        type="text"
                        value={editForm.organizationName || ''}
                        onChange={(e) => handleInputChange('organizationName', e.target.value)}
                        className="input-glass text-sm py-2"
                      />
                    ) : (
                      <span className="font-semibold text-gray-900">{demand.organizationName}</span>
                    )}
                  </td>
                  <td>
                    {editingId === demand.id ? (
                      <input
                        type="text"
                        value={editForm.contactPerson || ''}
                        onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                        className="input-glass text-sm py-2"
                      />
                    ) : (
                      <span className="text-gray-700">{demand.contactPerson}</span>
                    )}
                  </td>
                  <td>
                    {editingId === demand.id ? (
                      <input
                        type="tel"
                        value={editForm.phoneNumber || ''}
                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                        className="input-glass text-sm py-2"
                      />
                    ) : (
                      <span className="font-mono text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">
                        {demand.phoneNumber}
                      </span>
                    )}
                  </td>
                  <td className="hidden lg:table-cell">
                    {editingId === demand.id ? (
                      <input
                        type="email"
                        value={editForm.email || ''}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="input-glass text-sm py-2"
                      />
                    ) : (
                      <span className="text-sm text-gray-500">{demand.email || '-'}</span>
                    )}
                  </td>
                  <td className="hidden lg:table-cell">
                    <span className="text-sm text-gray-500 font-mono">
                      {demand.createdAt.toLocaleDateString('ko-KR')}
                    </span>
                  </td>
                  <td className="text-right">
                    {editingId === demand.id ? (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={handleSave}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all duration-200"
                          title="저장"
                        >
                          <Save className="w-5 h-5" />
                        </button>
                        <button
                          onClick={handleCancel}
                          className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-all duration-200"
                          title="취소"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(demand)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
                          title="수정"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(demand.id, demand.organizationName)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-200"
                          title="삭제"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredDemands.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-lg font-medium text-gray-500 mb-2">검색 결과가 없습니다</p>
            <p className="text-sm text-gray-400">다른 검색어를 입력해보세요</p>
          </div>
        )}
      </div>

      {/* 일괄 삭제 확인 모달 */}
      {showBulkDeleteModal && (
        <div className="modal-overlay animate-fadeIn" onClick={() => !isBulkDeleting && setShowBulkDeleteModal(false)}>
          <div className="modal-content w-full max-w-md p-8 animate-scaleIn" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-rose-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">일괄 삭제 확인</h3>
              <p className="text-gray-500 mb-2">
                <span className="font-bold text-gray-900">{selectedYear}년</span> 수요처{' '}
                <span className="font-bold text-rose-600">{yearFilteredDemands.length}건</span>을 모두 삭제합니다.
              </p>
              <p className="text-sm text-rose-500 mb-6">이 작업은 되돌릴 수 없습니다.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBulkDeleteModal(false)}
                  disabled={isBulkDeleting}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={isBulkDeleting}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 text-white font-medium hover:bg-rose-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isBulkDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      삭제 중...
                    </>
                  ) : (
                    '삭제'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DemandList;
