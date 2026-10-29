import React, { useEffect, useState } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import Animated, {
  FadeInDown,
  useReducedMotion,
} from 'react-native-reanimated';
import { motion } from '../../design-system/motion';

export interface FadeSlideInProps {
  /** Stagger offset in ms for sequenced content. */
  delay?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  /** Disable for one render when the list source stays the same (e.g. item reordering). */
  replayKey?: string | number;
}

/**
 * Fade + 8-12px upward entrance for NON-virtualized content (headers,
 * ScrollView sections, detail cards). Never wrap FlatList rows with this —
 * `entering` on virtualized rows causes scroll jank.
 */
export const FadeSlideIn: React.FC<FadeSlideInProps> = ({
  delay = 0,
  duration = motion.base,
  style,
  children,
  replayKey,
}) => {
  const reduced = useReducedMotion();
  const [key, setKey] = useState(replayKey);

  useEffect(() => {
    setKey(replayKey);
  }, [replayKey]);

  if (reduced) {
    return (
      <View style={style} key={key}>
        {children}
      </View>
    );
  }

  return (
    <Animated.View
      key={key}
      style={style}
      entering={FadeInDown.duration(duration).delay(delay)}
    >
      {children}
    </Animated.View>
  );
};
