import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';

// ============================================
// TOURNEO - Skeleton Loading Component
// Shimmer effect for premium loading states
// ============================================

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function TSkeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const { colors } = useTheme();
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: 'rgba(255,255,255,0.06)',
          opacity,
        },
        style,
      ]}
    />
  );
}

// Pre-built skeleton layouts
export function SkeletonCard() {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
      <TSkeleton width="100%" height={140} borderRadius={12} />
      <View style={styles.cardContent}>
        <TSkeleton width="70%" height={18} style={{ marginBottom: 8 }} />
        <TSkeleton width="50%" height={14} style={{ marginBottom: 12 }} />
        <View style={styles.cardRow}>
          <TSkeleton width={80} height={12} />
          <TSkeleton width={60} height={12} />
        </View>
      </View>
    </View>
  );
}

export function SkeletonEventCard() {
  const { colors } = useTheme();
  return (
    <View style={[styles.eventCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
      <TSkeleton width={80} height={80} borderRadius={12} />
      <View style={styles.eventCardContent}>
        <TSkeleton width="80%" height={16} style={{ marginBottom: 6 }} />
        <TSkeleton width="60%" height={13} style={{ marginBottom: 8 }} />
        <View style={styles.cardRow}>
          <TSkeleton width={70} height={12} />
          <TSkeleton width={50} height={24} borderRadius={12} />
        </View>
      </View>
    </View>
  );
}

export function SkeletonProfileCard() {
  const { colors } = useTheme();
  return (
    <View style={[styles.profileCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
      <TSkeleton width={72} height={72} borderRadius={36} />
      <View style={{ marginTop: 12, alignItems: 'center' }}>
        <TSkeleton width={120} height={18} style={{ marginBottom: 6 }} />
        <TSkeleton width={160} height={13} style={{ marginBottom: 12 }} />
        <View style={styles.cardRow}>
          <TSkeleton width={60} height={40} borderRadius={10} />
          <TSkeleton width={60} height={40} borderRadius={10} />
          <TSkeleton width={60} height={40} borderRadius={10} />
        </View>
      </View>
    </View>
  );
}

export function SkeletonListItem() {
  return (
    <View style={styles.listItem}>
      <TSkeleton width={44} height={44} borderRadius={22} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <TSkeleton width="70%" height={15} style={{ marginBottom: 6 }} />
        <TSkeleton width="40%" height={12} />
      </View>
    </View>
  );
}

export function SkeletonHomeScreen() {
  return (
    <View style={styles.homeScreen}>
      {/* Hero */}
      <TSkeleton width="100%" height={180} borderRadius={16} style={{ marginBottom: 20 }} />
      {/* Stats row */}
      <View style={[styles.cardRow, { marginBottom: 20 }]}>
        <TSkeleton width="30%" height={70} borderRadius={12} />
        <TSkeleton width="30%" height={70} borderRadius={12} />
        <TSkeleton width="30%" height={70} borderRadius={12} />
      </View>
      {/* Section title */}
      <TSkeleton width={140} height={18} style={{ marginBottom: 12 }} />
      {/* Event cards */}
      <SkeletonEventCard />
      <View style={{ height: 12 }} />
      <SkeletonEventCard />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
  },
  cardContent: {
    padding: 14,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  eventCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  eventCardContent: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  profileCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  homeScreen: {
    padding: 20,
  },
});