import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Save, Users, Megaphone, CheckCircle, Upload, FileText, Download, AlertCircle, Loader2, ClipboardList } from 'lucide-react';
import { useFirebaseData } from '../hooks/useFirebaseData';
import { useToast } from '../hooks/useToast';
import { parsePerformanceExcelData, downloadPerformanceTemplate } from '../utils/excel';
import { getDemandOptionsForPerformanceDate } from '../utils/performanceOrganizations';
import { getYearFromDate } from '../utils/yearUtils';

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
  const [organizationSearchTerm, setOrganizationSearchTerm] = useState('');
  const [showOrganizationDropdown, setShowOrganizationDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState<PerformanceFormData>({
    date: new Date().toISOString().split('T')[0],
    organizationName: '',
    program: '스포츠교실',
    maleCount: '',
    femaleCount: '',
    promotionCount: '',
    notes: ''
  });

  const selectedYear = getYearFromDate(formData.date);
  const organizationNames = getDemandOptionsForPerformanceDate(demands, formData.date);

  const filteredOrganizations = organizationNames.filter(name =>
    name.toLowerCase().includes(organizationSearchTerm.toLowerCase())
  );

  const selectedDemand = demands.find(
    d => d.organizationName === formData.organizationName && d.year === selectedYear
  );
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

    setIsLoading(true);
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
      setOrganizationSearchTerm('');
      setShowOrganizationDropdown(false);
    } catch (error) {
      addToast({
        type: 'error',
        title: '저장 실패',
        message: '실적 데이터 저장 중 오류가 발생했습니다'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
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
      } finally {
        setIsUploading(false);
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

  useEffect(() => {
    if (!formData.organizationName) {
      return;
    }

    const hasSelectedOrganizationInYear = demands.some(
      (demand) => demand.organizationName === formData.organizationName && demand.year === selectedYear
    );

    if (!hasSelectedOrganizationInYear) {
      setFormData(prev => ({ ...prev, organizationName: '' }));
      setOrganizationSearchTerm('');
      setShowOrganizationDropdown(false);
    }
  }, [demands, formData.date, formData.organizationName, selectedYear]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.organization-dropdown')) {
        setShowOrganizationDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <ClipboardList className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">실적 입력</h1>
            <p className="text-gray-500">{selectedYear}년 기준 수요처로 수기 입력하거나 CSV 파일로 실적 데이터를 등록하세요</p>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="tab-container mb-8">
        <button
          onClick={() => setActiveTab('manual')}
          className={`tab-item ${activeTab === 'manual' ? 'active' : ''}`}
        >
          <Save className="w-4 h-4" />
          수기 입력
        </button>
        <button
          onClick={() => setActiveTab('bulk')}
          className={`tab-item ${activeTab === 'bulk' ? 'active' : ''}`}
        >
          <Upload className="w-4 h-4" />
          일괄 업로드
        </button>
      </div>

      {activeTab === 'manual' && (
        <div className="glass-card p-6 lg:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                  날짜 *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="input-glass pl-12"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700 mb-2">
                  단체명 *
                </label>
                <div className="relative organization-dropdown">
                  <input
                    type="text"
                    placeholder="단체명을 검색하세요..."
                    value={organizationSearchTerm}
                    onChange={(e) => {
                      setOrganizationSearchTerm(e.target.value);
                      setShowOrganizationDropdown(true);
                    }}
                    onFocus={() => setShowOrganizationDropdown(true)}
                    className="input-glass"
                  />
                  {formData.organizationName && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, organizationName: '' }));
                          setOrganizationSearchTerm('');
                        }}
                        className="text-gray-400 hover:text-gray-600 p-1"
                      >
                        ×
                      </button>
                    </div>
                  )}

                  {showOrganizationDropdown && (
                    <div className="absolute z-10 w-full mt-2 glass rounded-xl shadow-xl max-h-60 overflow-y-auto">
                      {filteredOrganizations.length > 0 ? (
                        filteredOrganizations.map(name => (
                          <button
                            key={name}
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, organizationName: name }));
                              setOrganizationSearchTerm(name);
                              setShowOrganizationDropdown(false);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors first:rounded-t-xl last:rounded-b-xl"
                          >
                            {name}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-gray-500 text-center">
                          검색 결과가 없습니다
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {organizationNames.length === 0 && (
                  <p className="text-sm text-amber-600 mt-2">
                    {selectedYear}년 등록 수요처가 없습니다. 먼저 해당 연도 수요처를 등록해주세요.
                  </p>
                )}
                {organizationNames.length > 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    현재 {selectedYear}년 수요처만 표시됩니다.
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
                  className="select-glass"
                  required
                >
                  <option value="스포츠교실">스포츠교실</option>
                  <option value="스포츠체험존">스포츠체험존</option>
                  <option value="스포츠이벤트">스포츠이벤트</option>
                </select>
              </div>
            </div>

            {formData.organizationName && (
              <div className="glass p-4 rounded-xl border border-blue-200 bg-blue-50/50">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">선택된 단체:</span> {formData.organizationName}
                  {selectedCity && <span className="badge-blue ml-2">{selectedCity}</span>}
                </p>
              </div>
            )}

            {/* 인원수 입력 */}
            <div className="glass p-6 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/50 to-cyan-50/50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div className="stat-icon-blue mr-3">
                  <Users className="w-5 h-5" />
                </div>
                참여 인원
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                    className="input-glass"
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
                    className="input-glass"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    총 인원
                  </label>
                  <div className="input-glass bg-gray-50 text-gray-700 font-bold flex items-center">
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
                className="input-glass"
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
                className="input-glass resize-none"
                placeholder="추가 메모를 입력하세요..."
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full lg:w-auto px-8"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                <span>실적 저장</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'bulk' && (
        <div className="space-y-6">
          <div className="glass-card p-6 border-l-4 border-l-blue-500">
            <div className="flex items-start gap-4">
              <div className="stat-icon-blue">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">파일 형식 안내</h3>
                <p className="text-sm text-gray-600 mb-3">
                  CSV 파일을 업로드하세요. 열 순서: 날짜, 단체명, 시군, 프로그램, 남성, 여성, 홍보횟수, 메모
                </p>
                <div className="glass p-3 rounded-xl bg-amber-50/50 border border-amber-200 mb-4">
                  <p className="text-sm text-amber-800">
                    <strong>중요:</strong> 날짜는 YYYY-MM-DD 형식으로 입력하세요 (예: 2024-01-15)
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={downloadPerformanceTemplate}
                    className="btn-glass text-sm"
                  >
                    <Download className="w-4 h-4" />
                    템플릿 다운로드
                  </button>
                  <button
                    onClick={() => setShowInstructionModal(true)}
                    className="btn-glass text-sm"
                  >
                    <AlertCircle className="w-4 h-4" />
                    저장 방법 보기
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-8">
            <div
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                isDragOver
                  ? 'border-blue-500 bg-blue-50/50 scale-[1.02]'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
                  <p className="text-lg font-semibold text-gray-900 mb-2">
                    파일을 업로드하고 있습니다...
                  </p>
                  <p className="text-gray-500">잠시만 기다려주세요</p>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-10 h-10 text-blue-500" />
                  </div>
                  <p className="text-lg font-semibold text-gray-900 mb-2">
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
                    className="btn-primary"
                  >
                    파일 선택
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 성공 모달 */}
      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="modal-content text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">저장 완료!</h3>
            <p className="text-gray-600 mb-6">실적 데이터가 성공적으로 저장되었습니다.</p>
            <button
              onClick={() => {
                setShowSuccessModal(false);
                setFormData({
                  date: new Date().toISOString().split('T')[0],
                  organizationName: '',
                  program: '스포츠교실',
                  maleCount: '',
                  femaleCount: '',
                  promotionCount: '',
                  notes: ''
                });
                setOrganizationSearchTerm('');
                setShowOrganizationDropdown(false);
              }}
              className="btn-primary"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 업로드 완료 모달 */}
      {showUploadSuccessModal && (
        <div className="modal-overlay">
          <div className="modal-content text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">일괄등록 완료!</h3>
            <div className="text-gray-600 mb-6">
              <p className="mb-4">실적 데이터 일괄등록이 완료되었습니다.</p>
              <div className="glass p-4 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">성공:</span>
                  <span className="font-bold text-emerald-600">{uploadResult.success}건</span>
                </div>
                {uploadResult.error > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">실패:</span>
                    <span className="font-bold text-rose-600">{uploadResult.error}건</span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowUploadSuccessModal(false)}
              className="btn-primary"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 저장 방법 모달 */}
      {showInstructionModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">실적 데이터 저장 방법</h3>
              <p className="text-gray-600">실적 데이터를 올바르게 저장하는 방법을 안내합니다.</p>
            </div>

            <div className="space-y-4">
              <div className="glass-panel p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-lg">📊</span> 수기 입력 방법
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                  <li>날짜를 선택하세요 (필수)</li>
                  <li>단체명을 검색하여 선택하세요 (필수)</li>
                  <li>프로그램 유형을 선택하세요</li>
                  <li>남성/여성 인원수를 입력하세요</li>
                  <li>홍보 횟수를 입력하세요 (선택사항)</li>
                  <li>메모를 입력하세요 (선택사항)</li>
                  <li>"실적 저장" 버튼을 클릭하세요</li>
                </ol>
              </div>

              <div className="glass-panel p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-lg">📋</span> CSV 파일 업로드 방법
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                  <li>템플릿을 다운로드하여 엑셀에서 열기</li>
                  <li>데이터 입력 완료 후 <strong>파일 → 다른 이름으로 저장</strong> 클릭</li>
                  <li>파일 형식에서 <strong>"CSV UTF-8(쉼표로 분리)(*.csv)"</strong> 선택</li>
                  <li>파일명 입력 후 저장</li>
                  <li>저장된 CSV 파일을 업로드</li>
                </ol>
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-sm text-amber-800">
                    <strong>주의:</strong> "CSV(쉼표로 분리)" 대신 반드시 <strong>"CSV UTF-8"</strong>을 선택하세요!
                  </p>
                </div>
              </div>

              <div className="glass-panel p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-lg">📅</span> 날짜 형식
                </h4>
                <p className="text-sm text-gray-700 mb-2">날짜는 반드시 YYYY-MM-DD 형식으로 입력해야 합니다:</p>
                <ul className="list-disc list-inside text-sm text-gray-700">
                  <li><span className="text-emerald-600">올바른 형식:</span> 2024-01-15, 2024-12-31</li>
                  <li><span className="text-rose-600">잘못된 형식:</span> 2024/01/15, 2024.01.15, 01-15-2024</li>
                </ul>
              </div>

              <div className="glass-panel p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-lg">🔧</span> 한글 깨짐 해결방법
                </h4>
                <p className="text-sm text-gray-700 mb-2">파일 업로드 시 한글이 깨지는 경우:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                  <li>엑셀에서 파일을 다시 열기</li>
                  <li>파일 → 다른 이름으로 저장</li>
                  <li>파일 형식에서 "CSV UTF-8(쉼표로 분리)" 선택</li>
                  <li>새로운 파일로 저장 후 업로드</li>
                </ol>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowInstructionModal(false)}
                className="btn-primary"
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
