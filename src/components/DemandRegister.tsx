import React, { useState, useRef } from 'react';
import { Upload, FileText, Download, Plus, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { parseExcelData, downloadTemplate } from '../utils/excel';
import { useFirebaseData } from '../hooks/useFirebaseData';
import { useToast } from '../hooks/useToast';

interface DemandFormData {
  city: string;
  organizationName: string;
  contactPerson: string;
  phoneNumber: string;
  email: string;
}

const CITIES = [
  '가평군', '고양시', '과천시', '광명시', '광주시', '구리시', '군포시', '김포시',
  '남양주시', '동두천시', '부천시', '성남시', '수원시', '시흥시', '안산시', '안성시',
  '안양시', '양주시', '양평군', '여주시', '연천군', '오산시', '용인시', '의왕시',
  '의정부시', '이천시', '파주시', '평택시', '포천시', '하남시', '화성시'
];

const DemandRegister: React.FC = () => {
  const { addToast } = useToast();
  const { addDemand } = useFirebaseData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'manual' | 'bulk'>('manual');
  const [isDragOver, setIsDragOver] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showInstructionModal, setShowInstructionModal] = useState(false);
  const [showUploadSuccessModal, setShowUploadSuccessModal] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success: number; error: number }>({ success: 0, error: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState<DemandFormData>({
    city: '',
    organizationName: '',
    contactPerson: '',
    phoneNumber: '',
    email: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.city || !formData.organizationName || !formData.contactPerson || !formData.phoneNumber) {
      addToast({
        type: 'error',
        title: '입력 오류',
        message: '필수 항목을 모두 입력해주세요'
      });
      return;
    }

    setIsLoading(true);
    try {
      await addDemand({
        city: formData.city,
        organizationName: formData.organizationName,
        contactPerson: formData.contactPerson,
        phoneNumber: formData.phoneNumber,
        email: formData.email || ''
      });

      setShowSuccessModal(true);

      setFormData({
        city: '',
        organizationName: '',
        contactPerson: '',
        phoneNumber: '',
        email: ''
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: '등록 실패',
        message: '수요처 등록 중 오류가 발생했습니다'
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
        const parsedData = parseExcelData(content);
        
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

        for (const demand of parsedData) {
          try {
            if (demand.city && demand.organizationName && demand.contactPerson && demand.phoneNumber) {
              await addDemand(demand);
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">수요처 등록</h1>
        <p className="text-gray-600">수기 입력 또는 CSV 파일로 수요처를 등록하세요</p>
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200 mb-6 lg:mb-8">
        <nav className="-mb-px flex space-x-4 lg:space-x-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('manual')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'manual'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Plus className="w-4 h-4 inline mr-2" />
            수기 입력
          </button>
          <button
            onClick={() => setActiveTab('bulk')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
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
        <div className="glass-card rounded-lg p-4 lg:p-8">
          <form onSubmit={handleManualSubmit} className="space-y-4 lg:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                  시/군 *
                </label>
                <select
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                >
                  <option value="">시/군을 선택하세요</option>
                  {CITIES.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700 mb-2">
                  단체명 *
                </label>
                <input
                  type="text"
                  id="organizationName"
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="단체명을 입력하세요"
                  required
                />
              </div>
              <div>
                <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700 mb-2">
                  담당자명 *
                </label>
                <input
                  type="text"
                  id="contactPerson"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="담당자명을 입력하세요"
                  required
                />
              </div>
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  연락처 *
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="연락처를 입력하세요"
                  required
                />
              </div>
              <div className="lg:col-span-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  이메일 (선택사항)
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="이메일 주소를 입력하세요"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="w-full lg:w-auto bg-blue-600 text-white px-6 lg:px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    등록 중...
                  </>
                ) : (
                  '수요처 등록'
                )}
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
                  CSV 파일을 업로드하세요. 열 순서: 시/군, 단체명, 담당자명, 연락처, 이메일(선택)
                </p>
                <div className="flex items-center space-x-4 mt-3">
                  <button
                    onClick={downloadTemplate}
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

          <div className="glass-card rounded-lg p-8">
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
              {isUploading ? (
                <>
                  <Loader2 className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    파일을 업로드하고 있습니다...
                  </p>
                  <p className="text-gray-500 mb-2">잠시만 기다려주세요</p>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 모달들 */}
      {showSuccessModal && (
        <div className="fixed inset-0 glass-overlay flex items-center justify-center z-50 p-4">
          <div className="glass-modal rounded-lg p-6 lg:p-8 max-w-md w-full">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">등록 완료!</h3>
              <p className="text-gray-600 mb-6">수요처가 성공적으로 등록되었습니다.</p>
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

      {showUploadSuccessModal && (
        <div className="fixed inset-0 glass-overlay flex items-center justify-center z-50 p-4">
          <div className="glass-modal rounded-lg p-6 lg:p-8 max-w-md w-full">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">업로드 완료!</h3>
              <div className="text-gray-600 mb-6">
                <p className="mb-2">파일 업로드가 완료되었습니다.</p>
                <div className="bg-gray-50 rounded-lg p-4 text-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span>성공:</span>
                    <span className="font-semibold text-green-600">{uploadResult.success}건</span>
                  </div>
                  {uploadResult.error > 0 && (
                    <div className="flex justify-between items-center">
                      <span>실패:</span>
                      <span className="font-semibold text-red-600">{uploadResult.error}건</span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowUploadSuccessModal(false)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {showInstructionModal && (
        <div className="fixed inset-0 glass-overlay flex items-center justify-center z-50 p-4">
          <div className="glass-modal rounded-lg p-6 lg:p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">CSV 파일 저장 방법</h3>
              <p className="text-gray-600">한글이 깨지지 않게 저장하는 방법을 안내합니다.</p>
            </div>

            <div className="space-y-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">📊 Microsoft Excel 사용시</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                  <li>템플릿을 다운로드하여 엑셀에서 열기</li>
                  <li>데이터 입력 완료 후 <strong>파일 → 다른 이름으로 저장</strong> 클릭</li>
                  <li>파일 형식에서 <strong>"CSV UTF-8(쉼표로 분리)(*.csv)"</strong> 선택</li>
                  <li>파일명 입력 후 저장</li>
                  <li>저장된 CSV 파일을 업로드</li>
                </ol>
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    <strong>주의:</strong> "CSV(쉼표로 분리)" 대신 반드시 <strong>"CSV UTF-8"</strong>을 선택하세요!
                  </p>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">📋 Google Sheets 사용시</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                  <li>구글 시트에서 데이터 입력</li>
                  <li><strong>파일 → 다운로드 → 쉼표로 구분된 값(.csv, 현재 시트)</strong> 선택</li>
                  <li>다운로드된 파일을 업로드</li>
                </ol>
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm text-green-800">
                    구글 시트는 자동으로 UTF-8로 저장되어 한글 문제가 없습니다.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowInstructionModal(false)}
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

export default DemandRegister;