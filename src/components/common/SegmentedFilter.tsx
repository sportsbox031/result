interface SegmentedFilterOption<T extends string | number> {
  value: T;
  label: string;
}

interface SegmentedFilterProps<T extends string | number> {
  options: ReadonlyArray<SegmentedFilterOption<T>> | ReadonlyArray<T>;
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
}

const isOptionObject = <T extends string | number>(
  option: SegmentedFilterOption<T> | T
): option is SegmentedFilterOption<T> =>
  typeof option === 'object' && option !== null && 'value' in option;

// 연도/지역 등 배타적 선택 버튼 그룹 공통 컴포넌트
function SegmentedFilter<T extends string | number>({
  options,
  value,
  onChange,
  size = 'md'
}: SegmentedFilterProps<T>) {
  const sizeClass = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';

  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((option) => {
        const optionValue = isOptionObject(option) ? option.value : option;
        const optionLabel = isOptionObject(option) ? option.label : String(option);
        const isActive = optionValue === value;
        return (
          <button
            key={String(optionValue)}
            type="button"
            className={`${sizeClass} rounded-lg font-medium transition-all duration-200 ${
              isActive
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            onClick={() => onChange(optionValue)}
            aria-pressed={isActive}
          >
            {optionLabel}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedFilter;
