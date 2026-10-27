/**
 * VegTrace Airbnb-Inspired Design Tokens: Colors
 * Strictly complies with PRD Section 6, 7 & 8.
 * Primary Brand: Rausch (#FF385C)
 * Ink: #222222, Canvas: #FFFFFF
 * No purple / violet.
 */

export const colors = {
  // Canvas & Backgrounds
  canvas: '#FFFFFF',
  surfaceSoft: '#F7F7F7',
  surfaceStrong: '#F2F2F2',
  surfaceCard: '#FFFFFF',

  // Typography Ink
  ink: '#222222',
  body: '#3F3F3F',
  muted: '#6A6A6A',
  mutedSoft: '#929292',
  white: '#FFFFFF',

  // Primary Brand Accent (Rausch)
  primary: '#FF385C',
  primaryActive: '#E00B41',
  primaryDisabled: '#FFD1DA',
  primaryLight: '#FFF0F2',

  // Borders & Dividers
  hairline: '#DDDDDD',
  hairlineSoft: '#EBEBEB',

  // System & Alerts
  error: '#C13515',
  errorBackground: '#FFEBEE',
  warning: '#D97706',
  warningBackground: '#FEF3C7',
  success: '#008805',
  successBackground: '#E8F5E9',

  // 5 Core Verdict Status Colors
  verdicts: {
    vegetarian: {
      color: '#008805',
      background: '#E8F5E9',
      border: '#A5D6A7',
      label: 'Vegetarian',
      description: 'No identified animal-derived ingredient',
      badgeText: 'Verified Veg',
    },
    nonVegetarian: {
      color: '#C13515',
      background: '#FFEBEE',
      border: '#FFCDD2',
      label: 'Non-Vegetarian',
      description: 'Evidence indicates animal-derived ingredient',
      badgeText: 'Animal Derived',
    },
    sourceDependent: {
      color: '#B45309',
      background: '#FEF3C7',
      border: '#FDE68A',
      label: 'Source Dependent',
      description: 'Ingredient can have plant or animal origins',
      badgeText: 'Origin Ambiguous',
    },
    sourceUndisclosed: {
      color: '#C2410C',
      background: '#FFEDD5',
      border: '#FED7AA',
      label: 'Source Undisclosed',
      description: 'Relevant source information is not disclosed by manufacturer',
      badgeText: 'Known ≠ Assumed',
    },
    unknown: {
      color: '#6B7280',
      background: '#F3F4F6',
      border: '#E5E7EB',
      label: 'Unknown',
      description: 'Insufficient evidence to determine source origin',
      badgeText: 'Data Incomplete',
    },
  },
} as const;

export type VerdictStatus = keyof typeof colors.verdicts;
