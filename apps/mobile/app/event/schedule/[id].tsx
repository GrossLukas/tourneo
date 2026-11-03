/**
 * EventScheduleScreen — when and on which court each match is played.
 *
 * Matches without a time yet are listed at the end as "Zeit folgt", so the
 * order of play is visible even before the organiser assigns slots.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { NCScreen, NCCard, NCIcon, NC } from '../../../src/components/nightcourt';
import { fontFamily } from '../../../src/theme/typography';
import { getEventSchedule, type EventSchedule } from '../../../src/api/v2';

export default function EventScheduleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [schedule, setSchedule] = useState<EventSchedule | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setSchedule(await getEventSchedule(id));
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <NCScreen>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Zurück">
          <NCIcon name="chevronL" size={22} color={NC.textP} />
        </Pressable>
        <Text style={s.title} numberOfLines={1}>
          Spielplan
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 10 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={NC.primaryLight} />}
      >
        {schedule ? <Text style={s.event}>{schedule.event_title}</Text> : null}
        {failed ? <Text style={s.empty}>Der Spielplan konnte nicht geladen werden.</Text> : null}
        {schedule && schedule.matches.length === 0 ? (
          <Text style={s.empty}>Der Spielplan steht, sobald der Turnierbaum erstellt ist.</Text>
        ) : null}
        {schedule?.matches.map((m) => (
          <NCCard key={m.id} padded={false} style={s.row}>
            <View style={s.time}>
              <Text style={s.timeText}>{m.scheduled_at ? format(new Date(m.scheduled_at), 'HH:mm') : '––:––'}</Text>
              <Text style={s.timeSub}>
                {m.scheduled_at ? format(new Date(m.scheduled_at), 'EEE d.M.', { locale: de }) : 'Zeit folgt'}
              </Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.round}>
                {m.round_name || `Runde ${m.round_number}`} · Spiel {m.match_number}
                {m.court_name ? ` · ${m.court_name}` : ''}
              </Text>
              <Text style={s.players} numberOfLines={1}>
                {m.participant_1?.name || 'offen'}
              </Text>
              <Text style={s.players} numberOfLines={1}>
                {m.participant_2?.name || 'offen'}
              </Text>
            </View>
            {m.status === 'completed' ? <NCIcon name="check" size={16} color={NC.green} /> : null}
            {m.status === 'in_progress' ? <NCIcon name="live" size={16} color={NC.gold} /> : null}
          </NCCard>
        ))}
      </ScrollView>
    </NCScreen>
  );
}

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
  event: { fontFamily: fontFamily.uiMedium, fontSize: 14, color: NC.textS, marginBottom: 4 },
  empty: { fontFamily: fontFamily.uiMedium, fontSize: 14, color: NC.textS, textAlign: 'center', marginTop: 30 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  time: { width: 64, alignItems: 'center' },
  timeText: { fontFamily: fontFamily.displayBold, fontSize: 18, fontWeight: '700', color: NC.textP },
  timeSub: { fontFamily: fontFamily.uiMedium, fontSize: 11, color: NC.textT, marginTop: 2 },
  round: { fontFamily: fontFamily.uiSemibold, fontSize: 12, color: NC.primaryLight, marginBottom: 4 },
  players: { fontFamily: fontFamily.uiMedium, fontSize: 14, color: NC.textP },
});
