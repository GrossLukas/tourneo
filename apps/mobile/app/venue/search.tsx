import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  Share,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useTheme } from '../../src/providers/ThemeProvider';
import { spacing, fontSize, fontWeight, radius } from '../../src/theme/spacing';
import { useVenueStore, type Venue } from '../../src/store/venueStore';

type Mode = 'solo' | 'friend';
type SurfaceFilter = 'all' | 'indoor' | 'outdoor';
type TimeFilter = 'any' | 'morning' | 'evening';

const RADIUS_OPTIONS = [10, 25, 50, 100] as const;

export default function VenueSearchScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: Mode }>();
  const { colors } = useTheme();
  const { venues, fetchVenues, loading, setFilters, clearFilters } = useVenueStore();
  const [selectedMode, setSelectedMode] = useState<Mode>(mode === 'friend' ? 'friend' : 'solo');
  const [query, setQuery] = useState('');
  const [radiusKm, setRadiusKm] = useState<number | null>(null);
  const [surface, setSurface] = useState<SurfaceFilter>('all');
  const [timeSlot, setTimeSlot] = useState<TimeFilter>('any');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return venues.filter((venue) => {
      if (!q) return true;
      return `${venue.name} ${venue.address_city} ${venue.address_street}`.toLowerCase().includes(q);
    });
  }, [venues, query]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchVenues();
    setRefreshing(false);
  };

  const openAvailability = (venue: Venue) => {
    router.push({
      pathname: '/venue/availability/[id]',
      params: { id: String(venue.id), mode: selectedMode, time: timeSlot },
    });
  };

  const enableRadius = async (radius: number | null) => {
    if (radius === null) {
      setRadiusKm(null);
      clearFilters();
      await fetchVenues();
      return;
    }
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('Standort fehlt', 'Bitte erlaube den Standort, damit wir Plätze in deiner Nähe finden.');
      return;
    }
    const position = await Location.getCurrentPositionAsync({});
    setRadiusKm(radius);
    setFilters({
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      radius_km: radius,
      per_page: 50,
      ...(surface === 'indoor' ? { is_indoor: true, is_outdoor: undefined } : {}),
      ...(surface === 'outdoor' ? { is_outdoor: true, is_indoor: undefined } : {}),
    });
    await fetchVenues();
  };

  const applySurface = async (next: SurfaceFilter) => {
    setSurface(next);
    setFilters({
      is_indoor: next === 'indoor' ? true : undefined,
      is_outdoor: next === 'outdoor' ? true : undefined,
      per_page: 50,
    });
    await fetchVenues();
  };

  const shareVenue = async (venue: Venue) => {
    await Share.share({
      message: `Lass uns hier einen Platz suchen: ${venue.name}, ${venue.address_street}, ${venue.address_zip} ${venue.address_city}`,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Stack.Screen options={{ title: 'Platz suchen', headerShown: true }} />
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <Text style={[styles.title, { color: colors.textPrimary }]}>Platz suchen</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Finde eine Halle für ein Solo-Spiel oder eine Buchung mit einem Freund.
        </Text>

        <View style={styles.modeRow}>
          <ModeChip label="Solo" active={selectedMode === 'solo'} onPress={() => setSelectedMode('solo')} colors={colors} />
          <ModeChip label="Mit Freund" active={selectedMode === 'friend'} onPress={() => setSelectedMode('friend')} colors={colors} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
          <FilterChip label="Alle Orte" active={radiusKm === null} onPress={() => void enableRadius(null)} colors={colors} />
          {RADIUS_OPTIONS.map((radius) => (
            <FilterChip key={radius} label={`${radius} km`} active={radiusKm === radius} onPress={() => void enableRadius(radius)} colors={colors} />
          ))}
        </ScrollView>

        <View style={styles.modeRow}>
          <ModeChip label="Alle" active={surface === 'all'} onPress={() => void applySurface('all')} colors={colors} />
          <ModeChip label="Indoor" active={surface === 'indoor'} onPress={() => void applySurface('indoor')} colors={colors} />
          <ModeChip label="Outdoor" active={surface === 'outdoor'} onPress={() => void applySurface('outdoor')} colors={colors} />
        </View>

        <View style={styles.modeRow}>
          <ModeChip label="Jede Zeit" active={timeSlot === 'any'} onPress={() => setTimeSlot('any')} colors={colors} />
          <ModeChip label="Vormittag" active={timeSlot === 'morning'} onPress={() => setTimeSlot('morning')} colors={colors} />
          <ModeChip label="Abends" active={timeSlot === 'evening'} onPress={() => setTimeSlot('evening')} colors={colors} />
        </View>

        <View style={[styles.searchBox, { borderColor: colors.cardBorder, backgroundColor: colors.surface }]}>
          <Ionicons name="search" size={18} color={colors.textTertiary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Halle, Stadt oder Adresse"
            placeholderTextColor={colors.textTertiary as string}
            autoCapitalize="none"
            style={[styles.searchInput, { color: colors.textPrimary }]}
          />
        </View>

        <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
          {filtered.map((venue) => (
            <TouchableOpacity
              key={venue.id}
              activeOpacity={0.85}
              onPress={() => openAvailability(venue)}
              style={[styles.venueCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
            >
              <View style={styles.venueIcon}>
                <Ionicons name="location-outline" size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.venueName, { color: colors.textPrimary }]} numberOfLines={1}>
                  {venue.name}
                </Text>
                <Text style={[styles.venueMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                  {venue.address_street}, {venue.address_zip} {venue.address_city}
                </Text>
                <Text style={[styles.venueMeta, { color: colors.textTertiary }]}>
                  {venue.courts?.length ?? venue.court_count ?? 0} Plätze
                  {venue.distance_km != null ? ` · ${venue.distance_km.toFixed(1)} km` : ''}
                </Text>
              </View>
              {selectedMode === 'friend' ? (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    void shareVenue(venue);
                  }}
                  style={[styles.shareBtn, { borderColor: colors.cardBorder }]}
                >
                  <Ionicons name="share-social-outline" size={18} color={colors.primary as string} />
                </TouchableOpacity>
              ) : (
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {!loading && filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="map-outline" size={42} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>Keine Halle gefunden.</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function ModeChip({
  label,
  active,
  onPress,
  colors,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  colors: any;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.modeChip,
        {
          backgroundColor: active ? colors.primary : colors.surface,
          borderColor: active ? colors.primary : colors.cardBorder,
        },
      ]}
    >
      <Text style={[styles.modeText, { color: active ? '#FFF' : colors.textPrimary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function FilterChip({
  label,
  active,
  onPress,
  colors,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  colors: any;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.filterChip,
        {
          backgroundColor: active ? colors.primary : colors.surface,
          borderColor: active ? colors.primary : colors.cardBorder,
        },
      ]}
    >
      <Text style={[styles.filterText, { color: active ? '#FFF' : colors.textPrimary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 28, fontWeight: fontWeight.bold as any, letterSpacing: -0.4 },
  subtitle: { fontSize: fontSize.sm, lineHeight: 20, marginTop: spacing.xs },
  modeRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  chipScroll: { gap: spacing.sm, paddingTop: spacing.lg, paddingRight: spacing.lg },
  modeChip: {
    flex: 1,
    borderRadius: radius.full,
    borderWidth: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  modeText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold as any },
  filterChip: {
    borderRadius: radius.full,
    borderWidth: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  filterText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold as any },
  searchBox: {
    marginTop: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchInput: { flex: 1, fontSize: fontSize.sm },
  venueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  venueIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99,102,241,0.12)',
  },
  shareBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  venueName: { fontSize: fontSize.md, fontWeight: fontWeight.bold as any },
  venueMeta: { fontSize: fontSize.xs, marginTop: 3 },
  empty: { alignItems: 'center', gap: spacing.sm, paddingTop: spacing.xxl },
  emptyText: { fontSize: fontSize.sm },
});
