import React, { useState, useRef } from 'react';
import { Upload, FileText, Download, Plus, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { parseExcelData, downloadTemplate } from '../utils/excel';
import { useFirebaseData } from '../hooks/useFirebaseData';
import { useToast } from '../hooks/useToast';
import { AVAILABLE_YEARS, CURRENT_YEAR } from '../utils/yearUtils';
import { buildDemandUploadConfirmation } from '../utils/demandUploadConfirmation';
import { CITIES } from '../constants';
import Modal from './common/Modal';
import SegmentedFilter from './common/SegmentedFilter';

interface DemandFormData {
  year: number;
  city: string;
  organizationName: string;
  contactPerson: string;
  phoneNumber: string;
  email: string;
}

const DemandRegister: React.FC = () => {
  const { addToast } = useToast();
  const { addDemand } = useFirebaseData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'manual' | 'bulk'>('manual');
  const [isDragOver, setIsDragOver] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showInstructionModal, setShowInstructionModal] = useState(false);
  const [showUploadSuccessModal, setShowUploadSuccessModal] = useState(false);
  const [showUploadConfirmModal, setShowUploadConfirmModal] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success: number; error: number }>({ success: 0, error: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingUploadFile, setPendingUploadFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<DemandFormData>({
    year: CURRENT_YEAR,
    city: '',
    organizationName: '',
    contactPerson: '',
    phoneNumber: '',
    email: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'year' ? Number(value) : value }));
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.city || !formData.organizationName || !formData.contactPerson || !formData.phoneNumber) {
      addToast({ type: 'error', title: '입력 오류', message: '필수 항목을 모두 입력해주세요' });
      return;
    }

    setIsLoading(true);
    try {
      await addDemand({
        year: formData.year,
        city: formData.city,
        organizationName: formData.organizationName,
        contactPerson: formData.contactPerson,
        phoneNumber: formData.phoneNumber,
        email: formData.email || ''
      });
      setShowSuccessModal(true);
      setFormData({
        year: formData.year,
        city: '',
        organizationName: '',
        contactPerson: '',
        phoneNumber: '',
        email: ''
      });
    } catch {
      addToast({ type: 'error', title: '등록 실패', message: '수요처 등록 중 오류가 발생했습니다' });
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
        const parsedData = parseExcelData(content, formData.year);

        if (parsedData.length === 0) {
          addToast({ type: 'warning', title: '데이터 없음', message: '파일에서 유효한 데이터를 찾을 수 없습니다' });
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
      } catch {
        addToast({ type: 'error', title: '업로드 오류', message: '파일 형식을 확인해주세요' });
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
      setPendingUploadFile(files[0]);
      setShowUploadConfirmModal(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setPendingUploadFile(files[0]);
      setShowUploadConfirmModal(true);
    }
    e.target.value = '';
  };

  const handleConfirmUpload = async () => {
    if (!pendingUploadFile) return;
    setShowUploadConfirmModal(false);
    await handleFileUpload(pendingUploadFile);
    setPendingUploadFile(null);
  };

  const handleCancelUpload = () => {
    setShowUploadConfirmModal(false);
    setPendingUploadFile(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">수요처 등록</h1>
        <p className="text-gray-500 mt-1">{formData.year}년 수요처를 수기 입력 또는 CSV 파일로 등록하세요</p>
      </div>

      {/* 탭 네비게이션 */}
      <div className="tab-container inline-flex">
        <button
          onClick={() => setActiveTab('manual')}
          className={`tab-item ${activeTab === 'manual' ? 'active' : ''}`}
        >
          <Plus className="w-4 h-4" />
          <span>수기 입력</span>
        </button>
        <button
          onClick={() => setActiveTab('bulk')}
          className={`tab-item ${activeTab === 'bulk' ? 'active' : ''}`}
        >
          <Upload className="w-4 h-4" />
          <span>일괄 업로드</span>
        </button>
      </div>

      {/* 수기 입력 폼 */}
      {activeTab === 'manual' && (
        <div className="glass-card p-6 lg:p-8 animate-fadeIn">
          <form onSubmit={handleManualSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">연도 *</label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  className="select-glass w-full"
                  required
                >
                  {AVAILABLE_YEARS.map(y => (
                    <option key={y} value={y}>{y}년</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">시/군 *</label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="select-glass w-full"
                  required
                >
                  <option value="">시/군을 선택하세요</option>
                  {CITIES.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">단체명 *</label>
                <input
                  type="text"
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleInputChange}
                  className="input-glass"
                  placeholder="단체명을 입력하세요"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">담당자명 *</label>
                <input
                  type="text"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleInputChange}
                  className="input-glass"
                  placeholder="담당자명을 입력하세요"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">연락처 *</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className="input-glass"
                  placeholder="연락처를 입력하세요"
                  required
                />
              </div>
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">이메일 (선택사항)</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="input-glass"
                  placeholder="이메일 주소를 입력하세요"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="btn-primary w-full lg:w-auto flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
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

      {/* 일괄 업로드 */}
      {activeTab === 'bulk' && (
        <div className="space-y-6 animate-fadeIn">
          {/* 연도 선택 */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-sm font-medium text-gray-700">등록 연도:</span>
              <SegmentedFilter
                options={AVAILABLE_YEARS.map(y => ({ value: y, label: `${y}년` }))}
                value={formData.year}
                onChange={(y) => setFormData(prev => ({ ...prev, year: y }))}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">선택한 연도({formData.year}년)로 파일 내 모든 수요처가 일괄 등록됩니다.</p>
          </div>

          {/* 안내 */}
          <div className="glass p-5 rounded-2xl border border-blue-200/50 bg-blue-50/30">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-500 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900">파일 형식 안내</h3>
                <p className="text-sm text-gray-600 mt-1">
                  CSV 파일을 업로드하면 현재 선택된 연도({formData.year}년)로 저장됩니다. 열 순서: 시/군, 단체명, 담당자명, 연락처, 이메일(선택)
                </p>
                <div className="flex flex-wrap items-center gap-4 mt-3">
                  <button
                    onClick={downloadTemplate}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                  >
                    <Download className="w-4 h-4" />
                    템플릿 다운로드
                  </button>
                  <button
                    onClick={() => setShowInstructionModal(true)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                  >
                    <AlertCircle className="w-4 h-4" />
                    저장 방법 보기
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 업로드 영역 */}
          <div className="glass-card p-8">
            <div
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
                isDragOver
                  ? 'border-blue-400 bg-blue-50/50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
                  <p className="text-lg font-medium text-gray-900 mb-2">파일을 업로드하고 있습니다...</p>
                  <p className="text-gray-500">잠시만 기다려주세요</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-lg font-medium text-gray-900 mb-2">CSV 파일을 여기에 드롭하세요</p>
                  <p className="text-gray-500 mb-2">또는 클릭하여 파일을 선택하세요</p>
                  <p className="text-sm text-amber-600 mb-6">한글이 깨지는 경우 "저장 방법 보기"를 참고하세요</p>

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
        <Modal onClose={() => setShowSuccessModal(false)} size="md">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">등록 완료!</h3>
            <p className="text-gray-500 mb-6">{formData.year}년 수요처가 성공적으로 등록되었습니다.</p>
            <button onClick={() => setShowSuccessModal(false)} className="btn-primary">
              확인
            </button>
          </div>
        </Modal>
      )}

      {/* 업로드 성공 모달 */}
      {showUploadSuccessModal && (
        <Modal onClose={() => setShowUploadSuccessModal(false)} size="md">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">업로드 완료!</h3>
            <p className="text-sm text-gray-500 mb-4">{formData.year}년 수요처로 저장되었습니다.</p>
            <div className="glass p-4 rounded-xl mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">성공</span>
                <span className="font-bold text-emerald-600">{uploadResult.success}건</span>
              </div>
              {uploadResult.error > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">실패</span>
                  <span className="font-bold text-rose-600">{uploadResult.error}건</span>
                </div>
              )}
            </div>
            <button onClick={() => setShowUploadSuccessModal(false)} className="btn-primary">
              확인
            </button>
          </div>
        </Modal>
      )}

      {/* 업로드 확인 모달 */}
      {showUploadConfirmModal && pendingUploadFile && (
        <Modal onClose={handleCancelUpload} size="md">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">업로드 연도 확인</h3>
            <p className="text-gray-600 mb-3">
              {buildDemandUploadConfirmation(formData.year, pendingUploadFile.name)}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              선택한 연도에 맞게 저장됩니다. 업로드 전에 연도를 다시 확인해주세요.
            </p>
            <div className="flex gap-3">
              <button onClick={handleCancelUpload} className="btn-glass flex-1">
                취소
              </button>
              <button onClick={handleConfirmUpload} className="btn-primary flex-1">
                계속 진행
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 저장 방법 안내 모달 */}
      {showInstructionModal && (
        <Modal onClose={() => setShowInstructionModal(false)} title="CSV 파일 저장 방법" size="lg">
          <div className="space-y-4">
            <div className="glass p-5 rounded-xl">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-lg">📊</span> Microsoft Excel 사용시
              </h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                <li>템플릿을 다운로드하여 엑셀에서 열기</li>
                <li>데이터 입력 완료 후 <strong>파일 → 다른 이름으로 저장</strong> 클릭</li>
                <li>파일 형식에서 <strong>"CSV UTF-8(쉼표로 분리)(*.csv)"</strong> 선택</li>
                <li>파일명 입력 후 저장</li>
              </ol>
              <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-800">
                  <strong>주의:</strong> "CSV(쉼표로 분리)" 대신 반드시 <strong>"CSV UTF-8"</strong>을 선택하세요!
                </p>
              </div>
            </div>

            <div className="glass p-5 rounded-xl">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-lg">📋</span> Google Sheets 사용시
              </h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                <li>구글 시트에서 데이터 입력</li>
                <li><strong>파일 → 다운로드 → 쉼표로 구분된 값(.csv)</strong> 선택</li>
                <li>다운로드된 파일을 업로드</li>
              </ol>
              <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <p className="text-sm text-emerald-800">
                  구글 시트는 자동으로 UTF-8로 저장되어 한글 문제가 없습니다.
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DemandRegister;
