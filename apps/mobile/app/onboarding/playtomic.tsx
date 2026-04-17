/**
 * Playtomic Level Onboarding
 * - User declares their Playtomic skill level (0–7) via slider
 * - Opt-out: "Ich habe kein Playtomic" → default rating 1000
 * - Shows seed ELO preview with tier
 * - After submit → screenshot upload screen (optional, for verification)
 */
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../src/providers/ThemeProvider';
import { spacing, fontSize, fontWeight, radius } from '../../src/theme/spacing';
import { declarePlaytomicLevel } from '../../src/api/v2';

// Mirror of backend mapping
const ANCHORS: Array<[number, number]> = [
  [0.0, 700],
  [1.0, 850],
  [2.0, 950],
  [3.0, 1050],
  [4.0, 1150],
  [5.0, 1280],
  [6.0, 1400],
  [7.0, 1550],
];

function levelToElo(level: number): number {
  const clamped = Math.max(0, Math.min(7, level));
  for (let i = 0; i < ANCHORS.length - 1; i++) {
    const [l1, e1] = ANCHORS[i];
    const [l2, e2] = ANCHORS[i + 1];
    if (clamped >= l1 && clamped <= l2) {
      const ratio = (clamped - l1) / (l2 - l1);
      return Math.round(e1 + ratio * (e2 - e1));
    }
  }
  return 1000;
}

function eloToTier(elo: number): { label: string; color: string } {
  if (elo >= 1350) return { label: 'Elite', color: '#EC4899' };
  if (elo >= 1200) return { label: 'Diamant', color: '#818CF8' };
  if (elo >= 1100) return { label: 'Platin', color: '#38BDF8' };
  if (elo >= 1000) return { label: 'Gold', color: '#F59E0B' };
  if (elo >= 900) return { label: 'Silber', color: '#94A3B8' };
  return { label: 'Bronze', color: '#A16207' };
}

function levelDescription(level: number): string {
  if (level < 1) return 'Absoluter Anfänger – erste Bälle';
  if (level < 2) return 'Regelmäßiger Einsteiger';
  if (level < 3) return 'Fortgeschrittener Anfänger';
  if (level < 4) return 'Solider Mittelfeld-Spieler';
  if (level < 5) return 'Starker Vereinsspieler';
  if (level < 6) return 'Sehr guter Spieler / Turnierspieler';
  return 'Profi / Semi-Pro Niveau';
}

