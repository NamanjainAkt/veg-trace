import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Scan } from 'lucide-react-native';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing, radius, shadows } from '../../design-system/spacing';

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
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={title}
        style={({ pressed }) => [
          styles.floatingButton,
          shadows.floating,
          {
            backgroundColor: pressed ? colors.primaryActive : colors.primary,
            transform: [{ scale: pressed ? 0.95 : 1 }],
          },
        ]}
      >
        <Scan size={26} color={colors.white} />
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [
        styles.barButton,
        shadows.card,
        {
          backgroundColor: pressed ? colors.primaryActive : colors.primary,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <View style={styles.iconCircle}>
        <Scan size={20} color={colors.primary} />
      </View>
      <Text style={[typography.buttonMd, styles.barTitle]}>{title}</Text>
    </Pressable>
  );
};

const ICON_CONTAINER_SIZE = 32;

const styles = StyleSheet.create({
  floatingButton: {
    width: 60,
    height: 60,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54, // Min 48px touch target rule
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
  },
  iconCircle: {
    width: ICON_CONTAINER_SIZE,
    height: ICON_CONTAINER_SIZE,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  barTitle: {
    color: colors.white,
  },
});
