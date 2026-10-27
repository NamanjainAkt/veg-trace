import { describe, expect, it } from 'vitest';
import { extractAdditivesFromText, lookupAdditive } from '../knowledgeBase';

describe('lookupAdditive', () => {
  it('resolves codes case-insensitively', () => {
    expect(lookupAdditive('E471')?.code).toBe('E471');
    expect(lookupAdditive('e471')?.code).toBe('E471');
    expect(lookupAdditive(' 471 ')?.code).toBe('E471');
    expect(lookupAdditive('INS 471')?.code).toBe('E471');
  });

  it('resolves hyphenated and plural alias variations in lookupAdditive', () => {
    expect(lookupAdditive('mono- and diglycerides')?.code).toBe('E471');
    expect(lookupAdditive('monoglycerides')?.code).toBe('E471');
    expect(lookupAdditive('monoglyceride')?.code).toBe('E471');
    expect(lookupAdditive('gelatins')?.code).toBe('E441');
    expect(lookupAdditive('carmines')?.code).toBe('E120');
    expect(lookupAdditive('carrageenans')?.code).toBe('E407');
    expect(lookupAdditive('guar gums')?.code).toBe('E412');
    expect(lookupAdditive('xanthan gums')?.code).toBe('E415');
    expect(lookupAdditive('lysozyme')?.code).toBe('E1105');
  });

  it('returns null for single characters instead of first match', () => {
    expect(lookupAdditive('a')).toBeNull();
  });

  it('does not confuse E921 with E920', () => {
    expect(lookupAdditive('e921')).toBeNull();
  });

  it('matches whole-word names for queries of length >= 4', () => {
    expect(lookupAdditive('gelatin')?.code).toBe('E441');
  });

  it('never resolves a generic single token via the name path', () => {
    expect(lookupAdditive('acids')).toBeNull();
  });

  it('rejects oversized queries', () => {
    expect(lookupAdditive('a'.repeat(200))).toBeNull();
  });
});

describe('extractAdditivesFromText', () => {
  it('ignores bare numbers from weights and nutrition panels', () => {
    expect(extractAdditivesFromText('Net weight 120g sugar')).toHaveLength(0);
    expect(extractAdditivesFromText('contains 471 calories, batch 500ii-X')).toHaveLength(0);
  });

  it('matches prefixed codes with spacing and dash variants', () => {
    const found = extractAdditivesFromText('Emulsifiers (INS-471, E 322) and E472e.');
    const codes = found.map((d) => d.code).sort();
    expect(codes).toEqual(['E322', 'E471', 'E472']);
  });

  it('matches common names as whole words', () => {
    const found = extractAdditivesFromText('Contains gelatin and carmine color.');
    const codes = found.map((d) => d.code).sort();
    expect(codes).toEqual(['E120', 'E441']);
  });

  it('deduplicates repeated mentions', () => {
    const found = extractAdditivesFromText('E471, INS 471, mono and diglycerides.');
    expect(found.filter((d) => d.code === 'E471')).toHaveLength(1);
  });

  it('matches plural alias words in ingredient text', () => {
    const found = extractAdditivesFromText('Contains gelatins.');
    expect(found.map((d) => d.code)).toContain('E441');
  });
});
