/**
 * LoginScreen – Email login with Face ID/Touch ID and Apple Sign-In.
 * Biometric button shown when device supports it AND user has enabled it.
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useTheme } from '../../src/providers/ThemeProvider';
import { TButton, TInput, THeader, TModal } from '../../src/components/common';
import { useAuthStore } from '../../src/store/authStore';
import { useBiometricStore } from '../../src/store/biometricStore';
import { useBiometrics } from '../../src/hooks/useBiometrics';
import { spacing, fontSize, fontWeight, radius } from '../../src/theme/spacing';
import type { Colors } from '../../src/theme/colors';

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { login, loginWithApple, isLoading } = useAuthStore();
  const biometricStore = useBiometricStore();
  const biometrics = useBiometrics();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [bioError, setBioError] = useState(false);

  // Initialize biometric store
  useEffect(() => {
    biometricStore.initialize();
  }, []);

  // Auto-trigger biometric login if available and enabled
  useEffect(() => {
    if (biometricStore.isInitialized && biometricStore.enabled && biometrics.isAvailable && !biometrics.isChecking) {
      handleBiometricLogin();
    }
  }, [biometricStore.isInitialized, biometrics.isChecking]);

  const showBiometricButton = biometrics.isAvailable && biometricStore.enabled;

  const getBiometricIcon = (): string => {
    switch (biometrics.biometricType) {
      case 'faceId': return 'scan-outline';
      case 'touchId': return 'finger-print-outline';
      case 'fingerprint': return 'finger-print-outline';
      default: return 'lock-closed-outline';
    }
  };

  const getBiometricLabel = (): string => {
    switch (biometrics.biometricType) {
      case 'faceId': return t('biometrics.loginWithFaceId');
      case 'touchId': return t('biometrics.loginWithTouchId');
      case 'fingerprint': return t('biometrics.loginWithFingerprint');
      default: return t('biometrics.enable');
    }
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!email.trim()) {
      newErrors.email = t('auth.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t('auth.emailInvalid');
    }
    if (!password) {
      newErrors.password = t('auth.passwordRequired');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace('/(tabs)/home');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : t('auth.loginFailed');
      Alert.alert(t('common.error'), msg, [{ text: t('common.ok') }]);
    }
  };

  const handleBiometricLogin = async () => {
    const result = await biometricStore.loginWithBiometrics();
    if (result.success) {
      // Re-initialize auth store with the restored token
      await useAuthStore.getState().initialize();
      router.replace('/(tabs)/home');
    } else if (result.error === 'biometric_failed') {
      // User cancelled or failed – do nothing, they can use email
    } else {
      // Token expired or invalid
      setBioError(true);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential.identityToken) {
        await loginWithApple(credential.identityToken, {
          firstName: credential.fullName?.givenName ?? undefined,
          lastName: credential.fullName?.familyName ?? undefined,
        });
        router.replace('/(tabs)/home');
      }
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (code === 'ERR_REQUEST_CANCELED') {
        // User cancelled – do nothing
        return;
      }
      Alert.alert(t('common.error'), t('auth.appleSignInError'), [{ text: t('common.ok') }]);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgSecondary }]}>
      <THeader title={t('auth.login')} showBack onBack={() => router.back()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={[styles.welcome, { color: colors.textPrimary }]}>
            {t('auth.welcomeBack')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textTertiary }]}>
            {t('auth.loginSubtitle')}
          </Text>

          {/* ── Biometric Login Button ── */}
          {showBiometricButton && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleBiometricLogin}
              style={[styles.biometricBtn, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
            >
              <View style={[styles.biometricIconWrap, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name={getBiometricIcon() as any} size={32} color={colors.primary} />
              </View>
              <Text style={[styles.biometricLabel, { color: colors.textPrimary }]}>
                {getBiometricLabel()}
              </Text>
              <Text style={[styles.biometricHint, { color: colors.textTertiary }]}>
                {biometrics.getDisplayName()}
              </Text>
            </TouchableOpacity>
          )}

          {/* ── Divider ── */}
          {showBiometricButton && (
            <View style={styles.dividerContainer}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.textTertiary }]}>{t('auth.or')}</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>
          )}

          {/* ── Email Form ── */}
          <View style={styles.form}>
            <TInput
              label={t('auth.email')}
              placeholder="deine@email.de"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              required
            />
            <TInput
              label={t('auth.password')}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              secureTextEntry={!showPassword}
              rightIcon={
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.textTertiary}
                />
              }
              onRightIconPress={() => setShowPassword(!showPassword)}
              required
            />

            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password')}
              style={styles.forgotPassword}
            >
              <Text style={[styles.forgotPasswordText, { color: colors.primary as string }]}>
                {t('auth.forgotPassword')}
              </Text>
            </TouchableOpacity>

            <TButton title={t('auth.login')} onPress={handleLogin} loading={isLoading} size="lg" />
          </View>

          {/* ── Apple / Social Divider ── */}
          <View style={styles.dividerContainer}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textTertiary }]}>{t('common.or')}</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* ── Apple Sign-In ── */}
          {Platform.OS === 'ios' ? (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={isDark
                ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={12}
              style={styles.appleBtn}
              onPress={handleAppleSignIn}
            />
          ) : (
            <TButton
              title={t('auth.continueWithApple')}
              onPress={() => Alert.alert('Info', 'Apple Sign-In ist nur auf iOS verfügbar.')}
              variant="secondary"
              icon={<Ionicons name="logo-apple" size={20} color={colors.textPrimary} />}
              size="lg"
            />
          )}

          {/* ── Register Link ── */}
          <View style={styles.registerLink}>
            <Text style={[styles.registerText, { color: colors.textSecondary }]}>
              {t('auth.noAccount')}{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={[styles.registerLinkText, { color: colors.primary as string }]}>
                {t('auth.registerNow')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Biometric Error Modal ── */}
      <TModal
        visible={bioError}
        title={t('biometrics.failed')}
        onClose={() => setBioError(false)}
      >
        <Text style={[styles.modalText, { color: colors.textSecondary }]}>
          {t('biometrics.failed')}
        </Text>
        <TButton title={t('common.ok')} onPress={() => setBioError(false)} size="sm" />
      </TModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingTop: spacing.xl },
  welcome: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold as any, marginBottom: spacing.xs },
  subtitle: { fontSize: fontSize.md, marginBottom: spacing.xl },

  // Biometric
  biometricBtn: {
    alignItems: 'center', padding: spacing.xl, borderRadius: radius.xl,
    borderWidth: 1, marginBottom: spacing.lg,
  },
  biometricIconWrap: {
    width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  biometricLabel: { fontSize: fontSize.md, fontWeight: fontWeight.semibold as any, marginBottom: 4 },
  biometricHint: { fontSize: fontSize.sm },

  // Form
  form: { marginBottom: spacing.lg },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: spacing.lg, marginTop: -spacing.sm },
  forgotPasswordText: { fontSize: fontSize.sm, fontWeight: fontWeight.medium as any },

  // Dividers
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.lg },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth },
  dividerText: { marginHorizontal: spacing.md, fontSize: fontSize.sm },

  // Apple
  appleBtn: { width: '100%', height: 52 },

  // Register link
  registerLink: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
  registerText: { fontSize: fontSize.sm },
  registerLinkText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold as any },

  // Modal
  modalText: { fontSize: fontSize.sm, marginBottom: spacing.md, textAlign: 'center' },
});