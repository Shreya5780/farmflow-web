import { useMemo, useState, type MouseEvent } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  Container,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Avatar,
  Badge,
  Divider,
  ListItemIcon,
  ListItemText,
  useTheme,
  alpha,
} from '@mui/material'
import {
  Agriculture as AgricultureIcon,
  Home as HomeIcon,
  Grass as GrassIcon,
  EventNote as EventNoteIcon,
  CloudQueue as CloudIcon,
  BarChart as BarChartIcon,
  Add as AddIcon,
  Translate as TranslateIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Check as CheckIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountCircleIcon,
} from '@mui/icons-material'
import { useColorMode } from '../context/ColorModeContext'
import { useQuickAdd } from '../context/QuickAddContext'
import { useAppData } from '../context/AppDataContext'
import { assessActivityRiskOverWindow } from '../utils/riskEngine'
import type { ActivityType } from '../types'
import { SUPPORTED_LANGUAGES } from '../i18n'

const navItems = [
  { to: '/', labelKey: 'nav.dashboard', icon: <HomeIcon fontSize="small" /> },
  { to: '/crops', labelKey: 'nav.crops', icon: <GrassIcon fontSize="small" /> },
  { to: '/planner', labelKey: 'nav.tasks', icon: <EventNoteIcon fontSize="small" /> },
  { to: '/weather', labelKey: 'nav.weather', icon: <CloudIcon fontSize="small" /> },
  { to: '/reports', labelKey: 'nav.reports', icon: <BarChartIcon fontSize="small" /> },
]

