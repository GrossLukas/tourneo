/**
 * CreateFriendsTournamentScreen — any player sets up a private tournament
 * for friends and family and shares the invite link.
 *
 * The hall comes from the hall finder (Tourneo partner or OpenStreetMap) or
 * is typed in freely. Nothing costs anything: entry is free, the event is
 * private and only reachable through the invite link.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, Alert, Share } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { NCScreen, NCCard, NCButton, NCIcon, NC } from '../../src/components/nightcourt';
import { fontFamily } from '../../src/theme/typography';
import { createCommunityEvent, type CommunityVenue } from '../../src/api/v2';
import { useHallPickStore } from '../../src/store/hallPickStore';
import { useAuthStore } from '../../src/store/authStore';
import { deepLinks } from '../../src/utils/deepLinks';

const DAY_OFFSETS = [0, 1, 2, 3, 4, 5, 6, 7, 14];
const HOURS = [9, 10, 12, 14, 16, 17, 18, 19, 20];
const DURATIONS = [60, 90, 120, 180, 240];

function dayLabel(offset: number): string {
  if (offset === 0) return 'Heute';
  if (offset === 1) return 'Morgen';
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString('de', { weekday: 'short', day: 'numeric', month: 'numeric' });
}

export default function CreateFriendsTournamentScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { picked, clear } = useHallPickStore();
  const [title, setTitle] = useState('');
  const [dayOffset, setDayOffset] = useState(1);
  const [hour, setHour] = useState(18);
  const [duration, setDuration] = useState(120);
  const [format, setFormat] = useState<'doubles' | 'singles'>('doubles');
  const [maxParticipants, setMaxParticipants] = useState(8);
  const [placeName, setPlaceName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // A hall picked in the finder replaces the free-text place
  useEffect(() => {
    if (picked) setPlaceName('');
  }, [picked]);

  const start = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hour, 0, 0, 0);
    return d;
  }, [dayOffset, hour]);

  const inPast = start.getTime() <= Date.now();
  const unit = format === 'doubles' ? 'Teams' : 'Spieler';

  const venue: CommunityVenue | null = picked
    ? picked.tourneo_venue_id
      ? { kind: 'partner', venue_id: picked.tourneo_venue_id }
      : {
        kind: 'osm',
        osm_id: picked.id,
        name: picked.name,
        latitude: picked.latitude,
        longitude: picked.longitude,
        address: picked.address ?? undefined,
        website: picked.website,
      }
    : placeName.trim().length >= 2
      ? { kind: 'place', name: placeName.trim() }
      : null;

  const ready = title.trim().length >= 3 && venue !== null && !inPast && !submitting;

  const submit = async () => {
    if (!venue) return;
    setSubmitting(true);
    try {
      const event = await createCommunityEvent({
        title: title.trim(),
        start_date: start.toISOString(),
        duration_minutes: duration,
        format,
        max_participants: maxParticipants,
        venue,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      clear();
      const link = event.invite_token ? `${deepLinks.event(event.id)}?invite=${event.invite_token}` : deepLinks.event(event.id);
      await Share.share({ message: `Spiel mit beim Padel-Turnier „${event.title}“: ${link}` }).catch(() => {});
      router.replace(`/event/${event.id}${event.invite_token ? `?invite=${event.invite_token}` : ''}`);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Alert.alert('Turnier erstellen', err?.response?.data?.error?.message || 'Das Turnier konnte nicht erstellt werden.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <NCScreen>
        <View style={s.center}>
          <Text style={s.hint}>Melde dich an, um ein Turnier mit Freunden zu erstellen.</Text>
          <View style={{ marginTop: 16 }}>
            <NCButton variant="primary" size="md" onPress={() => router.push('/(auth)/login')}>Anmelden</NCButton>
          </View>
        </View>
      </NCScreen>
    );
  }

  return (
    <NCScreen>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Zurück">
          <NCIcon name="chevronL" size={22} color={NC.textP} />
        </Pressable>
        <Text style={s.title}>Turnier mit Freunden</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60, gap: 18 }} keyboardShouldPersistTaps="handled">
        <View>
          <Text style={s.label}>Name</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="z. B. Freitagsrunde"
            placeholderTextColor={NC.textT}
            maxLength={100}
            style={s.input}
          />
        </View>

        <View>
          <Text style={s.label}>Wo?</Text>
          {picked ? (
            <NCCard padded={false} style={s.hallCard}>
              <View style={{ flex: 1 }}>
                <Text style={s.hallName}>{picked.name}</Text>
                {picked.address ? <Text style={s.hint}>{picked.address}</Text> : null}
              </View>
              <Pressable onPress={clear} hitSlop={10} accessibilityLabel="Halle entfernen">
                <NCIcon name="close" size={18} color={NC.textS} />
              </Pressable>
            </NCCard>
          ) : (
            <>
              <NCButton variant="ghost" size="sm" onPress={() => router.push('/courts/finder?pick=1')}>
                Halle suchen
              </NCButton>
              <TextInput
                value={placeName}
                onChangeText={setPlaceName}
                placeholder="… oder Ort eintippen, z. B. Padelhalle Nord"
                placeholderTextColor={NC.textT}
                maxLength={120}
                style={[s.input, { marginTop: 8 }]}
              />
            </>
          )}
        </View>

        <View>
          <Text style={s.label}>Wann?</Text>
          <ChipRow items={DAY_OFFSETS} active={dayOffset} label={dayLabel} onChange={setDayOffset} />
          <View style={{ height: 8 }} />
          <ChipRow items={HOURS} active={hour} label={(h) => `${h}:00`} onChange={setHour} />
          {inPast ? <Text style={s.warn}>Diese Uhrzeit ist heute schon vorbei.</Text> : null}
        </View>

        <View>
          <Text style={s.label}>Dauer</Text>
          <ChipRow items={DURATIONS} active={duration} label={(m) => (m % 60 ? `${m / 60} h`.replace('.', ',') : `${m / 60} h`)} onChange={setDuration} />
        </View>

        <View>
          <Text style={s.label}>Format</Text>
          <ChipRow
            items={['doubles', 'singles'] as const}
            active={format}
            label={(f) => (f === 'doubles' ? 'Doppel (2er-Teams)' : 'Einzel')}
            onChange={setFormat}
          />
        </View>

        <View style={s.stepperRow}>
          <Text style={s.label}>Max. {unit}</Text>
          <View style={s.stepper}>
            <Pressable onPress={() => setMaxParticipants((n) => Math.max(2, n - 1))} hitSlop={8} style={s.stepBtn}>
              <Text style={s.stepText}>−</Text>
            </Pressable>
            <Text style={s.count}>{maxParticipants}</Text>
            <Pressable onPress={() => setMaxParticipants((n) => Math.min(32, n + 1))} hitSlop={8} style={s.stepBtn}>
              <Text style={s.stepText}>+</Text>
            </Pressable>
          </View>
        </View>

        <Text style={s.hint}>
          Das Turnier ist privat und kostenlos. Nur wer deinen Einladungslink hat, kann es sehen und sich anmelden.
        </Text>

        <NCButton variant="primary" size="lg" full onPress={submit} disabled={!ready}>
          {submitting ? 'Wird erstellt…' : 'Erstellen & Freunde einladen'}
        </NCButton>
      </ScrollView>
    </NCScreen>
  );
}

function ChipRow<T extends string | number>({
  items,
  active,
  label,
  onChange,
}: {
  items: readonly T[];
  active: T;
  label: (item: T) => string;
  onChange: (item: T) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, flexShrink: 0 }} contentContainerStyle={{ gap: 8 }}>
      {items.map((item) => {
        const on = item === active;
        return (
          <Pressable
            key={String(item)}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              onChange(item);
            }}
            style={[s.chip, { backgroundColor: on ? NC.primary : NC.bgCard, borderColor: on ? NC.primary : NC.border }]}
          >
            <Text style={[s.chipText, { color: on ? '#FFFFFF' : NC.textS }]}>{label(item)}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: { fontFamily: fontFamily.displayBold, fontSize: 18, fontWeight: '700', color: NC.textP },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  label: { fontFamily: fontFamily.uiSemibold, fontSize: 14, color: NC.textP, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: NC.borderStr,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: NC.textP,
    fontFamily: fontFamily.uiMedium,
    fontSize: 15,
    backgroundColor: NC.bgCard,
  },
  hallCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  hallName: { fontFamily: fontFamily.displayBold, fontSize: 15, fontWeight: '700', color: NC.textP },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, flexShrink: 0 },
  chipText: { fontFamily: fontFamily.uiSemibold, fontSize: 12.5, fontWeight: '600' },
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: NC.borderStr,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { fontFamily: fontFamily.displayBold, fontSize: 18, color: NC.textP },
  count: { fontFamily: fontFamily.displayBold, fontSize: 18, fontWeight: '700', color: NC.textP, minWidth: 24, textAlign: 'center' },
  hint: { fontFamily: fontFamily.uiMedium, fontSize: 13, color: NC.textS },
  warn: { fontFamily: fontFamily.uiMedium, fontSize: 13, color: NC.gold, marginTop: 6 },
});
