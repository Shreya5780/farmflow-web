import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Box } from '@mui/material'
import AppShell from './components/AppShell'
import HomePage from './pages/HomePage'
import PlannerPage from './pages/PlannerPage'
import NotFoundPage from './pages/NotFoundPage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <AppShell />
      <Box component="main" sx={{ minHeight: 'calc(100vh - 80px)', bgcolor: '#f4f6fb', py: 3 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/planner" element={<PlannerPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Box>
    </BrowserRouter>
  )
}

export default App
