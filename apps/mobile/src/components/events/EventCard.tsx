import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { TCard } from '../common/TCard';
import { TBadge } from '../common/TBadge';
import { useAppColors } from '../../hooks/useColorScheme';
import { spacing, fontSize, fontWeight } from '../../theme/spacing';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import type { Event } from '../../store/eventStore';

interface EventCardProps {
  event: Event;
  onPress: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onPress }) => {
  const colors = useAppColors();

  const spotsLeft = event.spots_remaining ?? (event.max_participants - event.participant_count);
  const isFull = spotsLeft <= 0;
  const isAlmostFull = spotsLeft > 0 && spotsLeft <= 4;

  const formatDate = (dateStr: string): string => {
    try {
      return format(new Date(dateStr), 'EEE, dd. MMM yyyy', { locale: de });
    } catch {
      return dateStr;
    }
  };

  const getSkillBadgeVariant = (): 'success' | 'warning' | 'error' | 'info' => {
    switch (event.level) {
      case 'beginner': return 'success';
      case 'intermediate': return 'info';
      case 'advanced': return 'warning';
      default: return 'info';
    }
  };

  const getSkillLabel = (): string => {
    switch (event.level) {
      case 'beginner': return 'Anfänger';
      case 'intermediate': return 'Mittel';
      case 'advanced': return 'Fortgeschritten';
      case 'open': return 'Alle Level';
      default: return event.level;
    }
  };

  const getFormatLabel = (): string => {
    switch (event.format) {
      case 'singles': return 'Einzel';
      case 'doubles': return 'Doppel';
      default: return event.format;
    }
  };

  const feeAmount = event.entry_fee_cents / 100;
  const prizeTotal = event.total_prize_pool_cents / 100;

  return (
    <TCard onPress={onPress} variant="elevated" style={styles.card}>
      {event.banner_image_url ? (
        <Image source={{ uri: event.banner_image_url }} style={styles.image} />
      ) : null}
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
            📅 {formatDate(event.start_date)}
          </Text>
        </View>

        {(event.venue?.name || event.venue?.city) && (
          <View style={styles.infoRow}>
            <Text style={[styles.infoText, { color: colors.neutral[600] }]} numberOfLines={1}>
              📍 {event.venue.name}{event.venue.city ? `, ${event.venue.city}` : ''}
            </Text>
          </View>
        )}

        <View style={styles.footer}>
          <View style={styles.feeContainer}>
            <Text style={[styles.fee, { color: colors.primary[600] }]}>
              {feeAmount > 0 ? `${feeAmount.toFixed(2)} €` : 'Kostenlos'}
            </Text>
            {prizeTotal > 0 && (
              <Text style={[styles.prize, { color: colors.status.success }]}>
                🏆 {prizeTotal.toFixed(0)} € Preisgeld
              </Text>
            )}
          </View>
          <Text style={[styles.participants, { color: colors.neutral[500] }]}>
            {event.participant_count}/{event.max_participants} Spieler
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