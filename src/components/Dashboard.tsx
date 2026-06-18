import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemText,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Stack,
  Skeleton,
  alpha,
  useTheme,
} from '@mui/material'
import {
  Grass as GrassIcon,
  Spa as SpaIcon,
  EventNote as EventNoteIcon,
  WarningAmber as WarningAmberIcon,
  Add as AddIcon,
  Thermostat as ThermostatIcon,
  WaterDrop as WaterDropIcon,
  Air as AirIcon,
  Opacity as OpacityIcon,
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { api } from '../services/api'
import type { Activity, ActivityType, Crop, Farm, WeatherData } from '../types'
import { assessActivityRiskOverWindow, getRiskColor } from '../utils/riskEngine'

const ACTIVITY_EMOJI: Record<ActivityType, string> = {
  SOW: '🌱',
  TRANSPLANT: '🌿',
  IRRIGATE: '💧',
  FERTILIZE: '🧪',
  SPRAY: '🌊',
  HARVEST: '🌾',
}

const Dashboard = () => {
  const { t } = useTranslation()
  const theme = useTheme()

  const [farms, setFarms] = useState<Farm[]>([])
  const [crops, setCrops] = useState<Crop[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [weather, setWeather] = useState<WeatherData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [openFarmDialog, setOpenFarmDialog] = useState(false)
  const [openCropDialog, setOpenCropDialog] = useState(false)
  const [openActivityDialog, setOpenActivityDialog] = useState(false)

  const [farmForm, setFarmForm] = useState({
    userId: 'user-001',
    name: '',
    latitude: '',
    longitude: '',
    region: '',
  })

  const [cropForm, setCropForm] = useState({
    farmId: '',
    name: '',
    sowDate: '',
    expectedHarvestDate: '',
    variety: '',
    estimatedYield: '',
  })

  const [activityForm, setActivityForm] = useState({
    cropId: '',
    type: 'SOW' as ActivityType,
    startDate: '',
    endDate: '',
    description: '',
  })

  const activityTypes: ActivityType[] = ['SOW', 'TRANSPLANT', 'IRRIGATE', 'FERTILIZE', 'SPRAY', 'HARVEST']

  const loadData = async () => {
    setLoading(true)
    setError(null)
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
      setError(t('dashboard.loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const resetFarmForm = () => {
    setFarmForm({ userId: 'user-001', name: '', latitude: '', longitude: '', region: '' })
    setFormError(null)
  }

  const resetCropForm = () => {
    setCropForm({
      farmId: farms[0]?.id ?? '',
      name: '',
      sowDate: '',
      expectedHarvestDate: '',
      variety: '',
      estimatedYield: '',
    })
    setFormError(null)
  }

  const resetActivityForm = () => {
    setActivityForm({
      cropId: crops[0]?.id ?? '',
      type: 'SOW',
      startDate: '',
      endDate: '',
      description: '',
    })
    setFormError(null)
  }

  const handleOpenFarmDialog = () => {
    resetFarmForm()
    setOpenFarmDialog(true)
  }

  const handleOpenCropDialog = () => {
    resetCropForm()
    setOpenCropDialog(true)
  }

  const handleOpenActivityDialog = () => {
    resetActivityForm()
    setOpenActivityDialog(true)
  }

  const handleCreateFarm = async () => {
    if (!farmForm.name || !farmForm.region || !farmForm.latitude || !farmForm.longitude) {
      setFormError(t('forms.fillAll'))
      return
    }

    try {
      await api.createFarm({
        userId: farmForm.userId,
        name: farmForm.name,
        latitude: Number(farmForm.latitude),
        longitude: Number(farmForm.longitude),
        region: farmForm.region,
      })
      setOpenFarmDialog(false)
      await loadData()
    } catch (err) {
      setFormError(t('forms.createFarmError'))
    }
  }

  const handleCreateCrop = async () => {
    if (!cropForm.farmId || !cropForm.name || !cropForm.sowDate || !cropForm.expectedHarvestDate) {
      setFormError(t('forms.fillAll'))
      return
    }

    try {
      await api.createCrop({
        farmId: cropForm.farmId,
        name: cropForm.name,
        sowDate: new Date(cropForm.sowDate),
        expectedHarvestDate: new Date(cropForm.expectedHarvestDate),
        variety: cropForm.variety || undefined,
        estimatedYield: cropForm.estimatedYield ? Number(cropForm.estimatedYield) : undefined,
      })
      setOpenCropDialog(false)
      await loadData()
    } catch (err) {
      setFormError(t('forms.createCropError'))
    }
  }

  const handleCreateActivity = async () => {
    if (!activityForm.cropId || !activityForm.startDate || !activityForm.endDate || !activityForm.type) {
      setFormError(t('forms.fillAll'))
      return
    }

    try {
      await api.createActivity({
        cropId: activityForm.cropId,
        type: activityForm.type,
        startDate: new Date(activityForm.startDate),
        endDate: new Date(activityForm.endDate),
        status: 'PLANNED',
        description: activityForm.description || undefined,
        riskScore: 0,
        riskLevel: 'LOW',
        riskReason: undefined,
      })
      setOpenActivityDialog(false)
      await loadData()
    } catch (err) {
      setFormError(t('forms.createActivityError'))
    }
  }

  const upcomingActivities = useMemo(() => {
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    return activities.filter((activity) => activity.startDate >= now && activity.startDate <= thirtyDaysFromNow)
  }, [activities])

  const activitiesWithRisk = useMemo(() => {
    return activities.map((activity) => {
      if (weather.length === 0) return activity
      // Score each activity against the forecast days overlapping its own date window,
      // not a single shared snapshot — so different schedules yield different risk.
      const risk = assessActivityRiskOverWindow(
        activity.type as ActivityType,
        activity.startDate,
        activity.endDate,
        weather,
      )
      return {
        ...activity,
        riskLevel: risk.riskLevel,
        riskScore: risk.riskScore,
        riskReason: risk.reason,
      }
    })
  }, [activities, weather])

  const highRiskActivities = useMemo(
    () => activitiesWithRisk.filter((activity) => activity.riskLevel === 'HIGH'),
    [activitiesWithRisk],
  )

  const activityLabel = (type: ActivityType) => `${ACTIVITY_EMOJI[type] ?? ''} ${t(`activityType.${type}`)}`.trim()
  const cropLabel = (cropId: string) => {
    const crop = crops.find((c) => c.id === cropId)
    return crop ? t(`cropName.${crop.name}`, { defaultValue: crop.name }) : t('forms.unknownCrop')
  }

  const stats = [
    { key: 'farms', value: farms.length, icon: <GrassIcon />, from: '#43a047', to: '#1b5e20' },
    { key: 'crops', value: crops.length, icon: <SpaIcon />, from: '#26a69a', to: '#00695c' },
    { key: 'activities', value: activities.length, icon: <EventNoteIcon />, from: '#42a5f5', to: '#1565c0' },
    { key: 'highRisk', value: highRiskActivities.length, icon: <WarningAmberIcon />, from: '#ffa726', to: '#e53935' },
  ] as const

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" sx={{ fontWeight: 800 }}>
          🌾 {t('dashboard.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
          {t('dashboard.subtitle')}
        </Typography>
      </Box>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 4 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenFarmDialog}>
          {t('actions.addFarm')}
        </Button>
        <Button variant="outlined" startIcon={<AddIcon />} onClick={handleOpenCropDialog} disabled={farms.length === 0}>
          {t('actions.addCrop')}
        </Button>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleOpenActivityDialog}
          disabled={crops.length === 0}
        >
          {t('actions.addActivity')}
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }} action={<Button color="inherit" size="small" onClick={loadData}>{t('actions.retry')}</Button>}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.key}>
            <Card
              sx={{
                position: 'relative',
                overflow: 'hidden',
                color: '#fff',
                backgroundImage: `linear-gradient(135deg, ${stat.from} 0%, ${stat.to} 100%)`,
                boxShadow: `0 10px 30px ${alpha(stat.to, 0.35)}`,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography sx={{ fontSize: 14, opacity: 0.9, mb: 0.5 }}>
                      {t(`dashboard.stats.${stat.key}`)}
                    </Typography>
                    {loading ? (
                      <Skeleton variant="text" width={48} height={48} sx={{ bgcolor: alpha('#fff', 0.3) }} />
                    ) : (
                      <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1 }}>
                        {stat.value}
                      </Typography>
                    )}
                  </Box>
                  <Box
                    sx={{
                      display: 'grid',
                      placeItems: 'center',
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: alpha('#fff', 0.2),
                    }}
                  >
                    {stat.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {weather[0] && (
        <Alert severity="warning" icon={<WaterDropIcon />} sx={{ mb: 4, borderRadius: 3 }}>
          <Typography variant="body2">
            <strong>{t('dashboard.forecastAlert')}:</strong>{' '}
            {t(`condition.${weather[0].condition}`, { defaultValue: weather[0].conditionDescription })} ·{' '}
            {t('weather.rainChance')} {Math.round(weather[0].precipitationProbability * 100)}% · {t('weather.temp')}{' '}
            {weather[0].tempRounded}°C · {t('weather.wind')} {Math.round(weather[0].windKph)} km/h · {t('weather.humidity')}{' '}
            {weather[0].humidity}%
          </Typography>
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              📅 {t('dashboard.upcoming')}
            </Typography>
            {loading ? (
              <Stack spacing={1}>
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} variant="rounded" height={72} />
                ))}
              </Stack>
            ) : upcomingActivities.length > 0 ? (
              <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                {upcomingActivities.map((activity) => {
                  const risk = activitiesWithRisk.find((a) => a.id === activity.id)
                  const level = risk?.riskLevel ?? activity.riskLevel
                  return (
                    <ListItem
                      key={activity.id}
                      sx={{
                        mb: 1,
                        p: 1.5,
                        bgcolor: alpha(theme.palette.text.primary, 0.04),
                        borderLeft: `4px solid ${getRiskColor(level)}`,
                        borderRadius: 2,
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <span>{activityLabel(activity.type)}</span>
                            <Chip
                              label={t(`risk.${level}`)}
                              size="small"
                              sx={{ backgroundColor: getRiskColor(level), color: '#fff' }}
                            />
                          </Box>
                        }
                        secondaryTypographyProps={{ component: 'div' }}
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                            <Typography variant="caption" display="block">
                              <strong>{t('dashboard.crop')}:</strong> {cropLabel(activity.cropId)}
                            </Typography>
                            <Typography variant="caption" display="block">
                              <strong>{t('dashboard.date')}:</strong> {activity.startDate.toLocaleDateString()} –{' '}
                              {activity.endDate.toLocaleDateString()}
                            </Typography>
                            {risk?.riskReason && (
                              <Typography variant="caption" display="block" sx={{ color: 'error.main', mt: 0.5 }}>
                                {risk.riskReason}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  )
                })}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                {t('dashboard.upcomingEmpty')}
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              ☀️ {t('dashboard.forecast')}
            </Typography>
            {loading ? (
              <Stack spacing={1}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} variant="rounded" height={56} />
                ))}
              </Stack>
            ) : (
              <List>
                {weather.map((forecast, idx) => (
                  <ListItem
                    key={idx}
                    sx={{
                      mb: 1,
                      p: 1.5,
                      bgcolor: alpha(theme.palette.text.primary, 0.04),
                      borderRadius: 2,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 1,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 120 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {forecast.date.toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t(`condition.${forecast.condition}`, { defaultValue: forecast.conditionDescription })}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <Metric icon={<ThermostatIcon fontSize="inherit" />} value={`${forecast.tempRounded}°C`} />
                      <Metric
                        icon={<OpacityIcon fontSize="inherit" />}
                        value={`${Math.round(forecast.precipitationProbability * 100)}%`}
                      />
                      <Metric icon={<AirIcon fontSize="inherit" />} value={`${Math.round(forecast.windKph)} km/h`} />
                    </Box>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {highRiskActivities.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, bgcolor: alpha(theme.palette.warning.main, 0.1), borderLeft: `4px solid ${theme.palette.warning.dark}` }}>
              <Typography variant="h6" sx={{ mb: 2, color: 'warning.dark' }}>
                ⚠️ {t('dashboard.highRiskTitle')}
              </Typography>
              <List>
                {highRiskActivities.map((activity) => (
                  <ListItem key={activity.id} sx={{ mb: 1, p: 1.5, bgcolor: 'background.paper', borderRadius: 2 }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>{activityLabel(activity.type)}</span>
                          <Chip
                            label={t(`risk.${activity.riskLevel}`)}
                            size="small"
                            sx={{ backgroundColor: getRiskColor(activity.riskLevel), color: '#fff' }}
                          />
                        </Box>
                      }
                      secondaryTypographyProps={{ component: 'div' }}
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Typography variant="caption" display="block">
                            <strong>{t('dashboard.crop')}:</strong> {cropLabel(activity.cropId)}
                          </Typography>
                          <Typography variant="caption" display="block">
                            <strong>{t('dashboard.window')}:</strong> {activity.startDate.toLocaleDateString()} –{' '}
                            {activity.endDate.toLocaleDateString()}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Add Farm */}
      <Dialog open={openFarmDialog} onClose={() => setOpenFarmDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>{t('actions.addFarm')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label={t('forms.farmName')} value={farmForm.name} onChange={(e) => setFarmForm({ ...farmForm, name: e.target.value })} fullWidth />
            <TextField label={t('forms.region')} value={farmForm.region} onChange={(e) => setFarmForm({ ...farmForm, region: e.target.value })} fullWidth />
            <TextField label={t('forms.latitude')} value={farmForm.latitude} onChange={(e) => setFarmForm({ ...farmForm, latitude: e.target.value })} fullWidth type="number" />
            <TextField label={t('forms.longitude')} value={farmForm.longitude} onChange={(e) => setFarmForm({ ...farmForm, longitude: e.target.value })} fullWidth type="number" />
            {formError && <Alert severity="error">{formError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFarmDialog(false)}>{t('actions.cancel')}</Button>
          <Button variant="contained" onClick={handleCreateFarm}>{t('actions.createFarm')}</Button>
        </DialogActions>
      </Dialog>

      {/* Add Crop */}
      <Dialog open={openCropDialog} onClose={() => setOpenCropDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>{t('actions.addCrop')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel id="farm-select-label">{t('forms.farm')}</InputLabel>
              <Select labelId="farm-select-label" value={cropForm.farmId} label={t('forms.farm')} onChange={(e) => setCropForm({ ...cropForm, farmId: e.target.value })}>
                {farms.map((farm) => (
                  <MenuItem key={farm.id} value={farm.id}>{farm.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField label={t('forms.cropName')} value={cropForm.name} onChange={(e) => setCropForm({ ...cropForm, name: e.target.value })} fullWidth />
            <TextField label={t('forms.variety')} value={cropForm.variety} onChange={(e) => setCropForm({ ...cropForm, variety: e.target.value })} fullWidth />
            <Stack direction="row" spacing={2}>
              <TextField label={t('forms.sowDate')} type="date" value={cropForm.sowDate} onChange={(e) => setCropForm({ ...cropForm, sowDate: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
              <TextField label={t('forms.harvestDate')} type="date" value={cropForm.expectedHarvestDate} onChange={(e) => setCropForm({ ...cropForm, expectedHarvestDate: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
            </Stack>
            <TextField label={t('forms.estimatedYield')} type="number" value={cropForm.estimatedYield} onChange={(e) => setCropForm({ ...cropForm, estimatedYield: e.target.value })} fullWidth />
            {formError && <Alert severity="error">{formError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCropDialog(false)}>{t('actions.cancel')}</Button>
          <Button variant="contained" onClick={handleCreateCrop} disabled={!cropForm.farmId}>{t('actions.createCrop')}</Button>
        </DialogActions>
      </Dialog>

      {/* Add Activity */}
      <Dialog open={openActivityDialog} onClose={() => setOpenActivityDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>{t('actions.addActivity')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel id="crop-select-label">{t('dashboard.crop')}</InputLabel>
              <Select labelId="crop-select-label" value={activityForm.cropId} label={t('dashboard.crop')} onChange={(e) => setActivityForm({ ...activityForm, cropId: e.target.value })}>
                {crops.map((crop) => (
                  <MenuItem key={crop.id} value={crop.id}>
                    {t(`cropName.${crop.name}`, { defaultValue: crop.name })} ({farms.find((farm) => farm.id === crop.farmId)?.name || t('forms.unknownFarm')})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="activity-type-label">{t('forms.type')}</InputLabel>
              <Select labelId="activity-type-label" value={activityForm.type} label={t('forms.type')} onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value as ActivityType })}>
                {activityTypes.map((type) => (
                  <MenuItem key={type} value={type}>{activityLabel(type)}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Stack direction="row" spacing={2}>
              <TextField label={t('forms.startDate')} type="date" value={activityForm.startDate} onChange={(e) => setActivityForm({ ...activityForm, startDate: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
              <TextField label={t('forms.endDate')} type="date" value={activityForm.endDate} onChange={(e) => setActivityForm({ ...activityForm, endDate: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
            </Stack>
            <TextField label={t('forms.description')} value={activityForm.description} onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })} fullWidth multiline minRows={2} />
            {formError && <Alert severity="error">{formError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenActivityDialog(false)}>{t('actions.cancel')}</Button>
          <Button variant="contained" onClick={handleCreateActivity} disabled={!activityForm.cropId}>{t('actions.createActivity')}</Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

const Metric = ({ icon, value }: { icon: ReactNode; value: string }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: 18, color: 'text.secondary' }}>
    {icon}
    <Typography variant="caption" sx={{ fontWeight: 600 }}>
      {value}
    </Typography>
  </Box>
)

export default Dashboard
