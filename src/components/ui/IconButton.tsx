import React from 'react';
import { Pressable, StyleSheet, ViewStyle, GestureResponderEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useReducedMotion,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '../../design-system/colors';
import { radius } from '../../design-system/spacing';
import { springs } from '../../design-system/motion';

export interface IconButtonProps {
  icon: React.ReactNode;
  onPress?: () => void;
  accessibilityLabel: string;
  variant?: 'standard' | 'filled' | 'tinted' | 'outline';
  size?: number;
  disabled?: boolean;
  style?: ViewStyle;
  haptic?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  accessibilityLabel,
  variant = 'standard',
  size = 40,
  disabled = false,
  style,
  haptic = true,
}) => {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);

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

  const handlePressIn = (e: GestureResponderEvent) => {
    if (!disabled) {
      if (haptic) {
        try {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch {}
      }
      if (!reducedMotion) {
        scale.value = withSpring(0.92, springs.snap);
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
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={6}
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
        },
        style,
      ]}
    >
      <Animated.View style={animatedStyle}>
        {icon}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
