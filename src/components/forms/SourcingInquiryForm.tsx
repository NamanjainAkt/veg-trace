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
      }, 1600);
    } catch {
      setError(t('forms.inquirySaveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  if (submitted) {
    return (
      <View style={styles.successContainer}>
        <CheckCircle2 size={36} color={colors.success} />
        <Text style={[typography.titleSm, styles.successTitle]}>
          {t('forms.submitted')}
        </Text>
        <Text style={[typography.captionSm, styles.successSubtitle]}>
          {t('forms.submittedBody')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[typography.titleSm, styles.title]}>
        {t('forms.inquiryTitle')}
      </Text>
      <Text style={[typography.captionSm, styles.subtitle]}>
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
        placeholder="e.g. Parle-G, McVitie's"
        containerStyle={styles.field}
      />

      <Input
        label={t('forms.disclosureUrl')}
        value={evidenceUrl}
        onChangeText={setEvidenceUrl}
        placeholder="https://..."
        autoCapitalize="none"
        keyboardType="url"
        helperText={t('forms.disclosureUrlHelper')}
        containerStyle={styles.field}
      />

      <Input
        label={t('forms.additionalEvidence')}
        value={notes}
        onChangeText={setNotes}
        placeholder={t('forms.evidencePlaceholder')}
        multiline
        numberOfLines={2}
        containerStyle={styles.field}
      />

      {error ? (
        <Text style={[typography.captionSm, styles.errorText]}>{error}</Text>
      ) : null}

      <Button
        title={isSaving ? t('forms.submitting') : t('forms.submitAudit')}
        onPress={handleSubmit}
        variant="primary"
        size="md"
        loading={isSaving}
        fullWidth
        style={styles.submitBtn}
        icon={!isSaving ? <Send size={15} color={colors.white} /> : undefined}
      />
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
    marginBottom: spacing.sm,
  },
  field: {
    marginBottom: spacing.xs,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  submitBtn: {
    marginTop: spacing.xs,
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  successTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
    marginTop: spacing.sm,
    marginBottom: spacing.xxs,
  },
  successSubtitle: {
    color: colors.muted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
