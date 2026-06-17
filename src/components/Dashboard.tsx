import { useEffect, useMemo, useState } from 'react'
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
} from '@mui/material'
import { api } from '../services/api'
import type { Activity, ActivityType, Crop, Farm, WeatherData } from '../types'
import { assessActivityRisk, getRiskColor } from '../utils/riskEngine'

const Dashboard = () => {
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
      setError('Failed to load FarmPlan dashboard data. Please check your backend or network connection.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
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
      setFormError('Please fill in all farm fields.')
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
      setFormError('Unable to create farm. Please try again.')
    }
  }

  const handleCreateCrop = async () => {
    if (!cropForm.farmId || !cropForm.name || !cropForm.sowDate || !cropForm.expectedHarvestDate) {
      setFormError('Please fill in all crop fields.')
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
      setFormError('Unable to create crop. Please try again.')
    }
  }

  const handleCreateActivity = async () => {
    if (!activityForm.cropId || !activityForm.startDate || !activityForm.endDate || !activityForm.type) {
      setFormError('Please fill in all activity fields.')
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
      setFormError('Unable to create activity. Please try again.')
    }
  }

  const upcomingActivities = useMemo(() => {
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    return activities.filter((activity) => activity.startDate >= now && activity.startDate <= thirtyDaysFromNow)
  }, [activities])

  const highRiskActivities = useMemo(() => {
    return activities.filter((activity) => activity.riskLevel === 'HIGH')
  }, [activities])

  const activitiesWithRisk = useMemo(() => {
    return activities.map((activity) => {
      const weatherSnapshot = weather[0]
      if (weatherSnapshot) {
        const risk = assessActivityRisk(activity.type as ActivityType, weatherSnapshot)
        return {
          ...activity,
          riskLevel: risk.riskLevel,
          riskScore: risk.riskScore,
          riskReason: risk.reason,
        }
      }

      return activity
    })
  }, [activities, weather])

  const getActivityTypeLabel = (type: ActivityType): string => {
    const labels: Record<ActivityType, string> = {
      SOW: '🌱 Sow',
      TRANSPLANT: '🌿 Transplant',
      IRRIGATE: '💧 Irrigate',
      FERTILIZE: '🧪 Fertilize',
      SPRAY: '🌊 Spray',
      HARVEST: '🌾 Harvest',
    }
    return labels[type] || type
  }

  const getCropName = (cropId: string) => {
    const crop = crops.find((c) => c.id === cropId)
    return crop?.name || 'Unknown Crop'
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" sx={{ mb: 4, fontWeight: 'bold' }}>
        🌾 FarmPlan Dashboard
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4 }}>
        <Button variant="contained" onClick={handleOpenFarmDialog}>
          Add Farm
        </Button>
        <Button variant="outlined" onClick={handleOpenCropDialog} disabled={farms.length === 0}>
          Add Crop
        </Button>
        <Button variant="outlined" onClick={handleOpenActivityDialog} disabled={crops.length === 0}>
          Add Activity
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <CardContent sx={{ color: 'white' }}>
              <Typography color="inherit" sx={{ fontSize: 14, mb: 1 }}>
                Total Farms
              </Typography>
              <Typography variant="h4">{farms.length}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <CardContent sx={{ color: 'white' }}>
              <Typography color="inherit" sx={{ fontSize: 14, mb: 1 }}>
                Total Crops
              </Typography>
              <Typography variant="h4">{crops.length}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <CardContent sx={{ color: 'white' }}>
              <Typography color="inherit" sx={{ fontSize: 14, mb: 1 }}>
                Activities
              </Typography>
              <Typography variant="h4">{activities.length}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
            <CardContent sx={{ color: 'white' }}>
              <Typography color="inherit" sx={{ fontSize: 14, mb: 1 }}>
                High Risk
              </Typography>
              <Typography variant="h4">{highRiskActivities.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {weather[0] && (
        <Alert severity="warning" sx={{ mb: 4 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Current Forecast Alert:</strong> {weather[0].condition} | Rain: {weather[0].rainMm}mm | Temp: {weather[0].tempC}°C | Wind: {weather[0].windKph} kph | Humidity: {weather[0].humidity}%
          </Typography>
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              📅 Upcoming Activities (Next 30 Days)
            </Typography>
            {loading ? (
              <Typography variant="body2">Loading activities...</Typography>
            ) : upcomingActivities.length > 0 ? (
              <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                {upcomingActivities.map((activity) => {
                  const risk = activitiesWithRisk.find((a) => a.id === activity.id)
                  return (
                    <ListItem
                      key={activity.id}
                      sx={{
                        mb: 1,
                        p: 1.5,
                        bgcolor: '#f5f5f5',
                        borderLeft: `4px solid ${getRiskColor(activity.riskLevel)}`,
                        borderRadius: 1,
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <span>{getActivityTypeLabel(activity.type)}</span>
                            <Chip
                              label={activity.riskLevel}
                              size="small"
                              sx={{
                                backgroundColor: getRiskColor(activity.riskLevel),
                                color: 'white',
                                fontWeight: 'bold',
                              }}
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" display="block">
                              <strong>Crop:</strong> {getCropName(activity.cropId)}
                            </Typography>
                            <Typography variant="caption" display="block">
                              <strong>Date:</strong> {activity.startDate.toLocaleDateString()} - {activity.endDate.toLocaleDateString()}
                            </Typography>
                            {risk?.riskReason && (
                              <Typography variant="caption" display="block" sx={{ color: '#d32f2f', mt: 0.5 }}>
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
                No upcoming activities in the next 30 days
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              ☀️ 5-Day Weather Forecast
            </Typography>
            <List>
              {weather.map((forecast, idx) => (
                <ListItem
                  key={idx}
                  sx={{
                    mb: 1,
                    p: 1.5,
                    bgcolor: '#f5f5f5',
                    borderRadius: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                      {forecast.date.toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" display="block">
                      {forecast.condition}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', minWidth: 200 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                        🌡️
                      </Typography>
                      <Typography variant="caption">{forecast.tempC}°C</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                        💧
                      </Typography>
                      <Typography variant="caption">{forecast.rainMm}mm</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                        🌬️
                      </Typography>
                      <Typography variant="caption">{forecast.windKph} kph</Typography>
                    </Box>
                  </Box>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {highRiskActivities.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, bgcolor: '#fff3e0', borderLeft: '4px solid #ff6f00' }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#e65100' }}>
                ⚠️ High Risk Activities - Review Needed
              </Typography>
              <List>
                {highRiskActivities.map((activity) => (
                  <ListItem
                    key={activity.id}
                    sx={{
                      mb: 1,
                      p: 1.5,
                      bgcolor: '#fff8e1',
                      borderRadius: 1,
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>{getActivityTypeLabel(activity.type)}</span>
                          <Chip
                            label={activity.riskLevel}
                            size="small"
                            sx={{
                              backgroundColor: getRiskColor(activity.riskLevel),
                              color: 'white',
                              fontWeight: 'bold',
                            }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" display="block">
                            <strong>Crop:</strong> {getCropName(activity.cropId)}
                          </Typography>
                          <Typography variant="caption" display="block">
                            <strong>Window:</strong> {activity.startDate.toLocaleDateString()} - {activity.endDate.toLocaleDateString()}
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

      <Dialog open={openFarmDialog} onClose={() => setOpenFarmDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add Farm</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Farm name"
              value={farmForm.name}
              onChange={(event) => setFarmForm({ ...farmForm, name: event.target.value })}
              fullWidth
            />
            <TextField
              label="Region"
              value={farmForm.region}
              onChange={(event) => setFarmForm({ ...farmForm, region: event.target.value })}
              fullWidth
            />
            <TextField
              label="Latitude"
              value={farmForm.latitude}
              onChange={(event) => setFarmForm({ ...farmForm, latitude: event.target.value })}
              fullWidth
              type="number"
            />
            <TextField
              label="Longitude"
              value={farmForm.longitude}
              onChange={(event) => setFarmForm({ ...farmForm, longitude: event.target.value })}
              fullWidth
              type="number"
            />
            {formError && <Alert severity="error">{formError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFarmDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateFarm}>
            Create Farm
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openCropDialog} onClose={() => setOpenCropDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add Crop</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel id="farm-select-label">Farm</InputLabel>
              <Select
                labelId="farm-select-label"
                value={cropForm.farmId}
                label="Farm"
                onChange={(event) => setCropForm({ ...cropForm, farmId: event.target.value })}
              >
                {farms.map((farm) => (
                  <MenuItem key={farm.id} value={farm.id}>
                    {farm.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Crop name"
              value={cropForm.name}
              onChange={(event) => setCropForm({ ...cropForm, name: event.target.value })}
              fullWidth
            />
            <TextField
              label="Variety"
              value={cropForm.variety}
              onChange={(event) => setCropForm({ ...cropForm, variety: event.target.value })}
              fullWidth
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Sow date"
                type="date"
                value={cropForm.sowDate}
                onChange={(event) => setCropForm({ ...cropForm, sowDate: event.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Harvest date"
                type="date"
                value={cropForm.expectedHarvestDate}
                onChange={(event) => setCropForm({ ...cropForm, expectedHarvestDate: event.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
            <TextField
              label="Estimated yield"
              type="number"
              value={cropForm.estimatedYield}
              onChange={(event) => setCropForm({ ...cropForm, estimatedYield: event.target.value })}
              fullWidth
            />
            {formError && <Alert severity="error">{formError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCropDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateCrop} disabled={!cropForm.farmId}>
            Create Crop
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openActivityDialog} onClose={() => setOpenActivityDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add Activity</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel id="crop-select-label">Crop</InputLabel>
              <Select
                labelId="crop-select-label"
                value={activityForm.cropId}
                label="Crop"
                onChange={(event) => setActivityForm({ ...activityForm, cropId: event.target.value })}
              >
                {crops.map((crop) => (
                  <MenuItem key={crop.id} value={crop.id}>
                    {crop.name} ({farms.find((farm) => farm.id === crop.farmId)?.name || 'Unknown Farm'})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="activity-type-label">Type</InputLabel>
              <Select
                labelId="activity-type-label"
                value={activityForm.type}
                label="Type"
                onChange={(event) => setActivityForm({ ...activityForm, type: event.target.value as ActivityType })}
              >
                {activityTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Start date"
                type="date"
                value={activityForm.startDate}
                onChange={(event) => setActivityForm({ ...activityForm, startDate: event.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="End date"
                type="date"
                value={activityForm.endDate}
                onChange={(event) => setActivityForm({ ...activityForm, endDate: event.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
            <TextField
              label="Description"
              value={activityForm.description}
              onChange={(event) => setActivityForm({ ...activityForm, description: event.target.value })}
              fullWidth
              multiline
              minRows={2}
            />
            {formError && <Alert severity="error">{formError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenActivityDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateActivity} disabled={!activityForm.cropId}>
            Create Activity
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default Dashboard
