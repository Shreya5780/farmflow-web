import type { ReactNode } from 'react'
import { Container, Grid, Paper, Typography, Box, Stack, Skeleton, Divider, useTheme } from '@mui/material'
import {
  Thermostat as ThermostatIcon,
  Opacity as OpacityIcon,
  Air as AirIcon,
  WaterDrop as WaterDropIcon,
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { useAppData } from '../context/AppDataContext'

const weatherEmoji = (condition: string) => {
  switch (condition) {
    case 'Clear':
      return '☀️'
    case 'Clouds':
      return '⛅'
    case 'Rain':
      return '🌧️'
    case 'Drizzle':
      return '🌦️'
    case 'Thunderstorm':
      return '⛈️'
    case 'Snow':
      return '❄️'
    case 'Mist':
    case 'Fog':
    case 'Haze':
      return '🌫️'
    default:
      return '🌤️'
  }
}

const WeatherPage = () => {
  const { t, i18n } = useTranslation()
  const theme = useTheme()
  const { weather, loading } = useAppData()

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>🌤️ {t('nav.weather')}</Typography>
        <Typography variant="body1" color="text.secondary">{t('weatherPage.subtitle')}</Typography>
      </Box>

      {loading ? (
        <Grid container spacing={2}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={4} lg={2.4} key={i}><Skeleton variant="rounded" height={220} /></Grid>
          ))}
        </Grid>
      ) : weather.length === 0 ? (
        <Typography color="text.secondary">{t('planner.noWeather')}</Typography>
      ) : (
        <Grid container spacing={2}>
          {weather.map((day, idx) => (
            <Grid item xs={12} sm={6} md={4} lg={2.4} key={idx}>
              <Paper sx={{ p: 2.5, textAlign: 'center', height: '100%' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {day.date.toLocaleDateString(i18n.language, { weekday: 'long' })}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {day.date.toLocaleDateString(i18n.language, { day: '2-digit', month: 'short' })}
                </Typography>
                <Typography sx={{ fontSize: 52, my: 1 }}>{weatherEmoji(day.condition)}</Typography>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>{day.tempRounded}°C</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  {t(`condition.${day.condition}`, { defaultValue: day.conditionDescription })}
                </Typography>
                <Divider sx={{ mb: 1.5 }} />
                <Stack spacing={1} sx={{ color: 'text.secondary' }}>
                  <Metric icon={<WaterDropIcon fontSize="small" />} label={t('weather.rainChance')} value={`${Math.round(day.precipitationProbability * 100)}%`} accent={theme.palette.info.main} />
                  <Metric icon={<AirIcon fontSize="small" />} label={t('weather.wind')} value={`${Math.round(day.windKph)} km/h`} accent={theme.palette.success.main} />
                  <Metric icon={<OpacityIcon fontSize="small" />} label={t('weather.humidity')} value={`${day.humidity}%`} accent={theme.palette.primary.main} />
                  <Metric icon={<ThermostatIcon fontSize="small" />} label={t('weather.temp')} value={`${day.tempC.toFixed(1)}°C`} accent={theme.palette.warning.main} />
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  )
}

const Metric = ({ icon, label, value, accent }: { icon: ReactNode; label: string; value: string; accent: string }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: accent }}>
      {icon}
      <Typography variant="caption" color="text.secondary">{label}</Typography>
    </Box>
    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>{value}</Typography>
  </Box>
)

export default WeatherPage
