import React, { useMemo, useState, useCallback, useEffect, memo } from 'react';
import { Edit2, Trash2, Save, X, Search, Building2, AlertTriangle, Loader2, Download } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { Demand } from '../types';
import { useFirebaseData } from '../hooks/useFirebaseData';
import { AVAILABLE_YEARS, CURRENT_YEAR } from '../utils/yearUtils';
import { CITIES } from '../constants';
import { downloadDemandExcel } from '../utils/excel';
import Modal from './common/Modal';
import SearchInput from './common/SearchInput';
import EmptyState from './common/EmptyState';
import Pagination from './common/Pagination';
import { usePagination, PAGE_SIZE_OPTIONS } from '../hooks/usePagination';

interface DemandRowProps {
  demand: Demand;
  isEditing: boolean;
  editForm: Partial<Demand>;
  onEdit: (demand: Demand) => void;
  onDelete: (id: string, organizationName: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onInputChange: (field: keyof Demand, value: string) => void;
}

// 행 단위로 memo 처리 — 다른 행을 수정 중이어도 이 행이 리렌더링되지 않도록 한다.
const DemandRow: React.FC<DemandRowProps> = memo(({
  demand,
  isEditing,
  editForm,
  onEdit,
  onDelete,
  onSave,
  onCancel,
  onInputChange
}) => {
  return (
    <tr>
      <td className="hidden lg:table-cell">
        {isEditing ? (
          <select
            value={editForm.year ?? CURRENT_YEAR}
            onChange={(e) => onInputChange('year', e.target.value)}
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
        {isEditing ? (
          <select
            value={editForm.city || ''}
            onChange={(e) => onInputChange('city', e.target.value)}
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
        {isEditing ? (
          <input
            type="text"
            value={editForm.organizationName || ''}
            onChange={(e) => onInputChange('organizationName', e.target.value)}
            className="input-glass text-sm py-2"
          />
        ) : (
          <span className="font-semibold text-gray-900">{demand.organizationName}</span>
        )}
      </td>
      <td>
        {isEditing ? (
          <input
            type="text"
            value={editForm.contactPerson || ''}
            onChange={(e) => onInputChange('contactPerson', e.target.value)}
            className="input-glass text-sm py-2"
          />
        ) : (
          <span className="text-gray-700">{demand.contactPerson}</span>
        )}
      </td>
      <td>
        {isEditing ? (
          <input
            type="tel"
            value={editForm.phoneNumber || ''}
            onChange={(e) => onInputChange('phoneNumber', e.target.value)}
            className="input-glass text-sm py-2"
          />
        ) : (
          <span className="font-mono text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">
            {demand.phoneNumber}
          </span>
        )}
      </td>
      <td className="hidden lg:table-cell">
        {isEditing ? (
          <input
            type="email"
            value={editForm.email || ''}
            onChange={(e) => onInputChange('email', e.target.value)}
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
        {isEditing ? (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={onSave}
              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all duration-200"
              title="저장"
            >
              <Save className="w-5 h-5" />
            </button>
            <button
              onClick={onCancel}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-all duration-200"
              title="취소"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => onEdit(demand)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
              title="수정"
            >
              <Edit2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => onDelete(demand.id, demand.organizationName)}
              className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-200"
              title="삭제"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}, (prev, next) => {
  if (prev.demand !== next.demand) return false;
  if (prev.isEditing !== next.isEditing) return false;
  // 편집 중인 행만 editForm 변경에 반응하면 된다 (매 입력마다 다른 행까지 리렌더링되는 것을 방지)
  if (next.isEditing && prev.editForm !== next.editForm) return false;
  return true;
});

DemandRow.displayName = 'DemandRow';

const DemandList: React.FC = () => {
  const { addToast } = useToast();
  const { demands, updateDemand, deleteDemand } = useFirebaseData();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | 'all'>(CURRENT_YEAR);
  const [editForm, setEditForm] = useState<Partial<Demand>>({});
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const yearFilteredDemands = useMemo(
    () => (selectedYear === 'all' ? demands : demands.filter(d => (d.year ?? 2025) === selectedYear)),
    [demands, selectedYear]
  );

  const filteredDemands = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return yearFilteredDemands.filter(demand =>
      demand.organizationName.toLowerCase().includes(term) ||
      demand.city.toLowerCase().includes(term) ||
      demand.contactPerson.toLowerCase().includes(term)
    );
  }, [yearFilteredDemands, searchTerm]);

  // 화면에는 필터링된 결과 중 현재 페이지 분량만 렌더링한다.
  // (전체를 한 번에 테이블로 그리면 데이터가 많을 때 렉이 발생한다)
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    paginatedItems: paginatedDemands,
    rangeStart,
    rangeEnd
  } = usePagination(filteredDemands);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedYear, searchTerm, setCurrentPage]);

  const handleEdit = useCallback((demand: Demand) => {
    setEditingId(demand.id);
    setEditForm(demand);
  }, []);

  const handleSave = useCallback(async () => {
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
    } catch {
      addToast({
        type: 'error',
        title: '수정 실패',
        message: '수요처 정보 수정 중 오류가 발생했습니다'
      });
    }
  }, [editingId, editForm, updateDemand, addToast]);

  const handleCancel = useCallback(() => {
    setEditingId(null);
    setEditForm({});
  }, []);

  const handleDelete = useCallback(async (id: string, organizationName: string) => {
    if (window.confirm(`"${organizationName}"의 수요처 정보를 삭제하시겠습니까?`)) {
      try {
        await deleteDemand(id);

        addToast({
          type: 'success',
          title: '삭제 완료',
          message: '수요처 정보가 성공적으로 삭제되었습니다'
        });
      } catch {
        addToast({
          type: 'error',
          title: '삭제 실패',
          message: '수요처 정보 삭제 중 오류가 발생했습니다'
        });
      }
    }
  }, [deleteDemand, addToast]);

  const handleInputChange = useCallback((field: keyof Demand, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: field === 'year' ? parseInt(value) : value }));
  }, []);

