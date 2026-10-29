import React from 'react';
import Svg, { Circle, Path, Rect, Line } from 'react-native-svg';
import { colors } from '../../design-system/colors';

/**
 * Reusable micro-illustrations in one consistent style: rounded coral/ink
 * strokes on soft peach fills. Used for empty states and the scan hero —
 * never as random decoration.
 */

interface IllustrationProps {
  size?: number;
}

/** Packaged product with a magnifier — "scan your first product" (History). */
export const ScanFirstIllustration: React.FC<IllustrationProps> = ({
  size = 96,
}) => (
  <Svg width={size} height={size} viewBox="0 0 96 96" fill="none">
    <Rect x="14" y="20" width="46" height="56" rx="8" fill={colors.peach} />
    <Rect
      x="14"
      y="20"
      width="46"
      height="56"
      rx="8"
      stroke={colors.ink}
      strokeWidth="3"
    />
    <Line x1="22" y1="34" x2="42" y2="34" stroke={colors.ink} strokeWidth="3" strokeLinecap="round" />
    <Circle cx="54" cy="54" r="16" fill="#FFFFFF" stroke={colors.primary} strokeWidth="4" />
    <Line x1="65" y1="66" x2="76" y2="78" stroke={colors.primary} strokeWidth="5" strokeLinecap="round" />
    <Circle cx="53" cy="54" r="4.5" fill={colors.ink} />
  </Svg>
);

/** Phone with an on-device shield — zero-upload / offline pledges. */
export const OfflineShieldIllustration: React.FC<IllustrationProps> = ({
  size = 96,
}) => (
  <Svg width={size} height={size} viewBox="0 0 96 96" fill="none">
    <Rect x="26" y="14" width="44" height="68" rx="10" fill={colors.peach} />
    <Rect
      x="26"
      y="14"
      width="44"
      height="68"
      rx="10"
      stroke={colors.ink}
      strokeWidth="3"
    />
    <Line x1="40" y1="73" x2="56" y2="73" stroke={colors.ink} strokeWidth="3" strokeLinecap="round" />
    <Path
      d="M48 32 L60 37 V48 C60 56 54.5 61 48 64 C41.5 61 36 56 36 48 V37 Z"
      fill="#FFFFFF"
      stroke={colors.success}
      strokeWidth="3"
      strokeLinejoin="round"
    />
    <Path
      d="M43 48 L46.5 51.5 L53 45"
      stroke={colors.success}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/** Small packaged good inside scanner brackets — Home scan hero accent. */
export const ScanHeroIllustration: React.FC<IllustrationProps> = ({
  size = 64,
}) => (
  <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <Rect x="20" y="18" width="24" height="28" rx="5" fill="#FFFFFF" />
    <Rect
      x="20"
      y="18"
      width="24"
      height="28"
      rx="5"
      stroke={colors.ink}
      strokeWidth="2.5"
    />
    <Line x1="25" y1="26" x2="35" y2="26" stroke={colors.ink} strokeWidth="2.5" strokeLinecap="round" />
    <Line x1="25" y1="32" x2="31" y2="32" stroke="#D0D0D0" strokeWidth="2.5" strokeLinecap="round" />
    <Path d="M12 10 V6 a4 4 0 0 1 4 -4 H20" stroke={colors.primary} strokeWidth="3" strokeLinecap="round" />
    <Path d="M52 10 V6 a4 4 0 0 0 -4 -4 H44" stroke={colors.primary} strokeWidth="3" strokeLinecap="round" />
    <Path d="M12 54 V58 a4 4 0 0 0 4 4 H20" stroke={colors.primary} strokeWidth="3" strokeLinecap="round" />
    <Path d="M52 54 V58 a4 4 0 0 1 -4 4 H44" stroke={colors.primary} strokeWidth="3" strokeLinecap="round" />
  </Svg>
);

/** Flask with a question mark — unknown / unverified ingredient states. */
export const UnknownAdditiveIllustration: React.FC<IllustrationProps> = ({
  size = 96,
}) => (
  <Svg width={size} height={size} viewBox="0 0 96 96" fill="none">
    <Path
      d="M40 14 H56 V32 L70 66 C72 72 68 78 62 78 H34 C28 78 24 72 26 66 L40 32 Z"
      fill={colors.peach}
      stroke={colors.ink}
      strokeWidth="3"
      strokeLinejoin="round"
    />
    <Path d="M36 54 H60" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
    <Path
      d="M44 66 C44 62 46 61 48 59 C50 61 52 62 52 65"
      stroke={colors.ink}
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <Circle cx="70" cy="24" r="5" fill={colors.peachDeep} />
    <Circle cx="78" cy="34" r="3" fill={colors.peachDeep} />
  </Svg>
);
