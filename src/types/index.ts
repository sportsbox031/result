export interface Demand {
  id: string;
  city: string;
  organizationName: string;
  contactPerson: string;
  phoneNumber: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Performance {
  id: string;
  date: Date;
  organizationName: string;
  maleCount: number;
  femaleCount: number;
  promotionCount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

export interface FilterState {
  startDate?: Date;
  endDate?: Date;
  organizationName?: string;
  city?: string;
}

export interface StatisticsData {
  totalMale: number;
  totalFemale: number;
  totalPeople: number;
  totalPromotions: number;
  totalOrganizations: number;
  monthlyData: Array<{
    month: string;
    male: number;
    female: number;
    total: number;
    promotions: number;
  }>;
  organizationData: Array<{
    name: string;
    total: number;
    count: number;
    city: string;
  }>;
  cityData: Array<{
    name: string;
    total: number;
    count: number;
  }>;
}