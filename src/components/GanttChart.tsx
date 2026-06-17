import { useEffect, useMemo, useRef, useState } from 'react'
import { Box, Container, Paper, Typography } from '@mui/material'
import { gantt } from 'dhtmlx-gantt'
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css'
import { api } from '../services/api'
import { addDays, formatDate } from '../utils/date'
import type { Activity, ActivityType, Crop, WeatherData } from '../types'

const getRiskLabel = (risk: string) => {
  if (risk === 'HIGH') return 'High'
  if (risk === 'MEDIUM') return 'Medium'
  return 'Low'
}

const GanttChart = () => {
  const ganttContainer = useRef<HTMLDivElement | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [crops, setCrops] = useState<Crop[]>([])
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPlanner = async () => {
      try {
        const farms = await api.listFarms()
        const cropLists = await Promise.all(farms.map((farm) => api.listCrops(farm.id)))
        const loadedCrops = cropLists.flat()
        setCrops(loadedCrops)

        const activityLists = await Promise.all(loadedCrops.map((crop) => api.listActivities(crop.id)))
        setActivities(activityLists.flat())

        if (farms.length > 0) {
          const weatherData = await api.getWeather(farms[0].latitude, farms[0].longitude)
          setWeather(weatherData[0] ?? null)
        }
      } finally {
        setLoading(false)
      }
    }

    loadPlanner()
  }, [])

  const tasks = useMemo(() => {
    const mapped = activities.map((activity) => {
      const crop = crops.find((c) => c.id === activity.cropId)
      const cropName = crop?.name || 'Unknown Crop'

      return {
        id: activity.id,
        text: `${activity.type} — ${cropName}`,
        start_date: formatDate(activity.startDate),
        end_date: formatDate(addDays(activity.endDate, 1)),
        progress: activity.riskScore / 100,
        risk: activity.riskLevel,
        type: activity.type as ActivityType,
      }
    })

    return {
      data: mapped,
      links: [],
    }
  }, [activities, crops])

  useEffect(() => {
    if (!ganttContainer.current) return

    gantt.config.xml_date = '%Y-%m-%d'
    gantt.config.scale_unit = 'month'
    gantt.config.date_scale = '%M %Y'
    gantt.config.subscales = [{ unit: 'week', step: 1, date: '%d %b' }]
    gantt.config.grid_width = 340
    gantt.config.row_height = 40
    gantt.config.min_column_width = 80
    gantt.config.select_task = false
    gantt.config.readonly = true
    gantt.config.highlight_critical_path = false
    gantt.config.show_progress = true
    gantt.config.open_tree_initially = true

    gantt.config.columns = [
      { name: 'text', label: 'Activity', tree: true, width: 220 },
      {
        name: 'risk',
        label: 'Risk',
        width: 100,
        template: (task: any) => getRiskLabel(task.risk),
      },
      { name: 'start_date', label: 'Start', align: 'center', width: 90 },
      { name: 'end_date', label: 'End', align: 'center', width: 90 },
    ]

    gantt.templates.task_class = (_start: any, _end: any, task: any) => {
      if (task.risk === 'HIGH') return 'risk-high'
      if (task.risk === 'MEDIUM') return 'risk-medium'
      return 'risk-low'
    }

    gantt.templates.task_text = (_start: any, _end: any, task: any) => task.text
    gantt.templates.grid_row_class = (_start: any, _end: any, task: any) => {
      if (task.risk === 'HIGH') return 'grid-risk-high'
      if (task.risk === 'MEDIUM') return 'grid-risk-medium'
      return 'grid-risk-low'
    }

    gantt.clearAll()
    gantt.init(ganttContainer.current)
    gantt.parse(tasks)

    return () => {
      gantt.clearAll()
    }
  }, [tasks])

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 3 }}>
        🌾 FarmPlan Crop Planner
      </Typography>

      <Paper sx={{ p: 3, mb: 3, bgcolor: '#f7f9fd' }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Weather risk snapshot
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          This planner uses the FarmPlan service layer to load crops, activities, and weather. When backend integration is enabled, the same service contract will provide production data.
        </Typography>
        {weather ? (
          <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {weather.date.toLocaleDateString()} — {weather.condition}
            </Typography>
            <Typography variant="body2">Rain: {weather.rainMm}mm</Typography>
            <Typography variant="body2">Temp: {weather.tempC}°C</Typography>
            <Typography variant="body2">Wind: {weather.windKph} kph</Typography>
            <Typography variant="body2">Humidity: {weather.humidity}%</Typography>
          </Box>
        ) : (
          <Typography variant="body2" sx={{ mt: 2 }}>
            {loading ? 'Loading weather...' : 'No weather snapshot available yet.'}
          </Typography>
        )}
      </Paper>

      <Paper sx={{ p: 0, overflow: 'hidden', borderRadius: 3, boxShadow: 4 }}>
        <Box ref={ganttContainer} id="gantt_here" sx={{ width: '100%', height: '680px' }} />
      </Paper>
    </Container>
  )
}

export default GanttChart
