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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppColors } from '../../src/hooks/useColorScheme';
import { TButton, TInput, THeader } from '../../src/components/common';
import { useAuthStore } from '../../src/store/authStore';
import { spacing, fontSize, fontWeight } from '../../src/theme/spacing';

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useAppColors();
  const { login, isLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

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
    } catch (error: any) {
      Alert.alert(
        t('common.error'),
        error.message || t('auth.loginFailed'),
        [{ text: t('common.ok') }]
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgSecondary }]}>
      <THeader
        title={t('auth.login')}
        showBack
        onBack={() => router.back()}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.welcome, { color: colors.textPrimary }]}>
            {t('auth.welcomeBack')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textTertiary }]}>
            {t('auth.loginSubtitle')}
          </Text>

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
                <Text style={{ color: colors.textTertiary, fontSize: 16 }}>
                  {showPassword ? '🙈' : '👁'}
                </Text>
              }
              onRightIconPress={() => setShowPassword(!showPassword)}
              required
            />

            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password')}
              style={styles.forgotPassword}
            >
              <Text style={[styles.forgotPasswordText, { color: (colors.primary as string) }]}>
                {t('auth.forgotPassword')}
              </Text>
            </TouchableOpacity>

            <TButton
              title={t('auth.login')}
              onPress={handleLogin}
              loading={isLoading}
              size="lg"
            />
          </View>

          <View style={styles.dividerContainer}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textTertiary }]}>
              {t('auth.or')}
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          <TButton
            title={t('auth.continueWithApple')}
            onPress={() => {
              Alert.alert('Apple Sign-In', 'Apple Sign-In wird in der Produktionsversion verfügbar sein.');
            }}
            variant="secondary"
            icon={<Text style={{ fontSize: 18 }}>🍎</Text>}
            size="lg"
          />

          <View style={styles.registerLink}>
            <Text style={[styles.registerText, { color: colors.textSecondary }]}>
              {t('auth.noAccount')}{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={[styles.registerLinkText, { color: (colors.primary as string) }]}>
                {t('auth.registerNow')}
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
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  welcome: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold as any,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.md,
    marginBottom: spacing.xl,
  },
  form: {
    marginBottom: spacing.lg,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg,
    marginTop: -spacing.sm,
  },
  forgotPasswordText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium as any,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerText: {
    marginHorizontal: spacing.md,
    fontSize: fontSize.sm,
  },
  registerLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  registerText: {
    fontSize: fontSize.sm,
  },
  registerLinkText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold as any,
  },
});