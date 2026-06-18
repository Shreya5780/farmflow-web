import type { ActivityType, RiskLevel, WeatherData } from '../types';

/**
 * Risk Rules Engine — determines risk level based on activity type and weather forecast.
 *
 * The backend returns a precipitation *probability* (0..1, OpenWeatherMap "pop") rather than
 * rainfall volume, so the rain dimension here is expressed as a probability threshold.
 * Each activity type has its own sensitivity to rain, wind, temperature and humidity.
 */

interface RiskThreshold {
  precipProb: number; // 0..1
  tempCMin: number;
  tempCMax: number;
  windKph: number;
  humidity: number;
}

interface ActivityRiskRule {
  activityType: ActivityType;
  lowRisk: RiskThreshold;
  mediumRisk: RiskThreshold;
  highRisk: RiskThreshold;
  description: string;
}

export const riskRules: Record<ActivityType, ActivityRiskRule> = {
  SPRAY: {
    activityType: 'SPRAY',
    lowRisk: { precipProb: 0.3, tempCMin: 15, tempCMax: 35, windKph: 15, humidity: 85 },
    mediumRisk: { precipProb: 0.5, tempCMin: 10, tempCMax: 40, windKph: 20, humidity: 90 },
    highRisk: { precipProb: 0.7, tempCMin: 5, tempCMax: 50, windKph: 25, humidity: 95 },
    description: 'Rain washes off pesticides; high wind causes drift. Ideal: dry, low-wind conditions.',
  },

  SOW: {
    activityType: 'SOW',
    lowRisk: { precipProb: 0.4, tempCMin: 10, tempCMax: 35, windKph: 20, humidity: 85 },
    mediumRisk: { precipProb: 0.6, tempCMin: 5, tempCMax: 40, windKph: 30, humidity: 90 },
    highRisk: { precipProb: 0.8, tempCMin: 0, tempCMax: 50, windKph: 40, humidity: 95 },
    description: 'Heavy rain causes waterlogging. Cold temps delay germination. Ideal: warm, moderate moisture.',
  },

  TRANSPLANT: {
    activityType: 'TRANSPLANT',
    lowRisk: { precipProb: 0.4, tempCMin: 15, tempCMax: 35, windKph: 20, humidity: 80 },
    mediumRisk: { precipProb: 0.6, tempCMin: 10, tempCMax: 40, windKph: 30, humidity: 85 },
    highRisk: { precipProb: 0.8, tempCMin: 5, tempCMax: 50, windKph: 40, humidity: 95 },
    description: 'Heavy rain and cold stress seedling shock. Ideal: warm, moist but not waterlogged.',
  },

  IRRIGATE: {
    activityType: 'IRRIGATE',
    lowRisk: { precipProb: 0.5, tempCMin: 5, tempCMax: 45, windKph: 30, humidity: 90 },
    mediumRisk: { precipProb: 0.7, tempCMin: 0, tempCMax: 50, windKph: 40, humidity: 95 },
    highRisk: { precipProb: 0.85, tempCMin: -5, tempCMax: 50, windKph: 50, humidity: 100 },
    description: 'High rain probability makes scheduled irrigation wasteful. Skip and rely on rainfall.',
  },

  FERTILIZE: {
    activityType: 'FERTILIZE',
    lowRisk: { precipProb: 0.4, tempCMin: 10, tempCMax: 40, windKph: 25, humidity: 85 },
    mediumRisk: { precipProb: 0.6, tempCMin: 5, tempCMax: 45, windKph: 35, humidity: 90 },
    highRisk: { precipProb: 0.8, tempCMin: 0, tempCMax: 50, windKph: 45, humidity: 95 },
    description: 'Heavy rain causes nutrient runoff. Ideal: apply before rain, or wait until soil settles.',
  },

  HARVEST: {
    activityType: 'HARVEST',
    lowRisk: { precipProb: 0.25, tempCMin: 10, tempCMax: 35, windKph: 20, humidity: 70 },
    mediumRisk: { precipProb: 0.45, tempCMin: 5, tempCMax: 40, windKph: 30, humidity: 80 },
    highRisk: { precipProb: 0.65, tempCMin: 0, tempCMax: 50, windKph: 40, humidity: 90 },
    description: 'Rain and high humidity increase spoilage/mold risk. Ideal: dry, low-humidity harvest window.',
  },
};

const rainChancePct = (weather: WeatherData) => Math.round(weather.precipitationProbability * 100);

/**
 * Assess risk for an activity given a weather snapshot. Compares the forecast against the
 * activity's thresholds and returns the highest matching risk level plus an explanation.
 */
