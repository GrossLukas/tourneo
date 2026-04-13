import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/providers/ThemeProvider';
import type { Colors } from '../../src/theme/colors';
import { spacing, fontSize, fontWeight, radius, shadow } from '../../src/theme/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Sport Categories ────────────────────────────────────────
interface SportCategory {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  gradient: [string, string];
  available: boolean;
  comingSoon?: boolean;
}

// ─── Quick Match Card ────────────────────────────────────────
interface QuickMatch {
  id: string;
  title: string;
  players: string;
  time: string;
  level: string;
  sport: string;
  icon: string;
}

const MOCK_QUICK_MATCHES: QuickMatch[] = [
  { id: '1', title: 'Padel Doppel', players: '3/4', time: 'Heute, 18:00', level: 'Mittel', sport: 'padel', icon: '🏸' },
  { id: '2', title: 'FIFA Turnier', players: '6/8', time: 'Morgen, 19:00', level: 'Alle Level', sport: 'fifa', icon: '🎮' },
  { id: '3', title: 'Offenes Padel', players: '2/4', time: 'Sa, 10:00', level: 'Anfänger', sport: 'padel', icon: '🏸' },
];

// ─── Nearby Venue ────────────────────────────────────────────
interface NearbyVenue {
  id: string;
  name: string;
  distance: string;
  courts: number;
  rating: number;
  image: string;
}

const MOCK_VENUES: NearbyVenue[] = [
  { id: '1', name: 'Padel Club München', distance: '1.2 km', courts: 6, rating: 4.8, image: '' },
  { id: '2', name: 'Sport Arena Schwabing', distance: '2.5 km', courts: 4, rating: 4.5, image: '' },
  { id: '3', name: 'City Padel Center', distance: '3.1 km', courts: 8, rating: 4.7, image: '' },
];

// ─── Sport Card Component ────────────────────────────────────
function SportCard({
  sport,
  colors,
  onPress,
}: {
  sport: SportCategory;
  colors: Colors;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.sportCard,
        {
          backgroundColor: colors.cardBg,
          borderColor: colors.cardBorder,
          shadowColor: colors.shadowColor,
          shadowOpacity: colors.cardShadowOpacity,
        },
      ]}
      activeOpacity={sport.available ? 0.7 : 1}
      onPress={sport.available ? onPress : undefined}
    >
      <View style={[styles.sportIconContainer, { backgroundColor: sport.gradient[0] + '18' }]}>
        <Text style={styles.sportIcon}>{sport.icon}</Text>
      </View>
      <View style={styles.sportInfo}>
        <View style={styles.sportTitleRow}>
          <Text style={[styles.sportTitle, { color: colors.textPrimary }]}>{sport.title}</Text>
          {sport.comingSoon && (
            <View style={[styles.comingSoonBadge, { backgroundColor: colors.accentLight }]}>
              <Text style={[styles.comingSoonText, { color: colors.accent }]}>Bald</Text>
            </View>
          )}
        </View>
        <Text style={[styles.sportSubtitle, { color: colors.textSecondary }]}>{sport.subtitle}</Text>
      </View>
      <Text style={[styles.sportArrow, { color: sport.available ? colors.primary : colors.textTertiary }]}>›</Text>
    </TouchableOpacity>
  );
}

// ─── Quick Match Card Component ──────────────────────────────
function QuickMatchCard({
  match,
  colors,
}: {
  match: QuickMatch;
  colors: Colors;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.quickMatchCard,
        {
          backgroundColor: colors.cardBg,
          borderColor: colors.cardBorder,
          shadowColor: colors.shadowColor,
          shadowOpacity: colors.cardShadowOpacity,
        },
      ]}
      activeOpacity={0.7}
    >
      <View style={styles.quickMatchHeader}>
        <Text style={styles.quickMatchIcon}>{match.icon}</Text>
        <View style={[styles.quickMatchPlayerBadge, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.quickMatchPlayerText, { color: colors.primary }]}>{match.players}</Text>
        </View>
      </View>
      <Text style={[styles.quickMatchTitle, { color: colors.textPrimary }]}>{match.title}</Text>
      <Text style={[styles.quickMatchTime, { color: colors.textSecondary }]}>{match.time}</Text>
      <View style={[styles.quickMatchLevelBadge, { backgroundColor: colors.surfaceSecondary }]}>
        <Text style={[styles.quickMatchLevelText, { color: colors.textSecondary }]}>{match.level}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Venue Card Component ────────────────────────────────────