const AppShell = () => {
  const { t, i18n } = useTranslation()
  const { mode, toggleMode } = useColorMode()
  const { requestAdd } = useQuickAdd()
  const { crops, activities, weather } = useAppData()
  const navigate = useNavigate()
  const theme = useTheme()

  const notifications = useMemo(() => {
    const now = new Date()
    const items: { id: string; text: string }[] = []
    if (weather.length > 0) {
      activities
        .filter((a) => a.endDate >= now)
        .forEach((a) => {
          const risk = assessActivityRiskOverWindow(a.type as ActivityType, a.startDate, a.endDate, weather)
          if (risk.riskLevel === 'HIGH') {
            items.push({ id: `risk-${a.id}`, text: t('notifications.highRisk', { label: t(`activityType.${a.type}`) }) })
          }
        })
    }
    crops.forEach((c) => {
      const days = Math.ceil((c.expectedHarvestDate.getTime() - now.getTime()) / 86_400_000)
      if (days >= 0 && days <= 7) {
        items.push({
          id: `harvest-${c.id}`,
          text: t('notifications.harvestSoon', { crop: t(`cropName.${c.name}`, { defaultValue: c.name }), days }),
        })
      }
    })
    return items
  }, [activities, crops, weather, t])

  const [newAnchor, setNewAnchor] = useState<null | HTMLElement>(null)
  const [bellAnchor, setBellAnchor] = useState<null | HTMLElement>(null)
  const [acctAnchor, setAcctAnchor] = useState<null | HTMLElement>(null)

  const activeLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === i18n.resolvedLanguage) ?? SUPPORTED_LANGUAGES[0]

  const openNew = (e: MouseEvent<HTMLElement>) => setNewAnchor(e.currentTarget)
  const handleNew = (type: 'farm' | 'crop' | 'activity') => {
    setNewAnchor(null)
    navigate('/')
    requestAdd(type)
  }

  const chooseLanguage = (code: string) => {
    i18n.changeLanguage(code)
    setAcctAnchor(null)
  }

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundImage: `linear-gradient(120deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 60%, ${theme.palette.success.main} 100%)`,
        borderBottom: `1px solid ${alpha('#000', 0.12)}`,
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ gap: 1, py: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mr: 2 }}>
            <Avatar variant="rounded" sx={{ bgcolor: alpha('#fff', 0.18), color: '#fff', width: 40, height: 40 }}>
              <AgricultureIcon />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 800 }} noWrap>
              {t('app.name')}
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, gap: 0.5 }}>
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end style={{ textDecoration: 'none' }}>
                {({ isActive }) => (
                  <Button
                    startIcon={item.icon}
                    sx={{
                      color: '#fff',
                      px: 1.75,
                      borderRadius: 2,
                      opacity: isActive ? 1 : 0.85,
                      bgcolor: isActive ? alpha('#fff', 0.2) : 'transparent',
                      '&:hover': { bgcolor: alpha('#fff', 0.28) },
                    }}
                  >
                    {t(item.labelKey)}
                  </Button>
                )}
              </NavLink>
            ))}
          </Box>

          <Box sx={{ flexGrow: { xs: 1, md: 0 } }} />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Button
              onClick={openNew}
              startIcon={<AddIcon />}
              variant="contained"
              color="secondary"
              sx={{ borderRadius: 5, color: '#1b1b1b', fontWeight: 700 }}
            >
              {t('common.new')}
            </Button>
            <Menu anchorEl={newAnchor} open={Boolean(newAnchor)} onClose={() => setNewAnchor(null)}>
              <MenuItem onClick={() => handleNew('farm')}>
                <ListItemIcon><AgricultureIcon fontSize="small" /></ListItemIcon>
                <ListItemText>{t('actions.addFarm')}</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleNew('crop')}>
                <ListItemIcon><GrassIcon fontSize="small" /></ListItemIcon>
                <ListItemText>{t('actions.addCrop')}</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleNew('activity')}>
                <ListItemIcon><EventNoteIcon fontSize="small" /></ListItemIcon>
                <ListItemText>{t('actions.addActivity')}</ListItemText>
              </MenuItem>
            </Menu>

            <Tooltip title={t('notifications.title')}>
              <IconButton onClick={(e) => setBellAnchor(e.currentTarget)} sx={{ color: '#fff' }}>
                <Badge badgeContent={notifications.length} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            <Menu anchorEl={bellAnchor} open={Boolean(bellAnchor)} onClose={() => setBellAnchor(null)}>
              <Typography variant="subtitle2" sx={{ px: 2, py: 1, fontWeight: 700 }}>
                {t('notifications.title')}
              </Typography>
              <Divider />
              {notifications.length === 0 ? (
                <MenuItem disabled sx={{ minWidth: 240 }}>
                  <ListItemText>{t('notifications.empty')}</ListItemText>
                </MenuItem>
              ) : (
                notifications.slice(0, 8).map((n) => (
                  <MenuItem key={n.id} onClick={() => { setBellAnchor(null); navigate('/') }} sx={{ minWidth: 240, whiteSpace: 'normal' }}>
                    <ListItemText primaryTypographyProps={{ variant: 'body2' }}>{n.text}</ListItemText>
                  </MenuItem>
                ))
              )}
            </Menu>

            <Tooltip title={activeLang.native}>
              <IconButton onClick={(e) => setAcctAnchor(e.currentTarget)} sx={{ color: '#fff' }}>
                <AccountCircleIcon />
              </IconButton>
            </Tooltip>
            <Menu anchorEl={acctAnchor} open={Boolean(acctAnchor)} onClose={() => setAcctAnchor(null)}>
              <Typography variant="caption" sx={{ px: 2, py: 0.5, display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                <TranslateIcon fontSize="inherit" /> {t('common.language')}
              </Typography>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <MenuItem key={lang.code} selected={lang.code === activeLang.code} onClick={() => chooseLanguage(lang.code)} sx={{ minWidth: 200 }}>
                  <ListItemText primary={lang.native} secondary={lang.label} />
                  {lang.code === activeLang.code && <CheckIcon fontSize="small" color="primary" />}
                </MenuItem>
              ))}
              <Divider />
              <MenuItem onClick={() => { toggleMode(); setAcctAnchor(null) }}>
                <ListItemIcon>{mode === 'light' ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}</ListItemIcon>
                <ListItemText>{mode === 'light' ? t('common.darkMode') : t('common.lightMode')}</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  )
}

export default AppShell
