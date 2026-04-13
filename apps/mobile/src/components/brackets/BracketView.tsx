import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { TCard } from '../common/TCard';
import { useTheme } from '../../providers/ThemeProvider';
import { spacing, fontSize, fontWeight, borderRadius, radius } from '../../theme/spacing';

interface MatchData {
  id: string;
  round_number: number;
  round_name: string;
  match_number: number;
  participant1_name?: string;
  participant2_name?: string;
  participant1_seed?: number;
  participant2_seed?: number;
  winner_id?: string;
  participant1_id?: string;
  participant2_id?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'bye';
  scores?: { set_number: number; score1: number; score2: number }[];
}

interface BracketViewProps {
  matches: MatchData[];
  rounds: { number: number; name: string }[];
  onMatchPress?: (match: MatchData) => void;
}

export const BracketView: React.FC<BracketViewProps> = ({
  matches,
  rounds,
  onMatchPress,
}) => {
  const { colors } = useTheme();

  const matchesByRound = rounds.map((round) => ({
    ...round,
    matches: matches
      .filter((m) => m.round_number === round.number)
      .sort((a, b) => a.match_number - b.match_number),
  }));

  const getMatchBorderColor = (match: MatchData): string => {
    switch (match.status) {
      case 'in_progress': return colors.warning;
      case 'completed': return colors.success;
      case 'bye': return colors.border;
      default: return colors.border;
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'pending': return 'Ausstehend';
      case 'in_progress': return 'Live';
      case 'completed': return 'Beendet';
      case 'bye': return 'Freilos';
      default: return status;
    }
  };

  const renderParticipant = (
    name?: string,
    seed?: number,
    isWinner?: boolean,
    isBye?: boolean
  ) => (
    <View
      style={[
        styles.participant,
        isWinner && { backgroundColor: colors.primaryLight },
        isBye && { opacity: 0.5 },
      ]}
    >
      {seed !== undefined && seed > 0 && (
        <Text style={[styles.seed, { color: colors.textTertiary }]}>#{seed}</Text>
      )}
      <Text
        style={[
          styles.participantName,
          { color: colors.textPrimary },
          isWinner && { fontWeight: fontWeight.bold as any, color: colors.primaryDark },
        ]}
        numberOfLines={1}
      >
        {name || (isBye ? 'Freilos' : 'TBD')}
      </Text>
      {isWinner && (
        <Text style={styles.winnerIcon}>✓</Text>
      )}
    </View>
  );

  const renderScore = (scores?: MatchData['scores']) => {
    if (!scores || scores.length === 0) return null;
    return (
      <View style={styles.scoreContainer}>
        {scores.map((s, i) => (
          <Text key={i} style={[styles.scoreText, { color: colors.textSecondary }]}>
            {s.score1}-{s.score2}
          </Text>
        ))}
      </View>
    );
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.container}>
      <View style={styles.bracketContainer}>
        {matchesByRound.map((round) => (
          <View key={round.number} style={styles.round}>
            <View style={[styles.roundHeader, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.roundName, { color: colors.primaryDark }]}>
                {round.name}
              </Text>
            </View>
            <View style={styles.matchesColumn}>
              {round.matches.map((match) => (
                <TCard
                  key={match.id}
                  onPress={onMatchPress ? () => onMatchPress(match) : undefined}
                  variant="outlined"
                  padding="sm"
                  style={StyleSheet.flatten([
                    styles.matchCard,
                    { borderLeftColor: getMatchBorderColor(match), borderLeftWidth: 3 },
                  ])}
                >
                  <View style={styles.matchHeader}>
                    <Text style={[styles.matchNumber, { color: colors.textTertiary }]}>
                      Spiel {match.match_number}
                    </Text>
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color:
                            match.status === 'in_progress'
                              ? colors.warning
                              : match.status === 'completed'
                              ? colors.success
                              : colors.textTertiary,
                        },
                      ]}
                    >
                      {getStatusLabel(match.status)}
                    </Text>
                  </View>
                  {renderParticipant(
                    match.participant1_name,
                    match.participant1_seed,
                    match.winner_id === match.participant1_id && match.status === 'completed',
                    match.status === 'bye'
                  )}
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  {renderParticipant(
                    match.participant2_name,
                    match.participant2_seed,
                    match.winner_id === match.participant2_id && match.status === 'completed',
                    match.status === 'bye' && !match.participant2_name
                  )}
                  {renderScore(match.scores)}
                </TCard>
              ))}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bracketContainer: {
    flexDirection: 'row',
    padding: spacing.md,
  },
  round: {
    width: 220,
    marginRight: spacing.md,
  },
  roundHeader: {
    padding: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  roundName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold as any,
  },
  matchesColumn: {
    flex: 1,
    justifyContent: 'space-around',
  },
  matchCard: {
    marginBottom: spacing.sm,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  matchNumber: {
    fontSize: fontSize.xxs,
  },
  statusText: {
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.medium as any,
  },
  participant: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
  },
  seed: {
    fontSize: fontSize.xxs,
    marginRight: spacing.xs,
    width: 20,
  },
  participantName: {
    fontSize: fontSize.sm,
    flex: 1,
  },
  winnerIcon: {
    fontSize: 14,
    color: '#16A34A',
    marginLeft: spacing.xs,
  },
  divider: {
    height: 1,
    marginVertical: spacing.xxs,
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  scoreText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium as any,
  },
});