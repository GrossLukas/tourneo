import React, { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TCard } from '../common/TCard';
import { TBadge } from '../common/TBadge';
import { useTheme } from '../../providers/ThemeProvider';
import { spacing, fontSize, fontWeight } from '../../theme/spacing';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import type { Event } from '../../store/eventStore';

// ── Pulsing LIVE dot (Night Court red) ─────────────
function LivePulse() {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.View style={[styles.liveDot, { opacity }]} />;
}

interface EventCardProps {
  event: Event;
  onPress: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onPress }) => {
  const { colors } = useTheme();

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
  const isLive = event.status === 'in_progress' || event.status === 'live';
  const isUrgent = !isFull && spotsLeft <= 5;

  // Sport-specific gradient fallback — Night Court palette, NO teal
  const sport = (event.sport_category || '').toLowerCase();
  const gradientColors: readonly [string, string, string] =
    sport === 'fifa'
      ? (['#1E1B4B', '#312E81', '#4338CA'] as const)  // deep purple
      : (['#0A0A14', '#111127', '#1E1B4B'] as const); // padel deep-navy

  return (
    <TCard onPress={onPress} variant="elevated" style={styles.card}>
      {event.banner_image_url ? (
        <Image source={{ uri: event.banner_image_url }} style={styles.image} />
      ) : (
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.image}
        >
          <Text style={styles.gradientEmoji}>{sport === 'fifa' ? '🎮' : '🎾'}</Text>
        </LinearGradient>
      )}

      {/* Overlay badges: LIVE + Prize */}
      <View style={styles.overlayBadges}>
        {isLive && (
          <View style={styles.liveBadge}>
            <LivePulse />
            <Text style={styles.liveBadgeText}>LIVE</Text>
          </View>
        )}
        {prizeTotal > 0 && (
          <View style={styles.prizeBadge}>
            <Text style={styles.prizeBadgeText}>🏆 {prizeTotal.toFixed(0)} €</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.badges}>
          <TBadge label={getSkillLabel()} variant={getSkillBadgeVariant()} />
          <TBadge label={getFormatLabel()} variant="default" />
          {isFull && <TBadge label="Ausgebucht" variant="error" />}
          {isAlmostFull && <TBadge label={`Noch ${spotsLeft} Plätze`} variant="warning" />}
        </View>

        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
          {event.title}
        </Text>

        <View style={styles.infoRow}>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            📅 {formatDate(event.start_date)}
          </Text>
        </View>

        {(event.venue?.name || event.venue?.city) && (
          <View style={styles.infoRow}>
            <Text style={[styles.infoText, { color: colors.textSecondary }]} numberOfLines={1}>
              📍 {event.venue.name}{event.venue.city ? `, ${event.venue.city}` : ''}
            </Text>
          </View>
        )}

        <View style={[styles.footer, { borderTopColor: colors.divider }]}>
          <View style={styles.feeContainer}>
            <Text style={[styles.fee, { color: '#818CF8' }]}>
              {feeAmount > 0 ? `${feeAmount.toFixed(2)} €` : 'Kostenlos'}
            </Text>
            {prizeTotal > 0 && (
              <Text style={[styles.prize, { color: '#F59E0B' }]}>
                🏆 {prizeTotal.toFixed(0)} € Preisgeld
              </Text>
            )}
          </View>
          <Text style={[styles.participants, { color: 'rgba(255,255,255,0.4)' }]}>
            {event.participant_count}/{event.max_participants} Spieler
          </Text>
        </View>

        {/* Fill bar – Night Court */}
        {(() => {
          const fillRatio = event.max_participants > 0
            ? Math.min(1, event.participant_count / event.max_participants)
            : 0;
          const fillColor = fillRatio > 0.85 ? '#FF4757' : fillRatio > 0.6 ? '#F59E0B' : '#10B981';
          return (
            <View style={styles.fillBarTrack}>
              <View style={[styles.fillBarFill, { width: `${fillRatio * 100}%`, backgroundColor: fillColor }]} />
            </View>
          );
        })()}

        {/* Urgency text */}
        {isUrgent && (
          <Text style={styles.urgencyText}>
            ⚡ Nur noch {spotsLeft} {spotsLeft === 1 ? 'Platz' : 'Plätze'} frei
          </Text>
        )}
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientEmoji: {
    fontSize: 56,
  },
  overlayBadges: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    gap: spacing.xxs,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF4757',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 6,
  },
  liveBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  prizeBadge: {
    backgroundColor: 'rgba(245,158,11,0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  prizeBadgeText: {
    color: '#0A0A14',
    fontSize: 11,
    fontWeight: '800',
  },
  urgencyText: {
    marginTop: spacing.xs,
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '700',
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
  fillBarTrack: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  fillBarFill: {
    height: '100%',
    borderRadius: 2,
  },
});