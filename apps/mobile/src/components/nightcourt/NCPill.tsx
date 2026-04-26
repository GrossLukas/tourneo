import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { fontFamily } from '../../theme/typography';
import { NC } from './tokens';

interface NCPillProps {
  children: string;
  color?: string;
  bg?: string;
  dot?: boolean;
  dotColor?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Uppercase 10-px pill badge used for tags ("MEMBER −10%", "FEATURED" etc).
 */
export const NCPill: React.FC<NCPillProps> = ({
  children,
  color = NC.primaryLight,
  bg = NC.primaryBg,
  dot,
  dotColor,
  style,
}) => {
  return (
    <View style={[styles.pill, { backgroundColor: bg }, style]}>
      {dot && <View style={[styles.dot, { backgroundColor: dotColor || color }]} />}
      <Text style={[styles.text, { color }]}>{children}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    alignSelf: 'flex-start',
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 999 },
  text: {
    fontFamily: fontFamily.uiSemibold,
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
