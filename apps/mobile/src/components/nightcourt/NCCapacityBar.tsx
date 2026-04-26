/**
 * Slim progress bar with an animated fill on mount.  Switches to a coral
 * gradient when the fill ratio exceeds 85 % (the design rule for "almost
 * full").
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NC } from './tokens';

interface NCCapacityBarProps {
  /** 0 - 100 */
  fill: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export const NCCapacityBar: React.FC<NCCapacityBarProps> = ({
  fill,
  height = 6,
  style,
}) => {
  const w = useRef(new Animated.Value(0)).current;
  const target = Math.max(0, Math.min(100, fill));
  const isHot = target > 85;

  useEffect(() => {
    Animated.timing(w, {
      toValue: target,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [target, w]);

  const widthStyle = w.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'] as unknown as [number, number],
  }) as unknown as ViewStyle['width'];

  return (
    <View style={[{ height, backgroundColor: NC.bgInput, borderRadius: 999, overflow: 'hidden' }, style]}>
      <Animated.View style={{ height: '100%', width: widthStyle as any, borderRadius: 999, overflow: 'hidden' }}>
        <LinearGradient
          colors={isHot ? [NC.coral, '#FFA57A'] : [NC.primary, NC.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
};
