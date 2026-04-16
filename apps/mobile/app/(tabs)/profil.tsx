import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Switch,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme, type ThemePreference } from '../../src/providers/ThemeProvider';
import { spacing, fontSize, fontWeight, radius, shadow } from '../../src/theme/spacing';
import { membership as membershipColors, type Colors } from '../../src/theme/colors';
import { useAuthStore } from '../../src/store';
import { useRatingStore } from '../../src/store/ratingStore';
import { TRatingBadge } from '../../src/components/common';
import {
  getMyElo,
  getMyReferral,
  getMyAchievements,
  createMyReferralCode,
} from '../../src/api/v2';

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
  colors: Colors;
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
  colors: Colors;
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

// ─── ELO column ──────────────────────────────────────────────
const TIER_COLOR: Record<string, string> = {
  bronze: '#A16207',
  silver: '#94A3B8',
  gold: '#F59E0B',
  platinum: '#38BDF8',
  diamond: '#818CF8',
  elite: '#EC4899',
};
const TIER_LABEL: Record<string, string> = {
  bronze: 'Bronze',
  silver: 'Silber',
  gold: 'Gold',
  platinum: 'Platin',
  diamond: 'Diamant',
  elite: 'Elite',
};

function EloColumn({
  label,
  icon,
  elo,
  peak,
  tier,
  colors,
}: {
  label: string;
  icon: string;
  elo: number;
  peak: number;
  tier: string;
  colors: Colors;
}) {
  const tierColor = TIER_COLOR[tier] || colors.textSecondary;
  return (
    <View style={styles.eloCol}>
      <Text style={styles.eloIcon}>{icon}</Text>
      <Text style={[styles.eloLabel, { color: colors.textTertiary }]}>{label}</Text>
      <Text style={[styles.eloValue, { color: colors.textPrimary }]}>{elo}</Text>
      <View style={[styles.tierPill, { backgroundColor: tierColor + '22', borderColor: tierColor }]}>
        <Text style={[styles.tierPillText, { color: tierColor }]}>{TIER_LABEL[tier] || tier}</Text>
      </View>
      <Text style={[styles.eloPeak, { color: colors.textTertiary }]}>Peak {peak}</Text>
    </View>
  );
}

const ACHIEVEMENT_ICON: Record<string, string> = {
  first_win: '🥇',
  first_tournament: '🎯',
  podium: '🏆',
  veteran: '🎖️',
  streak_3: '🔥',
  streak_5: '⚡',
  streak_10: '💎',
  elo_1000: '📈',
  elo_1200: '🚀',
};

const ACHIEVEMENT_LABEL: Record<string, string> = {
  first_win: 'Erster Sieg',
  first_tournament: 'Erstes Turnier',
  podium: 'Podium',
  veteran: 'Veteran',
  streak_3: '3er Serie',
  streak_5: '5er Serie',
  streak_10: '10er Serie',
  elo_1000: 'Gold erreicht',
  elo_1200: 'Diamant',
};