  const handleExcelDownload = () => {
    if (filteredDemands.length === 0) {
      addToast({ type: 'warning', title: '다운로드 불가', message: '다운로드할 데이터가 없습니다' });
      return;
    }
    try {
      downloadDemandExcel(filteredDemands);
      addToast({ type: 'success', title: '다운로드 완료', message: '수요처 목록이 성공적으로 다운로드되었습니다' });
    } catch (error) {
      console.error('수요처 엑셀 다운로드 실패:', error);
      addToast({ type: 'error', title: '다운로드 실패', message: '엑셀 파일 다운로드 중 오류가 발생했습니다' });
    }
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
    } catch {
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
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 whitespace-nowrap">페이지당</label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="select-glass text-sm py-2"
              >
                {PAGE_SIZE_OPTIONS.map(size => (
                  <option key={size} value={size}>{size}건</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleExcelDownload}
              disabled={filteredDemands.length === 0}
              className="btn-secondary flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              엑셀 다운로드
            </button>
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
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="수요처명, 시/군, 담당자 검색..."
            className="max-w-full lg:max-w-md flex-1"
          />
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
              {paginatedDemands.map((demand) => (
                <DemandRow
                  key={demand.id}
                  demand={demand}
                  isEditing={editingId === demand.id}
                  editForm={editForm}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onSave={handleSave}
                  onCancel={handleCancel}
                  onInputChange={handleInputChange}
                />
              ))}
            </tbody>
          </table>
        </div>

        {filteredDemands.length === 0 && (
          <EmptyState icon={Search} title="검색 결과가 없습니다" description="다른 검색어를 입력해보세요" />
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredDemands.length}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* 일괄 삭제 확인 모달 */}
      {showBulkDeleteModal && (
        <Modal onClose={() => setShowBulkDeleteModal(false)} size="md" dismissible={!isBulkDeleting}>
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
        </Modal>
      )}
    </div>
  );
};

export default DemandList;
