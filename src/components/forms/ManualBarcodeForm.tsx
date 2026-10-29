import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Barcode, Search } from 'lucide-react-native';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { fetchProductByBarcode } from '../../services/openFoodFacts';
import { getDietaryPreferences, saveScanProduct } from '../../services/storage';
import { resolveProductWithFallback } from '../../services/webFallback';

export interface ManualBarcodeFormProps {
  onSuccess?: () => void;
  onFallbackToText?: () => void;
}

export const ManualBarcodeForm: React.FC<ManualBarcodeFormProps> = ({
  onSuccess,
  onFallbackToText,
}) => {
  const router = useRouter();
  const { t } = useTranslation();
  const [barcode, setBarcode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validateBarcode = (val: string): boolean => {
    const trimmed = val.trim();
    if (!trimmed) {
      setError(t('forms.barcodeEmpty'));
      return false;
    }
    if (!/^\d{8,14}$/.test(trimmed)) {
      setError(t('forms.barcodeInvalid'));
      return false;
    }
    setError(null);
    return true;
  };

  const handleLookup = async () => {
    if (!validateBarcode(barcode)) return;

    setLoading(true);
    setError(null);

    try {
      const prefs = await getDietaryPreferences();
      const product = await fetchProductByBarcode(barcode.trim(), prefs);
      if (product) {
        await saveScanProduct(product);
        onSuccess?.();
        router.push(`/product/${product.id}` as any);
        return;
      }
      const fallback = await resolveProductWithFallback({ barcode: barcode.trim(), prefs });
      if (fallback) {
        await saveScanProduct(fallback.product);
        onSuccess?.();
        router.push(`/product/${fallback.product.id}` as any);
      } else {
        setError(t('forms.barcodeMiss', { code: barcode }));
      }
    } catch {
      setError(t('forms.networkError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[typography.titleSm, styles.title]}>
        {t('forms.barcodeTitle')}
      </Text>
      <Text style={[typography.captionSm, styles.subtitle]}>
        {t('forms.barcodeBody')}
      </Text>

      <Input
        value={barcode}
        onChangeText={(text) => {
          setBarcode(text.replace(/[^0-9]/g, ''));
          if (error) setError(null);
        }}
        placeholder={t('forms.barcodePlaceholder')}
        keyboardType="number-pad"
        maxLength={14}
        leftIcon={<Barcode size={18} color={colors.muted} />}
        error={error || undefined}
        containerStyle={styles.inputContainer}
      />

      <Button
        title={loading ? t('forms.searching') : t('forms.lookupProduct')}
        onPress={handleLookup}
        variant="primary"
        size="md"
        loading={loading}
        fullWidth
        style={styles.submitBtn}
        icon={!loading ? <Search size={16} color={colors.white} /> : undefined}
      />

      {error && onFallbackToText && (
        <Button
          title={t('forms.fallbackAnalyzer')}
          onPress={onFallbackToText}
          variant="outline"
          size="sm"
          fullWidth
          style={styles.fallbackBtn}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xs,
  },
  title: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.xxs,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  submitBtn: {
    marginBottom: spacing.xs,
  },
  fallbackBtn: {
    marginTop: spacing.xs,
  },
});
