/**
 * Screen container with a faint indigo glow at the top of the page.  All
 * Night Court screens wrap their root in `<NCScreen>` so the gradient is
 * applied uniformly.
 */
import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NC } from './tokens';

interface NCScreenProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const NCScreen: React.FC<NCScreenProps> = ({ children, style }) => {
  return (
    <View style={[styles.root, style]}>
      <LinearGradient
        colors={['rgba(99,102,241,0.22)', 'rgba(99,102,241,0)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.glow}
        pointerEvents="none"
      />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: NC.bg },
  glow: {
    position: 'absolute',
    top: -160,
    left: '50%',
    width: 520,
    height: 320,
    marginLeft: -260,
    borderRadius: 260,
    opacity: 0.9,
  },
});
