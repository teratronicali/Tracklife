// Recreacion aproximada del logo oficial (icono negro + flecha ascendente en
// degradado navy->azul + destello) mientras se integra el archivo PNG/SVG real.
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <div
      className="rounded-xl flex items-center justify-center shrink-0"
      style={{ width: size, height: size, background: '#0a0c10' }}
    >
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none">
        <defs>
          <linearGradient id="tl-arrow-grad" x1="2" y1="20" x2="22" y2="4" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#16337a" />
            <stop offset="100%" stopColor="#5b8dff" />
          </linearGradient>
        </defs>
        <path
          d="M3 17l5-5 3.5 3.5L18.5 8.5"
          stroke="url(#tl-arrow-grad)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M13.5 7h6.5v6.5"
          stroke="url(#tl-arrow-grad)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M19.4 2.6l.55 1.4 1.4.55-1.4.55-.55 1.4-.55-1.4-1.4-.55 1.4-.55z" fill="#5eead4" />
      </svg>
    </div>
  )
}

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={className}>
      Track<span style={{ color: 'var(--tl-blue)' }}>Life</span>
    </span>
  )
}
