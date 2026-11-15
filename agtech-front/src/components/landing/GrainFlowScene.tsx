/**
 * GrainFlowScene.tsx
 *
 * Escena isométrica del flujo del grano, desde el camión hasta el empaquetado.
 * del dashboard de trazabilidad. Se puede interactuar con la escena para ver cada estación y su información.
 */

import { useState } from 'react'
import type { MouseEvent } from 'react'
import { Boxes, Cpu, ScanLine, Truck } from 'lucide-react'
import { cn } from '../../lib/format'

const STATIONS = [
  {
    id: 'recepcion',
    number: '01',
    title: 'Recepción',
    description: 'El camión descarga el lote y se registra la trazabilidad por patente y variedad.',
    metric: '18,4 t',
    icon: Truck,
    left: '17%',
    top: '59%',
  },
  {
    id: 'muestreo',
    number: '02',
    title: 'Muestreo',
    description: 'Una muestra representativa se envía a la estación de visión artificial.',
    metric: '340 g',
    icon: ScanLine,
    left: '39%',
    top: '48%',
  },
  {
    id: 'analisis',
    number: '03',
    title: 'Análisis IA',
    description: 'El modelo detecta defectos, estima exportable y calcula la prima de calidad.',
    metric: '96,8% conf.',
    icon: Cpu,
    left: '57%',
    top: '38%',
  },
  {
    id: 'embalaje',
    number: '04',
    title: 'Embalaje',
    description: 'El grano certificado se fracciona y etiqueta con su informe de calidad.',
    metric: 'Grado A',
    icon: Boxes,
    left: '80%',
    top: '54%',
  },
]

const splineSceneUrl = import.meta.env.VITE_SPLINE_SCENE_URL as string | undefined

