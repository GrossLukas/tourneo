/**
 * 3-step registration flow:
 *   step 0  Type (Solo / Duo / Team)
 *   step 1  Payment summary + platform payment CTA
 *   step 2  Success splash
 *
 * Calls into `useRegistrationStore.registerForEvent` so it's wired to the
 * real backend.  Payment is mocked for now (the backend takes a separate
 * Stripe checkout flow already).
 */
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Image, Platform, View, Text, Pressable, StyleSheet, Animated, TextInput } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { fontFamily } from '../../theme/typography';
import { NC } from './tokens';
import { NCButton } from './NCButton';
import { NCBottomSheet } from './NCBottomSheet';
import { NCIcon } from './NCIcon';
import { useRegistrationStore, type Registration } from '../../store/registrationStore';
import { useCheckoutStore } from '../../store/checkoutStore';
import { declarePlaytomicLevel, uploadPlaytomicScreenshot } from '../../api/v2';

type Step = 0 | 1 | 2;
type RegType = 'solo' | 'duo' | 'team';

interface RegisterSheetProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  eventId: string | number;
  eventTitle: string;
  eventDateLabel?: string;
  feeCents: number;
  isMember?: boolean;
  requiresPlaytomicVerification?: boolean;
  minPlaytomicLevel?: number | null;
  maxPlaytomicLevel?: number | null;
  eligibilityNote?: string | null;
}

