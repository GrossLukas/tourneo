/**
 * CheckinScanScreen — staff scan players' check-in QR codes at the venue.
 *
 * Each code is sent once to POST /admin/checkins/qr; the result stays on
 * screen until the next code is scanned, so a queue of players can be
 * checked in quickly. Admin-only (the API enforces it as well).
 */
import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { NCScreen, NCCard, NCButton, NCIcon, NC } from '../../src/components/nightcourt';
import { fontFamily } from '../../src/theme/typography';
import { useAuthStore } from '../../src/store/authStore';
import { checkInByQr } from '../../src/api/v2';

type Result = { ok: boolean; title: string; detail: string };

export default function CheckinScanScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [result, setResult] = useState<Result | null>(null);
  const busy = useRef(false);
  const lastPayload = useRef<string | null>(null);
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const onScan = async ({ data }: { data: string }) => {
    // The camera reports the same code many times per second – handle each code once
    if (busy.current || data === lastPayload.current) return;
    busy.current = true;
    lastPayload.current = data;
    try {
      const r = await checkInByQr(data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setResult({
        ok: true,
        title: r.already_checked_in ? `${r.player} war schon eingecheckt` : `${r.player} eingecheckt`,
        detail: r.event_title,
      });
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setResult({
        ok: false,
        title: 'Check-in nicht möglich',
        detail: err?.response?.data?.error?.message || 'Unbekannter Code.',
      });
    } finally {
      busy.current = false;
    }
  };

  return (
    <NCScreen>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Zurück">
          <NCIcon name="chevronL" size={22} color={NC.textP} />
        </Pressable>
        <Text style={s.title}>QR-Check-in</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={s.body}>
        {!isAdmin ? (
          <Text style={s.hint}>Nur für Veranstalter.</Text>
        ) : !permission ? null : !permission.granted ? (
          <NCCard style={s.card}>
            <Text style={s.hint}>Für den Scanner braucht Tourneo Zugriff auf die Kamera.</Text>
            <View style={{ alignSelf: 'stretch', marginTop: 16 }}>
              <NCButton variant="primary" size="lg" full onPress={requestPermission}>
                Kamera erlauben
              </NCButton>
            </View>
          </NCCard>
        ) : (
          <>
            <View style={s.cameraWrap}>
              <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={onScan}
              />
            </View>
            {result ? (
              <NCCard style={[s.result, { borderColor: result.ok ? NC.green : NC.gold }]}>
                <NCIcon name={result.ok ? 'check' : 'close'} size={22} color={result.ok ? NC.green : NC.gold} />
                <View style={{ flex: 1 }}>
                  <Text style={s.resultTitle}>{result.title}</Text>
                  <Text style={s.hint}>{result.detail}</Text>
                </View>
              </NCCard>
            ) : (
              <Text style={[s.hint, { marginTop: 16 }]}>Halte die Kamera auf den Check-in-Code des Spielers.</Text>
            )}
          </>
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
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },
  card: { alignItems: 'center', padding: 24 },
  cameraWrap: { aspectRatio: 1, borderRadius: 22, overflow: 'hidden', backgroundColor: '#000' },
  result: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 14, marginTop: 16, borderWidth: 1 },
  resultTitle: { fontFamily: fontFamily.displayBold, fontSize: 16, fontWeight: '700', color: NC.textP },
  hint: { fontFamily: fontFamily.uiMedium, fontSize: 14, color: NC.textS, textAlign: 'center' },
});
