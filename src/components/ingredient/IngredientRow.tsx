import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { ChevronRight, AlertCircle, CheckCircle2, XCircle, HelpCircle } from 'lucide-react-native';
import { IngredientItem } from '../../types';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing, radius } from '../../design-system/spacing';
import { Badge } from '../ui/Badge';
import { PressableScale } from '../ui/PressableScale';

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
        return <CheckCircle2 size={14} color={config.color} />;
      case 'nonVegetarian':
        return <XCircle size={14} color={config.color} />;
      case 'sourceUndisclosed':
        return <AlertCircle size={14} color={config.color} />;
      case 'sourceDependent':
      case 'unknown':
      default:
        return <HelpCircle size={14} color={config.color} />;
    }
  };

  const content = (
    <View style={[styles.row, style]}>
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
                { color: config.color, marginLeft: 4, fontWeight: '600', fontSize: 11 },
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
        {onPress && <ChevronRight size={14} color={colors.muted} style={styles.chevron} />}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <PressableScale
        onPress={onPress}
        scaleTo={0.985}
        haptic
        accessibilityRole="button"
        accessibilityLabel={`${ingredient.name}, ${config.label}`}
      >
        {content}
      </PressableScale>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineSoft,
    backgroundColor: colors.canvas,
    minHeight: 48,
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
    marginBottom: 2,
  },
  name: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },
  codeBadge: {
    backgroundColor: colors.surfaceStrong,
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    borderRadius: radius.xs,
    flexShrink: 0,
  },
  codeText: {
    color: colors.body,
    fontSize: 10,
    fontWeight: '600',
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
    fontSize: 11,
  },
  originText: {
    color: colors.muted,
    fontSize: 11,
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
