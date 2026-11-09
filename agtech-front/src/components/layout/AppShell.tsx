import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { cn } from '../../lib/format'

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setSidebarOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [location.pathname])

  return (
    <div className={cn('app-shell', sidebarOpen && 'is-menu-open')}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <button
        type="button"
        className="sidebar-overlay"
        aria-label="Cerrar menú"
        tabIndex={sidebarOpen ? 0 : -1}
        onClick={() => setSidebarOpen(false)}
      />

      <div className="app-main">
        <Topbar onOpenMenu={() => setSidebarOpen(true)} />
        <main className="app-content">
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>PuroGrano Grain Intelligence · MVP AgTech 2026</span>
          <span>
            Precios de referencia de Matba Rofex y DolarAPI. No constituyen asesoramiento
            financiero.
          </span>
        </footer>
      </div>
    </div>
  )
}
