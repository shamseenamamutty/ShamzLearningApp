import { useTranslation } from 'react-i18next';
import type { LearningItem } from '@/content/schema';
import { speak } from '@/engine/audio';
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
          className={`min-h-tap rounded-2xl px-1 text-base font-bold ${
            lang === l.code ? 'bg-grape-600 text-white shadow-[0_4px_0_#5b21b6]' : 'bg-white text-grape-700 shadow-[0_4px_0_#ddd6fe]'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

/** The word's meaning in the chosen language; tap to hear it spoken in that language. */
export function MeaningButton({ item, size = 'lg' }: { item: LearningItem; size?: 'lg' | 'sm' }) {
  const { t } = useTranslation();
  const [lang] = useWordLang();
  const text = meaningIn(item, lang);
  return (
    <button
      type="button"
      data-testid="word-meaning"
      aria-label={t('wordLang.hear', { word: text })}
      onClick={(e) => {
        e.stopPropagation();
        speak(text, lang);
      }}
      className={`inline-flex min-h-tap items-center justify-center gap-2 rounded-full font-bold text-ink active:scale-95 ${
        size === 'lg' ? 'w-full bg-sky2-100 px-5 text-2xl' : 'bg-white px-4 text-lg shadow-[0_3px_0_#bae6fd]'
      }`}
    >
      <span aria-hidden="true">🔊</span>
      <span lang={lang} dir={wordLangDir(lang)} className={lang}>
        {text}
      </span>
    </button>
  );
}