export function assessActivityRisk(
  activityType: ActivityType,
  weatherData: WeatherData
): { riskLevel: RiskLevel; riskScore: number; reason: string } {
  const rule = riskRules[activityType];
  if (!rule) {
    return { riskLevel: 'LOW', riskScore: 10, reason: 'No risk rule defined' };
  }

  const factors: string[] = [];

  // HIGH risk
  if (
    weatherData.precipitationProbability >= rule.highRisk.precipProb ||
    weatherData.tempC <= rule.highRisk.tempCMin ||
    weatherData.tempC >= rule.highRisk.tempCMax ||
    weatherData.windKph >= rule.highRisk.windKph ||
    weatherData.humidity >= rule.highRisk.humidity
  ) {
    if (weatherData.precipitationProbability >= rule.highRisk.precipProb) factors.push(`High rain chance (${rainChancePct(weatherData)}%)`);
    if (weatherData.tempC <= rule.highRisk.tempCMin) factors.push(`Very cold (${weatherData.tempC}°C)`);
    if (weatherData.tempC >= rule.highRisk.tempCMax) factors.push(`Very hot (${weatherData.tempC}°C)`);
    if (weatherData.windKph >= rule.highRisk.windKph) factors.push(`High wind (${weatherData.windKph} km/h)`);
    if (weatherData.humidity >= rule.highRisk.humidity) factors.push(`Very high humidity (${weatherData.humidity}%)`);
    return { riskLevel: 'HIGH', riskScore: 80, reason: `${rule.description} Triggered by: ${factors.join(', ')}` };
  }

  // MEDIUM risk
  if (
    weatherData.precipitationProbability >= rule.mediumRisk.precipProb ||
    weatherData.tempC <= rule.mediumRisk.tempCMin ||
    weatherData.tempC >= rule.mediumRisk.tempCMax ||
    weatherData.windKph >= rule.mediumRisk.windKph ||
    weatherData.humidity >= rule.mediumRisk.humidity
  ) {
    if (weatherData.precipitationProbability >= rule.mediumRisk.precipProb) factors.push(`Moderate rain chance (${rainChancePct(weatherData)}%)`);
    if (weatherData.tempC <= rule.mediumRisk.tempCMin) factors.push(`Cold (${weatherData.tempC}°C)`);
    if (weatherData.tempC >= rule.mediumRisk.tempCMax) factors.push(`Hot (${weatherData.tempC}°C)`);
    if (weatherData.windKph >= rule.mediumRisk.windKph) factors.push(`Moderate wind (${weatherData.windKph} km/h)`);
    if (weatherData.humidity >= rule.mediumRisk.humidity) factors.push(`High humidity (${weatherData.humidity}%)`);
    return { riskLevel: 'MEDIUM', riskScore: 50, reason: `${rule.description} Triggered by: ${factors.join(', ')}` };
  }

  return { riskLevel: 'LOW', riskScore: 20, reason: `${rule.description} Current conditions are favorable.` };
}

export interface WindowRiskResult {
  riskLevel: RiskLevel;
  riskScore: number;
  reason: string;
  hasForecast: boolean;
}

/** True if a forecast day falls within the activity's [start, end] window (date-only). */
const dayInWindow = (day: Date, start: Date, end: Date): boolean => {
  const s = new Date(start);
  s.setHours(0, 0, 0, 0);
  const e = new Date(end);
  e.setHours(23, 59, 59, 999);
  return day.getTime() >= s.getTime() && day.getTime() <= e.getTime();
};

/**
 * Assess risk for an activity against the forecast days that overlap its own date window,
 * taking the worst (highest-scoring) matching day. When the window is beyond the available
 * forecast horizon (typically ~5 days), returns a neutral "no forecast" result.
 */
export function assessActivityRiskOverWindow(
  activityType: ActivityType,
  startDate: Date,
  endDate: Date,
  forecast: WeatherData[]
): WindowRiskResult {
  const overlapping = forecast.filter((day) => dayInWindow(day.date, startDate, endDate));

  if (overlapping.length === 0) {
    return {
      riskLevel: 'LOW',
      riskScore: 0,
      reason: 'No weather forecast available for this period (beyond the forecast horizon).',
      hasForecast: false,
    };
  }

  const worst = overlapping
    .map((day) => assessActivityRisk(activityType, day))
    .reduce((a, b) => (b.riskScore > a.riskScore ? b : a));

  return { ...worst, hasForecast: true };
}

/** Recommended risk color for display. */
export function getRiskColor(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case 'LOW':
      return '#43a047';
    case 'MEDIUM':
      return '#fb8c00';
    case 'HIGH':
      return '#e53935';
    default:
      return '#9e9e9e';
  }
}

/** Risk level description for UI. */
export function getRiskDescription(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case 'LOW':
      return 'Low Risk - Proceed as planned';
    case 'MEDIUM':
      return 'Medium Risk - Consider precautions';
    case 'HIGH':
      return 'High Risk - Consider postponing or adapting';
    default:
      return 'Unknown Risk';
  }
}
