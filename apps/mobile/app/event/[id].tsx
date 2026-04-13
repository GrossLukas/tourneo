import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppColors } from '../../src/hooks/useColorScheme';
import { TButton, TBadge, TCard, THeader, TLoadingScreen } from '../../src/components/common';
import { useEventStore } from '../../src/store/eventStore';
import { useAuthStore } from '../../src/store/authStore';
import { spacing, fontSize, fontWeight } from '../../src/theme/spacing';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useAppColors();
  const { currentEvent, fetchEventById, loading } = useEventStore();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (id) fetchEventById(Number(id));
  }, [id]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (id) await fetchEventById(Number(id));
    setRefreshing(false);
  };

  if (loading || !currentEvent) {
    return <TLoadingScreen message="Event wird geladen..." />;
  }

  const e = currentEvent;
  const spotsLeft = e.spots_remaining ?? (e.max_participants - e.participant_count);
  const isFull = spotsLeft <= 0;
  const feeAmount = e.entry_fee_cents / 100;
  const prizeTotal = e.total_prize_pool_cents / 100;

  const formatDate = (dateStr: string): string => {
    try { return format(new Date(dateStr), 'EEEE, dd. MMMM yyyy', { locale: de }); }
    catch { return dateStr; }
  };

  const getSkillLabel = (s: string): string => {
    const map: Record<string, string> = { beginner: 'Anfänger', intermediate: 'Mittel', advanced: 'Fortgeschritten', open: 'Alle Level' };
    return map[s] || s;
  };

  const getFormatLabel = (f: string): string => {
    const map: Record<string, string> = { singles: 'Einzel', doubles: 'Doppel' };
    return map[f] || f;
  };

  const handleRegister = () => {
    if (!user) {
      Alert.alert('Anmeldung erforderlich', 'Bitte melde dich an, um dich für ein Turnier zu registrieren.', [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Anmelden', onPress: () => router.push('/(auth)/login') },
      ]);
      return;
    }
    router.push(`/event/register/${id}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.neutral[50] }]}>
      <THeader title={e.title} showBack onBack={() => router.back()} />
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary[500]} />}
        showsVerticalScrollIndicator={false}
      >
        {e.banner_image_url ? (
          <Image source={{ uri: e.banner_image_url }} style={styles.heroImage} />
        ) : null}

        <View style={styles.content}>
          {/* Badges */}
          <View style={styles.badges}>
            <TBadge label={getSkillLabel(e.level)} variant="info" />
            <TBadge label={getFormatLabel(e.format)} variant="default" />
            <TBadge label={e.status === 'published' ? 'Offen' : e.status} variant={e.status === 'published' ? 'success' : 'default'} />
            {isFull && <TBadge label="Ausgebucht" variant="error" />}
          </View>

          <Text style={[styles.title, { color: colors.neutral[900] }]}>{e.title}</Text>

          {/* Key Info Cards */}
          <View style={styles.infoGrid}>
            <TCard variant="outlined" style={styles.infoCard}>
              <Text style={styles.infoIcon}>📅</Text>
              <Text style={[styles.infoLabel, { color: colors.neutral[500] }]}>Datum</Text>
              <Text style={[styles.infoValue, { color: colors.neutral[900] }]}>
                {formatDate(e.start_date)}
              </Text>
            </TCard>

            <TCard variant="outlined" style={styles.infoCard}>
              <Text style={styles.infoIcon}>📍</Text>
              <Text style={[styles.infoLabel, { color: colors.neutral[500] }]}>Ort</Text>
              <Text style={[styles.infoValue, { color: colors.neutral[900] }]}>
                {e.venue?.name || 'TBD'}
              </Text>
              <Text style={[styles.infoSub, { color: colors.neutral[600] }]}>
                {e.venue?.city || ''}
              </Text>
            </TCard>
          </View>

          <View style={styles.infoGrid}>
            <TCard variant="outlined" style={styles.infoCard}>
              <Text style={styles.infoIcon}>👥</Text>
              <Text style={[styles.infoLabel, { color: colors.neutral[500] }]}>Teilnehmer</Text>
              <Text style={[styles.infoValue, { color: colors.neutral[900] }]}>
                {e.participant_count}/{e.max_participants}
              </Text>
              <Text style={[styles.infoSub, { color: spotsLeft <= 4 ? colors.status.warning : colors.neutral[600] }]}>
                {isFull ? 'Warteliste verfügbar' : `Noch ${spotsLeft} Plätze`}
              </Text>
            </TCard>

            <TCard variant="outlined" style={styles.infoCard}>
              <Text style={styles.infoIcon}>💰</Text>
              <Text style={[styles.infoLabel, { color: colors.neutral[500] }]}>Gebühr</Text>
              <Text style={[styles.infoValue, { color: colors.primary[600] }]}>
                {feeAmount > 0 ? `${feeAmount.toFixed(2)} €` : 'Kostenlos'}
              </Text>
              <Text style={[styles.infoSub, { color: colors.neutral[600] }]}>
                pro Person
              </Text>
            </TCard>
          </View>

          {/* Prize Pool */}
          {prizeTotal > 0 && (
            <TCard variant="elevated" style={StyleSheet.flatten([styles.prizeCard, { borderColor: colors.membership.club }])}>
              <Text style={styles.prizeIcon}>🏆</Text>
              <Text style={[styles.prizeTitle, { color: colors.neutral[900] }]}>
                Garantiertes Preisgeld
              </Text>
              <Text style={[styles.prizeAmount, { color: colors.membership.club }]}>
                {prizeTotal.toFixed(0)} €
              </Text>
              {e.prize_distribution && e.prize_distribution.length > 0 && (
                <View style={styles.prizeBreakdown}>
                  {e.prize_distribution.map((pd, idx) => (
                    <View key={idx} style={styles.prizeRow}>
                      <Text style={[styles.prizePlace, { color: colors.neutral[600] }]}>
                        {pd.place === 1 ? '🥇' : pd.place === 2 ? '🥈' : pd.place === 3 ? '🥉' : `${pd.place}.`} Platz {pd.place}
                      </Text>
                      <Text style={[styles.prizeValue, { color: colors.neutral[900] }]}>
                        {(pd.amount_cents / 100).toFixed(0)} €
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </TCard>
          )}

          {/* Description */}
          {e.description ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.neutral[900] }]}>Beschreibung</Text>
              <Text style={[styles.description, { color: colors.neutral[700] }]}>{e.description}</Text>
            </View>
          ) : null}

          {/* Special Notes */}
          {e.special_notes ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.neutral[900] }]}>Hinweise & Regeln</Text>
              <Text style={[styles.description, { color: colors.neutral[700] }]}>{e.special_notes}</Text>
            </View>
          ) : null}

          {/* Bracket Link */}
          {e.status === 'in_progress' || e.status === 'completed' ? (
            <TButton
              title="Spielplan anzeigen"
              onPress={() => router.push(`/event/bracket/${id}`)}
              variant="outline"
              icon={<Text>🏟️</Text>}
              style={{ marginBottom: spacing.md }}
            />
          ) : null}

          {/* Cancellation Policy */}
          <TCard variant="outlined" style={styles.policyCard}>
            <Text style={[styles.policyTitle, { color: colors.neutral[900] }]}>
              ⚠️ Stornierungsrichtlinie
            </Text>
            <Text style={[styles.policyText, { color: colors.neutral[600] }]}>
              • 14+ Tage vor Event: 75% Erstattung{'\n'}
              • Weniger als 14 Tage: Keine Erstattung{'\n'}
              • Stornierung durch Veranstalter: 100% Erstattung
            </Text>
          </TCard>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Registration Bar */}
      {e.status === 'published' && (
        <View style={[styles.bottomBar, { backgroundColor: colors.neutral[50], borderTopColor: colors.neutral[200] }]}>
          <View style={styles.bottomBarLeft}>
            <Text style={[styles.bottomPrice, { color: colors.primary[600] }]}>
              {feeAmount > 0 ? `${feeAmount.toFixed(2)} €` : 'Kostenlos'}
            </Text>
            <Text style={[styles.bottomSpotsText, { color: colors.neutral[500] }]}>
              {isFull ? 'Warteliste' : `${spotsLeft} Plätze frei`}
            </Text>
          </View>
          <TButton
            title={isFull ? 'Auf Warteliste' : 'Jetzt anmelden'}
            onPress={handleRegister}
            size="lg"
            fullWidth={false}
            style={{ paddingHorizontal: spacing.xl }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroImage: { width: '100%', height: 220, resizeMode: 'cover' },
  content: { padding: spacing.md },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xxs, marginBottom: spacing.sm },
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold as any, marginBottom: spacing.md },
  infoGrid: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  infoCard: { flex: 1, alignItems: 'center', padding: spacing.md },
  infoIcon: { fontSize: 24, marginBottom: spacing.xs },
  infoLabel: { fontSize: fontSize.xs, marginBottom: 2 },
  infoValue: { fontSize: fontSize.md, fontWeight: fontWeight.bold as any, textAlign: 'center' },
  infoSub: { fontSize: fontSize.xs, marginTop: 2, textAlign: 'center' },
  prizeCard: { marginBottom: spacing.md, alignItems: 'center', borderWidth: 1 },
  prizeIcon: { fontSize: 36, marginBottom: spacing.xs },
  prizeTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold as any },
  prizeAmount: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold as any, marginVertical: spacing.xs },
  prizeBreakdown: { width: '100%', marginTop: spacing.sm },
  prizeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xxs },
  prizePlace: { fontSize: fontSize.sm },
  prizeValue: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold as any },
  section: { marginBottom: spacing.md },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold as any, marginBottom: spacing.sm },
  description: { fontSize: fontSize.md, lineHeight: 22 },
  policyCard: { marginBottom: spacing.md },
  policyTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold as any, marginBottom: spacing.sm },
  policyText: { fontSize: fontSize.sm, lineHeight: 22 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? 34 : spacing.md,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  bottomBarLeft: {},
  bottomPrice: { fontSize: fontSize.lg, fontWeight: fontWeight.bold as any },
  bottomSpotsText: { fontSize: fontSize.xs, marginTop: 1 },
});