import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppColors } from '../../src/hooks/useColorScheme';
import { useTheme, type ThemePreference } from '../../src/providers/ThemeProvider';
import { spacing, fontSize, fontWeight, radius, shadow } from '../../src/theme/spacing';
import { membership as membershipColors } from '../../src/theme/colors';
import { useAuthStore } from '../../src/store';

// ─── Section Item ────────────────────────────────────────────
function SectionItem({
  icon,
  title,
  subtitle,
  onPress,
  colors,
  trailing,
  danger,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  colors: ReturnType<typeof useAppColors>;
  trailing?: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.sectionItem, { borderBottomColor: colors.divider }]}
      activeOpacity={onPress ? 0.6 : 1}
      onPress={onPress}
    >
      <View style={[styles.sectionItemIcon, { backgroundColor: danger ? colors.errorBg : colors.surfaceSecondary }]}>
        <Text style={styles.sectionItemIconText}>{icon}</Text>
      </View>
      <View style={styles.sectionItemContent}>
        <Text style={[styles.sectionItemTitle, { color: danger ? colors.error : colors.textPrimary }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.sectionItemSubtitle, { color: colors.textTertiary }]}>{subtitle}</Text>
        )}
      </View>
      {trailing || (
        <Text style={[styles.sectionItemArrow, { color: colors.textTertiary }]}>›</Text>
      )}
    </TouchableOpacity>
  );
}