export function GrainFlowScene({ className }: { className?: string }) {
  const [activeStation, setActiveStation] = useState(STATIONS[2])
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - bounds.left) / bounds.width - 0.5
    const y = (event.clientY - bounds.top) / bounds.height - 0.5
    setTilt({ x: y * -5, y: x * 6 })
  }

  const active = activeStation

  return (
    <div
      className={cn('iso-scene', className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
    >
      <div className="iso-scene__hud">
        <span className="iso-scene__eyebrow">
          <span className="status-dot status-dot--ok" /> Flujo del grano · 01 → 04
        </span>
        <span className="iso-scene__badge">
          {splineSceneUrl ? 'Spline · 3D interactivo' : 'Spline-ready · escena demo'}
        </span>
      </div>

      {splineSceneUrl ? (
        <iframe
          className="spline-frame"
          src={splineSceneUrl}
          title="Escena isométrica 3D del flujo del grano, desde el camión hasta el empaquetado"
          loading="lazy"
          allow="fullscreen"
        />
      ) : (
        <div
          className="iso-scene__tilt"
          style={{ transform: `perspective(1300px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
        >
          <svg
            viewBox="0 0 720 520"
            className="iso-svg"
            role="img"
            aria-label="Escena isométrica del flujo del grano: camión, muestreo, análisis con inteligencia artificial y embalaje"
          >
            <defs>
              <linearGradient id="isoPlatform" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#122019" />
                <stop offset="100%" stopColor="#0a120e" />
              </linearGradient>
              <linearGradient id="isoEdge" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1b2c24" />
                <stop offset="100%" stopColor="#0b1510" />
              </linearGradient>
              <linearGradient id="isoMetal" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#2b4036" />
                <stop offset="58%" stopColor="#17261f" />
                <stop offset="100%" stopColor="#0d1813" />
              </linearGradient>
              <linearGradient id="isoMetalSide" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#15231d" />
                <stop offset="100%" stopColor="#0b1510" />
              </linearGradient>
              <linearGradient id="isoGrain" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e7c875" />
                <stop offset="100%" stopColor="#9a7425" />
              </linearGradient>
              <linearGradient id="isoBelt" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#20332a" />
                <stop offset="100%" stopColor="#121f19" />
              </linearGradient>
              <radialGradient id="isoShadow">
                <stop offset="0%" stopColor="#000" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#000" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="isoGlow">
                <stop offset="0%" stopColor="#9ff06a" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#9ff06a" stopOpacity="0" />
              </radialGradient>
              <filter id="isoSoftGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="isoShadowBlur" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="9" />
              </filter>
              <marker id="isoArrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#9ff06a" fillOpacity="0.55" />
              </marker>
            </defs>

            <ellipse cx="360" cy="430" rx="300" ry="52" fill="url(#isoShadow)" />
            <ellipse cx="500" cy="350" rx="150" ry="120" fill="url(#isoGlow)" />

            <g className="iso-platform">
              <polygon points="70,315 360,160 650,315 360,470" fill="url(#isoPlatform)" stroke="#273c31" strokeWidth="1.2" />
              <polygon points="70,315 360,470 360,488 70,333" fill="url(#isoEdge)" />
              <polygon points="650,315 360,470 360,488 650,333" fill="#0a130f" />
              <path d="M130 315 L360 190 L590 315 M180 315 L360 220 L540 315 M230 315 L360 250 L490 315" stroke="#1a2b23" strokeWidth="1" fill="none" />
              <path d="M360 190 L130 315 M360 220 L180 315 M360 250 L230 315 M360 190 L590 315 M360 220 L540 315 M360 250 L490 315" stroke="#15241d" strokeWidth="0.8" fill="none" />
              <path d="M125 340 C 220 398, 480 404, 615 320" stroke="#4c7c48" strokeWidth="1.4" strokeDasharray="4 7" fill="none" markerEnd="url(#isoArrow)" opacity="0.7" />
              <path d="M125 340 C 220 398, 480 404, 615 320" stroke="#9ff06a" strokeWidth="1.2" strokeDasharray="1 14" fill="none" opacity="0.85" className="iso-flow-dash" />
            </g>

            {/* Truck */}
            <g className={cn('iso-part', activeStation.id === 'recepcion' && 'is-active')}>
              <ellipse cx="175" cy="326" rx="95" ry="20" fill="#000" opacity="0.42" filter="url(#isoShadowBlur)" />
              <g>
                <polygon points="78,272 143,241 208,272 143,303" fill="#1b2c24" stroke="#365646" strokeWidth="1" />
                <polygon points="78,272 78,308 143,339 143,303" fill="#13221b" stroke="#2b4538" strokeWidth="1" />
                <polygon points="143,303 208,272 208,308 143,339" fill="#0e1a15" stroke="#2b4538" strokeWidth="1" />
                <polygon points="88,274 143,248 196,274 143,300" fill="#3c2f16" stroke="#5e4a20" strokeWidth="0.8" />
                <path d="M93 276 Q 143 252 192 276 Q 143 291 93 276Z" fill="url(#isoGrain)" />
                <path d="M100 276 Q 143 256 185 276" stroke="#f3d98b" strokeWidth="1" fill="none" opacity="0.55" />
                <circle cx="116" cy="274" r="1.4" fill="#f6df9b" />
                <circle cx="132" cy="271" r="1.2" fill="#f6df9b" />
                <circle cx="152" cy="272" r="1.4" fill="#f6df9b" />
                <circle cx="171" cy="275" r="1.1" fill="#f6df9b" />

                <polygon points="208,272 240,257 271,272 240,288" fill="#253b30" stroke="#3e5c4b" strokeWidth="0.9" />
                <polygon points="208,272 208,298 240,314 240,288" fill="#16261e" stroke="#365646" strokeWidth="0.9" />
                <polygon points="240,288 271,272 271,298 240,314" fill="#101d17" stroke="#365646" strokeWidth="0.9" />
                <polygon points="217,275 238,265 258,275 237,285" fill="#1d3a2d" stroke="#35604c" strokeWidth="0.8" />
                <polygon points="231,276 238,272 247,277 240,281" fill="#9ff06a" fillOpacity="0.55" />
                <rect x="257" y="279" width="7" height="5" rx="1.4" fill="#f4c95d" />

                <ellipse cx="103" cy="311" rx="13" ry="7" fill="#060b09" stroke="#2e4a3c" strokeWidth="1.2" />
                <ellipse cx="103" cy="311" rx="5" ry="2.8" fill="#1b2c24" />
                <ellipse cx="192" cy="301" rx="13" ry="7" fill="#060b09" stroke="#2e4a3c" strokeWidth="1.2" />
                <ellipse cx="192" cy="301" rx="5" ry="2.8" fill="#1b2c24" />
                <ellipse cx="253" cy="296" rx="11" ry="6" fill="#060b09" stroke="#2e4a3c" strokeWidth="1.2" />
                <ellipse cx="253" cy="296" rx="4" ry="2.2" fill="#1b2c24" />
                <path d="M174 277 L177 307" stroke="#9ff06a" strokeWidth="1" opacity="0.35" />
              </g>
            </g>

            {/* Sampling station */}
            <g className={cn('iso-part', activeStation.id === 'muestreo' && 'is-active')}>
              <ellipse cx="305" cy="373" rx="44" ry="12" fill="#000" opacity="0.32" />
              <polygon points="278,334 305,321 332,334 305,347" fill="#1c2e25" stroke="#3a5948" strokeWidth="1" />
              <polygon points="278,334 278,354 305,367 305,347" fill="#13221b" stroke="#2d4839" strokeWidth="1" />
              <polygon points="305,347 332,334 332,354 305,367" fill="#0e1a15" stroke="#2d4839" strokeWidth="1" />
              <path d="M305 347 L305 321 M291 341 L291 329" stroke="#9ff06a" strokeWidth="1.1" strokeOpacity="0.5" />
              <circle cx="305" cy="333" r="9" fill="#9ff06a" fillOpacity="0.12" stroke="#9ff06a" strokeOpacity="0.55" />
              <circle cx="305" cy="333" r="3" fill="#9ff06a" />
              <path d="M305 333 L305 353" stroke="#9ff06a" strokeWidth="0.8" strokeOpacity="0.45" strokeDasharray="2 3" />
            </g>

            {/* Silo + AI analyzer */}
            <g className={cn('iso-part', activeStation.id === 'analisis' && 'is-active')}>
              <ellipse cx="399" cy="345" rx="88" ry="22" fill="#000" opacity="0.42" filter="url(#isoShadowBlur)" />
              <path d="M348 303 L358 342 L388 342 L398 303" fill="#0c1712" stroke="#2d493a" strokeWidth="1" />
              <path d="M348 303 L358 342 M398 303 L388 342" stroke="#3b5a49" strokeWidth="1.2" />
              <path d="M385 208 L385 303 A51 17 0 0 1 436 303 L436 208" fill="url(#isoMetal)" stroke="#3b5a49" strokeWidth="1.2" />
              <ellipse cx="410.5" cy="208" rx="25.5" ry="9" fill="#2c4437" />
              <path d="M385 208 A25.5 9 0 0 0 436 208" fill="none" stroke="#4c705b" strokeWidth="1" />
              <ellipse cx="410.5" cy="208" rx="18" ry="6" fill="#12221a" stroke="#42624f" strokeWidth="0.8" />
              <path d="M385 240 A25.5 9 0 0 0 436 240" fill="none" stroke="#527a63" strokeWidth="1.2" strokeOpacity="0.6" />
              <path d="M385 272 A25.5 9 0 0 0 436 272" fill="none" stroke="#527a63" strokeWidth="1.2" strokeOpacity="0.45" />
              <path d="M410.5 205 L410.5 160" stroke="#9ff06a" strokeWidth="1.6" strokeOpacity="0.7" />
              <circle cx="410.5" cy="157" r="3.2" fill="#9ff06a" filter="url(#isoSoftGlow)" />
              <path d="M400 211 L400 300 M421 211 L421 300" stroke="#2c4538" strokeWidth="0.7" strokeOpacity="0.5" />
              <path d="M399 230 L399 300 M404 230 L404 300 M409 230 L409 300 M414 230 L414 300 M419 230 L419 300" stroke="#6b8f79" strokeWidth="0.7" strokeOpacity="0.4" />
              <circle cx="410.5" cy="188" r="28" fill="#9ff06a" fillOpacity="0.06" className="iso-pulse" />
              <rect x="440" y="246" width="22" height="34" rx="4" fill="#12221a" stroke="#3f6250" strokeWidth="1" />
              <rect x="444" y="251" width="14" height="8" rx="1.6" fill="#9ff06a" fillOpacity="0.6" />
              <circle cx="451" cy="269" r="2" fill="#9ff06a" />
            </g>

            {/* Conveyor */}
            <g>
              <path d="M438 327 L552 275 L584 288 L469 340 Z" fill="url(#isoBelt)" stroke="#385646" strokeWidth="1" />
              <path d="M447 325 L557 277 L574 285 L464 333 Z" fill="#0a130f" stroke="#2d4839" strokeWidth="0.8" />
              <path d="M461 331 L461 356 M543 294 L543 319 M566 284 L566 309" stroke="#2d4839" strokeWidth="2" />
              <path d="M447 325 L464 333" stroke="#9ff06a" strokeWidth="1.2" strokeOpacity="0.6" />
              <circle cx="482" cy="321" r="2.4" fill="#d8b561" />
              <circle cx="515" cy="306" r="2.4" fill="#d8b561" />
              <circle cx="548" cy="291" r="2.4" fill="#d8b561" />
              {[0, 1, 2, 3].map((index) => (
                <circle key={index} r="2.6" fill="#e7c875">
                  <animateMotion
                    dur="3.8s"
                    begin={`${index * 0.85}s`}
                    repeatCount="indefinite"
                    path="M452 332 L568 283"
                  />
                </circle>
              ))}
            </g>

            {/* Packaging */}
            <g className={cn('iso-part', activeStation.id === 'embalaje' && 'is-active')}>
              <ellipse cx="597" cy="371" rx="78" ry="20" fill="#000" opacity="0.4" filter="url(#isoShadowBlur)" />
              <g>
                <polygon points="560,292 599,273 638,292 599,311" fill="#1b2d24" stroke="#3c5c4a" strokeWidth="1" />
                <polygon points="560,292 560,326 599,345 599,311" fill="#12211a" stroke="#355342" strokeWidth="1" />
                <polygon points="599,311 638,292 638,326 599,345" fill="#0e1a15" stroke="#355342" strokeWidth="1" />
                <polygon points="571,296 599,282 627,296 599,310" fill="#294034" />
                <rect x="588" y="319" width="22" height="3" rx="1.5" fill="#9ff06a" fillOpacity="0.65" />
                <rect x="588" y="326" width="15" height="2" rx="1" fill="#9ff06a" fillOpacity="0.35" />
              </g>
              <g>
                <polygon points="574,347 596,336 618,347 596,358" fill="#2d4638" stroke="#52755f" strokeWidth="0.8" />
                <polygon points="574,347 574,361 596,372 596,358" fill="#1c3026" stroke="#456753" strokeWidth="0.8" />
                <polygon points="596,358 618,347 618,361 596,372" fill="#14231c" stroke="#456753" strokeWidth="0.8" />
                <path d="M580 350 L596 342 L612 350" stroke="#9ff06a" strokeWidth="1" strokeOpacity="0.55" fill="none" />
                <polygon points="603,354 625,343 647,354 625,365" fill="#2d4638" stroke="#52755f" strokeWidth="0.8" />
                <polygon points="603,354 603,368 625,379 625,365" fill="#1c3026" stroke="#456753" strokeWidth="0.8" />
                <polygon points="625,365 647,354 647,368 625,379" fill="#14231c" stroke="#456753" strokeWidth="0.8" />
                <path d="M609 357 L625 349 L641 357" stroke="#9ff06a" strokeWidth="1" strokeOpacity="0.55" fill="none" />
                <polygon points="578,369 600,358 622,369 600,380" fill="#2d4638" stroke="#52755f" strokeWidth="0.8" />
                <polygon points="578,369 578,383 600,394 600,380" fill="#1c3026" stroke="#456753" strokeWidth="0.8" />
                <polygon points="600,380 622,369 622,383 600,394" fill="#14231c" stroke="#456753" strokeWidth="0.8" />
                <path d="M584 372 L600 364 L616 372" stroke="#9ff06a" strokeWidth="1" strokeOpacity="0.55" fill="none" />
              </g>
              <circle cx="628" cy="256" r="15" fill="none" stroke="#9ff06a" strokeOpacity="0.3" strokeDasharray="2 3" />
              <path d="M620 256 L626 262 L637 250" stroke="#9ff06a" strokeWidth="1.6" fill="none" strokeLinecap="round" />
            </g>

            <g fill="#2b4437" opacity="0.75">
              <path d="M104 244 L112 240 L120 244 L112 248Z" />
              <path d="M112 248 L112 260" stroke="#2b4437" strokeWidth="1.5" />
              <path d="M640 252 L648 248 L656 252 L648 256Z" />
              <path d="M648 256 L648 269" stroke="#2b4437" strokeWidth="1.5" />
            </g>
          </svg>
        </div>
      )}

      {!splineSceneUrl &&
        STATIONS.map((station) => (
          <button
            key={station.id}
            type="button"
            className={cn(
              'iso-station',
              station.id === activeStation.id && 'is-active',
            )}
            style={{ left: station.left, top: station.top }}
            aria-label={`Estación ${station.number}: ${station.title}`}
            aria-pressed={station.id === activeStation.id}
            onMouseEnter={() => setActiveStation(station)}
            onFocus={() => setActiveStation(station)}
            onClick={() => setActiveStation(station)}
          >
            <span className="iso-station__ring" aria-hidden="true" />
            <span className="iso-station__dot">{station.number}</span>
            <span className="iso-station__label">{station.title}</span>
          </button>
        ))}

      <div className="iso-detail" aria-live="polite">
        <span className="iso-detail__icon">
          <active.icon size={17} aria-hidden="true" />
        </span>
        <span className="iso-detail__copy">
          <span className="iso-detail__eyebrow">
            Estación {active.number} · {active.title}
          </span>
          <span className="iso-detail__text">{active.description}</span>
        </span>
        <span className="iso-detail__metric mono">{active.metric}</span>
      </div>
    </div>
  )
}
