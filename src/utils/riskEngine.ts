import type { ActivityType, RiskLevel, WeatherData } from '../types';

/**
 * Risk Rules Engine - Determines risk level based on activity type and weather forecast
 * Each activity has thresholds that trigger LOW/MEDIUM/HIGH risk
 */

interface RiskThreshold {
  rainMm: number;
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

/**
 * Risk rules per activity type
 * Thresholds are evaluated against forecast data
 * Returns the highest risk level that matches
 */
export const riskRules: Record<ActivityType, ActivityRiskRule> = {
  SPRAY: {
    activityType: 'SPRAY',
    lowRisk: {
      rainMm: 2,
      tempCMin: 15,
      tempCMax: 35,
      windKph: 15,
      humidity: 85,
    },
    mediumRisk: {
      rainMm: 5,
      tempCMin: 10,
      tempCMax: 40,
      windKph: 20,
      humidity: 90,
    },
    highRisk: {
      rainMm: 15, // Heavy rain => wash-off risk
      tempCMin: 5,
      tempCMax: 50,
      windKph: 25, // High wind => drift risk
      humidity: 95,
    },
    description: 'Rain washes off pesticides; high wind causes drift. Ideal: dry, low-wind conditions.',
  },

  SOW: {
    activityType: 'SOW',
    lowRisk: {
      rainMm: 5,
      tempCMin: 10,
      tempCMax: 35,
      windKph: 20,
      humidity: 85,
    },
    mediumRisk: {
      rainMm: 10,
      tempCMin: 5,
      tempCMax: 40,
      windKph: 30,
      humidity: 90,
    },
    highRisk: {
      rainMm: 20, // Waterlogging risk
      tempCMin: 0,
      tempCMax: 50,
      windKph: 40,
      humidity: 95,
    },
    description: 'Heavy rain causes waterlogging. Cold temps delay germination. Ideal: warm, moderate moisture.',
  },

  TRANSPLANT: {
    activityType: 'TRANSPLANT',
    lowRisk: {
      rainMm: 5,
      tempCMin: 15,
      tempCMax: 35,
      windKph: 20,
      humidity: 80,
    },
    mediumRisk: {
      rainMm: 15,
      tempCMin: 10,
      tempCMax: 40,
      windKph: 30,
      humidity: 85,
    },
    highRisk: {
      rainMm: 25, // Waterlogging and shock to seedlings
      tempCMin: 5,
      tempCMax: 50,
      windKph: 40,
      humidity: 95,
    },
    description: 'Heavy rain and cold stress seedling shock. Ideal: warm, moist but not waterlogged.',
  },

  IRRIGATE: {
    activityType: 'IRRIGATE',
    lowRisk: {
      rainMm: 10,
      tempCMin: 5,
      tempCMax: 45,
      windKph: 30,
      humidity: 90,
    },
    mediumRisk: {
      rainMm: 20,
      tempCMin: 0,
      tempCMax: 50,
      windKph: 40,
      humidity: 95,
    },
    highRisk: {
      rainMm: 30, // Heavy forecast rain makes irrigation wasteful
      tempCMin: -5,
      tempCMax: 50,
      windKph: 50,
      humidity: 100,
    },
    description: 'Heavy rain forecast makes scheduled irrigation wasteful. Skip and rely on rainfall.',
  },

  FERTILIZE: {
    activityType: 'FERTILIZE',
    lowRisk: {
      rainMm: 5,
      tempCMin: 10,
      tempCMax: 40,
      windKph: 25,
      humidity: 85,
    },
    mediumRisk: {
      rainMm: 15,
      tempCMin: 5,
      tempCMax: 45,
      windKph: 35,
      humidity: 90,
    },
    highRisk: {
      rainMm: 25, // Heavy rain causes leaching/runoff
      tempCMin: 0,
      tempCMax: 50,
      windKph: 45,
      humidity: 95,
    },
    description: 'Heavy rain causes nutrient runoff. Ideal: apply before rain, or wait until soil settles.',
  },

  HARVEST: {
    activityType: 'HARVEST',
    lowRisk: {
      rainMm: 2,
      tempCMin: 10,
      tempCMax: 35,
      windKph: 20,
      humidity: 70,
    },
    mediumRisk: {
      rainMm: 8,
      tempCMin: 5,
      tempCMax: 40,
      windKph: 30,
      humidity: 80,
    },
    highRisk: {
      rainMm: 15, // Rain/high humidity causes spoilage and mold
      tempCMin: 0,
      tempCMax: 50,
      windKph: 40,
      humidity: 90,
    },
    description: 'Rain and high humidity increase spoilage/mold risk. Ideal: dry, low-humidity harvest window.',
  },
};

/**
 * Assess risk for an activity given weather forecast
 * Compares weather data against thresholds and returns the highest matching risk level + explanation
 */
export function assessActivityRisk(
  activityType: ActivityType,
  weatherData: WeatherData
): { riskLevel: RiskLevel; riskScore: number; reason: string } {
  const rule = riskRules[activityType];
  if (!rule) {
    return { riskLevel: 'LOW', riskScore: 10, reason: 'No risk rule defined' };
  }

  // Check high risk first (most severe), then medium, then low
  const factors: string[] = [];

  // Check HIGH risk thresholds
  if (
    weatherData.rainMm >= rule.highRisk.rainMm ||
    weatherData.tempC <= rule.highRisk.tempCMin ||
    weatherData.tempC >= rule.highRisk.tempCMax ||
    weatherData.windKph >= rule.highRisk.windKph ||
    weatherData.humidity >= rule.highRisk.humidity
  ) {
    if (weatherData.rainMm >= rule.highRisk.rainMm) {
      factors.push(`Heavy rain (${weatherData.rainMm}mm)`);
    }
    if (weatherData.tempC <= rule.highRisk.tempCMin) {
      factors.push(`Very cold (${weatherData.tempC}°C)`);
    }
    if (weatherData.tempC >= rule.highRisk.tempCMax) {
      factors.push(`Very hot (${weatherData.tempC}°C)`);
    }
    if (weatherData.windKph >= rule.highRisk.windKph) {
      factors.push(`High wind (${weatherData.windKph} kph)`);
    }
    if (weatherData.humidity >= rule.highRisk.humidity) {
      factors.push(`Very high humidity (${weatherData.humidity}%)`);
    }
    return {
      riskLevel: 'HIGH',
      riskScore: 80,
      reason: `${rule.description} Triggered by: ${factors.join(', ')}`,
    };
  }

  // Check MEDIUM risk thresholds
  if (
    weatherData.rainMm >= rule.mediumRisk.rainMm ||
    weatherData.tempC <= rule.mediumRisk.tempCMin ||
    weatherData.tempC >= rule.mediumRisk.tempCMax ||
    weatherData.windKph >= rule.mediumRisk.windKph ||
    weatherData.humidity >= rule.mediumRisk.humidity
  ) {
    if (weatherData.rainMm >= rule.mediumRisk.rainMm) {
      factors.push(`Moderate rain (${weatherData.rainMm}mm)`);
    }
    if (weatherData.tempC <= rule.mediumRisk.tempCMin) {
      factors.push(`Cold (${weatherData.tempC}°C)`);
    }
    if (weatherData.tempC >= rule.mediumRisk.tempCMax) {
      factors.push(`Hot (${weatherData.tempC}°C)`);
    }
    if (weatherData.windKph >= rule.mediumRisk.windKph) {
      factors.push(`Moderate wind (${weatherData.windKph} kph)`);
    }
    if (weatherData.humidity >= rule.mediumRisk.humidity) {
      factors.push(`High humidity (${weatherData.humidity}%)`);
    }
    return {
      riskLevel: 'MEDIUM',
      riskScore: 50,
      reason: `${rule.description} Triggered by: ${factors.join(', ')}`,
    };
  }

  // Otherwise LOW risk
  return {
    riskLevel: 'LOW',
    riskScore: 20,
    reason: `${rule.description} Current conditions are favorable.`,
  };
}

/**
 * Get recommended risk color for display
 */
export function getRiskColor(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case 'LOW':
      return '#4caf50'; // Green
    case 'MEDIUM':
      return '#ff9800'; // Orange
    case 'HIGH':
      return '#f44336'; // Red
    default:
      return '#9e9e9e'; // Gray
  }
}

/**
 * Get risk level description for UI
 */
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
