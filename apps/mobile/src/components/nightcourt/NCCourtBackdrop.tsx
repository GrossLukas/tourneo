/**
 * The decorative court-diagram + indigo/gold radial-gradient placeholder
 * used as a hero for the home and event screens.  Pure background — no
 * children rendered.
 */
import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Rect, Line } from 'react-native-svg';

interface NCCourtBackdropProps {
  height?: number;
  style?: StyleProp<ViewStyle>;
  /** When true, the diagram lines are drawn larger (event hero) */
  large?: boolean;
}

export const NCCourtBackdrop: React.FC<NCCourtBackdropProps> = ({
  height = 160,
  style,
  large = false,
}) => {
  return (
    <View style={[{ height, overflow: 'hidden' }, style]}>
      {/* Base gradient */}
      <LinearGradient
        colors={['#1A1A3D', '#0D0D1A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* indigo glow top-left */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -40,
          left: -40,
          width: '70%',
          height: '70%',
          borderRadius: 999,
          backgroundColor: 'rgba(99,102,241,0.45)',
          opacity: 0.7,
        }}
      />
      {/* gold glow bottom-right */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          bottom: -40,
          right: -40,
          width: '60%',
          height: '60%',
          borderRadius: 999,
          backgroundColor: 'rgba(245,158,11,0.3)',
          opacity: 0.7,
        }}
      />
      {/* court diagram overlay */}
      <Svg
        width="100%"
        height="100%"
        viewBox={large ? '0 0 400 340' : '0 0 360 160'}
        preserveAspectRatio="none"
        style={[StyleSheet.absoluteFill, { opacity: 0.22 }]}
      >
        {large ? (
          <>
            <Rect x={40} y={60} width={320} height={220} rx={4} stroke="#A5B4FC" strokeWidth={1.5} fill="none" />
            <Line x1={200} y1={60} x2={200} y2={280} stroke="#A5B4FC" strokeWidth={1.5} />
            <Line x1={40} y1={170} x2={360} y2={170} stroke="#A5B4FC" strokeWidth={1.5} />
            <Line x1={110} y1={60} x2={110} y2={280} stroke="#A5B4FC" strokeWidth={0.8} />
            <Line x1={290} y1={60} x2={290} y2={280} stroke="#A5B4FC" strokeWidth={0.8} />
          </>
        ) : (
          <>
            <Rect x={40} y={24} width={280} height={112} rx={4} stroke="#818CF8" strokeWidth={1.2} fill="none" />
            <Line x1={180} y1={24} x2={180} y2={136} stroke="#818CF8" strokeWidth={1.2} />
            <Line x1={40} y1={80} x2={320} y2={80} stroke="#818CF8" strokeWidth={1.2} />
            <Line x1={100} y1={24} x2={100} y2={136} stroke="#818CF8" strokeWidth={0.6} />
            <Line x1={260} y1={24} x2={260} y2={136} stroke="#818CF8" strokeWidth={0.6} />
          </>
        )}
      </Svg>
    </View>
  );
};