export const RegisterSheet: React.FC<RegisterSheetProps> = ({
  visible,
  onClose,
  onSuccess,
  eventId,
  eventTitle,
  eventDateLabel,
  feeCents,
  isMember = false,
  requiresPlaytomicVerification = false,
  minPlaytomicLevel,
  maxPlaytomicLevel,
  eligibilityNote,
}) => {
  const [step, setStep] = useState<Step>(0);
  const [type, setType] = useState<RegType>('solo');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [privacyAccepted, setPrivacyAccepted] = useState(!requiresPlaytomicVerification);
  const [playtomicLevel, setPlaytomicLevel] = useState('');
  const [screenshotUri, setScreenshotUri] = useState<string | null>(null);
  const [partnerEmail, setPartnerEmail] = useState('');
  const [lastRegistration, setLastRegistration] = useState<Registration | null>(null);
  const registerForEvent = useRegistrationStore((s) => s.registerForEvent);
  const checkout = useCheckoutStore();

  // reset every time the sheet opens
  useEffect(() => {
    if (visible) {
      setStep(0);
      setType('solo');
      setSubmitting(false);
      setError(null);
      setPrivacyAccepted(!requiresPlaytomicVerification);
      setPlaytomicLevel('');
      setScreenshotUri(null);
      setPartnerEmail('');
      setLastRegistration(null);
      checkout.reset();
    }
  }, [visible, requiresPlaytomicVerification]);

  const fee = feeCents / 100;
  const discount = isMember ? fee * 0.1 : 0;
  const total = fee - discount;
  const seatCount = type === 'team' ? 4 : type === 'duo' ? 2 : 1;
  const groupTotal = total * seatCount;

  const pickScreenshot = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setScreenshotUri(result.assets[0].uri);
    }
  };

  const takeScreenshotPhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Kamera-Zugriff fehlt', 'Bitte erlaube die Kamera oder wähle ein Bild aus deiner Galerie.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setScreenshotUri(result.assets[0].uri);
    }
  };

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      let submittedLevel: number | undefined;
      if (requiresPlaytomicVerification) {
        submittedLevel = Number(playtomicLevel.replace(',', '.'));
        if (!Number.isFinite(submittedLevel) || submittedLevel < 0 || submittedLevel > 7) {
          throw new Error('Bitte trage dein Playtomic-Level zwischen 0.0 und 7.0 ein.');
        }
        if (!screenshotUri) {
          throw new Error('Bitte lade einen Playtomic-Screenshot hoch.');
        }
        await declarePlaytomicLevel(submittedLevel);
        await uploadPlaytomicScreenshot(screenshotUri);
      }

      if (type === 'duo' && !/^\S+@\S+\.\S+$/.test(partnerEmail.trim())) {
        throw new Error('Bitte trage die E-Mail deines Duo-Partners ein.');
      }

      const registration = await registerForEvent({
        event_id: Number(eventId),
        registration_type: type,
        partner_email: type === 'duo' ? partnerEmail.trim() : undefined,
        playtomic_level: submittedLevel,
      });
      setLastRegistration(registration);

      if (registration.requires_payment && registration.status === 'pending_payment') {
        await checkout.createCheckoutSession(Number(eventId), Number(registration.id));
        const checkoutState = useCheckoutStore.getState();
        if (checkoutState.status === 'error') {
          throw new Error(checkoutState.error || 'Checkout konnte nicht erstellt werden.');
        }
        const paymentStatus = await checkoutState.openCheckout();
        if (paymentStatus === 'cancelled') {
          throw new Error('Zahlung abgebrochen. Deine Anmeldung bleibt bis zur Zahlung offen.');
        }
        if (paymentStatus === 'error') {
          throw new Error(useCheckoutStore.getState().error || 'Zahlung konnte nicht gestartet werden.');
        }
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setStep(2);
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setError(err instanceof Error ? err.message : 'Anmeldung fehlgeschlagen.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <NCBottomSheet visible={visible} onClose={onClose}>
      {step === 0 ? (
        <Step0
          type={type}
          onSelect={setType}
          fee={fee}
          discount={discount}
          total={total}
          groupTotal={groupTotal}
          seatCount={seatCount}
          isMember={isMember}
          requiresPlaytomicVerification={requiresPlaytomicVerification}
          minPlaytomicLevel={minPlaytomicLevel}
          maxPlaytomicLevel={maxPlaytomicLevel}
          eligibilityNote={eligibilityNote}
          privacyAccepted={privacyAccepted}
          playtomicLevel={playtomicLevel}
          screenshotUri={screenshotUri}
          partnerEmail={partnerEmail}
          onChangePlaytomicLevel={setPlaytomicLevel}
          onChangePartnerEmail={setPartnerEmail}
          onPickScreenshot={pickScreenshot}
          onTakeScreenshotPhoto={takeScreenshotPhoto}
          onTogglePrivacy={() => setPrivacyAccepted((v) => !v)}
          onNext={() => setStep(1)}
        />
      ) : null}
      {step === 1 ? (
        <Step1
          total={total}
          groupTotal={groupTotal}
          seatCount={seatCount}
          requiresPlaytomicVerification={requiresPlaytomicVerification}
          submitting={submitting}
          error={error}
          onSubmit={submit}
        />
      ) : null}
      {step === 2 ? (
        <Step2
          eventTitle={eventTitle}
          eventDateLabel={eventDateLabel}
          registrationStatus={lastRegistration?.status}
          onDone={() => {
            onClose();
            onSuccess?.();
          }}
        />
      ) : null}
    </NCBottomSheet>
  );
};

// ─── Step 0 — Type ──────────────────────────────────────────
const TYPE_OPTIONS: { k: RegType; label: string; sub: string }[] = [
  { k: 'solo', label: 'Solo', sub: 'Allein antreten' },
  { k: 'duo', label: 'Duo', sub: 'Mit Partner anmelden' },
];

