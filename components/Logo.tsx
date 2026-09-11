import Image from 'next/image'

// Isotipo oficial (public/logo-icon.png), extraido del brand kit real.
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <Image
      src="/logo-icon.png"
      alt="TrackLife"
      width={size}
      height={size}
      className="shrink-0"
      style={{ width: size, height: size }}
      priority
    />
  )
}

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={className}>
      Track<span style={{ color: 'var(--tl-blue)' }}>Life</span>
    </span>
  )
}
