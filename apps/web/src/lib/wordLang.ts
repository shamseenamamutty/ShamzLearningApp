import { courseIdOf } from '@/content/course';
import type { LearningItem } from '@/content/schema';

/** Languages a lesson word's meaning can be shown and spoken in. English is the default. */
export const WORD_LANGS = [
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'hi', label: 'हिन्दी', dir: 'ltr' },
  { code: 'ar', label: 'العربية', dir: 'rtl' },
  { code: 'ml', label: 'മലയാളം', dir: 'ltr' },
] as const;

export type WordLang = (typeof WORD_LANGS)[number]['code'];

export const isWordLang = (v: string): v is WordLang => WORD_LANGS.some((l) => l.code === v);
export const wordLangDir = (lang: WordLang) => WORD_LANGS.find((l) => l.code === lang)!.dir;

/**
 * The item's example word in `lang`: English is `meaning`, the course's own language is the word
 * itself, and the rest come from `translations` (falling back to English if one is ever missing).
 */
export function meaningIn(item: LearningItem, lang: WordLang): string {
  if (lang === 'en') return item.example.meaning;
  if (courseIdOf(item.id) === lang) return item.example.word;
  return item.example.translations?.[lang] ?? item.example.meaning;
}
