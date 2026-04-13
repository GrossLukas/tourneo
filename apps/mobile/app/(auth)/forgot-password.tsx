import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../src/providers/ThemeProvider';
import { TButton, TInput, THeader } from '../../src/components/common';
import { spacing, fontSize, fontWeight } from '../../src/theme/spacing';
import api from '../../src/api/client';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      Alert.alert(t('common.error'), 'Bitte gib eine gültige E-Mail-Adresse ein.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setSent(true);
    } catch (error: any) {
      // Show success regardless to prevent email enumeration
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgSecondary }]}>
      <THeader title="Passwort vergessen" showBack onBack={() => router.back()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {sent ? (
            <View style={styles.successContainer}>
              <Text style={styles.successIcon}>✉️</Text>
              <Text style={[styles.successTitle, { color: colors.textPrimary }]}>
                E-Mail gesendet!
              </Text>
              <Text style={[styles.successText, { color: colors.textSecondary }]}>
                Falls ein Konto mit dieser E-Mail existiert, haben wir dir einen Link zum Zurücksetzen deines Passworts gesendet. Bitte überprüfe auch deinen Spam-Ordner.
              </Text>
              <TButton
                title="Zurück zum Login"
                onPress={() => router.push('/(auth)/login')}
                variant="primary"
                style={{ marginTop: spacing.xl }}
              />
            </View>
          ) : (
            <>
              <Text style={[styles.title, { color: colors.textPrimary }]}>
                Passwort zurücksetzen
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum Zurücksetzen deines Passworts.
              </Text>
              <TInput
                label="E-Mail"
                placeholder="deine@email.de"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                required
              />
              <TButton
                title="Link senden"
                onPress={handleSubmit}
                loading={loading}
                size="lg"
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingTop: spacing.xl },
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold as any, marginBottom: spacing.xs },
  subtitle: { fontSize: fontSize.md, lineHeight: 22, marginBottom: spacing.xl },
  successContainer: { alignItems: 'center', paddingTop: spacing.xxl },
  successIcon: { fontSize: 64, marginBottom: spacing.lg },
  successTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold as any, marginBottom: spacing.md },
  successText: { fontSize: fontSize.md, textAlign: 'center', lineHeight: 22 },
});