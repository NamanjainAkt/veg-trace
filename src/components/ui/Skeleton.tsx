import React, { useEffect } from 'react';
import { ViewStyle, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useReducedMotion,
  cancelAnimation,
} from 'react-native-reanimated';
import { colors } from '../../design-system/colors';
import { radius } from '../../design-system/spacing';

export interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 18,
  borderRadius = radius.sm,
  style,
}) => {
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(reducedMotion ? 0.5 : 0.35);

  useEffect(() => {
    if (reducedMotion) {
      opacity.value = 0.5;
      return;
    }
    opacity.value = withRepeat(
      withTiming(0.8, { duration: 800 }),
      -1,
      true
    );
    return () => {
      cancelAnimation(opacity);
    };
  }, [reducedMotion, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height,
          borderRadius,
        },
        animatedStyle,
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.surfaceStrong,
  },
});
