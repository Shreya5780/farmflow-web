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
  date: Date;
  tempC: number;
  tempRounded: number;
  humidity: number;
  windKph: number;
  precipitationProbability: number; // 0..1 chance of precipitation (OpenWeatherMap "pop")
  condition: string; // OpenWeatherMap main, e.g., "Clear", "Clouds", "Rain"
  conditionDescription: string; // e.g., "light rain", "scattered clouds"
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
