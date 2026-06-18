import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n'
import './index.css'
import App from './App.tsx'
import { ColorModeProvider } from './context/ColorModeContext'
import { QuickAddProvider } from './context/QuickAddContext'
import { AppDataProvider } from './context/AppDataContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ColorModeProvider>
      <AppDataProvider>
        <QuickAddProvider>
          <App />
        </QuickAddProvider>
      </AppDataProvider>
    </ColorModeProvider>
  </StrictMode>,
)