const Step0: React.FC<{
  type: RegType;
  onSelect: (t: RegType) => void;
  fee: number;
  discount: number;
  total: number;
  groupTotal: number;
  seatCount: number;
  isMember: boolean;
  requiresPlaytomicVerification: boolean;
  minPlaytomicLevel?: number | null;
  maxPlaytomicLevel?: number | null;
  eligibilityNote?: string | null;
  privacyAccepted: boolean;
  playtomicLevel: string;
  screenshotUri: string | null;
  partnerEmail: string;
  onChangePlaytomicLevel: (value: string) => void;
  onChangePartnerEmail: (value: string) => void;
  onPickScreenshot: () => void;
  onTakeScreenshotPhoto: () => void;
  onTogglePrivacy: () => void;
  onNext: () => void;
}> = ({
  type,
  onSelect,
  fee,
  discount,
  total,
  groupTotal,
  seatCount,
  isMember,
  requiresPlaytomicVerification,
  minPlaytomicLevel,
  maxPlaytomicLevel,
  eligibilityNote,
  privacyAccepted,
  playtomicLevel,
  screenshotUri,
  partnerEmail,
  onChangePlaytomicLevel,
  onChangePartnerEmail,
  onPickScreenshot,
  onTakeScreenshotPhoto,
  onTogglePrivacy,
  onNext,
}) => {
  const parsedLevel = Number(playtomicLevel.replace(',', '.'));
  const hasValidLevel = Number.isFinite(parsedLevel) && parsedLevel >= 0 && parsedLevel <= 7;
  const hasValidPartner = type !== 'duo' || /^\S+@\S+\.\S+$/.test(partnerEmail.trim());
  const canContinue =
    hasValidPartner &&
    (!requiresPlaytomicVerification || (privacyAccepted && hasValidLevel && Boolean(screenshotUri)));
  return (
    <View>
      <Text style={s.title}>Anmeldung</Text>
      <Text style={s.subtitle}>Wähle deinen Anmeldetyp</Text>

      <View style={{ marginTop: 16, gap: 8 }}>
        {TYPE_OPTIONS.map((t) => {
          const active = type === t.k;
          return (
            <Pressable
              key={t.k}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                onSelect(t.k);
              }}
              style={[
                s.typeRow,
                {
                  backgroundColor: active ? NC.primaryBg : NC.bgCard,
                  borderColor: active ? NC.primary : NC.border,
                },
              ]}
            >
              <View
                style={[
                  s.radio,
                  {
                    borderColor: active ? NC.primary : NC.borderStr,
                    backgroundColor: active ? NC.primary : 'transparent',
                  },
                ]}
              >
                {active ? <NCIcon name="check" size={12} color="#FFFFFF" strokeWidth={3} /> : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.typeLabel}>{t.label}</Text>
                <Text style={s.typeSub}>{t.sub}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {type === 'duo' ? (
        <View style={s.partnerBox}>
          <Text style={s.inputLabel}>E-Mail deines Duo-Partners</Text>
          <TextInput
            value={partnerEmail}
            onChangeText={onChangePartnerEmail}
            placeholder="partner@example.com"
            placeholderTextColor={NC.textT}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={s.levelInput}
          />
          <Text style={s.verifyText}>
            Dein Partner bekommt eine Einladung und meldet sich separat an. Jeder zahlt nur seinen eigenen Anteil.
          </Text>
        </View>
      ) : null}

      <View style={s.summary}>
        <SummaryRow label="Startgebühr pro Person" value={`${fee.toLocaleString('de', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR`} />
        {isMember ? (
          <SummaryRow
            label="Plus Rabatt (-10%)"
            value={`-${discount.toLocaleString('de', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR`}
            color={NC.primaryLight}
          />
        ) : null}
        <View style={s.divider} />
        <SummaryRow
          label="Zahlung pro Person"
          value={`${total.toLocaleString('de', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR`}
          bold
        />
        {seatCount > 1 ? (
          <SummaryRow
            label={`Teamgesamt (${seatCount} Personen)`}
            value={`${groupTotal.toLocaleString('de', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR`}
          />
        ) : null}
      </View>

      {requiresPlaytomicVerification ? (
        <View style={s.verifyBox}>
          <View style={s.verifyHeader}>
            <NCIcon name="shield" size={16} color={NC.primaryLight} />
            <Text style={s.verifyTitle}>Playtomic-Prüfung erforderlich</Text>
          </View>
          <Text style={s.verifyText}>
            Zugelassen werden nur passende Spieler. Der Screenshot muss Name, Playtomic-Level,
            Rankingpunkte und Profil erkennbar zeigen.
          </Text>
          <Text style={s.verifyText}>
            Bereich: {formatLevelRange(minPlaytomicLevel, maxPlaytomicLevel)}
          </Text>
          {eligibilityNote ? <Text style={s.verifyText}>{eligibilityNote}</Text> : null}
          <View style={s.levelInputRow}>
            <Text style={s.inputLabel}>Dein Playtomic-Level</Text>
            <TextInput
              value={playtomicLevel}
              onChangeText={onChangePlaytomicLevel}
              placeholder="z. B. 2,1"
              placeholderTextColor={NC.textT}
              keyboardType="decimal-pad"
              style={s.levelInput}
            />
          </View>
          <View style={s.uploadRow}>
            <Pressable onPress={onPickScreenshot} style={s.uploadBtn}>
              <NCIcon name="plus" size={15} color={NC.textP} />
              <Text style={s.uploadText}>Screenshot wählen</Text>
            </Pressable>
            <Pressable onPress={onTakeScreenshotPhoto} style={s.uploadBtn}>
              <NCIcon name="shield" size={15} color={NC.textP} />
              <Text style={s.uploadText}>Foto</Text>
            </Pressable>
          </View>
          {screenshotUri ? <Image source={{ uri: screenshotUri }} style={s.previewImage} /> : null}
          <Pressable onPress={onTogglePrivacy} style={s.consentRow}>
            <View style={[s.checkbox, privacyAccepted && s.checkboxActive]}>
              {privacyAccepted ? <NCIcon name="check" size={12} color="#FFFFFF" strokeWidth={3} /> : null}
            </View>
            <Text style={s.consentText}>
              Ich stimme zu, dass meine Playtomic-Daten nur für diese Turnierprüfung verarbeitet werden.
            </Text>
          </Pressable>
        </View>
      ) : null}

      <View style={{ marginTop: 16 }}>
        <NCButton variant="primary" size="lg" full iconRight="arrowR" onPress={onNext} disabled={!canContinue}>
          {requiresPlaytomicVerification ? 'Zur Prüfung weiter' : 'Weiter zur Zahlung'}
        </NCButton>
      </View>
    </View>
  );
};

// ─── Step 1 — Pay ──────────────────────────────────────────
const Step1: React.FC<{
  total: number;
  groupTotal: number;
  seatCount: number;
  requiresPlaytomicVerification: boolean;
  submitting: boolean;
  error: string | null;
  onSubmit: () => void;
}> = ({
  total,
  groupTotal,
  seatCount,
  requiresPlaytomicVerification,
  submitting,
  error,
  onSubmit,
}) => {
  const paymentLabel = Platform.OS === 'android' ? 'Google Pay / Karte' : Platform.OS === 'ios' ? 'Apple Pay / Karte' : 'Stripe Checkout';

  return (
    <View>
      <Text style={s.title}>{requiresPlaytomicVerification ? 'Prüfung starten' : 'Zahlung'}</Text>
      <Text style={s.subtitle}>
        {requiresPlaytomicVerification
          ? 'Zahlung wird erst nach Freigabe fällig'
          : 'Stripe - SSL gesichert'}
      </Text>

      {!requiresPlaytomicVerification ? (
      <View style={s.payRow}>
        <View style={s.payIcon} />
        <View style={{ flex: 1 }}>
          <Text style={s.payTitle}>{paymentLabel}</Text>
          <Text style={s.payHint}>Weiter zu Stripe Checkout</Text>
        </View>
        <NCIcon name="check" size={18} color={NC.green} />
      </View>
      ) : (
        <View style={s.payRow}>
          <NCIcon name="shield" size={22} color={NC.primaryLight} />
          <View style={{ flex: 1 }}>
            <Text style={s.payTitle}>Admin-Freigabe</Text>
            <Text style={s.payHint}>Status steht bis zur Prüfung auf Ausstehend</Text>
          </View>
        </View>
      )}

      {error ? <Text style={s.errorText}>{error}</Text> : null}

      <View style={s.refundRow}>
        <NCIcon name="shield" size={14} color={NC.primaryLight} />
        <Text style={s.refundText}>75% Rückerstattung bis 14 Tage vor Turnier</Text>
      </View>

      <View style={{ marginTop: 16 }}>
        <NCButton
          variant="primary"
          size="lg"
          full
          onPress={onSubmit}
          disabled={submitting}
        >
          {submitting
            ? 'Wird verarbeitet...'
            : requiresPlaytomicVerification
              ? 'Anmeldung zur Prüfung senden'
              : `${total.toLocaleString('de', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR pro Person bezahlen`}
        </NCButton>
        {seatCount > 1 ? (
          <Text style={s.groupTotalHint}>
            Gesamt für {seatCount} Personen: {groupTotal.toLocaleString('de', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR
          </Text>
        ) : null}
      </View>
    </View>
  );
};

// ─── Step 2 — Done ─────────────────────────────────────────
const Step2: React.FC<{
  eventTitle: string;
  eventDateLabel?: string;
  registrationStatus?: Registration['status'];
  onDone: () => void;
}> = ({
  eventTitle,
  eventDateLabel,
  registrationStatus,
  onDone,
}) => {
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
      tension: 80,
    }).start();
  }, [scale]);

  const pending = registrationStatus === 'pending_verification';
  const waitlisted = registrationStatus === 'waitlisted';
  const paymentOpen = registrationStatus === 'pending_payment';

  return (
    <View style={{ alignItems: 'center', paddingVertical: 14 }}>
      <Animated.View style={[s.successCircle, { transform: [{ scale }] }]}>
        <NCIcon name="check" size={42} color="#FFFFFF" strokeWidth={3} />
      </Animated.View>
      <Text style={[s.title, { textAlign: 'center', marginTop: 8 }]}>
        {pending ? 'Prüfung ausstehend' : 'Du bist dabei!'}
      </Text>
      <Text style={[s.subtitle, { textAlign: 'center', marginTop: 6, lineHeight: 20 }]}>
        {eventTitle}
        {eventDateLabel ? ` · ${eventDateLabel}` : ''}
        {'\n'}
        {pending
          ? 'Du bekommst eine Push-Benachrichtigung, sobald du zugelassen bist.'
          : 'Wir senden dir 24 h vorher eine Erinnerung.'}
      </Text>
      {waitlisted ? (
        <Text style={[s.subtitle, { textAlign: 'center', marginTop: 6, lineHeight: 20 }]}>
          Du bist auf der Warteliste. Wir benachrichtigen dich, sobald ein Platz frei wird.
        </Text>
      ) : null}
      {paymentOpen ? (
        <Text style={[s.subtitle, { textAlign: 'center', marginTop: 6, lineHeight: 20 }]}>
          Sobald Stripe bestätigt, wird deine Anmeldung automatisch freigeschaltet.
        </Text>
      ) : null}
      <View style={{ marginTop: 20, width: '100%' }}>
        <NCButton variant="primary" size="lg" full onPress={onDone}>
          Fertig
        </NCButton>
      </View>
    </View>
  );
};

