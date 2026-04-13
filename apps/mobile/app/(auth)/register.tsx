import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../src/providers/ThemeProvider';
import { TButton, TInput, THeader } from '../../src/components/common';
import { useAuthStore } from '../../src/store/authStore';
import { spacing, fontSize, fontWeight } from '../../src/theme/spacing';

export default function RegisterScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { register, isLoading } = useAuthStore();

  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
  });
  const [consents, setConsents] = useState({
    terms: false,
    privacy: false,
    age18: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateForm = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.email.trim()) newErrors.email = 'E-Mail ist erforderlich';
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Ungültige E-Mail-Adresse';

    if (!form.password) newErrors.password = 'Passwort ist erforderlich';
    else if (form.password.length < 8) newErrors.password = 'Mindestens 8 Zeichen';

    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwörter stimmen nicht überein';

    if (!form.displayName.trim()) newErrors.displayName = 'Anzeigename ist erforderlich';
    else if (form.displayName.trim().length < 3) newErrors.displayName = 'Mindestens 3 Zeichen';

    if (!form.firstName.trim()) newErrors.firstName = 'Vorname ist erforderlich';
    if (!form.lastName.trim()) newErrors.lastName = 'Nachname ist erforderlich';

    if (!form.dateOfBirth.trim()) {
      newErrors.dateOfBirth = 'Geburtsdatum ist erforderlich';
    } else {
      const dobRegex = /^\d{2}\.\d{2}\.\d{4}$/;
      if (!dobRegex.test(form.dateOfBirth)) {
        newErrors.dateOfBirth = 'Format: TT.MM.JJJJ';
      } else {
        const parts = form.dateOfBirth.split('.');
        const dob = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        if (age < 18) newErrors.dateOfBirth = 'Du musst mindestens 18 Jahre alt sein';
      }
    }

    if (!consents.terms) newErrors.terms = 'AGB müssen akzeptiert werden';
    if (!consents.privacy) newErrors.privacy = 'Datenschutz muss akzeptiert werden';
    if (!consents.age18) newErrors.age18 = 'Altersbestätigung erforderlich';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const convertDateFormat = (dateStr: string): string => {
    const parts = dateStr.split('.');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    try {
      await register({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        display_name: form.displayName.trim(),
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        date_of_birth: convertDateFormat(form.dateOfBirth),
        consent_terms: consents.terms,
        consent_privacy: consents.privacy,
        consent_age_verification: consents.age18,
      });
      router.replace('/(tabs)/home');
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || 'Registrierung fehlgeschlagen', [
        { text: t('common.ok') },
      ]);
    }
  };

  const ConsentRow = ({
    label,
    value,
    onToggle,
    error,
    linkText,
    onLinkPress,
  }: {
    label: string;
    value: boolean;
    onToggle: (v: boolean) => void;
    error?: string;
    linkText?: string;
    onLinkPress?: () => void;
  }) => (
    <View style={styles.consentRow}>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: (colors.primary as string) }}
        thumbColor={value ? (colors.primary as string) : colors.bgTertiary}
        ios_backgroundColor={colors.border}
      />
      <View style={styles.consentTextContainer}>
        <Text style={[styles.consentLabel, { color: colors.textSecondary }]}>
          {label}
          {linkText && onLinkPress && (
            <Text style={{ color: (colors.primary as string) }} onPress={onLinkPress}>
              {' '}{linkText}
            </Text>
          )}
        </Text>
        {error && <Text style={[styles.consentError, { color: colors.error }]}>{error}</Text>}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bgSecondary }]}>
      <THeader title={t('auth.register')} showBack onBack={() => router.back()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={[styles.headline, { color: colors.textPrimary }]}>
            Erstelle dein Konto
          </Text>
          <Text style={[styles.subtitle, { color: colors.textTertiary }]}>
            Werde Teil der Tourneo-Community
          </Text>

          <View style={styles.form}>
            <TInput
              label="Anzeigename"
              placeholder="z.B. PadelKing92"
              value={form.displayName}
              onChangeText={(v) => updateForm('displayName', v)}
              error={errors.displayName}
              autoCapitalize="none"
              required
            />
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <TInput
                  label="Vorname"
                  placeholder="Max"
                  value={form.firstName}
                  onChangeText={(v) => updateForm('firstName', v)}
                  error={errors.firstName}
                  required
                />
              </View>
              <View style={styles.halfInput}>
                <TInput
                  label="Nachname"
                  placeholder="Mustermann"
                  value={form.lastName}
                  onChangeText={(v) => updateForm('lastName', v)}
                  error={errors.lastName}
                  required
                />
              </View>
            </View>
            <TInput
              label="E-Mail"
              placeholder="deine@email.de"
              value={form.email}
              onChangeText={(v) => updateForm('email', v)}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              required
            />
            <TInput
              label="Geburtsdatum"
              placeholder="TT.MM.JJJJ"
              value={form.dateOfBirth}
              onChangeText={(v) => updateForm('dateOfBirth', v)}
              error={errors.dateOfBirth}
              keyboardType="number-pad"
              hint="Du musst mindestens 18 Jahre alt sein"
              required
            />
            <TInput
              label="Passwort"
              placeholder="Mindestens 8 Zeichen"
              value={form.password}
              onChangeText={(v) => updateForm('password', v)}
              error={errors.password}
              secureTextEntry={!showPassword}
              rightIcon={
                <Text style={{ color: colors.textTertiary, fontSize: 16 }}>
                  {showPassword ? '🙈' : '👁'}
                </Text>
              }
              onRightIconPress={() => setShowPassword(!showPassword)}
              required
            />
            <TInput
              label="Passwort bestätigen"
              placeholder="Passwort wiederholen"
              value={form.confirmPassword}
              onChangeText={(v) => updateForm('confirmPassword', v)}
              error={errors.confirmPassword}
              secureTextEntry={!showPassword}
              required
            />
          </View>

          <View style={[styles.consentsSection, { borderTopColor: colors.border }]}>
            <Text style={[styles.consentsTitle, { color: colors.textPrimary }]}>
              Einwilligungen
            </Text>
            <ConsentRow
              label="Ich akzeptiere die"
              linkText="AGB"
              onLinkPress={() => router.push('/legal/terms')}
              value={consents.terms}
              onToggle={(v) => setConsents((p) => ({ ...p, terms: v }))}
              error={errors.terms}
            />
            <ConsentRow
              label="Ich habe die"
              linkText="Datenschutzerklärung"
              onLinkPress={() => router.push('/legal/privacy')}
              value={consents.privacy}
              onToggle={(v) => setConsents((p) => ({ ...p, privacy: v }))}
              error={errors.privacy}
            />
            <ConsentRow
              label="Ich bestätige, dass ich mindestens 18 Jahre alt bin"
              value={consents.age18}
              onToggle={(v) => setConsents((p) => ({ ...p, age18: v }))}
              error={errors.age18}
            />
          </View>

          <TButton
            title="Konto erstellen"
            onPress={handleRegister}
            loading={isLoading}
            size="lg"
          />

          <View style={styles.loginLink}>
            <Text style={[styles.loginText, { color: colors.textSecondary }]}>
              Bereits ein Konto?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={[styles.loginLinkText, { color: (colors.primary as string) }]}>
                Jetzt anmelden
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: 60 },
  headline: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold as any, marginBottom: spacing.xs },
  subtitle: { fontSize: fontSize.md, marginBottom: spacing.lg },
  form: { marginBottom: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm },
  halfInput: { flex: 1 },
  consentsSection: { borderTopWidth: 1, paddingTop: spacing.md, marginBottom: spacing.lg },
  consentsTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold as any, marginBottom: spacing.md },
  consentRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md },
  consentTextContainer: { flex: 1, marginLeft: spacing.sm, paddingTop: 2 },
  consentLabel: { fontSize: fontSize.sm, lineHeight: 20 },
  consentError: { fontSize: fontSize.xs, marginTop: 2 },
  loginLink: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
  loginText: { fontSize: fontSize.sm },
  loginLinkText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold as any },
});