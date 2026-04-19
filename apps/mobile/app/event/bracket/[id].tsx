import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../../src/providers/ThemeProvider';
import { THeader, TLoadingScreen, TEmptyState } from '../../../src/components/common';
import { BracketView } from '../../../src/components/brackets';
import { MatchFeedbackModal } from '../../../src/components/MatchFeedbackModal';
import { useAuthStore } from '../../../src/store/authStore';
import api from '../../../src/api/client';
import { spacing, fontSize, fontWeight } from '../../../src/theme/spacing';

export default function BracketScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const [bracket, setBracket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [feedbackMatch, setFeedbackMatch] = useState<{
    matchId: number;
    opponentUserId: number;
    opponentName: string;
  } | null>(null);

  useEffect(() => {
    fetchBracket();
  }, [id]);

  const fetchBracket = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/brackets/event/${id}`);
      setBracket(response.data.data);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        Alert.alert('Fehler', 'Spielplan konnte nicht geladen werden.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <TLoadingScreen message="Spielplan wird geladen..." />;

  return (
    <View style={[styles.container, { backgroundColor: colors.bgSecondary }]}>
      <THeader title="Spielplan" showBack onBack={() => router.back()} />
      {!bracket || !bracket.matches || bracket.matches.length === 0 ? (
        <TEmptyState
          icon="🏟️"
          title="Noch kein Spielplan"
          message="Der Spielplan wird vor Turnierbeginn veröffentlicht."
        />
      ) : (
        <View style={styles.bracketContainer}>
          <View style={styles.info}>
            <Text style={[styles.bracketType, { color: colors.textSecondary }]}>
              {bracket.bracket_type === 'single_elimination' ? 'K.O.-System' : bracket.bracket_type}
              {bracket.third_place_match ? ' (mit Spiel um Platz 3)' : ''}
            </Text>
            <Text style={[styles.totalMatches, { color: colors.textTertiary }]}>
              {bracket.matches.length} Spiele · {bracket.total_participants} Teilnehmer
            </Text>
          </View>
          <BracketView
            matches={bracket.matches}
            rounds={bracket.rounds || []}
            onMatchPress={(match) => {
              if (match.status === 'completed') {
                const isParticipant =
                  user?.id === match.participant1_id || user?.id === match.participant2_id;
                const opponentId =
                  user?.id === match.participant1_id ? match.participant2_id : match.participant1_id;
                const opponentName =
                  user?.id === match.participant1_id
                    ? match.participant2_name
                    : match.participant1_name;

                if (isParticipant && opponentId && opponentName) {
                  Alert.alert(
                    `Spiel ${match.match_number}`,
                    `${match.participant1_name || 'TBD'} vs ${match.participant2_name || 'TBD'}\n\nGewinner: ${
                      match.winner_id === match.participant1_id
                        ? match.participant1_name
                        : match.participant2_name
                    }`,
                    [
                      { text: 'Schließen', style: 'cancel' },
                      {
                        text: 'Feedback geben',
                        onPress: () =>
                          setFeedbackMatch({
                            matchId: Number(match.id),
                            opponentUserId: Number(opponentId),
                            opponentName,
                          }),
                      },
                    ]
                  );
                } else {
                  Alert.alert(
                    `Spiel ${match.match_number}`,
                    `${match.participant1_name || 'TBD'} vs ${match.participant2_name || 'TBD'}\n\nGewinner: ${
                      match.winner_id === match.participant1_id
                        ? match.participant1_name
                        : match.participant2_name
                    }`
                  );
                }
              }
            }}
          />
        </View>
      )}

      {feedbackMatch && (
        <MatchFeedbackModal
          visible={!!feedbackMatch}
          matchId={feedbackMatch.matchId}
          opponentUserId={feedbackMatch.opponentUserId}
          opponentName={feedbackMatch.opponentName}
          onClose={() => setFeedbackMatch(null)}
          onSubmitted={() => setFeedbackMatch(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bracketContainer: { flex: 1 },
  info: { padding: spacing.md, paddingBottom: spacing.xs },
  bracketType: { fontSize: fontSize.md, fontWeight: fontWeight.semibold as any },
  totalMatches: { fontSize: fontSize.sm, marginTop: 2 },
});