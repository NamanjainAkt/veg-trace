import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Package } from 'lucide-react-native';
import { Product } from '../../types';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing, radius, shadows } from '../../design-system/spacing';
import { Badge } from '../ui/Badge';
import { PressableScale } from '../ui/PressableScale';
import { getVerdictStrings } from '../../i18n/strings';
import { usePreferencesStore } from '../../store/usePreferencesStore';

export interface ProductCardProps {
  product: Product;
  onPress?: () => void;
  style?: ViewStyle;
}

export const ProductCard: React.FC<ProductCardProps> = React.memo(({
  product,
  onPress,
  style,
}) => {
  const { t } = useTranslation();
  const language = usePreferencesStore((s) => s.language);
  const verdictText = getVerdictStrings(language)[product.verdict];

  return (
    <PressableScale
      onPress={onPress}
      disabled={!onPress}
      scaleTo={0.985}
      haptic
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, ${verdictText.label}`}
      style={style}
    >
      <View style={[styles.card, shadows.subtle]}>
        <View style={styles.imageContainer}>
          {product.imageUrl ? (
            <Image
              source={{ uri: product.imageUrl }}
              style={styles.image}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={200}
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Package size={20} color={colors.muted} />
            </View>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.brandRow}>
            <Text
              style={[typography.captionSm, styles.brand]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {product.brand.toUpperCase()}
            </Text>
            <Badge
              label={verdictText.label}
              status={product.verdict}
              size="sm"
              showDot
              style={{ flexShrink: 0 }}
            />
          </View>

          <Text style={[typography.titleSm, styles.name]} numberOfLines={2}>
            {product.name}
          </Text>

          <View style={styles.footerRow}>
            <Text style={[typography.micro, styles.ingredientsCount]}>
              {t('card.ingredientsAnalyzed', { count: product.ingredients.length })}
            </Text>
            <ChevronRight size={14} color={colors.muted} />
          </View>
        </View>
      </View>
    </PressableScale>
  );
});

ProductCard.displayName = 'ProductCard';

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
    padding: spacing.sm + 2,
    alignItems: 'center',
  },
  imageContainer: {
    width: 52,
    height: 52,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.surfaceSoft,
    marginRight: spacing.sm + 2,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xxs,
  },
  brand: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
    flex: 1,
    marginRight: spacing.xs,
  },
  name: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    marginBottom: spacing.xxs,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ingredientsCount: {
    color: colors.mutedSoft,
    fontSize: 11,
  },
});
