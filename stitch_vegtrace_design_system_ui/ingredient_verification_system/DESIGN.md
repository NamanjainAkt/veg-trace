---
name: Ingredient Verification System
colors:
  surface: '#fbf9f8'
  surface-dim: '#dbdad9'
  surface-bright: '#fbf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f3'
  surface-container: '#efeded'
  surface-container-high: '#e9e8e7'
  surface-container-highest: '#e4e2e2'
  on-surface: '#1b1c1c'
  on-surface-variant: '#5c3f41'
  inverse-surface: '#303031'
  inverse-on-surface: '#f2f0f0'
  outline: '#906f70'
  outline-variant: '#e5bdbe'
  surface-tint: '#be0038'
  primary: '#ba0036'
  on-primary: '#ffffff'
  primary-container: '#e21e4a'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb2b6'
  secondary: '#5f5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e2dfde'
  on-secondary-container: '#636262'
  tertiary: '#006c03'
  on-tertiary: '#ffffff'
  tertiary-container: '#008805'
  on-tertiary-container: '#f8ffef'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdada'
  primary-fixed-dim: '#ffb2b6'
  on-primary-fixed: '#40000d'
  on-primary-fixed-variant: '#920029'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1b1c1c'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#88fc73'
  tertiary-fixed-dim: '#6cdf5a'
  on-tertiary-fixed: '#002200'
  on-tertiary-fixed-variant: '#005301'
  background: '#fbf9f8'
  on-background: '#1b1c1c'
  surface-variant: '#e4e2e2'
typography:
  display-xl:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.02em
  display-lg:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  display-md:
    fontFamily: Inter
    fontSize: 21px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  title-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  caption:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0em
  micro:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  badge:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system establishes an authoritative, hospitable, and radically transparent consumer utility. Inspired by clean hospitality and marketplace interfaces, it rejects clinical laboratory aesthetics and neon "AI" motifs in favor of editorial clarity, tactile human trust, and decisive utility.

The visual tone is restrained and confident: expansive white space, precise near-black typography, crisp hairlines, and purposeful pops of signature Rausch accent color. The emotional goal is immediate peace of mind for consumers scanning packaged foods under dietary scrutiny. Transparency is delivered via structured evidence cards, high-contrast status tokens, and real-world label photography over speculative iconography.

## Colors

The palette leverages pure white as an expansive canvas, framed by neutral tones calibrated for contrast, legibility, and architectural precision.

### Foundation
- **Canvas (`#FFFFFF`)**: Primary page background and card fill.
- **Ink Primary (`#222222`)**: Headlines, key titles, strong borders, active icon glyphs.
- **Ink Body (`#3F3F3F`)**: Long-form ingredient lists, descriptions, narrative analyses.
- **Ink Muted (`#6A6A6A`)**: Metadata, contextual subtitles, disabled elements, inactive tabs.
- **Surface Soft (`#F7F7F7`)**: Secondary wells, inner pill backgrounds, search bars.
- **Surface Strong (`#F2F2F2`)**: Pressed states, image placeholders, disabled buttons.
- **Hairline Border (`#DDDDDD`)**: Explicit card outlines, bottom sheets, divider boundaries.
- **Hairline Soft (`#EBEBEB`)**: Subtle row separators, table dividers, secondary card frames.

### Brand Accents
- **Rausch Primary (`#FF385C`)**: Primary action buttons, primary toggles, active filter dots.
- **Rausch Active (`#E00B41`)**: Button press and tap-down states.
- **Rausch Tint (`#FFD1DA`)**: Light focus rings, active selection indicator wells.

### Semantic Status Tokens
These five status levels are inviolable across verification chips, status badges, and evidence ribbons:
- **Vegetarian**: Tone `#008A05`, Background Tint `#EBF7EE`
- **Non-Vegetarian**: Tone `#C13515`, Background Tint `#FDF2F0`
- **Source-Dependent**: Tone `#D97706`, Background Tint `#FFFBEB`
- **Source-Undisclosed**: Tone `#EA580C`, Background Tint `#FFF7ED`
- **Unknown / Unverified**: Tone `#6A6A6A`, Background Tint `#F3F4F6`

## Typography

Typography relies exclusively on Inter, configured to mirror high-craft editorial hierarchies. Type behaves functionally and architecturally: large scales anchor scan results, medium weights organize ingredient categories, and precise tight metrics deliver dense nutrition analysis without visual clutter.

