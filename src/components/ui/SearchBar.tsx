import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  ViewStyle,
} from 'react-native';
import { Search, X } from 'lucide-react-native';
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
  return (
    <View style={[styles.container, shadows.subtle, style]}>
      <Search size={20} color={colors.muted} style={styles.searchIcon} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedSoft}
        style={[typography.bodyMd, styles.input]}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => {
            onChangeText('');
            onClear?.();
          }}
          accessibilityLabel="Clear search input"
          accessibilityRole="button"
          hitSlop={8}
          style={styles.clearButton}
        >
          <X size={16} color={colors.muted} />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52, // Generous Airbnb-style touch bar
    backgroundColor: colors.canvas,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: spacing.lg,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    height: '100%',
    color: colors.ink,
    paddingVertical: 0,
  },
  clearButton: {
    padding: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceStrong,
  },
});
