import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppColors } from '../../../src/hooks/useColorScheme';
import {
  TButton, TCard, THeader, TInput, TChip, TDivider, TLoadingScreen,
} from '../../../src/components/common';
import { useEventStore } from '../../../src/store/eventStore';
import { useRegistrationStore } from '../../../src/store/registrationStore';
import { useMembershipStore } from '../../../src/store/membershipStore';
import { spacing, fontSize, fontWeight } from '../../../src/theme/spacing';

type RegType = 'solo' | 'duo' | 'team';

export default function EventRegisterScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useAppColors();
  const { currentEvent, fetchEventById } = useEventStore();
  const { registerForEvent, loading } = useRegistrationStore();
  const { currentMembership } = useMembershipStore();

  const [regType, setRegType] = useState<RegType>('solo');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [teamName, setTeamName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (id) fetchEventById(Number(id));
  }, [id]);

  if (!currentEvent) return <TLoadingScreen message="Wird geladen..." />;

  const e = currentEvent;
  const feeAmount = e.entry_fee_cents / 100;
  const discount = currentMembership?.tier === 'club' ? 20 : currentMembership?.tier === 'plus' ? 10 : 0;
  const finalFee = feeAmount * (1 - discount / 100);
  const spotsLeft = e.spots_remaining ?? (e.max_participants - e.participant_count);
  const isFull = spotsLeft <= 0;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (regType === 'duo' && !partnerEmail.trim()) {
      newErrors.partner = 'Partner E-Mail ist erforderlich';
    } else if (regType === 'duo' && !/\S+@\S+\.\S+/.test(partnerEmail)) {
      newErrors.partner = 'Ungültige E-Mail-Adresse';
    }
    if (regType === 'team' && !teamName.trim()) {
      newErrors.team = 'Teamname ist erforderlich';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    const confirmMessage = isFull
      ? `Du wirst auf die Warteliste gesetzt. ${finalFee > 0 ? `Erst bei Nachrücken wird die Gebühr von ${finalFee.toFixed(2)} € fällig.` : ''}`
      : `Gebühr: ${finalFee > 0 ? `${finalFee.toFixed(2)} €` : 'Kostenlos'}${discount > 0 ? ` (${discount}% Mitglieder-Rabatt)` : ''}`;

    Alert.alert(
      isFull ? 'Auf Warteliste setzen?' : 'Anmeldung bestätigen?',
      confirmMessage,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: isFull ? 'Ja, auf Warteliste' : 'Jetzt anmelden',
          onPress: async () => {
            try {
              await registerForEvent({
                event_id: id!,
                registration_type: regType,
                partner_user_id: regType === 'duo' ? partnerEmail.trim() : undefined,
                team_id: regType === 'team' ? teamName.trim() : undefined,
              });
              Alert.alert(
                'Erfolg! 🎉',
                isFull
                  ? 'Du bist auf der Warteliste. Wir benachrichtigen dich, wenn ein Platz frei wird.'
                  : 'Du bist für das Turnier angemeldet!',
                [{ text: 'OK', onPress: () => router.back() }]
              );
            } catch (error: any) {
              Alert.alert('Fehler', error.message || 'Anmeldung fehlgeschlagen');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgSecondary }]}>
      <THeader title="Anmeldung" subtitle={e.title} showBack onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Event Summary */}
        <TCard variant="outlined" style={styles.eventSummary}>
          <Text style={[styles.eventTitle, { color: colors.textPrimary }]}>{e.title}</Text>
          <Text style={[styles.eventMeta, { color: colors.textSecondary }]}>
            📅 {e.start_date}
          </Text>
          <Text style={[styles.eventMeta, { color: colors.textSecondary }]}>
            📍 {e.venue?.name || 'TBD'}{e.venue?.city ? `, ${e.venue.city}` : ''}
          </Text>
        </TCard>

        {/* Registration Type */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Anmeldeart</Text>
        <View style={styles.regTypeRow}>
          <TChip label="Einzel" selected={regType === 'solo'} onPress={() => setRegType('solo')} />
          <TChip label="Duo" selected={regType === 'duo'} onPress={() => setRegType('duo')} />
          <TChip label="Team" selected={regType === 'team'} onPress={() => setRegType('team')} />
        </View>

        {regType === 'duo' && (
          <TInput
            label="Partner E-Mail"
            placeholder="partner@email.de"
            value={partnerEmail}
            onChangeText={setPartnerEmail}
            error={errors.partner}
            keyboardType="email-address"
            autoCapitalize="none"
            hint="Dein Partner muss bereits bei Turneo registriert sein"
          />
        )}

        {regType === 'team' && (
          <TInput
            label="Team auswählen"
            placeholder="Teamname"
            value={teamName}
            onChangeText={setTeamName}
            error={errors.team}
            hint="Wähle ein bestehendes Team oder gib den Namen ein"
          />
        )}

        <TDivider />

        {/* Fee Breakdown */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Kostenübersicht</Text>
        <TCard variant="outlined">
          <View style={styles.feeRow}>
            <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>Turniergebühr</Text>
            <Text style={[styles.feeValue, { color: colors.textPrimary }]}>
              {feeAmount.toFixed(2)} €
            </Text>
          </View>
          {discount > 0 && (
            <View style={styles.feeRow}>
              <Text style={[styles.feeLabel, { color: colors.success }]}>
                {currentMembership?.tier === 'club' ? 'Club' : 'Plus'}-Rabatt ({discount}%)
              </Text>
              <Text style={[styles.feeValue, { color: colors.success }]}>
                -{(feeAmount * discount / 100).toFixed(2)} €
              </Text>
            </View>
          )}
          <TDivider marginVertical={spacing.sm} />
          <View style={styles.feeRow}>
            <Text style={[styles.feeTotalLabel, { color: colors.textPrimary }]}>Gesamt</Text>
            <Text style={[styles.feeTotalValue, { color: (colors.primary as string) }]}>
              {finalFee.toFixed(2)} €
            </Text>
          </View>
        </TCard>

        {discount === 0 && (
          <TCard variant="outlined" style={StyleSheet.flatten([styles.upsellCard, { borderColor: colors.membership.plus }])}>
            <Text style={[styles.upsellText, { color: colors.textSecondary }]}>
              💡 Mit Plus (7,99€/Mo) sparst du 10% auf Turniergebühren!
            </Text>
            <TButton
              title="Mitgliedschaft anzeigen"
              onPress={() => router.push('/membership')}
              variant="ghost"
              size="sm"
              fullWidth={false}
            />
          </TCard>
        )}

        {isFull && (
          <TCard variant="outlined" style={StyleSheet.flatten([styles.waitlistCard, { borderColor: colors.warning }])}>
            <Text style={styles.waitlistIcon}>⏳</Text>
            <Text style={[styles.waitlistTitle, { color: colors.textPrimary }]}>
              Turnier ist voll
            </Text>
            <Text style={[styles.waitlistText, { color: colors.textSecondary }]}>
              Du wirst auf die Warteliste gesetzt. Bei Club/Plus-Mitgliedschaft hast du Priorität beim Nachrücken.
            </Text>
          </TCard>
        )}

        {/* Cancellation Info */}
        <Text style={[styles.policyText, { color: colors.textTertiary }]}>
          Mit der Anmeldung akzeptierst du die Stornierungsrichtlinie: 75% Erstattung bei Stornierung 14+ Tage vor dem Event, keine Erstattung danach.
        </Text>

        <TButton
          title={isFull ? 'Auf Warteliste setzen' : `Jetzt anmelden · ${finalFee.toFixed(2)} €`}
          onPress={handleRegister}
          loading={loading}
          size="lg"
          style={{ marginTop: spacing.md }}
        />

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md },
  eventSummary: { marginBottom: spacing.lg },
  eventTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold as any, marginBottom: spacing.xs },
  eventMeta: { fontSize: fontSize.sm, marginBottom: 3 },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold as any, marginBottom: spacing.sm },
  regTypeRow: { flexDirection: 'row', marginBottom: spacing.md },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  feeLabel: { fontSize: fontSize.md },
  feeValue: { fontSize: fontSize.md, fontWeight: fontWeight.medium as any },
  feeTotalLabel: { fontSize: fontSize.lg, fontWeight: fontWeight.bold as any },
  feeTotalValue: { fontSize: fontSize.lg, fontWeight: fontWeight.bold as any },
  upsellCard: { marginTop: spacing.md, borderWidth: 1, alignItems: 'center' },
  upsellText: { fontSize: fontSize.sm, textAlign: 'center', marginBottom: spacing.sm },
  waitlistCard: { marginTop: spacing.md, borderWidth: 1, alignItems: 'center' },
  waitlistIcon: { fontSize: 32, marginBottom: spacing.xs },
  waitlistTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold as any, marginBottom: spacing.xs },
  waitlistText: { fontSize: fontSize.sm, textAlign: 'center', lineHeight: 20 },
  policyText: { fontSize: fontSize.xs, textAlign: 'center', lineHeight: 18, marginTop: spacing.lg },
});