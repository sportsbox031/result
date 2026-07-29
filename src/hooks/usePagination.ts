import { useEffect, useMemo, useState } from 'react';

export const PAGE_SIZE_OPTIONS = [20, 30, 50, 100] as const;

// 필터링된 목록을 페이지 단위로 잘라서 반환한다.
// 데이터가 많을 때 테이블 전체를 한 번에 렌더링하면서 생기는 렉을 막기 위한 공용 훅.
export function usePagination<T>(items: T[]) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSizeState] = useState<number>(30);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  const setPageSize = (size: number) => {
    setPageSizeState(size);
    setCurrentPage(1);
  };

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  const rangeStart = items.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, items.length);

  return {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    paginatedItems,
    rangeStart,
    rangeEnd
  };
}