// ─── Stat Pill ───────────────────────────────────────────────
function StatPill({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: Colors;
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
  const { colors } = useTheme();
  const { preference, setPreference, isDark } = useTheme();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { myRating, fetchMyRating } = useRatingStore();

  // ── V2: ELO / referral / achievements ─────────────
  type EloResp = Awaited<ReturnType<typeof getMyElo>>;
  type ReferralResp = Awaited<ReturnType<typeof getMyReferral>>;
  type AchievementsResp = Awaited<ReturnType<typeof getMyAchievements>>;

  const [elo, setElo] = useState<EloResp | null>(null);
  const [referral, setReferral] = useState<ReferralResp | null>(null);
  const [achievements, setAchievements] = useState<AchievementsResp>([]);
  const [referralBusy, setReferralBusy] = useState(false);

  React.useEffect(() => {
    fetchMyRating();
    (async () => {
      try {
        const [eloRes, refRes, achRes] = await Promise.all([
          getMyElo().catch(() => null),
          getMyReferral().catch(() => null),
          getMyAchievements().catch(() => [] as AchievementsResp),
        ]);
        setElo(eloRes);
        setReferral(refRes);
        setAchievements(achRes);
      } catch {
        // non-fatal
      }
    })();
  }, []);

  const handleShareReferral = async () => {
    let code: string = referral?.code || '';
    if (!code) {
      try {
        setReferralBusy(true);
        const res = await createMyReferralCode();
        code = res.code;
        const finalCode = code;
        setReferral((prev) =>
          prev ? { ...prev, code: finalCode } : { total: 0, rewarded: 0, code: finalCode }
        );
      } catch {
        Alert.alert('Fehler', 'Referral-Code konnte nicht erstellt werden.');
        return;
      } finally {
        setReferralBusy(false);
      }
    }
    try {
      await Share.share({
        message: `Komm zu Tourneo! Nutze meinen Code ${code} bei der Anmeldung. #tourneo`,
      });
    } catch {
      /* silent */
    }
  };

  const displayName = user?.first_name
    ? `${user.first_name} ${user.last_name || ''}`
    : 'Tourneo Spieler';
  const email = user?.email || 'spieler@tourneo.app';
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
              <View style={styles.badgeRow}>
                <View style={[styles.tierBadge, { backgroundColor: tierColor + '18' }]}>
                  <View style={[styles.tierDot, { backgroundColor: tierColor }]} />
                  <Text style={[styles.tierLabel, { color: tierColor }]}>Tourneo {tierLabel}</Text>
                </View>
                {myRating && (
                  <TRatingBadge elo={myRating.elo} tier={myRating.tier} size="sm" />
                )}
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

        {/* V2: ELO card */}
        {elo && (
          <View
            style={[
              styles.eloCard,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <Text style={[styles.eloTitle, { color: colors.textTertiary }]}>SKILL RATING</Text>
            <View style={styles.eloRow}>
              <EloColumn
                label="Padel"
                icon="🎾"
                elo={elo.padel.elo}
                peak={elo.padel.peak}
                tier={elo.padel.tier}
                colors={colors}
              />
              <View style={[styles.eloDivider, { backgroundColor: colors.divider }]} />
              <EloColumn
                label="FIFA"
                icon="🎮"
                elo={elo.fifa.elo}
                peak={elo.fifa.peak}
                tier={elo.fifa.tier}
                colors={colors}
              />
            </View>
            <Text style={[styles.eloMeta, { color: colors.textTertiary }]}>
              {elo.matches_played} Matches gespielt
            </Text>
          </View>
        )}

        {/* V2: Achievements grid */}
        {achievements.length > 0 && (
          <View
            style={[
              styles.achCard,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <Text style={[styles.achTitle, { color: colors.textPrimary }]}>
              🏅 Erfolge ({achievements.length})
            </Text>
            <View style={styles.achGrid}>
              {achievements.slice(0, 8).map((a) => (
                <View
                  key={a.id}
                  style={[
                    styles.achBadge,
                    { backgroundColor: colors.surfaceSecondary, borderColor: colors.cardBorder },
                  ]}
                >
                  <Text style={styles.achIcon}>{ACHIEVEMENT_ICON[a.achievement_type] || '⭐'}</Text>
                  <Text
                    style={[styles.achLabel, { color: colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {ACHIEVEMENT_LABEL[a.achievement_type] || a.achievement_type}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* V2: Referral box */}
        <View
          style={[
            styles.referralCard,
            {
              backgroundColor: colors.cardBg,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <Text style={[styles.referralTitle, { color: colors.textPrimary }]}>
            🎁 Freunde einladen
          </Text>
          <Text style={[styles.referralSub, { color: colors.textSecondary }]}>
            Teile Tourneo mit Freunden und sichere dir Belohnungen für jede erfolgreiche Anmeldung.
          </Text>
          {referral?.code ? (
            <View style={[styles.codeBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.cardBorder }]}>
              <Text style={[styles.codeLabel, { color: colors.textTertiary }]}>Dein Code</Text>
              <Text style={[styles.codeValue, { color: colors.primary }]}>{referral.code}</Text>
            </View>
          ) : null}
          {referral && (
            <View style={styles.referralStats}>
              <View style={styles.referralStat}>
                <Text style={[styles.referralStatValue, { color: colors.textPrimary }]}>
                  {referral.total}
                </Text>
                <Text style={[styles.referralStatLabel, { color: colors.textTertiary }]}>
                  Eingeladen
                </Text>
              </View>
              <View style={styles.referralStat}>
                <Text style={[styles.referralStatValue, { color: colors.textPrimary }]}>
                  {referral.rewarded}
                </Text>
                <Text style={[styles.referralStatLabel, { color: colors.textTertiary }]}>
                  Belohnt
                </Text>
              </View>
            </View>
          )}
          <TouchableOpacity
            onPress={handleShareReferral}
            disabled={referralBusy}
            style={[styles.referralBtn, { backgroundColor: colors.primary, opacity: referralBusy ? 0.6 : 1 }]}
          >
            <Text style={styles.referralBtnText}>
              {referral?.code ? 'Einladung teilen' : 'Code erstellen'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Membership Upsell (if not club) */}
        {memberTier !== 'club' && (
          <TouchableOpacity
            style={[styles.membershipBanner, { backgroundColor: colors.primaryLight }]}
            activeOpacity={0.8}
            onPress={() => router.push('/membership')}
          >
            <View style={styles.membershipContent}>
              <Text style={styles.membershipIcon}>⭐</Text>
              <View style={styles.membershipText}>
                <Text style={[styles.membershipTitle, { color: colors.textPrimary }]}>
                  {memberTier === 'free' ? 'Upgrade auf Tourneo Plus' : 'Upgrade auf Tourneo Club'}
                </Text>
                <Text style={[styles.membershipSubtitle, { color: colors.textSecondary }]}>
                  Mehr Features, exklusive Turniere & Vorteile
                </Text>
              </View>
            </View>
            <Text style={[styles.membershipArrow, { color: colors.primary }]}>→</Text>
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
              subtitle={`Tourneo ${tierLabel}`}
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
        <Text style={[styles.appVersion, { color: colors.textTertiary }]}>Tourneo v1.0.0 · Made with ❤️</Text>

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
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
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

  // V2: ELO card
  eloCard: {
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  eloTitle: {
    fontSize: fontSize.xxs,
    fontWeight: '700' as '700',
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
  },
  eloRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eloCol: { flex: 1, alignItems: 'center' },
  eloDivider: { width: 1, height: 90, marginHorizontal: spacing.sm },
  eloIcon: { fontSize: 28, marginBottom: 2 },
  eloLabel: { fontSize: fontSize.xxs, textTransform: 'uppercase', letterSpacing: 1 },
  eloValue: { fontSize: 28, fontWeight: '800' as '800', marginTop: 2 },
  tierPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
    marginTop: 4,
  },
  tierPillText: { fontSize: fontSize.xxs, fontWeight: '700' as '700' },
  eloPeak: { fontSize: fontSize.xxs, marginTop: 4 },
  eloMeta: { fontSize: fontSize.xs, textAlign: 'center', marginTop: spacing.sm },

  // V2: Achievements card
  achCard: {
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  achTitle: {
    fontSize: fontSize.md,
    fontWeight: '700' as '700',
    marginBottom: spacing.md,
  },
  achGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  achBadge: {
    width: '22%',
    minHeight: 68,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  achIcon: { fontSize: 22 },
  achLabel: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },

  // V2: Referral card
  referralCard: {
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  referralTitle: {
    fontSize: fontSize.md,
    fontWeight: '700' as '700',
  },
  referralSub: {
    fontSize: fontSize.sm,
    marginTop: 4,
    lineHeight: 20,
  },
  codeBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  codeLabel: { fontSize: fontSize.xxs, textTransform: 'uppercase', letterSpacing: 1 },
  codeValue: { fontSize: fontSize.xxl, fontWeight: '800' as '800', marginTop: 2, letterSpacing: 2 },
  referralStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.md,
  },
  referralStat: { alignItems: 'center' },
  referralStatValue: { fontSize: fontSize.xl, fontWeight: '800' as '800' },
  referralStatLabel: { fontSize: fontSize.xxs, marginTop: 2 },
  referralBtn: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  referralBtnText: { color: '#fff', fontSize: fontSize.sm, fontWeight: '700' as '700' },

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