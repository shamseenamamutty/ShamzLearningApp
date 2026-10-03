import { describe, expect, it } from 'vitest';
import { getItem } from '@/content/course';
import { meaningIn } from './wordLang';

describe('meaningIn', () => {
  const lion = getItem('ar-letter-alif');
  const mango = getItem('hi-letter-aa');
  it('defaults to the English meaning', () => expect(meaningIn(lion, 'en')).toBe('lion'));
  it("returns the word itself for the course's own language", () => {
    expect(meaningIn(lion, 'ar')).toBe(lion.example.word);
    expect(meaningIn(mango, 'hi')).toBe('आम');
  });
  it('returns the translation for the other languages', () => {
    expect(meaningIn(lion, 'hi')).toBe('शेर');
    expect(meaningIn(lion, 'ml')).toBe('സിംഹം');
    expect(meaningIn(mango, 'ml')).toBe('മാങ്ങ');
  });
});
