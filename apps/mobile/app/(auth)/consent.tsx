/**
 * ConsentScreen – DSGVO-compliant consent flow.
 * Shows mandatory and optional consent checkboxes before the user can use the app.
 * All mandatory consents must be accepted before proceeding.
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/providers/ThemeProvider';
import { TButton, THeader } from '../../src/components/common';
import { useConsentStore, type ConsentData } from '../../src/store/consentStore';
import { useAuthStore } from '../../src/store/authStore';
import { spacing, fontSize, fontWeight, radius } from '../../src/theme/spacing';

const CONSENT_VERSION = '1.0';

interface CheckboxRowProps {
  checked: boolean;
  onToggle: () => void;
  label: string;
  linkLabel?: string;
  onLink?: () => void;
  required?: boolean;
  colors: ReturnType<typeof useTheme>['colors'];
}

function CheckboxRow({ checked, onToggle, label, linkLabel, onLink, required, colors }: CheckboxRowProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onToggle}
      style={[styles.checkboxRow, { borderColor: colors.cardBorder }]}
    >
      <View style={[
        styles.checkbox,
        { borderColor: checked ? colors.primary : colors.border },
        checked && { backgroundColor: colors.primary },
      ]}>
        {checked && <Ionicons name="checkmark" size={16} color="#FFF" />}
      </View>
      <View style={styles.checkboxContent}>
        <Text style={[styles.checkboxLabel, { color: colors.textPrimary }]}>
          {label}
          {required && <Text style={{ color: colors.error }}> *</Text>}
        </Text>
        {linkLabel && onLink && (
          <TouchableOpacity onPress={onLink}>
            <Text style={[styles.checkboxLink, { color: colors.primary as string }]}>{linkLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function ConsentScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { saveConsent, isLoading } = useConsentStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Mandatory
  const [agb, setAgb] = useState(false);
  const [datenschutz, setDatenschutz] = useState(false);
  const [ageConfirm, setAgeConfirm] = useState(false);

  // Optional
  const [pushNotifications, setPushNotifications] = useState(false);
  const [personalization, setPersonalization] = useState(false);
  const [newsletter, setNewsletter] = useState(false);

  const allMandatory = agb && datenschutz && ageConfirm;

  const handleAcceptAll = () => {
    setAgb(true);
    setDatenschutz(true);
    setAgeConfirm(true);
    setPushNotifications(true);
    setPersonalization(true);
    setNewsletter(true);
  };

  const handleContinue = async () => {
    if (!allMandatory) {
      Alert.alert(t('common.error'), t('consent.mustAcceptMandatory'));
      return;
    }

    const consentData: ConsentData = {
      mandatory: true,
      pushNotifications,
      personalization,
      newsletter,
      consentDate: new Date().toISOString(),
      consentVersion: CONSENT_VERSION,
    };

    try {
      await saveConsent(consentData);
      router.replace(isAuthenticated ? '/(tabs)/home' : '/(auth)/onboarding');
    } catch {
      Alert.alert(t('common.error'), t('common.error'));
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={[styles.logoCircle, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="shield-checkmark" size={40} color={colors.primary} />
          </View>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t('consent.title')}</Text>
        <Text style={[styles.subtitle, { color: colors.textTertiary }]}>{t('consent.subtitle')}</Text>

        {/* Mandatory Section */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          {t('consent.mandatorySection')}
        </Text>

        <CheckboxRow
          checked={agb}
          onToggle={() => setAgb(!agb)}
          label={t('consent.agb')}
          linkLabel={t('legal.agb')}
          onLink={() => router.push('/legal/agb')}
          required
          colors={colors}
        />
        <CheckboxRow
          checked={datenschutz}
          onToggle={() => setDatenschutz(!datenschutz)}
          label={t('consent.datenschutz')}
          linkLabel={t('legal.datenschutz')}
          onLink={() => router.push('/legal/datenschutz')}
          required
          colors={colors}
        />
        <CheckboxRow
          checked={ageConfirm}
          onToggle={() => setAgeConfirm(!ageConfirm)}
          label={t('consent.ageConfirm')}
          required
          colors={colors}
        />

        {/* Optional Section */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: spacing.xl }]}>
          {t('consent.optionalSection')}
        </Text>

        <CheckboxRow
          checked={pushNotifications}
          onToggle={() => setPushNotifications(!pushNotifications)}
          label={t('consent.pushNotifications')}
          colors={colors}
        />
        <CheckboxRow
          checked={personalization}
          onToggle={() => setPersonalization(!personalization)}
          label={t('consent.personalization')}
          colors={colors}
        />
        <CheckboxRow
          checked={newsletter}
          onToggle={() => setNewsletter(!newsletter)}
          label={t('consent.newsletter')}
          colors={colors}
        />

        {/* Actions */}
        <View style={styles.actions}>
          <TButton
            title={t('consent.acceptAll')}
            onPress={handleAcceptAll}
            variant="outline"
            size="lg"
            style={{ marginBottom: spacing.sm }}
          />
          <TButton
            title={t('consent.continue')}
            onPress={handleContinue}
            loading={isLoading}
            size="lg"
            disabled={!allMandatory}
          />
        </View>

        {/* Version info */}
        <Text style={[styles.versionText, { color: colors.textTertiary }]}>
          {t('consent.consentVersion', { version: CONSENT_VERSION })}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingTop: Platform.OS === 'ios' ? 80 : 60, paddingBottom: 40 },
  logoContainer: { alignItems: 'center', marginBottom: spacing.xl },
  logoCircle: { width: 80, height: 80, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold as any, textAlign: 'center', marginBottom: spacing.xs },
  subtitle: { fontSize: fontSize.md, textAlign: 'center', marginBottom: spacing.xxl, lineHeight: 22 },
  sectionTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold as any, marginBottom: spacing.md },
  checkboxRow: {
    flexDirection: 'row', alignItems: 'flex-start', paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  checkbox: {
    width: 24, height: 24, borderRadius: 6, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.md, marginTop: 2,
  },
  checkboxContent: { flex: 1 },
  checkboxLabel: { fontSize: fontSize.sm, lineHeight: 20 },
  checkboxLink: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold as any, marginTop: 4 },
  actions: { marginTop: spacing.xxl },
  versionText: { fontSize: fontSize.xxs, textAlign: 'center', marginTop: spacing.lg },
});