- **Display XL & LG**: Product titles, definitive verdict headers, camera screen overlays.
- **Display MD**: Section headers inside bottom sheets and modal titles.
- **Title MD**: Ingredient common names, brand verification partner cards, setting labels.
- **Body MD & SM**: Regulatory definitions, dietary warnings, ingredient provenance notes.
- **Caption**: Compact status labels, metadata keys, clickable tertiary actions.
- **Micro**: Time stamps, barcode digits, regulatory code numbers (E-numbers).
- **Badge**: Monospace-like tight uppercase tags inside verification pills.

## Layout & Spacing

Layout conforms to a fluid mobile-first grid bounded by strict 24px (`space-lg`) outer screen margins, preserving touch clearance from device bezels.

### Vertical Rhythm
- Standard content stacking operates on an 8pt step system (`8px`, `16px`, `24px`, `32px`).
- Section breaks between independent food modules (e.g., Allergen Warnings to Ingredient Traceability) use `32px` (`space-xl`).
- Internal module padding uses consistent `16px` (`space-md`).

### Touch & Accessibility Standards
All clickable targets maintain a strict minimum bounding box of 48×48px, even when housing smaller glyphs or 14px badges. Bottom action bars fix to viewport baselines with safe-area insets, featuring sticky camera triggers and verification CTAs.

## Elevation & Depth

This system intentionally eliminates nested drop shadows and heavy multi-stop elevations. Surface hierarchy relies primarily on **low-contrast outlines** paired with a single, highly diffused ambient elevation for floating elements.

- **Base Surfaces**: Cards, rows, and banners sit flat on `#FFFFFF` using a 1px solid border of `#DDDDDD` or `#EBEBEB`.
- **Floating Modals & Sheets**: Floating bottom sheets, search overlays, and bottom verification bars use a single ambient shadow:
  - `box-shadow: 0 8px 28px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04);`
- **Pressed & Active Feedback**: Interactive cards do not elevate on tap; they adopt a neutral micro-compression (`scale(0.99)`) alongside background shifts from `#FFFFFF` to `#F7F7F7`.

## Shapes

The geometric vocabulary balances clean architectural structure with approachable rounded touchpoints. 

- **Primary & Secondary Buttons**: Formed with an 8px border radius (`rounded-md`), establishing crisp, intentional interaction triggers.
- **Containers & Evidence Cards**: Structured with a 14px border radius (`rounded-lg`), softening content modules without feeling toy-like.
- **Status Pills, Badges & Search Capsules**: Rendered at full pill radius (`9999px`), distinguishing status indicators from structural content boxes.

## Components

### Buttons
- **Primary**: Background `#FF385C`, text `#FFFFFF`, radius 8px, height 48px, padding 0 24px, typography `Caption`. Hover/pressed state shifts to `#E00B41`.
- **Secondary**: Background `#FFFFFF`, text `#222222`, border 1px solid `#222222`, radius 8px, height 48px.
- **Subtle / Ghost**: Background transparent, text `#222222`, underline on hover, 48px hit target.

### Verification Chips & Badges
- Rendered as 9999px pill containers. Height is 28px for chips and 20px for inline badges.
- Always composed of an 8px circular status glyph or semantic icon on the left, paired with status text in `Badge` typography.
- Uses paired semantic fills (e.g., `#008A05` text/icon on `#EBF7EE` container).

### Evidence Cards
- White background (`#FFFFFF`), 14px radius, 1px solid `#EBEBEB` border.
- Cards host an ingredient title (`Title MD`), origin category (`Caption`), status chip, and direct package photograph evidence cropped at a 4:3 ratio with a subtle inner border (`1px solid rgba(0,0,0,0.06)`).
- No drop shadow; cards rely strictly on spatial separation.

### Ingredient List Rows
- Horizontal layout, min-height 56px, separated by a 1px hairline soft line (`#EBEBEB`).
- Displays ingredient name in `#222222`, E-number or common alias in `#6A6A6A`, with status chip right-aligned.
- Chevron affordance (`#6A6A6A`) appears only when deep laboratory or supply-chain sourcing notes exist.

### Input Fields & Search Bars
- Search capsules feature a 9999px pill contour, `#F7F7F7` fill, 1px hairline border `#DDDDDD`, 48px height.
- Text color `#222222` with placeholder in `#6A6A6A`.
- Active focus state removes default browser outlines and applies a crisp 2px border in `#222222`.

### Checkboxes & Segmented Controls
- Segmented controls feature a `#F2F2F2` trough with a 9999px radius, containing `#FFFFFF` pill tabs elevated by `box-shadow: 0 2px 4px rgba(0,0,0,0.08)`.
- Dietary toggle checkboxes use an 8px radius container with `#222222` border, filling with `#222222` and a white check when selected.