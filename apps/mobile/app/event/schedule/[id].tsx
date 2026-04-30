import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, AppState } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { getEventSchedule, EventScheduleMatch } from '../../../src/api/v2';
import { THeader, TLoadingScreen, TEmptyState } from '../../../src/components/common';
import { useTheme } from '../../../src/providers/ThemeProvider';
import { spacing, fontSize, fontWeight, radius } from '../../../src/theme/spacing';

export default function EventScheduleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const [schedule, setSchedule] = useState<Awaited<ReturnType<typeof getEventSchedule>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = async (showLoader = false) => {
    if (!id) return;
    if (showLoader) setLoading(true);
    const data = await getEventSchedule(Number(id));
    setSchedule(data);
    if (showLoader) setLoading(false);
  };

  useEffect(() => {
    load(true).catch(() => setLoading(false));

    const startPolling = () => {
      if (pollRef.current) return;
      pollRef.current = setInterval(() => {
        load(false).catch(() => {});
      }, 10000);
    };
    const stopPolling = () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
    startPolling();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') startPolling();
      else stopPolling();
    });
    return () => {
      stopPolling();
      sub.remove();
    };
  }, [id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load(false).catch(() => {});
    setRefreshing(false);
  };

  if (loading) return <TLoadingScreen message="Live-Spielplan wird geladen..." />;

  const matches = schedule?.matches || [];

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <THeader title="Live-Spielplan" subtitle={schedule?.event_title} showBack onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {!matches.length ? (
          <TEmptyState
            icon="🏟️"
            title="Noch keine Courts zugewiesen"
            message="Sobald der Admin den Spielplan veröffentlicht, erscheinen hier Uhrzeit und Court."
          />
        ) : (
          <View style={{ gap: spacing.sm }}>
            {matches.map((match) => (
              <MatchRow key={match.id} match={match} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function MatchRow({ match }: { match: EventScheduleMatch }) {
  const { colors } = useTheme();
  const live = match.status === 'in_progress';
  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
      <View style={styles.rowTop}>
        <View>
          <Text style={[styles.round, { color: colors.textTertiary }]}>
            {match.round_name || `Runde ${match.round_number}`} · Spiel {match.match_number}
          </Text>
          <Text style={[styles.players, { color: colors.textPrimary }]}>
            {sideName(match.participant_1)} vs {sideName(match.participant_2)}
          </Text>
        </View>
        <View style={[styles.status, { backgroundColor: live ? '#ef4444' : colors.surfaceSecondary }]}>
          <Text style={[styles.statusText, { color: live ? '#FFFFFF' : colors.textSecondary }]}>
            {live ? 'LIVE' : statusLabel(match.status)}
          </Text>
        </View>
      </View>
      <View style={styles.metaRow}>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>{formatTime(match.scheduled_at)}</Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>{match.court_name || 'Court offen'}</Text>
      </View>
    </View>
  );
}

function sideName(side: EventScheduleMatch['participant_1']): string {
  return side?.name || 'TBD';
}

function statusLabel(status: string): string {
  if (status === 'completed') return 'Beendet';
  if (status === 'walkover') return 'Walkover';
  if (status === 'cancelled') return 'Abgesagt';
  return 'Geplant';
}

function formatTime(value: string | null): string {
  if (!value) return 'Uhrzeit offen';
  try {
    return format(new Date(value), 'EEE, HH:mm', { locale: de });
  } catch {
    return value;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  row: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  round: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold as any, marginBottom: 4 },
  players: { fontSize: fontSize.base, fontWeight: fontWeight.bold as any, flexShrink: 1 },
  status: { borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  statusText: { fontSize: 10, fontWeight: fontWeight.bold as any },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  meta: { fontSize: fontSize.sm, fontWeight: fontWeight.medium as any },
});
