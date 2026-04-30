import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
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
import { useVenueStore } from '../../src/store/venueStore';
import apiClient from '../../src/api/client';

type Level = 'beginner' | 'intermediate' | 'advanced' | 'open';
type VenueMode = 'existing' | 'custom';

const LEVEL_POLICY: Record<Exclude<Level, 'open'>, { label: string; min: number; max: number; text: string }> = {
  beginner: { label: 'Anfänger', min: 0, max: 2.5, text: 'Playtomic 0.0 bis 2.5' },
  intermediate: { label: 'Fortgeschritten', min: 2.6, max: 4.0, text: 'Playtomic 2.6 bis 4.0' },
  advanced: { label: 'Experte', min: 4.1, max: 5.5, text: 'Playtomic 4.1 bis 5.5' },
};

function tomorrowDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function toIso(date: string, time: string): string | null {
  const normalizedTime = /^\d{2}:\d{2}$/.test(time) ? time : null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !normalizedTime) return null;
  const parsed = new Date(`${date}T${normalizedTime}:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export default function QuickCreateScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const { venues, fetchVenues } = useVenueStore();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [title, setTitle] = useState('Padel Beginner Turnier');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState<Level>('beginner');
  const [format, setFormat] = useState<'singles' | 'doubles'>('doubles');
  const [maxParticipants, setMaxParticipants] = useState('16');
  const [feeEuros, setFeeEuros] = useState('30');
  const [eventDate, setEventDate] = useState(tomorrowDate());
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('22:00');
  const [registrationCloseDate, setRegistrationCloseDate] = useState(tomorrowDate());
  const [registrationCloseTime, setRegistrationCloseTime] = useState('12:00');
  const [venueMode, setVenueMode] = useState<VenueMode>('custom');
  const [venueId, setVenueId] = useState<number | null>(null);
  const [venueName, setVenueName] = useState('');
  const [street, setStreet] = useState('');
  const [zip, setZip] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('DE');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [nearbyRadiusKm, setNearbyRadiusKm] = useState('50');
  const [requiresVerification, setRequiresVerification] = useState(true);
  const [publishAfterCreate, setPublishAfterCreate] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const policy = level === 'open' ? null : LEVEL_POLICY[level];

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  useEffect(() => {
    if (level === 'open') setRequiresVerification(false);
    if (level === 'beginner') setRequiresVerification(true);
  }, [level]);

  const validate = () => {
    if (!title.trim()) return 'Titel fehlt.';
    if (!toIso(eventDate, startTime) || !toIso(eventDate, endTime)) {
      return 'Bitte Datum und Uhrzeit exakt als YYYY-MM-DD und HH:mm eingeben.';
    }
    if (!toIso(registrationCloseDate, registrationCloseTime)) return 'Anmeldeschluss ist ungültig.';
    if (venueMode === 'existing' && !venueId) return 'Bitte eine bestehende Halle wählen.';
    if (venueMode === 'custom' && (!venueName.trim() || !street.trim() || !zip.trim() || !city.trim())) {
      return 'Bitte Hallenname, Straße, PLZ und Stadt eintragen.';
    }
    if (Number(maxParticipants) < 4) return 'Mindestens 4 Teilnehmer sind nötig.';
    if (Number(feeEuros) < 0) return 'Preis darf nicht negativ sein.';
    return null;
  };

  const handleSubmit = useCallback(async () => {
    const validationError = validate();
    if (validationError) {
      Alert.alert('Fehlt noch etwas', validationError);
      return;
    }

    const startIso = toIso(eventDate, startTime)!;
    const endIso = toIso(eventDate, endTime)!;
    const closeIso = toIso(registrationCloseDate, registrationCloseTime)!;
    const start = new Date(startIso);
    const end = new Date(endIso);
    const close = new Date(closeIso);
    if (end <= start) {
      Alert.alert('Uhrzeit prüfen', 'Ende muss nach dem Start liegen.');
      return;
    }
    if (close > start) {
      Alert.alert('Anmeldeschluss prüfen', 'Anmeldeschluss muss vor Turnierstart liegen.');
      return;
    }

    setSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    const entryFeeCents = Math.round(Number(feeEuros.replace(',', '.')) * 100);
    const payload: Record<string, any> = {
      title: title.trim(),
      description: description.trim() || undefined,
      sport_category: 'padel',
      event_type: 'tournament',
      start_date: startIso,
      end_date: endIso,
      registration_opens_at: new Date().toISOString(),
      registration_closes_at: closeIso,
      is_indoor: true,
      is_outdoor: false,
      format,
      elimination_type: 'single_elimination',
      has_third_place_match: true,
      max_participants: Number(maxParticipants),
      entry_fee_cents: entryFeeCents,
      currency: 'EUR',
      total_prize_pool_cents: 0,
      level,
      access_type: 'public',
      has_food_drinks: false,
      has_streaming: false,
      special_notes:
        'Startgeld gilt pro Person. Bei Duo-Anmeldung zahlt jeder Spieler seine eigene Gebühr.',
      requires_playtomic_verification: requiresVerification,
      min_playtomic_level: requiresVerification && policy ? policy.min : undefined,
      max_playtomic_level: requiresVerification && policy ? policy.max : undefined,
      eligibility_note: requiresVerification
        ? 'Screenshot muss Name, Playtomic-Level, Rankingpunkte und Profil klar zeigen. Daten werden nur zur Turnierzulassung geprüft.'
        : undefined,
      nearby_radius_km: Math.max(1, Number(nearbyRadiusKm) || 50),
      maintenance_mode: false,
      checkin_opens_minutes_before: 60,
      waitlist_payment_window_hours: 24,
    };

    if (venueMode === 'existing') {
      payload.venue_id = venueId;
    } else {
      payload.venue = {
        name: venueName.trim(),
        address_street: street.trim(),
        address_zip: zip.trim(),
        address_city: city.trim(),
        address_country: country.trim().toUpperCase() || 'DE',
        is_indoor: true,
        is_outdoor: false,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        partner_website_url: website.trim() || undefined,
      };
    }

    try {
      const res = await apiClient.post('/events', payload);
      const newId = res.data?.data?.id;
      if (publishAfterCreate && newId) {
        await apiClient.put(`/events/${newId}/publish`, {});
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Alert.alert(
        publishAfterCreate ? 'Turnier veröffentlicht' : 'Turnier erstellt',
        publishAfterCreate
          ? 'Das Turnier ist online und passende User in der Nähe werden benachrichtigt.'
          : 'Das Turnier ist als Entwurf angelegt.',
        [
        { text: 'Öffnen', onPress: () => (newId ? router.replace(`/event/${newId}`) : router.back()) },
        { text: 'Schließen', style: 'cancel', onPress: () => router.back() },
        ]
      );
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Alert.alert('Fehler', err?.response?.data?.error?.message || 'Erstellen fehlgeschlagen.');
    } finally {
      setSubmitting(false);
    }
  }, [
    title,
    description,
    level,
    format,
    maxParticipants,
    feeEuros,
    eventDate,
    startTime,
    endTime,
    registrationCloseDate,
    registrationCloseTime,
    venueMode,
    venueId,
    venueName,
    street,
    zip,
    city,
    country,
    phone,
    email,
    website,
    nearbyRadiusKm,
    requiresVerification,
    policy,
    publishAfterCreate,
    router,
  ]);

  if (!isAdmin) {
    return (
      <View style={[styles.loader, { backgroundColor: colors.bg }]}>
        <Stack.Screen options={{ title: 'Turnier anlegen', headerShown: true }} />
        <Text style={{ color: colors.textSecondary }}>Nur Admins können Turniere anlegen.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ title: 'Turnier anlegen', headerShown: true }} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 240 }}>
        <Section title="Turnier">
          <Field label="Titel" value={title} onChangeText={setTitle} colors={colors} />
          <Field
            label="Beschreibung"
            value={description}
            onChangeText={setDescription}
            colors={colors}
            multiline
            placeholder="Was müssen Spieler wissen?"
          />
          <View style={styles.row}>
            {(['beginner', 'intermediate', 'advanced', 'open'] as Level[]).map((value) => (
              <Chip
                key={value}
                label={value === 'open' ? 'Offen' : LEVEL_POLICY[value].label}
                active={level === value}
                colors={colors}
                onPress={() => setLevel(value)}
              />
            ))}
          </View>
          <View style={styles.row}>
            <Chip label="Doppel" active={format === 'doubles'} colors={colors} onPress={() => setFormat('doubles')} />
            <Chip label="Einzel" active={format === 'singles'} colors={colors} onPress={() => setFormat('singles')} />
          </View>
          <View style={styles.twoCol}>
            <Field label="Teilnehmer max." value={maxParticipants} onChangeText={setMaxParticipants} colors={colors} keyboardType="number-pad" />
            <Field label="Preis p.P. EUR" value={feeEuros} onChangeText={setFeeEuros} colors={colors} keyboardType="decimal-pad" />
          </View>
        </Section>

        <Section title="Datum und Anmeldung">
          <Field label="Datum" value={eventDate} onChangeText={setEventDate} colors={colors} placeholder="YYYY-MM-DD" />
          <View style={styles.twoCol}>
            <Field label="Start" value={startTime} onChangeText={setStartTime} colors={colors} placeholder="18:00" />
            <Field label="Ende" value={endTime} onChangeText={setEndTime} colors={colors} placeholder="22:00" />
          </View>
          <View style={styles.twoCol}>
            <Field label="Anmeldeschluss Datum" value={registrationCloseDate} onChangeText={setRegistrationCloseDate} colors={colors} />
            <Field label="Uhrzeit" value={registrationCloseTime} onChangeText={setRegistrationCloseTime} colors={colors} />
          </View>
          <Field label="Benachrichtigungsradius km" value={nearbyRadiusKm} onChangeText={setNearbyRadiusKm} colors={colors} keyboardType="number-pad" />
        </Section>

        <Section title="Halle und Adresse">
          <View style={styles.row}>
            <Chip label="Eigene Halle" active={venueMode === 'custom'} colors={colors} onPress={() => setVenueMode('custom')} />
            <Chip label="Bestehende Halle" active={venueMode === 'existing'} colors={colors} onPress={() => setVenueMode('existing')} />
          </View>
          {venueMode === 'existing' ? (
            <View style={{ gap: spacing.xs }}>
              {venues.slice(0, 8).map((venue) => {
                const numericId = Number(venue.id);
                const active = venueId === numericId;
                return (
                  <TouchableOpacity
                    key={venue.id}
                    onPress={() => setVenueId(numericId)}
                    style={[styles.venueRow, active && { borderColor: colors.primary, borderWidth: 2 }]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.venueName}>{venue.name}</Text>
                      <Text style={styles.venueCity}>{venue.address_city}</Text>
                    </View>
                    {active ? <Ionicons name="checkmark-circle" size={20} color={colors.primary} /> : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <>
              <Field label="Hallenname" value={venueName} onChangeText={setVenueName} colors={colors} />
              <Field label="Straße und Hausnummer" value={street} onChangeText={setStreet} colors={colors} />
              <View style={styles.twoCol}>
                <Field label="PLZ" value={zip} onChangeText={setZip} colors={colors} />
                <Field label="Stadt" value={city} onChangeText={setCity} colors={colors} />
              </View>
              <Field label="Land" value={country} onChangeText={setCountry} colors={colors} />
              <Field label="Telefon optional" value={phone} onChangeText={setPhone} colors={colors} keyboardType="phone-pad" />
              <Field label="E-Mail optional" value={email} onChangeText={setEmail} colors={colors} keyboardType="email-address" />
              <Field label="Website optional" value={website} onChangeText={setWebsite} colors={colors} autoCapitalize="none" />
            </>
          )}
        </Section>

        <Section title="Zulassung">
          <TouchableOpacity
            onPress={() => level !== 'open' && setRequiresVerification((v) => !v)}
            disabled={level === 'open'}
            style={[styles.toggleRow, { borderColor: colors.cardBorder, opacity: level === 'open' ? 0.55 : 1 }]}
          >
            <View style={[styles.checkBox, requiresVerification && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
              {requiresVerification ? <Ionicons name="checkmark" size={14} color="#FFF" /> : null}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleTitle}>Playtomic-Zulassung erforderlich</Text>
              <Text style={styles.helpText}>
                {policy ? `${policy.text}. Für offene Turniere ist keine Prüfung nötig.` : 'Offene Turniere brauchen keine Level-Prüfung.'}
              </Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.helpText}>
            Interne Tourneo-Policy: Anfänger 0.0-2.5, Fortgeschritten 2.6-4.0,
            Experte 4.1-5.5, Profi ab 5.6. Profi-Turniere können später als eigener Level-Typ ergänzt werden.
          </Text>
        </Section>

        <Section title="Veröffentlichen">
          <View style={[styles.checklistCard, { borderColor: colors.cardBorder, backgroundColor: colors.surface }]}>
            <ChecklistRow label="Datum und Uhrzeit exakt eingetragen" done={Boolean(toIso(eventDate, startTime) && toIso(eventDate, endTime))} colors={colors} />
            <ChecklistRow label="Halle mit Adresse hinterlegt" done={venueMode === 'existing' ? Boolean(venueId) : Boolean(venueName && street && zip && city)} colors={colors} />
            <ChecklistRow label="Preis pro Person geprüft" done={Number(feeEuros.replace(',', '.')) >= 0} colors={colors} />
            <ChecklistRow label="Zulassungsregeln sichtbar" done={!requiresVerification || Boolean(policy)} colors={colors} />
          </View>
          <TouchableOpacity
            onPress={() => setPublishAfterCreate((v) => !v)}
            style={[styles.toggleRow, { borderColor: colors.cardBorder }]}
          >
            <View style={[styles.checkBox, publishAfterCreate && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
              {publishAfterCreate ? <Ionicons name="checkmark" size={14} color="#FFF" /> : null}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleTitle}>Nach dem Anlegen direkt veröffentlichen</Text>
              <Text style={styles.helpText}>Neue Termine stehen oben in der Liste und lösen Nähe-Benachrichtigungen aus.</Text>
            </View>
          </TouchableOpacity>
        </Section>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.bg, borderTopColor: colors.border }]}>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitting}
          style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: submitting ? 0.5 : 1 }]}
        >
          <Text style={styles.submitText}>{submitting ? 'Erstelle...' : publishAfterCreate ? 'Turnier anlegen & veröffentlichen' : 'Turnier anlegen'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: spacing.lg }}>
      <Text style={sectionStyles.title}>{title}</Text>
      <View style={{ gap: spacing.sm }}>{children}</View>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  colors,
  placeholder,
  multiline,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  colors: Colors;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'email-address' | 'number-pad' | 'decimal-pad' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: colors.textTertiary, fontSize: fontSize.xxs, marginBottom: 5, fontWeight: fontWeight.semibold as any }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary as string}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={{
          minHeight: multiline ? 92 : 46,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.cardBorder,
          backgroundColor: colors.surface,
          color: colors.textPrimary,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          fontSize: fontSize.sm,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
      />
    </View>
  );
}

function Chip({
  label,
  active,
  colors,
  onPress,
}: {
  label: string;
  active: boolean;
  colors: Colors;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        chipStyles.chip,
        {
          backgroundColor: active ? colors.primary : colors.surface,
          borderColor: active ? colors.primary : colors.cardBorder,
        },
      ]}
    >
      <Text style={[chipStyles.text, { color: active ? '#FFF' : colors.textPrimary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function ChecklistRow({ label, done, colors }: { label: string; done: boolean; colors: Colors }) {
  return (
    <View style={checkStyles.row}>
      <Ionicons
        name={done ? 'checkmark-circle' : 'ellipse-outline'}
        size={18}
        color={done ? colors.success : colors.textTertiary}
      />
      <Text style={[checkStyles.text, { color: colors.textPrimary }]}>{label}</Text>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  title: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold as any,
    textTransform: 'uppercase',
    letterSpacing: 0,
    marginBottom: spacing.sm,
    color: '#94A3B8',
  },
});

const chipStyles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  text: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold as any },
});

const checkStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  text: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold as any, flex: 1 },
});

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    loader: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    twoCol: { flexDirection: 'row', gap: spacing.sm },
    venueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.surface,
    },
    venueName: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold as any, color: colors.textPrimary },
    venueCity: { fontSize: fontSize.xs, color: colors.textTertiary, marginTop: 2 },
    toggleRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      backgroundColor: colors.surface,
    },
    checkBox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: colors.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    toggleTitle: { color: colors.textPrimary, fontSize: fontSize.sm, fontWeight: fontWeight.bold as any },
    helpText: { color: colors.textSecondary, fontSize: fontSize.xs, lineHeight: 18, marginTop: 4 },
    checklistCard: {
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      gap: spacing.sm,
    },
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
    submitText: { color: '#fff', fontSize: fontSize.base, fontWeight: fontWeight.bold as any },
  });
