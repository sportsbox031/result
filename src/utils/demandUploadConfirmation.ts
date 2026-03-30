export const buildDemandUploadConfirmation = (year: number, fileName: string): string => {
  return `${year}년 수요처로 "${fileName}" 파일을 등록합니다. 계속할까요?`;
};
