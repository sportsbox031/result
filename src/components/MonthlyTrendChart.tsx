import React, { useMemo, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { Performance } from '../types';

interface MonthlyTrendChartProps {
  performances: Performance[];
  year: number;
}

interface MonthStat {
  month: number; // 1~12
  people: number;
  count: number;
}

// 눈금값을 깔끔한 숫자로 올림 (1-2-5 스텝)
const niceCeil = (value: number): number => {
  if (value <= 0) return 10;
  const exponent = Math.floor(Math.log10(value));
  const base = Math.pow(10, exponent);
  const fraction = value / base;
  const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return niceFraction * base;
};

// 선택 연도의 월별 참여 인원 컬럼 차트 (단일 시리즈)
const MonthlyTrendChart: React.FC<MonthlyTrendChartProps> = ({ performances, year }) => {
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  const monthlyStats = useMemo<MonthStat[]>(() => {
    const stats: MonthStat[] = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      people: 0,
      count: 0
    }));
    performances.forEach(p => {
      if (!p.date) return;
      const date = new Date(p.date);
      if (date.getFullYear() !== year) return;
      const stat = stats[date.getMonth()];
      stat.people += (p.maleCount || 0) + (p.femaleCount || 0);
      stat.count += 1;
    });
    return stats;
  }, [performances, year]);

  const maxPeople = Math.max(...monthlyStats.map(s => s.people));
  const hasData = maxPeople > 0;
  const yMax = niceCeil(maxPeople);
  const peakMonth = hasData
    ? monthlyStats.reduce((peak, s) => (s.people > peak.people ? s : peak), monthlyStats[0]).month
    : null;

  const CHART_HEIGHT = 180;

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-800">{year}년 월별 참여 인원</h3>
      </div>

      {hasData ? (
        <div className="flex gap-3">
          {/* Y축 눈금 */}
          <div
            className="flex flex-col justify-between text-right shrink-0 text-xs text-gray-400 tabular-nums"
            style={{ height: CHART_HEIGHT }}
          >
            <span>{yMax.toLocaleString()}</span>
            <span>{(yMax / 2).toLocaleString()}</span>
            <span>0</span>
          </div>

          <div className="flex-1 min-w-0">
            {/* 플롯 영역: hairline 그리드 3개 (0, 중간, 최대) */}
            <div className="relative" style={{ height: CHART_HEIGHT }}>
              {[0, 0.5, 1].map(ratio => (
                <div
                  key={ratio}
                  className="absolute left-0 right-0 border-t border-gray-100"
                  style={{ bottom: `${ratio * 100}%` }}
                  aria-hidden="true"
                />
              ))}

              <div className="absolute inset-0 flex items-end justify-around">
                {monthlyStats.map(stat => {
                  const heightPx = yMax > 0 ? (stat.people / yMax) * CHART_HEIGHT : 0;
                  const isHovered = hoveredMonth === stat.month;
                  const isPeak = stat.month === peakMonth;
                  return (
                    <div
                      key={stat.month}
                      className="relative flex flex-col items-center justify-end h-full flex-1 cursor-default"
                      onMouseEnter={() => setHoveredMonth(stat.month)}
                      onMouseLeave={() => setHoveredMonth(null)}
                    >
                      {/* 툴팁 */}
                      {isHovered && (
                        <div className="absolute bottom-full mb-2 z-10 px-3 py-2 rounded-lg bg-gray-900/90 text-white text-xs whitespace-nowrap shadow-lg pointer-events-none">
                          <p className="font-semibold mb-0.5">{year}년 {stat.month}월</p>
                          <p>참여 {stat.people.toLocaleString()}명 · {stat.count}회</p>
                        </div>
                      )}
                      {/* 최대값 월에만 직접 라벨 */}
                      {isPeak && !isHovered && stat.people > 0 && (
                        <span className="absolute text-xs font-semibold text-gray-600 tabular-nums pointer-events-none" style={{ bottom: heightPx + 4 }}>
                          {stat.people.toLocaleString()}
                        </span>
                      )}
                      <div
                        className={`w-full max-w-[24px] rounded-t transition-colors duration-150 ${
                          isHovered ? 'bg-blue-700' : 'bg-blue-500'
                        }`}
                        style={{ height: Math.max(heightPx, stat.people > 0 ? 2 : 0) }}
                        role="img"
                        aria-label={`${stat.month}월 참여 ${stat.people.toLocaleString()}명, ${stat.count}회`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* X축 라벨 */}
            <div className="flex justify-around mt-2">
              {monthlyStats.map(stat => (
                <span key={stat.month} className="flex-1 text-center text-xs text-gray-400">
                  {stat.month}월
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <p>{year}년 실적 데이터가 없습니다</p>
        </div>
      )}
    </div>
  );
};

export default MonthlyTrendChart;
