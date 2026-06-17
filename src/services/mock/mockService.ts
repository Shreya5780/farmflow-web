import { assessActivityRisk } from '../../utils/riskEngine'
import type { FarmPlanService } from '../types'
import { mockActivities, mockCrops, mockFarms, mockWeatherData } from './mockData'
import type { Activity, Crop, Farm } from '../../types'

const generateId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`

const clone = <T>(value: T): T => structuredClone(value)

export const mockService: FarmPlanService = {
  login: async (_email, _password) => {
    return Promise.resolve({ token: 'mock-token', userId: 'user-001' })
  },

  signup: async (_email, _password) => {
    return Promise.resolve({ token: 'mock-token', userId: 'user-001' })
  },

  listFarms: async () => {
    return Promise.resolve(clone(mockFarms))
  },

  createFarm: async (input) => {
    const farm: Farm = { id: generateId('farm'), ...input, createdAt: new Date() }
    mockFarms.push(farm)
    return Promise.resolve(clone(farm))
  },

  listCrops: async (farmId) => {
    return Promise.resolve(clone(mockCrops.filter((crop) => crop.farmId === farmId)))
  },

  createCrop: async (input) => {
    const crop: Crop = { id: generateId('crop'), ...input, createdAt: new Date() }
    mockCrops.push(crop)
    return Promise.resolve(clone(crop))
  },

  listActivities: async (cropId) => {
    return Promise.resolve(clone(mockActivities.filter((activity) => activity.cropId === cropId)))
  },

  createActivity: async (input) => {
    const activity: Activity = {
      id: generateId('act'),
      ...input,
      createdAt: new Date(),
    }
    mockActivities.push(activity)
    return Promise.resolve(clone(activity))
  },

  updateActivity: async (id, patch) => {
    const index = mockActivities.findIndex((activity) => activity.id === id)
    if (index === -1) throw new Error('Activity not found')
    mockActivities[index] = { ...mockActivities[index], ...patch }
    return Promise.resolve(clone(mockActivities[index]))
  },

  deleteActivity: async (id) => {
    const index = mockActivities.findIndex((activity) => activity.id === id)
    if (index !== -1) mockActivities.splice(index, 1)
    return Promise.resolve()
  },

  reorderActivities: async (cropId, orderedIds) => {
    const activities = mockActivities.filter((activity) => activity.cropId === cropId)
    const reordered = orderedIds.map((id) => activities.find((activity) => activity.id === id)).filter(Boolean) as Activity[]
    const otherActivities = mockActivities.filter((activity) => activity.cropId !== cropId)
    mockActivities.length = 0
    mockActivities.push(...otherActivities, ...reordered)
    return Promise.resolve()
  },

  getWeather: async (_lat, _lon) => {
    return Promise.resolve(clone(mockWeatherData))
  },

  assessRisk: async (cropId) => {
    const activities = mockActivities.filter((activity) => activity.cropId === cropId)
    const weather = mockWeatherData[0]
    return Promise.resolve(
      clone(
        activities.map((activity) => {
          const risk = assessActivityRisk(activity.type, weather)
          return {
            ...activity,
            riskLevel: risk.riskLevel,
            riskScore: risk.riskScore,
            riskReason: risk.reason,
          }
        }),
      ),
    )
  },
}