export default function PlaytomicOnboardingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [level, setLevel] = useState(2.5);
  const [submitting, setSubmitting] = useState(false);

  const seedElo = useMemo(() => Math.max(700, levelToElo(level) - 50), [level]);
  const tier = useMemo(() => eloToTier(seedElo), [seedElo]);

  const handleChangeLevel = (delta: number) => {
    Haptics.selectionAsync();
    setLevel((prev) => {
      const next = Math.round((prev + delta) * 10) / 10;
      return Math.max(0, Math.min(7, next));
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await declarePlaytomicLevel(level);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Route to screenshot upload for verification
      router.replace('/onboarding/playtomic-verify');
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Fehler', err?.response?.data?.error?.message || 'Konnte Level nicht speichern.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Ohne Playtomic fortfahren?',
      'Du startest mit 1000 ELO (Gold). Deine Einstufung passt sich nach den ersten Matches an.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Überspringen', onPress: () => router.replace('/(tabs)/home') },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.emoji}>🎾</Text>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Dein Playtomic Level
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Damit dein erstes Turnier fair ist, teile uns dein Playtomic-Level mit.
            Wir starten dich auf passendem ELO-Niveau — verifiziert wird bei
            deiner ersten Turnier-Anmeldung via Screenshot.
          </Text>
        </View>

        {/* Level display */}
        <View
          style={[
            styles.levelCard,
            { backgroundColor: colors.surface, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.levelLabel, { color: colors.textTertiary }]}>
            DEIN LEVEL
          </Text>
          <Text style={[styles.levelValue, { color: colors.primary }]}>
            {level.toFixed(1)}
          </Text>
          <Text style={[styles.levelDesc, { color: colors.textSecondary }]}>
            {levelDescription(level)}
          </Text>

          {/* Level adjuster */}
          <View style={styles.adjusterRow}>
            <TouchableOpacity
              onPress={() => handleChangeLevel(-0.5)}
              style={[styles.adjustBtn, { backgroundColor: colors.surfaceSecondary }]}
            >
              <Ionicons name="remove" size={22} color={colors.textPrimary} />
              <Text style={[styles.adjustLabel, { color: colors.textSecondary }]}>-0.5</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleChangeLevel(-0.1)}
              style={[styles.adjustBtn, { backgroundColor: colors.surfaceSecondary }]}
            >
              <Ionicons name="remove" size={18} color={colors.textPrimary} />
              <Text style={[styles.adjustLabel, { color: colors.textSecondary }]}>-0.1</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleChangeLevel(0.1)}
              style={[styles.adjustBtn, { backgroundColor: colors.surfaceSecondary }]}
            >
              <Ionicons name="add" size={18} color={colors.textPrimary} />
              <Text style={[styles.adjustLabel, { color: colors.textSecondary }]}>+0.1</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleChangeLevel(0.5)}
              style={[styles.adjustBtn, { backgroundColor: colors.surfaceSecondary }]}
            >
              <Ionicons name="add" size={22} color={colors.textPrimary} />
              <Text style={[styles.adjustLabel, { color: colors.textSecondary }]}>+0.5</Text>
            </TouchableOpacity>
          </View>

          {/* Progress track */}
          <View style={styles.track}>
            <View style={[styles.trackBg, { backgroundColor: colors.surfaceSecondary }]} />
            <View
              style={[
                styles.trackFill,
                { width: `${(level / 7) * 100}%`, backgroundColor: colors.primary },
              ]}
            />
          </View>
          <View style={styles.trackLabels}>
            <Text style={[styles.trackLabel, { color: colors.textTertiary }]}>0</Text>
            <Text style={[styles.trackLabel, { color: colors.textTertiary }]}>3.5</Text>
            <Text style={[styles.trackLabel, { color: colors.textTertiary }]}>7</Text>
          </View>
        </View>

        {/* ELO preview */}
        <View
          style={[
            styles.eloCard,
            { backgroundColor: colors.surface, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.eloLabel, { color: colors.textTertiary }]}>
            DEIN START-ELO
          </Text>
          <View style={styles.eloRow}>
            <Text style={[styles.eloValue, { color: colors.textPrimary }]}>
              {seedElo}
            </Text>
            <View style={[styles.tierPill, { backgroundColor: tier.color + '22', borderColor: tier.color }]}>
              <Text style={[styles.tierText, { color: tier.color }]}>{tier.label}</Text>
            </View>
          </View>
          <Text style={[styles.eloHint, { color: colors.textTertiary }]}>
            -50 ELO Sicherheitsabschlag bis zur Verifizierung
          </Text>
        </View>

        {/* CTA */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitting}
          style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: submitting ? 0.6 : 1 }]}
        >
          {submitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.primaryBtnText}>Weiter zur Verifizierung</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
          <Text style={[styles.skipText, { color: colors.textTertiary }]}>
            Ich habe kein Playtomic →
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingBottom: spacing.xxl,
  },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  emoji: { fontSize: 56, marginBottom: spacing.sm },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold as any,
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.sm,
    lineHeight: 21,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  levelCard: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  levelLabel: {
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.semibold as any,
    letterSpacing: 1,
  },
  levelValue: {
    fontSize: 72,
    fontWeight: '800' as any,
    marginTop: spacing.xs,
    letterSpacing: -2,
  },
  levelDesc: {
    fontSize: fontSize.sm,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  adjusterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  adjustBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    minWidth: 60,
    gap: 2,
  },
  adjustLabel: {
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.semibold as any,
  },
  track: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: spacing.sm,
    position: 'relative',
  },
  trackBg: { ...StyleSheet.absoluteFillObject },
  trackFill: { height: '100%', borderRadius: 4 },
  trackLabels: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  trackLabel: { fontSize: fontSize.xxs },
  eloCard: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    marginBottom: spacing.xl,
  },
  eloLabel: {
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.semibold as any,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  eloRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  eloValue: { fontSize: fontSize['2xl'], fontWeight: '800' as any },
  tierPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  tierText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold as any,
  },
  eloHint: {
    fontSize: fontSize.xxs,
    marginTop: spacing.xs,
  },
  primaryBtn: {
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold as any,
  },
  skipBtn: { alignItems: 'center', padding: spacing.md },
  skipText: { fontSize: fontSize.sm },
});
