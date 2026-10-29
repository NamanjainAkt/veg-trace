import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, VerdictStatus } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing, radius } from '../../design-system/spacing';

export interface BadgeProps {
  label: string;
  status?: VerdictStatus | 'neutral' | 'brand';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  showDot?: boolean;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  status = 'neutral',
  size = 'md',
  icon,
  showDot = false,
  style,
}) => {
  const getBadgeColors = () => {
    if (status === 'brand') {
      return {
        bg: colors.primaryLight,
        text: colors.primary,
        border: colors.primaryDisabled,
        dot: colors.primary,
      };
    }
    if (status === 'neutral') {
      return {
        bg: colors.surfaceStrong,
        text: colors.body,
        border: colors.hairline,
        dot: colors.muted,
      };
    }
    const verdict = colors.verdicts[status];
    return {
      bg: verdict.background,
      text: verdict.color,
      border: verdict.border,
      dot: verdict.color,
    };
  };

  const badgeColors = getBadgeColors();
  const isSm = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: badgeColors.bg,
          borderColor: badgeColors.border,
          paddingVertical: isSm ? 2.5 : 4,
          paddingHorizontal: isSm ? spacing.sm : spacing.md,
        },
        style,
      ]}
    >
      {showDot && (
        <View
          style={[
            styles.dot,
            {
              backgroundColor: badgeColors.dot,
              width: isSm ? 5 : 6,
              height: isSm ? 5 : 6,
            },
          ]}
        />
      )}
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text
        style={[
          typography.badge,
          {
            color: badgeColors.text,
            fontSize: isSm ? 10 : 11,
            lineHeight: isSm ? 13 : 15,
          },
        ]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    borderWidth: 1,
    flexShrink: 0,
    maxWidth: '100%',
  },
  dot: {
    borderRadius: radius.full,
    marginRight: 4,
  },
  icon: {
    marginRight: 4,
  },
});
