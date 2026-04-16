import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { TShimmer } from '../common/TShimmer';
import { spacing, radius } from '../../theme/spacing';

// ============================================
// TURNEO – TurniereSkeleton
// 4 placeholder tournament cards shown while
// the Turniere screen's first fetch is in flight.
// Layout mirrors TournamentCard in turniere.tsx.
// ============================================

function TournamentCardSkeleton() {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      {/* Top badges row */}
      <View style={styles.badgeRow}>
        <TShimmer width={64} height={22} borderRadius={6} />
        <TShimmer width={80} height={22} borderRadius={6} />
      </View>

      {/* Title */}
      <TShimmer width="75%" height={18} borderRadius={6} style={styles.title} />

      {/* Date & venue meta */}
      <TShimmer width="55%" height={13} borderRadius={4} style={styles.metaLine} />
      <TShimmer width="45%" height={13} borderRadius={4} style={styles.metaLine} />

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: colors.divider }]} />

      {/* Bottom: price left, spots meter right */}
      <View style={styles.bottomRow}>
        <View>
          <TShimmer width={52} height={20} borderRadius={6} />
          <TShimmer width={70} height={12} borderRadius={4} style={styles.prizeShimmer} />
        </View>
        <View style={styles.spotsGroup}>
          <TShimmer width={80} height={4} borderRadius={2} />
          <TShimmer width={40} height={11} borderRadius={4} style={styles.spotsText} />
        </View>
      </View>
    </View>
  );
}

export function TurniereSkeleton() {
  const { colors } = useTheme();

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { paddingHorizontal: spacing.lg, paddingBottom: 100 },
      ]}
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
    >
      <TournamentCardSkeleton />
      <View style={styles.separator} />
      <TournamentCardSkeleton />
      <View style={styles.separator} />
      <TournamentCardSkeleton />
      <View style={styles.separator} />
      <TournamentCardSkeleton />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.lg,
  },
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
  },
  separator: {
    height: spacing.sm,
  },

  // Badge row
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },

  // Title
  title: {
    marginBottom: spacing.xs,
  },

  // Meta lines
  metaLine: {
    marginBottom: 6,
  },

  // Hairline divider
  divider: {
    height: StyleSheet.hairlineWidth,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },

  // Bottom row
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  prizeShimmer: {
    marginTop: 6,
  },
  spotsGroup: {
    alignItems: 'flex-end',
  },
  spotsText: {
    marginTop: 4,
  },
});
