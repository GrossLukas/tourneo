import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform, StatusBar } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { spacing } from '../../theme/spacing';
import { fontFamily } from '../../theme/typography';

interface THeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  transparent?: boolean;
}

/**
 * Night Court header bar — used by detail screens.  62 px top padding for
 * the notch, glass back button (40 px circle), Outfit-bold title.
 */
export const THeader: React.FC<THeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightAction,
  transparent = false,
}) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: transparent ? 'transparent' : colors.bg,
          paddingTop: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight || 0) + spacing.sm,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.left}>
          {showBack && onBack ? (
            <Pressable
              onPress={onBack}
              style={styles.backBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Zurück"
            >
              <Text style={[styles.backArrow, { color: colors.textPrimary }]}>‹</Text>
            </Pressable>
          ) : null}
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>
        {rightAction ? <View style={styles.right}>{rightAction}</View> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingBottom: spacing.sm },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    minHeight: 44,
    gap: 12,
  },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: 'rgba(10,10,20,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 24,
    fontFamily: fontFamily.displayBold,
    fontWeight: '700' as const,
    lineHeight: 26,
    marginTop: -2,
  },
  titleContainer: { flex: 1, minWidth: 0 },
  title: {
    fontFamily: fontFamily.displayExtra,
    fontSize: 22,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: fontFamily.uiMedium,
    fontSize: 12,
    marginTop: 2,
  },
  right: { marginLeft: 12, flexShrink: 0 },
});
