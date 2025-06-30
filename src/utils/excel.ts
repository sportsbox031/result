import { Demand } from '../types';

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
        email: columns[4] || undefined
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