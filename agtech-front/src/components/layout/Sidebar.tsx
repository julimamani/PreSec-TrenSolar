import { NavLink } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import {
  ChartNoAxesCombined,
  FileText,
  HelpCircle,
  LayoutDashboard,
  ScanLine,
  Settings2,
  Sparkles,
} from 'lucide-react'
import { API_RUNTIME } from '../../api/analysisApi'
import { cn } from '../../lib/format'
import { Logo } from '../brand/Logo'
import { Badge } from '../ui/Badge'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Panel', icon: LayoutDashboard },
  { to: '/analizar', label: 'Analizar muestra', icon: ScanLine },
  { to: '/mercado', label: 'Mercado', icon: ChartNoAxesCombined },
  { to: '/informes', label: 'Informes', icon: FileText },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <aside className={cn('sidebar', open && 'is-open')}>
      <div className="sidebar__head">
        <NavLink to="/dashboard" className="sidebar__brand" onClick={onClose}>
          <Logo />
        </NavLink>
        <button
          type="button"
          className="icon-btn sidebar__close"
          aria-label="Cerrar menú"
          onClick={onClose}
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>

      <div className="sidebar__section">
        <span className="sidebar__label">Workspace</span>
        <nav className="sidebar__nav" aria-label="Navegación principal">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                cn('nav-item', isActive && 'is-active')
              }
            >
              <item.icon size={17} strokeWidth={1.8} aria-hidden="true" />
              <span>{item.label}</span>
              {item.to === '/analizar' && <span className="nav-item__badge">IA</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="sidebar__section sidebar__section--system">
        <span className="sidebar__label">Sistema</span>
        <div className="system-card">
          <div className="system-card__head">
            <span className="system-card__title">
              <Sparkles size={14} aria-hidden="true" />
              Pipeline activo
            </span>
            <Badge tone={API_RUNTIME.mock ? 'warning' : 'success'} dot>
              {API_RUNTIME.mock ? 'demo' : 'live'}
            </Badge>
          </div>
          <div className="system-row">
            <span>Motor de visión</span>
            <span className="system-row__value">
              <span className="status-dot status-dot--ok" />
              FastAPI
            </span>
          </div>
          <div className="system-row">
            <span>Persistencia</span>
            <span className="system-row__value">
              <span className="status-dot status-dot--ok" />
              Spring Boot
            </span>
          </div>
          <div className="system-card__meter" aria-hidden="true">
            <span style={{ width: '72%' }} />
          </div>
          <span className="system-card__hint">
            {API_RUNTIME.mock
              ? 'Inferencia simulada · listo para conectar'
              : 'Servicios conectados en producción'}
          </span>
        </div>
      </div>

      <div className="sidebar__spacer" />

      <div className="sidebar__links">
        <a href="#ayuda" className="sidebar__link" onClick={(event) => event.preventDefault()}>
          <HelpCircle size={16} aria-hidden="true" />
          Centro de ayuda
        </a>
        <a href="#config" className="sidebar__link" onClick={(event) => event.preventDefault()}>
          <Settings2 size={16} aria-hidden="true" />
          Configuración
        </a>
      </div>

      <div className="sidebar__user">
        <span className="avatar avatar--sm">AG</span>
        <span className="sidebar__user-copy">
          <strong>Agro Demo</strong>
          <small>Plan Hackathon</small>
        </span>
        <span className="sidebar__user-dot" aria-label="Sesión activa" />
      </div>
    </aside>
  )
}
