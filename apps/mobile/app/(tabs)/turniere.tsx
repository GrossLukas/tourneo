/**
 * Night Court — Turniere (tournament discovery).
 *
 * Layout:
 *   • Title row (subtitle + screen title + filter button)
 *   • Search field (bgInput, magnifier icon, 48px)
 *   • Horizontal level chips (Alle · Beginner · Intermediate · Advanced · Pro)
 *   • Vertical list of TournamentCards (date tile + title + level/city pills + capacity bar + prize)
 *
 * Wires to the existing `useEventStore` and respects admin role for the FAB
 * shortcut used elsewhere in the app.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  NCScreen,
  NCCard,
  NCPill,
  NCCapacityBar,
  NCIcon,
  NC,
} from '../../src/components/nightcourt';
import { fontFamily } from '../../src/theme/typography';
import { useEventStore, type Event } from '../../src/store/eventStore';
import { useAuthStore } from '../../src/store/authStore';

const LEVELS = ['Alle', 'Beginner', 'Intermediate', 'Advanced', 'Pro'] as const;
type Level = (typeof LEVELS)[number];

function levelHue(level: string): number {
  switch (level) {
    case 'Beginner':
      return 140;
    case 'Intermediate':
      return 200;
    case 'Advanced':
      return 280;
    case 'Pro':
      return 15;
    default:
      return 250;
  }
}

function eventLevelLabel(raw: string): string {
  const map: Record<string, string> = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
    pro: 'Pro',
  };
  return map[raw] || 'Open';
}

function tagFor(event: Event): { label: string; color: string; bg: string } | null {
  if (event.access_type === 'club_only') return { label: 'CLUB+', color: NC.gold, bg: NC.goldBg };
  if (event.status === 'in_progress') return { label: 'LIVE', color: NC.coral, bg: NC.coralBg };
  if (event.entry_fee_cents === 0) return { label: 'FREE', color: NC.green, bg: 'rgba(16,185,129,0.15)' };
  // Featured events – heuristic: large prize pool
  if (event.total_prize_pool_cents >= 200000) return { label: 'FEATURED', color: '#FFFFFF', bg: NC.primary };
  return null;
}

function dateParts(iso: string): { day: string; month: string } {
  if (!iso) return { day: '–', month: '' };
  try {
    const d = new Date(iso);
    return {
      day: String(d.getDate()),
      month: d.toLocaleDateString('de', { month: 'short' }).replace('.', '').toUpperCase(),
    };
  } catch {
    return { day: '–', month: '' };
  }
}

function formatPrize(cents: number): string {
  const v = cents / 100;
  return v.toLocaleString('de', { maximumFractionDigits: 0 });
}

function formatFee(cents: number): string {
  const v = cents / 100;
  return v.toLocaleString('de', { maximumFractionDigits: 0 });
}

// ─── Tournament card ─────────────────────────────────────────
const TournamentCard: React.FC<{ event: Event; onPress: () => void }> = ({ event, onPress }) => {
  const fee = event.entry_fee_cents;
  const prize = event.total_prize_pool_cents;
  const filled = event.participant_count;
  const spots = event.max_participants;
  const fillPct = spots > 0 ? (filled / spots) * 100 : 0;
  const dt = dateParts(event.start_date);
  const lvl = eventLevelLabel(event.level);
  const tag = tagFor(event);

  return (
    <NCCard onPress={onPress} padded={false} style={cardStyles.card}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {/* Date / level tile */}
        <View style={cardStyles.dateTile}>
          <LinearGradient
            colors={[`hsl(${levelHue(lvl)}, 65%, 35%)`, `hsl(${levelHue(lvl)}, 60%, 18%)`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={cardStyles.dateMonth}>{dt.month}</Text>
          <Text style={cardStyles.dateDay}>{dt.day}</Text>
          <View style={cardStyles.levelStrip}>
            <Text style={cardStyles.levelText}>{lvl.toUpperCase()}</Text>
          </View>
        </View>

        {/* Body */}
        <View style={{ flex: 1, minWidth: 0 }}>
          {tag ? (
            <View style={{ flexDirection: 'row', marginBottom: 4 }}>
              <NCPill color={tag.color} bg={tag.bg}>
                {tag.label}
              </NCPill>
            </View>
          ) : null}

          <Text style={cardStyles.title} numberOfLines={2}>
            {event.title}
          </Text>

          <View style={cardStyles.metaRow}>
            <NCIcon name="pin" size={12} color={NC.textT} />
            <Text style={cardStyles.metaText} numberOfLines={1}>
              {event.venue?.city || event.venue?.name || ''}
            </Text>
          </View>

          <View style={cardStyles.bottomRow}>
            <View style={{ flex: 1 }}>
              <NCCapacityBar fill={fillPct} height={4} />
              <Text style={cardStyles.spotsCount}>
                {filled}/{spots} Plätze
              </Text>
            </View>

            {prize > 0 ? (
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={cardStyles.priceLabel}>PRIZE</Text>
                <Text style={cardStyles.priceValue}>{formatPrize(prize)}€</Text>
              </View>
            ) : (
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={cardStyles.priceLabel}>GEBÜHR</Text>
                <Text style={cardStyles.feeValue}>
                  {fee > 0 ? `${formatFee(fee)}€` : 'Frei'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </NCCard>
  );
};

// ─── Screen ─────────────────────────────────────────────────
export default function TurniereScreen() {
  const router = useRouter();
  const { events, fetchEvents } = useEventStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const [filter, setFilter] = useState<Level>('Alle');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  }, [fetchEvents]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((e) => {
      if (filter !== 'Alle' && eventLevelLabel(e.level) !== filter) return false;
      if (q) {
        const hay = `${e.title} ${e.venue?.name ?? ''} ${e.venue?.city ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [events, filter, search]);

  return (
    <NCScreen>
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.subtitle}>Entdecke</Text>
          <Text style={s.screenTitle}>Turniere</Text>
        </View>
        <Pressable
          style={s.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Filter"
          onPress={() => Haptics.selectionAsync().catch(() => {})}
        >
          <NCIcon name="filter" size={19} color={NC.textP} />
        </Pressable>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <NCIcon name="search" size={17} color={NC.textT} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Turnier oder Stadt suchen…"
          placeholderTextColor={NC.textT}
          style={s.searchInput}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />
      </View>

      {/* Level chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 14 }}
      >
        {LEVELS.map((l) => {
          const active = filter === l;
          return (
            <Pressable
              key={l}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setFilter(l);
              }}
              style={[
                s.chip,
                {
                  backgroundColor: active ? NC.primary : NC.bgCard,
                  borderColor: active ? NC.primary : NC.border,
                },
              ]}
            >
              <Text style={[s.chipText, { color: active ? '#FFFFFF' : NC.textS }]}>{l}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(e) => String(e.id)}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 110 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => (
          <TournamentCard event={item} onPress={() => router.push(`/event/${item.id}`)} />
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyText}>Keine Turniere gefunden</Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={NC.primaryLight}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {isAdmin ? (
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
            router.push('/admin/quick-create');
          }}
          style={s.fab}
        >
          <NCIcon name="plus" size={26} color="#FFFFFF" strokeWidth={2.4} />
        </Pressable>
      ) : null}
    </NCScreen>
  );
}

const s = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 62,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  subtitle: {
    fontFamily: fontFamily.uiMedium,
    fontSize: 12,
    color: NC.textT,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  screenTitle: {
    fontFamily: fontFamily.displayExtra,
    fontSize: 30,
    fontWeight: '800',
    color: NC.textP,
    letterSpacing: -0.8,
    marginTop: 2,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: NC.bgCard,
    borderWidth: 1,
    borderColor: NC.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    marginHorizontal: 20,
    marginBottom: 14,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 14,
    backgroundColor: NC.bgInput,
    borderWidth: 1,
    borderColor: NC.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: NC.textP,
    fontFamily: fontFamily.uiMedium,
    fontSize: 14,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { fontFamily: fontFamily.uiSemibold, fontSize: 12.5, fontWeight: '600' },
  empty: { paddingTop: 40, alignItems: 'center' },
  emptyText: { color: NC.textS, fontFamily: fontFamily.uiMedium, fontSize: 14 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 110,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: NC.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: NC.primary,
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
});

const cardStyles = StyleSheet.create({
  card: { padding: 14 },
  dateTile: {
    width: 72,
    height: 88,
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateMonth: {
    fontFamily: fontFamily.uiBold,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.7)',
  },
  dateDay: {
    fontFamily: fontFamily.displayExtra,
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.8,
    lineHeight: 28,
  },
  levelStrip: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 3,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
  },
  levelText: {
    fontFamily: fontFamily.uiBold,
    fontSize: 8.5,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.7,
  },
  title: {
    fontFamily: fontFamily.displayBold,
    fontSize: 15.5,
    fontWeight: '700',
    color: NC.textP,
    letterSpacing: -0.3,
    lineHeight: 19,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  metaText: { fontFamily: fontFamily.uiMedium, fontSize: 12, color: NC.textS, flex: 1 },
  bottomRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: 10 },
  spotsCount: { fontFamily: fontFamily.monoBold, fontSize: 10, color: NC.textS, fontWeight: '600', marginTop: 4 },
  priceLabel: {
    fontFamily: fontFamily.uiSemibold,
    fontSize: 9.5,
    color: NC.textT,
    fontWeight: '600',
    letterSpacing: 0.6,
  },
  priceValue: {
    fontFamily: fontFamily.displayExtra,
    fontSize: 17,
    fontWeight: '800',
    color: NC.gold,
    letterSpacing: -0.3,
    lineHeight: 19,
  },
  feeValue: {
    fontFamily: fontFamily.displayExtra,
    fontSize: 17,
    fontWeight: '800',
    color: NC.primaryLight,
    letterSpacing: -0.3,
    lineHeight: 19,
  },
});
