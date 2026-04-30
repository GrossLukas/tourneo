/**
 * Court Availability Screen
 * - Shows next 14 days of available court slots for a venue
 * - Date chips at top for day selection
 * - Slot grid with price and booking link
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  RefreshControl,
  Platform,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../src/providers/ThemeProvider';
import { spacing, fontSize, fontWeight, radius } from '../../../src/theme/spacing';
import { getVenueAvailability, type AvailabilitySlot } from '../../../src/api/v2';
import type { Colors } from '../../../src/theme/colors';

function buildNextDays(count: number): Date[] {
  const result: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    result.push(d);
  }
  return result;
}

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatTime(t: string): string {
  // t is HH:MM:SS
  return t.slice(0, 5);
}

export default function CourtAvailabilityScreen() {
  const { id, mode } = useLocalSearchParams<{ id: string; mode?: 'solo' | 'friend' }>();
  const venueId = Number(id);
  const { colors } = useTheme();

  const days = useMemo(() => buildNextDays(14), []);
  const [selectedDate, setSelectedDate] = useState<Date>(days[0]);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await getVenueAvailability(venueId, {
        from: dateKey(days[0]),
        to: dateKey(days[days.length - 1]),
      });
      setSlots(data);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Verfügbarkeit konnte nicht geladen werden.');
    }
  }, [venueId, days]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const daysWithSlots = useMemo(() => {
    const map = new Map<string, number>();
    for (const slot of slots) {
      if (slot.status !== 'available') continue;
      const k = slot.slot_date.slice(0, 10);
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return map;
  }, [slots]);

  const slotsForSelected = useMemo(() => {
    const key = dateKey(selectedDate);
    return slots
      .filter((s) => s.slot_date.slice(0, 10) === key)
      .sort((a, b) => a.slot_start.localeCompare(b.slot_start));
  }, [slots, selectedDate]);

  const openBooking = (url: string | null) => {
    if (!url) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(url);
  };

  if (loading) {
    return (
      <View style={[styles.loader, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Stack.Screen
        options={{
          title: mode === 'friend' ? 'Platz mit Freund' : 'Platz für Solo',
          headerShown: true,
        }}
      />

      {/* Date chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.daysRow}
      >
        {days.map((d) => {
          const isSelected = dateKey(d) === dateKey(selectedDate);
          const hasSlots = (daysWithSlots.get(dateKey(d)) ?? 0) > 0;
          return (
            <TouchableOpacity
              key={dateKey(d)}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedDate(d);
              }}
              style={[
                styles.dayChip,
                {
                  backgroundColor: isSelected ? colors.primary : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.cardBorder,
                },
              ]}
            >
              <Text
                style={[
                  styles.dayLabel,
                  { color: isSelected ? '#FFF' : colors.textTertiary },
                ]}
              >
                {d.toLocaleDateString('de-DE', { weekday: 'short' })}
              </Text>
              <Text
                style={[
                  styles.dayNum,
                  { color: isSelected ? '#FFF' : colors.textPrimary },
                ]}
              >
                {d.getDate()}
              </Text>
              {hasSlots && !isSelected && (
                <View style={[styles.dayDot, { backgroundColor: colors.primary }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.slotsContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {error && (
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        )}

        {slotsForSelected.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              Keine Verfügbarkeit
            </Text>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              Für diesen Tag sind keine Slots hinterlegt. Versuche einen anderen Tag.
            </Text>
          </View>
        ) : (
          <View style={styles.slotGrid}>
            {slotsForSelected.map((slot) => (
              <SlotCard
                key={slot.id}
                slot={slot}
                colors={colors}
                onBook={() => openBooking(slot.booking_url)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function SlotCard({
  slot,
  colors,
  onBook,
}: {
  slot: AvailabilitySlot;
  colors: Colors;
  onBook: () => void;
}) {
  const isAvailable = slot.status === 'available';
  const isBlocked = slot.status === 'blocked';
  const price = slot.price_cents != null ? `${(slot.price_cents / 100).toFixed(0)}€` : null;

  return (
    <View
      style={[
        styles.slotCard,
        {
          backgroundColor: isAvailable ? colors.surface : colors.surfaceSecondary,
          borderColor: isAvailable ? colors.primary + '33' : colors.cardBorder,
          opacity: isAvailable ? 1 : 0.5,
        },
      ]}
    >
      <Text style={[styles.slotTime, { color: colors.textPrimary }]}>
        {formatTime(slot.slot_start)} – {formatTime(slot.slot_end)}
      </Text>
      {price && (
        <Text style={[styles.slotPrice, { color: colors.primary }]}>{price}</Text>
      )}
      {isAvailable && slot.booking_url && (
        <TouchableOpacity onPress={onBook} style={[styles.bookBtn, { backgroundColor: colors.primary }]}>
          <Text style={styles.bookText}>Buchen</Text>
        </TouchableOpacity>
      )}
      {!isAvailable && (
        <Text style={[styles.statusText, { color: colors.textTertiary }]}>
          {isBlocked ? 'Blockiert' : 'Gebucht'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  daysRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  dayChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 56,
    gap: 2,
  },
  dayLabel: {
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.semibold as any,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dayNum: {
    fontSize: fontSize.xl,
    fontWeight: '800' as any,
  },
  dayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  slotsContainer: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  slotCard: {
    width: '48%',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  slotTime: { fontSize: fontSize.base, fontWeight: fontWeight.semibold as any },
  slotPrice: { fontSize: fontSize.lg, fontWeight: '800' as any },
  bookBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    marginTop: spacing.xs,
  },
  bookText: { color: '#FFF', fontSize: fontSize.xs, fontWeight: fontWeight.bold as any },
  statusText: { fontSize: fontSize.xxs, marginTop: spacing.xs },
  empty: { alignItems: 'center', padding: spacing.xxl, gap: spacing.sm },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold as any },
  emptyText: { fontSize: fontSize.sm, textAlign: 'center', paddingHorizontal: spacing.lg },
  errorText: {
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});
