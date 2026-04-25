/**
 * Night Court — Live match screen.
 *
 * Polls `/matches/:id/score` every 4 seconds and renders the score card
 * with the active server highlighted in coral.  Falls back to demo data
 * when the API is unavailable so the layout always renders.
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  NCScreen,
  NCCard,
  NCAvatar,
  NCSection,
  NCLivePulse,
  NCIcon,
  NC,
} from '../../../src/components/nightcourt';
import { fontFamily } from '../../../src/theme/typography';
import { getMatchScore } from '../../../src/api/v2';

interface MatchState {
  team1: { name: string; hue: number; sets: number[]; game: string; serving: boolean };
  team2: { name: string; hue: number; sets: number[]; game: string; serving: boolean };
  meta: string;
  stats: { aufschlag: string; winners: string; dauer: string };
}

const FALLBACK: MatchState = {
  team1: { name: 'Kramer / Weiss', hue: 340, sets: [6, 4, 3], game: '40', serving: true },
  team2: { name: 'Rahm / Torres', hue: 140, sets: [3, 6, 2], game: '30', serving: false },
  meta: 'Halbfinale · Court 3 · Berlin Masters',
  stats: { aufschlag: '72%', winners: '24', dauer: '01:12' },
};

export default function LiveMatchScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const router = useRouter();
  const [state, setState] = useState<MatchState>(FALLBACK);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!matchId) return;
    try {
      const data = await getMatchScore(Number(matchId));
      // Loose mapping — backend shape isn't fully stable, so accept partial.
      const next: MatchState = mapScore(data) ?? FALLBACK;
      setState(next);
    } catch {
      // keep showing whatever we last had
    }
  };

  useEffect(() => {
    void load();
    const id = setInterval(() => {
      void load();
    }, 4000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <NCScreen>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={NC.primaryLight}
          />
        }
      >
        {/* Top bar */}
        <View style={s.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={s.glassBtn}
            accessibilityLabel="Zurück"
          >
            <NCIcon name="chevronL" size={20} color={NC.textP} />
          </Pressable>
          <NCLivePulse />
          <Pressable style={s.glassBtn} accessibilityLabel="Teilen">
            <NCIcon name="share" size={17} color={NC.textP} />
          </Pressable>
        </View>

        {/* Big scorecard */}
        <View style={{ paddingHorizontal: 20, paddingTop: 14 }}>
          <NCCard
            padded={false}
            style={{
              borderColor: 'rgba(255,71,87,0.25)',
              overflow: 'hidden',
            }}
          >
            <LinearGradient
              colors={['rgba(255,71,87,0.12)', NC.bgCard]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 18 }}
            >
              <Text style={s.scoreMeta}>{state.meta.toUpperCase()}</Text>
              <View style={{ marginTop: 18, gap: 14 }}>
                <LiveRow team={state.team1} active={state.team1.serving} />
                <LiveRow team={state.team2} active={state.team2.serving} />
              </View>
              <View style={s.statRow}>
                <MicroStat label="Aufschlag" value={state.stats.aufschlag} />
                <MicroStat label="Winners" value={state.stats.winners} />
                <MicroStat label="Dauer" value={state.stats.dauer} mono />
              </View>
            </LinearGradient>
          </NCCard>
        </View>

        {/* Upcoming today */}
        <NCSection title="Heute noch" style={{ marginTop: 22 }}>
          <View style={{ paddingHorizontal: 20, gap: 10 }}>
            {[
              { t1: 'Park / Hoang', t2: 'Silva / Ito', time: '16:30', court: 'Court 2' },
              { t1: 'Abassi / Mu.', t2: 'Lenz / Koch', time: '18:00', court: 'Court 1' },
            ].map((m, i) => (
              <NCCard key={i} padded={false} style={s.upcomingRow}>
                <Text style={s.upcomingTime}>{m.time}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.upcomingTeams} numberOfLines={1}>
                    {m.t1} <Text style={{ color: NC.textT }}>vs</Text> {m.t2}
                  </Text>
                  <Text style={s.upcomingCourt}>{m.court}</Text>
                </View>
                <NCIcon name="chevron" size={16} color={NC.textT} />
              </NCCard>
            ))}
          </View>
        </NCSection>
      </ScrollView>
    </NCScreen>
  );
}

