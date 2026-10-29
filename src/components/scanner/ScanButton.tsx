import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Scan } from 'lucide-react-native';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing, radius, shadows } from '../../design-system/spacing';
import { PressableScale } from '../ui/PressableScale';

export interface ScanButtonProps {
  onPress: () => void;
  title?: string;
  variant?: 'floating' | 'bar';
}

export const ScanButton: React.FC<ScanButtonProps> = ({
  onPress,
  title = 'Scan Label / Barcode',
  variant = 'floating',
}) => {
  if (variant === 'floating') {
    return (
      <PressableScale
        onPress={onPress}
        scaleTo={0.92}
        haptic
        accessibilityRole="button"
        accessibilityLabel={title}
      >
        <View style={[styles.floatingButton, shadows.floating]}>
          <Scan size={22} color={colors.white} />
        </View>
      </PressableScale>
    );
  }

  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.97}
      haptic
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={[styles.barButton, shadows.card]}>
        <View style={styles.iconCircle}>
          <Scan size={18} color={colors.primary} />
        </View>
        <Text style={[typography.buttonMd, styles.barTitle]}>{title}</Text>
      </View>
    </PressableScale>
  );
};

const ICON_CONTAINER_SIZE = 28;

const styles = StyleSheet.create({
  floatingButton: {
    width: 50,
    height: 50,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
  },
  iconCircle: {
    width: ICON_CONTAINER_SIZE,
    height: ICON_CONTAINER_SIZE,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  barTitle: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});
