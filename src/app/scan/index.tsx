import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  CameraView,
  useCameraPermissions,
  BarcodeScanningResult,
  BarcodeType,
} from 'expo-camera';
import {
  Camera as CameraIcon,
  Barcode as BarcodeIcon,
  Zap,
  Scan,
  ShieldCheck,
  Keyboard,
  FileText,
  AlertCircle,
  Settings as SettingsIcon,
} from 'lucide-react-native';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing, radius, shadows } from '../../design-system/spacing';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ManualBarcodeForm } from '../../components/forms/ManualBarcodeForm';
import { RawIngredientAnalyzerForm } from '../../components/forms/RawIngredientAnalyzerForm';
import { saveScanProduct } from '../../services/storage';
import { usePreferencesStore } from '../../store/usePreferencesStore';
import { resolveProductWithFallback } from '../../services/webFallback';
import { evaluateIngredients, MAX_INGREDIENT_TEXT_LENGTH } from '../../services/ingredientEngine';
import { recognizeLabelText } from '../../services/ocr';
import { Product } from '../../types';

const CORNER_DIM = 24;
const SCAN_BARCODE_TYPES: BarcodeType[] = [
  'ean13',
  'ean8',
  'upc_a',
  'upc_e',
  'code128',
  'code39',
  'qr',
];

