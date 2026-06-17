// Core domain types for FarmPlan

export type ActivityType = 'SOW' | 'TRANSPLANT' | 'IRRIGATE' | 'FERTILIZE' | 'SPRAY' | 'HARVEST';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type ActivityStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface Farm {
  id: string;
  userId: string;
  name: string;
  latitude: number;
  longitude: number;
  region: string;
  createdAt: Date;
}

export interface Crop {
  id: string;
  farmId: string;
  name: string;
  sowDate: Date;
  expectedHarvestDate: Date;
  variety?: string;
  estimatedYield?: number;
  createdAt: Date;
}

export interface Activity {
  id: string;
  cropId: string;
  type: ActivityType;
  startDate: Date;
  endDate: Date;
  status: ActivityStatus;
  description?: string;
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  riskReason?: string;
  createdAt: Date;
}

export interface WeatherData {
  location: string;
  date: Date;
  rainMm: number;
  tempC: number;
  windKph: number;
  humidity: number;
  condition: string; // e.g., "Clear", "Rainy", "Cloudy"
  timestamp: Date;
}

export interface RiskAssessment {
  activityId: string;
  riskLevel: RiskLevel;
  riskScore: number;
  reason: string;
  affectedByFactors: string[];
}

export interface DashboardData {
  totalCrops: number;
  upcomingActivities: Activity[];
  highRiskActivities: Activity[];
  weatherForecast: WeatherData[];
}
