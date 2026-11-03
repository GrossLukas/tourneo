/**
 * CheckinCodeScreen — the player's QR code for the venue check-in.
 *
 * Staff scan it with the admin scanner (/admin/checkin-scan). Inside the
 * check-in window the player can also check in by themselves.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { NCScreen, NCCard, NCButton, NCIcon, NC } from '../../../src/components/nightcourt';
import { fontFamily } from '../../../src/theme/typography';
import { getCheckinCode, selfCheckIn, type CheckinCode } from '../../../src/api/v2';

export default function CheckinCodeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [code, setCode] = useState<CheckinCode | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setCode(await getCheckinCode(id));
    } catch (err: any) {
      Alert.alert('Check-in', err?.response?.data?.error?.message || 'Der Check-in-Code konnte nicht geladen werden.');
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const windowOpen = code ? new Date(code.opens_at) <= new Date() : false;

  const onSelfCheckIn = async () => {
    if (!id) return;
    setBusy(true);
    try {
      await selfCheckIn(id);
      await load();
    } catch (err: any) {
      Alert.alert('Check-in', err?.response?.data?.error?.message || 'Check-in ist gerade nicht möglich.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <NCScreen>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Zurück">
          <NCIcon name="chevronL" size={22} color={NC.textP} />
        </Pressable>
        <Text style={s.title}>Check-in</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={s.body}>
        {!code ? (
          <ActivityIndicator color={NC.primaryLight} />
        ) : code.checked_in ? (
          <NCCard style={s.card}>
            <NCIcon name="check" size={40} color={NC.green} />
            <Text style={s.done}>Du bist eingecheckt</Text>
            <Text style={s.hint}>Viel Erfolg im Turnier!</Text>
          </NCCard>
        ) : (
          <NCCard style={s.card}>
            <View style={s.qrWrap}>
              <QRCode value={code.payload} size={220} backgroundColor="#FFFFFF" color="#0A0A14" />
            </View>
            <Text style={s.hint}>Zeig diesen Code am Turnierplatz vor.</Text>
            <Text style={s.meta}>
              {windowOpen
                ? 'Check-in ist geöffnet.'
                : `Check-in öffnet ${format(new Date(code.opens_at), "EEEE, d. MMM 'um' HH:mm 'Uhr'", { locale: de })}.`}
            </Text>
            {windowOpen ? (
              <View style={{ alignSelf: 'stretch', marginTop: 16 }}>
                <NCButton variant="primary" size="lg" full onPress={onSelfCheckIn} disabled={busy}>
                  {busy ? 'Wird eingecheckt…' : 'Selbst einchecken'}
                </NCButton>
              </View>
            ) : null}
          </NCCard>
        )}
      </View>
    </NCScreen>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: { fontFamily: fontFamily.displayBold, fontSize: 18, fontWeight: '700', color: NC.textP },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 12, alignItems: 'stretch' },
  card: { alignItems: 'center', padding: 24 },
  qrWrap: { padding: 14, backgroundColor: '#FFFFFF', borderRadius: 18, marginBottom: 18 },
  done: { fontFamily: fontFamily.displayBold, fontSize: 20, fontWeight: '700', color: NC.textP, marginTop: 12 },
  hint: { fontFamily: fontFamily.uiMedium, fontSize: 14, color: NC.textS, textAlign: 'center', marginTop: 4 },
  meta: { fontFamily: fontFamily.uiMedium, fontSize: 13, color: NC.textT, textAlign: 'center', marginTop: 8 },
});
