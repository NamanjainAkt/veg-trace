import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  ViewStyle,
} from 'react-native';
import { Search, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing, radius, shadows } from '../../design-system/spacing';

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  placeholder?: string;
  style?: ViewStyle;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  onClear,
  placeholder = 'Search by E-number, INS, or ingredient name...',
  style,
}) => {
  const handleClear = () => {
    try {
      void Haptics.selectionAsync();
    } catch {}
    onChangeText('');
    onClear?.();
  };

  return (
    <View style={[styles.container, shadows.subtle, style]}>
      <Search size={16} color={colors.muted} style={styles.searchIcon} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedSoft}
        style={[typography.bodySm, styles.input]}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <Pressable
          onPress={handleClear}
          accessibilityLabel="Clear search input"
          accessibilityRole="button"
          hitSlop={6}
          style={styles.clearButton}
        >
          <X size={14} color={colors.muted} />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    backgroundColor: colors.canvas,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
    paddingHorizontal: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.xs,
  },
  input: {
    flex: 1,
    height: '100%',
    color: colors.ink,
    fontSize: 14,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 3,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
