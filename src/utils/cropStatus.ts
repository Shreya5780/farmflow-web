import type { Activity, ActivityType, Crop, RiskLevel, WeatherData } from '../types'
import { assessActivityRiskOverWindow } from './riskEngine'

/** Percent of the way from sow date to expected harvest date (0..100). */
export const getCropProgress = (crop: Crop, now: Date = new Date()): number => {
  const total = crop.expectedHarvestDate.getTime() - crop.sowDate.getTime()
  const elapsed = now.getTime() - crop.sowDate.getTime()
  if (total <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)))
}

export type GrowthStage = 'germination' | 'vegetative' | 'flowering' | 'maturity'

/** Growth stage derived from how far the crop is between sow and harvest. */
export const getGrowthStage = (crop: Crop, now: Date = new Date()): GrowthStage => {
  const p = getCropProgress(crop, now)
  if (p < 15) return 'germination'
  if (p < 50) return 'vegetative'
  if (p < 80) return 'flowering'
  return 'maturity'
}

export type HealthStatus = 'healthy' | 'monitor' | 'atRisk'

/**
 * Crop "health" derived from the weather risk of its upcoming activities. This is a real
 * signal from the risk engine (not a hardcoded badge): a HIGH-risk upcoming activity means
 * the crop needs attention, MEDIUM means monitor, otherwise healthy.
 */
export const getCropHealth = (
  cropActivities: Activity[],
  weather: WeatherData[],
  now: Date = new Date(),
): HealthStatus => {
  const upcoming = cropActivities.filter((a) => a.endDate >= now)
  let worst: RiskLevel = 'LOW'
  for (const a of upcoming) {
    const level =
      weather.length > 0
        ? assessActivityRiskOverWindow(a.type as ActivityType, a.startDate, a.endDate, weather).riskLevel
        : a.riskLevel
    if (level === 'HIGH') return 'atRisk'
    if (level === 'MEDIUM') worst = 'MEDIUM'
  }
  return worst === 'MEDIUM' ? 'monitor' : 'healthy'
}

/** MUI color name for a health status. */
export const healthColor = (status: HealthStatus): 'success' | 'warning' | 'error' =>
  status === 'healthy' ? 'success' : status === 'monitor' ? 'warning' : 'error'
