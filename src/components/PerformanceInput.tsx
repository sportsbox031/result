import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Save, Users, Megaphone, CheckCircle, Upload, FileText, Download, AlertCircle } from 'lucide-react';
import { useFirebaseData } from '../hooks/useFirebaseData';
import { useToast } from '../hooks/useToast';
import { parsePerformanceExcelData, downloadPerformanceTemplate } from '../utils/excel';

interface PerformanceFormData {
  date: string;
  organizationName: string;
  program: '스포츠교실' | '스포츠체험존' | '스포츠이벤트';
  maleCount: string;
  femaleCount: string;
  promotionCount: string;
  notes: string;
}

const PerformanceInput: React.FC = () => {
  const { addToast } = useToast();
  const { demands, addPerformance } = useFirebaseData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'manual' | 'bulk'>('manual');
  const [isDragOver, setIsDragOver] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showUploadSuccessModal, setShowUploadSuccessModal] = useState(false);
  const [showInstructionModal, setShowInstructionModal] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success: number; error: number }>({ success: 0, error: 0 });
  const [formData, setFormData] = useState<PerformanceFormData>({
    date: new Date().toISOString().split('T')[0],
    organizationName: '',
    program: '스포츠교실',
    maleCount: '',
    femaleCount: '',
    promotionCount: '',
    notes: ''
  });

  // 파이어베이스에서 단체명 목록 가져오기
  const organizationNames = Array.from(new Set(demands.map(d => d.organizationName))).sort();

  // 선택된 단체의 시/군 정보 가져오기
  const selectedDemand = demands.find(d => d.organizationName === formData.organizationName);
  const selectedCity = selectedDemand?.city || '';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getTotalCount = () => {
    const male = parseInt(formData.maleCount) || 0;
    const female = parseInt(formData.femaleCount) || 0;
    return male + female;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date || !formData.organizationName) {
      addToast({
        type: 'error',
        title: '입력 오류',
        message: '날짜와 단체명은 필수 항목입니다'
      });
      return;
    }

    const maleCount = parseInt(formData.maleCount) || 0;
    const femaleCount = parseInt(formData.femaleCount) || 0;
    const promotionCount = parseInt(formData.promotionCount) || 0;

    if (maleCount < 0 || femaleCount < 0 || promotionCount < 0) {
      addToast({
        type: 'error',
        title: '입력 오류',
        message: '인원수와 홍보횟수는 0 이상의 숫자를 입력해주세요'
      });
      return;
    }

    try {
      await addPerformance({
        date: new Date(formData.date),
        organizationName: formData.organizationName,
        city: selectedCity,
        program: formData.program,
        maleCount: maleCount,
        femaleCount: femaleCount,
        promotionCount: promotionCount,
        notes: formData.notes ? formData.notes.trim() : ''
      });

      setShowSuccessModal(true);

      setFormData({
        date: new Date().toISOString().split('T')[0],
        organizationName: '',
        program: '스포츠교실',
        maleCount: '',
        femaleCount: '',
        promotionCount: '',
        notes: ''
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: '저장 실패',
        message: '실적 데이터 저장 중 오류가 발생했습니다'
      });
    }
  };

  // 파일 업로드 처리
  const handleFileUpload = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const parsedData = parsePerformanceExcelData(content);
        
        if (parsedData.length === 0) {
          addToast({
            type: 'warning',
            title: '데이터 없음',
            message: '파일에서 유효한 데이터를 찾을 수 없습니다'
          });
          return;
        }

        let successCount = 0;
        let errorCount = 0;

        for (const performance of parsedData) {
          try {
            if (performance.date && performance.organizationName) {
              await addPerformance(performance);
              successCount++;
            } else {
              errorCount++;
            }
          } catch {
            errorCount++;
          }
        }

        setUploadResult({ success: successCount, error: errorCount });
        setShowUploadSuccessModal(true);

      } catch (error) {
        addToast({
          type: 'error',
          title: '업로드 오류',
          message: '파일 형식을 확인해주세요'
        });
      }
    };
    
    reader.readAsText(file, 'UTF-8');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
    e.target.value = '';
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">실적 입력</h1>
        <p className="text-gray-600">수기 입력 또는 CSV 파일로 실적 데이터를 등록하세요</p>
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('manual')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'manual'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Save className="w-4 h-4 inline mr-2" />
            수기 입력
          </button>
          <button
            onClick={() => setActiveTab('bulk')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'bulk'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Upload className="w-4 h-4 inline mr-2" />
            일괄 업로드
          </button>
        </nav>
      </div>

      {activeTab === 'manual' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                  날짜 *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700 mb-2">
                  단체명 *
                </label>
                <select
                  id="organizationName"
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                >
                  <option value="">단체를 선택하세요</option>
                  {organizationNames.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                {organizationNames.length === 0 && (
                  <p className="text-sm text-amber-600 mt-1">
                    등록된 단체가 없습니다. 먼저 수요처를 등록해주세요.
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="program" className="block text-sm font-medium text-gray-700 mb-2">
                  프로그램 *
                </label>
                <select
                  id="program"
                  name="program"
                  value={formData.program}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                >
                  <option value="스포츠교실">스포츠교실</option>
                  <option value="스포츠체험존">스포츠체험존</option>
                  <option value="스포츠이벤트">스포츠이벤트</option>
                </select>
              </div>
            </div>

            {/* 선택된 단체의 시/군 정보 표시 */}
            {formData.organizationName && (
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">선택된 단체:</span> {formData.organizationName} 
                  {selectedCity && ` (${selectedCity})`}
                </p>
              </div>
            )}

            {/* 인원수 입력 */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-600" />
                참여 인원
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="maleCount" className="block text-sm font-medium text-gray-700 mb-2">
                    남성 인원
                  </label>
                  <input
                    type="number"
                    id="maleCount"
                    name="maleCount"
                    value={formData.maleCount}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label htmlFor="femaleCount" className="block text-sm font-medium text-gray-700 mb-2">
                    여성 인원
                  </label>
                  <input
                    type="number"
                    id="femaleCount"
                    name="femaleCount"
                    value={formData.femaleCount}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    총 인원
                  </label>
                  <div className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-medium">
                    {getTotalCount().toLocaleString()}명
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="promotionCount" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Megaphone className="w-4 h-4 mr-2 text-orange-500" />
                홍보 횟수
              </label>
              <input
                type="number"
                id="promotionCount"
                name="promotionCount"
                value={formData.promotionCount}
                onChange={handleInputChange}
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="홍보 횟수를 입력하세요"
              />
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                메모 (선택사항)
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                placeholder="추가 메모를 입력하세요..."
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                실적 저장
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'bulk' && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <FileText className="w-5 h-5 text-blue-500 mt-0.5 mr-3" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-800">파일 형식 안내</h3>
                <p className="text-sm text-blue-700 mt-1">
                  CSV 파일을 업로드하세요. 열 순서: 날짜, 단체명, 시군, 프로그램, 남성, 여성, 홍보횟수, 메모
                </p>
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    <strong>중요:</strong> 날짜는 YYYY-MM-DD 형식으로 입력하세요 (예: 2024-01-15)
                  </p>
                </div>
                <div className="flex items-center space-x-4 mt-3">
                  <button
                    onClick={downloadPerformanceTemplate}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    템플릿 다운로드
                  </button>
                  <button
                    onClick={() => setShowInstructionModal(true)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                  >
                    <AlertCircle className="w-4 h-4 mr-1" />
                    저장 방법 보기
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                isDragOver
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                CSV 파일을 여기에 드롭하거나 클릭하여 선택하세요
              </p>
              <p className="text-gray-500 mb-2">최대 10MB까지 지원합니다</p>
              <p className="text-sm text-amber-600 mb-6">
                한글이 깨지는 경우 "저장 방법 보기"를 참고하세요
              </p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                파일 선택
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 성공 모달 */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">저장 완료!</h3>
              <p className="text-gray-600 mb-6">실적 데이터가 성공적으로 저장되었습니다.</p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceInput;