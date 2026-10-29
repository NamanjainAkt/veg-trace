import React from 'react';
import {
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
  GestureResponderEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useReducedMotion,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { PRESS_SCALE, ROW_SCALE, springs } from '../../design-system/motion';

export interface PressableScaleProps extends PressableProps {
  /** 1 for full-bleed rows, lower (0.96 - 0.98) for buttons/cards. */
  scaleTo?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  haptic?: boolean;
}

/**
 * Pressable with physical spring scaling (0.97 default, 0.985 for list rows)
 * and optional tactile micro-haptic feedback. Runs 100% on native UI thread.
 */
export const PressableScale: React.FC<PressableScaleProps> = ({
  scaleTo = PRESS_SCALE,
  style,
  children,
  haptic = false,
  onPressIn,
  onPressOut,
  disabled,
  ...props
}) => {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = (e: GestureResponderEvent) => {
    if (!disabled) {
      if (haptic) {
        try {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch {}
      }
      if (!reducedMotion) {
        scale.value = withSpring(scaleTo, springs.snap);
      }
    }
    onPressIn?.(e);
  };

  const handlePressOut = (e: GestureResponderEvent) => {
    if (!reducedMotion) {
      scale.value = withSpring(1, springs.settle);
    }
    onPressOut?.(e);
  };

  return (
    <Pressable
      style={style}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...props}
    >
      <Animated.View style={animatedStyle}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

export const ROW_PRESS_SCALE = ROW_SCALE;
