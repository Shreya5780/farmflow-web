import { useEffect, useMemo, useRef, useState } from 'react'
import { Box, Container, Paper, Typography, Chip, Stack } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { gantt } from 'dhtmlx-gantt'
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css'
import { api } from '../services/api'
import { addDays, formatDate } from '../utils/date'
import { assessActivityRiskOverWindow, getRiskColor } from '../utils/riskEngine'
import type { Activity, ActivityType, Crop, RiskLevel, WeatherData } from '../types'

const GanttChart = () => {
  const { t, i18n } = useTranslation()
  const ganttContainer = useRef<HTMLDivElement | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [crops, setCrops] = useState<Crop[]>([])
  const [forecast, setForecast] = useState<WeatherData[]>([])
  const [loading, setLoading] = useState(true)
  const weather = forecast[0] ?? null

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
          setForecast(weatherData)
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
      const cropName = crop
        ? t(`cropName.${crop.name}`, { defaultValue: crop.name })
        : t('forms.unknownCrop')

      const risk =
        forecast.length > 0
          ? assessActivityRiskOverWindow(activity.type, activity.startDate, activity.endDate, forecast)
          : { riskLevel: activity.riskLevel, riskScore: activity.riskScore }

      return {
        id: activity.id,
        text: `${t(`activityType.${activity.type}`)} — ${cropName}`,
        start_date: formatDate(activity.startDate),
        end_date: formatDate(addDays(activity.endDate, 1)),
        progress: risk.riskScore / 100,
        risk: risk.riskLevel,
        type: activity.type as ActivityType,
      }
    })

    return {
      data: mapped,
      links: [],
    }
  }, [activities, crops, forecast, t])

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
      { name: 'text', label: t('planner.col.activity'), tree: true, width: 220 },
      {
        name: 'risk',
        label: t('planner.col.risk'),
        width: 100,
        template: (task: any) => t(`risk.${task.risk}`),
      },
      { name: 'start_date', label: t('planner.col.start'), align: 'center', width: 90 },
      { name: 'end_date', label: t('planner.col.end'), align: 'center', width: 90 },
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
  }, [tasks, t, i18n.language])

  const riskLevels: RiskLevel[] = ['LOW', 'MEDIUM', 'HIGH']

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 800, mb: 3 }}>
        🌾 {t('planner.title')}
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 1 }}>
          <Typography variant="h6">{t('planner.snapshotTitle')}</Typography>
          <Stack direction="row" spacing={1}>
            {riskLevels.map((level) => (
              <Chip
                key={level}
                size="small"
                label={t(`risk.${level}`)}
                sx={{ bgcolor: getRiskColor(level), color: '#fff' }}
              />
            ))}
          </Stack>
        </Stack>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('planner.snapshotDesc')}
        </Typography>
        {weather ? (
          <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {weather.date.toLocaleDateString()} —{' '}
              {t(`condition.${weather.condition}`, { defaultValue: weather.conditionDescription })}
            </Typography>
            <Typography variant="body2">{t('weather.rainChance')}: {Math.round(weather.precipitationProbability * 100)}%</Typography>
            <Typography variant="body2">{t('weather.temp')}: {weather.tempRounded}°C</Typography>
            <Typography variant="body2">{t('weather.wind')}: {Math.round(weather.windKph)} km/h</Typography>
            <Typography variant="body2">{t('weather.humidity')}: {weather.humidity}%</Typography>
          </Box>
        ) : (
          <Typography variant="body2" sx={{ mt: 2 }}>
            {loading ? t('planner.loadingWeather') : t('planner.noWeather')}
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
