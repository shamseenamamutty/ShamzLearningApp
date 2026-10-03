import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { speak } from '@/engine/audio';
import { ParentPinDialog } from '@/features/auth/ParentPinDialog';
import { useStore } from '@/lib/store';
import { Button } from '@/ui/Button';
import { Logo } from '@/ui/Logo';

/** What kids do in Kidzly — shown as four small tiles under the slogan. */
const TILES = [
  { key: 'listen', icon: '🎧' },
  { key: 'learn', icon: '📚' },
  { key: 'play', icon: '🧩' },
  { key: 'earn', icon: '⭐' },
] as const;

/** Twinkling background stars (decorative). */
const STARS = [
  { top: '7%', start: '10%' },
  { top: '12%', start: '84%' },
  { top: '26%', start: '18%' },
  { top: '30%', start: '78%' },
  { top: '44%', start: '6%' },
];

/** Slogan keywords pick up the wordmark colours (sky, sun, leaf). */
const word = (color: string) => <span className="kidzly-slogan-word" style={{ color }} />;

/**
 * Screen 1 — Launch Pad. Logo, slogan, what kids do here, and one big start button on a green hill.
 * The course (Arabic / Hindi) is chosen later on the "What shall we learn?" screen.
 */
export default function WelcomeScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const signedIn = useStore((s) => s.parentSignedIn && !!s.parent);
  const hasParent = useStore((s) => !!s.parent);
  const hasPin = useStore((s) => !!s.parent?.pinHash);
  const [pinDialog, setPinDialog] = useState<'unlock' | 'create' | null>(null);

  // "Let's go" always checks the parent PIN when one is set; an account without one is asked to create it.
  const start = () => {
    if (hasPin) return setPinDialog('unlock');
    if (signedIn) return setPinDialog('create');
    navigate(hasParent ? '/signin' : '/signup');
  };

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden bg-grape-400">
      <div className="relative flex min-h-full flex-col items-center overflow-hidden bg-gradient-to-b from-[#5b21b6] via-grape-600 to-grape-400 px-6 pt-safe text-white">
        {STARS.map((s) => (
          <span
            key={`${s.top}-${s.start}`}
            aria-hidden="true"
            className="absolute h-1.5 w-1.5 rounded-full bg-white/80 animate-twinkle"
            style={{ top: s.top, insetInlineStart: s.start }}
          />
        ))}

        <div className="relative z-10 mt-[4vh] flex flex-col items-center gap-3 text-center">
          <h1>
            <button type="button" aria-label="Kidzly" onClick={() => speak(t('welcome.greeting'))}>
              <Logo />
            </button>
          </h1>
          <p className="font-brand text-balance text-[1.6rem] font-bold leading-tight drop-shadow-[0_2px_0_rgba(45,42,74,0.25)]">
            <Trans i18nKey="welcome.tagline" components={{ c1: word('#0ea5e9'), c2: word('#f59e0b'), c3: word('#22c55e') }} />
          </p>
        </div>

        <ul className="relative z-10 mt-[3.5vh] grid w-full max-w-sm grid-cols-4 gap-2.5">
          {TILES.map(({ key, icon }) => (
            <li
              key={key}
              className="flex flex-col items-center rounded-3xl bg-white/95 py-2.5 text-ink shadow-[0_4px_0_rgba(45,42,74,0.15)]"
            >
              <span aria-hidden="true" className="text-3xl leading-tight">
                {icon}
              </span>
              <span className="font-brand text-base font-bold">{t(`welcome.tiles.${key}`)}</span>
            </li>
          ))}
        </ul>

        {/* Green hill — the ground the rocket launches from. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-[-15%] bottom-0 h-[30%] rounded-t-[50%] bg-leaf-400 shadow-[inset_0_10px_0_#86efac]"
        />

        <div className="relative z-10 mt-auto flex w-full max-w-sm flex-col items-center gap-2 pb-safe pt-4">
          <Button block variant="sunny" className="text-2xl" onClick={start}>
            {t('welcome.start')} 🚀
          </Button>
          <Button block variant="ghost" className="text-[#14532d]" onClick={() => navigate('/signin')}>
            🔒 {t('common.grownUps')}
          </Button>
        </div>
        <ParentPinDialog mode={pinDialog ?? 'unlock'} open={pinDialog !== null} onClose={() => setPinDialog(null)} />
      </div>
    </div>
  );
}
