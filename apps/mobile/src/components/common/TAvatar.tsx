import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { fontWeight } from '../../theme/spacing';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface TAvatarProps {
  uri?: string | null;
  name?: string;
  size?: AvatarSize;
  membershipTier?: 'free' | 'plus' | 'club';
}

const SIZES: Record<AvatarSize, number> = {
  sm: 32,
  md: 44,
  lg: 64,
  xl: 96,
};

const FONT_SIZES: Record<AvatarSize, number> = {
  sm: 12,
  md: 16,
  lg: 24,
  xl: 36,
};

export const TAvatar: React.FC<TAvatarProps> = ({
  uri,
  name,
  size = 'md',
  membershipTier,
}) => {
  const { colors } = useTheme();
  const dimension = SIZES[size];
  const fSize = FONT_SIZES[size];

  const getInitials = (n?: string): string => {
    if (!n) return '?';
    const parts = n.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return n[0].toUpperCase();
  };

  const getBorderColor = (): string | undefined => {
    // Night Court: every avatar gets an Indigo ring; tiers tint it
    if (membershipTier === 'club') return '#F59E0B';
    if (membershipTier === 'plus') return '#818CF8';
    return '#6366F1';
  };

  const borderColor = getBorderColor();

  return (
    <View
      style={[
        styles.container,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
          backgroundColor: 'rgba(99,102,241,0.15)',
          borderWidth: 3,
          borderColor: borderColor || '#6366F1',
        },
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{
            width: dimension - 6,
            height: dimension - 6,
            borderRadius: dimension / 2,
          }}
        />
      ) : (
        <Text
          style={[
            styles.initials,
            {
              fontSize: fSize,
              color: '#FFFFFF',
            },
          ]}
        >
          {getInitials(name)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  initials: {
    fontWeight: fontWeight.semibold as any,
  },
});