/**
 * Matchmaking Screen – find opponents & partners nearby.
 *
 * Filter by sport, ELO range and location radius. Tap a player to
 * open their profile / invite to a match. Goes beyond Playtomic's
 * discovery by including distance, last-active and tier chips.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/providers/ThemeProvider';
import type { Colors } from '../../src/theme/colors';
import { spacing, fontSize, fontWeight, radius } from '../../src/theme/spacing';
import { TAvatar, TRatingBadge, TEmptyState } from '../../src/components/common';
import {
  searchPlayers,
  type DiscoverablePlayer,
} from '../../src/api/v2';

let LocationModule: typeof import('expo-location') | null = null;
async function loadLocation() {
  if (LocationModule) return LocationModule;
  try {
    LocationModule = await import('expo-location');
    return LocationModule;
  } catch {
    return null;
  }
}

type Sport = 'padel' | 'fifa';
type LevelPreset = 'near' | 'all' | 'higher' | 'lower';

export default function MatchmakingScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const params = useLocalSearchParams<{ sport?: string }>();

  const initialSport: Sport = params.sport === 'fifa' ? 'fifa' : 'padel';
  const [sport, setSport] = useState<Sport>(initialSport);
  const [levelPreset, setLevelPreset] = useState<LevelPreset>('near');
  const [radiusKm, setRadiusKm] = useState<number>(25);
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [geoDenied, setGeoDenied] = useState(false);

  const [players, setPlayers] = useState<DiscoverablePlayer[]>([]);
  const [myElo, setMyElo] = useState<number>(1000);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback(async () => {
    const Location = await loadLocation();
    if (!Location) return null;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setGeoDenied(true);
        return null;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const value = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      setGeo(value);
      return value;
    } catch {
      setGeoDenied(true);
      return null;
    }
  }, []);

  const fetchPlayers = useCallback(
    async (override?: { lat: number; lng: number } | null) => {
      setLoading(true);
      setError(null);
      try {
        const location = override ?? geo;
        let eloMin: number | undefined;
        let eloMax: number | undefined;
        if (levelPreset === 'near') {
          eloMin = myElo - 150;
          eloMax = myElo + 150;
        } else if (levelPreset === 'higher') {
          eloMin = myElo + 50;
        } else if (levelPreset === 'lower') {
          eloMax = Math.max(0, myElo - 50);
        }

        const res = await searchPlayers({
          sport,
          elo_min: eloMin,
          elo_max: eloMax,
          lat: location?.lat,
          lng: location?.lng,
          radius_km: location ? radiusKm : undefined,
          limit: 60,
        });
        setPlayers(res);
      } catch (e: any) {
        setError(e?.message ?? 'Fehler beim Laden');
      } finally {
        setLoading(false);
      }
    },
    [sport, levelPreset, radiusKm, geo, myElo],
  );

  // Load current user's ELO once for "near my level" calculation
  useEffect(() => {
    import('../../src/api/v2').then(({ getMyElo }) => {
      getMyElo()
        .then((elo) => {
          const value = sport === 'fifa' ? elo.fifa.elo : elo.padel.elo;
          setMyElo(value);
        })
        .catch(() => {});
    });
  }, [sport]);

  useEffect(() => {
    requestLocation().then((loc) => {
      fetchPlayers(loc);
    });
  }, [sport]);

  useEffect(() => {
    fetchPlayers();
  }, [levelPreset, radiusKm]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPlayers();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary as string} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Mitspieler finden</Text>
          <Text style={styles.subtitle}>
            {players.length > 0
              ? `${players.length} Spieler in deiner Nähe`
              : 'Finde Partner oder Gegner für deinen nächsten Match'}
          </Text>
        </View>
      </View>

      {/* Filter bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterBarContent}
      >
        <Chip active={sport === 'padel'} onPress={() => setSport('padel')} icon="🏸" label="Padel" colors={colors} />
        <Chip active={sport === 'fifa'} onPress={() => setSport('fifa')} icon="🎮" label="FIFA" colors={colors} />
        <View style={styles.divider} />
        <Chip active={levelPreset === 'near'} onPress={() => setLevelPreset('near')} label="Mein Level" colors={colors} />
        <Chip active={levelPreset === 'higher'} onPress={() => setLevelPreset('higher')} label="Stärker" colors={colors} />
        <Chip active={levelPreset === 'lower'} onPress={() => setLevelPreset('lower')} label="Schwächer" colors={colors} />
        <Chip active={levelPreset === 'all'} onPress={() => setLevelPreset('all')} label="Alle" colors={colors} />
        <View style={styles.divider} />
        <Chip active={radiusKm === 10} onPress={() => setRadiusKm(10)} label="10 km" colors={colors} />
        <Chip active={radiusKm === 25} onPress={() => setRadiusKm(25)} label="25 km" colors={colors} />
        <Chip active={radiusKm === 50} onPress={() => setRadiusKm(50)} label="50 km" colors={colors} />
      </ScrollView>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary as string} />}
      >
        {geoDenied && (
          <View style={styles.hintRow}>
            <Ionicons name="location-outline" size={16} color={colors.textTertiary as string} />
            <Text style={styles.hintText}>
              Standort nicht erlaubt — Ergebnisse ohne Umkreis.
            </Text>
          </View>
        )}

        {loading && players.length === 0 ? (
          <ActivityIndicator color={colors.primary as string} style={{ marginTop: spacing.xl }} />
        ) : error ? (
          <TEmptyState title="Laden fehlgeschlagen" message={error} icon="⚠️" />
        ) : players.length === 0 ? (
          <TEmptyState
            title="Keine Spieler gefunden"
            message="Probiere einen anderen Radius oder ändere das Level-Filter."
            icon="🔍"
          />
        ) : (
          players.map((p) => (
            <PlayerRow key={p.user_id} player={p} colors={colors} onPress={() => router.push(`/profile/${p.user_id}`)} />
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Chip ────────────────────────────────────────
function Chip({
  active, onPress, label, icon, colors,
}: {
  active: boolean; onPress: () => void; label: string; icon?: string; colors: Colors;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.md,
          paddingVertical: 8,
          borderRadius: radius.full,
          marginRight: 8,
          borderWidth: 1,
          backgroundColor: active ? colors.primary as string : colors.cardBg as string,
          borderColor: active ? colors.primary as string : colors.cardBorder as string,
        },
      ]}
    >
      {icon ? <Text style={{ marginRight: 6 }}>{icon}</Text> : null}
      <Text
        style={{
          color: active ? '#FFFFFF' : (colors.textPrimary as string),
          fontSize: fontSize.sm,
          fontWeight: fontWeight.semibold as any,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Player Row ──────────────────────────────────
function PlayerRow({
  player, colors, onPress,
}: {
  player: DiscoverablePlayer; colors: Colors; onPress: () => void;
}) {
  const rawTier = player.tier ?? 'gold';
  const tier = (rawTier === 'elite' ? 'diamond' : rawTier) as any;
  const distance = player.distance_km != null ? `${player.distance_km.toFixed(1).replace('.', ',')} km` : null;
  const lastSeen = formatLastActive(player.last_active_at);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: radius.lg,
        backgroundColor: colors.cardBg as string,
        borderWidth: 1,
        borderColor: colors.cardBorder as string,
        marginBottom: spacing.sm,
      }}
    >
      <TAvatar name={player.display_name} uri={player.avatar_url ?? undefined} size="md" />
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <Text style={{ color: colors.textPrimary as string, fontSize: fontSize.md, fontWeight: fontWeight.semibold as any }}>
          {player.display_name}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 }}>
          <TRatingBadge elo={player.elo} tier={tier} size="sm" />
          {distance && (
            <Text style={{ color: colors.textSecondary as string, fontSize: fontSize.xs }}>
              📍 {distance}
            </Text>
          )}
          {!distance && player.city && (
            <Text style={{ color: colors.textSecondary as string, fontSize: fontSize.xs }}>
              📍 {player.city}
            </Text>
          )}
          {lastSeen && (
            <Text style={{ color: colors.textTertiary as string, fontSize: fontSize.xs }}>
              • {lastSeen}
            </Text>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textTertiary as string} />
    </TouchableOpacity>
  );
}

function formatLastActive(iso: string | null): string | null {
  if (!iso) return null;
  const ts = Date.parse(iso);
  if (!Number.isFinite(ts)) return null;
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 5) return 'gerade online';
  if (minutes < 60) return `vor ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `vor ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `vor ${days}d`;
  return null;
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    backBtn: {
      marginRight: spacing.sm,
      padding: 4,
    },
    title: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.bold as any,
      color: colors.textPrimary as string,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: fontSize.xs,
      color: colors.textSecondary as string,
      marginTop: 2,
    },
    filterBar: {
      maxHeight: 48,
      marginTop: spacing.xs,
      marginBottom: spacing.sm,
    },
    filterBarContent: {
      paddingHorizontal: spacing.md,
      alignItems: 'center',
    },
    divider: {
      width: 1,
      height: 20,
      backgroundColor: colors.cardBorder as string,
      marginHorizontal: 6,
    },
    list: { flex: 1 },
    listContent: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
    },
    hintRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      marginBottom: spacing.sm,
    },
    hintText: {
      color: colors.textTertiary as string,
      fontSize: fontSize.xs,
    },
  });
