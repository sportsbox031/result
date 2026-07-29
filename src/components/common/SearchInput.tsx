import React, { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** onChange 호출을 지연시키는 시간(ms). 큰 목록을 검색어로 필터링할 때 매 타이핑마다 렉이 걸리지 않도록 한다. */
  debounceMs?: number;
}

// 검색 아이콘이 포함된 입력창 공통 컴포넌트.
// 입력 자체는 로컬 상태로 즉시 반영하고, 상위로의 onChange 호출만 디바운스한다.
const SearchInput: React.FC<SearchInputProps> = ({ value, onChange, placeholder, className = '', debounceMs = 250 }) => {
  const [localValue, setLocalValue] = useState(value);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // 상위에서 값을 외부적으로 바꾸면(예: 필터 초기화) 로컬 상태도 동기화한다.
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (localValue === value) return;
    const timer = setTimeout(() => onChangeRef.current(localValue), debounceMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localValue, debounceMs]);

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      <input
        type="text"
        placeholder={placeholder}
        value={localValue}
        onChange={e => setLocalValue(e.target.value)}
        className="input-glass pl-11 w-full"
      />
    </div>
  );
};

export default SearchInput;
