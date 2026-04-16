/**
 * Waitlist status screen
 * - Shows your position on the waitlist
 * - Progress bar (ahead_of_you / total_waitlisted)
 * - Chance badge (high/medium/low/unknown)
 * - Polls every 30s
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../../src/providers/ThemeProvider';
import { spacing, fontSize, fontWeight, radius } from '../../../src/theme/spacing';
import { getWaitlistStatus } from '../../../src/api/v2';
import type { Colors } from '../../../src/theme/colors';

type WaitlistStatus = Awaited<ReturnType<typeof getWaitlistStatus>>;

export default function WaitlistStatusScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const registrationId = Number(id);
  const { colors } = useTheme();
  const router = useRouter();

  const [status, setStatus] = useState<WaitlistStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getWaitlistStatus(registrationId);
      setStatus(data);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Status konnte nicht geladen werden.');
    }
  }, [registrationId]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  // Poll every 30 s
  useEffect(() => {
    const i = setInterval(load, 30000);
    return () => clearInterval(i);
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  if (loading) {
    return (
      <View style={[styles.loader, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error || !status) {
    return (
      <View style={[styles.loader, { backgroundColor: colors.bg }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error || 'Nicht verfügbar'}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { borderColor: colors.primary }]}
        >
          <Text style={[styles.backBtnText, { color: colors.primary }]}>Zurück</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const chanceLabel =
    status.estimated_chance === 'high'
      ? 'Hohe Chance'
      : status.estimated_chance === 'medium'
      ? 'Mittlere Chance'
      : status.estimated_chance === 'low'
      ? 'Niedrige Chance'
      : 'Unbekannt';

  const chanceColor =
    status.estimated_chance === 'high'
      ? '#10B981'
      : status.estimated_chance === 'medium'
      ? '#F59E0B'
      : status.estimated_chance === 'low'
      ? '#FF4757'
      : colors.textTertiary;

  const progress =
    status.total_waitlisted > 0
      ? Math.max(
          0,
          Math.min(1, (status.total_waitlisted - status.ahead_of_you) / status.total_waitlisted)
        )
      : 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ title: 'Warteliste', headerShown: true }} />
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <Text style={[styles.heroLabel, { color: colors.textTertiary }]}>Deine Position</Text>
          <Text style={[styles.heroPosition, { color: colors.textPrimary }]}>
            {status.position != null ? `#${status.position}` : '—'}
          </Text>
          <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
            von {status.total_waitlisted} auf der Warteliste
          </Text>

          <View style={[styles.chanceChip, { backgroundColor: chanceColor }]}>
            <Text style={styles.chanceText}>{chanceLabel}</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Fortschritt</Text>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress * 100}%`, backgroundColor: colors.primary },
              ]}
            />
          </View>
          <View style={styles.statsRow}>
            <Stat label="Vor dir" value={String(status.ahead_of_you)} colors={colors} />
            <Stat label="Gesamt" value={String(status.total_waitlisted)} colors={colors} />
          </View>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.cardBorder }]}>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Du wirst automatisch benachrichtigt, sobald ein Platz frei wird. Prüfe regelmäßig den
            Status — kurz vor Turnierstart werden Plätze schnell vergeben.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function Stat({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: Colors;
}) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.md },
  errorText: { fontSize: fontSize.sm },
  backBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  backBtnText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  heroCard: {
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  heroLabel: { fontSize: fontSize.xs, textTransform: 'uppercase', letterSpacing: 1 },
  heroPosition: { fontSize: 72, fontWeight: '800', marginTop: spacing.xs },
  heroSub: { fontSize: fontSize.sm, marginTop: spacing.xs },
  chanceChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    marginTop: spacing.md,
  },
  chanceText: { color: '#fff', fontSize: fontSize.xs, fontWeight: '700' },
  card: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.md,
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 4 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.md,
  },
  stat: { alignItems: 'center' },
  statValue: { fontSize: fontSize.xxl, fontWeight: '800' },
  statLabel: { fontSize: fontSize.xxs, marginTop: 2 },
  infoCard: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  infoText: { fontSize: fontSize.sm, lineHeight: 20 },
});
