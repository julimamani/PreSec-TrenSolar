import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  CalendarDays,
  Menu,
  Search,
  Sparkles,
} from 'lucide-react'
import { GRAINS } from '../../data/marketData'
import { cn, formatDate } from '../../lib/format'
import { Badge } from '../ui/Badge'

const ROUTE_META: Record<string, { section: string; title: string }> = {
  '/dashboard': { section: 'Panel', title: 'Mercado de granos' },
  '/analizar': { section: 'Laboratorio', title: 'Analizar muestra' },
  '/mercado': { section: 'Mercado', title: 'Pizarras y posiciones' },
  '/informes': { section: 'Datos', title: 'Informes' },
}

interface TopbarProps {
  onOpenMenu: () => void
}

export function Topbar({ onOpenMenu }: TopbarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const meta = ROUTE_META[location.pathname] ?? { section: 'Panel', title: 'PuroGrano' }
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const today = new Date()

  const searchResults = useMemo(() => {
    const query = search.trim().toLowerCase()
    const grainResults = Object.values(GRAINS)
      .filter((grain) => grain.name.toLowerCase().includes(query))
      .slice(0, 4)
      .map((grain) => ({
        key: `grain-${grain.id}`,
        label: grain.name,
        hint: 'Ver pizarra',
        to: '/mercado',
        color: grain.color,
      }))

    const pageResults = [
      {
        key: 'page-dashboard',
        label: 'Panel de mercado',
        hint: 'Dashboard',
        to: '/dashboard',
        color: 'var(--accent)',
      },
      {
        key: 'page-analyze',
        label: 'Analizar muestra',
        hint: 'Visión IA',
        to: '/analizar',
        color: 'var(--info)',
      },
      {
        key: 'page-reports',
        label: 'Informes',
        hint: 'Historial',
        to: '/informes',
        color: 'var(--warning)',
      },
    ].filter((item) => item.label.toLowerCase().includes(query))

    if (!query) return [...pageResults.slice(0, 2), ...grainResults.slice(0, 2)]
    return [...grainResults, ...pageResults].slice(0, 6)
  }, [search])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        inputRef.current?.focus()
        setSearchOpen(true)
      }
      if (event.key === 'Escape') {
        setSearchOpen(false)
        setNotificationsOpen(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const goToResult = (to: string) => {
    navigate(to)
    setSearch('')
    setSearchOpen(false)
    inputRef.current?.blur()
  }

  return (
    <header className="topbar">
      <div className="topbar__left">
        <button
          type="button"
          className="icon-btn topbar__menu"
          aria-label="Abrir menú"
          onClick={onOpenMenu}
        >
          <Menu size={19} />
        </button>
        <div className="topbar__titles">
          <div className="topbar__breadcrumb">
            <Link to="/dashboard">PuroGrano</Link>
            <span>/</span>
            <span>{meta.section}</span>
          </div>
          <h1>{meta.title}</h1>
        </div>
      </div>

      <div className="topbar__right">
        <div className="topbar__search-wrap">
          <Search size={15} className="topbar__search-icon" aria-hidden="true" />
          <input
            ref={inputRef}
            className="topbar__search"
            type="search"
            placeholder="Buscar grano o sección..."
            aria-label="Buscar grano o sección"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => window.setTimeout(() => setSearchOpen(false), 140)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && searchResults[0]) {
                goToResult(searchResults[0].to)
              }
            }}
          />
          <kbd className="topbar__kbd">⌘K</kbd>
          {searchOpen && (
            <div className="search-popover">
              <span className="search-popover__label">
                {search ? 'Resultados' : 'Accesos rápidos'}
              </span>
              {searchResults.length === 0 ? (
                <p className="search-popover__empty">Sin resultados para “{search}”.</p>
              ) : (
                searchResults.map((result) => (
                  <button
                    key={result.key ?? result.label}
                    type="button"
                    className="search-result"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => goToResult(result.to)}
                  >
                    <span
                      className="search-result__dot"
                      style={{ backgroundColor: result.color }}
                    />
                    <span>{result.label}</span>
                    <span className="search-result__hint">{result.hint}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <span className="topbar__date">
          <CalendarDays size={14} aria-hidden="true" />
          {formatDate(today)}
        </span>

        <div className="topbar__popover-wrap">
          <button
            type="button"
            className={cn('icon-btn', notificationsOpen && 'is-active')}
            aria-label="Notificaciones"
            aria-expanded={notificationsOpen}
            onClick={() => setNotificationsOpen((open) => !open)}
          >
            <Bell size={17} />
            <span className="notif-dot" />
          </button>
          {notificationsOpen && (
            <div className="notif-popover">
              <div className="notif-popover__head">
                <span>Alertas de mercado</span>
                <Badge tone="accent">3 nuevas</Badge>
              </div>
              <div className="notif-item">
                <span className="notif-item__icon notif-item__icon--up">▲</span>
                <span>
                  <strong>Soja Rosario +1,82%</strong>
                  <small>Pizarra en US$ 318,5/t · hace 4 min</small>
                </span>
              </div>
              <div className="notif-item">
                <span className="notif-item__icon notif-item__icon--up">▲</span>
                <span>
                  <strong>Poroto lidera el volumen</strong>
                  <small>+2,13% intradiario · BCR</small>
                </span>
              </div>
              <div className="notif-item">
                <span className="notif-item__icon">
                  <Sparkles size={12} />
                </span>
                <span>
                  <strong>Informe de calidad listo</strong>
                  <small>Lote PG-2481 · Soja · Grado A</small>
                </span>
              </div>
            </div>
          )}
        </div>

        <span className="topbar__divider" aria-hidden="true" />

        <div className="topbar__user">
          <span className="avatar">AG</span>
          <span className="topbar__user-copy">
            <strong>Agro Demo</strong>
            <small>Cuenta demo</small>
          </span>
        </div>
      </div>
    </header>
  )
}
