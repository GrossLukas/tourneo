import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppColors } from '../../src/hooks/useColorScheme';
import { useTheme } from '../../src/providers/ThemeProvider';
import { spacing, fontSize, fontWeight, radius, shadow } from '../../src/theme/spacing';
import { useCommunityStore } from '../../src/store';

// ─── Tab Filter ──────────────────────────────────────────────
type CommunityTab = 'feed' | 'freunde' | 'teams' | 'rangliste';

function TabFilter({
  active,
  onSelect,
  colors,
}: {
  active: CommunityTab;
  onSelect: (tab: CommunityTab) => void;
  colors: ReturnType<typeof useAppColors>;
}) {
  const tabs: { key: CommunityTab; label: string }[] = [
    { key: 'feed', label: 'Feed' },
    { key: 'freunde', label: 'Freunde' },
    { key: 'teams', label: 'Teams' },
    { key: 'rangliste', label: 'Rangliste' },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.tabFilterContainer}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabChip,
              {
                backgroundColor: isActive ? colors.primary : colors.surfaceSecondary,
                borderColor: isActive ? colors.primary : colors.cardBorder,
              },
            ]}
            activeOpacity={0.7}
            onPress={() => onSelect(tab.key)}
          >
            <Text
              style={[
                styles.tabChipText,
                { color: isActive ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// ─── Friend Card ─────────────────────────────────────────────
function FriendCard({
  name,
  status,
  level,
  wins,
  colors,
}: {
  name: string;
  status: 'online' | 'offline' | 'playing';
  level: string;
  wins: number;
  colors: ReturnType<typeof useAppColors>;
}) {
  const statusColor = status === 'online' ? colors.success : status === 'playing' ? colors.warning : colors.textTertiary;
  const statusLabel = status === 'online' ? 'Online' : status === 'playing' ? 'Im Spiel' : 'Offline';
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <View
      style={[
        styles.friendCard,
        {
          backgroundColor: colors.cardBg,
          borderColor: colors.cardBorder,
          shadowColor: colors.shadowColor,
          shadowOpacity: colors.cardShadowOpacity,
        },
      ]}
    >
      <View style={styles.friendLeft}>
        <View style={[styles.friendAvatar, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.friendAvatarText, { color: colors.primary }]}>{initials}</Text>
          <View style={[styles.friendStatusDot, { backgroundColor: statusColor, borderColor: colors.cardBg }]} />
        </View>
        <View style={styles.friendInfo}>
          <Text style={[styles.friendName, { color: colors.textPrimary }]}>{name}</Text>
          <View style={styles.friendMeta}>
            <Text style={[styles.friendMetaText, { color: statusColor }]}>{statusLabel}</Text>
            <Text style={[styles.friendMetaDot, { color: colors.textTertiary }]}>·</Text>
            <Text style={[styles.friendMetaText, { color: colors.textSecondary }]}>{level}</Text>
            <Text style={[styles.friendMetaDot, { color: colors.textTertiary }]}>·</Text>
            <Text style={[styles.friendMetaText, { color: colors.textSecondary }]}>{wins} Siege</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.friendAction, { backgroundColor: colors.primaryLight }]}
        activeOpacity={0.7}
      >
        <Text style={[styles.friendActionText, { color: colors.primary }]}>Einladen</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Team Card ───────────────────────────────────────────────
function TeamCard({
  name,
  members,
  sport,
  wins,
  colors,
}: {
  name: string;
  members: number;
  sport: string;
  wins: number;
  colors: ReturnType<typeof useAppColors>;
}) {
  const sportIcon = sport === 'padel' ? '🏸' : sport === 'fifa' ? '🎮' : '🎯';
  return (
    <TouchableOpacity
      style={[
        styles.teamCard,
        {
          backgroundColor: colors.cardBg,
          borderColor: colors.cardBorder,
          shadowColor: colors.shadowColor,
          shadowOpacity: colors.cardShadowOpacity,
        },
      ]}
      activeOpacity={0.7}
    >
      <View style={[styles.teamIcon, { backgroundColor: colors.surfaceSecondary }]}>
        <Text style={styles.teamIconText}>{sportIcon}</Text>
      </View>
      <View style={styles.teamInfo}>
        <Text style={[styles.teamName, { color: colors.textPrimary }]}>{name}</Text>
        <View style={styles.teamMeta}>
          <Text style={[styles.teamMetaText, { color: colors.textSecondary }]}>{members} Mitglieder</Text>
          <Text style={[styles.teamMetaDot, { color: colors.textTertiary }]}>·</Text>
          <Text style={[styles.teamMetaText, { color: colors.textSecondary }]}>🏆 {wins}</Text>
        </View>
      </View>
      <Text style={[styles.teamArrow, { color: colors.textTertiary }]}>›</Text>
    </TouchableOpacity>
  );
}

// ─── Ranking Row ─────────────────────────────────────────────
function RankingRow({
  rank,
  name,
  points,
  wins,
  isCurrentUser,
  colors,
}: {
  rank: number;
  name: string;
  points: number;
  wins: number;
  isCurrentUser?: boolean;
  colors: ReturnType<typeof useAppColors>;
}) {
  const medalEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <View
      style={[
        styles.rankingRow,
        {
          backgroundColor: isCurrentUser ? colors.primaryLight : 'transparent',
          borderBottomColor: colors.divider,
        },
      ]}
    >
      <View style={styles.rankingPosition}>
        {medalEmoji ? (
          <Text style={styles.rankingMedal}>{medalEmoji}</Text>
        ) : (
          <Text style={[styles.rankingNumber, { color: colors.textTertiary }]}>#{rank}</Text>
        )}
      </View>
      <View style={[styles.rankingAvatar, { backgroundColor: isCurrentUser ? colors.primary + '30' : colors.surfaceSecondary }]}>
        <Text style={[styles.rankingAvatarText, { color: isCurrentUser ? colors.primary : colors.textSecondary }]}>
          {initials}
        </Text>
      </View>
      <View style={styles.rankingInfo}>
        <Text style={[styles.rankingName, { color: colors.textPrimary, fontWeight: isCurrentUser ? '700' : '500' as any }]}>
          {name} {isCurrentUser ? '(Du)' : ''}
        </Text>
        <Text style={[styles.rankingWins, { color: colors.textTertiary }]}>{wins} Siege</Text>
      </View>
      <Text style={[styles.rankingPoints, { color: colors.primary }]}>{points} Pkt.</Text>
    </View>
  );
}

// ─── Feed Item ───────────────────────────────────────────────
function FeedItem({
  icon,
  text,
  time,
  colors,
}: {
  icon: string;
  text: string;
  time: string;
  colors: ReturnType<typeof useAppColors>;
}) {
  return (
    <View style={[styles.feedItem, { borderBottomColor: colors.divider }]}>
      <View style={[styles.feedIcon, { backgroundColor: colors.surfaceSecondary }]}>
        <Text style={styles.feedIconText}>{icon}</Text>
      </View>
      <View style={styles.feedContent}>
        <Text style={[styles.feedText, { color: colors.textPrimary }]}>{text}</Text>
        <Text style={[styles.feedTime, { color: colors.textTertiary }]}>{time}</Text>
      </View>
    </View>
  );
}

// ─── Mock Data ───────────────────────────────────────────────
const MOCK_FRIENDS = [
  { name: 'Max Weber', status: 'online' as const, level: 'Fortgeschritten', wins: 23 },
  { name: 'Lena Müller', status: 'playing' as const, level: 'Profi', wins: 41 },
  { name: 'Tom Fischer', status: 'offline' as const, level: 'Anfänger', wins: 5 },
  { name: 'Anna Schmidt', status: 'online' as const, level: 'Mittel', wins: 18 },
  { name: 'Jonas Bauer', status: 'offline' as const, level: 'Fortgeschritten', wins: 31 },
];

const MOCK_TEAMS = [
  { name: 'Die Padeleros', members: 4, sport: 'padel', wins: 12 },
  { name: 'FIFA Legenden', members: 6, sport: 'fifa', wins: 8 },
  { name: 'Schwabing Smashers', members: 4, sport: 'padel', wins: 5 },
];

const MOCK_RANKINGS = [
  { rank: 1, name: 'Lena Müller', points: 2340, wins: 41 },
  { rank: 2, name: 'Jonas Bauer', points: 2180, wins: 31 },
  { rank: 3, name: 'Max Weber', points: 1950, wins: 23 },
  { rank: 4, name: 'Anna Schmidt', points: 1620, wins: 18 },
  { rank: 5, name: 'Du selbst', points: 840, wins: 5, isCurrentUser: true },
  { rank: 6, name: 'Sarah Klein', points: 720, wins: 8 },
  { rank: 7, name: 'Felix Groß', points: 650, wins: 6 },
  { rank: 8, name: 'Marie Hoffman', points: 580, wins: 4 },
];

const MOCK_FEED = [
  { icon: '🏆', text: 'Lena Müller hat das Padel Open gewonnen!', time: 'vor 2 Std.' },
  { icon: '👥', text: 'Max Weber ist deinem Team beigetreten', time: 'vor 5 Std.' },
  { icon: '🎮', text: 'FIFA Turnier: Anmeldung geöffnet', time: 'vor 1 Tag' },
  { icon: '🏸', text: 'Tom Fischer hat sein erstes Padel-Match gewonnen', time: 'vor 1 Tag' },
  { icon: '⭐', text: 'Neues Feature: Rangliste jetzt verfügbar', time: 'vor 2 Tagen' },
  { icon: '🎯', text: 'Du bist auf Platz #23 aufgestiegen!', time: 'vor 3 Tagen' },
];

// ─── Main Community Screen ───────────────────────────────────
export default function CommunityScreen() {
  const colors = useAppColors();
  const { isDark } = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<CommunityTab>('feed');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const renderFeedContent = () => (
    <View style={styles.tabContent}>
      {MOCK_FEED.map((item, idx) => (
        <FeedItem key={idx} icon={item.icon} text={item.text} time={item.time} colors={colors} />
      ))}
    </View>
  );

  const renderFreundeContent = () => (
    <View style={styles.tabContent}>
      {/* Search */}
      <View style={[styles.searchBar, { backgroundColor: colors.surfaceSecondary, borderColor: colors.cardBorder }]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Freunde suchen..."
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Pending Invitations */}
      <View style={styles.invitationBanner}>
        <TouchableOpacity
          style={[styles.invitationCard, { backgroundColor: colors.warningBg, borderColor: colors.warning + '30' }]}
          activeOpacity={0.7}
        >
          <Text style={styles.invitationIcon}>✉️</Text>
          <View style={styles.invitationInfo}>
            <Text style={[styles.invitationTitle, { color: colors.textPrimary }]}>2 Einladungen</Text>
            <Text style={[styles.invitationSubtitle, { color: colors.textSecondary }]}>
              Team-Einladungen warten auf dich
            </Text>
          </View>
          <Text style={[styles.invitationArrow, { color: colors.warning }]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Friends List */}
      {MOCK_FRIENDS
        .filter(f => !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .map((friend, idx) => (
          <FriendCard key={idx} {...friend} colors={colors} />
        ))}

      {/* Add Friend Button */}
      <TouchableOpacity style={[styles.addButton, { borderColor: colors.primary }]} activeOpacity={0.7}>
        <Text style={[styles.addButtonText, { color: colors.primary }]}>+ Freunde einladen</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTeamsContent = () => (
    <View style={styles.tabContent}>
      {MOCK_TEAMS.map((team, idx) => (
        <TeamCard key={idx} {...team} colors={colors} />
      ))}

      {/* Create Team Button */}
      <TouchableOpacity
        style={[styles.createTeamButton, { backgroundColor: colors.primary }]}
        activeOpacity={0.8}
      >
        <Text style={styles.createTeamIcon}>+</Text>
        <Text style={styles.createTeamText}>Neues Team erstellen</Text>
      </TouchableOpacity>
    </View>
  );

  const renderRanglisteContent = () => (
    <View style={styles.tabContent}>
      {/* Period Filter */}
      <View style={styles.periodFilter}>
        {['Woche', 'Monat', 'Gesamt'].map((period, idx) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodChip,
              {
                backgroundColor: idx === 2 ? colors.primary : colors.surfaceSecondary,
              },
            ]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.periodChipText,
                { color: idx === 2 ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              {period}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Rankings */}
      <View
        style={[
          styles.rankingCard,
          {
            backgroundColor: colors.cardBg,
            borderColor: colors.cardBorder,
            shadowColor: colors.shadowColor,
            shadowOpacity: colors.cardShadowOpacity,
          },
        ]}
      >
        {MOCK_RANKINGS.map((entry, idx) => (
          <RankingRow key={idx} {...entry} colors={colors} />
        ))}
      </View>
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'feed':
        return renderFeedContent();
      case 'freunde':
        return renderFreundeContent();
      case 'teams':
        return renderTeamsContent();
      case 'rangliste':
        return renderRanglisteContent();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Community</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Verbinde dich mit Spielern & Teams
          </Text>
        </View>

        {/* Tab Filter */}
        <TabFilter active={activeTab} onSelect={setActiveTab} colors={colors} />

        {/* Content */}
        {renderContent()}

        {/* Bottom spacer for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },

  // Header
  header: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700' as '700',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: fontSize.md,
    marginTop: spacing.xs,
    lineHeight: 22,
  },

  // Tab Filter
  tabFilterContainer: {
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  tabChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  tabChipText: {
    fontSize: fontSize.sm,
    fontWeight: '600' as '600',
  },

  // Tab Content
  tabContent: {
    marginTop: spacing.sm,
  },

  // Friend Card
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
    ...shadow.sm,
  },
  friendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  friendAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  friendAvatarText: {
    fontSize: 16,
    fontWeight: '700' as '700',
  },
  friendStatusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  friendInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  friendName: {
    fontSize: fontSize.md,
    fontWeight: '600' as '600',
  },
  friendMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  friendMetaText: {
    fontSize: fontSize.xs,
  },
  friendMetaDot: {
    marginHorizontal: 5,
    fontSize: fontSize.xs,
  },
  friendAction: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    marginLeft: spacing.sm,
  },
  friendActionText: {
    fontSize: fontSize.xs,
    fontWeight: '600' as '600',
  },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
    marginLeft: spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
    paddingVertical: Platform.OS === 'ios' ? 4 : 0,
  },

  // Invitation
  invitationBanner: {
    marginBottom: spacing.md,
  },
  invitationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  invitationIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  invitationInfo: {
    flex: 1,
  },
  invitationTitle: {
    fontSize: fontSize.md,
    fontWeight: '600' as '600',
  },
  invitationSubtitle: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  invitationArrow: {
    fontSize: 22,
    fontWeight: '300' as '300',
  },

  // Add Button
  addButton: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  addButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600' as '600',
  },

  // Team Card
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
    ...shadow.sm,
  },
  teamIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamIconText: {
    fontSize: 24,
  },
  teamInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  teamName: {
    fontSize: fontSize.md,
    fontWeight: '600' as '600',
  },
  teamMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  teamMetaText: {
    fontSize: fontSize.xs,
  },
  teamMetaDot: {
    marginHorizontal: 5,
    fontSize: fontSize.xs,
  },
  teamArrow: {
    fontSize: 22,
    fontWeight: '300' as '300',
    marginLeft: spacing.sm,
  },

  // Create Team
  createTeamButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  createTeamIcon: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600' as '600',
  },
  createTeamText: {
    color: '#FFFFFF',
    fontSize: fontSize.md,
    fontWeight: '600' as '600',
  },

  // Period Filter
  periodFilter: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  periodChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  periodChipText: {
    fontSize: fontSize.sm,
    fontWeight: '600' as '600',
  },

  // Ranking
  rankingCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...shadow.sm,
  },
  rankingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rankingPosition: {
    width: 36,
    alignItems: 'center',
  },
  rankingMedal: {
    fontSize: 22,
  },
  rankingNumber: {
    fontSize: fontSize.md,
    fontWeight: '600' as '600',
  },
  rankingAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  rankingAvatarText: {
    fontSize: 14,
    fontWeight: '700' as '700',
  },
  rankingInfo: {
    flex: 1,
  },
  rankingName: {
    fontSize: fontSize.md,
  },
  rankingWins: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  rankingPoints: {
    fontSize: fontSize.md,
    fontWeight: '700' as '700',
  },

  // Feed
  feedItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  feedIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  feedIconText: {
    fontSize: 18,
  },
  feedContent: {
    flex: 1,
  },
  feedText: {
    fontSize: fontSize.md,
    lineHeight: 22,
  },
  feedTime: {
    fontSize: fontSize.xs,
    marginTop: 4,
  },
});