import React, { useState, useEffect } from 'react';
import { Search, Calendar, Filter, Trash2, Edit2, Save, X, Users, Megaphone, Download } from 'lucide-react';
import { useFirebaseData } from '../hooks/useFirebaseData';
import { useToast } from '../hooks/useToast';
import { Performance, FilterState } from '../types';
import { downloadPerformanceExcel } from '../utils/excel';

const PerformanceList: React.FC = () => {
  const { addToast } = useToast();
  const { performances, demands, updatePerformance, deletePerformance } = useFirebaseData();
  const [filteredPerformances, setFilteredPerformances] = useState<Performance[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Performance>>({});
  const [filters, setFilters] = useState<FilterState>({});
  const [searchTerm, setSearchTerm] = useState('');

  // 파이어베이스에서 단체명 목록 가져오기
  const organizationNames = Array.from(new Set(demands.map(d => d.organizationName))).sort();

  useEffect(() => {
    applyFilters();
  }, [performances, filters, searchTerm]);

  const applyFilters = () => {
    let filtered = [...performances];

    // 날짜 범위 필터
    if (filters.startDate) {
      filtered = filtered.filter(p => p.date && p.date >= filters.startDate!);
    }
    if (filters.endDate) {
      filtered = filtered.filter(p => p.date && p.date <= filters.endDate!);
    }

    // 단체명 필터
    if (filters.organizationName) {
      filtered = filtered.filter(p => p.organizationName === filters.organizationName);
    }

    // 프로그램 필터
    if (filters.program) {
      filtered = filtered.filter(p => p.program === filters.program);
    }

    // 검색 필터
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.notes && p.notes.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // 날짜순 정렬 (최신순) - 날짜가 없는 항목은 맨 뒤로
    filtered.sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return b.date.getTime() - a.date.getTime();
    });

    setFilteredPerformances(filtered);
  };

  const handleFilterChange = (field: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
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
        message: '실적 데이터 수정 중 오류가 발생했습니다'
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
      } catch (error) {
        addToast({
          type: 'error',
          title: '삭제 실패',
          message: '실적 데이터 삭제 중 오류가 발생했습니다'
        });
      }
    }
  };

  const handleInputChange = (field: keyof Performance, value: any) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  // 엑셀 다운로드 함수
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
    } catch (error) {
      addToast({
        type: 'error',
        title: '다운로드 실패',
        message: '엑셀 파일 다운로드 중 오류가 발생했습니다'
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">실적 조회</h1>
        <p className="text-sm lg:text-base text-gray-600">등록된 실적 데이터를 조회하고 관리하세요</p>
      </div>

      {/* 필터 섹션 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base lg:text-lg font-medium text-gray-900 flex items-center">
            <Filter className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
            필터
          </h2>
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium min-h-[44px] px-2"
          >
            전체 초기화
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">검색</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="검색어 입력..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
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
                className="pl-9 pr-3 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="pl-9 pr-3 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">단체명</label>
            <select
              value={filters.organizationName || ''}
              onChange={(e) => handleFilterChange('organizationName', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">전체 프로그램</option>
              <option value="스포츠교실">스포츠교실</option>
              <option value="스포츠체험존">스포츠체험존</option>
              <option value="스포츠이벤트">스포츠이벤트</option>
            </select>
          </div>
        </div>
      </div>

      {/* 결과 요약 및 엑셀 다운로드 */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
        <div className="text-sm text-gray-500">
          총 {performances.length}건 중 {filteredPerformances.length}건 표시
        </div>
        <button
          onClick={handleExcelDownload}
          disabled={filteredPerformances.length === 0}
          className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <Download className="w-4 h-4 mr-2" />
          엑셀 다운로드
        </button>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-medium text-gray-900 w-24 lg:w-32">날짜</th>
                <th className="px-3 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-medium text-gray-900 w-32 lg:w-48">단체명</th>
                <th className="px-3 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-medium text-gray-900 w-20 lg:w-24 hidden lg:table-cell">시/군</th>
                <th className="px-3 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-medium text-gray-900 w-24 lg:w-32">프로그램</th>
                <th className="px-3 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-medium text-gray-900 w-16 lg:w-20">남성</th>
                <th className="px-3 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-medium text-gray-900 w-16 lg:w-20">여성</th>
                <th className="px-3 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-medium text-gray-900 w-16 lg:w-20">총 인원</th>
                <th className="px-3 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-medium text-gray-900 w-20 lg:w-24 hidden lg:table-cell">홍보횟수</th>
                <th className="px-3 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-medium text-gray-900 min-w-24 lg:min-w-32 hidden lg:table-cell">메모</th>
                <th className="px-3 lg:px-6 py-3 lg:py-4 text-right text-xs lg:text-sm font-medium text-gray-900 w-20 lg:w-24">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPerformances.map((performance) => (
                <tr key={performance.id} className="hover:bg-gray-50">
                  <td className="px-3 lg:px-6 py-3 lg:py-4 w-24 lg:w-32">
                    {editingId === performance.id ? (
                      <input
                        type="date"
                        value={editForm.date ? new Date(editForm.date).toISOString().split('T')[0] : ''}
                        onChange={(e) => handleInputChange('date', new Date(e.target.value))}
                        className="w-full px-2 lg:px-3 py-1 lg:py-2 text-xs lg:text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <span className="text-xs lg:text-sm text-gray-900">
                        {performance.date ? performance.date.toLocaleDateString('ko-KR') : '날짜 없음'}
                      </span>
                    )}
                  </td>
                  <td className="px-3 lg:px-6 py-3 lg:py-4 w-32 lg:w-48">
                    {editingId === performance.id ? (
                      <select
                        value={editForm.organizationName || ''}
                        onChange={(e) => handleInputChange('organizationName', e.target.value)}
                        className="w-full px-2 lg:px-3 py-1 lg:py-2 text-xs lg:text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">단체 선택</option>
                        {organizationNames.map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs lg:text-sm font-medium text-gray-900">{performance.organizationName}</span>
                    )}
                  </td>
                  <td className="px-3 lg:px-6 py-3 lg:py-4 w-20 lg:w-24 hidden lg:table-cell">
                    <span className="text-xs lg:text-sm text-gray-600">{performance.city || '-'}</span>
                  </td>
                  <td className="px-3 lg:px-6 py-3 lg:py-4 w-24 lg:w-32">
                    {editingId === performance.id ? (
                      <select
                        value={editForm.program || performance.program || '스포츠교실'}
                        onChange={(e) => handleInputChange('program', e.target.value)}
                        className="w-full px-2 lg:px-3 py-1 lg:py-2 text-xs lg:text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="스포츠교실">스포츠교실</option>
                        <option value="스포츠체험존">스포츠체험존</option>
                        <option value="스포츠이벤트">스포츠이벤트</option>
                      </select>
                    ) : (
                      <span className="text-xs lg:text-sm text-purple-600 font-medium">{performance.program || '스포츠교실'}</span>
                    )}
                  </td>
                  <td className="px-3 lg:px-6 py-3 lg:py-4 w-16 lg:w-20">
                    {editingId === performance.id ? (
                      <input
                        type="number"
                        value={editForm.maleCount || ''}
                        onChange={(e) => handleInputChange('maleCount', parseInt(e.target.value) || 0)}
                        min="0"
                        className="w-full px-2 lg:px-3 py-1 lg:py-2 text-xs lg:text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <span className="text-xs lg:text-sm text-blue-600 font-mono flex items-center">
                        <Users className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                        {(performance.maleCount || 0).toLocaleString()}
                      </span>
                    )}
                  </td>
                  <td className="px-3 lg:px-6 py-3 lg:py-4 w-16 lg:w-20">
                    {editingId === performance.id ? (
                      <input
                        type="number"
                        value={editForm.femaleCount || ''}
                        onChange={(e) => handleInputChange('femaleCount', parseInt(e.target.value) || 0)}
                        min="0"
                        className="w-full px-2 lg:px-3 py-1 lg:py-2 text-xs lg:text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <span className="text-xs lg:text-sm text-pink-600 font-mono flex items-center">
                        <Users className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                        {(performance.femaleCount || 0).toLocaleString()}
                      </span>
                    )}
                  </td>
                  <td className="px-3 lg:px-6 py-3 lg:py-4 w-16 lg:w-20">
                    <span className="text-xs lg:text-sm text-gray-900 font-bold">
                      {((performance.maleCount || 0) + (performance.femaleCount || 0)).toLocaleString()}명
                    </span>
                  </td>
                  <td className="px-3 lg:px-6 py-3 lg:py-4 w-20 lg:w-24 hidden lg:table-cell">
                    {editingId === performance.id ? (
                      <input
                        type="number"
                        value={editForm.promotionCount || ''}
                        onChange={(e) => handleInputChange('promotionCount', parseInt(e.target.value) || 0)}
                        min="0"
                        className="w-full px-2 lg:px-3 py-1 lg:py-2 text-xs lg:text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <span className="text-xs lg:text-sm text-orange-600 font-mono flex items-center">
                        <Megaphone className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                        {(performance.promotionCount || 0).toLocaleString()}회
                      </span>
                    )}
                  </td>
                  <td className="px-3 lg:px-6 py-3 lg:py-4 min-w-24 lg:min-w-32 hidden lg:table-cell">
                    {editingId === performance.id ? (
                      <textarea
                        value={editForm.notes || ''}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        className="w-full px-2 lg:px-3 py-1 lg:py-2 text-xs lg:text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows={2}
                      />
                    ) : (
                      <span className="text-xs lg:text-sm text-gray-500">
                        {performance.notes || '-'}
                      </span>
                    )}
                  </td>
                  <td className="px-3 lg:px-6 py-3 lg:py-4 text-right w-20 lg:w-24">
                    {editingId === performance.id ? (
                      <div className="flex items-center justify-end space-x-1 lg:space-x-2">
                        <button
                          onClick={handleSave}
                          className="p-1 lg:p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="저장"
                        >
                          <Save className="w-3 h-3 lg:w-4 lg:h-4" />
                        </button>
                        <button
                          onClick={handleCancel}
                          className="p-1 lg:p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                          title="취소"
                        >
                          <X className="w-3 h-3 lg:w-4 lg:h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end space-x-1 lg:space-x-2">
                        <button
                          onClick={() => handleEdit(performance)}
                          className="p-1 lg:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="수정"
                        >
                          <Edit2 className="w-3 h-3 lg:w-4 lg:h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(performance.id, performance.organizationName, performance.date)}
                          className="p-1 lg:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="w-3 h-3 lg:w-4 lg:h-4" />
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
          <div className="text-center py-12">
            <p className="text-gray-500">
              {performances.length === 0 ? '실적 데이터가 없습니다' : '검색 조건에 맞는 데이터가 없습니다'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceList;