import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppColors } from '../../src/hooks/useColorScheme';
import { TCard, TBadge, TAvatar } from '../../src/components/common';
import { EventCard } from '../../src/components/events';
import { useAuthStore } from '../../src/store/authStore';
import { useEventStore } from '../../src/store/eventStore';
import { useRegistrationStore } from '../../src/store/registrationStore';
import { useMembershipStore } from '../../src/store/membershipStore';
import { spacing, fontSize, fontWeight } from '../../src/theme/spacing';

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useAppColors();
  const { user } = useAuthStore();
  const { events, fetchEvents, loading: eventsLoading } = useEventStore();
  const { myRegistrations, fetchMyRegistrations } = useRegistrationStore();
  const { currentMembership, fetchCurrentMembership } = useMembershipStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

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

  const upcomingRegistrations = myRegistrations
    .filter((r) => r.status === 'confirmed' || r.status === 'waitlisted')
    .slice(0, 3);

  const featuredEvents = events.slice(0, 5);

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Guten Morgen';
    if (hour < 18) return 'Guten Tag';
    return 'Guten Abend';
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.neutral[100] }]}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary[500]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.primary[500] }]}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.userName}>
                {user?.display_name || t('home.guest')}
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/settings')}>
              <TAvatar
                uri={user?.avatar_url}
                name={user?.display_name}
                size="md"
                membershipTier={currentMembership?.tier}
              />
            </TouchableOpacity>
          </View>
          {currentMembership && currentMembership.tier !== 'free' && (
            <TouchableOpacity onPress={() => router.push('/membership')} style={styles.membershipBanner}>
              <TBadge
                label={currentMembership.tier.toUpperCase()}
                variant="membership"
                membershipTier={currentMembership.tier}
              />
              <Text style={styles.membershipText}>
                {currentMembership.tier === 'club' ? '48h' : '24h'} Early Access aktiv
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: colors.neutral[50] }]}
            onPress={() => router.push('/(tabs)/padel')}
          >
            <Text style={styles.quickActionIcon}>🏆</Text>
            <Text style={[styles.quickActionText, { color: colors.neutral[700] }]}>
              {t('home.findTournament')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: colors.neutral[50] }]}
            onPress={() => {/* Navigate to venues */}}
          >
            <Text style={styles.quickActionIcon}>📍</Text>
            <Text style={[styles.quickActionText, { color: colors.neutral[700] }]}>
              {t('home.findCourt')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: colors.neutral[50] }]}
            onPress={() => router.push('/(tabs)/community')}
          >
            <Text style={styles.quickActionIcon}>👥</Text>
            <Text style={[styles.quickActionText, { color: colors.neutral[700] }]}>
              Community
            </Text>
          </TouchableOpacity>
        </View>

        {/* Upcoming Registrations */}
        {user && upcomingRegistrations.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.neutral[900] }]}>
                {t('home.upcomingEvents')}
              </Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/bookings')}>
                <Text style={[styles.seeAll, { color: colors.primary[500] }]}>
                  {t('common.seeAll')}
                </Text>
              </TouchableOpacity>
            </View>
            {upcomingRegistrations.map((reg) => (
              <TCard
                key={reg.id}
                onPress={() => router.push(`/event/${reg.event_id}`)}
                variant="default"
                style={styles.registrationCard}
              >
                <View style={styles.regCardContent}>
                  <View style={styles.regCardLeft}>
                    <Text style={[styles.regEventTitle, { color: colors.neutral[900] }]} numberOfLines={1}>
                      {reg.event_title || 'Turnier'}
                    </Text>
                    <Text style={[styles.regEventDate, { color: colors.neutral[500] }]}>
                      {reg.event_date || ''}
                    </Text>
                  </View>
                  <TBadge
                    label={reg.status === 'waitlisted' ? 'Warteliste' : 'Bestätigt'}
                    variant={reg.status === 'waitlisted' ? 'warning' : 'success'}
                  />
                </View>
              </TCard>
            ))}
          </View>
        )}

        {/* Not logged in prompt */}
        {!user && (
          <TCard variant="elevated" style={styles.loginPrompt}>
            <Text style={[styles.loginPromptTitle, { color: colors.neutral[900] }]}>
              Werde Teil von Turneo! 🎾
            </Text>
            <Text style={[styles.loginPromptText, { color: colors.neutral[600] }]}>
              Melde dich an um an Turnieren teilzunehmen, Teams zu gründen und die Community zu entdecken.
            </Text>
            <View style={styles.loginPromptButtons}>
              <TouchableOpacity
                style={[styles.loginPromptButton, { backgroundColor: colors.primary[500] }]}
                onPress={() => router.push('/(auth)/register')}
              >
                <Text style={styles.loginPromptButtonText}>Registrieren</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.loginPromptButton, { backgroundColor: colors.neutral[200] }]}
                onPress={() => router.push('/(auth)/login')}
              >
                <Text style={[styles.loginPromptButtonTextDark, { color: colors.neutral[700] }]}>
                  Anmelden
                </Text>
              </TouchableOpacity>
            </View>
          </TCard>
        )}

        {/* Featured Events */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.neutral[900] }]}>
              {t('home.featuredEvents')}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/padel')}>
              <Text style={[styles.seeAll, { color: colors.primary[500] }]}>
                {t('common.seeAll')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {featuredEvents.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onPress={() => router.push(`/event/${event.id}`)}
          />
        ))}

        {featuredEvents.length === 0 && !eventsLoading && (
          <TCard variant="outlined" style={{ margin: spacing.md }}>
            <Text style={[styles.noEventsText, { color: colors.neutral[500] }]}>
              Aktuell keine Turniere verfügbar. Schau bald wieder vorbei! 🎾
            </Text>
          </TCard>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: { flex: 1 },
  greeting: { color: 'rgba(255,255,255,0.8)', fontSize: fontSize.sm },
  userName: { color: '#FFFFFF', fontSize: fontSize.xl, fontWeight: fontWeight.bold as any, marginTop: 2 },
  membershipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: spacing.sm,
  },
  membershipText: { color: '#FFFFFF', fontSize: fontSize.sm, marginLeft: spacing.sm },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  quickActionIcon: { fontSize: 28, marginBottom: spacing.xs },
  quickActionText: { fontSize: fontSize.xs, fontWeight: fontWeight.medium as any, textAlign: 'center' },
  section: { paddingHorizontal: spacing.md, marginTop: spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold as any },
  seeAll: { fontSize: fontSize.sm, fontWeight: fontWeight.medium as any },
  registrationCard: { marginBottom: spacing.sm },
  regCardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  regCardLeft: { flex: 1, marginRight: spacing.sm },
  regEventTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold as any },
  regEventDate: { fontSize: fontSize.sm, marginTop: 2 },
  loginPrompt: { margin: spacing.md, alignItems: 'center' },
  loginPromptTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold as any, marginBottom: spacing.sm },
  loginPromptText: { fontSize: fontSize.sm, textAlign: 'center', lineHeight: 20, marginBottom: spacing.md },
  loginPromptButtons: { flexDirection: 'row', gap: spacing.sm },
  loginPromptButton: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: 12 },
  loginPromptButtonText: { color: '#FFFFFF', fontWeight: fontWeight.semibold as any, fontSize: fontSize.sm },
  loginPromptButtonTextDark: { fontWeight: fontWeight.semibold as any, fontSize: fontSize.sm },
  noEventsText: { textAlign: 'center', fontSize: fontSize.md, padding: spacing.md },
});