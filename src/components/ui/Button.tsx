import React from 'react';
import {
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
  GestureResponderEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useReducedMotion,
} from 'react-native-reanimated';
import { Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing, radius } from '../../design-system/spacing';
import { springs } from '../../design-system/motion';

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
  haptic?: boolean;
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
  haptic = true,
}) => {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);

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
      case 'outline':
        return colors.ink;
    }
  };

  const getHeight = () => {
    switch (size) {
      case 'sm':
        return 36;
      case 'lg':
        return 48;
      case 'md':
      default:
        return 44;
    }
  };

  const typographyStyle = size === 'sm' ? typography.buttonSm : typography.buttonMd;

  const handlePressIn = (e: GestureResponderEvent) => {
    if (!disabled && !loading) {
      if (haptic) {
        try {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch {}
      }
      if (!reducedMotion) {
        scale.value = withSpring(0.97, springs.snap);
      }
    }
  };

  const handlePressOut = (e: GestureResponderEvent) => {
    if (!reducedMotion) {
      scale.value = withSpring(1, springs.settle);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
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
        },
        style,
      ]}
    >
      <Animated.View style={[styles.contentWrapper, animatedStyle]}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === 'primary' || variant === 'danger' ? colors.white : colors.ink}
          />
        ) : (
          <View style={styles.contentRow}>
            {icon && <View style={styles.iconContainer}>{icon}</View>}
            <Text
              style={[
                typographyStyle,
                {
                  color: getTextColor(),
                  fontSize: size === 'sm' ? 13 : 15,
                  fontWeight: '600',
                },
                textStyle,
              ]}
            >
              {title}
            </Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  contentWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: spacing.xs,
  },
});
