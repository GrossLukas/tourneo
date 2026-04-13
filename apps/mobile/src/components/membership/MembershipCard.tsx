import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TCard } from '../common/TCard';
import { TButton } from '../common/TButton';
import { useAppColors } from '../../hooks/useColorScheme';
import { spacing, fontSize, fontWeight, borderRadius } from '../../theme/spacing';
import { MembershipTierInfo } from '../../store/membershipStore';

interface MembershipCardProps {
  tier: MembershipTierInfo;
  isCurrentTier: boolean;
  onSelect: () => void;
}

export const MembershipCard: React.FC<MembershipCardProps> = ({
  tier,
  isCurrentTier,
  onSelect,
}) => {
  const colors = useAppColors();

  const getTierColor = (): string => {
    switch (tier.tier) {
      case 'club': return colors.membership.club;
      case 'plus': return colors.membership.plus;
      default: return colors.neutral[500];
    }
  };

  const tierColor = getTierColor();

  return (
    <TCard
      variant={tier.highlighted ? 'elevated' : 'outlined'}
      style={[
        styles.card,
        tier.highlighted && { borderWidth: 2, borderColor: tierColor },
        isCurrentTier && { borderWidth: 2, borderColor: colors.status.success },
      ]}
    >
      {tier.highlighted && (
        <View style={[styles.popularBadge, { backgroundColor: tierColor }]}>
          <Text style={styles.popularText}>BELIEBT</Text>
        </View>
      )}

      <View style={styles.header}>
        <Text style={[styles.tierName, { color: tierColor }]}>{tier.name}</Text>
        <View style={styles.priceRow}>
          {tier.price_monthly > 0 ? (
            <>
              <Text style={[styles.price, { color: colors.neutral[900] }]}>
                {tier.price_monthly.toFixed(2)} €
              </Text>
              <Text style={[styles.period, { color: colors.neutral[500] }]}>/Monat</Text>
            </>
          ) : (
            <Text style={[styles.price, { color: colors.neutral[900] }]}>Kostenlos</Text>
          )}
        </View>
      </View>

      {tier.early_access_hours > 0 && (
        <View style={[styles.highlight, { backgroundColor: tierColor + '15' }]}>
          <Text style={[styles.highlightText, { color: tierColor }]}>
            ⏰ {tier.early_access_hours}h Early Access
          </Text>
          <Text style={[styles.highlightText, { color: tierColor }]}>
            💰 {tier.discount_percent}% Rabatt auf Gebühren
          </Text>
        </View>
      )}

      <View style={styles.features}>
        {tier.features.map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <Text style={[styles.featureCheck, { color: tierColor }]}>✓</Text>
            <Text style={[styles.featureText, { color: colors.neutral[700] }]}>{feature}</Text>
          </View>
        ))}
      </View>

      {isCurrentTier ? (
        <View style={[styles.currentBadge, { backgroundColor: colors.status.success + '20' }]}>
          <Text style={[styles.currentText, { color: colors.status.success }]}>
            ✓ Aktueller Plan
          </Text>
        </View>
      ) : (
        <TButton
          title={tier.tier === 'free' ? 'Aktueller Plan' : `${tier.name} wählen`}
          onPress={onSelect}
          variant={tier.highlighted ? 'primary' : 'outline'}
          disabled={tier.tier === 'free'}
        />
      )}
    </TCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxs,
    borderBottomLeftRadius: borderRadius.md,
  },
  popularText: {
    color: '#FFFFFF',
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.bold as any,
    letterSpacing: 1,
  },
  header: {
    marginBottom: spacing.md,
  },
  tierName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold as any,
    marginBottom: spacing.xxs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold as any,
  },
  period: {
    fontSize: fontSize.sm,
    marginLeft: spacing.xxs,
  },
  highlight: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  highlightText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium as any,
    marginBottom: 2,
  },
  features: {
    marginBottom: spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  featureCheck: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold as any,
    marginRight: spacing.sm,
    width: 20,
  },
  featureText: {
    fontSize: fontSize.sm,
    flex: 1,
    lineHeight: 20,
  },
  currentBadge: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  currentText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold as any,
  },
});