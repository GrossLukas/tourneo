import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { useAppColors } from '../../hooks/useColorScheme';
import { spacing, fontSize, fontWeight } from '../../theme/spacing';

interface THeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  transparent?: boolean;
}

export const THeader: React.FC<THeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightAction,
  transparent = false,
}) => {
  const colors = useAppColors();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: transparent ? 'transparent' : colors.bgSecondary,
          borderBottomColor: transparent ? 'transparent' : colors.border,
          paddingTop: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + spacing.sm,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.left}>
          {showBack && onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={[styles.backArrow, { color: colors.primary as string }]}>‹</Text>
            </TouchableOpacity>
          )}
          <View style={styles.titleContainer}>
            <Text
              style={[styles.title, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {title}
            </Text>
            {subtitle && (
              <Text
                style={[styles.subtitle, { color: colors.textTertiary }]}
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            )}
          </View>
        </View>
        {rightAction && <View style={styles.right}>{rightAction}</View>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    paddingBottom: spacing.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    minHeight: 44,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: spacing.sm,
    padding: spacing.xxs,
  },
  backArrow: {
    fontSize: 32,
    fontWeight: fontWeight.light as any,
    lineHeight: 32,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold as any,
  },
  subtitle: {
    fontSize: fontSize.xs,
    marginTop: 1,
  },
  right: {
    marginLeft: spacing.md,
  },
});