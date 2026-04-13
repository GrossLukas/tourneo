import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppColors } from '../src/hooks/useColorScheme';
import { THeader, TInput, TButton, TCard, TChip } from '../src/components/common';
import { useAuthStore } from '../src/store/authStore';
import api from '../src/api/client';
import { spacing, fontSize, fontWeight } from '../src/theme/spacing';

type Category = 'general' | 'payment' | 'tournament' | 'technical' | 'account';

export default function SupportScreen() {
  const router = useRouter();
  const colors = useAppColors();
  const { user } = useAuthStore();

  const [category, setCategory] = useState<Category>('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const categories: { value: Category; label: string }[] = [
    { value: 'general', label: 'Allgemein' },
    { value: 'payment', label: 'Zahlung' },
    { value: 'tournament', label: 'Turnier' },
    { value: 'technical', label: 'Technik' },
    { value: 'account', label: 'Konto' },
  ];

  const handleSubmit = async () => {
    if (!subject.trim()) {
      Alert.alert('Fehler', 'Bitte gib einen Betreff ein.');
      return;
    }
    if (!message.trim()) {
      Alert.alert('Fehler', 'Bitte gib eine Nachricht ein.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/support/tickets', {
        category,
        subject: subject.trim(),
        message: message.trim(),
      });
      setSubmitted(true);
    } catch (error: any) {
      Alert.alert('Fehler', error.response?.data?.message || 'Ticket konnte nicht erstellt werden.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.neutral[50] }]}>
        <THeader title="Support" showBack onBack={() => router.back()} />
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={[styles.successTitle, { color: colors.neutral[900] }]}>Ticket erstellt!</Text>
          <Text style={[styles.successText, { color: colors.neutral[600] }]}>
            Wir haben dein Anliegen erhalten und werden uns schnellstmöglich bei dir melden. Du erhältst eine Bestätigung per E-Mail.
          </Text>
          <TButton
            title="Zurück zum Profil"
            onPress={() => router.back()}
            variant="primary"
            style={{ marginTop: spacing.xl }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.neutral[50] }]}>
      <THeader title="Hilfe & Support" showBack onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.headline, { color: colors.neutral[900] }]}>Wie können wir helfen?</Text>
        <Text style={[styles.subtitle, { color: colors.neutral[600] }]}>
          Beschreibe dein Anliegen und wir kümmern uns darum.
        </Text>

        {/* FAQ Quick Links */}
        <TCard variant="outlined" style={styles.faqCard}>
          <Text style={[styles.faqTitle, { color: colors.neutral[900] }]}>Häufige Themen</Text>
          <Text style={[styles.faqItem, { color: colors.primary[500] }]} onPress={() => router.push('/legal/terms')}>
            📄 Stornierungsrichtlinie
          </Text>
          <Text style={[styles.faqItem, { color: colors.primary[500] }]} onPress={() => router.push('/membership')}>
            ⭐ Mitgliedschaft & Abos
          </Text>
          <Text style={[styles.faqItem, { color: colors.primary[500] }]} onPress={() => router.push('/legal/privacy')}>
            🔒 Datenschutz
          </Text>
        </TCard>

        <Text style={[styles.sectionTitle, { color: colors.neutral[900] }]}>Neues Ticket erstellen</Text>

        <Text style={[styles.label, { color: colors.neutral[700] }]}>Kategorie</Text>
        <View style={styles.categoryRow}>
          {categories.map((c) => (
            <TChip
              key={c.value}
              label={c.label}
              selected={category === c.value}
              onPress={() => setCategory(c.value)}
            />
          ))}
        </View>

        <TInput
          label="Betreff"
          placeholder="Kurze Beschreibung deines Anliegens"
          value={subject}
          onChangeText={setSubject}
          required
        />

        <TInput
          label="Nachricht"
          placeholder="Beschreibe dein Anliegen im Detail..."
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={6}
          required
          containerStyle={{ marginBottom: spacing.lg }}
        />

        <TButton
          title="Ticket senden"
          onPress={handleSubmit}
          loading={loading}
          disabled={!user}
          size="lg"
        />

        {!user && (
          <Text style={[styles.loginHint, { color: colors.status.warning }]}>
            Du musst angemeldet sein, um ein Support-Ticket zu erstellen.
          </Text>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md },
  headline: { fontSize: fontSize.xl, fontWeight: fontWeight.bold as any, marginBottom: spacing.xs },
  subtitle: { fontSize: fontSize.md, marginBottom: spacing.lg, lineHeight: 22 },
  faqCard: { marginBottom: spacing.lg },
  faqTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold as any, marginBottom: spacing.sm },
  faqItem: { fontSize: fontSize.sm, paddingVertical: spacing.xs },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold as any, marginBottom: spacing.md },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium as any, marginBottom: spacing.xs },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  successIcon: { fontSize: 64, marginBottom: spacing.md },
  successTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold as any, marginBottom: spacing.sm },
  successText: { fontSize: fontSize.md, textAlign: 'center', lineHeight: 22 },
  loginHint: { fontSize: fontSize.sm, textAlign: 'center', marginTop: spacing.md },
});