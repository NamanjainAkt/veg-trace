import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../design-system/colors';
import { radius } from '../../design-system/spacing';

export interface IconButtonProps {
  icon: React.ReactNode;
  onPress?: () => void;
  accessibilityLabel: string;
  variant?: 'standard' | 'filled' | 'tinted' | 'outline';
  size?: number; // default 48 for Fitts Law / minimum touch target
  disabled?: boolean;
  style?: ViewStyle;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  accessibilityLabel,
  variant = 'standard',
  size = 48,
  disabled = false,
  style,
}) => {
  const getBackgroundColor = (pressed: boolean) => {
    if (disabled) return colors.surfaceStrong;
    switch (variant) {
      case 'filled':
        return pressed ? colors.primaryActive : colors.primary;
      case 'tinted':
        return pressed ? colors.hairline : colors.surfaceSoft;
      case 'outline':
      case 'standard':
        return pressed ? colors.surfaceSoft : 'transparent';
    }
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: radius.full,
          backgroundColor: getBackgroundColor(pressed),
          borderColor: variant === 'outline' ? colors.hairline : 'transparent',
          borderWidth: variant === 'outline' ? 1 : 0,
          opacity: disabled ? 0.5 : 1,
          transform: [{ scale: pressed && !disabled ? 0.94 : 1 }],
        },
        style,
      ]}
    >
      {icon}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
