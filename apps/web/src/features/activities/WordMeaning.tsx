import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { LearningItem } from '@/content/schema';
import { speakWithLetterHighlight } from '@/engine/audio';
import { clusters } from '@/lib/arabic';
import { useActiveChild, useStore } from '@/lib/store';
import { WORD_LANGS, meaningIn, wordLangDir, type WordLang } from '@/lib/wordLang';

/** The active child's chosen meaning language (English unless changed). */
export function useWordLang(): [WordLang, (lang: WordLang) => void] {
  const { child, settings } = useActiveChild();
  const update = useStore((s) => s.updateSettings);
  return [settings.wordLang ?? 'en', (lang) => child && update(child.id, { wordLang: lang })];
}

/** Row of language chips (English · हिन्दी · العربية · മലയാളം); the choice is remembered per child. */
export function WordLangPicker() {
  const { t } = useTranslation();
  const [lang, setLang] = useWordLang();
  return (
    <div role="radiogroup" aria-label={t('wordLang.label')} className="grid w-full grid-cols-4 gap-2">
      {WORD_LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          role="radio"
          aria-checked={lang === l.code}
          lang={l.code}
          onClick={() => setLang(l.code)}
          className={`min-h-tap rounded-2xl px-1 text-[clamp(0.75rem,3.6vw,1rem)] font-bold ${
            lang === l.code ? 'bg-grape-600 text-white shadow-[0_4px_0_#5b21b6]' : 'bg-white text-grape-700 shadow-[0_4px_0_#ddd6fe]'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

/**
 * The word's meaning shown in the chosen language, with a Listen button. Listening reads it aloud
 * in that language and highlights each letter (with its vowel signs / conjunct) as it's spoken.
 */
export function MeaningButton({ item, size = 'lg' }: { item: LearningItem; size?: 'lg' | 'sm' }) {
  const [lang] = useWordLang();
  // Remount per language/word so a highlight in progress never carries over to different text.
  return <MeaningWord key={`${item.id}:${lang}`} text={meaningIn(item, lang)} lang={lang} size={size} />;
}

/**
 * Font size that always fits the card: the largest size up to `maxRem`, shrunk so `letters` fit
 * across the card's width (container query units). Long words like മാതളനാരങ്ങ get smaller.
 */
function fitSize(letters: number, maxRem: number, lang: WordLang) {
  // Malayalam letter groups run wider than Latin, Arabic or Devanagari ones at the same size.
  const em = lang === 'ml' ? 1.3 : 1;
  return `min(${maxRem}rem, ${(100 / (Math.max(letters, 1) * em)).toFixed(1)}cqi)`;
}

function MeaningWord({ text, lang, size }: { text: string; lang: WordLang; size: 'lg' | 'sm' }) {
  const { t } = useTranslation();
  const segments = useMemo(() => clusters(text, lang === 'ar'), [text, lang]);
  const [index, setIndex] = useState<number | null>(null);
  const listen = () => speakWithLetterHighlight(text, lang, segments, setIndex, () => setIndex(null));
  const lg = size === 'lg';

  return (
    <button
      type="button"
      data-testid="word-meaning"
      aria-label={t('wordLang.hear', { word: text })}
      onClick={(e) => {
        e.stopPropagation();
        listen();
      }}
      className={`flex w-full flex-col items-center rounded-3xl font-bold [container-type:inline-size] text-ink active:scale-95 ${
        lg ? 'gap-2 bg-sky2-100 px-5 py-4' : 'gap-1 bg-white px-3 py-2 shadow-[0_3px_0_#bae6fd]'
      }`}
    >
      <span
        data-testid="meaning-word"
        lang={lang}
        dir={wordLangDir(lang)}
        className={`${lang} max-w-full whitespace-nowrap leading-normal`}
        style={{ fontSize: fitSize(segments.length, lg ? 3 : 1.5, lang) }}
      >
        {segments.map((c, i) => (
          <span key={i} className={`transition-colors ${index === i ? 'text-leaf-500' : ''}`}>
            {c.display}
          </span>
        ))}
      </span>
      <span
        aria-hidden="true"
        className={`inline-flex items-center gap-1 rounded-full bg-grape-600 font-extrabold text-white shadow-[0_3px_0_#5b21b6] ${
          lg ? 'min-h-[44px] px-5 text-lg' : 'px-3 py-1 text-sm'
        }`}
      >
        🔊 {t('wordLang.listen')}
      </span>
    </button>
  );
}
