import { NavLink } from 'react-router-dom'
import { AppBar, Toolbar, Typography, Box, Button, Container } from '@mui/material'

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/planner', label: 'Crop Planner' },
]

const AppShell = () => {
  return (
    <AppBar position="static" color="primary" elevation={2}>
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }} noWrap>
              FarmPlan
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              Seasonal crop planning with weather risk
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                style={({ isActive }) => ({
                  textDecoration: 'none',
                  color: isActive ? '#fff' : '#f3f3f3',
                })}
              >
                <Button
                  color="inherit"
                  sx={{
                    textTransform: 'none',
                  }}
                >
                  {item.label}
                </Button>
              </NavLink>
            ))}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  )
}

export default AppShell
