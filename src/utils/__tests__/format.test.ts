import { describe, expect, it } from 'vitest';
import { formatScannedAt } from '../../utils/format';

describe('formatScannedAt', () => {
  it('shows Just now for fresh ISO timestamps', () => {
    expect(formatScannedAt(new Date().toISOString())).toBe('Just now');
  });

  it('passes legacy display strings through untouched', () => {
    expect(formatScannedAt('2 mins ago')).toBe('2 mins ago');
    expect(formatScannedAt('Yesterday')).toBe('Yesterday');
    expect(formatScannedAt('')).toBe('');
  });

  it('renders relative times for older ISO timestamps', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    expect(formatScannedAt(twoHoursAgo)).toBe('2 hours ago');
    const yesterday = new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString();
    expect(formatScannedAt(yesterday)).toBe('Yesterday');
  });
});
