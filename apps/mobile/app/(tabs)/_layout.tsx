import React from 'react';
import { Tabs } from 'expo-router';
import { Text, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppColors } from '../../src/hooks/useColorScheme';
import { useNotificationStore } from '../../src/store/notificationStore';
import { fontSize, fontWeight } from '../../src/theme/spacing';

export default function TabLayout() {
  const { t } = useTranslation();
  const colors = useAppColors();
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary[500],
        tabBarInactiveTintColor: colors.neutral[400],
        tabBarStyle: {
          backgroundColor: colors.neutral[50],
          borderTopColor: colors.neutral[200],
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 88 : 64,
        },
        tabBarLabelStyle: {
          fontSize: fontSize.xxs,
          fontWeight: fontWeight.medium as any,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>🏠</Text>,
        }}
      />
      <Tabs.Screen
        name="padel"
        options={{
          title: t('tabs.padel'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>🎾</Text>,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: t('tabs.bookings'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>📋</Text>,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: t('tabs.community'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>👥</Text>,
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>👤</Text>,
        }}
      />
    </Tabs>
  );
}