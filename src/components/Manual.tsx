import React from 'react';
import { BookOpen, Users, TrendingUp, FileText, BarChart3, MapPin, AlertTriangle, CheckCircle, Info, ExternalLink } from 'lucide-react';

const Manual: React.FC = () => {
  return (
    <div className="w-full max-w-6xl mx-auto px-2">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
          <BookOpen className="mr-3 h-8 w-8 text-blue-600" />
          스포츠박스 예산/실적 통합관리 시스템 사용 매뉴얼
        </h1>
        <p className="text-gray-600 text-lg">효율적인 스포츠박스 운영을 위한 통합 관리 시스템</p>
      </div>

      {/* 시스템 개요 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8 border border-blue-200">
        <h2 className="text-2xl font-bold text-blue-900 mb-4 flex items-center">
          <Info className="mr-2 h-6 w-6" />
          📋 시스템 개요
        </h2>
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <p className="text-gray-700 mb-3">
              이 시스템은 스포츠박스 운영에 필요한 실적관리와 예산관리를 통합적으로 처리할 수 있는 웹 기반 시스템입니다.
            </p>
            <div className="flex items-center bg-blue-100 rounded-lg p-3">
              <ExternalLink className="mr-2 h-5 w-5 text-blue-600" />
              <span className="font-semibold text-blue-800">접속 주소:</span>
              <a 
                href="https://sportsbox031.github.io/result/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-2 text-blue-600 hover:text-blue-800 underline"
              >
                https://sportsbox031.github.io/result/
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 주요 기능 */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 mb-8 border border-green-200">
        <h2 className="text-2xl font-bold text-green-900 mb-6 flex items-center">
          <BarChart3 className="mr-2 h-6 w-6" />
          🎯 주요 기능
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-6 border border-green-200 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 rounded-full p-2 mr-3">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">1️⃣ 실적 입력</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-gray-700">사용 시점:</span>
                  <span className="text-gray-600 ml-2">수업 완료 후</span>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-gray-700">입력 내용:</span>
                  <span className="text-gray-600 ml-2">프로그램별 수업 실적 데이터</span>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-gray-700">수요처 관리:</span>
                  <span className="text-gray-600 ml-2">기존 수요처 검색 후 없을 경우에만 신규 등록</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-green-200 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="bg-purple-100 rounded-full p-2 mr-3">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">2️⃣ 예산 사용내역</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-gray-700">사용 시점:</span>
                  <span className="text-gray-600 ml-2">지출 발생 후</span>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-gray-700">입력 내용:</span>
                  <span className="text-gray-600 ml-2">예산 사용 관련 모든 내역</span>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-gray-700">지역 구분:</span>
                  <span className="text-gray-600 ml-2">남부/북부 예산 구분을 위한 지역 버튼 제공</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 상세 사용 방법 */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6 mb-8 border border-orange-200">
        <h2 className="text-2xl font-bold text-orange-900 mb-6 flex items-center">
          <BookOpen className="mr-2 h-6 w-6" />
          🔧 상세 사용 방법
        </h2>
        
        {/* 실적 입력 방법 */}
        <div className="bg-white rounded-lg p-6 mb-6 border border-orange-200 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="mr-2 h-5 w-5 text-blue-600" />
            📊 실적 입력 방법
          </h3>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="bg-blue-100 rounded-full w-8 h-8 flex items-center justify-center mr-3 mt-0.5">
                <span className="text-blue-600 font-bold text-sm">1</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">수업 완료 후 시스템 접속</span>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-blue-100 rounded-full w-8 h-8 flex items-center justify-center mr-3 mt-0.5">
                <span className="text-blue-600 font-bold text-sm">2</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">실적 입력 메뉴 선택</span>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-blue-100 rounded-full w-8 h-8 flex items-center justify-center mr-3 mt-0.5">
                <span className="text-blue-600 font-bold text-sm">3</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">수요처 검색</span>
                <div className="ml-6 mt-2 space-y-2">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-gray-600">기존 수요처가 있는 경우: 선택하여 사용</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-gray-600">기존 수요처가 없는 경우: 신규 수요처 등록 진행</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-blue-100 rounded-full w-8 h-8 flex items-center justify-center mr-3 mt-0.5">
                <span className="text-blue-600 font-bold text-sm">4</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">프로그램별 실적 데이터 입력 및 저장</span>
              </div>
            </div>
          </div>
        </div>

        {/* 예산 사용내역 입력 방법 */}
        <div className="bg-white rounded-lg p-6 border border-orange-200 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <FileText className="mr-2 h-5 w-5 text-purple-600" />
            💰 예산 사용내역 입력 방법
          </h3>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="bg-purple-100 rounded-full w-8 h-8 flex items-center justify-center mr-3 mt-0.5">
                <span className="text-purple-600 font-bold text-sm">1</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">지출 발생 후 시스템 접속</span>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-purple-100 rounded-full w-8 h-8 flex items-center justify-center mr-3 mt-0.5">
                <span className="text-purple-600 font-bold text-sm">2</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">예산 사용내역 메뉴 선택</span>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-purple-100 rounded-full w-8 h-8 flex items-center justify-center mr-3 mt-0.5">
                <span className="text-purple-600 font-bold text-sm">3</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">지역 버튼 클릭 (남부/북부 구분)</span>
                <div className="ml-6 mt-2 space-y-2">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-blue-500 mr-2" />
                    <span className="text-gray-600">남부 버튼: 남부 지역 예산 항목만 표시</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-gray-600">북부 버튼: 북부 지역 예산 항목만 표시</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-purple-100 rounded-full w-8 h-8 flex items-center justify-center mr-3 mt-0.5">
                <span className="text-purple-600 font-bold text-sm">4</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">해당 예산 항목 선택 후 사용 내역 입력</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 대시보드 활용 방법 */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mb-8 border border-indigo-200">
        <h2 className="text-2xl font-bold text-indigo-900 mb-6 flex items-center">
          <BarChart3 className="mr-2 h-6 w-6" />
          📈 대시보드 활용 방법
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 border border-indigo-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
              <Users className="mr-2 h-5 w-5 text-blue-600" />
              📋 총 실적 현황 확인
            </h3>
            <p className="text-gray-600 mb-3">총 횟수 클릭 → 프로그램별 횟수 및 참여 인원 상세 조회</p>
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm text-blue-700">
                💡 <strong>팁:</strong> 각 프로그램별 실적을 한눈에 확인할 수 있습니다.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-indigo-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
              <MapPin className="mr-2 h-5 w-5 text-green-600" />
              🗺️ 시군별 참여 현황
            </h3>
            <p className="text-gray-600 mb-3">각 시군명 클릭 → 해당 시군 소속 수요처별 횟수 및 인원 상세 조회</p>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-sm text-green-700">
                💡 <strong>팁:</strong> 지역별 실적 현황을 세부적으로 분석할 수 있습니다.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-indigo-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
              <FileText className="mr-2 h-5 w-5 text-purple-600" />
              💳 예산 사용 현황
            </h3>
            <p className="text-gray-600 mb-3">각 예산명 클릭 → 해당 예산의 세부 사용 내역 조회</p>
            <div className="bg-purple-50 rounded-lg p-3">
              <p className="text-sm text-purple-700">
                💡 <strong>팁:</strong> 예산별 사용 내역을 상세히 확인할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 주의사항 */}
      <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-6 border border-red-200">
        <h2 className="text-2xl font-bold text-red-900 mb-6 flex items-center">
          <AlertTriangle className="mr-2 h-6 w-6" />
          ⚠️ 주의사항
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 border border-red-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
              <Users className="mr-2 h-5 w-5 text-blue-600" />
              ✅ 수요처 관리
            </h3>
            <div className="space-y-3">
              <div className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                <span className="text-gray-600">실적 입력 시 반드시 기존 수요처 검색 먼저 진행</span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                <span className="text-gray-600">검색 결과가 없을 경우에만 신규 수요처 등록</span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                <span className="text-gray-600">중복 등록 방지를 위해 꼼꼼한 검색 필요</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-red-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
              <MapPin className="mr-2 h-5 w-5 text-green-600" />
              ✅ 예산 구분
            </h3>
            <div className="space-y-3">
              <div className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                <span className="text-gray-600">남부/북부 예산 혼동 방지를 위해 지역 버튼 활용 필수</span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                <span className="text-gray-600">지출 전 해당 지역 예산 확인 후 사용내역 입력</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-red-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
              <BarChart3 className="mr-2 h-5 w-5 text-orange-600" />
              ✅ 입력 타이밍
            </h3>
            <div className="space-y-3">
              <div className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                <span className="text-gray-600">실적 입력: 수업 완료 직후</span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                <span className="text-gray-600">예산 사용내역: 지출 발생 직후</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 추가 정보 */}
      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-6 border border-teal-200">
        <h2 className="text-2xl font-bold text-teal-900 mb-4 flex items-center">
          <Info className="mr-2 h-6 w-6" />
          💡 추가 정보
        </h2>
        <div className="bg-white rounded-lg p-6 border border-teal-200 shadow-sm">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">🔐 보안</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>관리자 계정으로만 접근 가능</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>비밀번호 변경 시 모든 사용자에게 적용</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>실시간 데이터 동기화</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">📱 사용성</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>반응형 디자인으로 모바일에서도 사용 가능</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>ESC 키로 빠른 모드 종료</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>엑셀 다운로드 기능 제공</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Manual; 