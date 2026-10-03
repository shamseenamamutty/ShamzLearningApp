import { describe, expect, it } from 'vitest';
import { toE164 } from './phone';

describe('toE164', () => {
  it('joins the country code and drops the local leading 0', () => {
    expect(toE164('+971', '050 123 4567')).toBe('+971501234567');
    expect(toE164('+91', '98765-43210')).toBe('+919876543210');
  });
  it('lets a typed +code or 00code win', () => {
    expect(toE164('+971', '+44 7700 900123')).toBe('+447700900123');
    expect(toE164('+971', '0044 7700 900123')).toBe('+447700900123');
  });
  it('rejects numbers that are too short or have letters', () => {
    expect(toE164('+971', '123')).toBeNull();
    expect(toE164('+971', '50abc4567')).toBeNull();
  });
});
