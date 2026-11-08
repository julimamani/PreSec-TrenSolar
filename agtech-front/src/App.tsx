import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { LandingPage } from './pages/LandingPage'
import { DashboardPage } from './pages/DashboardPage'
import { AnalyzePage } from './pages/AnalyzePage'
import { MarketPage } from './pages/MarketPage'
import { ReportsPage } from './pages/ReportsPage'
import { buttonClass } from './components/ui/Button'
import { Logo } from './components/brand/Logo'

function NotFoundPage() {
  return (
    <div className="not-found">
      <Logo />
      <span className="eyebrow">Error 404</span>
      <h1>Esa ruta no existe.</h1>
      <p>Volvé al panel para seguir analizando muestras y pizarras.</p>
      <Link to="/dashboard" className={buttonClass('primary', 'md')}>
        Ir al dashboard
      </Link>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/analizar" element={<AnalyzePage />} />
          <Route path="/mercado" element={<MarketPage />} />
          <Route path="/informes" element={<ReportsPage />} />
        </Route>
        <Route path="/panel" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
