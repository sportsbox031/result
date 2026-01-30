import React from 'react';
import { BookOpen, Users, TrendingUp, FileText, BarChart3, MapPin, AlertTriangle, CheckCircle, Info, ExternalLink } from 'lucide-react';

const Manual: React.FC = () => {
  return (
    <div className="w-full max-w-6xl mx-auto animate-fadeIn">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">사용 매뉴얼</h1>
            <p className="text-gray-500">스포츠박스 예산/실적 통합관리 시스템</p>
          </div>
        </div>
      </div>

      {/* 시스템 개요 */}
      <div className="glass-card p-6 mb-6 border-l-4 border-l-blue-500">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-500" />
          시스템 개요
        </h2>
        <div className="space-y-4">
          <p className="text-gray-600">
            이 시스템은 스포츠박스 운영에 필요한 실적관리와 예산관리를 통합적으로 처리할 수 있는 웹 기반 시스템입니다.
          </p>
          <div className="glass p-4 rounded-xl border border-blue-100 bg-blue-50/50 flex items-center gap-3">
            <ExternalLink className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div>
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
      <div className="glass-card p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-500" />
          주요 기능
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass-panel p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="stat-icon-blue">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">실적 입력</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-gray-700">사용 시점:</span>
                  <span className="text-gray-600 ml-2">수업 완료 후</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-gray-700">입력 내용:</span>
                  <span className="text-gray-600 ml-2">프로그램별 수업 실적 데이터</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-gray-700">수요처 관리:</span>
                  <span className="text-gray-600 ml-2">기존 수요처 검색 후 없을 경우에만 신규 등록</span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="stat-icon-violet">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">예산 사용내역</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-gray-700">사용 시점:</span>
                  <span className="text-gray-600 ml-2">지출 발생 후</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-gray-700">입력 내용:</span>
                  <span className="text-gray-600 ml-2">예산 사용 관련 모든 내역</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-gray-700">지역 구분:</span>
                  <span className="text-gray-600 ml-2">남부/북부 예산 구분을 위한 지역 버튼 제공</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 상세 사용 방법 */}
      <div className="glass-card p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-500" />
          상세 사용 방법
        </h2>

        {/* 실적 입력 방법 */}
        <div className="glass-panel p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            실적 입력 방법
          </h3>
          <div className="space-y-4">
            {['수업 완료 후 시스템 접속', '실적 입력 메뉴 선택', '수요처 검색', '프로그램별 실적 데이터 입력 및 저장'].map((step, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">{index + 1}</span>
                </div>
                <div className="pt-1">
                  <span className="font-medium text-gray-700">{step}</span>
                  {index === 2 && (
                    <div className="mt-2 space-y-2 ml-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span>기존 수요처가 있는 경우: 선택하여 사용</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span>기존 수요처가 없는 경우: 신규 수요처 등록 진행</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 예산 사용내역 입력 방법 */}
        <div className="glass-panel p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-violet-600" />
            예산 사용내역 입력 방법
          </h3>
          <div className="space-y-4">
            {['지출 발생 후 시스템 접속', '예산 사용내역 메뉴 선택', '지역 버튼 클릭 (남부/북부 구분)', '해당 예산 항목 선택 후 사용 내역 입력'].map((step, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">{index + 1}</span>
                </div>
                <div className="pt-1">
                  <span className="font-medium text-gray-700">{step}</span>
                  {index === 2 && (
                    <div className="mt-2 space-y-2 ml-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 text-blue-500" />
                        <span>남부 버튼: 남부 지역 예산 항목만 표시</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 text-emerald-500" />
                        <span>북부 버튼: 북부 지역 예산 항목만 표시</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 대시보드 활용 방법 */}
      <div className="glass-card p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-500" />
          대시보드 활용 방법
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="glass-panel p-5">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-gray-900">총 실적 현황 확인</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">총 횟수 클릭 → 프로그램별 횟수 및 참여 인원 상세 조회</p>
            <div className="glass p-3 rounded-xl bg-blue-50/50 border border-blue-100">
              <p className="text-xs text-blue-700">
                <strong>팁:</strong> 각 프로그램별 실적을 한눈에 확인할 수 있습니다.
              </p>
            </div>
          </div>

          <div className="glass-panel p-5">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-gray-900">시군별 참여 현황</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">각 시군명 클릭 → 해당 시군 소속 수요처별 횟수 및 인원 상세 조회</p>
            <div className="glass p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
              <p className="text-xs text-emerald-700">
                <strong>팁:</strong> 지역별 실적 현황을 세부적으로 분석할 수 있습니다.
              </p>
            </div>
          </div>

          <div className="glass-panel p-5">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-violet-600" />
              <h3 className="font-bold text-gray-900">예산 사용 현황</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">각 예산명 클릭 → 해당 예산의 세부 사용 내역 조회</p>
            <div className="glass p-3 rounded-xl bg-violet-50/50 border border-violet-100">
              <p className="text-xs text-violet-700">
                <strong>팁:</strong> 예산별 사용 내역을 상세히 확인할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 주의사항 */}
      <div className="glass-card p-6 border-l-4 border-l-rose-500">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-500" />
          주의사항
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="glass-panel p-5">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-gray-900">수요처 관리</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-600">실적 입력 시 반드시 기존 수요처 검색 먼저 진행</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-600">검색 결과가 없을 경우에만 신규 수요처 등록</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-600">중복 등록 방지를 위해 꼼꼼한 검색 필요</span>
              </div>
            </div>
          </div>

          <div className="glass-panel p-5">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-gray-900">예산 구분</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-600">남부/북부 예산 혼동 방지를 위해 지역 버튼 활용 필수</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-600">지출 전 해당 지역 예산 확인 후 사용내역 입력</span>
              </div>
            </div>
          </div>

          <div className="glass-panel p-5">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-gray-900">입력 타이밍</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-600">실적 입력: 수업 완료 직후</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-600">예산 사용내역: 지출 발생 직후</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 추가 정보 */}
      <div className="glass-card p-6 mt-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-teal-500" />
          추가 정보
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-lg">🔐</span> 보안
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>관리자 계정으로만 접근 가능</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>비밀번호 변경 시 모든 사용자에게 적용</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>실시간 데이터 동기화</span>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-lg">📱</span> 사용성
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>반응형 디자인으로 모바일에서도 사용 가능</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>ESC 키로 빠른 모드 종료</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>엑셀 다운로드 기능 제공</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Manual;
