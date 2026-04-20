import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../src/providers/ThemeProvider';
import { TButton, TBadge, TCard, THeader, TLoadingScreen, TFavoriteButton, TCountdown } from '../../src/components/common';
import { useEventStore } from '../../src/store/eventStore';
import { useAuthStore } from '../../src/store/authStore';
import { useCalendar } from '../../src/hooks/useCalendar';
import { shareTournamentInvite } from '../../src/utils/shareMatch';
import { spacing, fontSize, fontWeight } from '../../src/theme/spacing';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { currentEvent, fetchEventById, loading } = useEventStore();
  const { user } = useAuthStore();
  const { addToCalendar, isAdding } = useCalendar();
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

  const handleShare = async () => {
    await shareTournamentInvite(Number(id), e.title, e.start_date ?? undefined);
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
    <View style={[styles.container, { backgroundColor: colors.bgSecondary }]}>
      <THeader
        title={e.title}
        showBack
        onBack={() => router.back()}
        rightAction={
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleShare}>
              <Ionicons name="share-outline" size={24} color={colors.textLink} />
            </TouchableOpacity>
            <TFavoriteButton eventId={Number(id)} />
          </View>
        }
      />
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={(colors.primary as string)} />}
        showsVerticalScrollIndicator={false}
      >
        {e.banner_image_url ? (
          <View style={styles.heroImageContainer}>
            <Image
              source={{ uri: e.banner_image_url }}
              style={styles.heroImage}
              placeholder="L6PZfSi_.AyE_3t7t7R**0o#DgR4"
              contentFit="cover"
              transition={300}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.6)']}
              style={styles.heroGradient}
            />
          </View>
        ) : null}

        <View style={styles.content}>
          {/* Badges */}
          <View style={styles.badges}>
            <TBadge label={getSkillLabel(e.level)} variant="info" />
            <TBadge label={getFormatLabel(e.format)} variant="default" />
            <TBadge label={e.status === 'published' ? 'Offen' : e.status} variant={e.status === 'published' ? 'success' : 'default'} />
            {isFull && <TBadge label="Ausgebucht" variant="error" />}
          </View>

          {/* Countdown */}
          {(e.status === 'published' || e.status === 'registration_open') && new Date(e.start_date) > new Date() && (
            <View style={styles.countdownSection}>
              <Text style={[styles.countdownLabel, { color: colors.textTertiary }]}>
                Turnier startet in
              </Text>
              <TCountdown targetDate={e.start_date} size="md" />
            </View>
          )}

          <Text style={[styles.title, { color: colors.textPrimary }]}>{e.title}</Text>

          {/* Key Info Cards */}
          <View style={styles.infoGrid}>
            <TCard variant="outlined" style={styles.infoCard}>
              <Text style={styles.infoIcon}>📅</Text>
              <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>Datum</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                {formatDate(e.start_date)}
              </Text>
            </TCard>

            <TCard variant="outlined" style={styles.infoCard}>
              <Text style={styles.infoIcon}>📍</Text>
              <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>Ort</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                {e.venue?.name || 'TBD'}
              </Text>
              <Text style={[styles.infoSub, { color: colors.textSecondary }]}>
                {e.venue?.city || ''}
              </Text>
            </TCard>
          </View>

          <View style={styles.infoGrid}>
            <TCard variant="outlined" style={styles.infoCard}>
              <Text style={styles.infoIcon}>👥</Text>
              <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>Teilnehmer</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                {e.participant_count}/{e.max_participants}
              </Text>
              <Text style={[styles.infoSub, { color: spotsLeft <= 4 ? colors.warning : colors.textSecondary }]}>
                {isFull ? 'Warteliste verfügbar' : `Noch ${spotsLeft} Plätze`}
              </Text>
            </TCard>

            <TCard variant="outlined" style={styles.infoCard}>
              <Text style={styles.infoIcon}>💰</Text>
              <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>Gebühr</Text>
              <Text style={[styles.infoValue, { color: (colors.primary as string) }]}>
                {feeAmount > 0 ? `${feeAmount.toFixed(2)} €` : 'Kostenlos'}
              </Text>
              <Text style={[styles.infoSub, { color: colors.textSecondary }]}>
                pro Person
              </Text>
            </TCard>
          </View>

          {/* Prize Pool */}
          {prizeTotal > 0 && (
            <TCard variant="elevated" style={StyleSheet.flatten([styles.prizeCard, { borderColor: colors.membership.club }])}>
              <Text style={styles.prizeIcon}>🏆</Text>
              <Text style={[styles.prizeTitle, { color: colors.textPrimary }]}>
                Garantiertes Preisgeld
              </Text>
              <Text style={[styles.prizeAmount, { color: colors.membership.club }]}>
                {prizeTotal.toFixed(0)} €
              </Text>
              {e.prize_distribution && e.prize_distribution.length > 0 && (
                <View style={styles.prizeBreakdown}>
                  {e.prize_distribution.map((pd, idx) => (
                    <View key={idx} style={styles.prizeRow}>
                      <Text style={[styles.prizePlace, { color: colors.textSecondary }]}>
                        {pd.place === 1 ? '🥇' : pd.place === 2 ? '🥈' : pd.place === 3 ? '🥉' : `${pd.place}.`} Platz {pd.place}
                      </Text>
                      <Text style={[styles.prizeValue, { color: colors.textPrimary }]}>
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
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Beschreibung</Text>
              <Text style={[styles.description, { color: colors.textSecondary }]}>{e.description}</Text>
            </View>
          ) : null}

          {/* Special Notes */}
          {e.special_notes ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Hinweise & Regeln</Text>
              <Text style={[styles.description, { color: colors.textSecondary }]}>{e.special_notes}</Text>
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

          {/* Add to Calendar */}
          <TButton
            title={isAdding ? 'Wird hinzugefügt...' : '📅 Zum Kalender hinzufügen'}
            onPress={() => {
              if (!e) return;
              const startDate = new Date(e.start_date);
              const endDate = e.end_date ? new Date(e.end_date) : new Date(startDate.getTime() + 3 * 60 * 60 * 1000);
              addToCalendar({
                title: e.title,
                startDate,
                endDate,
                location: e.venue?.name ? `${e.venue.name}${e.venue.city ? ', ' + e.venue.city : ''}` : undefined,
                notes: `Tourneo Event: ${e.title}\nFormat: ${e.format}\nLevel: ${e.level}`,
              });
            }}
            variant="outline"
            loading={isAdding}
            style={{ marginBottom: spacing.md }}
          />

          {/* Cancellation Policy */}
          <TCard variant="outlined" style={styles.policyCard}>
            <Text style={[styles.policyTitle, { color: colors.textPrimary }]}>
              ⚠️ Stornierungsrichtlinie
            </Text>
            <Text style={[styles.policyText, { color: colors.textSecondary }]}>
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
        <BlurView intensity={80} tint="dark" style={[styles.bottomBar, { borderTopColor: colors.border }]}>
          <View style={styles.bottomBarLeft}>
            <Text style={[styles.bottomPrice, { color: (colors.primary as string) }]}>
              {feeAmount > 0 ? `${feeAmount.toFixed(2)} €` : 'Kostenlos'}
            </Text>
            <Text style={[styles.bottomSpotsText, { color: colors.textTertiary }]}>
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
        </BlurView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroImageContainer: { width: '100%', height: 220 },
  heroImage: { width: '100%', height: 220 },
  heroGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%' },
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  countdownSection: {
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  countdownLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium as any,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});