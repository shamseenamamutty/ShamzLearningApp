/** Kidzly brand: the Sprout Rocket mascot (blast off + grow) and the Fredoka wordmark. */

interface MarkProps {
  className?: string;
  title?: string;
}

/** The mascot on its own (transparent background). Same artwork as public/icon.svg. */
export function LogoMark({ className, title }: MarkProps) {
  return (
    <svg viewBox="0 0 200 200" className={className} role={title ? 'img' : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <defs>
        <linearGradient id="kz-body" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#bbf7d0" />
          <stop offset=".55" stopColor="#4ade80" />
          <stop offset="1" stopColor="#22c55e" />
        </linearGradient>
      </defs>
      <g transform="rotate(32 100 108)" strokeLinejoin="round">
        {/* flame */}
        <path d="M80 140q20 52 40 0z" fill="#f59e0b" />
        <path d="M89 140q11 30 22 0z" fill="#fde68a" />
        {/* fins */}
        <path d="M70 112l-24 32 28-6zM130 112l24 32-28-6z" fill="#38bdf8" stroke="#0284c7" strokeWidth="4" />
        {/* body */}
        <path d="M100 46c27 19 37 54 33 94H67c-4-40 6-75 33-94z" fill="url(#kz-body)" stroke="#16a34a" strokeWidth="5" />
        <rect x="70" y="128" width="60" height="10" rx="5" fill="#fb7185" />
        {/* sprout growing from the nose */}
        <path d="M100 48q-1-14 2-26" stroke="#16a34a" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M101 30c-12-14-30-13-37-3 13 9 28 10 37 3z" fill="#86efac" stroke="#16a34a" strokeWidth="4" />
        <path d="M102 24c9-15 28-17 36-8-11 10-27 13-36 8z" fill="#4ade80" stroke="#16a34a" strokeWidth="4" />
        {/* porthole face */}
        <circle cx="100" cy="94" r="23" fill="#fcd34d" stroke="#f59e0b" strokeWidth="5" />
        <ellipse cx="92" cy="90" rx="4.5" ry="5.5" fill="#2d2a4a" />
        <ellipse cx="108" cy="90" rx="4.5" ry="5.5" fill="#2d2a4a" />
        <circle cx="93.5" cy="88" r="1.6" fill="#fff" />
        <circle cx="109.5" cy="88" r="1.6" fill="#fff" />
        <ellipse cx="85" cy="100" rx="4.5" ry="3" fill="#fb7185" opacity=".7" />
        <ellipse cx="115" cy="100" rx="4.5" ry="3" fill="#fb7185" opacity=".7" />
        <path d="M94 99q6 7 12 0z" fill="#2d2a4a" stroke="#2d2a4a" strokeWidth="2.5" />
      </g>
      {/* sparkles */}
      <path d="M34 34l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" fill="#fff" />
      <circle cx="176" cy="96" r="6" fill="#fcd34d" />
      <circle cx="30" cy="150" r="5" fill="#7dd3fc" />
      <circle cx="160" cy="174" r="4" fill="#fff" />
    </svg>
  );
}

const LETTERS: { ch: string; color: string; tilt: number }[] = [
  { ch: 'K', color: '#f43f5e', tilt: -6 },
  { ch: 'i', color: '#f59e0b', tilt: 4 },
  { ch: 'd', color: '#22c55e', tilt: -3 },
  { ch: 'z', color: '#0ea5e9', tilt: 5 },
  { ch: 'l', color: '#8b5cf6', tilt: -4 },
  { ch: 'y', color: '#f43f5e', tilt: 6 },
];

interface LogoProps {
  size?: 'sm' | 'lg';
}

/** Mascot + multicolour wordmark. Phrasing content only, so it can sit inside an h1 or a button. */
export function Logo({ size = 'lg' }: LogoProps) {
  const big = size === 'lg';
  return (
    <span className={`flex flex-col items-center ${big ? 'gap-1' : 'gap-0'}`}>
      <LogoMark className={`${big ? 'h-32 w-32' : 'h-14 w-14'} animate-bob drop-shadow-lg`} />
      <span aria-hidden="true" className={`font-brand font-bold leading-none ${big ? 'mb-2 text-7xl' : 'text-4xl'}`}>
        {LETTERS.map(({ ch, color, tilt }) => (
          <span
            key={ch}
            className="kidzly-letter inline-block"
            style={{ color, transform: `rotate(${tilt}deg)` }}
          >
            {ch}
          </span>
        ))}
      </span>
    </span>
  );
}