const LiveRow: React.FC<{ team: MatchState['team1']; active: boolean }> = ({ team, active }) => {
  return (
    <View style={s.liveRow}>
      <NCAvatar name={team.name} hue={team.hue} size={36} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={s.liveName} numberOfLines={1}>
            {team.name}
          </Text>
          {team.serving ? <View style={s.serveDot} /> : null}
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
        {team.sets.map((sc, i) => (
          <Text
            key={i}
            style={[
              s.setScore,
              { color: i === team.sets.length - 1 ? NC.textP : NC.textS },
            ]}
          >
            {sc}
          </Text>
        ))}
        <Text
          style={[
            s.gameScore,
            {
              color: active ? NC.coral : NC.textP,
              backgroundColor: active ? NC.coralBg : 'transparent',
            },
          ]}
        >
          {team.game}
        </Text>
      </View>
    </View>
  );
};

const MicroStat: React.FC<{ label: string; value: string; mono?: boolean }> = ({
  label,
  value,
  mono,
}) => (
  <View style={{ alignItems: 'center' }}>
    <Text
      style={{
        fontFamily: mono ? fontFamily.monoBold : fontFamily.displayBold,
        fontWeight: '700',
        fontSize: 17,
        color: NC.textP,
      }}
    >
      {value}
    </Text>
    <Text
      style={{
        marginTop: 2,
        fontFamily: fontFamily.uiSemibold,
        fontSize: 10,
        color: NC.textT,
        fontWeight: '600',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
      }}
    >
      {label}
    </Text>
  </View>
);

function mapScore(data: any): MatchState | null {
  if (!data || typeof data !== 'object') return null;
  // Best-effort parse of a backend payload like:
  // { team1_name, team2_name, sets:[{p1,p2}], game_score:"40-30", server:0 }
  const sets: { p1: number; p2: number }[] = data.sets ?? [];
  if (!Array.isArray(sets) || sets.length === 0) return null;
  const game = (data.game_score as string) ?? '0-0';
  const [g1, g2] = game.split('-').map((s: string) => s.trim());
  const server = data.server ?? 0;
  return {
    team1: {
      name: data.team1_name ?? data.p1 ?? 'Team 1',
      hue: 340,
      sets: sets.map((s) => s.p1 ?? 0),
      game: g1 ?? '0',
      serving: server === 0,
    },
    team2: {
      name: data.team2_name ?? data.p2 ?? 'Team 2',
      hue: 140,
      sets: sets.map((s) => s.p2 ?? 0),
      game: g2 ?? '0',
      serving: server === 1,
    },
    meta: data.meta ?? FALLBACK.meta,
    stats: {
      aufschlag: data.aufschlag_pct ? `${data.aufschlag_pct}%` : FALLBACK.stats.aufschlag,
      winners: data.winners ? String(data.winners) : FALLBACK.stats.winners,
      dauer: data.dauer ?? FALLBACK.stats.dauer,
    },
  };
}

const s = StyleSheet.create({
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 62,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  glassBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: 'rgba(10,10,20,0.55)',
    borderWidth: 1,
    borderColor: NC.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreMeta: {
    textAlign: 'center',
    fontFamily: fontFamily.uiBold,
    fontSize: 11,
    color: NC.textS,
    fontWeight: '700',
    letterSpacing: 1,
  },
  statRow: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: NC.border,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  liveName: {
    fontFamily: fontFamily.uiSemibold,
    fontSize: 13,
    fontWeight: '600',
    color: NC.textP,
  },
  serveDot: { width: 6, height: 6, borderRadius: 999, backgroundColor: NC.coral },
  setScore: {
    fontFamily: fontFamily.monoBold,
    fontSize: 22,
    fontWeight: '700',
    minWidth: 20,
    textAlign: 'center',
  },
  gameScore: {
    fontFamily: fontFamily.monoBold,
    fontSize: 26,
    fontWeight: '800',
    minWidth: 40,
    textAlign: 'center',
    marginLeft: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },

  upcomingRow: { padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  upcomingTime: {
    width: 48,
    fontFamily: fontFamily.monoBold,
    fontSize: 14,
    fontWeight: '700',
    color: NC.primaryLight,
  },
  upcomingTeams: {
    fontFamily: fontFamily.uiSemibold,
    fontSize: 13,
    color: NC.textP,
    fontWeight: '600',
  },
  upcomingCourt: { marginTop: 2, fontFamily: fontFamily.uiMedium, fontSize: 11, color: NC.textS },
});
