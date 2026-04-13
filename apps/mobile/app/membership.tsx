import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/providers/ThemeProvider';
import { THeader, TLoadingScreen } from '../src/components/common';
import { MembershipCard } from '../src/components/membership';
import { useMembershipStore } from '../src/store/membershipStore';
import { useAuthStore } from '../src/store/authStore';
import { spacing, fontSize, fontWeight } from '../src/theme/spacing';

export default function MembershipScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const { currentMembership, tiers, loading, fetchCurrentMembership, fetchTiers, subscribe } = useMembershipStore();

  useEffect(() => {
    fetchTiers();
    if (user) fetchCurrentMembership();
  }, [user]);

  const handleSelectTier = (tier: string) => {
    if (!user) {
      Alert.alert('Anmeldung erforderlich', 'Bitte melde dich an, um ein Abo abzuschließen.', [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Anmelden', onPress: () => router.push('/(auth)/login') },
      ]);
      return;
    }

    if (tier === 'free') return;

    Alert.alert(
      `${tier === 'club' ? 'Club' : 'Plus'}-Mitgliedschaft`,
      `Möchtest du die ${tier === 'club' ? 'Club (14,99€/Mo)' : 'Plus (7,99€/Mo)'}-Mitgliedschaft abschließen?\n\nDas Abo wird über Apple In-App Purchase abgewickelt und kann jederzeit in den iOS-Einstellungen gekündigt werden.`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Abonnieren',
          onPress: () => {
            Alert.alert(
              'Apple In-App Purchase',
              'In der Produktionsversion wird hier der Apple-Kaufdialog angezeigt. Dies ist eine Demo-Version.',
              [{ text: 'OK' }]
            );
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgTertiary }]}>
      <THeader title="Mitgliedschaft" showBack onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.headline, { color: colors.textPrimary }]}>
          Wähle deinen Plan
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Upgraden für Early Access, Rabatte und exklusive Vorteile
        </Text>

        {tiers.map((tier) => (
          <MembershipCard
            key={tier.tier}
            tier={tier}
            isCurrentTier={currentMembership?.tier === tier.tier || (!currentMembership && tier.tier === 'free')}
            onSelect={() => handleSelectTier(tier.tier)}
          />
        ))}

        <View style={styles.faq}>
          <Text style={[styles.faqTitle, { color: colors.textPrimary }]}>Häufige Fragen</Text>

          <Text style={[styles.faqQ, { color: colors.textPrimary }]}>Kann ich jederzeit kündigen?</Text>
          <Text style={[styles.faqA, { color: colors.textSecondary }]}>
            Ja, du kannst dein Abo jederzeit in den iOS-Einstellungen kündigen. Es läuft dann bis zum Ende der Abrechnungsperiode weiter.
          </Text>

          <Text style={[styles.faqQ, { color: colors.textPrimary }]}>Was ist Early Access?</Text>
          <Text style={[styles.faqA, { color: colors.textSecondary }]}>
            Plus-Mitglieder können sich 24 Stunden vor der allgemeinen Öffnung für Turniere anmelden. Club-Mitglieder sogar 48 Stunden vorher.
          </Text>

          <Text style={[styles.faqQ, { color: colors.textPrimary }]}>Wie funktioniert die Wartelisten-Priorität?</Text>
          <Text style={[styles.faqA, { color: colors.textSecondary }]}>
            Bei vollen Turnieren werden Club-Mitglieder bevorzugt nachgerückt, dann Plus-Mitglieder, dann Free-Nutzer.
          </Text>
        </View>

        <Text style={[styles.legalText, { color: colors.textTertiary }]}>
          Abos werden über Apple In-App Purchase abgewickelt. Der Betrag wird monatlich über dein Apple-Konto abgerechnet. Das Abo verlängert sich automatisch, sofern nicht mindestens 24 Stunden vor Ende der laufenden Periode gekündigt wird.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md },
  headline: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold as any, textAlign: 'center', marginBottom: spacing.xs, marginTop: spacing.md },
  subtitle: { fontSize: fontSize.md, textAlign: 'center', marginBottom: spacing.xl, lineHeight: 22 },
  faq: { marginTop: spacing.lg },
  faqTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold as any, marginBottom: spacing.md },
  faqQ: { fontSize: fontSize.md, fontWeight: fontWeight.semibold as any, marginTop: spacing.md, marginBottom: spacing.xxs },
  faqA: { fontSize: fontSize.sm, lineHeight: 20 },
  legalText: { fontSize: fontSize.xxs, textAlign: 'center', lineHeight: 16, marginTop: spacing.xl, paddingHorizontal: spacing.md },
});