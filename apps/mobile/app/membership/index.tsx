import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Linking, Platform,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/providers/ThemeProvider';
import { spacing, radius, shadow } from '../../src/theme';
import { haptic } from '../../src/utils/haptics';

// ============================================
// TOURNEO - Membership Management Screen
// Full lifecycle: plan, benefits, upgrade/downgrade, cancel, history
// ============================================

type Tier = 'free' | 'plus' | 'club';

const TIERS: Record<Tier, {
  name: string;
  price: string;
  priceNote: string;
  icon: string;
  color: string;
  features: string[];
  discount: string;
  earlyAccess: string;
  priority: string;
}> = {
  free: {
    name: 'Free',
    price: '0 €',
    priceNote: 'Kostenlos',
    icon: '🎾',
    color: '#888780',
    features: [
      'Öffentliche Turniere',
      'Platzsuche & Entdecken',
      'Basis-Profil & Teams',
      'Community-Grundlagen',
    ],
    discount: '0%',
    earlyAccess: '—',
    priority: 'Standard',
  },
  plus: {
    name: 'Tourneo Plus',
    price: '7,99 €',
    priceNote: 'pro Monat',
    icon: '⭐',
    color: '#818CF8',
    features: [
      'Alle Free-Features',
      '10% Rabatt auf Turniergebühren',
      '24h Early Access auf Anmeldungen',
      'Höhere Wartelisten-Priorität',
      'Exklusive Plus-Angebote',
      'Erweitertes Profil',
    ],
    discount: '10%',
    earlyAccess: '24h',
    priority: 'Hoch',
  },
  club: {
    name: 'Tourneo Club',
    price: '14,99 €',
    priceNote: 'pro Monat',
    icon: '👑',
    color: '#F59E0B',
    features: [
      'Alle Plus-Features',
      '20% Rabatt auf Turniergebühren',
      '48h Early Access auf Anmeldungen',
      'Höchste Wartelisten-Priorität',
      'Exklusive Club-Turniere',
      'High-Prize-Turniere',
      'Premium-Statistiken',
    ],
    discount: '20%',
    earlyAccess: '48h',
    priority: 'Höchste',
  },
};

