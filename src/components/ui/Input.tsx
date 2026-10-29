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
      {label && <Text style={[typography.caption, styles.label]}>{label}</Text>}
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
            typography.bodySm,
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
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.xxs + 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingVertical: 0,
    fontSize: 14,
  },
  iconLeft: {
    marginRight: spacing.xs,
  },
  iconRight: {
    marginLeft: spacing.xs,
  },
  errorText: {
    color: colors.error,
    marginTop: spacing.xxs,
    fontSize: 12,
  },
  helperText: {
    color: colors.muted,
    marginTop: spacing.xxs,
    fontSize: 12,
  },
});
