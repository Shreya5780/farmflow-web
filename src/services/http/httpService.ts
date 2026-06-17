import axios from 'axios'
import type { FarmPlanService } from '../types'
import type { Activity, Crop, Farm, WeatherData } from '../../types'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8082/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

const parseDate = (value: string | Date | undefined): Date | undefined => {
  if (!value) return undefined
  return value instanceof Date ? value : new Date(value)
}

const parseFarm = (data: any): Farm => ({
  ...data,
  createdAt: parseDate(data.createdAt) as Date,
})

const parseCrop = (data: any): Crop => ({
  ...data,
  sowDate: parseDate(data.sowDate) as Date,
  expectedHarvestDate: parseDate(data.expectedHarvestDate) as Date,
  createdAt: parseDate(data.createdAt) as Date,
})

const parseActivity = (data: any): Activity => ({
  ...data,
  startDate: parseDate(data.startDate) as Date,
  endDate: parseDate(data.endDate) as Date,
  createdAt: parseDate(data.createdAt) as Date,
})

const parseWeather = (data: any): WeatherData => ({
  ...data,
  date: parseDate(data.date) as Date,
  timestamp: parseDate(data.timestamp) as Date,
})

export const httpService: FarmPlanService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password })
    return response.data
  },

  signup: async (email, password) => {
    const response = await api.post('/auth/signup', { email, password })
    return response.data
  },

  listFarms: async () => {
    const response = await api.get<Farm[]>('/farms')
    return response.data.map(parseFarm)
  },

  createFarm: async (input) => {
    const response = await api.post<Farm>('/farms', input)
    return parseFarm(response.data)
  },

  listCrops: async (farmId) => {
    const response = await api.get<Crop[]>(`/farms/${farmId}/crops`)
    return response.data.map(parseCrop)
  },

  createCrop: async (input) => {
    const response = await api.post<Crop>(`/farms/${input.farmId}/crops`, input)
    return parseCrop(response.data)
  },

  listActivities: async (cropId) => {
    const response = await api.get<Activity[]>(`/crops/${cropId}/activities`)
    return response.data.map(parseActivity)
  },

  createActivity: async (input) => {
    const response = await api.post<Activity>(`/crops/${input.cropId}/activities`, input)
    return parseActivity(response.data)
  },

  updateActivity: async (id, patch) => {
    const response = await api.put<Activity>(`/activities/${id}`, patch)
    return parseActivity(response.data)
  },

  deleteActivity: async (id) => {
    await api.delete(`/activities/${id}`)
  },

  reorderActivities: async (cropId, orderedIds) => {
    await api.put(`/crops/${cropId}/activities/reorder`, { orderedIds })
  },

  getWeather: async (lat, lon) => {
    const response = await api.get<WeatherData[]>(`/weather`, { params: { lat, lon } })
    return response.data.map(parseWeather)
  },

  assessRisk: async (cropId) => {
    const response = await api.get<Activity[]>(`/crops/${cropId}/risk`)
    return response.data.map(parseActivity)
  },
}