export default function MembershipScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentTier] = useState<Tier>('free');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'plan' | 'history'>('plan');

  const tierConfig = TIERS[currentTier];
  const isPayingMember = currentTier !== 'free';

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // In production: fetch latest membership state from API
    await new Promise(res => setTimeout(res, 800));
    setRefreshing(false);
  }, []);

  const handleUpgrade = (targetTier: Tier) => {
    haptic.medium();
    Alert.alert(
      `Upgrade auf ${TIERS[targetTier].name}`,
      `${TIERS[targetTier].price} ${TIERS[targetTier].priceNote}. Dein Abo wird über Apple verwaltet.`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Jetzt upgraden',
          onPress: () => {
            haptic.success();
            // In production: trigger Apple IAP
            Alert.alert('Erfolg!', `Du bist jetzt ${TIERS[targetTier].name}-Mitglied! 🎉`);
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    haptic.warning();
    Alert.alert(
      'Mitgliedschaft kündigen?',
      'Deine Vorteile bleiben bis zum Ende des Abrechnungszeitraums aktiv. Du kannst jederzeit wieder upgraden.',
      [
        { text: 'Behalten', style: 'cancel' },
        {
          text: 'Kündigen',
          style: 'destructive',
          onPress: () => {
            haptic.error();
            Alert.alert(
              'Mitgliedschaft gekündigt',
              'Bitte kündige auch dein Abo in den iOS-Einstellungen unter Abos → Tourneo.',
              [
                { text: 'Zu den Einstellungen', onPress: () => Linking.openURL('https://apps.apple.com/account/subscriptions') },
                { text: 'OK' },
              ]
            );
          },
        },
      ]
    );
  };

  const handleManageApple = () => {
    haptic.light();
    Linking.openURL('https://apps.apple.com/account/subscriptions');
  };

  const handleRestore = () => {
    haptic.light();
    Alert.alert('Käufe wiederherstellen', 'Deine Käufe werden geprüft...', [{ text: 'OK' }]);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary as string} />}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={{ fontSize: 24, color: colors.textPrimary }}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Mitgliedschaft</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tab switcher */}
      <View style={[styles.tabRow, { borderColor: colors.border }]}>
        {(['plan', 'history'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, selectedTab === tab && { borderBottomColor: colors.primary as string }]}
            onPress={() => { setSelectedTab(tab); haptic.selection(); }}
          >
            <Text style={[
              styles.tabLabel,
              { color: selectedTab === tab ? colors.primary : colors.textTertiary } as any,
              selectedTab === tab && styles.tabLabelActive,
            ]}>
              {tab === 'plan' ? 'Dein Plan' : 'Verlauf'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {selectedTab === 'plan' ? (
        <View style={styles.content}>
          {/* Current Plan Card */}
          <View style={[styles.currentPlanCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }, shadow.sm]}>
            <View style={[styles.planBadge, { backgroundColor: tierConfig.color + '18' }]}>
              <Text style={styles.planIcon}>{tierConfig.icon}</Text>
              <Text style={[styles.planName, { color: tierConfig.color }]}>{tierConfig.name}</Text>
            </View>

            <View style={styles.planPriceRow}>
              <Text style={[styles.planPrice, { color: colors.textPrimary }]}>{tierConfig.price}</Text>
              <Text style={[styles.planPriceNote, { color: colors.textTertiary }]}>{tierConfig.priceNote}</Text>
            </View>

            {isPayingMember && (
              <View style={[styles.renewalRow, { backgroundColor: colors.surfaceSecondary }]}>
                <Text style={[styles.renewalLabel, { color: colors.textSecondary }]}>Nächste Verlängerung</Text>
                <Text style={[styles.renewalDate, { color: colors.textPrimary }]}>15. Aug 2025</Text>
              </View>
            )}

            {/* Benefits summary */}
            <View style={styles.benefitsGrid}>
              <View style={[styles.benefitItem, { backgroundColor: colors.surfaceSecondary }]}>
                <Text style={styles.benefitValue}>{tierConfig.discount}</Text>
                <Text style={[styles.benefitLabel, { color: colors.textTertiary }]}>Rabatt</Text>
              </View>
              <View style={[styles.benefitItem, { backgroundColor: colors.surfaceSecondary }]}>
                <Text style={styles.benefitValue}>{tierConfig.earlyAccess}</Text>
                <Text style={[styles.benefitLabel, { color: colors.textTertiary }]}>Early Access</Text>
              </View>
              <View style={[styles.benefitItem, { backgroundColor: colors.surfaceSecondary }]}>
                <Text style={styles.benefitValue}>{tierConfig.priority}</Text>
                <Text style={[styles.benefitLabel, { color: colors.textTertiary }]}>Priorität</Text>
              </View>
            </View>

            {/* Savings stats */}
            {isPayingMember && (
              <View style={[styles.savingsRow, { borderTopColor: colors.divider }]}>
                <View>
                  <Text style={[styles.savingsLabel, { color: colors.textTertiary }]}>Bisher gespart</Text>
                  <Text style={[styles.savingsValue, { color: colors.success }]}>23,40 €</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.savingsLabel, { color: colors.textTertiary }]}>Turniere mit Rabatt</Text>
                  <Text style={[styles.savingsValue, { color: colors.textPrimary }]}>4</Text>
                </View>
              </View>
            )}
          </View>

          {/* Features List */}
          <View style={[styles.featureCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }, shadow.sm]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Deine Vorteile</Text>
            {tierConfig.features.map((feature, i) => (
              <View key={i} style={styles.featureRow}>
                <Text style={{ fontSize: 16 }}>✅</Text>
                <Text style={[styles.featureText, { color: colors.textSecondary }]}>{feature}</Text>
              </View>
            ))}
          </View>

          {/* Upgrade / Downgrade Options */}
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 24, marginBottom: 12 }]}>
            {isPayingMember ? 'Plan ändern' : 'Jetzt upgraden'}
          </Text>

          {(Object.entries(TIERS) as [Tier, typeof TIERS[Tier]][])
            .filter(([key]) => key !== currentTier)
            .map(([key, tier]) => {
              const isUpgrade = key === 'club' || (key === 'plus' && currentTier === 'free');
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.tierOption, { backgroundColor: colors.cardBg, borderColor: isUpgrade ? tier.color : colors.cardBorder }, shadow.sm]}
                  onPress={() => isUpgrade ? handleUpgrade(key) : handleCancel()}
                  activeOpacity={0.7}
                >
                  <View style={styles.tierOptionHeader}>
                    <Text style={{ fontSize: 28 }}>{tier.icon}</Text>
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <Text style={[styles.tierOptionName, { color: colors.textPrimary }]}>{tier.name}</Text>
                      <Text style={[styles.tierOptionPrice, { color: tier.color }]}>{tier.price} / {tier.priceNote}</Text>
                    </View>
                    <View style={[styles.tierOptionAction, { backgroundColor: isUpgrade ? tier.color : colors.surfaceSecondary }]}>
                      <Text style={{ color: isUpgrade ? '#FFF' : colors.textSecondary, fontWeight: '700', fontSize: 13 } as any}>
                        {isUpgrade ? 'Upgraden' : 'Wechseln'}
                      </Text>
                    </View>
                  </View>
                  {isUpgrade && key === 'club' && currentTier === 'free' && (
                    <View style={[styles.savingHint, { backgroundColor: tier.color + '15' }]}>
                      <Text style={{ color: tier.color, fontSize: 12, fontWeight: '600' }}>
                        💰 Spare 20% auf alle Turniergebühren + 48h Early Access
                      </Text>
                    </View>
                  )}
                  {isUpgrade && key === 'plus' && currentTier === 'free' && (
                    <View style={[styles.savingHint, { backgroundColor: tier.color + '15' }]}>
                      <Text style={{ color: tier.color, fontSize: 12, fontWeight: '600' }}>
                        💰 Spare 10% auf alle Turniergebühren + 24h Early Access
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

          {/* Apple Subscription Management */}
          <View style={[styles.appleSection, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }, shadow.sm]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Abo-Verwaltung</Text>

            <TouchableOpacity style={[styles.appleRow, { borderBottomColor: colors.divider }]} onPress={handleManageApple}>
              <Text style={{ fontSize: 20 }}>🍎</Text>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.appleLabel, { color: colors.textPrimary }]}>Apple-Abonnements verwalten</Text>
                <Text style={[styles.appleHint, { color: colors.textTertiary }]}>Zahlungsmethode, Kündigung, Verlängerung</Text>
              </View>
              <Text style={{ color: colors.textTertiary, fontSize: 18 }}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.appleRow} onPress={handleRestore}>
              <Text style={{ fontSize: 20 }}>🔄</Text>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.appleLabel, { color: colors.textPrimary }]}>Käufe wiederherstellen</Text>
                <Text style={[styles.appleHint, { color: colors.textTertiary }]}>Falls dein Abo nicht erkannt wird</Text>
              </View>
              <Text style={{ color: colors.textTertiary, fontSize: 18 }}>→</Text>
            </TouchableOpacity>

            {isPayingMember && (
              <TouchableOpacity style={[styles.cancelButton, { borderColor: colors.error }]} onPress={handleCancel}>
                <Text style={{ color: colors.error, fontWeight: '700', fontSize: 14 } as any}>Mitgliedschaft kündigen</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ) : (
        /* HISTORY TAB */
        <View style={styles.content}>
          <View style={[styles.featureCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }, shadow.sm]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Zahlungsverlauf</Text>

            {/* Demo payments */}
            {[
              { date: '15. Jul 2025', amount: '7,99 €', type: 'Tourneo Plus', status: 'Bezahlt' },
              { date: '15. Jun 2025', amount: '7,99 €', type: 'Tourneo Plus', status: 'Bezahlt' },
              { date: '15. Mai 2025', amount: '7,99 €', type: 'Tourneo Plus', status: 'Bezahlt' },
            ].map((payment, i) => (
              <View key={i} style={[styles.historyRow, { borderBottomColor: colors.divider }]}>
                <View>
                  <Text style={[styles.historyType, { color: colors.textPrimary }]}>{payment.type}</Text>
                  <Text style={[styles.historyDate, { color: colors.textTertiary }]}>{payment.date}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.historyAmount, { color: colors.textPrimary }]}>{payment.amount}</Text>
                  <Text style={{ color: colors.success, fontSize: 12, fontWeight: '600' } as any}>{payment.status}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={[styles.featureCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, marginTop: 16 }, shadow.sm]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Turnier-Ersparnisse</Text>
            <View style={styles.savingSummary}>
              <View style={[styles.savingStat, { backgroundColor: colors.surfaceSecondary }]}>
                <Text style={[styles.savingStatValue, { color: colors.success }]}>23,40 €</Text>
                <Text style={[styles.savingStatLabel, { color: colors.textTertiary }]}>Gesamt gespart</Text>
              </View>
              <View style={[styles.savingStat, { backgroundColor: colors.surfaceSecondary }]}>
                <Text style={[styles.savingStatValue, { color: colors.primary }]}>4</Text>
                <Text style={[styles.savingStatLabel, { color: colors.textTertiary }]}>Turniere</Text>
              </View>
              <View style={[styles.savingStat, { backgroundColor: colors.surfaceSecondary }]}>
                <Text style={[styles.savingStatValue, { color: colors.primary }]}>5,85 €</Text>
                <Text style={[styles.savingStatLabel, { color: colors.textTertiary }]}>Ø pro Turnier</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  content: { paddingHorizontal: 20 },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabLabel: { fontSize: 15, fontWeight: '500' },
  tabLabelActive: { fontWeight: '700' },

  // Current plan
  currentPlanCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
    gap: 8,
  },
  planIcon: { fontSize: 20 },
  planName: { fontSize: 16, fontWeight: '700' },
  planPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 16,
  },
  planPrice: { fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  planPriceNote: { fontSize: 14 },
  renewalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  renewalLabel: { fontSize: 13 },
  renewalDate: { fontSize: 14, fontWeight: '600' },
  benefitsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  benefitItem: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  benefitValue: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  benefitLabel: { fontSize: 11 },
  savingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  savingsLabel: { fontSize: 12, marginBottom: 2 },
  savingsValue: { fontSize: 18, fontWeight: '700' },

  // Features
  featureCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 14 },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  featureText: { fontSize: 14, flex: 1 },

  // Tier options
  tierOption: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 12,
  },
  tierOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tierOptionName: { fontSize: 16, fontWeight: '700' },
  tierOptionPrice: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  tierOptionAction: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  savingHint: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
  },

  // Apple section
  appleSection: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    marginTop: 24,
    marginBottom: 16,
  },
  appleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  appleLabel: { fontSize: 14, fontWeight: '600' },
  appleHint: { fontSize: 12, marginTop: 2 },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
  },

  // History
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  historyType: { fontSize: 14, fontWeight: '600' },
  historyDate: { fontSize: 12, marginTop: 2 },
  historyAmount: { fontSize: 14, fontWeight: '700' },

  savingSummary: {
    flexDirection: 'row',
    gap: 10,
  },
  savingStat: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  savingStatValue: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  savingStatLabel: { fontSize: 11 },
});