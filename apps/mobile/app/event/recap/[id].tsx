/**
 * Tournament recap screen
 * - Podium, stats, prize distribution
 * - Uses backend /events/:id/recap
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Share,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../src/providers/ThemeProvider';
import { spacing, fontSize, fontWeight, radius } from '../../../src/theme/spacing';
import { getEventRecap } from '../../../src/api/v2';
import type { Colors } from '../../../src/theme/colors';

export default function RecapScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = Number(id);
  const { colors } = useTheme();

  const [recap, setRecap] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getEventRecap(eventId);
        setRecap(data);
      } catch (err: any) {
        setError(err?.response?.data?.error?.message || 'Recap konnte nicht geladen werden.');
      } finally {
        setLoading(false);
      }
    })();
  }, [eventId]);

  const handleShare = async () => {
    if (!recap?.event) return;
    const winnerName = recap.podium?.winner?.display_name;
    const msg = winnerName
      ? `🏆 ${recap.event.title} gewonnen von ${winnerName}! #tourneo`
      : `🏆 Turnier ${recap.event.title} — #tourneo`;
    try {
      await Share.share({ message: msg });
    } catch {
      // silent
    }
  };

  if (loading) {
    return (
      <View style={[styles.loader, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error || !recap) {
    return (
      <View style={[styles.loader, { backgroundColor: colors.bg }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>{error || 'Nicht verfügbar'}</Text>
      </View>
    );
  }

  const { event, podium, stats, prize_distribution } = recap;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ title: 'Recap', headerShown: true }} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={[styles.eventTitle, { color: colors.textPrimary }]}>{event.title}</Text>
        {event.start_date && (
          <Text style={[styles.eventDate, { color: colors.textTertiary }]}>
            {new Date(event.start_date).toLocaleDateString('de-DE')}
          </Text>
        )}

        {/* Podium */}
        <View style={styles.podiumRow}>
          <PodiumCard place={2} row={podium?.runner_up} colors={colors} />
          <PodiumCard place={1} row={podium?.winner} colors={colors} big />
          <PodiumCard place={3} row={podium?.third_place} colors={colors} />
        </View>

        {/* Stats */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Statistiken</Text>
          <StatRow label="Teilnehmer" value={stats?.participant_count ?? '—'} colors={colors} />
          <StatRow label="Matches" value={stats?.total_matches ?? '—'} colors={colors} />
          <StatRow label="Sätze gespielt" value={stats?.total_sets_played ?? '—'} colors={colors} />
          {stats?.longest_match_minutes != null && (
            <StatRow label="Längstes Match" value={`${stats.longest_match_minutes} min`} colors={colors} />
          )}
          {stats?.highest_score != null && (
            <StatRow label="Höchster Score" value={String(stats.highest_score)} colors={colors} />
          )}
          {stats?.duration_hours != null && (
            <StatRow label="Dauer" value={`${stats.duration_hours} h`} colors={colors} />
          )}
        </View>

        {/* Prize distribution */}
        {Array.isArray(prize_distribution) && prize_distribution.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Preisgelder</Text>
            {prize_distribution.map((p: any, idx: number) => (
              <StatRow
                key={idx}
                label={`${p.place}. Platz${p.display_name ? ` – ${p.display_name}` : ''}`}
                value={`${(p.amount_cents / 100).toFixed(0)} €`}
                colors={colors}
              />
            ))}
          </View>
        )}

        <TouchableOpacity
          onPress={handleShare}
          style={[styles.shareBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.shareBtnText}>Sieg teilen</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function PodiumCard({
  place,
  row,
  colors,
  big,
}: {
  place: 1 | 2 | 3;
  row: any;
  colors: Colors;
  big?: boolean;
}) {
  const medal = place === 1 ? '🥇' : place === 2 ? '🥈' : '🥉';
  return (
    <View
      style={[
        styles.podiumCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.cardBorder,
          height: big ? 160 : 140,
        },
      ]}
    >
      <Text style={{ fontSize: big ? 40 : 32 }}>{medal}</Text>
      <Text style={[styles.podiumName, { color: colors.textPrimary }]} numberOfLines={2}>
        {row?.display_name || '—'}
      </Text>
    </View>
  );
}

function StatRow({ label, value, colors }: { label: string; value: string | number; colors: Colors }) {
  return (
    <View style={styles.statRow}>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.statValue, { color: colors.textPrimary }]}>{String(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  errorText: { fontSize: fontSize.sm },
  eventTitle: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold },
  eventDate: { fontSize: fontSize.sm, marginTop: 4, marginBottom: spacing.lg },
  podiumRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    alignItems: 'flex-end',
  },
  podiumCard: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  podiumName: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, textAlign: 'center' },
  card: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.sm,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  statLabel: { fontSize: fontSize.sm },
  statValue: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  shareBtn: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  shareBtnText: { color: '#fff', fontSize: fontSize.base, fontWeight: fontWeight.bold },
});
