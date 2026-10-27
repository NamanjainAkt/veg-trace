import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Sparkles, FileText, CheckCircle2 } from 'lucide-react-native';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing, radius } from '../../design-system/spacing';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { evaluateIngredients, MAX_INGREDIENT_TEXT_LENGTH } from '../../services/ingredientEngine';
import { getDietaryPreferences, saveScanProduct } from '../../services/storage';
import { Product } from '../../types';

export interface RawIngredientAnalyzerFormProps {
  onSuccess?: () => void;
}

const SAMPLE_TEXTS = [
  {
    label: 'E471 Biscuit Label',
    name: 'Digestive Biscuits',
    brand: 'McVitie\'s',
    text: 'Wheat Flour, Palm Oil, Sugar, Wholemeal Wheat Flour, Emulsifier (INS 471), Raising Agents (Sodium Bicarbonate), Salt.',
  },
  {
    label: 'Gelatin Candy Label',
    name: 'Fruity Gummy Drops',
    brand: 'Sweet Treats',
    text: 'Corn Syrup, Sugar, Gelatin (E441), Citric Acid, Natural Flavours, Carmine Color (E120), Carnauba Wax.',
  },
  {
    label: 'Dark Chocolate Label',
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
    } catch (e) {
      setError(t('forms.analyzeError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[typography.titleMd, styles.title]}>
        {t('forms.analyzerTitle')}
      </Text>
      <Text style={[typography.bodySm, styles.subtitle]}>
        {t('forms.analyzerBody')}
      </Text>

      {/* Quick Sample Chips */}
      <View style={styles.samplesSection}>
        <Text style={[typography.micro, styles.samplesTitle]}>
          {t('forms.sampleLabel')}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.samplesScroll}>
          {SAMPLE_TEXTS.map((sample) => (
            <Pressable
              key={sample.label}
              onPress={() => handleApplySample(sample)}
              style={styles.sampleChip}
            >
              <Sparkles size={12} color={colors.primary} />
              <Text style={[typography.captionSm, styles.sampleChipText]}>
                {sample.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <Input
        label={t('forms.productName')}
        value={productName}
        onChangeText={setProductName}
        placeholder={t('forms.productNamePh')}
        containerStyle={styles.field}
      />

      <Input
        label={t('forms.brand')}
        value={brand}
        onChangeText={setBrand}
        placeholder={t('forms.brandPh')}
        containerStyle={styles.field}
      />

      {/* Multi-line Ingredients Text Input */}
      <View style={styles.field}>
        <Text style={[typography.titleSm, styles.label]}>
          {t('forms.ingredients')}
        </Text>
        <View
          style={[
            styles.textareaWrapper,
            { borderColor: error ? colors.error : colors.hairline },
          ]}
        >
          <TextInput
            value={ingredientText}
            onChangeText={(text) => {
              setIngredientText(text);
              if (error) setError(null);
            }}
            placeholder={t('forms.ingredientsPh')}
            placeholderTextColor={colors.mutedSoft}
            multiline
            numberOfLines={4}
            maxLength={5000}
            style={[typography.bodyMd, styles.textarea]}
            textAlignVertical="top"
          />
        </View>
        {error && (
          <Text style={[typography.captionSm, styles.errorText]}>{error}</Text>
        )}
      </View>

      <Button
        title={isSubmitting ? t('forms.analyzing') : t('forms.analyze')}
        icon={<CheckCircle2 size={18} color={colors.white} />}
        onPress={handleAnalyze}
        loading={isSubmitting}
        size="lg"
        fullWidth
        style={styles.analyzeBtn}
      />
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
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  samplesSection: {
    marginBottom: spacing.lg,
  },
  samplesTitle: {
    color: colors.muted,
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
    borderColor: colors.hairline,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  sampleChipText: {
    color: colors.ink,
  },
  field: {
    marginBottom: spacing.md,
  },
  label: {
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  textareaWrapper: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.md,
    borderWidth: 1.5,
    padding: spacing.md,
    minHeight: 110,
  },
  textarea: {
    color: colors.ink,
    minHeight: 90,
  },
  errorText: {
    color: colors.error,
    marginTop: spacing.xs,
  },
  analyzeBtn: {
    marginTop: spacing.sm,
  },
});
