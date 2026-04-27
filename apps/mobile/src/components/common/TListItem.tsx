import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { fontFamily } from '../../theme/typography';

interface TListItemProps {
  title: string;
  subtitle?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  rightText?: string;
  onPress?: () => void;
  showChevron?: boolean;
  style?: ViewStyle;
}

/**
 * Settings-style row used inside grouped cards.  Title in Outfit-semibold,
 * subtitle in Inter, chevron in textTertiary.
 */
export const TListItem: React.FC<TListItemProps> = ({
  title,
  subtitle,
  leftIcon,
  rightIcon,
  rightText,
  onPress,
  showChevron = true,
  style,
}) => {
  const { colors } = useTheme();

  const content = (
    <View style={[styles.container, { borderBottomColor: colors.divider }, style]}>
      {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textTertiary }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.right}>
        {rightText ? (
          <Text style={[styles.rightText, { color: colors.textTertiary }]}>{rightText}</Text>
        ) : null}
        {rightIcon ? <View style={styles.rightIcon}>{rightIcon}</View> : null}
        {showChevron && onPress ? (
          <Text style={[styles.chevron, { color: colors.textTertiary }]}>›</Text>
        ) : null}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} android_ripple={{ color: 'rgba(255,255,255,0.06)' }}>
        {content}
      </Pressable>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    minHeight: 56,
  },
  leftIcon: { marginRight: 12, width: 32, alignItems: 'center' },
  textContainer: { flex: 1, justifyContent: 'center' },
  title: {
    fontFamily: fontFamily.displaySemibold,
    fontSize: 14,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: fontFamily.uiMedium,
    fontSize: 11.5,
    marginTop: 2,
  },
  right: { flexDirection: 'row', alignItems: 'center', marginLeft: 8, gap: 6 },
  rightText: {
    fontFamily: fontFamily.uiSemibold,
    fontSize: 13,
  },
  rightIcon: {},
  chevron: { fontSize: 22, fontWeight: '300' as const },
});
