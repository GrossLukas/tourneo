import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppColors } from '../../src/hooks/useColorScheme';
import { TCard, TBadge, TEmptyState, TLoadingScreen, TChip } from '../../src/components/common';
import { useAuthStore } from '../../src/store/authStore';
import { useRegistrationStore, Registration } from '../../src/store/registrationStore';
import { spacing, fontSize, fontWeight } from '../../src/theme/spacing';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

type FilterTab = 'upcoming' | 'past' | 'cancelled';

export default function BookingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useAppColors();
  const { user } = useAuthStore();
  const { myRegistrations, loading, fetchMyRegistrations, cancelRegistration } = useRegistrationStore();
  const [filter, setFilter] = useState<FilterTab>('upcoming');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) fetchMyRegistrations();
  }, [user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMyRegistrations();
    setRefreshing(false);
  }, []);

  const filteredRegistrations = myRegistrations.filter((r) => {
    switch (filter) {
      case 'upcoming':
        return ['confirmed', 'waitlisted', 'checked_in'].includes(r.status);
      case 'past':
        return r.status === 'no_show' || (r.status === 'checked_in');
      case 'cancelled':
        return r.status === 'cancelled';
      default:
        return true;
    }
  });

  const getStatusBadge = (status: Registration['status']) => {
    switch (status) {
      case 'confirmed': return { label: 'Bestätigt', variant: 'success' as const };
      case 'waitlisted': return { label: 'Warteliste', variant: 'warning' as const };
      case 'checked_in': return { label: 'Eingecheckt', variant: 'info' as const };
      case 'cancelled': return { label: 'Storniert', variant: 'error' as const };
      case 'no_show': return { label: 'Nicht erschienen', variant: 'error' as const };
      default: return { label: status, variant: 'default' as const };
    }
  };

  const handleCancel = (registration: Registration) => {
    Alert.alert(
      'Anmeldung stornieren?',
      'Möchtest du deine Anmeldung wirklich stornieren? Erstattungsrichtlinie: 75% bei mehr als 14 Tagen vor dem Event, keine Erstattung danach.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Stornieren',
          style: 'destructive',
          onPress: () => cancelRegistration(registration.id, 'Vom Benutzer storniert'),
        },
      ]
    );
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.neutral[100] }]}>
        <View style={[styles.header, { backgroundColor: colors.neutral[50], borderBottomColor: colors.neutral[200] }]}>
          <Text style={[styles.title, { color: colors.neutral[900] }]}>Meine Buchungen</Text>
        </View>
        <TEmptyState
          icon="🔐"
          title="Anmeldung erforderlich"
          message="Melde dich an, um deine Turniere und Buchungen zu sehen."
          actionLabel="Jetzt anmelden"
          onAction={() => router.push('/(auth)/login')}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.neutral[100] }]}>
      <View style={[styles.header, { backgroundColor: colors.neutral[50], borderBottomColor: colors.neutral[200] }]}>
        <Text style={[styles.title, { color: colors.neutral[900] }]}>
          {t('bookings.myBookings')}
        </Text>
      </View>

      <View style={styles.filters}>
        <TChip label="Anstehend" selected={filter === 'upcoming'} onPress={() => setFilter('upcoming')} />
        <TChip label="Vergangen" selected={filter === 'past'} onPress={() => setFilter('past')} />
        <TChip label="Storniert" selected={filter === 'cancelled'} onPress={() => setFilter('cancelled')} />
      </View>

      {loading && myRegistrations.length === 0 ? (
        <TLoadingScreen message="Buchungen werden geladen..." />
      ) : (
        <FlatList
          data={filteredRegistrations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const badge = getStatusBadge(item.status);
            return (
              <TCard
                onPress={() => router.push(`/event/${item.event_id}`)}
                variant="default"
                style={styles.bookingCard}
              >
                <View style={styles.cardHeader}>
                  <Text style={[styles.eventTitle, { color: colors.neutral[900] }]} numberOfLines={1}>
                    {item.event_title || 'Turnier'}
                  </Text>
                  <TBadge label={badge.label} variant={badge.variant} />
                </View>

                <View style={styles.cardDetails}>
                  <Text style={[styles.detailText, { color: colors.neutral[600] }]}>
                    📅 {item.event_date || 'Datum TBD'}
                  </Text>
                  {item.event_location && (
                    <Text style={[styles.detailText, { color: colors.neutral[600] }]}>
                      📍 {item.event_location}
                    </Text>
                  )}
                  <Text style={[styles.detailText, { color: colors.neutral[600] }]}>
                    🎫 {item.registration_type === 'solo' ? 'Einzel' : item.registration_type === 'duo' ? 'Duo' : 'Team'}
                    {item.partner_name ? ` mit ${item.partner_name}` : ''}
                  </Text>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={[styles.feeText, { color: colors.primary[600] }]}>
                    {item.fee_final > 0 ? `${item.fee_final.toFixed(2)} €` : 'Kostenlos'}
                    {item.fee_discount_percent > 0 && (
                      <Text style={{ color: colors.status.success }}> (-{item.fee_discount_percent}%)</Text>
                    )}
                  </Text>
                  {item.status === 'confirmed' && (
                    <TouchableOpacity onPress={() => handleCancel(item)}>
                      <Text style={[styles.cancelText, { color: colors.status.error }]}>Stornieren</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TCard>
            );
          }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary[500]} />}
          ListEmptyComponent={
            <TEmptyState
              icon="📋"
              title={filter === 'upcoming' ? 'Keine anstehenden Turniere' : filter === 'past' ? 'Keine vergangenen Turniere' : 'Keine Stornierungen'}
              message={filter === 'upcoming' ? 'Entdecke Turniere und melde dich an!' : 'Hier erscheinen deine vergangenen Turniere.'}
              actionLabel={filter === 'upcoming' ? 'Turniere entdecken' : undefined}
              onAction={filter === 'upcoming' ? () => router.push('/(tabs)/padel') : undefined}
            />
          }
          contentContainerStyle={filteredRegistrations.length === 0 ? { flex: 1 } : { paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold as any },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bookingCard: { marginHorizontal: spacing.md, marginTop: spacing.sm },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  eventTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold as any, flex: 1, marginRight: spacing.sm },
  cardDetails: { marginBottom: spacing.sm },
  detailText: { fontSize: fontSize.sm, marginBottom: 3 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
  },
  feeText: { fontSize: fontSize.md, fontWeight: fontWeight.semibold as any },
  cancelText: { fontSize: fontSize.sm, fontWeight: fontWeight.medium as any },
});