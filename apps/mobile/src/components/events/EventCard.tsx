import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { TCard } from '../common/TCard';
import { TBadge } from '../common/TBadge';
import { useAppColors } from '../../hooks/useColorScheme';
import { spacing, fontSize, fontWeight } from '../../theme/spacing';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface EventCardProps {
  event: {
    id: string;
    title: string;
    sport_type: string;
    format: string;
    skill_level: string;
    event_date: string;
    event_time_start: string;
    venue_name?: string;
    address_city?: string;
    image_url?: string;
    fee_amount: number;
    max_participants: number;
    current_participants: number;
    status: string;
    prize_pool_total?: number;
  };
  onPress: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onPress }) => {
  const colors = useAppColors();

  const spotsLeft = event.max_participants - event.current_participants;
  const isFull = spotsLeft <= 0;
  const isAlmostFull = spotsLeft > 0 && spotsLeft <= 4;

  const formatDate = (dateStr: string): string => {
    try {
      return format(new Date(dateStr), 'EEE, dd. MMM yyyy', { locale: de });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr: string): string => {
    return timeStr?.substring(0, 5) || '';
  };

  const getSkillBadgeVariant = (): 'success' | 'warning' | 'error' | 'info' => {
    switch (event.skill_level) {
      case 'beginner': return 'success';
      case 'intermediate': return 'info';
      case 'advanced': return 'warning';
      case 'pro': return 'error';
      default: return 'info';
    }
  };

  const getSkillLabel = (): string => {
    switch (event.skill_level) {
      case 'beginner': return 'Anfänger';
      case 'intermediate': return 'Mittel';
      case 'advanced': return 'Fortgeschritten';
      case 'pro': return 'Profi';
      case 'mixed': return 'Alle Level';
      default: return event.skill_level;
    }
  };

  const getFormatLabel = (): string => {
    switch (event.format) {
      case 'single_elimination': return 'K.O.-System';
      case 'double_elimination': return 'Doppel-K.O.';
      case 'round_robin': return 'Gruppenphase';
      case 'swiss': return 'Schweizer System';
      default: return event.format;
    }
  };

  return (
    <TCard onPress={onPress} variant="elevated" style={styles.card}>
      {event.image_url && (
        <Image source={{ uri: event.image_url }} style={styles.image} />
      )}
      <View style={styles.content}>
        <View style={styles.badges}>
          <TBadge label={getSkillLabel()} variant={getSkillBadgeVariant()} />
          <TBadge label={getFormatLabel()} variant="default" />
          {isFull && <TBadge label="Ausgebucht" variant="error" />}
          {isAlmostFull && <TBadge label={`Noch ${spotsLeft} Plätze`} variant="warning" />}
        </View>

        <Text style={[styles.title, { color: colors.neutral[900] }]} numberOfLines={2}>
          {event.title}
        </Text>

        <View style={styles.infoRow}>
          <Text style={[styles.infoText, { color: colors.neutral[600] }]}>
            📅 {formatDate(event.event_date)} · {formatTime(event.event_time_start)}
          </Text>
        </View>

        {(event.venue_name || event.address_city) && (
          <View style={styles.infoRow}>
            <Text style={[styles.infoText, { color: colors.neutral[600] }]} numberOfLines={1}>
              📍 {event.venue_name}{event.address_city ? `, ${event.address_city}` : ''}
            </Text>
          </View>
        )}

        <View style={styles.footer}>
          <View style={styles.feeContainer}>
            <Text style={[styles.fee, { color: colors.primary[600] }]}>
              {event.fee_amount > 0 ? `${event.fee_amount.toFixed(2)} €` : 'Kostenlos'}
            </Text>
            {event.prize_pool_total && event.prize_pool_total > 0 && (
              <Text style={[styles.prize, { color: colors.status.success }]}>
                🏆 {event.prize_pool_total.toFixed(0)} € Preisgeld
              </Text>
            )}
          </View>
          <Text style={[styles.participants, { color: colors.neutral[500] }]}>
            {event.current_participants}/{event.max_participants} Spieler
          </Text>
        </View>
      </View>
    </TCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: 0,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },
  content: {
    padding: spacing.md,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xxs,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold as any,
    marginBottom: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xxs,
  },
  infoText: {
    fontSize: fontSize.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
  },
  feeContainer: {
    flex: 1,
  },
  fee: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold as any,
  },
  prize: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  participants: {
    fontSize: fontSize.sm,
  },
});