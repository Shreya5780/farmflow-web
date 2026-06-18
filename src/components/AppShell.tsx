import { useState, type MouseEvent } from 'react'
import { NavLink } from 'react-router-dom'
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
  useTheme,
  alpha,
} from '@mui/material'
import {
  Agriculture as AgricultureIcon,
  Translate as TranslateIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Check as CheckIcon,
} from '@mui/icons-material'
import { useColorMode } from '../context/ColorModeContext'
import { SUPPORTED_LANGUAGES } from '../i18n'

const navItems = [
  { to: '/', labelKey: 'nav.dashboard' },
  { to: '/planner', labelKey: 'nav.planner' },
]

const AppShell = () => {
  const { t, i18n } = useTranslation()
  const { mode, toggleMode } = useColorMode()
  const theme = useTheme()
  const [langAnchor, setLangAnchor] = useState<null | HTMLElement>(null)

  const openLangMenu = (event: MouseEvent<HTMLElement>) => setLangAnchor(event.currentTarget)
  const closeLangMenu = () => setLangAnchor(null)
  const chooseLanguage = (code: string) => {
    i18n.changeLanguage(code)
    closeLangMenu()
  }

  const activeLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === i18n.resolvedLanguage) ?? SUPPORTED_LANGUAGES[0]

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundImage: `linear-gradient(120deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 55%, ${theme.palette.success.main} 100%)`,
        borderBottom: `1px solid ${alpha('#000', 0.12)}`,
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ gap: 2, flexWrap: 'wrap', py: 1 }}>
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              variant="rounded"
              sx={{ bgcolor: alpha('#fff', 0.18), color: '#fff', width: 44, height: 44 }}
            >
              <AgricultureIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.1 }} noWrap>
                {t('app.name')}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: alpha('#fff', 0.85), display: { xs: 'none', sm: 'block' } }}
              >
                {t('app.tagline')}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end style={{ textDecoration: 'none' }}>
                {({ isActive }) => (
                  <Button
                    color="inherit"
                    sx={{
                      color: '#fff',
                      px: 2,
                      borderRadius: 2,
                      bgcolor: isActive ? alpha('#fff', 0.2) : 'transparent',
                      '&:hover': { bgcolor: alpha('#fff', 0.28) },
                    }}
                  >
                    {t(item.labelKey)}
                  </Button>
                )}
              </NavLink>
            ))}

            <Tooltip title={t('common.language')}>
              <Button
                onClick={openLangMenu}
                startIcon={<TranslateIcon />}
                sx={{ color: '#fff', ml: 0.5, borderRadius: 2, '&:hover': { bgcolor: alpha('#fff', 0.18) } }}
              >
                {activeLang.native}
              </Button>
            </Tooltip>
            <Menu anchorEl={langAnchor} open={Boolean(langAnchor)} onClose={closeLangMenu}>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <MenuItem
                  key={lang.code}
                  selected={lang.code === activeLang.code}
                  onClick={() => chooseLanguage(lang.code)}
                  sx={{ gap: 1.5, minWidth: 180 }}
                >
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {lang.native}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {lang.label}
                    </Typography>
                  </Box>
                  {lang.code === activeLang.code && <CheckIcon fontSize="small" color="primary" />}
                </MenuItem>
              ))}
            </Menu>

            <Tooltip title={mode === 'light' ? t('common.darkMode') : t('common.lightMode')}>
              <IconButton onClick={toggleMode} sx={{ color: '#fff' }}>
                {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  )
}

export default AppShell
