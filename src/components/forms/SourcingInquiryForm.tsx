import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Send, CheckCircle2 } from 'lucide-react-native';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { saveSourcingInquiry } from '../../services/storage';
import { useTranslation } from 'react-i18next';

export interface SourcingInquiryFormProps {
  initialAdditive?: string;
  onSuccess?: () => void;
}

export const SourcingInquiryForm: React.FC<SourcingInquiryFormProps> = ({
  initialAdditive = '',
  onSuccess,
}) => {
  const [additiveCode, setAdditiveCode] = useState(initialAdditive);
  const [brand, setBrand] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    return () => {
      if (successTimer.current) clearTimeout(successTimer.current);
    };
  }, []);

  const handleSubmit = async () => {
    if (!additiveCode.trim()) {
      setError(t('forms.inquiryAdditive'));
      return;
    }
    if (!evidenceUrl.trim() && !notes.trim()) {
      setError(t('forms.inquiryEvidence'));
      return;
    }
    if (evidenceUrl.trim() && !/^https:\/\/[^\s]+$/.test(evidenceUrl.trim())) {
      setError(t('forms.inquiryUrl'));
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      await saveSourcingInquiry({ additiveCode, brand, evidenceUrl, notes });
      setSubmitted(true);
      successTimer.current = setTimeout(() => {
        onSuccess?.();
      }, 1800);
    } catch {
      setError(t('forms.inquirySaveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  if (submitted) {
    return (
      <View style={styles.successContainer}>
        <CheckCircle2 size={44} color={colors.success} />
        <Text style={[typography.titleMd, styles.successTitle]}>
          {t('forms.submitted')}
        </Text>
        <Text style={[typography.bodySm, styles.successSubtitle]}>
          {t('forms.submittedBody')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[typography.titleMd, styles.title]}>
        {t('forms.inquiryTitle')}
      </Text>
      <Text style={[typography.bodySm, styles.subtitle]}>
        {t('forms.inquiryBody')}
      </Text>

      <Input
        label={t('forms.additiveCode')}
        value={additiveCode}
        onChangeText={setAdditiveCode}
        placeholder="e.g. E471, INS 472e"
        containerStyle={styles.field}
      />

      <Input
        label={t('forms.brandProduct')}
        value={brand}
        onChangeText={setBrand}
        placeholder="e.g. Oreo / Cadbury / Local Bakery"
        containerStyle={styles.field}
      />

      <Input
        label={t('forms.refUrl')}
        value={evidenceUrl}
        onChangeText={setEvidenceUrl}
        placeholder="https://brand.com/faq or public certificate link"
        keyboardType="url"
        autoCapitalize="none"
        containerStyle={styles.field}
      />

      <Input
        label={t('forms.notes')}
        value={notes}
        onChangeText={setNotes}
        placeholder="Excerpt from customer care response or packaging certification..."
        multiline
        numberOfLines={3}
        error={error || undefined}
        containerStyle={styles.field}
      />

      <Button
        title={t('forms.submit')}
        icon={<Send size={16} color={colors.white} />}
        onPress={handleSubmit}
        disabled={isSaving}
        loading={isSaving}
        size="lg"
        fullWidth
        style={styles.btn}
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
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  field: {
    marginBottom: spacing.md,
  },
  btn: {
    marginTop: spacing.sm,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  successTitle: {
    color: colors.ink,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  successSubtitle: {
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
