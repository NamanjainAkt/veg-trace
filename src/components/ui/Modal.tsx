import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  StyleSheet,
  Pressable,
  TouchableWithoutFeedback,
  ViewStyle,
} from 'react-native';
import { X } from 'lucide-react-native';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing, radius, shadows } from '../../design-system/spacing';

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  containerStyle?: ViewStyle;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  children,
  containerStyle,
}) => {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.dialog, shadows.floating, containerStyle]}>
              <View style={styles.header}>
                <Text style={[typography.titleMd, styles.title]}>{title}</Text>
                <Pressable
                  onPress={onClose}
                  hitSlop={8}
                  style={styles.closeBtn}
                  accessibilityLabel="Close modal"
                >
                  <X size={20} color={colors.ink} />
                </Pressable>
              </View>
              <View style={styles.body}>{children}</View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  dialog: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.canvas,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineSoft,
  },
  title: {
    color: colors.ink,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: spacing.xl,
  },
});
