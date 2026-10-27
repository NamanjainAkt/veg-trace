import { TextStyle } from 'react-native';

/**
 * VegTrace Typography Tokens
 * Inter font scale adhering to PRD Section 7.
 */
export const typography: Record<string, TextStyle> = {
  displayXl: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  displayLg: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  displayMd: {
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  displaySm: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  titleMd: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  titleSm: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
  },
  bodyMd: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  bodySm: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  caption: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500',
  },
  captionSm: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
  badge: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  micro: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  buttonMd: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  buttonSm: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
};
