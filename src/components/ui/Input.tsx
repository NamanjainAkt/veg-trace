import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing, radius } from '../../design-system/spacing';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  containerStyle,
  style,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[typography.titleSm, styles.label]}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          {
            borderColor: error
              ? colors.error
              : isFocused
              ? colors.ink
              : colors.hairline,
            backgroundColor: colors.surfaceSoft,
          },
        ]}
      >
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
        <TextInput
          placeholderTextColor={colors.mutedSoft}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[
            typography.bodyMd,
            styles.input,
            { color: colors.ink },
            style,
          ]}
          {...props}
        />
        {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
      </View>
      {error ? (
        <Text style={[typography.captionSm, styles.errorText]}>{error}</Text>
      ) : helperText ? (
        <Text style={[typography.captionSm, styles.helperText]}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48, // 48px touch target
    borderRadius: radius.md,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingVertical: 0,
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
  errorText: {
    color: colors.error,
    marginTop: spacing.xs,
  },
  helperText: {
    color: colors.muted,
    marginTop: spacing.xs,
  },
});
