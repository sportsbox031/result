import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// 현재 페이지 주변 + 처음/끝 페이지 번호를 만들고, 나머지는 '...' 로 축약한다.
const getPageNumbers = (currentPage: number, totalPages: number): (number | 'ellipsis')[] => {
  const delta = 1;
  const pages: (number | 'ellipsis')[] = [];
  const start = Math.max(2, currentPage - delta);
  const end = Math.min(totalPages - 1, currentPage + delta);

  pages.push(1);
  if (start > 2) pages.push('ellipsis');
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages - 1) pages.push('ellipsis');
  if (totalPages > 1) pages.push(totalPages);

  return pages;
};

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  rangeStart: number;
  rangeEnd: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  rangeStart,
  rangeEnd,
  onPageChange
}) => {
  const pageNumbers = useMemo(() => getPageNumbers(currentPage, totalPages), [currentPage, totalPages]);

  if (totalItems === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-4 border-t border-gray-100">
      <span className="text-sm text-gray-500">
        {rangeStart.toLocaleString()}–{rangeEnd.toLocaleString()} / {totalItems.toLocaleString()}건
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="이전 페이지"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pageNumbers.map((page, idx) =>
          page === 'ellipsis' ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 text-sm">...</span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`min-w-[2.25rem] h-9 px-2 rounded-xl text-sm font-medium transition-colors ${
                page === currentPage
                  ? 'bg-emerald-600 text-white shadow shadow-emerald-500/30'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {page}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="다음 페이지"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
