import { Demand, Performance, ExcelPerformanceData } from '../types';

export const parseExcelData = (csvContent: string): Omit<Demand, 'id' | 'createdAt' | 'updatedAt'>[] => {
  const lines = csvContent.split('\n');
  const data: Omit<Demand, 'id' | 'createdAt' | 'updatedAt'>[] = [];
  
  // 헤더 행 건너뛰기 (첫 번째 줄)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const columns = line.split(',').map(col => col.trim().replace(/"/g, ''));
    
    if (columns.length >= 4) {
      data.push({
        city: columns[0] || '',
        organizationName: columns[1] || '',
        contactPerson: columns[2] || '',
        phoneNumber: columns[3] || '',
        email: columns[4] || ''
      });
    }
  }
  
  return data;
};

export const downloadTemplate = () => {
  // UTF-8 BOM을 추가하여 한글 인코딩 문제 해결
  const csvContent = '\uFEFF시/군,단체명,담당자명,연락처,이메일\n' +
    '수원시,예시 단체,홍길동,010-1234-5678,hong@example.com\n' +
    '성남시,샘플 그룹,김철수,010-9876-5432,kim@sample.org';
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '수요처_등록_템플릿.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

// 실적 데이터를 엑셀로 다운로드하는 함수
export const downloadPerformanceExcel = (performances: Performance[]) => {
  // CSV 헤더 (UTF-8 BOM 포함)
  let csvContent = '\uFEFF날짜,단체명,시군,프로그램,남성,여성,총인원,홍보횟수,메모\n';
  
  // 데이터 행 추가
  performances.forEach(performance => {
    const totalCount = (performance.maleCount || 0) + (performance.femaleCount || 0);
    const date = performance.date ? performance.date.toLocaleDateString('ko-KR') : '';
    const notes = performance.notes || '';
    
    // CSV 형식으로 데이터 추가 (쉼표와 따옴표 처리)
    const row = [
      date,
      `"${performance.organizationName}"`,
      `"${performance.city || ''}"`,
      `"${performance.program || '스포츠교실'}"`,
      performance.maleCount || 0,
      performance.femaleCount || 0,
      totalCount,
      performance.promotionCount || 0,
      `"${notes.replace(/"/g, '""')}"` // 따옴표 이스케이프
    ].join(',');
    
    csvContent += row + '\n';
  });
  
  // 파일 다운로드
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `실적_데이터_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

// 실적 업로드용 템플릿 다운로드
export const downloadPerformanceTemplate = () => {
  // UTF-8 BOM을 추가하여 한글 인코딩 문제 해결
  const csvContent = '\uFEFF날짜,단체명,시군,프로그램,남성,여성,홍보횟수,메모\n' +
    '2024-01-15,예시 단체,수원시,스포츠교실,10,15,5,샘플 메모\n' +
    '2024-01-16,샘플 그룹,성남시,스포츠체험존,8,12,3,테스트 데이터\n' +
    '2024-01-17,테스트 단체,안양시,스포츠이벤트,5,10,2,이벤트 데이터';
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '실적_업로드_템플릿.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

// 실적 데이터를 파싱하는 함수 (날짜 파싱 개선)
export const parsePerformanceExcelData = (csvContent: string): Omit<Performance, 'id' | 'createdAt' | 'updatedAt'>[] => {
  const lines = csvContent.split('\n');
  const data: Omit<Performance, 'id' | 'createdAt' | 'updatedAt'>[] = [];
  
  // 헤더 행 건너뛰기 (첫 번째 줄)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const columns = line.split(',').map(col => col.trim().replace(/"/g, ''));
    
    if (columns.length >= 8) {
      const dateStr = columns[0];
      let date: Date;
      
      // 날짜 파싱 개선
      try {
        if (dateStr.includes('-')) {
          // YYYY-MM-DD 형식
          date = new Date(dateStr);
        } else if (dateStr.includes('/')) {
          // MM/DD/YYYY 또는 YYYY/MM/DD 형식
          date = new Date(dateStr);
        } else {
          // 기타 형식은 현재 날짜로 설정
          date = new Date();
        }
        
        // 유효하지 않은 날짜인 경우 현재 날짜로 설정
        if (isNaN(date.getTime())) {
          date = new Date();
        }
      } catch {
        date = new Date();
      }
      
      data.push({
        date: date,
        organizationName: columns[1] || '',
        city: columns[2] || '',
        program: (columns[3] as '스포츠교실' | '스포츠체험존' | '스포츠이벤트') || '스포츠교실',
        maleCount: parseInt(columns[4]) || 0,
        femaleCount: parseInt(columns[5]) || 0,
        promotionCount: parseInt(columns[6]) || 0,
        notes: columns[7] || ''
      });
    }
  }
  
  return data;
};