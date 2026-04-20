/**
 * Admin: Tournament Quick-Create Wizard
 * - Admin picks one of 3 presets (Padel Quick 8, Padel Open 16, FIFA Pro 8)
 * - Picks venue from list, picks date preset (today, tomorrow, +3d, +7d, +14d)
 * - Picks start time (18/19/20h) — template supplies rest
 * - Submits to POST /events and navigates to new event
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/providers/ThemeProvider';
import { spacing, fontSize, fontWeight, radius } from '../../src/theme/spacing';
import type { Colors } from '../../src/theme/colors';
import { useAuthStore } from '../../src/store/authStore';
import { useVenueStore, type Venue } from '../../src/store/venueStore';
import apiClient from '../../src/api/client';

type TemplateKey = 'padel_quick' | 'padel_open' | 'fifa_pro';

interface Template {
  key: TemplateKey;
  emoji: string;
  title: string;
  subtitle: string;
  sport_category: 'padel' | 'fifa';
  format: 'singles' | 'doubles';
  elimination_type: 'single_elimination' | 'double_elimination' | 'round_robin';
  max_participants: number;
  entry_fee_cents: number;
  duration_hours: number;
  description: string;
}

const TEMPLATES: Template[] = [
  {
    key: 'padel_quick',
    emoji: '🏸',
    title: 'Padel Quick 8',
    subtitle: 'K.O. · 8 Teilnehmer · ~2h',
    sport_category: 'padel',
    format: 'doubles',
    elimination_type: 'single_elimination',
    max_participants: 8,
    entry_fee_cents: 1000,
    duration_hours: 2,
    description: 'Schnelles Feierabend-Turnier mit 4 Doppelteams im K.O.-System.',
  },
  {
    key: 'padel_open',
    emoji: '🏆',
    title: 'Padel Open 16',
    subtitle: 'K.O. · 16 Teilnehmer · ~4h',
    sport_category: 'padel',
    format: 'doubles',
    elimination_type: 'single_elimination',
    max_participants: 16,
    entry_fee_cents: 2000,
    duration_hours: 4,
    description: 'Das klassische Wochenend-Format — 8 Doppelteams spielen um den Titel.',
  },
  {
    key: 'fifa_pro',
    emoji: '🎮',
    title: 'FIFA Pro 8',
    subtitle: 'K.O. · 8 Spieler · ~3h',
    sport_category: 'fifa',
    format: 'singles',
    elimination_type: 'single_elimination',
    max_participants: 8,
    entry_fee_cents: 500,
    duration_hours: 3,
    description: 'Einzel-Turnier im K.O.-Modus für FIFA Zocker.',
  },
];

const DATE_PRESETS = [
  { label: 'Heute', days: 0 },
  { label: 'Morgen', days: 1 },
  { label: '+3 Tage', days: 3 },
  { label: 'Nächste Woche', days: 7 },
  { label: '+2 Wochen', days: 14 },
];

const TIME_PRESETS = [17, 18, 19, 20, 21];

export default function QuickCreateScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const { venues, fetchVenues } = useVenueStore();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [template, setTemplate] = useState<TemplateKey | null>(null);
  const [venueId, setVenueId] = useState<number | null>(null);
  const [daysOffset, setDaysOffset] = useState<number>(1);
  const [startHour, setStartHour] = useState<number>(19);
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  const selected = TEMPLATES.find((t) => t.key === template) || null;
  const filteredVenues: Venue[] = useMemo(() => {
    if (!selected) return venues;
    return venues;
  }, [venues, selected]);

  const canSubmit = selected && venueId !== null && !submitting;

  const handleSubmit = useCallback(async () => {
    if (!selected || venueId === null) return;
    setSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const start = new Date();
    start.setDate(start.getDate() + daysOffset);
    start.setHours(startHour, 0, 0, 0);

    const end = new Date(start.getTime() + selected.duration_hours * 60 * 60 * 1000);
    const regOpens = new Date();
    const regCloses = new Date(start.getTime() - 60 * 60 * 1000);

    const title = `${selected.title} · ${start.toLocaleDateString('de-DE', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    })}`;

    const payload = {
      title,
      description: selected.description,
      sport_category: selected.sport_category,
      event_type: 'tournament' as const,
      venue_id: venueId,
      start_date: start.toISOString(),
      end_date: end.toISOString(),
      registration_opens_at: regOpens.toISOString(),
      registration_closes_at: regCloses.toISOString(),
      is_indoor: true,
      is_outdoor: false,
      format: selected.format,
      elimination_type: selected.elimination_type,
      has_third_place_match: true,
      max_participants: selected.max_participants,
      entry_fee_cents: selected.entry_fee_cents,
      currency: 'EUR',
      total_prize_pool_cents: 0,
      level: 'open' as const,
      access_type: 'public' as const,
      has_food_drinks: false,
      has_streaming: false,
    };

    try {
      const res = await apiClient.post('/events', payload);
      const newId = res.data?.data?.id;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Turnier erstellt', `${title} wurde angelegt und ist im Entwurfs-Modus.`, [
        {
          text: 'Öffnen',
          onPress: () => (newId ? router.replace(`/event/${newId}`) : router.back()),
        },
        { text: 'Schließen', style: 'cancel', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        'Erstellen fehlgeschlagen.';
      Alert.alert('Fehler', msg);
    } finally {
      setSubmitting(false);
    }
  }, [selected, venueId, daysOffset, startHour, router]);

  if (!isAdmin) {
    return (
      <View style={[styles.loader, { backgroundColor: colors.bg }]}>
        <Stack.Screen options={{ title: 'Turnier anlegen', headerShown: true }} />
        <Text style={{ color: colors.textSecondary }}>
          Nur Admins können Turniere anlegen.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ title: 'Turnier anlegen', headerShown: true }} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing['4xl'] }}>
        {/* Step 1 — Template */}
        <Text style={styles.stepLabel}>1. Vorlage wählen</Text>
        <View style={{ gap: spacing.sm }}>
          {TEMPLATES.map((tpl) => {
            const active = template === tpl.key;
            return (
              <TouchableOpacity
                key={tpl.key}
                onPress={() => {
                  Haptics.selectionAsync();
                  setTemplate(tpl.key);
                }}
                activeOpacity={0.85}
                style={[
                  styles.card,
                  active && { borderColor: colors.primary, borderWidth: 2 },
                ]}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardEmoji}>{tpl.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{tpl.title}</Text>
                    <Text style={styles.cardSubtitle}>{tpl.subtitle}</Text>
                  </View>
                  {active && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
                </View>
                <Text style={styles.cardDesc}>{tpl.description}</Text>
                <View style={styles.tagRow}>
                  <Tag label={`${(tpl.entry_fee_cents / 100).toFixed(0)} €`} colors={colors} />
                  <Tag label={tpl.format === 'doubles' ? 'Doppel' : 'Einzel'} colors={colors} />
                  <Tag label={tpl.elimination_type === 'round_robin' ? 'Jeder gg. jeden' : 'K.O.'} colors={colors} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Step 2 — Venue */}
        <Text style={styles.stepLabel}>2. Venue wählen</Text>
        {filteredVenues.length === 0 ? (
          <View style={styles.card}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.cardDesc, { textAlign: 'center', marginTop: spacing.sm }]}>
              Lade Venues…
            </Text>
          </View>
        ) : (
          <View style={{ gap: spacing.xs }}>
            {filteredVenues.slice(0, 10).map((v) => {
              const active = venueId === Number(v.id);
              return (
                <TouchableOpacity
                  key={v.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setVenueId(Number(v.id));
                  }}
                  style={[
                    styles.venueRow,
                    active && { borderColor: colors.primary, borderWidth: 2 },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.venueName}>{v.name}</Text>
                    <Text style={styles.venueCity}>
                      {v.address_city}
                      {v.distance_km != null ? ` · ${v.distance_km} km` : ''}
                    </Text>
                  </View>
                  {active && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Step 3 — Datum */}
        <Text style={styles.stepLabel}>3. Datum</Text>
        <View style={styles.chipRow}>
          {DATE_PRESETS.map((d) => {
            const active = d.days === daysOffset;
            return (
              <TouchableOpacity
                key={d.days}
                onPress={() => {
                  Haptics.selectionAsync();
                  setDaysOffset(d.days);
                }}
                style={[
                  styles.chip,
                  active ? { backgroundColor: colors.primary } : { backgroundColor: colors.surface, borderColor: colors.cardBorder, borderWidth: 1 },
                ]}
              >
                <Text style={[styles.chipText, { color: active ? '#fff' : colors.textPrimary }]}>
                  {d.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Step 4 — Zeit */}
        <Text style={styles.stepLabel}>4. Startzeit</Text>
        <View style={styles.chipRow}>
          {TIME_PRESETS.map((h) => {
            const active = h === startHour;
            return (
              <TouchableOpacity
                key={h}
                onPress={() => {
                  Haptics.selectionAsync();
                  setStartHour(h);
                }}
                style={[
                  styles.chip,
                  active ? { backgroundColor: colors.primary } : { backgroundColor: colors.surface, borderColor: colors.cardBorder, borderWidth: 1 },
                ]}
              >
                <Text style={[styles.chipText, { color: active ? '#fff' : colors.textPrimary }]}>
                  {h}:00
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Summary */}
        {selected && venueId !== null && (
          <View style={[styles.card, { marginTop: spacing.lg }]}>
            <Text style={[styles.cardTitle, { marginBottom: spacing.xs }]}>Zusammenfassung</Text>
            <SummaryLine k="Vorlage" v={selected.title} colors={colors} />
            <SummaryLine
              k="Startzeit"
              v={(() => {
                const d = new Date();
                d.setDate(d.getDate() + daysOffset);
                d.setHours(startHour, 0, 0, 0);
                return d.toLocaleString('de-DE', {
                  weekday: 'short',
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                });
              })()}
              colors={colors}
            />
            <SummaryLine k="Teilnehmer" v={`${selected.max_participants} max.`} colors={colors} />
            <SummaryLine
              k="Startgeld"
              v={`${(selected.entry_fee_cents / 100).toFixed(0)} €`}
              colors={colors}
            />
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.bg, borderTopColor: colors.border }]}>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!canSubmit}
          style={[
            styles.submitBtn,
            {
              backgroundColor: colors.primary,
              opacity: canSubmit ? 1 : 0.4,
            },
          ]}
        >
          <Text style={styles.submitText}>
            {submitting ? 'Erstelle…' : 'Turnier anlegen'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Tag({ label, colors }: { label: string; colors: Colors }) {
  return (
    <View
      style={{
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radius.md,
        backgroundColor: colors.surfaceSecondary as string,
      }}
    >
      <Text style={{ color: colors.textSecondary, fontSize: fontSize.xxs, fontWeight: fontWeight.semibold }}>
        {label}
      </Text>
    </View>
  );
}

function SummaryLine({ k, v, colors }: { k: string; v: string; colors: Colors }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
      <Text style={{ color: colors.textTertiary, fontSize: fontSize.sm }}>{k}</Text>
      <Text style={{ color: colors.textPrimary, fontSize: fontSize.sm, fontWeight: fontWeight.semibold }}>
        {v}
      </Text>
    </View>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    loader: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
    stepLabel: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.semibold,
      color: colors.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    card: {
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.surface,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
    cardEmoji: { fontSize: 28 },
    cardTitle: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: colors.textPrimary },
    cardSubtitle: { fontSize: fontSize.xs, color: colors.textTertiary, marginTop: 2 },
    cardDesc: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 20 },
    tagRow: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm, flexWrap: 'wrap' },
    venueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.surface,
    },
    venueName: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textPrimary },
    venueCity: { fontSize: fontSize.xs, color: colors.textTertiary, marginTop: 2 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.full,
    },
    chipText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
    footer: {
      padding: spacing.md,
      paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    submitBtn: {
      padding: spacing.md,
      borderRadius: radius.lg,
      alignItems: 'center',
    },
    submitText: { color: '#fff', fontSize: fontSize.base, fontWeight: fontWeight.bold },
  });
