import React from 'react';
import { View, StyleSheet, Pressable, ViewStyle, GestureResponderEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useReducedMotion,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '../../design-system/colors';
import { spacing, radius, shadows } from '../../design-system/spacing';
import { springs } from '../../design-system/motion';

export interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: 'elevated' | 'flat' | 'outlined';
  compact?: boolean;
  haptic?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  variant = 'flat',
  compact = false,
  haptic = true,
}) => {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const getContainerStyle = () => {
    switch (variant) {
      case 'elevated':
        return [
          styles.card,
          shadows.card,
          {
            backgroundColor: colors.canvas,
            borderWidth: 1,
            borderColor: colors.hairlineSoft,
          },
        ];
      case 'outlined':
        return [
          styles.card,
          {
            backgroundColor: colors.canvas,
            borderWidth: 1,
            borderColor: colors.hairline,
          },
        ];
      case 'flat':
      default:
        return [
          styles.card,
          {
            backgroundColor: colors.surfaceSoft,
            borderWidth: 1,
            borderColor: colors.hairlineSoft,
          },
        ];
    }
  };

  const handlePressIn = (e: GestureResponderEvent) => {
    if (onPress) {
      if (haptic) {
        try {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch {}
      }
      if (!reducedMotion) {
        scale.value = withSpring(0.985, springs.snap);
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

  const paddingStyle = {
    padding: compact ? spacing.sm : spacing.md,
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={style}
      >
        <Animated.View
          style={[...getContainerStyle(), paddingStyle, animatedStyle, style]}
        >
          {children}
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <View style={[...getContainerStyle(), paddingStyle, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    overflow: 'hidden',
  },
});
