import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import apiClient from '../../../src/api/client';
import { getRegistrationCheckinQrUrl, getRegistrationCheckinToken } from '../../../src/api/v2';
import { THeader, TLoadingScreen } from '../../../src/components/common';
import { useTheme } from '../../../src/providers/ThemeProvider';
import { spacing, fontSize, fontWeight, radius } from '../../../src/theme/spacing';

export default function CheckinQrScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const [authHeader, setAuthHeader] = useState<string | null>(null);
  const [tokenData, setTokenData] = useState<Awaited<ReturnType<typeof getRegistrationCheckinToken>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      const [token, data] = await Promise.all([
        SecureStore.getItemAsync('access_token'),
        getRegistrationCheckinToken(id),
      ]);
      setAuthHeader(token ? `Bearer ${token}` : null);
      setTokenData(data);
      setLoading(false);
    };
    load().catch((err) => {
      setLoading(false);
      Alert.alert('Fehler', err?.response?.data?.error?.message || 'QR-Code konnte nicht geladen werden.');
    });
  }, [id]);

  const selfCheckin = async () => {
    if (!id) return;
    setCheckingIn(true);
    try {
      await apiClient.post(`/registrations/${id}/checkin`, {});
      Alert.alert('Check-in erfolgreich', 'Du bist fuer das Turnier eingecheckt.');
      const data = await getRegistrationCheckinToken(id);
      setTokenData(data);
    } catch (err: any) {
      Alert.alert('Check-in nicht moeglich', err?.response?.data?.error?.message || 'Bitte am Turniertag erneut versuchen.');
    } finally {
      setCheckingIn(false);
    }
  };

  if (loading) return <TLoadingScreen message="QR-Code wird geladen..." />;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <THeader title="Check-in QR-Code" showBack onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          {id && authHeader ? (
            <Image
              source={{ uri: getRegistrationCheckinQrUrl(id), headers: { Authorization: authHeader } }}
              style={styles.qr}
              resizeMode="contain"
            />
          ) : null}
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {tokenData?.checked_in ? 'Bereits eingecheckt' : 'Am Turniertag vorzeigen'}
          </Text>
          <Text style={[styles.body, { color: colors.textTertiary }]}>
            Der Admin scannt diesen Code am Eingang. Der Code funktioniert nur fuer deine bestaetigte Anmeldung.
          </Text>
          {tokenData?.expires_at ? (
            <Text style={[styles.meta, { color: colors.textTertiary }]}>
              Gueltig bis {new Date(tokenData.expires_at).toLocaleString('de-DE')}
            </Text>
          ) : null}
        </View>

        <TouchableOpacity
          onPress={selfCheckin}
          disabled={checkingIn || tokenData?.checked_in}
          style={[
            styles.button,
            {
              backgroundColor: tokenData?.checked_in ? colors.surfaceSecondary : colors.primary,
              opacity: checkingIn ? 0.6 : 1,
            },
          ]}
        >
          <Text style={styles.buttonText}>
            {tokenData?.checked_in ? 'Eingecheckt' : checkingIn ? 'Check-in...' : 'Self Check-in'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  qr: {
    width: 260,
    height: 260,
    borderRadius: radius.md,
    backgroundColor: '#FFFFFF',
  },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold as any, textAlign: 'center' },
  body: { fontSize: fontSize.sm, textAlign: 'center', lineHeight: 20 },
  meta: { fontSize: fontSize.xs, textAlign: 'center' },
  button: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  buttonText: { color: '#FFFFFF', fontSize: fontSize.base, fontWeight: fontWeight.bold as any },
});
