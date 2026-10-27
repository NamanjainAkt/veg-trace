import React from 'react';
import { View, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { colors } from '../../design-system/colors';
import { spacing, radius, shadows } from '../../design-system/spacing';

export interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: 'elevated' | 'flat' | 'outlined';
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  variant = 'flat',
}) => {
  const getContainerStyle = () => {
    switch (variant) {
      case 'elevated':
        return [styles.card, shadows.card, { backgroundColor: colors.canvas }];
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
        return [styles.card, { backgroundColor: colors.surfaceSoft }];
    }
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          ...getContainerStyle(),
          { transform: [{ scale: pressed ? 0.99 : 1 }] },
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[...getContainerStyle(), style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    padding: spacing.lg,
  },
});
