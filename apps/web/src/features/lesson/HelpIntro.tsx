import { useTranslation } from 'react-i18next';
import { courseIdOf, directionOf, getItem } from '@/content/course';
import { ScriptText } from '@/ui/ScriptText';
import { Button } from '@/ui/Button';
import { Mascot } from '@/ui/Mascot';

/**
 * Help Loop intro (FR-13): friendly, never "failed". Shows the letters we'll practise together.
 * The content scrolls on short screens and the start button stays pinned at the bottom, so it can
 * always be tapped.
 */
export function HelpIntro({ items, mascot, mascotName, onStart }: { items: string[]; mascot: string; mascotName: string; onStart: () => void }) {
  const { t } = useTranslation();
  const dir = items[0] ? directionOf(items[0]) : 'ltr';
  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-sky2-100 to-cream">
      <div className="flex-1 overflow-y-auto px-6 pt-safe">
        <div className="flex min-h-full flex-col items-center justify-around gap-6 py-4">
          <h1 className="text-center text-4xl font-extrabold text-grape-700">{t('help.title')}</h1>
          <Mascot emoji={mascot} size="lg" says={t('help.body', { name: mascotName })} speakLang="en" />
          <div dir={dir} className="flex flex-wrap justify-center gap-3">
            {items.map((id) => (
              <div key={id} className="flex h-24 w-24 items-center justify-center rounded-blob bg-white shadow-[0_6px_0_#bae6fd]">
                <ScriptText courseId={courseIdOf(id)} className="text-6xl">{getItem(id).glyph}</ScriptText>
              </div>
            ))}
          </div>
        </div>
      </div>
      <footer className="shrink-0 px-6 pb-safe pt-3">
        <Button block onClick={onStart}>
          🤝 {t('help.start')}
        </Button>
      </footer>
    </div>
  );
}
