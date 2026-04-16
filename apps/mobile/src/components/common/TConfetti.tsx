import React, { useEffect, useRef, useMemo } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';

// ============================================
// TURNEO – TConfetti
// Celebration overlay: 30-40 particles fall
// from the top of the screen with a slight
// horizontal sway.  Auto-cleans up after
// `duration` ms.  Pointer-events: none so it
// never blocks interaction.
// ============================================

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PARTICLE_COUNT = 35;

interface TConfettiProps {
  active: boolean;
  duration?: number;
}

interface Particle {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  color: string;
  size: number;
  borderRadius: number;
}

function useParticles(colors: string[]): Particle[] {
  return useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const size = 6 + Math.random() * 6; // 6 – 12
      return {
        id: i,
        x: new Animated.Value(Math.random() * SCREEN_WIDTH),
        y: new Animated.Value(-20 - Math.random() * 60),
        opacity: new Animated.Value(1),
        color: colors[Math.floor(Math.random() * colors.length)],
        size,
        // Mix circles and squares for visual variety
        borderRadius: Math.random() > 0.5 ? size / 2 : 2,
      };
    });
    // Particles are created once per component mount; color strings are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export function TConfetti({ active, duration = 3000 }: TConfettiProps) {
  const { colors } = useTheme();

  // Build palette from theme — no hardcoded hex
  const palette = useMemo(
    () => [
      colors.primary,
      colors.accent,
      colors.success,
      colors.error,
      colors.info,
    ],
    // Rebuild only when the theme changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [colors.primary, (colors as any).gold ?? colors.accent, colors.success, colors.error, colors.info]
  );

  const particles = useParticles(palette);
  const animationsRef = useRef<Animated.CompositeAnimation[]>([]);

  useEffect(() => {
    if (!active) return;

    // Reset each particle to the top
    particles.forEach((p) => {
      p.x.setValue(Math.random() * SCREEN_WIDTH);
      p.y.setValue(-20 - Math.random() * 60);
      p.opacity.setValue(1);
    });

    // Stagger the start of each particle's fall
    const composites = particles.map((p) => {
      const fallDuration = duration * (0.6 + Math.random() * 0.6); // 60%–120% of total
      const swayAmplitude = 20 + Math.random() * 40;
      const startDelay = Math.random() * (duration * 0.35);
      const startX = (p.x as any)._value as number;

      return Animated.sequence([
        Animated.delay(startDelay),
        Animated.parallel([
          // Fall straight down
          Animated.timing(p.y, {
            toValue: SCREEN_HEIGHT + 20,
            duration: fallDuration,
            useNativeDriver: true,
          }),
          // Horizontal sway using a simple sine approximation:
          // go left → right → left during the fall
          Animated.sequence([
            Animated.timing(p.x, {
              toValue: startX - swayAmplitude,
              duration: fallDuration / 3,
              useNativeDriver: true,
            }),
            Animated.timing(p.x, {
              toValue: startX + swayAmplitude,
              duration: fallDuration / 3,
              useNativeDriver: true,
            }),
            Animated.timing(p.x, {
              toValue: startX,
              duration: fallDuration / 3,
              useNativeDriver: true,
            }),
          ]),
          // Fade out in the last 30% of the fall
          Animated.sequence([
            Animated.delay(fallDuration * 0.7),
            Animated.timing(p.opacity, {
              toValue: 0,
              duration: fallDuration * 0.3,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]);
    });

    composites.forEach((anim) => anim.start());
    animationsRef.current = composites;

    return () => {
      composites.forEach((anim) => anim.stop());
    };
  }, [active, duration, particles]);

  if (!active) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p) => (
        <Animated.View
          key={p.id}
          style={[
            styles.particle,
            {
              width: p.size,
              height: p.size,
              borderRadius: p.borderRadius,
              backgroundColor: p.color,
              transform: [
                { translateX: p.x },
                { translateY: p.y },
              ],
              opacity: p.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
