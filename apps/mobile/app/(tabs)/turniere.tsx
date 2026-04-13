import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Platform, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppColors } from '../../src/hooks/useColorScheme';
import { useEventStore, type Event } from '../../src/store/eventStore';
import { spacing, fontSize, fontWeight, borderRadius, radius, shadows } from '../../src/theme/spacing';

type FilterTab = 'all' | 'upcoming' | 'live' | 'past';

function FilterChip({ label, active, colors, onPress }: { label: string; active: boolean; colors: any; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.chip,
        active
          ? { backgroundColor: colors.brand.teal[500] }
          : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
      ]}
    >
      <Text style={[styles.chipText, { color: active ? '#FFF' : colors.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function TournamentCard({ event, colors, onPress }: { event: Event; colors: any; onPress: () => void }) {
  const fee = event.entry_fee_cents / 100;
  const spotsLeft = event.spots_remaining ?? (event.max_participants - event.participant_count);
  const isLive = event.status === 'in_progress';

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[styles.tourCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.tourTop}>
        <View style={styles.tourTopLeft}>
          {isLive && (
            <View style={[styles.liveBadge, { backgroundColor: colors.errorBg }]}>
              <View style={[styles.liveDot, { backgroundColor: colors.error }]} />
              <Text style={[styles.liveText, { color: colors.error }]}>LIVE</Text>
            </View>
          )}
          <View style={[styles.sportBadge, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.sportText, { color: colors.primary }]}>{event.sport_category === 'padel' ? '🎾 Padel' : '🎮 FIFA'}</Text>
          </View>
          <View style={[styles.levelBadge, { backgroundColor: colors.surfaceSecondary }]}>
            <Text style={[styles.levelText, { color: colors.textSecondary }]}>
              {event.level === 'beginner' ? 'Anfänger' : event.level === 'intermediate' ? 'Mittel' : event.level === 'advanced' ? 'Fortgeschritten' : 'Offen'}
            </Text>
          </View>
        </View>
      </View>

      <Text style={[styles.tourTitle, { color: colors.textPrimary }]} numberOfLines={2}>{event.title}</Text>

      <View style={styles.tourMeta}>
        <Text style={[styles.tourMetaItem, { color: colors.textTertiary }]}>📅 {event.start_date?.substring(0, 10)}</Text>
        {event.venue?.name && <Text style={[styles.tourMetaItem, { color: colors.textTertiary }]}>📍 {event.venue.name}{event.venue.city ? `, ${event.venue.city}` : ''}</Text>}
      </View>

      <View style={[styles.tourBottom, { borderTopColor: colors.divider }]}>
        <View>
          <Text style={[styles.tourPrice, { color: colors.brand.teal[500] }]}>
            {fee > 0 ? `${fee.toFixed(0)}€` : 'Kostenlos'}
          </Text>
          {event.total_prize_pool_cents > 0 && (
            <Text style={[styles.tourPrize, { color: colors.accent }]}>
              🏆 {(event.total_prize_pool_cents / 100).toFixed(0)}€
            </Text>
          )}
        </View>
        <View style={styles.tourBottomRight}>
          <View style={[styles.spotsMeter]}>
            <View style={[styles.spotsFill, { width: `${Math.min(100, (event.participant_count / event.max_participants) * 100)}%`, backgroundColor: spotsLeft <= 4 ? colors.warning : colors.brand.teal[400] }]} />
          </View>
          <Text style={[styles.spotsText, { color: colors.textTertiary }]}>
            {event.participant_count}/{event.max_participants}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function TurniereScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useAppColors();
  const { events, loading, fetchEvents } = useEventStore();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchEvents(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  }, []);

  const filteredEvents = events.filter((e) => {
    if (activeTab === 'live') return e.status === 'in_progress';
    if (activeTab === 'upcoming') return e.status === 'published' || e.status === 'registration_open';
    if (activeTab === 'past') return e.status === 'completed';
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.bg }]}>
        <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Turniere</Text>
        <Text style={[styles.pageSubtitle, { color: colors.textTertiary }]}>{events.length} verfügbar</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <FilterChip label="Alle" active={activeTab === 'all'} colors={colors} onPress={() => setActiveTab('all')} />
        <FilterChip label="Kommend" active={activeTab === 'upcoming'} colors={colors} onPress={() => setActiveTab('upcoming')} />
        <FilterChip label="🔴 Live" active={activeTab === 'live'} colors={colors} onPress={() => setActiveTab('live')} />
        <FilterChip label="Vergangen" active={activeTab === 'past'} colors={colors} onPress={() => setActiveTab('past')} />
      </View>

      {/* List */}
      <FlatList<Event>
        data={filteredEvents}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <TournamentCard event={item} colors={colors} onPress={() => router.push(`/event/${item.id}`)} />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand.teal[400]} />}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 48, marginBottom: spacing.md }}>🏆</Text>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Keine Turniere gefunden</Text>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>Probiere einen anderen Filter oder schau später wieder vorbei.</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: Platform.OS === 'ios' ? 60 : 44, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  pageTitle: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, letterSpacing: -0.5 },
  pageSubtitle: { fontSize: fontSize.sm, marginTop: 2 },

  filterRow: { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.sm },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full },
  chipText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },

  tourCard: { borderRadius: radius.xl, borderWidth: 1, padding: spacing.lg },
  tourTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  tourTopLeft: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  sportBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  sportText: { fontSize: 11, fontWeight: '600' },
  levelBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  levelText: { fontSize: 11, fontWeight: '500' },

  tourTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, letterSpacing: -0.2, marginBottom: spacing.xs },
  tourMeta: { gap: 2, marginBottom: spacing.md },
  tourMetaItem: { fontSize: fontSize.xs },

  tourBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: spacing.md },
  tourPrice: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  tourPrize: { fontSize: fontSize.xxs, marginTop: 2 },
  tourBottomRight: { alignItems: 'flex-end' },
  spotsMeter: { width: 80, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.08)', overflow: 'hidden', marginBottom: 4 },
  spotsFill: { height: '100%', borderRadius: 2 },
  spotsText: { fontSize: fontSize.xxs },

  emptyContainer: { alignItems: 'center', paddingTop: spacing['5xl'] },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, marginBottom: spacing.xs },
  emptyText: { fontSize: fontSize.sm, textAlign: 'center' },
});