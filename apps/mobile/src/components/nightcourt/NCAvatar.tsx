/**
 * Avatar with hue-driven gradient and centred initials.  Falls back to a
 * single-colour disc if `LinearGradient` is unavailable.
 */
import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fontFamily } from '../../theme/typography';
import { NC } from './tokens';

interface NCAvatarProps {
  name?: string;
  hue?: number;       // 0-360 (HSL hue)
  size?: number;
  ring?: boolean;
  style?: StyleProp<ViewStyle>;
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// Convert hue to two HSL stops that approximate the OKLCH gradient used in
// the prototype (which CSS evaluates client-side).  HSL lookalike works
// well enough on dark backgrounds.
function gradientFor(hue: number): [string, string] {
  const top = `hsl(${hue}, 65%, 55%)`;
  const bottom = `hsl(${(hue + 340) % 360}, 60%, 35%)`;
  return [top, bottom];
}

export const NCAvatar: React.FC<NCAvatarProps> = ({
  name = 'TN',
  hue = 240,
  size = 40,
  ring,
  style,
}) => {
  const [c1, c2] = gradientFor(hue);
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          ...(ring
            ? {
                borderWidth: 2,
                borderColor: NC.primary,
              }
            : null),
        },
        style,
      ]}
    >
      <LinearGradient
        colors={[c1, c2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          StyleSheet.absoluteFillObject,
          {
            borderRadius: size / 2,
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}
      >
        <Text
          style={{
            fontFamily: fontFamily.displayBold,
            fontWeight: '700',
            color: '#FFFFFF',
            fontSize: size * 0.38,
            letterSpacing: -0.3,
            includeFontPadding: false,
          }}
        >
          {initials(name)}
        </Text>
      </LinearGradient>
    </View>
  );
};