function VenueCard({
  venue,
  colors,
}: {
  venue: NearbyVenue;
  colors: Colors;
}) {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={[
        styles.venueCard,
        {
          backgroundColor: colors.cardBg,
          borderColor: colors.cardBorder,
          shadowColor: colors.shadowColor,
          shadowOpacity: colors.cardShadowOpacity,
        },
      ]}
      activeOpacity={0.7}
      onPress={() => router.push(`/venue/${venue.id}`)}
    >
      <View style={[styles.venueImage, { backgroundColor: colors.surfaceSecondary }]}>
        <Text style={styles.venueImagePlaceholder}>🏟️</Text>
      </View>
      <View style={styles.venueInfo}>
        <Text style={[styles.venueName, { color: colors.textPrimary }]} numberOfLines={1}>{venue.name}</Text>
        <View style={styles.venueDetails}>
          <Text style={[styles.venueDetailText, { color: colors.textSecondary }]}>📍 {venue.distance}</Text>
          <Text style={[styles.venueDetailDot, { color: colors.textTertiary }]}>·</Text>
          <Text style={[styles.venueDetailText, { color: colors.textSecondary }]}>{venue.courts} Plätze</Text>
          <Text style={[styles.venueDetailDot, { color: colors.textTertiary }]}>·</Text>
          <Text style={[styles.venueDetailText, { color: colors.textSecondary }]}>⭐ {venue.rating}</Text>
        </View>
      </View>
      <Text style={[styles.venueArrow, { color: colors.primary }]}>›</Text>
    </TouchableOpacity>
  );
}

