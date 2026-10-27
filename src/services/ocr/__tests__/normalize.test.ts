import { describe, expect, it } from 'vitest';
import { normalizeResult } from '../normalize';

describe('normalizeResult', () => {
  it('joins string arrays from the expo-text-extractor v2 API', () => {
    const result = normalizeResult(['INGREDIENTS:', 'Wheat flour, sugar', 'E471']);
    expect(result.text).toBe('INGREDIENTS:\nWheat flour, sugar\nE471');
    expect(result.blocks).toHaveLength(3);
  });

  it('ignores non-string array entries', () => {
    const result = normalizeResult(['Sugar', 42, null, 'Salt']);
    expect(result.text).toBe('Sugar\nSalt');
    expect(result.blocks).toEqual(['Sugar', 'Salt']);
  });

  it('keeps plain strings', () => {
    expect(normalizeResult('Sugar, salt').text).toBe('Sugar, salt');
  });

  it('extracts text/blocks object shapes', () => {
    const result = normalizeResult({ text: 'Sugar', blocks: ['a', { text: 'b' }] });
    expect(result.text).toBe('Sugar');
    expect(result.blocks).toEqual(['a', 'b']);
  });

  it('falls back to blocks when text is empty', () => {
    expect(normalizeResult({ blocks: ['x', 'y'] }).text).toBe('x\ny');
  });

  it('normalizes object where text is an array of strings', () => {
    const result = normalizeResult({ text: ['Ingredients:', 'Palm oil, E471'] });
    expect(result.text).toBe('Ingredients:\nPalm oil, E471');
    expect(result.blocks).toEqual(['Ingredients:', 'Palm oil, E471']);
  });

  it('normalizes object with lines array (Android ML Kit wrapper)', () => {
    const result = normalizeResult({ lines: [{ text: 'Refined Wheat Flour' }, { text: 'INS 471' }] });
    expect(result.text).toBe('Refined Wheat Flour\nINS 471');
    expect(result.blocks).toEqual(['Refined Wheat Flour', 'INS 471']);
  });

  it('preserves line breaks and trims empty lines', () => {
    const result = normalizeResult(['Line 1', '   ', 'Line 2\nLine 3']);
    expect(result.text).toBe('Line 1\nLine 2\nLine 3');
    expect(result.blocks).toEqual(['Line 1', 'Line 2\nLine 3']);
  });

  it('returns empty for unknown shapes', () => {
    expect(normalizeResult(42).text).toBe('');
    expect(normalizeResult(null).text).toBe('');
    expect(normalizeResult([]).text).toBe('');
    expect(normalizeResult({}).text).toBe('');
  });
});
