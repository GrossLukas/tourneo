/**
 * Section header (title + optional "Alle →" action).  Title truncates,
 * action stays on screen (`flexShrink: 0`).
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { fontFamily } from '../../theme/typography';
import { NC } from './tokens';

interface NCSectionProps {
  title: string;
  onAction?: () => void;
  actionLabel?: string;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const NCSection: React.FC<NCSectionProps> = ({
  title,
  onAction,
  actionLabel = 'Alle',
  children,
  style,
}) => {
  return (
    <View style={[styles.section, style]}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          {title}
        </Text>
        {onAction ? (
          <Pressable onPress={onAction} hitSlop={8}>
            <Text style={styles.action}>{actionLabel} →</Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  section: { marginBottom: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  title: {
    flex: 1,
    fontFamily: fontFamily.displayBold,
    fontWeight: '700',
    fontSize: 19,
    letterSpacing: -0.4,
    color: NC.textP,
  },
  action: {
    marginLeft: 12,
    fontFamily: fontFamily.uiSemibold,
    fontWeight: '600',
    fontSize: 13,
    color: NC.primaryLight,
  },
});
