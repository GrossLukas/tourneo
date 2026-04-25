/**
 * 2×2 grid tile with a coloured-gradient icon square.  `hue` drives the
 * gradient: 260 = indigo, 140 = green, 200 = teal, 40 = gold.
 */
import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fontFamily } from '../../theme/typography';
import { NC } from './tokens';
import { NCIcon, type IconName } from './NCIcon';

interface NCQuickTileProps {
  icon: IconName;
  label: string;
  sub?: string;
  hue?: number;
  onPress?: () => void;
}

function gradientFor(hue: number): [string, string] {
  return [`hsl(${hue}, 65%, 55%)`, `hsl(${(hue + 340) % 360}, 60%, 35%)`];
}

export const NCQuickTile: React.FC<NCQuickTileProps> = ({
  icon,
  label,
  sub,
  hue = 260,
  onPress,
}) => {
  const [c1, c2] = gradientFor(hue);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && { opacity: 0.85 }]}
    >
      <LinearGradient
        colors={[c1, c2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.iconBox}
      >
        <NCIcon name={icon} size={18} color="#FFFFFF" strokeWidth={2.2} />
      </LinearGradient>
      <View>
        <Text style={styles.label}>{label}</Text>
        {sub ? <Text style={styles.sub}>{sub}</Text> : null}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: NC.bgCard,
    borderWidth: 1,
    borderColor: NC.border,
    borderRadius: 18,
    padding: 14,
    minHeight: 94,
    gap: 10,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: fontFamily.displayBold,
    fontWeight: '700',
    fontSize: 14,
    color: NC.textP,
    letterSpacing: -0.2,
  },
  sub: {
    marginTop: 2,
    fontFamily: fontFamily.uiMedium,
    fontSize: 11.5,
    color: NC.textS,
  },
});