export default function ScanScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const cameraRef = useRef<CameraView>(null);

  // Real Camera Permissions from expo-camera
  const [permission, requestPermission] = useCameraPermissions();

  const lastScanAt = useRef(0);

  const handleRequestPermission = async () => {
    if (permission && !permission.canAskAgain) {
      await Linking.openSettings();
    } else {
      await requestPermission();
    }
  };

  const [scanMode, setScanMode] = useState<'ocr' | 'barcode'>('barcode');
  const [torchOn, setTorchOn] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  // Modals for fallback forms
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [showAnalyzerModal, setShowAnalyzerModal] = useState(false);

  const barcodeScannerSettings = useMemo(
    () => (scanMode === 'barcode' ? { barcodeTypes: SCAN_BARCODE_TYPES } : undefined),
    [scanMode]
  );

  // Live Optical Barcode Handler with OFF → public-web fallback
  const handleBarcodeScanned = useCallback(
    async (result: BarcodeScanningResult) => {
      if (isProcessing || scannedBarcode === result.data) return;
      if (Date.now() - lastScanAt.current < 1500) return;
      lastScanAt.current = Date.now();

      setIsProcessing(true);
      setScannedBarcode(result.data);
      setScanError(null);

      try {
        const prefs = usePreferencesStore.getState().prefs;
        const fallback = await resolveProductWithFallback({ barcode: result.data, prefs });
        if (fallback) {
          await saveScanProduct(fallback.product);
          router.replace(`/product/${fallback.product.id}` as any);
          return;
        }
        setScanError(t('scan.notFound', { code: result.data }));
        setScannedBarcode(null);
        setIsProcessing(false);
      } catch (err) {
        if (__DEV__) console.warn('Barcode lookup failed:', err);
        setScanError(t('scan.networkError'));
        setScannedBarcode(null);
        setIsProcessing(false);
      }
    },
    [isProcessing, scannedBarcode, router, t]
  );

  // Capture button (Label OCR mode): on-device text recognition first,
  // manual label entry as the fallback.
  const handleCapture = async () => {
    setIsProcessing(true);
    setScanError(null);
    let resolved = false;
    try {
      if (cameraRef.current && Platform.OS !== 'web') {
        const photo = await cameraRef.current.takePictureAsync({
          skipProcessing: true,
          quality: 0.7,
        });
        const ocr = await recognizeLabelText(photo?.uri ?? '');
        if (ocr) {
          const prefs = usePreferencesStore.getState().prefs;
          const evaluation = evaluateIngredients(ocr.text, prefs);
          const product: Product = {
            id: `ocr-${Date.now()}`,
            barcode: `ocr-${Date.now()}`,
            name: t('scan.ocrProduct'),
            brand: t('scan.ocrBrand'),
            imageUrl: undefined,
            verdict: evaluation.verdict,
            confidence: evaluation.confidence,
            ingredients: evaluation.ingredients,
            rawIngredientText: ocr.text.slice(0, MAX_INGREDIENT_TEXT_LENGTH),
            summary: evaluation.summary,
            scannedAt: new Date().toISOString(),
            isCachedOffline: true,
          };
          await saveScanProduct(product);
          resolved = true;
          router.push(`/product/${product.id}` as any);
        } else {
          setScanError(t('scan.ocrEmpty'));
        }
      }
    } catch (e) {
      if (__DEV__) console.warn('Capture error:', e);
      setScanError(t('scan.captureFailed'));
    } finally {
      setIsProcessing(false);
      if (!resolved) setShowAnalyzerModal(true);
    }
  };

  // 1. Initial Permission Loading State
  if (!permission) {
    return (
      <View style={[styles.permissionContainer, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[typography.bodySm, { color: colors.muted, marginTop: spacing.md }]}>
          {t('scan.checkingCamera')}
        </Text>
      </View>
    );
  }

  // 2. Permission Denied or Not Yet Granted View
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <View style={styles.permissionCard}>
          <View style={styles.permissionIconCircle}>
            <CameraIcon size={36} color={colors.primary} />
          </View>
          <Text style={[typography.titleMd, styles.permissionTitle]}>
            {t('scan.cameraRequired')}
          </Text>
          <Text style={[typography.bodySm, styles.permissionSubtitle]}>
            {t('scan.cameraBody')}
          </Text>

          <View style={styles.privacyGuarantee}>
            <ShieldCheck size={16} color={colors.success} />
            <Text style={[typography.captionSm, styles.privacyGuaranteeText]}>
              {t('scan.privacy')}
            </Text>
          </View>

          <Button
            title={permission && !permission.canAskAgain ? t('scan.openSettings') : t('scan.enableCamera')}
            icon={permission && !permission.canAskAgain ? <SettingsIcon size={18} color={colors.white} /> : undefined}
            onPress={handleRequestPermission}
            size="lg"
            fullWidth
            style={styles.permissionBtn}
          />

          <View style={styles.fallbackDivider}>
            <View style={styles.dividerLine} />
            <Text style={[typography.micro, styles.dividerText]}>{t('scan.manualDivider')}</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.manualOptionsRow}>
            <Button
              title={t('scan.typeBarcode')}
              icon={<Keyboard size={16} color={colors.ink} />}
              variant="outline"
              size="md"
              onPress={() => setShowBarcodeModal(true)}
              style={{ flex: 1 }}
            />
            <Button
              title={t('scan.pasteLabel')}
              icon={<FileText size={16} color={colors.ink} />}
              variant="outline"
              size="md"
              onPress={() => setShowAnalyzerModal(true)}
              style={{ flex: 1 }}
            />
          </View>
        </View>

        {/* Manual Barcode Modal */}
        <Modal
          visible={showBarcodeModal}
          onClose={() => setShowBarcodeModal(false)}
          title={t('forms.barcodeTitle')}
        >
          <ManualBarcodeForm
            onSuccess={() => setShowBarcodeModal(false)}
            onFallbackToText={() => {
              setShowBarcodeModal(false);
              setShowAnalyzerModal(true);
            }}
          />
        </Modal>

        {/* Ingredient Text Analyzer Modal */}
        <Modal
          visible={showAnalyzerModal}
          onClose={() => setShowAnalyzerModal(false)}
          title={t('forms.analyzerTitle')}
        >
          <RawIngredientAnalyzerForm
            onSuccess={() => setShowAnalyzerModal(false)}
          />
        </Modal>
      </View>
    );
  }

  // 2. Real Live Camera View
  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torchOn}
        barcodeScannerSettings={barcodeScannerSettings}
        onBarcodeScanned={scanMode === 'barcode' && !isProcessing ? handleBarcodeScanned : undefined}
      />

      {/* Top Floating Controls */}
      <View style={styles.topControls}>
        <View style={styles.modeToggle}>
          <Pressable
            onPress={() => {
              setScanMode('barcode');
              setScanError(null);
            }}
            style={[
              styles.modeBtn,
              scanMode === 'barcode' && styles.modeBtnActive,
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('scan.barcode')}
            accessibilityState={{ selected: scanMode === 'barcode' }}
          >
            <BarcodeIcon
              size={16}
              color={scanMode === 'barcode' ? colors.white : colors.mutedSoft}
            />
            <Text
              style={[
                typography.micro,
                { color: scanMode === 'barcode' ? colors.white : colors.mutedSoft },
              ]}
            >
              {t('scan.barcode')}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setScanMode('ocr');
              setScanError(null);
            }}
            style={[
              styles.modeBtn,
              scanMode === 'ocr' && styles.modeBtnActive,
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('scan.ingredientLabel')}
            accessibilityState={{ selected: scanMode === 'ocr' }}
          >
            <CameraIcon
              size={16}
              color={scanMode === 'ocr' ? colors.white : colors.mutedSoft}
            />
            <Text
              style={[
                typography.micro,
                { color: scanMode === 'ocr' ? colors.white : colors.mutedSoft },
              ]}
            >
              {t('scan.ingredientLabel')}
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => setTorchOn(!torchOn)}
          style={[
            styles.torchBtn,
            { backgroundColor: torchOn ? colors.primary : 'rgba(0,0,0,0.6)' },
          ]}
          accessibilityLabel={t('scan.toggleTorch')}
        >
          <Zap size={20} color={colors.white} />
        </Pressable>
      </View>

      {/* Framing Guides Overlay */}
      <View style={styles.frameContainer}>
        {isProcessing ? (
          <View style={styles.processingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[typography.titleSm, styles.processingText]}>
              {scannedBarcode
                ? t('scan.identifiedBarcode', { code: scannedBarcode })
                : t('scan.evaluating')}
            </Text>
            <Text style={[typography.captionSm, { color: colors.muted }]}>
              {t('scan.checkingSources')}
            </Text>
          </View>
        ) : (
          <View
            style={[
              styles.targetFrame,
              scanMode === 'barcode' && styles.barcodeFrame,
            ]}
          >
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />

            <View style={styles.reticleCenter}>
              <Text style={styles.reticleGuideText}>
                {scanMode === 'barcode'
                  ? t('scan.alignBarcode')
                  : t('scan.pointAtLabel')}
              </Text>
            </View>
          </View>
        )}

        {scanError ? (
          <View style={styles.errorBanner}>
            <AlertCircle size={16} color={colors.white} />
            <Text style={[typography.captionSm, styles.errorBannerText]}>
              {scanError}
            </Text>
          </View>
        ) : (
          <View style={styles.privacyPill}>
            <ShieldCheck size={14} color={colors.success} />
            <Text style={[typography.micro, styles.privacyPillText]}>
              {t('scan.privacy')}
            </Text>
          </View>
        )}
      </View>

      {/* Bottom Shutter & Controls */}
      <View style={styles.bottomBar}>
        <Pressable
          onPress={() => setShowBarcodeModal(true)}
          style={styles.bottomIconBtn}
          accessibilityLabel={t('scan.enterBarcode')}
        >
          <BarcodeIcon size={22} color={colors.white} />
        </Pressable>

        {scanMode === 'ocr' ? (
          <Pressable
            onPress={handleCapture}
            disabled={isProcessing}
            style={({ pressed }) => [
              styles.shutterBtn,
              { transform: [{ scale: pressed ? 0.93 : 1 }] },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('scan.ingredientLabel')}
          >
            <View style={styles.shutterInner}>
              <Scan size={30} color={colors.white} />
            </View>
          </Pressable>
        ) : (
          <View style={styles.barcodeLiveIndicator}>
            <View style={styles.pulseDot} />
            <Text style={[typography.micro, { color: colors.white }]}>
              {t('scan.autoActive')}
            </Text>
          </View>
        )}

        <Pressable
          onPress={() => setShowAnalyzerModal(true)}
          style={styles.bottomIconBtn}
          accessibilityLabel={t('scan.pasteIngredients')}
        >
          <FileText size={20} color={colors.white} />
        </Pressable>
      </View>

      {/* Manual Barcode Modal */}
      <Modal
        visible={showBarcodeModal}
        onClose={() => setShowBarcodeModal(false)}
        title={t('forms.barcodeTitle')}
      >
        <ManualBarcodeForm
          onSuccess={() => setShowBarcodeModal(false)}
          onFallbackToText={() => {
            setShowBarcodeModal(false);
            setShowAnalyzerModal(true);
          }}
        />
      </Modal>

      {/* Ingredient Text Analyzer Modal */}
      <Modal
        visible={showAnalyzerModal}
        onClose={() => setShowAnalyzerModal(false)}
        title={t('forms.analyzerTitle')}
      >
        <RawIngredientAnalyzerForm
          onSuccess={() => setShowAnalyzerModal(false)}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  permissionCard: {
    backgroundColor: colors.canvas,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    maxWidth: 380,
    width: '100%',
  },
  permissionIconCircle: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  permissionTitle: {
    color: colors.ink,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  permissionSubtitle: {
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  privacyGuarantee: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    marginBottom: spacing.xl,
  },
  privacyGuaranteeText: {
    color: colors.body,
  },
  permissionBtn: {
    marginBottom: spacing.lg,
  },
  fallbackDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.hairline,
  },
  dividerText: {
    color: colors.mutedSoft,
    marginHorizontal: spacing.md,
  },
  manualOptionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  topControls: {
    position: 'absolute',
    top: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: radius.full,
    padding: 3,
  },
  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    minHeight: 48,
    borderRadius: radius.full,
  },
  modeBtnActive: {
    backgroundColor: colors.primary,
  },
  torchBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  targetFrame: {
    width: '100%',
    aspectRatio: 1.2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: radius.lg,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  barcodeFrame: {
    aspectRatio: 2.0,
  },
  corner: {
    position: 'absolute',
    width: CORNER_DIM,
    height: CORNER_DIM,
    borderColor: colors.primary,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: radius.md,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: radius.md,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: radius.md,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: radius.md,
  },
  reticleCenter: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  reticleGuideText: {
    color: '#EEEEEE',
    fontSize: 12,
  },
  processingCard: {
    backgroundColor: colors.canvas,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.md,
  },
  processingText: {
    color: colors.ink,
    marginTop: spacing.md,
    marginBottom: spacing.xxs,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.error,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    marginBottom: spacing.md,
  },
  errorBannerText: {
    color: colors.white,
  },
  privacyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    marginBottom: spacing.md,
  },
  privacyPillText: {
    color: '#FFFFFF',
  },
  manualEntryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  manualChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  manualChipText: {
    color: colors.white,
  },
  bottomBar: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.xl,
    right: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomIconBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterBtn: {
    width: 76,
    height: 76,
    borderRadius: radius.full,
    borderWidth: 4,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barcodeLiveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.success,
  },
});
