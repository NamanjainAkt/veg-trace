import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing, radius } from '../../design-system/spacing';

export interface ConfidenceIndicatorProps {
  score: number; // 0 to 100
  size?: 'sm' | 'md';
}

export const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({
  score,
  size = 'md',
}) => {
  const getScoreColor = () => {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.warning;
    return colors.muted;
  };

  const scoreColor = getScoreColor();
  const isSm = size === 'sm';

  return (
    <View style={styles.container}>
      <View style={styles.barBackground}>
        <View
          style={[
            styles.barFill,
            {
              width: `${Math.min(Math.max(score, 5), 100)}%`,
              backgroundColor: scoreColor,
            },
          ]}
        />
      </View>
      <Text
        style={[
          isSm ? typography.micro : typography.caption,
          { color: colors.muted, marginLeft: spacing.xs },
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
    width: 60,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceStrong,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: radius.full,
  },
});
