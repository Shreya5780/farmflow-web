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
  LinearProgress,
  CircularProgress,
  Divider,
  Fab,
  Menu,
  ListItemIcon,
  ListItemText,
  alpha,
  useTheme,
} from '@mui/material'
import {
  Add as AddIcon,
  EventNote as EventNoteIcon,
  Agriculture as AgricultureIcon,
  Grass as GrassIcon,
  Thermostat as ThermostatIcon,
  Air as AirIcon,
  Opacity as OpacityIcon,
  WaterDrop as WaterDropIcon,
  CheckCircle as CheckCircleIcon,
  ArrowForwardIos as ArrowForwardIosIcon,
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import type { ActivityType } from '../types'
import { assessActivityRiskOverWindow, getRiskColor } from '../utils/riskEngine'
import { getCropProgress, getGrowthStage, getCropHealth, healthColor } from '../utils/cropStatus'
import { useQuickAdd } from '../context/QuickAddContext'
import { useAppData } from '../context/AppDataContext'
import heroImg from '../assets/farm2.png'

const ACTIVITY_EMOJI: Record<ActivityType, string> = {
  SOW: '🌱',
  TRANSPLANT: '🌿',
  IRRIGATE: '💧',
  FERTILIZE: '🧪',
  SPRAY: '🌊',
  HARVEST: '🌾',
}

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

const cropEmoji = (name: string) => {
  const n = name.toLowerCase()
  if (n.includes('wheat')) return '🌾'
  if (n.includes('rice') || n.includes('paddy')) return '🌾'
  if (n.includes('tomato')) return '🍅'
  if (n.includes('mustard')) return '🌼'
  if (n.includes('corn') || n.includes('maize')) return '🌽'
  if (n.includes('onion')) return '🧅'
  return '🌱'
}

const CROP_GRADIENTS = [
  'linear-gradient(135deg, #2e7d32 0%, #60ad5e 100%)',
  'linear-gradient(135deg, #00897b 0%, #4db6ac 100%)',
  'linear-gradient(135deg, #f9a825 0%, #ffca28 100%)',
  'linear-gradient(135deg, #6d4c41 0%, #a1887f 100%)',
]

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

const Dashboard = () => {
  const { t, i18n } = useTranslation()
  const theme = useTheme()
  const navigate = useNavigate()
  const { pending, consume } = useQuickAdd()
  const { farms, crops, activities, weather, loading, error: dataError, reload } = useAppData()

  const [formError, setFormError] = useState<string | null>(null)
  const [openFarmDialog, setOpenFarmDialog] = useState(false)
  const [openCropDialog, setOpenCropDialog] = useState(false)
  const [openActivityDialog, setOpenActivityDialog] = useState(false)
  const [fabAnchor, setFabAnchor] = useState<null | HTMLElement>(null)

  const [farmForm, setFarmForm] = useState({ userId: 'user-001', name: '', latitude: '', longitude: '', region: '' })
  const [cropForm, setCropForm] = useState({ farmId: '', name: '', sowDate: '', expectedHarvestDate: '', variety: '', estimatedYield: '' })
  const [activityForm, setActivityForm] = useState({ cropId: '', type: 'SOW' as ActivityType, startDate: '', endDate: '', description: '' })

  const activityTypes: ActivityType[] = ['SOW', 'TRANSPLANT', 'IRRIGATE', 'FERTILIZE', 'SPRAY', 'HARVEST']

  const resetFarmForm = () => {
    setFarmForm({ userId: 'user-001', name: '', latitude: '', longitude: '', region: '' })
    setFormError(null)
  }
  const resetCropForm = () => {
    setCropForm({ farmId: farms[0]?.id ?? '', name: '', sowDate: '', expectedHarvestDate: '', variety: '', estimatedYield: '' })
    setFormError(null)
  }
  const resetActivityForm = () => {
    setActivityForm({ cropId: crops[0]?.id ?? '', type: 'SOW', startDate: '', endDate: '', description: '' })
    setFormError(null)
  }

  const handleOpenFarmDialog = () => { resetFarmForm(); setOpenFarmDialog(true) }
  const handleOpenCropDialog = () => { resetCropForm(); setOpenCropDialog(true) }
  const handleOpenActivityDialog = () => { resetActivityForm(); setOpenActivityDialog(true) }

  // "+ New" menu (nav) requests open a dialog here.
  useEffect(() => {
    if (!pending) return
    if (pending === 'farm') handleOpenFarmDialog()
    else if (pending === 'crop') handleOpenCropDialog()
    else if (pending === 'activity') handleOpenActivityDialog()
    consume()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending])

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
      await reload()
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
      await reload()
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
      await reload()
    } catch (err) {
      setFormError(t('forms.createActivityError'))
    }
  }

  const now = new Date()

  const activitiesWithRisk = useMemo(() => {
    return activities.map((activity) => {
      if (weather.length === 0) return activity
      const risk = assessActivityRiskOverWindow(activity.type as ActivityType, activity.startDate, activity.endDate, weather)
      return { ...activity, riskLevel: risk.riskLevel, riskScore: risk.riskScore, riskReason: risk.reason }
    })
  }, [activities, weather])

  const upcomingActivities = useMemo(() => {
    return [...activitiesWithRisk]
      .filter((a) => a.endDate >= now)
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
      .slice(0, 6)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activitiesWithRisk])

  const tasksDueToday = useMemo(
    () => activities.filter((a) => a.startDate <= now && a.endDate >= new Date(now.getFullYear(), now.getMonth(), now.getDate())).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activities],
  )

  const harvestInDays = useMemo(() => {
    const days = crops
      .map((c) => Math.ceil((c.expectedHarvestDate.getTime() - now.getTime()) / 86_400_000))
      .filter((d) => d >= 0)
    return days.length ? Math.min(...days) : null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crops])

  const riskSummary = useMemo(() => {
    if (activitiesWithRisk.length === 0) return { score: 0, level: 'LOW' as const }
    const scores = activitiesWithRisk.map((a) => a.riskScore ?? 0)
    const score = Math.round(scores.reduce((s, n) => s + n, 0) / scores.length)
    const level = activitiesWithRisk.some((a) => a.riskLevel === 'HIGH')
      ? ('HIGH' as const)
      : activitiesWithRisk.some((a) => a.riskLevel === 'MEDIUM')
        ? ('MEDIUM' as const)
        : ('LOW' as const)
    return { score, level }
  }, [activitiesWithRisk])

  const cropLabel = (name: string) => t(`cropName.${name}`, { defaultValue: name })
  const activityLabel = (type: ActivityType) => `${ACTIVITY_EMOJI[type] ?? ''} ${t(`activityType.${type}`)}`.trim()
  const cropName = (cropId: string) => {
    const crop = crops.find((c) => c.id === cropId)
    return crop ? cropLabel(crop.name) : t('forms.unknownCrop')
  }
  const dateLabel = (d: Date) =>
    sameDay(d, now) ? t('tasksPanel.today') : d.toLocaleDateString(i18n.language, { day: '2-digit', month: 'short' })

  const w0 = weather[0]
  const heroAlert = w0
    ? w0.tempC >= 35
      ? { title: t('hero.highTempAlert'), advice: t('hero.highTempAdvice'), color: theme.palette.warning.main }
      : w0.precipitationProbability >= 0.5
        ? { title: t('hero.rainAlert'), advice: t('hero.rainAdvice'), color: theme.palette.info.main }
        : { title: t('hero.goodAlert'), advice: t('hero.goodAdvice'), color: theme.palette.success.main }
    : null

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {dataError && (
        <Alert severity="error" sx={{ mb: 3 }} action={<Button color="inherit" size="small" onClick={reload}>{t('actions.retry')}</Button>}>
          {t('dashboard.loadError')}
        </Alert>
      )}

      {/* Hero weather */}
      <Paper
        sx={{
          mb: 3,
          overflow: 'hidden',
          borderRadius: 4,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          minHeight: 240,
        }}
      >
        <Box sx={{ p: { xs: 3, md: 4 }, flex: '1 1 45%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {loading ? (
            <Skeleton variant="text" width={180} height={80} />
          ) : w0 ? (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography sx={{ fontSize: 56, lineHeight: 1 }}>{weatherEmoji(w0.condition)}</Typography>
                <Typography variant="h2" sx={{ fontWeight: 800 }}>
                  {w0.tempRounded}
                  <Typography component="span" variant="h4" sx={{ fontWeight: 600 }}>°C</Typography>
                </Typography>
              </Box>
              {heroAlert && (
                <>
                  <Typography variant="h6" sx={{ mt: 1.5, fontWeight: 700, color: heroAlert.color }}>
                    {heroAlert.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">{heroAlert.advice}</Typography>
                </>
              )}
              <Stack direction="row" spacing={3} sx={{ mt: 1.5, color: 'text.secondary' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <OpacityIcon fontSize="small" /> <Typography variant="body2">{t('weather.humidity')}: {w0.humidity}%</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <AirIcon fontSize="small" /> <Typography variant="body2">{t('weather.wind')}: {Math.round(w0.windKph)} km/h</Typography>
                </Box>
              </Stack>
              <Box sx={{ mt: 2 }}>
                <Button variant="contained" onClick={() => navigate('/weather')} sx={{ borderRadius: 5 }}>
                  {t('hero.viewForecast')}
                </Button>
              </Box>
            </>
          ) : (
            <Typography color="text.secondary">{t('planner.noWeather')}</Typography>
          )}
        </Box>
        <Box
          sx={{
            flex: '1 1 55%',
            minHeight: { xs: 160, md: 'auto' },
            backgroundImage: `linear-gradient(90deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.background.paper, 0)} 28%), url(${heroImg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      </Paper>

      <Grid container spacing={3}>
        {/* Left column: tiles + crops */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={2} sx={{ mb: 1 }}>
            <StatTile
              loading={loading}
              icon={<EventNoteIcon />}
              value={tasksDueToday}
              label={t('tiles.tasksDue')}
              sub={t('tiles.tasksDueSub', { count: tasksDueToday })}
              accent={theme.palette.primary.main}
            />
            <StatTile
              loading={loading}
              icon={<AgricultureIcon />}
              value={harvestInDays ?? '—'}
              label={t('tiles.harvestIn')}
              sub={t('tiles.days')}
              accent={theme.palette.secondary.dark}
            />
            <Grid item xs={12} sm={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                    <CircularProgress
                      variant="determinate"
                      value={loading ? 0 : riskSummary.score}
                      size={56}
                      thickness={5}
                      sx={{ color: getRiskColor(riskSummary.level) }}
                    />
                    <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>{loading ? '' : riskSummary.score}</Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">{t('tiles.riskLevel')}</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: getRiskColor(riskSummary.level) }}>
                      {t(`risk.${riskSummary.level}`)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* My Crops */}
          <Box sx={{ mt: 3, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <GrassIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{t('myCrops.title')}</Typography>
          </Box>
          {loading ? (
            <Grid container spacing={2}>
              {[0, 1, 2].map((i) => (
                <Grid item xs={12} sm={6} md={4} key={i}><Skeleton variant="rounded" height={200} /></Grid>
              ))}
            </Grid>
          ) : crops.length === 0 ? (
            <Typography color="text.secondary">{t('myCrops.empty')}</Typography>
          ) : (
            <Grid container spacing={2}>
              {crops.map((crop, idx) => {
                const progress = getCropProgress(crop, now)
                const stage = getGrowthStage(crop, now)
                const health = getCropHealth(
                  activitiesWithRisk.filter((a) => a.cropId === crop.id),
                  weather,
                  now,
                )
                return (
                  <Grid item xs={12} sm={6} md={4} key={crop.id}>
                    <Card sx={{ height: '100%', overflow: 'hidden' }}>
                      <Box
                        sx={{
                          p: 2,
                          color: '#fff',
                          backgroundImage: CROP_GRADIENTS[idx % CROP_GRADIENTS.length],
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ fontSize: 28 }}>{cropEmoji(crop.name)}</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>{cropLabel(crop.name)}</Typography>
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 800 }}>{progress}%</Typography>
                      </Box>
                      <CardContent>
                        <LinearProgress
                          variant="determinate"
                          value={progress}
                          sx={{ height: 8, borderRadius: 4, mb: 1.5 }}
                        />
                        <Typography variant="body2" color="text.secondary">{t(`stage.${stage}`)}</Typography>
                        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="text.secondary">
                            {t('myCrops.harvest')}: {crop.expectedHarvestDate.toLocaleDateString(i18n.language, { day: '2-digit', month: 'short' })}
                          </Typography>
                          <Chip
                            icon={<CheckCircleIcon />}
                            label={t(`health.${health}`)}
                            size="small"
                            color={healthColor(health)}
                            variant="outlined"
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                )
              })}
            </Grid>
          )}
        </Grid>

        {/* Right column: upcoming tasks + forecast */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2.5, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EventNoteIcon color="primary" fontSize="small" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{t('tasksPanel.title')}</Typography>
              </Box>
              <Button size="small" endIcon={<ArrowForwardIosIcon sx={{ fontSize: 12 }} />} onClick={() => navigate('/planner')}>
                {t('common.viewAll')}
              </Button>
            </Box>
            {loading ? (
              <Stack spacing={1}>{[0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={40} />)}</Stack>
            ) : upcomingActivities.length === 0 ? (
              <Typography variant="body2" color="text.secondary">{t('tasksPanel.empty')}</Typography>
            ) : (
              <Stack divider={<Divider flexItem />} spacing={1}>
                {upcomingActivities.map((a) => (
                  <Box key={a.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.5 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: getRiskColor(a.riskLevel), flexShrink: 0 }} />
                    <Box sx={{ minWidth: 64 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: sameDay(a.startDate, now) ? 'primary.main' : 'text.primary' }}>
                        {dateLabel(a.startDate)}
                      </Typography>
                    </Box>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{activityLabel(a.type as ActivityType)}</Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>{cropName(a.cropId)}</Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>

          <Paper sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <WaterDropIcon color="primary" fontSize="small" />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>{t('dashboard.forecast')}</Typography>
            </Box>
            {loading ? (
              <Skeleton variant="rounded" height={90} />
            ) : (
              <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1 }}>
                {weather.map((day, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      flex: '1 0 auto',
                      minWidth: 64,
                      textAlign: 'center',
                      p: 1,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.text.primary, 0.04),
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                      {day.date.toLocaleDateString(i18n.language, { weekday: 'short' })}
                    </Typography>
                    <Typography sx={{ fontSize: 24 }}>{weatherEmoji(day.condition)}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{day.tempRounded}°</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.25, color: 'text.secondary' }}>
                      <ThermostatIcon sx={{ fontSize: 12 }} />
                      <Typography variant="caption">{Math.round(day.windKph)}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Floating quick-add */}
      <Fab color="primary" onClick={(e) => setFabAnchor(e.currentTarget)} sx={{ position: 'fixed', bottom: 24, right: 24 }}>
        <AddIcon />
      </Fab>
      <Menu anchorEl={fabAnchor} open={Boolean(fabAnchor)} onClose={() => setFabAnchor(null)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }} transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <MenuItem onClick={() => { setFabAnchor(null); handleOpenFarmDialog() }}>
          <ListItemIcon><AgricultureIcon fontSize="small" /></ListItemIcon>
          <ListItemText>{t('actions.addFarm')}</ListItemText>
        </MenuItem>
        <MenuItem disabled={farms.length === 0} onClick={() => { setFabAnchor(null); handleOpenCropDialog() }}>
          <ListItemIcon><GrassIcon fontSize="small" /></ListItemIcon>
          <ListItemText>{t('actions.addCrop')}</ListItemText>
        </MenuItem>
        <MenuItem disabled={crops.length === 0} onClick={() => { setFabAnchor(null); handleOpenActivityDialog() }}>
          <ListItemIcon><EventNoteIcon fontSize="small" /></ListItemIcon>
          <ListItemText>{t('actions.addActivity')}</ListItemText>
        </MenuItem>
      </Menu>

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
                {farms.map((farm) => <MenuItem key={farm.id} value={farm.id}>{farm.name}</MenuItem>)}
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
                    {cropLabel(crop.name)} ({farms.find((farm) => farm.id === crop.farmId)?.name || t('forms.unknownFarm')})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="activity-type-label">{t('forms.type')}</InputLabel>
              <Select labelId="activity-type-label" value={activityForm.type} label={t('forms.type')} onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value as ActivityType })}>
                {activityTypes.map((type) => <MenuItem key={type} value={type}>{activityLabel(type)}</MenuItem>)}
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

const StatTile = ({
  loading,
  icon,
  value,
  label,
  sub,
  accent,
}: {
  loading: boolean
  icon: ReactNode
  value: ReactNode
  label: string
  sub: string
  accent: string
}) => (
  <Grid item xs={12} sm={4}>
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ display: 'grid', placeItems: 'center', width: 48, height: 48, borderRadius: 2, bgcolor: alpha(accent, 0.15), color: accent }}>
          {icon}
        </Box>
        <Box>
          {loading ? (
            <Skeleton variant="text" width={40} height={40} />
          ) : (
            <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1 }}>{value}</Typography>
          )}
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{label}</Typography>
          <Typography variant="caption" color="text.secondary">{sub}</Typography>
        </Box>
      </CardContent>
    </Card>
  </Grid>
)

export default Dashboard
