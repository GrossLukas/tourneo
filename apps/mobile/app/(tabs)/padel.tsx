import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppColors } from '../../src/hooks/useColorScheme';
import { TSearchBar, TLoadingScreen, TEmptyState } from '../../src/components/common';
import { EventCard, EventFilters } from '../../src/components/events';
import { useEventStore } from '../../src/store/eventStore';
import { spacing, fontSize, fontWeight } from '../../src/theme/spacing';

export default function PadelScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useAppColors();
  const { events, loading, filters, fetchEvents, setFilters, clearFilters } = useEventStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [filters]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  }, []);

  const filteredEvents = searchQuery.trim()
    ? events.filter(
        (e) =>
          e.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.venue_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.address_city?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : events;

  return (
    <View style={[styles.container, { backgroundColor: colors.neutral[100] }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.neutral[50], borderBottomColor: colors.neutral[200] }]}>
        <Text style={[styles.title, { color: colors.neutral[900] }]}>
          {t('events.padelTournaments')}
        </Text>
        <Text style={[styles.subtitle, { color: colors.neutral[500] }]}>
          {events.length} {t('events.tournamentsAvailable')}
        </Text>
      </View>

      {/* Search */}
      <TSearchBar
        placeholder={t('events.searchPlaceholder')}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* Filters */}
      <EventFilters
        selectedSkill={filters.skill_level}
        selectedFormat={filters.format}
        selectedCity={filters.city}
        onSkillChange={(v) => setFilters({ skill_level: v })}
        onFormatChange={(v) => setFilters({ format: v })}
        onCityChange={(v) => setFilters({ city: v })}
      />

      {/* Event List */}
      {loading && events.length === 0 ? (
        <TLoadingScreen message={t('events.loading')} />
      ) : (
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <EventCard
              event={item}
              onPress={() => router.push(`/event/${item.id}`)}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary[500]}
            />
          }
          ListEmptyComponent={
            <TEmptyState
              icon="🎾"
              title={t('events.noEventsTitle')}
              message={t('events.noEventsMessage')}
              actionLabel={t('events.clearFilters')}
              onAction={() => {
                clearFilters();
                setSearchQuery('');
              }}
            />
          }
          contentContainerStyle={
            filteredEvents.length === 0 ? { flex: 1 } : { paddingBottom: 20 }
          }
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
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold as any,
  },
  subtitle: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
});