/**
 * 3-step registration flow:
 *   step 0  Type (Solo / Duo / Team)
 *   step 1  Confirmation
 *   step 2  Success splash
 *
 * Calls into `useRegistrationStore.registerForEvent`, which is wired to
 * the real backend.
 *
 * Step 1 used to render a fabricated "Apple Pay •••• 4242" row with a
 * green checkmark — a payment method that did not exist, attached to a
 * charge that never happened. Fabricated payment UI is a guaranteed App
 * Store rejection, and it misleads the user about what they just agreed
 * to. While PAYMENTS_ENABLED is false the step confirms a free
 * registration; the paid variant returns with StoreKit and live Stripe.
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Easing, TextInput } from 'react-native';
import * as Haptics from 'expo-haptics';
import { fontFamily } from '../../theme/typography';
import { NC } from './tokens';
import { NCButton } from './NCButton';
import { NCBottomSheet } from './NCBottomSheet';
import { NCIcon } from './NCIcon';
import { useRegistrationStore } from '../../store/registrationStore';
import { PAYMENTS_ENABLED } from '../../config/features';

type Step = 0 | 1 | 2;
type RegType = 'solo' | 'duo';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface RegisterSheetProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  eventId: string | number;
  eventTitle: string;
  eventDateLabel?: string;
  feeCents: number;
  isMember?: boolean;
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
}) => {
  const [step, setStep] = useState<Step>(0);
  const [type, setType] = useState<RegType>('duo');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [consents, setConsents] = useState({ terms: false, age: false, media: false });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const registerForEvent = useRegistrationStore((s) => s.registerForEvent);

  // reset every time the sheet opens
  useEffect(() => {
    if (visible) {
      setStep(0);
      setType('duo');
      setPartnerEmail('');
      setConsents({ terms: false, age: false, media: false });
      setError(null);
      setSubmitting(false);
    }
  }, [visible]);

  const fee = feeCents / 100;
  const discount = isMember ? fee * 0.1 : 0;
  const total = fee - discount;

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await registerForEvent({
        event_id: Number(eventId),
        registration_type: type,
        partner_email: type === 'duo' ? partnerEmail.trim().toLowerCase() : undefined,
        consent_tournament_terms: true,
        consent_age_verified: true,
        consent_media: consents.media,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setStep(2);
    } catch (err: any) {
      // stay on step 1 so the user can fix the input and retry
      setError(err?.message && err.message !== 'Registration failed' ? err.message : 'Anmeldung fehlgeschlagen. Bitte versuche es erneut.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
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
          isMember={isMember}
          partnerEmail={partnerEmail}
          onPartnerEmail={setPartnerEmail}
          onNext={() => setStep(1)}
        />
      ) : null}
      {step === 1 ? (
        <Step1
          total={total}
          submitting={submitting}
          consents={consents}
          onConsents={setConsents}
          error={error}
          onSubmit={submit}
        />
      ) : null}
      {step === 2 ? (
        <Step2
          eventTitle={eventTitle}
          eventDateLabel={eventDateLabel}
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
  isMember: boolean;
  partnerEmail: string;
  onPartnerEmail: (v: string) => void;
  onNext: () => void;
}> = ({ type, onSelect, fee, discount, total, isMember, partnerEmail, onPartnerEmail, onNext }) => {
  const partnerOk = type !== 'duo' || EMAIL_RE.test(partnerEmail.trim());
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
        <View style={{ marginTop: 12 }}>
          <Text style={s.fieldLabel}>E-Mail deines Partners</Text>
          <TextInput
            value={partnerEmail}
            onChangeText={onPartnerEmail}
            placeholder="partner@beispiel.de"
            placeholderTextColor={NC.textT}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            style={s.input}
          />
          <Text style={s.fieldHint}>Wir laden deinen Partner ein. Meldet er sich an, seid ihr verknüpft.</Text>
        </View>
      ) : null}

      <View style={s.summary}>
        <SummaryRow label="Startgebühr" value={`${fee.toLocaleString('de', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`} />
        {isMember ? (
          <SummaryRow
            label="Plus Rabatt (−10%)"
            value={`−${discount.toLocaleString('de', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}
            color={NC.primaryLight}
          />
        ) : null}
        <View style={s.divider} />
        <SummaryRow
          label="Gesamt"
          value={`${total.toLocaleString('de', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}
          bold
        />
      </View>

      <View style={{ marginTop: 16 }}>
        <NCButton variant="primary" size="lg" full iconRight="arrowR" onPress={onNext} disabled={!partnerOk}>
          {PAYMENTS_ENABLED && total > 0 ? 'Weiter zur Zahlung' : 'Weiter'}
        </NCButton>
      </View>
    </View>
  );
};

// ─── Step 1 — Confirm ──────────────────────────────────────
type Consents = { terms: boolean; age: boolean; media: boolean };

const Step1: React.FC<{
  total: number;
  submitting: boolean;
  consents: Consents;
  onConsents: (c: Consents) => void;
  error: string | null;
  onSubmit: () => void;
}> = ({ total, submitting, consents, onConsents, error, onSubmit }) => {
  const free = !PAYMENTS_ENABLED || total <= 0;
  const ready = consents.terms && consents.age;
  const toggle = (key: keyof Consents) => {
    Haptics.selectionAsync().catch(() => {});
    onConsents({ ...consents, [key]: !consents[key] });
  };

  return (
    <View>
      <Text style={s.title}>{free ? 'Anmeldung bestätigen' : 'Zahlung'}</Text>
      <Text style={s.subtitle}>
        {free
          ? 'Die Teilnahme ist aktuell kostenlos.'
          : 'Du wirst zur gesicherten Zahlungsseite weitergeleitet.'}
      </Text>

      <View style={s.refundRow}>
        <NCIcon name="shield" size={14} color={NC.primaryLight} />
        <Text style={s.refundText}>
          {free
            ? 'Du kannst deine Anmeldung jederzeit wieder stornieren.'
            : '75% Rückerstattung bis 14 Tage vor Turnier'}
        </Text>
      </View>

      <View style={{ marginTop: 14, gap: 10 }}>
        <ConsentRow checked={consents.terms} onPress={() => toggle('terms')} label="Ich akzeptiere die Teilnahmebedingungen des Turniers." />
        <ConsentRow checked={consents.age} onPress={() => toggle('age')} label="Ich bin mindestens 18 Jahre alt." />
        <ConsentRow checked={consents.media} onPress={() => toggle('media')} label="Fotos und Videos von mir dürfen veröffentlicht werden (optional)." />
      </View>

      {error ? <Text style={s.error}>{error}</Text> : null}

      <View style={{ marginTop: 16 }}>
        <NCButton
          variant="primary"
          size="lg"
          full
          onPress={onSubmit}
          disabled={submitting || !ready}
        >
          {submitting
            ? 'Wird verarbeitet…'
            : free
              ? 'Jetzt anmelden'
              : `${total.toLocaleString('de', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € bezahlen`}
        </NCButton>
      </View>
    </View>
  );
};

const ConsentRow: React.FC<{ checked: boolean; onPress: () => void; label: string }> = ({ checked, onPress, label }) => (
  <Pressable onPress={onPress} style={s.consentRow} accessibilityRole="checkbox" accessibilityState={{ checked }}>
    <View
      style={[
        s.checkbox,
        { borderColor: checked ? NC.primary : NC.borderStr, backgroundColor: checked ? NC.primary : 'transparent' },
      ]}
    >
      {checked ? <NCIcon name="check" size={12} color="#FFFFFF" strokeWidth={3} /> : null}
    </View>
    <Text style={s.consentText}>{label}</Text>
  </Pressable>
);

// ─── Step 2 — Done ─────────────────────────────────────────
const Step2: React.FC<{ eventTitle: string; eventDateLabel?: string; onDone: () => void }> = ({
  eventTitle,
  eventDateLabel,
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

  return (
    <View style={{ alignItems: 'center', paddingVertical: 14 }}>
      <Animated.View style={[s.successCircle, { transform: [{ scale }] }]}>
        <NCIcon name="check" size={42} color="#FFFFFF" strokeWidth={3} />
      </Animated.View>
      <Text style={[s.title, { textAlign: 'center', marginTop: 8 }]}>Du bist dabei!</Text>
      <Text style={[s.subtitle, { textAlign: 'center', marginTop: 6, lineHeight: 20 }]}>
        {eventTitle}
        {eventDateLabel ? ` · ${eventDateLabel}` : ''}
        {'\n'}Wir senden dir 24 h vorher eine Erinnerung.
      </Text>
      <View style={{ marginTop: 20, width: '100%' }}>
        <NCButton variant="primary" size="lg" full onPress={onDone}>
          Fertig
        </NCButton>
      </View>
    </View>
  );
};

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
  fieldLabel: { fontFamily: fontFamily.uiSemibold, fontSize: 13, color: NC.textP, marginBottom: 6 },
  fieldHint: { fontFamily: fontFamily.uiMedium, fontSize: 12, color: NC.textT, marginTop: 6 },
  input: {
    borderWidth: 1,
    borderColor: NC.borderStr,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: NC.textP,
    fontFamily: fontFamily.uiMedium,
    fontSize: 15,
    backgroundColor: NC.bgCard,
  },
  consentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  consentText: { flex: 1, fontFamily: fontFamily.uiMedium, fontSize: 13, color: NC.textS, lineHeight: 18 },
  error: { fontFamily: fontFamily.uiMedium, fontSize: 13, color: NC.gold, marginTop: 12 },

  summary: {
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: NC.bgCard,
    borderWidth: 1,
    borderColor: NC.border,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  divider: { height: 1, backgroundColor: NC.divider, marginVertical: 10 },

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
