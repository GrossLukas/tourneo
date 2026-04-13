import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppColors } from '../../src/hooks/useColorScheme';
import { useAuthStore } from '../../src/store/authStore';
import { useEventStore, type Event } from '../../src/store/eventStore';
import { useRegistrationStore } from '../../src/store/registrationStore';
import { useMembershipStore } from '../../src/store/membershipStore';
import { spacing, fontSize, fontWeight, radius, shadow } from '../../src/theme/spacing';

const { width: SCREEN_W } = Dimensions.get('window');

// ── Hero Event Card ──────────────────────────────
function HeroEventCard({ event, colors, onPress }: { event: Event; colors: any; onPress: () => void }) {
  const feeAmount = event.entry_fee_cents / 100;
  const spotsLeft = event.spots_remaining ?? (event.max_participants - event.participant_count);

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={[styles.heroCard, { backgroundColor: colors.surface }]}>
      {event.banner_image_url ? (
        <Image source={{ uri: event.banner_image_url }} style={styles.heroImage} />
      ) : (
        <View style={[styles.heroImage, { backgroundColor: colors.brand.teal[800] }]}>
          <Text style={styles.heroPlaceholder}>🎾</Text>
        </View>
      )}
      <View style={[styles.heroGradient, { backgroundColor: 'rgba(0,0,0,0.35)' }]} />
      <View style={styles.heroOverlay}>
        <View style={[styles.heroBadge, { backgroundColor: colors.brand.teal[500] }]}>
          <Text style={styles.heroBadgeText}>NÄCHSTES TURNIER</Text>
        </View>
        <Text style={styles.heroTitle} numberOfLines={2}>{event.title}</Text>
        <View style={styles.heroMeta}>
          <Text style={styles.heroMetaText}>📅 {event.start_date?.substring(0, 10)}</Text>
          {event.venue?.name && <Text style={styles.heroMetaText}>📍 {event.venue.name}</Text>}
        </View>
        <View style={styles.heroFooter}>
          <Text style={styles.heroPrice}>
            {feeAmount > 0 ? `${feeAmount.toFixed(0)}€` : 'Kostenlos'}
          </Text>
          <View style={[styles.heroSpots, { backgroundColor: spotsLeft <= 4 ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.15)' }]}>
            <Text style={styles.heroSpotsText}>
              {spotsLeft <= 0 ? 'Warteliste' : `${spotsLeft} Plätze frei`}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Termin Card (horizontal scroll) ──────────────
function TerminCard({ reg, colors, onPress }: { reg: any; colors: any; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={[styles.terminCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.terminDate, { backgroundColor: colors.primaryLight }]}>
        <Text style={[styles.terminDay, { color: colors.primary }]}>
          {reg.event_date ? new Date(reg.event_date).getDate() : '?'}
        </Text>
        <Text style={[styles.terminMonth, { color: colors.primary }]}>
          {reg.event_date ? new Date(reg.event_date).toLocaleString('de', { month: 'short' }).toUpperCase() : ''}
        </Text>
      </View>
      <View style={styles.terminContent}>
        <Text style={[styles.terminTitle, { color: colors.textPrimary }]} numberOfLines={1}>
          {reg.event_title || 'Turnier'}
        </Text>
        <Text style={[styles.terminMeta, { color: colors.textTertiary }]} numberOfLines={1}>
          {reg.venue_name || ''}
        </Text>
      </View>
      <View style={[styles.terminStatus, { backgroundColor: reg.status === 'confirmed' ? colors.successBg : colors.warningBg }]}>
        <Text style={{ fontSize: 10, color: reg.status === 'confirmed' ? colors.success : colors.warning, fontWeight: '600' }}>
          {reg.status === 'confirmed' ? '✓' : '⏳'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Quick Action ─────────────────────────────────
function QuickAction({ icon, label, colors, onPress }: { icon: string; label: string; colors: any; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={[styles.quickAction, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={styles.quickIcon}>{icon}</Text>
      <Text style={[styles.quickLabel, { color: colors.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── Event Mini Card ──────────────────────────────
function EventMiniCard({ event, colors, onPress }: { event: Event; colors: any; onPress: () => void }) {
  const feeAmount = event.entry_fee_cents / 100;
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={[styles.eventMini, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.eventMiniLeft}>
        <Text style={[styles.eventMiniTitle, { color: colors.textPrimary }]} numberOfLines={1}>{event.title}</Text>
        <Text style={[styles.eventMiniMeta, { color: colors.textTertiary }]}>
          📅 {event.start_date?.substring(0, 10)} {event.venue?.city ? `· ${event.venue.city}` : ''}
        </Text>
      </View>
      <View style={styles.eventMiniRight}>
        <Text style={[styles.eventMiniPrice, { color: colors.brand.teal[500] }]}>
          {feeAmount > 0 ? `${feeAmount.toFixed(0)}€` : 'Frei'}
        </Text>
        <Text style={[styles.eventMiniSpots, { color: colors.textTertiary }]}>
          {event.participant_count}/{event.max_participants}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Main Home Screen ─────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useAppColors();
  const { user } = useAuthStore();
  const { events, fetchEvents, loading } = useEventStore();
  const { myRegistrations, fetchMyRegistrations } = useRegistrationStore();
  const { currentMembership, fetchCurrentMembership } = useMembershipStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    await Promise.all([
      fetchEvents(),
      user ? fetchMyRegistrations() : Promise.resolve(),
      user ? fetchCurrentMembership() : Promise.resolve(),
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const upcomingRegs = myRegistrations
    .filter((r) => r.status === 'confirmed' || r.status === 'waitlisted')
    .slice(0, 5);
  const featuredEvents = events.slice(0, 6);
  const heroEvent = events[0];

  const getGreeting = (): string => {
    const h = new Date().getHours();
    if (h < 12) return 'Guten Morgen';
    if (h < 18) return 'Guten Tag';
    return 'Guten Abend';
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand.teal[400]} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* ── Header ───────────────────────── */}
        <View style={[styles.header, { backgroundColor: colors.bg }]}>
          <View style={styles.headerLeft}>
            <Text style={[styles.brandName, { color: colors.brand.teal[500] }]}>turneo</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={[styles.notifBtn, { backgroundColor: colors.surface }]} onPress={() => {}}>
              <Text style={{ fontSize: 18 }}>🔔</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push(user ? '/(tabs)/profil' : '/(auth)/login')}>
              <View style={[styles.avatar, { backgroundColor: colors.brand.teal[100] }]}>
                {user?.avatar_url ? (
                  <Image source={{ uri: user.avatar_url }} style={styles.avatarImg} />
                ) : (
                  <Text style={[styles.avatarText, { color: colors.brand.teal[700] }]}>
                    {user?.first_name?.[0]?.toUpperCase() || '?'}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Greeting ─────────────────────── */}
        <View style={styles.greetingSection}>
          <Text style={[styles.greeting, { color: colors.textTertiary }]}>{getGreeting()}</Text>
          <Text style={[styles.userName, { color: colors.textPrimary }]}>
            {user?.first_name || 'Willkommen bei Turneo'}
          </Text>
        </View>

        {/* ── Hero Event Card ──────────────── */}
        {heroEvent && (
          <View style={styles.heroSection}>
            <HeroEventCard
              event={heroEvent}
              colors={colors}
              onPress={() => router.push(`/event/${heroEvent.id}`)}
            />
          </View>
        )}

        {/* ── Meine Termine ────────────────── */}
        {user && upcomingRegs.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Meine Termine</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/turniere')}>
                <Text style={[styles.seeAll, { color: colors.brand.teal[500] }]}>Alle →</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.lg }}>
              {upcomingRegs.map((reg) => (
                <TerminCard
                  key={reg.id}
                  reg={reg}
                  colors={colors}
                  onPress={() => router.push(`/event/${reg.event_id}`)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Empty State (no user or no regs) ── */}
        {(!user || upcomingRegs.length === 0) && (
          <View style={styles.section}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push(user ? '/(tabs)/turniere' : '/(auth)/register')}
              style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Text style={styles.emptyIcon}>🎾</Text>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                {user ? 'Noch keine Termine' : 'Werde Teil von Turneo!'}
              </Text>
              <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                {user
                  ? 'Finde dein nächstes Turnier und melde dich an.'
                  : 'Entdecke Turniere, tritt Teams bei und werde Teil der Community.'}
              </Text>
              <View style={[styles.emptyCta, { backgroundColor: colors.brand.teal[500] }]}>
                <Text style={styles.emptyCtaText}>
                  {user ? 'Turniere entdecken' : 'Jetzt registrieren'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Quick Actions ────────────────── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, paddingHorizontal: spacing.lg }]}>
            Jetzt loslegen
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm, paddingTop: spacing.sm }}>
            <QuickAction icon="🎾" label="Padel" colors={colors} onPress={() => router.push('/(tabs)/spielen')} />
            <QuickAction icon="🎮" label="FIFA" colors={colors} onPress={() => router.push('/(tabs)/spielen')} />
            <QuickAction icon="📍" label="Platz finden" colors={colors} onPress={() => {}} />
            <QuickAction icon="👥" label="Team erstellen" colors={colors} onPress={() => router.push('/(tabs)/community')} />
            <QuickAction icon="🏆" label="Turniere" colors={colors} onPress={() => router.push('/(tabs)/turniere')} />
          </ScrollView>
        </View>

        {/* ── Anstehende Turniere ──────────── */}
        {featuredEvents.length > 1 && (
          <View style={styles.section}>
            <View style={[styles.sectionHeader, { paddingHorizontal: spacing.lg }]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Anstehende Turniere</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/turniere')}>
                <Text style={[styles.seeAll, { color: colors.brand.teal[500] }]}>Alle →</Text>
              </TouchableOpacity>
            </View>
            <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}>
              {featuredEvents.slice(1, 5).map((event) => (
                <EventMiniCard
                  key={event.id}
                  event={event}
                  colors={colors}
                  onPress={() => router.push(`/event/${event.id}`)}
                />
              ))}
            </View>
          </View>
        )}

        {/* ── Membership Upsell ────────────── */}
        {user && (!currentMembership || currentMembership.tier === 'free') && (
          <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xxl }}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push('/membership')}
              style={[styles.membershipBanner, { backgroundColor: colors.brand.teal[900] }]}
            >
              <View>
                <Text style={styles.memberBannerTitle}>Turneo Plus & Club</Text>
                <Text style={styles.memberBannerDesc}>Early Access, Rabatte & exklusive Turniere</Text>
              </View>
              <View style={[styles.memberBannerBtn, { backgroundColor: colors.brand.teal[400] }]}>
                <Text style={styles.memberBannerBtnText}>Mehr →</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingTop: Platform.OS === 'ios' ? 60 : 44, paddingBottom: spacing.sm,
  },
  headerLeft: {},
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  brandName: { fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', fontSize: 26, fontWeight: '700', letterSpacing: -0.5 },
  notifBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: 40, height: 40, borderRadius: 20 },
  avatarText: { fontSize: 16, fontWeight: '700' },

  // Greeting
  greetingSection: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.lg },
  greeting: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  userName: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, letterSpacing: -0.5, marginTop: 2 },

  // Hero
  heroSection: { paddingHorizontal: spacing.lg },
  heroCard: {
    borderRadius: radius.xl, overflow: 'hidden', height: 220,
    ...shadow.lg,
  },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover', position: 'absolute' },
  heroPlaceholder: { fontSize: 60 },
  heroGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '70%' },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.lg },
  heroBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginBottom: 8 },
  heroBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  heroTitle: { color: '#FFF', fontSize: fontSize.xl, fontWeight: fontWeight.bold, letterSpacing: -0.3, marginBottom: 6 },
  heroMeta: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  heroMetaText: { color: 'rgba(255,255,255,0.85)', fontSize: fontSize.xs },
  heroFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroPrice: { color: '#FFF', fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  heroSpots: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  heroSpotsText: { color: '#FFF', fontSize: fontSize.xxs, fontWeight: '600' },

  // Section
  section: { marginTop: spacing.xxl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, letterSpacing: -0.3 },
  seeAll: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },

  // Termin Card
  terminCard: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.md,
    borderRadius: radius.lg, borderWidth: 1, marginRight: spacing.sm,
    width: 240,
  },
  terminDate: { width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  terminDay: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  terminMonth: { fontSize: fontSize.xxs, fontWeight: fontWeight.semibold },
  terminContent: { flex: 1 },
  terminTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  terminMeta: { fontSize: fontSize.xxs, marginTop: 2 },
  terminStatus: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  // Quick Actions
  quickAction: {
    width: 80, height: 80, borderRadius: radius.lg, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  quickIcon: { fontSize: 28, marginBottom: 4 },
  quickLabel: { fontSize: fontSize.xxs, fontWeight: fontWeight.medium },

  // Event Mini
  eventMini: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.md,
    borderRadius: radius.lg, borderWidth: 1,
  },
  eventMiniLeft: { flex: 1 },
  eventMiniTitle: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  eventMiniMeta: { fontSize: fontSize.xs, marginTop: 2 },
  eventMiniRight: { alignItems: 'flex-end', marginLeft: spacing.md },
  eventMiniPrice: { fontSize: fontSize.base, fontWeight: fontWeight.bold },
  eventMiniSpots: { fontSize: fontSize.xxs, marginTop: 2 },

  // Empty State
  emptyCard: {
    marginHorizontal: spacing.lg, padding: spacing.xxl,
    borderRadius: radius.xl, borderWidth: 1, alignItems: 'center',
  },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, textAlign: 'center', marginBottom: spacing.xs },
  emptyText: { fontSize: fontSize.sm, textAlign: 'center', lineHeight: 20, marginBottom: spacing.lg },
  emptyCta: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.md },
  emptyCtaText: { color: '#FFF', fontSize: fontSize.sm, fontWeight: fontWeight.semibold },

  // Membership Banner
  membershipBanner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.lg, borderRadius: radius.xl,
  },
  memberBannerTitle: { color: '#FFF', fontSize: fontSize.base, fontWeight: fontWeight.bold },
  memberBannerDesc: { color: 'rgba(255,255,255,0.7)', fontSize: fontSize.xs, marginTop: 2 },
  memberBannerBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.sm },
  memberBannerBtnText: { color: '#FFF', fontSize: fontSize.xs, fontWeight: fontWeight.bold },
});