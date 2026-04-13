import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { useAppColors } from '../../hooks/useColorScheme';
import { spacing, fontSize, fontWeight } from '../../theme/spacing';

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
  const colors = useAppColors();

  const content = (
    <View style={[styles.container, { borderBottomColor: colors.divider }, style]}>
      {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: colors.textTertiary }]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      <View style={styles.right}>
        {rightText && (
          <Text style={[styles.rightText, { color: colors.textTertiary }]}>{rightText}</Text>
        )}
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
        {showChevron && onPress && (
          <Text style={[styles.chevron, { color: colors.textTertiary }]}>›</Text>
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.6}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 52,
  },
  leftIcon: {
    marginRight: spacing.md,
    width: 32,
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium as any,
  },
  subtitle: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  rightText: {
    fontSize: fontSize.sm,
    marginRight: spacing.xs,
  },
  rightIcon: {
    marginRight: spacing.xs,
  },
  chevron: {
    fontSize: 22,
    fontWeight: fontWeight.light as any,
  },
});