/**
 * TRatingBadge – Displays a player's ELO tier and rating as a colored badge.
 * Supports small (inline) and large (profile) variants.
 */
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { getTierColor, getTierBgColor, type RatingTier } from '../../store/ratingStore';
import { fontSize, fontWeight, radius, spacing } from '../../theme/spacing';

interface TRatingBadgeProps {
  elo: number;
  tier: RatingTier;
  rank?: number;
  size?: 'sm' | 'md' | 'lg';
  showElo?: boolean;
  showTierLabel?: boolean;
  animated?: boolean;
}

const tierIcons: Record<RatingTier, string> = {
  bronze: 'shield-outline',
  silver: 'shield-half-outline',
  gold: 'shield',
  platinum: 'diamond-outline',
  diamond: 'diamond',
};

export function TRatingBadge({
  elo,
  tier,
  rank,
  size = 'md',
  showElo = true,
  showTierLabel = false,
  animated = true,
}: TRatingBadgeProps) {
  const { t } = useTranslation();
  const scale = useSharedValue(animated ? 0.8 : 1);
  const color = getTierColor(tier);
  const bgColor = getTierBgColor(tier);

  useEffect(() => {
    if (animated) {
      scale.value = withSpring(1, { damping: 8, stiffness: 150 });
    }
  }, [elo]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const iconSize = size === 'lg' ? 20 : size === 'md' ? 16 : 12;
  const eloFontSize = size === 'lg' ? fontSize.md : size === 'md' ? fontSize.sm : fontSize.xxs;
  const containerPadH = size === 'lg' ? spacing.md : size === 'md' ? spacing.sm : 6;
  const containerPadV = size === 'lg' ? spacing.sm : size === 'md' ? 4 : 2;

  return (
    <Animated.View style={animStyle}>
      <View style={[
        styles.container,
        { backgroundColor: bgColor, paddingHorizontal: containerPadH, paddingVertical: containerPadV },
      ]}>
        <Ionicons name={tierIcons[tier] as any} size={iconSize} color={color} />
        {showElo && (
          <Text style={[styles.eloText, { color, fontSize: eloFontSize }]}>{elo}</Text>
        )}
        {showTierLabel && (
          <Text style={[styles.tierLabel, { color }]}>
            {t(`rating.${tier}`)}
          </Text>
        )}
        {rank !== undefined && rank > 0 && size === 'lg' && (
          <Text style={[styles.rankText, { color }]}>
            #{rank}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.full,
    gap: 4,
  },
  eloText: {
    fontWeight: fontWeight.bold as any,
  },
  tierLabel: {
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.semibold as any,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  rankText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold as any,
    marginLeft: 2,
  },
});