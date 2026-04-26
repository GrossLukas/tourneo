/**
 * Coral "LIVE" pulse used on live match tiles.  The outer ring scales
 * 1 → 2 while fading to transparent on a 1.2 s loop.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { fontFamily } from '../../theme/typography';
import { NC } from './tokens';

interface NCLivePulseProps {
  label?: string;
}

export const NCLivePulse: React.FC<NCLivePulseProps> = ({ label = 'LIVE' }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 2.2,
          duration: 1200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 1200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scale, opacity]);

  return (
    <View style={styles.container}>
      <View style={styles.dotWrap}>
        <Animated.View
          style={[
            styles.dot,
            styles.ring,
            { transform: [{ scale }], opacity },
          ]}
        />
        <View style={styles.dot} />
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: NC.coralBg,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  dotWrap: { width: 7, height: 7, alignItems: 'center', justifyContent: 'center' },
  dot: {
    position: 'absolute',
    width: 7, height: 7, borderRadius: 999,
    backgroundColor: NC.coral,
  },
  ring: { backgroundColor: NC.coral },
  label: {
    fontFamily: fontFamily.uiBold,
    fontSize: 10,
    fontWeight: '800' as const,
    letterSpacing: 1.2,
    color: NC.coral,
  },
});
