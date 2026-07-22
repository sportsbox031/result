import React, { useState, useMemo } from 'react';
import { Search, Calendar, Filter, Trash2, Edit2, Save, X, Megaphone, Download, MapPin, BarChart3 } from 'lucide-react';
import { useFirebaseData } from '../hooks/useFirebaseData';
import { useToast } from '../hooks/useToast';
import { Performance, FilterState } from '../types';
import { downloadPerformanceExcel } from '../utils/excel';
import { DuplicatePerformanceError } from '../utils/firebaseStorage';
import { getCityRegion } from '../utils/regions';
import { AVAILABLE_YEARS, CURRENT_YEAR, getPerformanceYear } from '../utils/yearUtils';
import { PROGRAMS } from '../constants';
import RegionBadge from './common/RegionBadge';

const PerformanceList: React.FC = () => {
  const { addToast } = useToast();
  const { performances, demands, updatePerformance, deletePerformance } = useFirebaseData();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Performance>>({});
  const [filters, setFilters] = useState<FilterState>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | 'all'>(CURRENT_YEAR);

  const organizationNames = useMemo(
    () => Array.from(new Set(demands.map(d => d.organizationName))).sort(),
    [demands]
  );

  // 필터링 (useMemo로 계산 — 이전에는 useEffect + setState로 불필요한 이중 렌더 발생)
  const filteredPerformances = useMemo(() => {
    let filtered = [...performances];

    if (selectedYear !== 'all') {
      filtered = filtered.filter(p => {
        if (!p.date) return false;
        return getPerformanceYear(new Date(p.date)) === selectedYear;
      });
    }

    if (filters.startDate) {
      filtered = filtered.filter(p => p.date && p.date >= filters.startDate!);
    }
    if (filters.endDate) {
      filtered = filtered.filter(p => p.date && p.date <= filters.endDate!);
    }

    if (filters.region) {
      filtered = filtered.filter(p => getCityRegion(p.city) === filters.region);
    }

    if (filters.organizationName) {
      filtered = filtered.filter(p => p.organizationName === filters.organizationName);
    }

    if (filters.program) {
      filtered = filtered.filter(p => p.program === filters.program);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.organizationName.toLowerCase().includes(term) ||
        p.city.toLowerCase().includes(term) ||
        (p.notes && p.notes.toLowerCase().includes(term))
      );
    }

    return filtered.sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return b.date.getTime() - a.date.getTime();
    });
  }, [performances, filters, searchTerm, selectedYear]);

  const handleFilterChange = <K extends keyof FilterState>(field: K, value: FilterState[K]) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
    setSelectedYear(CURRENT_YEAR);
  };

  const handleEdit = (performance: Performance) => {
    setEditingId(performance.id);
    setEditForm({
      ...performance,
      date: performance.date
    });
  };

  const handleSave = async () => {
    if (!editingId || !editForm.date || !editForm.organizationName) {
      addToast({
        type: 'error',
        title: '입력 오류',
        message: '날짜와 단체명은 필수 항목입니다'
      });
      return;
    }

    const maleCount = editForm.maleCount || 0;
    const femaleCount = editForm.femaleCount || 0;
    const promotionCount = editForm.promotionCount || 0;

    if (maleCount < 0 || femaleCount < 0 || promotionCount < 0) {
      addToast({
        type: 'error',
        title: '입력 오류',
        message: '인원수와 홍보횟수는 0 이상의 숫자를 입력해주세요'
      });
      return;
    }

    try {
      await updatePerformance(editingId, {
        ...editForm,
        notes: editForm.notes ? editForm.notes.trim() : ''
      });
      setEditingId(null);
      setEditForm({});

      addToast({
        type: 'success',
        title: '수정 완료',
        message: '실적 데이터가 성공적으로 수정되었습니다'
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: '수정 실패',
        message: error instanceof DuplicatePerformanceError
          ? '같은 날짜에 같은 단체명의 실적이 이미 등록되어 있습니다'
          : '실적 데이터 수정 중 오류가 발생했습니다'
      });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleDelete = async (id: string, organizationName: string, date?: Date) => {
    const dateStr = date ? date.toLocaleDateString('ko-KR') : '날짜 없음';
    if (window.confirm(`"${organizationName}"의 ${dateStr} 실적 데이터를 삭제하시겠습니까?`)) {
      try {
        await deletePerformance(id);

        addToast({
          type: 'success',
          title: '삭제 완료',
          message: '실적 데이터가 성공적으로 삭제되었습니다'
        });
      } catch {
        addToast({
          type: 'error',
          title: '삭제 실패',
          message: '실적 데이터 삭제 중 오류가 발생했습니다'
        });
      }
    }
  };

  const handleInputChange = <K extends keyof Performance>(field: K, value: Performance[K]) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleExcelDownload = () => {
    if (filteredPerformances.length === 0) {
      addToast({
        type: 'warning',
        title: '다운로드 불가',
        message: '다운로드할 데이터가 없습니다'
      });
      return;
    }

    try {
      downloadPerformanceExcel(filteredPerformances);
      addToast({
        type: 'success',
        title: '다운로드 완료',
        message: '실적 데이터가 성공적으로 다운로드되었습니다'
      });
    } catch {
      addToast({
        type: 'error',
        title: '다운로드 실패',
        message: '엑셀 파일 다운로드 중 오류가 발생했습니다'
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto animate-fadeIn">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">실적 조회</h1>
            <p className="text-gray-500">등록된 실적 데이터를 조회하고 관리하세요</p>
          </div>
        </div>
      </div>

      {/* 필터 섹션 */}
      <div className="glass-card p-4 lg:p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base lg:text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            필터
          </h2>
          <button
            onClick={clearFilters}
            className="btn-glass text-sm"
          >
            전체 초기화
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">연도</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="select-glass"
            >
              <option value="all">전체 연도</option>
              {AVAILABLE_YEARS.map(year => (
                <option key={year} value={year}>{year}년</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">검색</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="검색어 입력..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-glass pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">지역</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={filters.region || ''}
                onChange={(e) => handleFilterChange('region', (e.target.value || undefined) as FilterState['region'])}
                className="select-glass pl-10"
              >
                <option value="">전체 지역</option>
                <option value="남부">남부</option>
                <option value="북부">북부</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">시작 날짜</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="date"
                value={filters.startDate ? filters.startDate.toISOString().split('T')[0] : ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value ? new Date(e.target.value) : undefined)}
                className="input-glass pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">종료 날짜</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="date"
                value={filters.endDate ? filters.endDate.toISOString().split('T')[0] : ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value ? new Date(e.target.value) : undefined)}
                className="input-glass pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">단체명</label>
            <select
              value={filters.organizationName || ''}
              onChange={(e) => handleFilterChange('organizationName', e.target.value || undefined)}
              className="select-glass"
            >
              <option value="">전체 단체</option>
              {organizationNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">프로그램</label>
            <select
              value={filters.program || ''}
              onChange={(e) => handleFilterChange('program', e.target.value || undefined)}
              className="select-glass"
            >
              <option value="">전체 프로그램</option>
              {PROGRAMS.map(program => (
                <option key={program} value={program}>{program}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 결과 요약 및 엑셀 다운로드 */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
        <div className="glass px-4 py-2 rounded-xl">
          <span className="text-sm text-gray-600">
            총 <span className="font-bold text-gray-900">{performances.length}</span>건 중{' '}
            <span className="font-bold text-blue-600">{filteredPerformances.length}</span>건 표시
          </span>
        </div>
        <button
          onClick={handleExcelDownload}
          disabled={filteredPerformances.length === 0}
          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          엑셀 다운로드
        </button>
      </div>

      {/* 테이블 */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-glass">
            <thead>
              <tr>
                <th>날짜</th>
                <th>단체명</th>
                <th className="hidden lg:table-cell">시/군</th>
                <th className="hidden lg:table-cell">지역</th>
                <th>프로그램</th>
                <th>남성</th>
                <th>여성</th>
                <th>총 인원</th>
                <th className="hidden lg:table-cell">홍보</th>
                <th>메모</th>
                <th className="text-right">작업</th>
              </tr>
            </thead>
            <tbody>
              {filteredPerformances.map((performance) => (
                <tr key={performance.id}>
                  <td>
                    {editingId === performance.id ? (
                      <input
                        type="date"
                        value={editForm.date ? new Date(editForm.date).toISOString().split('T')[0] : ''}
                        onChange={(e) => handleInputChange('date', new Date(e.target.value))}
                        className="input-glass text-sm py-2"
                      />
                    ) : (
                      <span className="text-sm font-mono text-gray-700">
                        {performance.date ? performance.date.toLocaleDateString('ko-KR') : '날짜 없음'}
                      </span>
                    )}
                  </td>
                  <td>
                    {editingId === performance.id ? (
                      <select
                        value={editForm.organizationName || ''}
                        onChange={(e) => handleInputChange('organizationName', e.target.value)}
                        className="select-glass text-sm py-2"
                      >
                        <option value="">단체 선택</option>
                        {organizationNames.map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="font-medium text-gray-900">{performance.organizationName}</span>
                    )}
                  </td>
                  <td className="hidden lg:table-cell">
                    <span className="text-sm text-gray-600">{performance.city || '-'}</span>
                  </td>
                  <td className="hidden lg:table-cell">
                    <RegionBadge region={getCityRegion(performance.city)} />
                  </td>
                  <td>
                    {editingId === performance.id ? (
                      <select
                        value={editForm.program || performance.program || '스포츠교실'}
                        onChange={(e) => handleInputChange('program', e.target.value as Performance['program'])}
                        className="select-glass text-sm py-2"
                      >
                        {PROGRAMS.map(program => (
                          <option key={program} value={program}>{program}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="badge-violet">{performance.program || '스포츠교실'}</span>
                    )}
                  </td>
                  <td>
                    {editingId === performance.id ? (
                      <input
                        type="number"
                        value={editForm.maleCount || ''}
                        onChange={(e) => handleInputChange('maleCount', parseInt(e.target.value) || 0)}
                        min="0"
                        className="input-glass text-sm py-2 w-20"
                      />
                    ) : (
                      <span className="font-mono text-blue-600 font-medium">
                        {(performance.maleCount || 0).toLocaleString()}
                      </span>
                    )}
                  </td>
                  <td>
                    {editingId === performance.id ? (
                      <input
                        type="number"
                        value={editForm.femaleCount || ''}
                        onChange={(e) => handleInputChange('femaleCount', parseInt(e.target.value) || 0)}
                        min="0"
                        className="input-glass text-sm py-2 w-20"
                      />
                    ) : (
                      <span className="font-mono text-pink-600 font-medium">
                        {(performance.femaleCount || 0).toLocaleString()}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="font-mono font-bold text-gray-900">
                      {((performance.maleCount || 0) + (performance.femaleCount || 0)).toLocaleString()}
                    </span>
                  </td>
                  <td className="hidden lg:table-cell">
                    {editingId === performance.id ? (
                      <input
                        type="number"
                        value={editForm.promotionCount || ''}
                        onChange={(e) => handleInputChange('promotionCount', parseInt(e.target.value) || 0)}
                        min="0"
                        className="input-glass text-sm py-2 w-20"
                      />
                    ) : (
                      <span className="text-sm text-orange-600 font-mono flex items-center gap-1">
                        <Megaphone className="w-3 h-3" />
                        {(performance.promotionCount || 0).toLocaleString()}회
                      </span>
                    )}
                  </td>
                  <td>
                    {editingId === performance.id ? (
                      <textarea
                        value={editForm.notes || ''}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        className="input-glass text-sm py-2 resize-none"
                        rows={2}
                      />
                    ) : (
                      <span className="text-sm text-gray-500 block truncate max-w-[150px]" title={performance.notes || ''}>
                        {performance.notes || '-'}
                      </span>
                    )}
                  </td>
                  <td className="text-right">
                    {editingId === performance.id ? (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={handleSave}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                          title="저장"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancel}
                          className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                          title="취소"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(performance)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                          title="수정"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(performance.id, performance.organizationName, performance.date)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPerformances.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-lg font-medium text-gray-500 mb-2">
              {performances.length === 0 ? '실적 데이터가 없습니다' : '검색 조건에 맞는 데이터가 없습니다'}
            </p>
            <p className="text-sm text-gray-400">필터를 조정하거나 새로운 실적을 입력해보세요</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceList;
