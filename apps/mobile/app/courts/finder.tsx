/**
 * HallFinderScreen — every padel venue around you or a place, for free.
 *
 * Tourneo partners can be booked in the app; every other venue comes from
 * OpenStreetMap and links to its own website / booking page, phone and a
 * map route. Tourneo only finds and links – it never charges anything.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  FlatList,
  ActivityIndicator,
  Linking,
  Keyboard,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { NCScreen, NCCard, NCButton, NCIcon, NCPill, NC } from '../../src/components/nightcourt';
import { fontFamily } from '../../src/theme/typography';
import { findHalls, type HallSearchResult, type FoundHall } from '../../src/api/v2';
import { useHallPickStore } from '../../src/store/hallPickStore';
import { addMissingHallUrl, bookingLabel, formatOpeningHours } from '../../src/utils/hallLinks';

const RADII = [10, 25, 50, 100, 200];

export default function HallFinderScreen() {
  const router = useRouter();
  // ?pick=1: opened from "Turnier mit Freunden" to choose the hall
  const { pick } = useLocalSearchParams<{ pick?: string }>();
  const pickMode = pick === '1';
  const pickHall = useHallPickStore((st) => st.pick);
  const choose = (hall: FoundHall) => {
    pickHall(hall);
    if (pickMode) router.back();
    else router.push('/event/create');
  };
  const [place, setPlace] = useState('');
  const [radius, setRadius] = useState(25);
  const [players, setPlayers] = useState(4);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [result, setResult] = useState<HallSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (opts: { lat?: number; lng?: number; place?: string; radius?: number; players?: number }) => {
    Keyboard.dismiss();
    setLoading(true);
    setError(null);
    try {
      setResult(await findHalls({
        lat: opts.lat,
        lng: opts.lng,
        place: opts.place,
        radius_km: opts.radius ?? radius,
        players: opts.players ?? players,
      }));
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Die Suche hat nicht geklappt. Bitte gleich nochmal versuchen.');
    } finally {
      setLoading(false);
    }
  };

  const searchPlace = () => {
    if (!place.trim()) return;
    setCoords(null);
    run({ place: place.trim() });
  };

  const searchHere = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setError('Ohne Standortfreigabe such bitte nach einem Ort oder einer PLZ.');
      return;
    }
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    setCoords(here);
    setPlace('');
    run(here);
  };

  // Changing radius or players repeats the last search
  const rerun = (next: { radius?: number; players?: number }) => {
    if (coords) run({ ...coords, ...next });
    else if (place.trim()) run({ place: place.trim(), ...next });
  };

  const changeRadius = (r: number) => {
    Haptics.selectionAsync().catch(() => {});
    setRadius(r);
    rerun({ radius: r });
  };

  const changePlayers = (delta: number) => {
    const next = Math.min(Math.max(players + delta, 2), 32);
    if (next === players) return;
    Haptics.selectionAsync().catch(() => {});
    setPlayers(next);
    if (result) rerun({ players: next });
  };

  const courtsNeeded = Math.ceil(players / 4);

  return (
    <NCScreen>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Zurück">
          <NCIcon name="chevronL" size={22} color={NC.textP} />
        </Pressable>
        <Text style={s.title}>{pickMode ? 'Halle wählen' : 'Padel-Hallen finden'}</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={s.controls}>
        <View style={s.searchRow}>
          <TextInput
            value={place}
            onChangeText={setPlace}
            onSubmitEditing={searchPlace}
            placeholder="Ort oder PLZ, z. B. Köln"
            placeholderTextColor={NC.textT}
            returnKeyType="search"
            style={s.input}
          />
          <NCButton variant="primary" size="md" onPress={searchPlace}>
            Suchen
          </NCButton>
        </View>
        <NCButton variant="ghost" size="sm" onPress={searchHere}>
          In meiner Nähe suchen
        </NCButton>

        <View style={s.chips}>
          {RADII.map((r) => (
            <Pressable
              key={r}
              onPress={() => changeRadius(r)}
              style={[s.chip, { backgroundColor: radius === r ? NC.primary : NC.bgCard, borderColor: radius === r ? NC.primary : NC.border }]}
            >
              <Text style={[s.chipText, { color: radius === r ? '#FFFFFF' : NC.textS }]}>{r} km</Text>
            </Pressable>
          ))}
        </View>

        <View style={s.players}>
          <Text style={s.label}>Spieler</Text>
          <View style={s.stepper}>
            <Pressable onPress={() => changePlayers(-1)} hitSlop={8} style={s.stepBtn} accessibilityLabel="Weniger Spieler">
              <Text style={s.stepText}>−</Text>
            </Pressable>
            <Text style={s.playerCount}>{players}</Text>
            <Pressable onPress={() => changePlayers(1)} hitSlop={8} style={s.stepBtn} accessibilityLabel="Mehr Spieler">
              <Text style={s.stepText}>+</Text>
            </Pressable>
          </View>
          <Text style={s.hint}>
            {courtsNeeded === 1 ? '1 Platz nötig' : `${courtsNeeded} Plätze nötig`}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={NC.primaryLight} />
          <Text style={[s.hint, { marginTop: 10 }]}>Suche läuft – das kann einen Moment dauern.</Text>
        </View>
      ) : (
        <FlatList
          data={result?.venues ?? []}
          keyExtractor={(v) => v.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 10 }}
          ListHeaderComponent={
            error ? <Text style={s.error}>{error}</Text>
              : result ? (
                <Text style={s.hint}>
                  {result.venues.length} {result.venues.length === 1 ? 'Halle' : 'Hallen'} im Umkreis von {result.radius_km} km
                  {result.place ? ` um ${result.place.split(',')[0]}` : ''}
                </Text>
              ) : (
                <Text style={s.hint}>Such nach einem Ort oder nutze deinen Standort.</Text>
              )
          }
          renderItem={({ item }) => (
            <HallCard
              hall={item}
              players={players}
              pickMode={pickMode}
              onChoose={choose}
              onBook={(id) => router.push(`/venue/${id}`)}
            />
          )}
          ListFooterComponent={
            result ? (
              <View style={{ alignItems: 'center', gap: 8, marginTop: 8 }}>
                <NCButton variant="ghost" size="sm" onPress={() => Linking.openURL(addMissingHallUrl(result.center.lat, result.center.lng))}>
                  Halle fehlt? In OpenStreetMap melden
                </NCButton>
                <Text style={s.attribution}>Hallen-Daten: {result.attribution}</Text>
              </View>
            ) : null
          }
        />
      )}
    </NCScreen>
  );
}

const HallCard: React.FC<{
  hall: FoundHall;
  players: number;
  pickMode: boolean;
  onChoose: (hall: FoundHall) => void;
  onBook: (id: number) => void;
}> = ({ hall, players, pickMode, onChoose, onBook }) => (
  <NCCard padded={false} style={s.card}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
      <Text style={s.name} numberOfLines={2}>{hall.name}</Text>
      <Text style={s.distance}>{hall.distance_km.toLocaleString('de', { maximumFractionDigits: 1 })} km</Text>
    </View>
    {hall.address ? <Text style={s.hint}>{hall.address}</Text> : null}
    <View style={s.badges}>
      {hall.source === 'tourneo' ? (
        <NCPill color="#FFFFFF" bg={NC.primary}>In Tourneo buchbar</NCPill>
      ) : null}
      <NCPill color={NC.textS} bg={NC.bgCard}>
        {hall.courts === null ? 'Plätze unbekannt' : hall.courts === 1 ? '1 Platz' : `${hall.courts} Plätze`}
      </NCPill>
      {hall.indoor !== null ? (
        <NCPill color={NC.textS} bg={NC.bgCard}>{hall.indoor ? 'Halle' : 'Draußen'}</NCPill>
      ) : null}
    </View>
    {formatOpeningHours(hall.opening_hours) ? (
      <Text style={s.hint}>Geöffnet: {formatOpeningHours(hall.opening_hours)}</Text>
    ) : null}
    {hall.enough_courts === false ? (
      <Text style={s.warn}>Für {players} Spieler zu wenige Plätze</Text>
    ) : null}
    <View style={s.actions}>
      <NCButton variant={pickMode ? 'primary' : 'ghost'} size="sm" onPress={() => onChoose(hall)}>
        {pickMode ? 'Diese Halle wählen' : 'Turnier hier planen'}
      </NCButton>
      {hall.tourneo_venue_id ? (
        <NCButton variant="primary" size="sm" onPress={() => onBook(hall.tourneo_venue_id!)}>Buchen</NCButton>
      ) : null}
      {hall.website ? (
        <NCButton variant="ghost" size="sm" onPress={() => Linking.openURL(hall.website!)}>
          {hall.source === 'tourneo' ? 'Website' : bookingLabel(hall.website)}
        </NCButton>
      ) : null}
      {hall.phone ? (
        <NCButton variant="ghost" size="sm" onPress={() => Linking.openURL(`tel:${hall.phone!.replace(/[^\d+]/g, '')}`)}>
          Anrufen
        </NCButton>
      ) : null}
      <NCButton variant="ghost" size="sm" onPress={() => Linking.openURL(hall.maps_url)}>Route</NCButton>
    </View>
  </NCCard>
);

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: { fontFamily: fontFamily.displayBold, fontSize: 18, fontWeight: '700', color: NC.textP },
  controls: { paddingHorizontal: 20, gap: 12, paddingBottom: 12 },
  searchRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: NC.borderStr,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: NC.textP,
    fontFamily: fontFamily.uiMedium,
    fontSize: 15,
    backgroundColor: NC.bgCard,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },
  chipText: { fontFamily: fontFamily.uiSemibold, fontSize: 12.5, fontWeight: '600' },
  players: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  label: { fontFamily: fontFamily.uiSemibold, fontSize: 14, color: NC.textP },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: NC.borderStr,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { fontFamily: fontFamily.displayBold, fontSize: 18, color: NC.textP },
  playerCount: { fontFamily: fontFamily.displayBold, fontSize: 18, fontWeight: '700', color: NC.textP, minWidth: 24, textAlign: 'center' },
  center: { paddingTop: 40, alignItems: 'center' },
  card: { padding: 14, gap: 6 },
  name: { flex: 1, fontFamily: fontFamily.displayBold, fontSize: 16, fontWeight: '700', color: NC.textP },
  distance: { fontFamily: fontFamily.uiSemibold, fontSize: 13, color: NC.primaryLight },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  hint: { fontFamily: fontFamily.uiMedium, fontSize: 13, color: NC.textS },
  warn: { fontFamily: fontFamily.uiMedium, fontSize: 13, color: NC.gold },
  error: { fontFamily: fontFamily.uiMedium, fontSize: 14, color: NC.gold, marginBottom: 8 },
  attribution: { fontFamily: fontFamily.uiMedium, fontSize: 11, color: NC.textT, textAlign: 'center', marginTop: 12 },
});
