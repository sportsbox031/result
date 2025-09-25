import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Save, X, Search } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { Demand } from '../types';
import { useFirebaseData } from '../hooks/useFirebaseData';

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
  const [editForm, setEditForm] = useState<Partial<Demand>>({});

  const filteredDemands = demands.filter(demand =>
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
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
          수요처 관리
        </h1>
        <p className="text-lg text-gray-600">등록된 수요처 정보를 조회, 수정, 삭제할 수 있습니다</p>
      </div>

      {/* 총 건수 표시 */}
      <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="text-sm lg:text-base text-gray-600 font-medium bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2 rounded-lg border border-blue-100">
          총 {demands.length}건 중 {filteredDemands.length}건 표시
        </div>
        <div className="relative max-w-full lg:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="수요처 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
          />
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-xl shadow-lg border-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">시/군</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">단체명</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">담당자</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">연락처</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 hidden lg:table-cell">이메일</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 hidden lg:table-cell">등록일</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDemands.map((demand) => (
                <tr key={demand.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200">
                  <td className="px-6 py-4">
                    {editingId === demand.id ? (
                      <select
                        value={editForm.city || ''}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                      >
                        <option value="">시/군 선택</option>
                        {CITIES.map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-sm font-medium text-gray-900 bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                        {demand.city}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === demand.id ? (
                      <input
                        type="text"
                        value={editForm.organizationName || ''}
                        onChange={(e) => handleInputChange('organizationName', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                      />
                    ) : (
                      <span className="text-sm font-bold text-gray-900">{demand.organizationName}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === demand.id ? (
                      <input
                        type="text"
                        value={editForm.contactPerson || ''}
                        onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                      />
                    ) : (
                      <span className="text-sm font-semibold text-gray-900">{demand.contactPerson}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === demand.id ? (
                      <input
                        type="tel"
                        value={editForm.phoneNumber || ''}
                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                      />
                    ) : (
                      <span className="text-sm font-mono text-gray-900 bg-gray-100 px-3 py-1 rounded-lg">
                        {demand.phoneNumber}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    {editingId === demand.id ? (
                      <input
                        type="email"
                        value={editForm.email || ''}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                      />
                    ) : (
                      <span className="text-sm text-gray-600">{demand.email || '-'}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-lg font-mono">
                      {demand.createdAt.toLocaleDateString('ko-KR')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {editingId === demand.id ? (
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={handleSave}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-all duration-200 hover:scale-110"
                          title="저장"
                        >
                          <Save className="w-5 h-5" />
                        </button>
                        <button
                          onClick={handleCancel}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-110"
                          title="취소"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(demand)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all duration-200 hover:scale-110"
                          title="수정"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(demand.id, demand.organizationName)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all duration-200 hover:scale-110"
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
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-lg font-medium text-gray-500">검색 결과가 없습니다</p>
          </div>
        )}
      </div>


    </div>
  );
};

export default DemandList;