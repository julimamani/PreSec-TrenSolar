import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { Logo } from '../brand/Logo'
import { buttonClass } from '../ui/Button'

const LINKS = [
  { label: 'Producto', href: '#producto' },
  { label: 'Análisis', href: '#analisis' },
  { label: 'Mercado', href: '#mercado' },
  { label: 'Cómo funciona', href: '#como-funciona' },
]

export function PublicHeader() {
  return (
    <header className="public-header">
      <div className="container public-header__inner">
        <Link to="/" className="public-header__brand" aria-label="PuroGrano, inicio">
          <Logo />
        </Link>

        <nav className="public-header__nav" aria-label="Navegación del producto">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="public-header__link">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="public-header__actions">
          <Link to="/dashboard" className="public-header__login">
            Ingresar
          </Link>
          <Link to="/analizar" className={buttonClass('primary', 'sm')}>
            Probar ahora
            <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>
    </header>
  )
}
