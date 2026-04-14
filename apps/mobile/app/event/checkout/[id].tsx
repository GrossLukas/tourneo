/**
 * CheckoutScreen – Stripe-powered checkout for tournament registration.
 * Shows summary, opens Stripe checkout via WebBrowser, handles success/error/cancel.
 */
import React, { useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay, withSequence } from 'react-native-reanimated';
import { useTheme } from '../../../src/providers/ThemeProvider';
import { TButton, TCard, THeader } from '../../../src/components/common';
import { useCheckoutStore } from '../../../src/store/checkoutStore';
import { useEventStore } from '../../../src/store/eventStore';
import { useAuthStore } from '../../../src/store/authStore';
import { useRegistrationStore } from '../../../src/store/registrationStore';
import { spacing, fontSize, fontWeight, radius } from '../../../src/theme/spacing';

function ConfettiIcon({ delay, colors }: { delay: number; colors: ReturnType<typeof useTheme>['colors'] }) {
  const scale = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(delay, withSpring(1, { damping: 6, stiffness: 120 }));
    rotation.value = withDelay(delay, withSequence(
      withSpring(15, { damping: 4 }),
      withSpring(-10, { damping: 4 }),
      withSpring(0, { damping: 8 })
    ));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={animStyle}>
      <Ionicons name="trophy" size={64} color={colors.primary} />
    </Animated.View>
  );
}

