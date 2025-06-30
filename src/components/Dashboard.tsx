import React, { useState, useEffect } from 'react';
import { Users, BarChart3, Calendar, Building2 } from 'lucide-react';
import { useFirebaseData } from '../hooks/useFirebaseData';
import { calculateStatistics } from '../utils/statistics';
import { StatisticsData } from '../types';

const Dashboard: React.FC = () => {
  const { demands, performances } = useFirebaseData();
  const [stats, setStats] = useState<StatisticsData>({
    totalMale: 0,
    totalFemale: 0,
    totalPeople: 0,
    totalPromotions: 0,
    totalOrganizations: 0,
    monthlyData: [],
    organizationData: [],
    cityData: []
  });

  useEffect(() => {
    const calculatedStats = calculateStatistics(performances);
    setStats({
      ...calculatedStats,
      totalOrganizations: demands.length
    });
  }, [demands, performances]);

  const StatCard: React.FC<{
    title: string;
    value: string;
    icon: React.ElementType;
    color: string;
  }> = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  const CityBarChart: React.FC<{ 
    data: Array<{ name: string; total: number; count: number }>;
  }> = ({ data }) => {
    const maxTotal = Math.max(...data.map(d => d.total), 1);
    
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">시/군별 참여 현황</h2>
        {data.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
            {data.map((item, index) => (
              <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700 min-w-[70px] text-center">
                  {item.name}
                </div>
                <div className="flex-1">
                  <div className="bg-gray-200 rounded-full h-6 relative">
                    <div
                      className="bg-blue-500 h-6 rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2"
                      style={{ width: `${Math.max((item.total / maxTotal) * 100, 8)}%` }}
                      title={`${item.count}회, ${item.total.toLocaleString()}명`}
                    >
                      <span className="text-xs text-white font-medium">
                        {item.total.toLocaleString()}명
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-600 font-mono min-w-[50px] text-right">
                  {item.count}회
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            데이터가 없습니다
          </div>
        )}
      </div>
    );
  };

  const OrganizationTable: React.FC<{ 
    data: Array<{ name: string; total: number; count: number }>;
  }> = ({ data }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">수요처별 참여 현황</h2>
      {data.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">순위</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">수요처명</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">횟수</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">총 참여인원</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-[200px] truncate" title={item.name}>
                    {item.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right font-mono">
                    {item.count}회
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right font-mono">
                    {item.total.toLocaleString()}명
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex items-center justify-center h-32 text-gray-500">
          데이터가 없습니다
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">대시보드</h1>
        <p className="text-gray-600">수요처 및 실적 현황 개요</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="등록 단체수"
          value={stats.totalOrganizations.toString()}
          icon={Building2}
          color="bg-blue-500"
        />
        <StatCard
          title="총 횟수"
          value={performances.length.toString()}
          icon={Calendar}
          color="bg-green-500"
        />
        <StatCard
          title="총 참여 인원"
          value={stats.totalPeople.toLocaleString() + '명'}
          icon={Users}
          color="bg-purple-500"
        />
        <StatCard
          title="평균 참여 인원"
          value={performances.length > 0 ? Math.round(stats.totalPeople / performances.length).toLocaleString() + '명' : '0명'}
          icon={BarChart3}
          color="bg-orange-500"
        />
      </div>

      {/* 시/군별 통계 - 전체 화면 너비 사용 */}
      <div className="mb-8">
        <CityBarChart data={stats.cityData} />
      </div>

      {/* 수요처별 상세 통계 */}
      <OrganizationTable data={stats.organizationData} />
    </div>
  );
};

export default Dashboard;