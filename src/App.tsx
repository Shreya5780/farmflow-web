import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Box } from '@mui/material'
import AppShell from './components/AppShell'
import HomePage from './pages/HomePage'
import PlannerPage from './pages/PlannerPage'
import WeatherPage from './pages/WeatherPage'
import ComingSoonPage from './pages/ComingSoonPage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  return (
    <BrowserRouter>
      <AppShell />
      <Box
        component="main"
        sx={{ minHeight: 'calc(100vh - 80px)', bgcolor: 'background.default', color: 'text.primary' }}
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/planner" element={<PlannerPage />} />
          <Route path="/crops" element={<ComingSoonPage titleKey="nav.crops" />} />
          <Route path="/weather" element={<WeatherPage />} />
          <Route path="/reports" element={<ComingSoonPage titleKey="nav.reports" />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Box>
    </BrowserRouter>
  )
}

export default App
