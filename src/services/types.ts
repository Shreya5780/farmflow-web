import type { Activity, Crop, Farm, WeatherData } from '../types'

export interface FarmPlanService {
  login(email: string, password: string): Promise<{ token: string; userId: string }>
  signup(email: string, password: string): Promise<{ token: string; userId: string }>

  listFarms(): Promise<Farm[]>
  createFarm(input: Omit<Farm, 'id' | 'createdAt'>): Promise<Farm>

  listCrops(farmId: string): Promise<Crop[]>
  createCrop(input: Omit<Crop, 'id' | 'createdAt'>): Promise<Crop>

  listActivities(cropId: string): Promise<Activity[]>
  createActivity(input: Omit<Activity, 'id' | 'createdAt'>): Promise<Activity>
  updateActivity(id: string, patch: Partial<Activity>): Promise<Activity>
  deleteActivity(id: string): Promise<void>
  reorderActivities(cropId: string, orderedIds: string[]): Promise<void>

  getWeather(lat: number, lon: number): Promise<WeatherData[]>
  assessRisk(cropId: string): Promise<Activity[]>
}
