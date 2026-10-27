import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing, radius } from '../../design-system/spacing';
import { Button } from './Button';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconContainer}>{icon}</View>
      <Text style={[typography.titleMd, styles.title]}>{title}</Text>
      <Text style={[typography.bodySm, styles.description]}>{description}</Text>
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="secondary"
          size="sm"
          style={styles.actionButton}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.ink,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  description: {
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
    maxWidth: 280,
  },
  actionButton: {
    marginTop: spacing.xs,
  },
});
