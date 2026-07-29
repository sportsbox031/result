// 연락처를 000-0000-0000 형식으로 통일한다.
// 대시가 포함되면 엑셀이 숫자로 인식하지 않아 앞자리 0이 사라지는 문제도 함께 해결된다.
export const formatPhoneNumber = (raw: string | undefined | null): string => {
  const digits = (raw || '').replace(/\D/g, '');
  if (!digits) return '';

  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return digits.startsWith('02')
      ? `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`
      : `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 9) {
    return digits.startsWith('02')
      ? `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`
      : `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
  }

  // 알 수 없는 자릿수는 임의로 대시를 넣지 않고 숫자만 반환
  return digits;
};
