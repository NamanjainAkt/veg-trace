import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing, radius } from '../../design-system/spacing';

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  disabled = false,
  loading = false,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const getBackgroundColor = (pressed: boolean) => {
    if (disabled) {
      return variant === 'primary' ? colors.primaryDisabled : colors.surfaceStrong;
    }
    switch (variant) {
      case 'primary':
        return pressed ? colors.primaryActive : colors.primary;
      case 'secondary':
        return pressed ? colors.hairline : colors.surfaceSoft;
      case 'outline':
      case 'ghost':
        return pressed ? colors.surfaceSoft : 'transparent';
      case 'danger':
        return pressed ? '#A8250A' : colors.error;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.mutedSoft;
    switch (variant) {
      case 'primary':
      case 'danger':
        return colors.white;
      case 'secondary':
      case 'ghost':
        return colors.ink;
      case 'outline':
        return colors.ink;
    }
  };

  const getHeight = () => {
    switch (size) {
      case 'sm':
        return 40;
      case 'lg':
        return 56;
      case 'md':
      default:
        return 48; // PRD standard 48px touch target
    }
  };

  const typographyStyle = size === 'sm' ? typography.buttonSm : typography.buttonMd;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: getBackgroundColor(pressed),
          height: getHeight(),
          minWidth: getHeight(),
          borderColor: variant === 'outline' ? colors.hairline : 'transparent',
          borderWidth: variant === 'outline' ? 1 : 0,
          alignSelf: fullWidth ? 'stretch' : 'auto',
          opacity: disabled ? 0.6 : 1,
          transform: [{ scale: pressed && !disabled ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'danger' ? colors.white : colors.ink}
        />
      ) : (
        <View style={styles.contentRow}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={[typographyStyle, { color: getTextColor() }, textStyle]}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: spacing.sm,
  },
});
