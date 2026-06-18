import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from '../services/api'
import type { Activity, Crop, Farm, WeatherData } from '../types'

interface AppDataContextValue {
  farms: Farm[]
  crops: Crop[]
  activities: Activity[]
  weather: WeatherData[]
  loading: boolean
  error: boolean
  reload: () => Promise<void>
}

const AppDataContext = createContext<AppDataContextValue>({
  farms: [],
  crops: [],
  activities: [],
  weather: [],
  loading: true,
  error: false,
  reload: async () => {},
})

export const useAppData = () => useContext(AppDataContext)

export const AppDataProvider = ({ children }: { children: ReactNode }) => {
  const [farms, setFarms] = useState<Farm[]>([])
  const [crops, setCrops] = useState<Crop[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [weather, setWeather] = useState<WeatherData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const farmsResult = await api.listFarms()
      setFarms(farmsResult)

      const cropLists = await Promise.all(farmsResult.map((farm) => api.listCrops(farm.id)))
      const cropsResult = cropLists.flat()
      setCrops(cropsResult)

      const activityLists = await Promise.all(cropsResult.map((crop) => api.listActivities(crop.id)))
      setActivities(activityLists.flat())

      if (farmsResult.length > 0) {
        setWeather(await api.getWeather(farmsResult[0].latitude, farmsResult[0].longitude))
      } else {
        setWeather([])
      }
    } catch (err) {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const value = useMemo<AppDataContextValue>(
    () => ({ farms, crops, activities, weather, loading, error, reload }),
    [farms, crops, activities, weather, loading, error, reload],
  )

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}
