/**
 * Indigo sparkline with a final-point pulse.  Animates the inner ring
 * radius and opacity on a 2 s loop.  Mirrors the SVG used in `home.jsx`.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Path, Circle, G } from 'react-native-svg';
import { NC } from './tokens';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface NCSparklineProps {
  data: number[];
  width?: number;
  height?: number;
}

export const NCSparkline: React.FC<NCSparklineProps> = ({
  data,
  width = 310,
  height = 50,
}) => {
  const r = useRef(new Animated.Value(4)).current;
  const o = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(r, {
            toValue: 10,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(r, {
            toValue: 4,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ]),
        Animated.sequence([
          Animated.timing(o, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(o, {
            toValue: 0.4,
            duration: 1000,
            useNativeDriver: false,
          }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [r, o]);

  if (!data || data.length < 2) {
    return <View style={{ height }} />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 4;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (width - pad * 2) + pad;
    const y = height - pad - ((v - min) / range) * (height - pad * 2);
    return [x, y] as const;
  });
  const linePath = pts
    .map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`))
    .join(' ');
  const areaPath = `${linePath} L${width - pad},${height} L${pad},${height} Z`;
  const last = pts[pts.length - 1];

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="ncSparkFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={NC.primary} stopOpacity={0.35} />
          <Stop offset="100%" stopColor={NC.primary} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path d={areaPath} fill="url(#ncSparkFill)" />
      <Path
        d={linePath}
        fill="none"
        stroke={NC.primaryLight}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <G>
        <AnimatedCircle
          cx={last[0]}
          cy={last[1]}
          r={r as unknown as number}
          fill={NC.primary}
          opacity={o as unknown as number}
        />
        <Circle
          cx={last[0]}
          cy={last[1]}
          r={4}
          fill={NC.primaryLight}
          stroke={NC.bg}
          strokeWidth={2}
        />
      </G>
    </Svg>
  );
};
