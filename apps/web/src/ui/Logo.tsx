/** Kidzly brand: "Zee", a cheerful speech-bubble mascot, plus the Fredoka wordmark. */

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
        <linearGradient id="kz-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="1" stopColor="#fbbf24" />
        </linearGradient>
      </defs>
      {/* body: a round speech bubble with a little tail */}
      <path
        d="M100 26c46 0 80 29 80 68s-34 68-80 68c-11 0-21-2-30-5l-32 17 9-30C33 134 20 115 20 94c0-39 34-68 80-68z"
        fill="url(#kz-body)"
        stroke="#f59e0b"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <ellipse cx="66" cy="56" rx="20" ry="10" fill="#fff" opacity=".55" transform="rotate(-20 66 56)" />
      {/* eyes */}
      <ellipse cx="76" cy="90" rx="11" ry="14" fill="#2d2a4a" />
      <ellipse cx="124" cy="90" rx="11" ry="14" fill="#2d2a4a" />
      <circle cx="80" cy="84" r="4.5" fill="#fff" />
      <circle cx="128" cy="84" r="4.5" fill="#fff" />
      {/* cheeks */}
      <ellipse cx="56" cy="112" rx="11" ry="7" fill="#fb7185" opacity=".65" />
      <ellipse cx="144" cy="112" rx="11" ry="7" fill="#fb7185" opacity=".65" />
      {/* happy open mouth with tongue */}
      <path d="M84 110q16 22 32 0z" fill="#2d2a4a" strokeLinejoin="round" stroke="#2d2a4a" strokeWidth="3" />
      <path d="M92 118q8 6 16 0q-8-7-16 0z" fill="#fb7185" />
      {/* sparkles */}
      <path d="M170 20l5 13 13 5-13 5-5 13-5-13-13-5 13-5z" fill="#fff" />
      <circle cx="186" cy="68" r="5" fill="#7dd3fc" />
      <circle cx="16" cy="52" r="6" fill="#86efac" />
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
