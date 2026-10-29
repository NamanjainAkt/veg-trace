import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Linking,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
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
import { motion, springs } from '../../design-system/motion';
import { PressableScale } from '../../components/ui/PressableScale';
import { FadeSlideIn } from '../../components/ui/FadeSlideIn';
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
const CORNER_OUT = 16;
const BEAM_GLOW_HEIGHT = 16;
const BEAM_LINE_HEIGHT = 2;
const FLASH_WAVE = { on: motion.fast, off: motion.base } as const;
const SCAN_BARCODE_TYPES: BarcodeType[] = [
  'ean13',
  'ean8',
  'upc_a',
  'upc_e',
  'code128',
  'code39',
  'qr',
];

/** Animated framing bracket: springs in from CORNER_OUT px outward with an opacity ramp. */
const FrameCorner: React.FC<{
  positionStyle: StyleProp<ViewStyle>;
  dirX: number;
  dirY: number;
}> = ({ positionStyle, dirX, dirY }) => {
  const reduced = useReducedMotion();
  const enter = useSharedValue(reduced ? 1 : 0);

  const cornerStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [
      { translateX: (1 - enter.value) * CORNER_OUT * dirX },
      { translateY: (1 - enter.value) * CORNER_OUT * dirY },
    ],
  }));

  useEffect(() => {
    if (reduced) {
      enter.value = 1;
      return;
    }
    enter.value = 0;
    enter.value = withSpring(1, springs.snap);
    return () => cancelAnimation(enter);
  }, [reduced]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.corner, positionStyle, cornerStyle]}
    />
  );
};

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
  // Honest-progress stage: which real work the processing card is reporting.
  const [stage, setStage] = useState<'idle' | 'lens' | 'registry'>('idle');
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  // Modals for fallback forms
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [showAnalyzerModal, setShowAnalyzerModal] = useState(false);

  const barcodeScannerSettings = useMemo(
    () => (scanMode === 'barcode' ? { barcodeTypes: SCAN_BARCODE_TYPES } : undefined),
    [scanMode]
  );

  const reducedMotion = useReducedMotion();
  const containerRef = useRef<View>(null);
  const frameRef = useRef<View>(null);
  const [frameHeight, setFrameHeight] = useState(0);
  const [frameRect, setFrameRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  // Detection flash: frame pulse on committed barcode detection (one light haptic).
  const frameFlash = useSharedValue(0);
  const frameFlashStyle = useAnimatedStyle(() => ({
    opacity: frameFlash.value,
  }));

  // Scanning beam: ping-pong loop across the frame (barcode mode, idle only).
  const beamPos = useSharedValue(0);
  const beamStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          beamPos.value,
          [0, 1],
          [-frameHeight / 2 + BEAM_GLOW_HEIGHT / 2, frameHeight / 2 - BEAM_GLOW_HEIGHT / 2]
        ),
      },
    ],
  }));

  useEffect(() => {
    cancelAnimation(beamPos);
    beamPos.value = 0;
    if (!reducedMotion && scanMode === 'barcode' && !isProcessing) {
      beamPos.value = withRepeat(
        withTiming(1, {
          duration: motion.scanBeam,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );
    }
    return () => cancelAnimation(beamPos);
  }, [reducedMotion, scanMode, isProcessing]);

  // Live Optical Barcode Handler with OFF → public-web fallback
  const handleBarcodeScanned = useCallback(
    async (result: BarcodeScanningResult) => {
      if (isProcessing || scannedBarcode === result.data) return;
      if (Date.now() - lastScanAt.current < 1500) return;
      lastScanAt.current = Date.now();

      // Detection commit: pulse the scan frame + one light haptic.
      // The 1500ms/dedup guards above ensure this fires once per code.
      if (!reducedMotion) {
        frameFlash.value = 0;
        frameFlash.value = withSequence(
          withTiming(1, { duration: FLASH_WAVE.on }),
          withTiming(0, { duration: FLASH_WAVE.off })
        );
      }
      if (Platform.OS !== 'web') {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      setIsProcessing(true);
      setStage('registry');
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
        setStage('idle');
        setIsProcessing(false);
      } catch (err) {
        if (__DEV__) console.warn('Barcode lookup failed:', err);
        setScanError(t('scan.networkError'));
        setScannedBarcode(null);
        setStage('idle');
        setIsProcessing(false);
      }
    },
    [isProcessing, scannedBarcode, router, t, reducedMotion, frameFlash]
  );

  // Capture button (Label OCR mode): on-device text recognition first,
  // manual label entry as the fallback.
  const handleCapture = async () => {
    setIsProcessing(true);
    setStage('lens');
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
          setStage('registry');
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
      setStage('idle');
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
        <FadeSlideIn style={styles.permissionCard}>
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
        </FadeSlideIn>

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
    <View ref={containerRef} style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torchOn}
        barcodeScannerSettings={barcodeScannerSettings}
        onBarcodeScanned={scanMode === 'barcode' && !isProcessing ? handleBarcodeScanned : undefined}
      />

      {/* Detection flash overlay: sits exactly over the measured scan frame */}
      {frameRect && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.frameFlash,
            {
              left: frameRect.x,
              top: frameRect.y,
              width: frameRect.width,
              height: frameRect.height,
            },
            reducedMotion ? { opacity: 0 } : frameFlashStyle,
          ]}
        />
      )}

      {/* Top Floating Controls */}
      <View style={styles.topControls}>
        <View style={styles.modeToggle}>
          <PressableScale
            onPress={() => {
              setScanMode('barcode');
              setScanError(null);
            }}
            scaleTo={0.96}
            accessibilityRole="button"
            accessibilityLabel={t('scan.barcode')}
            accessibilityState={{ selected: scanMode === 'barcode' }}
          >
            <View style={[styles.modeBtn, scanMode === 'barcode' && styles.modeBtnActive]}>
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
            </View>
          </PressableScale>

          <PressableScale
            onPress={() => {
              setScanMode('ocr');
              setScanError(null);
            }}
            scaleTo={0.96}
            accessibilityRole="button"
            accessibilityLabel={t('scan.ingredientLabel')}
            accessibilityState={{ selected: scanMode === 'ocr' }}
          >
            <View style={[styles.modeBtn, scanMode === 'ocr' && styles.modeBtnActive]}>
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
            </View>
          </PressableScale>
        </View>

        <PressableScale
          onPress={() => setTorchOn(!torchOn)}
          scaleTo={0.96}
          accessibilityLabel={t('scan.toggleTorch')}
        >
          <View
            style={[
              styles.torchBtn,
              { backgroundColor: torchOn ? colors.primary : 'rgba(0,0,0,0.6)' },
            ]}
          >
            <Zap size={20} color={colors.white} />
          </View>
        </PressableScale>
      </View>

      {/* Framing Guides Overlay */}
      <View style={styles.frameContainer}>
        {isProcessing ? (
          <FadeSlideIn style={styles.processingCard}>
            <View style={styles.processingStageRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[typography.titleSm, styles.processingText]}>
                {stage === 'registry'
                  ? scannedBarcode
                    ? t('scan.identifiedBarcode', { code: scannedBarcode })
                    : t('scan.stepRegistry')
                  : t('scan.stepReading')}
              </Text>
            </View>
            {stage === 'registry' && (
              <Text style={[typography.captionSm, styles.processingSub]}>
                {t('scan.stepRegistry')}
              </Text>
            )}
          </FadeSlideIn>
        ) : (
          <View
            ref={frameRef}
            style={[
              styles.targetFrame,
              scanMode === 'barcode' && styles.barcodeFrame,
            ]}
            onLayout={({ nativeEvent }) => {
              setFrameHeight(nativeEvent.layout.height);
              const layout = frameRef.current;
              const container = containerRef.current;
              if (!layout || !container) return;
              layout.measureInWindow((fx, fy, rectW, rectH) => {
                container.measureInWindow((cx, cy) => {
                  if (rectW > 0 && rectH > 0) {
                    setFrameRect({ x: fx - cx, y: fy - cy, width: rectW, height: rectH });
                  }
                });
              });
            }}
          >
            <FrameCorner positionStyle={styles.topLeft} dirX={-1} dirY={-1} />
            <FrameCorner positionStyle={styles.topRight} dirX={1} dirY={-1} />
            <FrameCorner positionStyle={styles.bottomLeft} dirX={-1} dirY={1} />
            <FrameCorner positionStyle={styles.bottomRight} dirX={1} dirY={1} />

            {scanMode === 'barcode' && (
              <Animated.View
                pointerEvents="none"
                style={reducedMotion ? styles.scanBeamStatic : [styles.scanBeam, beamStyle]}
              >
                <LinearGradient
                  style={styles.beamGlowV}
                  colors={['rgba(255,56,92,0)', 'rgba(255,56,92,0.25)', 'rgba(255,56,92,0)']}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                />
                <LinearGradient
                  style={styles.beamGlowH}
                  colors={['rgba(255,56,92,0)', 'rgba(255,56,92,0.22)', 'rgba(255,56,92,0)']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                />
                <View style={styles.beamLine} />
              </Animated.View>
            )}

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
        <PressableScale
          onPress={() => setShowBarcodeModal(true)}
          scaleTo={0.96}
          accessibilityLabel={t('scan.enterBarcode')}
        >
          <View style={styles.bottomIconBtn}>
            <BarcodeIcon size={22} color={colors.white} />
          </View>
        </PressableScale>

        {scanMode === 'ocr' ? (
          <PressableScale
            onPress={handleCapture}
            disabled={isProcessing}
            scaleTo={0.93}
            accessibilityRole="button"
            accessibilityLabel={t('scan.ingredientLabel')}
          >
            <View style={styles.shutterBtn}>
              <View style={styles.shutterInner}>
                <Scan size={30} color={colors.white} />
              </View>
            </View>
          </PressableScale>
        ) : (
          <View style={styles.barcodeLiveIndicator}>
            <View style={styles.pulseDot} />
            <Text style={[typography.micro, { color: colors.white }]}>
              {t('scan.autoActive')}
            </Text>
          </View>
        )}

        <PressableScale
          onPress={() => setShowAnalyzerModal(true)}
          scaleTo={0.96}
          accessibilityLabel={t('scan.pasteIngredients')}
        >
          <View style={styles.bottomIconBtn}>
            <FileText size={20} color={colors.white} />
          </View>
        </PressableScale>
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
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: 'center',
    maxWidth: 360,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
  },
  permissionIconCircle: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  permissionTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.xxs,
  },
  permissionSubtitle: {
    color: colors.muted,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  privacyGuarantee: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    marginBottom: spacing.md,
  },
  privacyGuaranteeText: {
    color: colors.body,
    fontSize: 11,
  },
  permissionBtn: {
    marginBottom: spacing.md,
  },
  fallbackDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.hairlineSoft,
  },
  dividerText: {
    color: colors.mutedSoft,
    fontSize: 11,
    marginHorizontal: spacing.sm,
  },
  manualOptionsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    width: '100%',
  },
  topControls: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.md,
    right: spacing.md,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: radius.full,
    padding: 2,
  },
  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    minHeight: 34,
    borderRadius: radius.full,
  },
  modeBtnActive: {
    backgroundColor: colors.primary,
  },
  torchBtn: {
    width: 38,
    height: 38,
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
  frameFlash: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radius.lg,
    opacity: 0,
  },
  scanBeam: {
    position: 'absolute',
    left: -1,
    right: -1,
    height: BEAM_GLOW_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanBeamStatic: {
    position: 'absolute',
    left: -1,
    right: -1,
    top: '50%',
    height: BEAM_GLOW_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -BEAM_GLOW_HEIGHT / 2 }],
  },
  beamGlowV: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: radius.full,
  },
  beamGlowH: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: radius.full,
  },
  beamLine: {
    width: '100%',
    height: BEAM_LINE_HEIGHT,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,56,92,0.6)',
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
  processingStageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  processingText: {
    color: colors.ink,
    flex: 1,
  },
  processingSub: {
    color: colors.muted,
    marginTop: spacing.xs,
    textAlign: 'center',
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
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomIconBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterBtn: {
    width: 66,
    height: 66,
    borderRadius: radius.full,
    borderWidth: 3,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barcodeLiveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.success,
  },
});
