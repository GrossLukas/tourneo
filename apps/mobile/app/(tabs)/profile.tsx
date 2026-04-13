import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppColors } from '../../src/hooks/useColorScheme';
import {
  TCard, TBadge, TAvatar, TListItem, TDivider, TButton,
} from '../../src/components/common';
import { useAuthStore } from '../../src/store/authStore';
import { useMembershipStore } from '../../src/store/membershipStore';
import { useRegistrationStore } from '../../src/store/registrationStore';
import { spacing, fontSize, fontWeight } from '../../src/theme/spacing';

export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useAppColors();
  const { user, logout } = useAuthStore();
  const { currentMembership, fetchCurrentMembership } = useMembershipStore();
  const { myRegistrations } = useRegistrationStore();

  useEffect(() => {
    if (user) fetchCurrentMembership();
  }, [user]);

  const handleLogout = () => {
    Alert.alert('Abmelden', 'Möchtest du dich wirklich abmelden?', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Abmelden',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/onboarding');
        },
      },
    ]);
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bgTertiary }]}>
        <View style={[styles.header, { backgroundColor: colors.bgSecondary, borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Profil</Text>
        </View>
        <View style={styles.guestContainer}>
          <Text style={styles.guestIcon}>👤</Text>
          <Text style={[styles.guestTitle, { color: colors.textPrimary }]}>
            Willkommen bei Turneo
          </Text>
          <Text style={[styles.guestText, { color: colors.textSecondary }]}>
            Melde dich an, um dein Profil zu verwalten und alle Funktionen zu nutzen.
          </Text>
          <TButton
            title="Anmelden"
            onPress={() => router.push('/(auth)/login')}
            size="lg"
            style={{ marginTop: spacing.lg }}
          />
          <TButton
            title="Registrieren"
            onPress={() => router.push('/(auth)/register')}
            variant="outline"
            size="lg"
            style={{ marginTop: spacing.sm }}
          />
        </View>
      </View>
    );
  }

  const totalTournaments = myRegistrations.filter((r) => r.status !== 'cancelled').length;
  const tierLabel = currentMembership?.tier === 'club' ? 'Club' : currentMembership?.tier === 'plus' ? 'Plus' : 'Free';

  return (
    <View style={[styles.container, { backgroundColor: colors.bgTertiary }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={[styles.profileHeader, { backgroundColor: (colors.primary as string) }]}>
          <TAvatar
            uri={user.avatar_url}
            name={user.display_name}
            size="xl"
            membershipTier={currentMembership?.tier}
          />
          <Text style={styles.displayName}>{user.display_name}</Text>
          {user.first_name && user.last_name && (
            <Text style={styles.realName}>{user.first_name} {user.last_name}</Text>
          )}
          <View style={styles.membershipRow}>
            <TBadge
              label={tierLabel}
              variant="membership"
              membershipTier={currentMembership?.tier || 'free'}
              size="md"
            />
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{totalTournaments}</Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Turniere</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>0</Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Siege</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{tierLabel}</Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Mitglied</Text>
          </View>
        </View>

        {/* Menu Sections */}
        <TCard variant="default" style={styles.menuCard}>
          <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>Konto</Text>
          <TListItem
            title="Profil bearbeiten"
            leftIcon={<Text style={styles.menuIcon}>✏️</Text>}
            onPress={() => router.push('/settings')}
          />
          <TListItem
            title="Mitgliedschaft"
            leftIcon={<Text style={styles.menuIcon}>⭐</Text>}
            rightText={tierLabel}
            onPress={() => router.push('/membership')}
          />
          <TListItem
            title="Benachrichtigungen"
            leftIcon={<Text style={styles.menuIcon}>🔔</Text>}
            onPress={() => router.push('/settings')}
          />
          <TListItem
            title="Sprache"
            leftIcon={<Text style={styles.menuIcon}>🌐</Text>}
            rightText="Deutsch"
            onPress={() => {}}
            showChevron={false}
          />
        </TCard>

        <TCard variant="default" style={styles.menuCard}>
          <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>Support & Rechtliches</Text>
          <TListItem
            title="Hilfe & Support"
            leftIcon={<Text style={styles.menuIcon}>💬</Text>}
            onPress={() => router.push('/support')}
          />
          <TListItem
            title="AGB"
            leftIcon={<Text style={styles.menuIcon}>📄</Text>}
            onPress={() => router.push('/legal/terms')}
          />
          <TListItem
            title="Datenschutz"
            leftIcon={<Text style={styles.menuIcon}>🔒</Text>}
            onPress={() => router.push('/legal/privacy')}
          />
          <TListItem
            title="Impressum"
            leftIcon={<Text style={styles.menuIcon}>ℹ️</Text>}
            onPress={() => router.push('/legal/imprint')}
          />
        </TCard>

        <View style={styles.logoutSection}>
          <TButton
            title="Abmelden"
            onPress={handleLogout}
            variant="outline"
            size="lg"
          />
          <Text style={[styles.versionText, { color: colors.textTertiary }]}>
            Turneo v1.0.0 (Build 1)
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold as any },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  guestIcon: { fontSize: 64, marginBottom: spacing.md },
  guestTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold as any, marginBottom: spacing.sm },
  guestText: { fontSize: fontSize.md, textAlign: 'center', lineHeight: 22 },
  profileHeader: {
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingBottom: spacing.xl,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  displayName: {
    color: '#FFFFFF',
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold as any,
    marginTop: spacing.md,
  },
  realName: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  membershipRow: {
    marginTop: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginTop: -20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: fontSize.xl, fontWeight: fontWeight.bold as any },
  statLabel: { fontSize: fontSize.xs, marginTop: 2 },
  statDivider: { width: 1, marginVertical: spacing.xs },
  menuCard: { marginHorizontal: spacing.md, marginTop: spacing.md },
  menuTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold as any, marginBottom: spacing.xs, paddingHorizontal: spacing.md, paddingTop: spacing.xs },
  menuIcon: { fontSize: 20 },
  logoutSection: {
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: 30,
  },
  versionText: {
    fontSize: fontSize.xs,
    marginTop: spacing.md,
  },
});