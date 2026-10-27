import { describe, expect, it } from 'vitest';
import { cleanOcrText } from '../clean';

describe('cleanOcrText', () => {
  it('collapses whitespace and trims', () => {
    expect(cleanOcrText('  Sugar,   Salt\n\n\nE471  ')).toBe('Sugar, Salt\n\nE471');
  });

  it('returns empty for noise', () => {
    expect(cleanOcrText('   \n  ')).toBe('');
  });
});
