import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Barcode, Search, AlertCircle, ArrowRight } from 'lucide-react-native';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing, radius } from '../../design-system/spacing';
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
    } catch (e) {
      setError(t('forms.networkError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[typography.titleMd, styles.title]}>
        {t('forms.barcodeTitle')}
      </Text>
      <Text style={[typography.bodySm, styles.subtitle]}>
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
        leftIcon={<Barcode size={20} color={colors.muted} />}
        error={error || undefined}
        containerStyle={styles.inputContainer}
      />

      <Button
        title={loading ? t('forms.lookingUp') : t('forms.lookup')}
        icon={!loading ? <Search size={18} color={colors.white} /> : undefined}
        onPress={handleLookup}
        disabled={loading || barcode.length < 8}
        loading={loading}
        size="lg"
        fullWidth
        style={styles.submitBtn}
      />

      {error && onFallbackToText && (
        <View style={styles.fallbackBox}>
          <Text style={[typography.captionSm, styles.fallbackPrompt]}>
            {t('forms.notInOff')}
          </Text>
          <Button
            title={t('forms.pasteInstead')}
            variant="outline"
            size="sm"
            onPress={onFallbackToText}
            style={styles.fallbackBtn}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  title: {
    color: colors.ink,
    marginBottom: spacing.xxs,
  },
  subtitle: {
    color: colors.muted,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  submitBtn: {
    marginBottom: spacing.md,
  },
  fallbackBox: {
    backgroundColor: colors.surfaceSoft,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  fallbackPrompt: {
    color: colors.body,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  fallbackBtn: {
    backgroundColor: colors.canvas,
  },
});
