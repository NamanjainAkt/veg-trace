import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Sparkles, FileText } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing, radius } from '../../design-system/spacing';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { PressableScale } from '../ui/PressableScale';
import { evaluateIngredients, MAX_INGREDIENT_TEXT_LENGTH } from '../../services/ingredientEngine';
import { getDietaryPreferences, saveScanProduct } from '../../services/storage';
import { Product } from '../../types';

export interface RawIngredientAnalyzerFormProps {
  onSuccess?: () => void;
}

const SAMPLE_TEXTS = [
  {
    label: 'E471 Biscuit',
    name: 'Digestive Biscuits',
    brand: 'McVitie\'s',
    text: 'Wheat Flour, Palm Oil, Sugar, Wholemeal Wheat Flour, Emulsifier (INS 471), Raising Agents (Sodium Bicarbonate), Salt.',
  },
  {
    label: 'Gelatin Candy',
    name: 'Fruity Gummy Drops',
    brand: 'Sweet Treats',
    text: 'Corn Syrup, Sugar, Gelatin (E441), Citric Acid, Natural Flavours, Carmine Color (E120), Carnauba Wax.',
  },
  {
    label: 'Dark Chocolate',
    name: '70% Dark Chocolate',
    brand: 'Pure Cacao',
    text: 'Cocoa Mass, Cane Sugar, Cocoa Butter, Emulsifier (Soy Lecithin INS 322), Vanilla Extract.',
  },
];

export const RawIngredientAnalyzerForm: React.FC<RawIngredientAnalyzerFormProps> = ({
  onSuccess,
}) => {
  const router = useRouter();
  const { t } = useTranslation();
  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [ingredientText, setIngredientText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApplySample = (sample: typeof SAMPLE_TEXTS[0]) => {
    try {
      void Haptics.selectionAsync();
    } catch {}
    setProductName(sample.name);
    setBrand(sample.brand);
    setIngredientText(sample.text);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!ingredientText.trim()) {
      setError(t('forms.ingredientsEmpty'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const prefs = await getDietaryPreferences();
      const evaluation = evaluateIngredients(ingredientText, prefs);
      const generatedId = `custom-${Date.now()}`;

      const newProduct: Product = {
        id: generatedId,
        barcode: `custom-${Math.floor(100000000000 + Math.random() * 900000000000)}`,
        name: productName.trim() || 'Custom Food Product',
        brand: brand.trim() || 'Packaged Brand',
        imageUrl: undefined,
        verdict: evaluation.verdict,
        confidence: evaluation.confidence,
        ingredients: evaluation.ingredients,
        rawIngredientText: ingredientText.trim().slice(0, MAX_INGREDIENT_TEXT_LENGTH),
        summary: evaluation.summary,
        scannedAt: new Date().toISOString(),
        isCachedOffline: true,
      };

      await saveScanProduct(newProduct);
      onSuccess?.();
      router.push(`/product/${newProduct.id}` as any);
    } catch {
      setError(t('forms.analyzeError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={[typography.titleSm, styles.title]}>
        {t('forms.analyzerTitle')}
      </Text>
      <Text style={[typography.captionSm, styles.subtitle]}>
        {t('forms.analyzerBody')}
      </Text>

      {/* Quick Sample Presets */}
      <View style={styles.samplesWrapper}>
        <Text style={[typography.micro, styles.samplesLabel]}>
          {t('forms.quickSamples')}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.samplesScroll}
        >
          {SAMPLE_TEXTS.map((sample) => (
            <PressableScale
              key={sample.label}
              onPress={() => handleApplySample(sample)}
              scaleTo={0.96}
              haptic
            >
              <View style={styles.sampleChip}>
                <Sparkles size={11} color={colors.primary} />
                <Text style={[typography.micro, styles.sampleChipText]}>
                  {sample.label}
                </Text>
              </View>
            </PressableScale>
          ))}
        </ScrollView>
      </View>

      <Input
        label={t('forms.productName')}
        value={productName}
        onChangeText={setProductName}
        placeholder={t('forms.productPlaceholder')}
        containerStyle={styles.inputField}
      />

      <Input
        label={t('forms.brandName')}
        value={brand}
        onChangeText={setBrand}
        placeholder={t('forms.brandPlaceholder')}
        containerStyle={styles.inputField}
      />

      <View style={styles.textareaWrapper}>
        <Text style={[typography.caption, styles.fieldLabel]}>
          {t('forms.ingredientLabelText')}
        </Text>
        <View
          style={[
            styles.textareaContainer,
            error ? { borderColor: colors.error } : null,
          ]}
        >
          <TextInput
            value={ingredientText}
            onChangeText={(txt) => {
              setIngredientText(txt);
              if (error) setError(null);
            }}
            placeholder={t('forms.ingredientsPlaceholder')}
            placeholderTextColor={colors.mutedSoft}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={MAX_INGREDIENT_TEXT_LENGTH}
            style={[typography.bodySm, styles.textarea]}
          />
        </View>
        <View style={styles.textareaFooter}>
          {error ? (
            <Text style={[typography.micro, styles.errorText]}>{error}</Text>
          ) : (
            <View />
          )}
          <Text style={[typography.micro, styles.charCounter]}>
            {ingredientText.length}/{MAX_INGREDIENT_TEXT_LENGTH}
          </Text>
        </View>
      </View>

      <Button
        title={isSubmitting ? t('forms.analyzing') : t('forms.analyzeAction')}
        onPress={handleAnalyze}
        variant="primary"
        size="md"
        loading={isSubmitting}
        fullWidth
        style={styles.submitBtn}
        icon={!isSubmitting ? <FileText size={16} color={colors.white} /> : undefined}
      />
    </ScrollView>
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
    marginBottom: spacing.sm,
  },
  samplesWrapper: {
    marginBottom: spacing.sm,
  },
  samplesLabel: {
    color: colors.muted,
    fontSize: 11,
    marginBottom: spacing.xs,
  },
  samplesScroll: {
    gap: spacing.xs,
  },
  sampleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  sampleChipText: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: '600',
  },
  inputField: {
    marginBottom: spacing.xs,
  },
  textareaWrapper: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.xxs + 2,
  },
  textareaContainer: {
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.md,
    padding: spacing.sm,
    minHeight: 80,
  },
  textarea: {
    color: colors.ink,
    fontSize: 13,
    lineHeight: 18,
    height: 72,
    padding: 0,
  },
  textareaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xxs,
  },
  errorText: {
    color: colors.error,
    fontSize: 11,
  },
  charCounter: {
    color: colors.mutedSoft,
    fontSize: 11,
    alignSelf: 'flex-end',
  },
  submitBtn: {
    marginBottom: spacing.sm,
  },
});