// ─── Theme Picker ────────────────────────────────────────────
function ThemePicker({
  colors,
  preference,
  onSelect,
}: {
  colors: ReturnType<typeof useAppColors>;
  preference: ThemePreference;
  onSelect: (pref: ThemePreference) => void;
}) {
  const options: { key: ThemePreference; label: string; icon: string }[] = [
    { key: 'system', label: 'System', icon: '📱' },
    { key: 'light', label: 'Hell', icon: '☀️' },
    { key: 'dark', label: 'Dunkel', icon: '🌙' },
  ];

  return (
    <View style={styles.themePicker}>
      {options.map((opt) => {
        const isActive = preference === opt.key;
        return (
          <TouchableOpacity
            key={opt.key}
            style={[
              styles.themeOption,
              {
                backgroundColor: isActive ? colors.primaryLight : colors.surfaceSecondary,
                borderColor: isActive ? colors.primary : colors.cardBorder,
              },
            ]}
            activeOpacity={0.7}
            onPress={() => onSelect(opt.key)}
          >
            <Text style={styles.themeOptionIcon}>{opt.icon}</Text>
            <Text
              style={[
                styles.themeOptionLabel,
                { color: isActive ? colors.primary : colors.textSecondary },
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Stat Pill ───────────────────────────────────────────────
function StatPill({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useAppColors>;
}) {
  return (
    <View style={[styles.statPill, { backgroundColor: colors.surfaceSecondary }]}>
      <Text style={[styles.statValue, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{label}</Text>
    </View>
  );
}

// ─── Main Profil Screen ──────────────────────────────────────
export default function ProfilScreen() {
  const colors = useAppColors();
  const { preference, setPreference, isDark } = useTheme();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const displayName = user?.first_name
    ? `${user.first_name} ${user.last_name || ''}`
    : 'Turneo Spieler';
  const email = user?.email || 'spieler@turneo.app';
  const memberTier = (user as any)?.membership_tier || 'free';
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const tierColor =
    memberTier === 'club'
      ? membershipColors.club
      : memberTier === 'plus'
      ? membershipColors.plus
      : membershipColors.free;

  const tierLabel =
    memberTier === 'club' ? 'Club' : memberTier === 'plus' ? 'Plus' : 'Free';

  const handleLogout = () => {
    Alert.alert('Abmelden', 'Möchtest du dich wirklich abmelden?', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Abmelden',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Profil</Text>
        </View>

        {/* Profile Card */}
        <View
          style={[
            styles.profileCard,
            {
              backgroundColor: colors.cardBg,
              borderColor: colors.cardBorder,
              shadowColor: colors.shadowColor,
              shadowOpacity: colors.cardShadowOpacity,
            },
          ]}
        >
          <View style={styles.profileTop}>
            <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>{initials}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.textPrimary }]}>{displayName}</Text>
              <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{email}</Text>
              <View style={[styles.tierBadge, { backgroundColor: tierColor + '18' }]}>
                <View style={[styles.tierDot, { backgroundColor: tierColor }]} />
                <Text style={[styles.tierLabel, { color: tierColor }]}>Turneo {tierLabel}</Text>
              </View>
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <StatPill label="Turniere" value="12" colors={colors} />
            <StatPill label="Siege" value="5" colors={colors} />
            <StatPill label="Punkte" value="840" colors={colors} />
            <StatPill label="Platz" value="#23" colors={colors} />
          </View>
        </View>

        {/* Membership Upsell (if not club) */}
        {memberTier !== 'club' && (
          <TouchableOpacity
            style={[styles.membershipBanner, { backgroundColor: isDark ? '#2D1B69' : '#EDE9FE' }]}
            activeOpacity={0.8}
            onPress={() => router.push('/membership')}
          >
            <View style={styles.membershipContent}>
              <Text style={styles.membershipIcon}>⭐</Text>
              <View style={styles.membershipText}>
                <Text style={[styles.membershipTitle, { color: isDark ? '#DDD6FE' : '#5B21B6' }]}>
                  {memberTier === 'free' ? 'Upgrade auf Turneo Plus' : 'Upgrade auf Turneo Club'}
                </Text>
                <Text style={[styles.membershipSubtitle, { color: isDark ? '#C4B5FD' : '#7C3AED' }]}>
                  Mehr Features, exklusive Turniere & Vorteile
                </Text>
              </View>
            </View>
            <Text style={[styles.membershipArrow, { color: isDark ? '#C4B5FD' : '#7C3AED' }]}>→</Text>
          </TouchableOpacity>
        )}

        {/* Appearance Section */}
        <View style={styles.sectionGroup}>
          <Text style={[styles.sectionGroupTitle, { color: colors.textTertiary }]}>DARSTELLUNG</Text>
          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
                shadowColor: colors.shadowColor,
                shadowOpacity: colors.cardShadowOpacity,
              },
            ]}
          >
            <Text style={[styles.themeLabel, { color: colors.textPrimary }]}>Erscheinungsbild</Text>
            <ThemePicker colors={colors} preference={preference} onSelect={setPreference} />
          </View>
        </View>

        {/* Activity Section */}
        <View style={styles.sectionGroup}>
          <Text style={[styles.sectionGroupTitle, { color: colors.textTertiary }]}>AKTIVITÄT</Text>
          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
                shadowColor: colors.shadowColor,
                shadowOpacity: colors.cardShadowOpacity,
              },
            ]}
          >
            <SectionItem
              icon="📋"
              title="Meine Buchungen"
              subtitle="Vergangene & aktuelle Buchungen"
              colors={colors}
              onPress={() => router.push('/(tabs)/bookings')}
            />
            <SectionItem
              icon="📅"
              title="Mein Kalender"
              subtitle="Termine & Turnierplan"
              colors={colors}
              onPress={() => {}}
            />
            <SectionItem
              icon="🏆"
              title="Turnier-Verlauf"
              subtitle="Ergebnisse & Statistiken"
              colors={colors}
              onPress={() => {}}
            />
            <SectionItem
              icon="👥"
              title="Meine Teams"
              subtitle="Teamverwaltung & Einladungen"
              colors={colors}
              onPress={() => router.push('/(tabs)/community')}
            />
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.sectionGroup}>
          <Text style={[styles.sectionGroupTitle, { color: colors.textTertiary }]}>KONTO</Text>
          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
                shadowColor: colors.shadowColor,
                shadowOpacity: colors.cardShadowOpacity,
              },
            ]}
          >
            <SectionItem
              icon="💳"
              title="Mitgliedschaft"
              subtitle={`Turneo ${tierLabel}`}
              colors={colors}
              onPress={() => router.push('/membership')}
            />
            <SectionItem
              icon="⚙️"
              title="Einstellungen"
              subtitle="Benachrichtigungen, Datenschutz & mehr"
              colors={colors}
              onPress={() => router.push('/settings')}
            />
            <SectionItem
              icon="❓"
              title="Hilfe & Support"
              colors={colors}
              onPress={() => router.push('/support')}
            />
            <SectionItem
              icon="📜"
              title="Rechtliches"
              subtitle="AGB, Datenschutz, Impressum"
              colors={colors}
              onPress={() => router.push('/legal/privacy')}
            />
          </View>
        </View>

        {/* Logout */}
        <View style={styles.sectionGroup}>
          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
                shadowColor: colors.shadowColor,
                shadowOpacity: colors.cardShadowOpacity,
              },
            ]}
          >
            <SectionItem
              icon="🚪"
              title="Abmelden"
              colors={colors}
              onPress={handleLogout}
              danger
            />
          </View>
        </View>

        {/* App Version */}
        <Text style={[styles.appVersion, { color: colors.textTertiary }]}>Turneo v1.0.0 · Made with ❤️</Text>

        {/* Bottom spacer for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },

  // Header
  header: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700' as '700',
    letterSpacing: -0.5,
  },

  // Profile Card
  profileCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    marginTop: spacing.md,
    ...shadow.md,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700' as '700',
  },
  profileInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  profileName: {
    fontSize: fontSize.lg,
    fontWeight: '700' as '700',
    letterSpacing: -0.3,
  },
  profileEmail: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    marginTop: spacing.xs,
    gap: 6,
  },
  tierDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tierLabel: {
    fontSize: fontSize.xs,
    fontWeight: '600' as '600',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  statPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: '700' as '700',
  },
  statLabel: {
    fontSize: fontSize.xxs,
    marginTop: 2,
  },

  // Membership Banner
  membershipBanner: {
    marginTop: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  membershipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  membershipIcon: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  membershipText: {
    flex: 1,
  },
  membershipTitle: {
    fontSize: fontSize.md,
    fontWeight: '600' as '600',
  },
  membershipSubtitle: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  membershipArrow: {
    fontSize: 20,
    fontWeight: '600' as '600',
  },

  // Section Groups
  sectionGroup: {
    marginTop: spacing.xl,
  },
  sectionGroupTitle: {
    fontSize: fontSize.xs,
    fontWeight: '600' as '600',
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  sectionCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...shadow.sm,
  },

  // Section Item
  sectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionItemIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionItemIconText: {
    fontSize: 18,
  },
  sectionItemContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  sectionItemTitle: {
    fontSize: fontSize.md,
    fontWeight: '500' as '500',
  },
  sectionItemSubtitle: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  sectionItemArrow: {
    fontSize: 22,
    fontWeight: '300' as '300',
    marginLeft: spacing.sm,
  },

  // Theme Picker
  themeLabel: {
    fontSize: fontSize.md,
    fontWeight: '500' as '500',
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  themePicker: {
    flexDirection: 'row',
    padding: spacing.md,
    paddingTop: 0,
    gap: spacing.sm,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    gap: 6,
  },
  themeOptionIcon: {
    fontSize: 24,
  },
  themeOptionLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600' as '600',
  },

  // App Version
  appVersion: {
    textAlign: 'center',
    fontSize: fontSize.xs,
    marginTop: spacing.xl,
    paddingBottom: spacing.md,
  },
});