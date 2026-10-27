import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { ChevronRight, AlertCircle, CheckCircle2, XCircle, HelpCircle } from 'lucide-react-native';
import { IngredientItem } from '../../types';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing, radius } from '../../design-system/spacing';
import { Badge } from '../ui/Badge';

export interface IngredientRowProps {
  ingredient: IngredientItem;
  onPress?: () => void;
  style?: ViewStyle;
}

export const IngredientRow: React.FC<IngredientRowProps> = ({
  ingredient,
  onPress,
  style,
}) => {
  const config = colors.verdicts[ingredient.verdict];

  const renderIcon = () => {
    switch (ingredient.verdict) {
      case 'vegetarian':
        return <CheckCircle2 size={16} color={config.color} />;
      case 'nonVegetarian':
        return <XCircle size={16} color={config.color} />;
      case 'sourceUndisclosed':
        return <AlertCircle size={16} color={config.color} />;
      case 'sourceDependent':
      case 'unknown':
      default:
        return <HelpCircle size={16} color={config.color} />;
    }
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: colors.canvas,
          opacity: pressed ? 0.8 : 1,
        },
        style,
      ]}
    >
      <View style={styles.leftCol}>
        <View style={styles.headerLine}>
          <Text style={[typography.titleSm, styles.name]} numberOfLines={1} ellipsizeMode="tail">
            {ingredient.name}
          </Text>
          {ingredient.code && (
            <View style={styles.codeBadge}>
              <Text style={[typography.micro, styles.codeText]}>
                {ingredient.code}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.metaRow}>
          <View style={styles.originContainer}>
            {renderIcon()}
            <Text
              style={[
                typography.captionSm,
                { color: config.color, marginLeft: 4, fontWeight: '500' },
              ]}
              numberOfLines={1}
            >
              {config.label}
            </Text>
          </View>
          <Text style={styles.dotSeparator}>•</Text>
          <Text style={[typography.captionSm, styles.originText]} numberOfLines={1} ellipsizeMode="tail">
            {ingredient.origins.join(' / ')}
          </Text>
        </View>
      </View>

      <View style={styles.rightCol}>
        <Badge
          label={ingredient.manufacturerDisclosed ? 'Disclosed' : 'Undisclosed'}
          status={ingredient.manufacturerDisclosed ? 'vegetarian' : 'sourceUndisclosed'}
          size="sm"
          style={{ flexShrink: 0 }}
        />
        {onPress && <ChevronRight size={16} color={colors.muted} style={styles.chevron} />}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineSoft,
    minHeight: 56, // PRD minimum touch target
  },
  leftCol: {
    flex: 1,
    minWidth: 0,
    marginRight: spacing.sm,
  },
  headerLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xxs,
  },
  name: {
    color: colors.ink,
    flexShrink: 1,
  },
  codeBadge: {
    backgroundColor: colors.surfaceStrong,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.xs,
    flexShrink: 0,
  },
  codeText: {
    color: colors.body,
    fontSize: 11,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  originContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  dotSeparator: {
    color: colors.mutedSoft,
    marginHorizontal: spacing.xs,
  },
  originText: {
    color: colors.muted,
    textTransform: 'capitalize',
    flexShrink: 1,
  },
  rightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 0,
  },
  chevron: {
    marginLeft: 2,
  },
});
