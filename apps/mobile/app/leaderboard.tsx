/**
 * LeaderboardScreen – Top 50 players with podium visualization.
 * Filterable by sport (Padel / FIFA / Overall). Own rank sticky at bottom.
 */
import React, { useEffect, useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Platform, RefreshControl, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/providers/ThemeProvider';
import { THeader } from '../src/components/common';
import { TRatingBadge } from '../src/components/common/TRatingBadge';
import {
  useRatingStore, getTierColor, type SportCategory, type LeaderboardEntry,
} from '../src/store/ratingStore';
import { spacing, fontSize, fontWeight, radius } from '../src/theme/spacing';

const SPORT_TABS: { key: SportCategory; labelKey: string }[] = [
  { key: 'padel', labelKey: 'rating.padel' },
  { key: 'fifa', labelKey: 'rating.fifa' },
  { key: 'overall', labelKey: 'rating.overall' },
];

function PodiumView({ top3, colors, t }: {
  top3: LeaderboardEntry[];
  colors: ReturnType<typeof useTheme>['colors'];
  t: ReturnType<typeof useTranslation>['t'];
}) {
  const first = top3[0];
  const second = top3[1];
  const third = top3[2];

  const renderPodiumItem = (entry: LeaderboardEntry | undefined, place: number) => {
    if (!entry) return <View style={styles.podiumSlot} />;
    const isFirst = place === 1;
    const height = place === 1 ? 100 : place === 2 ? 76 : 60;
    const podiumColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
    const podiumColor = podiumColors[place - 1];

    return (
      <View style={[styles.podiumSlot, { alignItems: 'center' }]}>
        <View style={[
          styles.podiumAvatar,
          isFirst && styles.podiumAvatarFirst,
          { borderColor: podiumColor },
        ]}>
          {entry.avatar_url ? (
            <Image source={{ uri: entry.avatar_url }} style={styles.podiumAvatarImg} />
          ) : (
            <Ionicons name="person" size={isFirst ? 28 : 22} color={colors.textTertiary} />
          )}
        </View>
        {isFirst && (
          <View style={styles.crownWrap}>
            <Text style={styles.crown}>👑</Text>
          </View>
        )}
        <Text style={[styles.podiumName, { color: colors.textPrimary }]} numberOfLines={1}>
          {entry.display_name}
        </Text>
        <TRatingBadge elo={entry.elo} tier={entry.tier ?? 'bronze'} size="sm" showElo />
        <View style={[styles.podiumBar, { height, backgroundColor: podiumColor }]}>
          <Text style={styles.podiumPlace}>{place}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.podiumContainer}>
      {renderPodiumItem(second, 2)}
      {renderPodiumItem(first, 1)}
      {renderPodiumItem(third, 3)}
    </View>
  );
}

function LeaderboardRow({ entry, isMe, colors }: {
  entry: LeaderboardEntry; isMe: boolean; colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={[
      styles.leaderRow,
      { backgroundColor: isMe ? colors.primaryLight : colors.surface, borderColor: colors.cardBorder },
      isMe && { borderColor: colors.primary, borderWidth: 1.5 },
    ]}>
      <Text style={[styles.rankNum, { color: colors.textTertiary }]}>#{entry.rank}</Text>
      <View style={[styles.rowAvatar, { backgroundColor: colors.bgTertiary }]}>
        {entry.avatar_url ? (
          <Image source={{ uri: entry.avatar_url }} style={styles.rowAvatarImg} />
        ) : (
          <Ionicons name="person" size={18} color={colors.textTertiary} />
        )}
      </View>
      <View style={styles.rowInfo}>
        <Text style={[styles.rowName, { color: colors.textPrimary }]} numberOfLines={1}>
          {entry.display_name}
          {isMe && <Text style={{ color: colors.primary }}> (Du)</Text>}
        </Text>
        <Text style={[styles.rowStats, { color: colors.textTertiary }]}>
          {entry.wins}W / {entry.losses}L
          {entry.streak > 0 ? ` · 🔥${entry.streak}` : ''}
        </Text>
      </View>
      <TRatingBadge elo={entry.elo} tier={entry.tier ?? 'bronze'} size="sm" showElo animated={false} />
    </View>
  );
}

export default function LeaderboardScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const {
    leaderboard, myRating, activeSport, loading,
    fetchLeaderboard, fetchMyRating, setActiveSport,
  } = useRatingStore();

  useEffect(() => {
    fetchLeaderboard();
    fetchMyRating();
  }, [activeSport]);

  const onRefresh = useCallback(async () => {
    await Promise.all([fetchLeaderboard(), fetchMyRating()]);
  }, [activeSport]);

  const handleSportChange = useCallback((sport: SportCategory) => {
    setActiveSport(sport);
  }, []);

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);
  const myUserId = myRating?.user_id;
  const isMyRankInTop50 = myUserId ? leaderboard.some(e => e.user_id === myUserId) : false;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <THeader title={t('rating.leaderboard')} showBack onBack={() => router.back()} />

      {/* Sport tabs */}
      <View style={[styles.tabBar, { borderColor: colors.divider }]}>
        {SPORT_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => handleSportChange(tab.key)}
            style={[
              styles.tab,
              activeSport === tab.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}
          >
            <Text style={[
              styles.tabText,
              { color: activeSport === tab.key ? colors.primary : colors.textTertiary },
            ]}>
              {t(tab.labelKey)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={rest}
        keyExtractor={(item) => String(item.user_id)}
        ListHeaderComponent={
          top3.length > 0 ? <PodiumView top3={top3} colors={colors} t={t} /> : null
        }
        renderItem={({ item }) => (
          <LeaderboardRow entry={item} isMe={item.user_id === myUserId} colors={colors} />
        )}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Sticky own rank */}
      {myRating && !isMyRankInTop50 && (
        <View style={[styles.stickyRank, { backgroundColor: colors.bgElevated, borderTopColor: colors.divider }]}>
          <LeaderboardRow
            entry={{
              user_id: myRating.user_id,
              display_name: myRating.display_name,
              avatar_url: myRating.avatar_url,
              elo: myRating.elo,
              rank: myRating.rank,
              tier: myRating.tier,
              wins: myRating.wins,
              losses: myRating.losses,
              streak: myRating.streak,
            }}
            isMe
            colors={colors}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabBar: {
    flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
  tabText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold as any },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: 120 },

  // Podium
  podiumContainer: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end',
    paddingTop: spacing.xl, paddingBottom: spacing.lg,
  },
  podiumSlot: { flex: 1, alignItems: 'center' },
  podiumAvatar: {
    width: 52, height: 52, borderRadius: 26, borderWidth: 3,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6',
    marginBottom: spacing.xs, overflow: 'hidden',
  },
  podiumAvatarFirst: { width: 64, height: 64, borderRadius: 32, borderWidth: 4 },
  podiumAvatarImg: { width: '100%', height: '100%' },
  crownWrap: { position: 'absolute', top: -12 },
  crown: { fontSize: 20 },
  podiumName: { fontSize: fontSize.xxs, fontWeight: fontWeight.semibold as any, marginBottom: 4, maxWidth: 90, textAlign: 'center' },
  podiumBar: {
    width: 60, borderTopLeftRadius: 8, borderTopRightRadius: 8,
    alignItems: 'center', justifyContent: 'flex-start', paddingTop: 8, marginTop: spacing.sm,
  },
  podiumPlace: { color: '#FFF', fontWeight: '800', fontSize: fontSize.lg },

  // Leaderboard rows
  leaderRow: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.md,
    borderRadius: radius.lg, borderWidth: 1, marginTop: spacing.xs,
  },
  rankNum: { width: 36, fontSize: fontSize.sm, fontWeight: fontWeight.bold as any, textAlign: 'center' },
  rowAvatar: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.sm, overflow: 'hidden',
  },
  rowAvatarImg: { width: 36, height: 36, borderRadius: 18 },
  rowInfo: { flex: 1 },
  rowName: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold as any },
  rowStats: { fontSize: fontSize.xxs, marginTop: 1 },

  // Sticky rank
  stickyRank: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 34 : spacing.sm,
  },
});