import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useReducedMotion,
} from 'react-native-reanimated';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing, radius } from '../../design-system/spacing';
import { springs } from '../../design-system/motion';

export interface ConfidenceIndicatorProps {
  score: number; // 0 to 100
  size?: 'sm' | 'md';
}

export const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({
  score,
  size = 'md',
}) => {
  const reducedMotion = useReducedMotion();
  const clampedScore = Math.min(Math.max(score, 5), 100);
  const fillWidth = useSharedValue(reducedMotion ? clampedScore : 0);

  useEffect(() => {
    if (reducedMotion) {
      fillWidth.value = clampedScore;
    } else {
      fillWidth.value = withSpring(clampedScore, springs.reveal);
    }
  }, [clampedScore, reducedMotion, fillWidth]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${fillWidth.value}%`,
  }));

  const getScoreColor = () => {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.warning;
    return colors.muted;
  };

  const scoreColor = getScoreColor();
  const isSm = size === 'sm';

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.barBackground,
          {
            width: isSm ? 44 : 54,
            height: isSm ? 4 : 5,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.barFill,
            { backgroundColor: scoreColor },
            animatedStyle,
          ]}
        />
      </View>
      <Text
        style={[
          isSm ? typography.micro : typography.captionSm,
          { color: colors.muted, marginLeft: spacing.xs, fontSize: isSm ? 10 : 11 },
        ]}
      >
        {score}% Confidence
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barBackground: {
    borderRadius: radius.full,
    backgroundColor: colors.surfaceStrong,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: radius.full,
  },
});