export default function CheckoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const { currentEvent, fetchEventById } = useEventStore();
  const { fetchMyRegistrations } = useRegistrationStore();
  const checkout = useCheckoutStore();

  const eventId = parseInt(id || '0', 10);

  useEffect(() => {
    if (eventId > 0) {
      fetchEventById(eventId);
      checkout.createCheckoutSession(eventId);
    }
    return () => { checkout.reset(); };
  }, [eventId]);

  // Auto-refresh registrations on successful payment
  useEffect(() => {
    if (checkout.status === 'success') {
      fetchMyRegistrations();
    }
  }, [checkout.status]);

  const handlePay = useCallback(async () => {
    await checkout.openCheckout();
  }, []);

  const handleSuccess = useCallback(() => {
    fetchMyRegistrations();
    router.replace(`/event/${eventId}`);
  }, [eventId]);

  const event = currentEvent;
  const session = checkout.session;
  // Prefer net amount from backend (includes membership discount)
  const feeAmount = session
    ? session.amount / 100
    : event
      ? event.entry_fee_cents / 100
      : 0;
  const isFree = feeAmount === 0 || session?.free === true;

  // Success state
  if (checkout.status === 'success') {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <ScrollView contentContainerStyle={styles.successContent}>
          <ConfettiIcon delay={200} colors={colors} />
          <Text style={[styles.successTitle, { color: colors.textPrimary }]}>
            {t('checkout.success')}
          </Text>
          <Text style={[styles.successDesc, { color: colors.textSecondary }]}>
            {t('checkout.successDesc', { tournament: event?.title || '' })}
          </Text>
          <View style={styles.successActions}>
            <TButton title={t('checkout.viewTournament')} onPress={handleSuccess} size="lg" />
            <TButton
              title={t('checkout.addToCalendar')}
              onPress={() => {}}
              variant="outline"
              size="lg"
              style={{ marginTop: spacing.sm }}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  // Error state
  if (checkout.status === 'error') {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <THeader title={t('checkout.title')} showBack onBack={() => router.back()} />
        <View style={styles.centerContent}>
          <Ionicons name="close-circle-outline" size={64} color={colors.error} />
          <Text style={[styles.errorTitle, { color: colors.textPrimary }]}>{t('checkout.error')}</Text>
          <Text style={[styles.errorDesc, { color: colors.textSecondary }]}>
            {checkout.error || t('checkout.errorDesc')}
          </Text>
          <TButton title={t('common.retry')} onPress={() => checkout.createCheckoutSession(eventId)} size="lg" style={{ marginTop: spacing.lg }} />
          <TButton title={t('common.back')} onPress={() => router.back()} variant="outline" size="lg" style={{ marginTop: spacing.sm }} />
        </View>
      </View>
    );
  }

  // Cancelled state
  if (checkout.status === 'cancelled') {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <THeader title={t('checkout.title')} showBack onBack={() => router.back()} />
        <View style={styles.centerContent}>
          <Ionicons name="arrow-undo-outline" size={64} color={colors.warning} />
          <Text style={[styles.errorTitle, { color: colors.textPrimary }]}>{t('checkout.cancelled')}</Text>
          <Text style={[styles.errorDesc, { color: colors.textSecondary }]}>{t('checkout.cancelledDesc')}</Text>
          <TButton title={t('common.retry')} onPress={handlePay} size="lg" style={{ marginTop: spacing.lg }} />
          <TButton title={t('checkout.backToTournaments')} onPress={() => router.replace('/(tabs)/turniere')} variant="outline" size="lg" style={{ marginTop: spacing.sm }} />
        </View>
      </View>
    );
  }

  // Loading
  if (checkout.status === 'loading' || checkout.status === 'redirecting' || !event) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <THeader title={t('checkout.title')} showBack onBack={() => router.back()} />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            {checkout.status === 'redirecting' ? t('checkout.processing') : t('common.loading')}
          </Text>
        </View>
      </View>
    );
  }

  // Main checkout view
  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <THeader title={t('checkout.title')} showBack onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Tournament Summary */}
        <TCard variant="default" style={styles.summaryCard}>
          <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>{t('checkout.summary')}</Text>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryKey, { color: colors.textSecondary }]}>{t('checkout.tournament')}</Text>
            <Text style={[styles.summaryValue, { color: colors.textPrimary }]} numberOfLines={2}>{event.title}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryKey, { color: colors.textSecondary }]}>{t('checkout.date')}</Text>
            <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{event.start_date?.substring(0, 10)}</Text>
          </View>
          {event.venue?.name && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryKey, { color: colors.textSecondary }]}>{t('checkout.venue')}</Text>
              <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{event.venue.name}</Text>
            </View>
          )}

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryKey, { color: colors.textSecondary }]}>{t('checkout.entryFee')}</Text>
            <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>
              {isFree ? t('common.free') : `${feeAmount.toFixed(2)} €`}
            </Text>
          </View>

          <View style={[styles.totalRow, { borderTopColor: colors.divider }]}>
            <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>{t('checkout.total')}</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>
              {isFree ? t('common.free') : `${feeAmount.toFixed(2)} €`}
            </Text>
          </View>
        </TCard>

        {/* Your Data */}
        {user && (
          <TCard variant="default" style={styles.summaryCard}>
            <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>{t('checkout.yourData')}</Text>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryKey, { color: colors.textSecondary }]}>{t('checkout.participant')}</Text>
              <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>
                {user.first_name} {user.last_name}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryKey, { color: colors.textSecondary }]}>{t('auth.email')}</Text>
              <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{user.email}</Text>
            </View>
          </TCard>
        )}

        {/* Stripe notice */}
        {!isFree && (
          <View style={styles.stripeNotice}>
            <Ionicons name="lock-closed-outline" size={16} color={colors.textTertiary} />
            <Text style={[styles.stripeNoticeText, { color: colors.textTertiary }]}>
              {t('checkout.stripeRedirect')}
            </Text>
          </View>
        )}

        {/* CTA */}
        <TButton
          title={isFree ? t('checkout.freeRegister') : t('checkout.payAndRegister')}
          onPress={isFree ? handleSuccess : handlePay}
          loading={checkout.status !== 'idle'}
          size="lg"
          icon={<Ionicons name={isFree ? 'checkmark-circle' : 'card-outline'} size={20} color="#FFF" />}
          style={{ marginTop: spacing.lg }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: 100 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  successContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, paddingTop: 120 },

  summaryCard: { marginBottom: spacing.md },
  summaryLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold as any, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  summaryKey: { fontSize: fontSize.sm, flex: 1 },
  summaryValue: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold as any, flex: 1.5, textAlign: 'right' },
  divider: { height: 1, marginVertical: spacing.md },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, paddingTop: spacing.md, marginTop: spacing.sm },
  totalLabel: { fontSize: fontSize.md, fontWeight: fontWeight.bold as any },
  totalValue: { fontSize: fontSize.xl, fontWeight: fontWeight.bold as any },

  stripeNotice: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.md, paddingHorizontal: spacing.sm },
  stripeNoticeText: { fontSize: fontSize.xs, flex: 1 },

  successTitle: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold as any, marginTop: spacing.xl, textAlign: 'center' },
  successDesc: { fontSize: fontSize.md, textAlign: 'center', marginTop: spacing.sm, lineHeight: 22 },
  successActions: { width: '100%', marginTop: spacing.xxl },

  errorTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold as any, marginTop: spacing.lg, textAlign: 'center' },
  errorDesc: { fontSize: fontSize.md, textAlign: 'center', marginTop: spacing.sm, lineHeight: 22 },

  loadingText: { fontSize: fontSize.md, marginTop: spacing.md },
});