// ─── Main Spielen Screen ─────────────────────────────────────
export default function SpielenScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const sportCategories: SportCategory[] = [
    {
      id: 'padel',
      title: 'Padel',
      subtitle: 'Turniere, offene Spiele & Plätze buchen',
      icon: '🏸',
      gradient: [colors.primary, colors.primaryDark],
      available: true,
    },
    {
      id: 'fifa',
      title: 'FIFA / eGaming',
      subtitle: 'eSport Turniere & Community-Matches',
      icon: '🎮',
      gradient: [colors.brand.coral[500], colors.brand.coral[700]],
      available: true,
    },
    {
      id: 'freies-spiel',
      title: 'Freies Spiel',
      subtitle: 'Offene Runden, Mitspieler finden',
      icon: '🎯',
      gradient: ['#7C3AED', '#5B21B6'],
      available: true,
    },
    {
      id: 'plaetze',
      title: 'Plätze finden',
      subtitle: 'Venues in deiner Nähe entdecken',
      icon: '📍',
      gradient: ['#2563EB', '#1D4ED8'],
      available: true,
    },
  ];

  const handleSportPress = (sportId: string) => {
    if (sportId === 'padel') {
      router.push('/(tabs)/turniere');
    } else if (sportId === 'plaetze') {
      // Could navigate to a venue search screen
    }
    // Other sports: show relevant content
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Spielen</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Wähle deine Sportart und starte direkt
          </Text>
        </View>

        {/* Sport Categories */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Sportarten</Text>
          <View style={styles.sportList}>
            {sportCategories.map((sport) => (
              <SportCard
                key={sport.id}
                sport={sport}
                colors={colors}
                onPress={() => handleSportPress(sport.id)}
              />
            ))}
          </View>
        </View>

        {/* Quick Matches */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Offene Spiele</Text>
            <TouchableOpacity>
              <Text style={[styles.sectionLink, { color: colors.primary }]}>Alle →</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {MOCK_QUICK_MATCHES.map((match) => (
              <QuickMatchCard key={match.id} match={match} colors={colors} />
            ))}
          </ScrollView>
        </View>

        {/* Nearby Venues */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Plätze in der Nähe</Text>
            <TouchableOpacity>
              <Text style={[styles.sectionLink, { color: colors.primary }]}>Karte →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.venueList}>
            {MOCK_VENUES.map((venue) => (
              <VenueCard key={venue.id} venue={venue} colors={colors} />
            ))}
          </View>
        </View>

        {/* CTA Banner */}
        <TouchableOpacity
          style={[
            styles.ctaBanner,
            { backgroundColor: colors.primary },
          ]}
          activeOpacity={0.85}
        >
          <View style={styles.ctaContent}>
            <Text style={styles.ctaIcon}>🏆</Text>
            <View style={styles.ctaTextContainer}>
              <Text style={styles.ctaTitle}>Eigenes Turnier erstellen</Text>
              <Text style={styles.ctaSubtitle}>Organisiere dein eigenes Event für Freunde & Community</Text>
            </View>
          </View>
          <Text style={styles.ctaArrow}>→</Text>
        </TouchableOpacity>

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
    paddingBottom: spacing.md,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: fontWeight.bold as '700',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: fontSize.md,
    marginTop: spacing.xs,
    lineHeight: 22,
  },

  // Sections
  section: {
    marginTop: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold as '600',
    letterSpacing: -0.3,
  },
  sectionLink: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium as '500',
  },

  // Sport Cards
  sportList: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  sportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    ...shadow.sm,
  },
  sportIconContainer: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sportIcon: {
    fontSize: 26,
  },
  sportInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  sportTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sportTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold as '600',
  },
  sportSubtitle: {
    fontSize: fontSize.sm,
    marginTop: 2,
    lineHeight: 18,
  },
  sportArrow: {
    fontSize: 24,
    fontWeight: fontWeight.light as '300',
    marginLeft: spacing.sm,
  },
  comingSoonBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  comingSoonText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold as '600',
  },

  // Quick Match Cards
  horizontalScroll: {
    paddingRight: spacing.lg,
    gap: spacing.sm,
  },
  quickMatchCard: {
    width: 160,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    ...shadow.sm,
  },
  quickMatchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  quickMatchIcon: {
    fontSize: 28,
  },
  quickMatchPlayerBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  quickMatchPlayerText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold as '700',
  },
  quickMatchTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold as '600',
    marginBottom: 4,
  },
  quickMatchTime: {
    fontSize: fontSize.xs,
    marginBottom: spacing.sm,
  },
  quickMatchLevelBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  quickMatchLevelText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium as '500',
  },

  // Venue Cards
  venueList: {
    gap: spacing.sm,
  },
  venueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    ...shadow.sm,
  },
  venueImage: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  venueImagePlaceholder: {
    fontSize: 24,
  },
  venueInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  venueName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold as '600',
    marginBottom: 4,
  },
  venueDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  venueDetailText: {
    fontSize: fontSize.xs,
  },
  venueDetailDot: {
    marginHorizontal: 6,
    fontSize: fontSize.xs,
  },
  venueArrow: {
    fontSize: 22,
    fontWeight: fontWeight.light as '300',
    marginLeft: spacing.sm,
  },

  // CTA Banner
  ctaBanner: {
    marginTop: spacing.xl,
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ctaIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  ctaTextContainer: {
    flex: 1,
  },
  ctaTitle: {
    color: '#FFFFFF',
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold as '700',
  },
  ctaSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: fontSize.xs,
    marginTop: 2,
    lineHeight: 16,
  },
  ctaArrow: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: fontWeight.bold as '700',
    marginLeft: spacing.sm,
  },
});