function formatLevelRange(min?: number | null, max?: number | null): string {
  const from = min == null ? 0 : Number(min);
  const to = max == null ? 7 : Number(max);
  return `${from.toFixed(1)} bis ${to.toFixed(1)}`;
}

const SummaryRow: React.FC<{ label: string; value: string; bold?: boolean; color?: string }> = ({
  label,
  value,
  bold,
  color,
}) => (
  <View style={s.summaryRow}>
    <Text
      style={{
        fontFamily: bold ? fontFamily.uiBold : fontFamily.uiMedium,
        fontWeight: bold ? '700' : '500',
        fontSize: 13,
        color: bold ? NC.textP : NC.textS,
      }}
    >
      {label}
    </Text>
    <Text
      style={{
        fontFamily: fontFamily.monoBold,
        fontSize: 13,
        fontWeight: bold ? '800' : '600',
        color: color || NC.textP,
      }}
    >
      {value}
    </Text>
  </View>
);

const s = StyleSheet.create({
  title: {
    fontFamily: fontFamily.displayExtra,
    fontSize: 20,
    fontWeight: '800',
    color: NC.textP,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 4,
    fontFamily: fontFamily.uiMedium,
    fontSize: 13,
    color: NC.textS,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeLabel: {
    fontFamily: fontFamily.displayBold,
    fontSize: 14,
    fontWeight: '700',
    color: NC.textP,
    letterSpacing: -0.2,
  },
  typeSub: { marginTop: 1, fontFamily: fontFamily.uiMedium, fontSize: 12, color: NC.textS },

  summary: {
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: NC.bgCard,
    borderWidth: 1,
    borderColor: NC.border,
  },
  partnerBox: {
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    backgroundColor: NC.bgCard,
    borderWidth: 1,
    borderColor: NC.border,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  divider: { height: 1, backgroundColor: NC.divider, marginVertical: 10 },
  verifyBox: {
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    backgroundColor: NC.primaryBg,
    borderWidth: 1,
    borderColor: NC.borderStr,
  },
  verifyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  verifyTitle: {
    fontFamily: fontFamily.uiSemibold,
    fontSize: 13,
    fontWeight: '700',
    color: NC.textP,
  },
  verifyText: {
    fontFamily: fontFamily.uiMedium,
    fontSize: 12,
    lineHeight: 18,
    color: NC.textS,
    marginTop: 4,
  },
  levelInputRow: { marginTop: 12 },
  inputLabel: {
    fontFamily: fontFamily.uiSemibold,
    fontSize: 11.5,
    fontWeight: '700',
    color: NC.textP,
    marginBottom: 6,
  },
  levelInput: {
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: NC.borderStr,
    backgroundColor: NC.bgInput,
    color: NC.textP,
    paddingHorizontal: 12,
    fontFamily: fontFamily.monoBold,
    fontSize: 14,
  },
  uploadRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  uploadBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: NC.borderStr,
    backgroundColor: NC.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
  },
  uploadText: {
    fontFamily: fontFamily.uiSemibold,
    fontSize: 11.5,
    fontWeight: '700',
    color: NC.textP,
  },
  previewImage: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    marginTop: 10,
    backgroundColor: NC.bgInput,
  },
  consentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 12 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: NC.borderStr,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxActive: { backgroundColor: NC.primary, borderColor: NC.primary },
  consentText: {
    flex: 1,
    fontFamily: fontFamily.uiMedium,
    fontSize: 11.5,
    lineHeight: 17,
    color: NC.textS,
  },

  payRow: {
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: NC.bgCard,
    borderWidth: 1,
    borderColor: NC.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  payIcon: { width: 36, height: 26, borderRadius: 5, backgroundColor: '#000000' },
  payTitle: {
    fontFamily: fontFamily.uiSemibold,
    fontSize: 13,
    fontWeight: '600',
    color: NC.textP,
  },
  payHint: { marginTop: 1, fontFamily: fontFamily.monoMedium, fontSize: 11, color: NC.textS },

  refundRow: {
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: NC.primaryBg,
    borderWidth: 1,
    borderColor: NC.borderStr,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refundText: { fontFamily: fontFamily.uiMedium, fontSize: 11.5, color: NC.textS },
  groupTotalHint: {
    marginTop: 8,
    textAlign: 'center',
    fontFamily: fontFamily.uiMedium,
    fontSize: 11.5,
    color: NC.textS,
  },

  errorText: {
    marginTop: 10,
    fontFamily: fontFamily.uiMedium,
    fontSize: 12,
    color: '#F87171',
  },

  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOpacity: 0.5,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 14 },
    elevation: 14,
  },
});
