/**
 * Tab Layout – Tourneo Main Navigation
 * Uses Ionicons from @expo/vector-icons for consistent cross-platform rendering.
 */
import React from 'react';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/providers/ThemeProvider';
import { useNotificationStore } from '../../src/store/notificationStore';
import { fontSize, fontWeight } from '../../src/theme/spacing';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function TabBarIcon({ name, focused, color }: { name: IoniconsName; focused: boolean; color: string }) {
  return <Ionicons name={name} size={24} color={color} style={{ opacity: focused ? 1 : 0.6 }} />;
}

function TabBarIconWithBadge({ name, focused, color, badge }: { name: IoniconsName; focused: boolean; color: string; badge: number }) {
  return (
    <View>
      <Ionicons name={name} size={24} color={color} style={{ opacity: focused ? 1 : 0.6 }} />
      {badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  const { colors } = useTheme();
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
        },
        tabBarLabelStyle: {
          fontSize: fontSize.xxs,
          fontWeight: fontWeight.medium,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color }) => (
            <TabBarIconWithBadge name={focused ? 'home' : 'home-outline'} focused={focused} color={color} badge={unreadCount} />
          ),
        }}
      />
      <Tabs.Screen
        name="turniere"
        options={{
          title: 'Turniere',
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon name={focused ? 'trophy' : 'trophy-outline'} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="spielen"
        options={{
          title: 'Spielen',
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon name={focused ? 'game-controller' : 'game-controller-outline'} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon name={focused ? 'people' : 'people-outline'} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon name={focused ? 'person' : 'person-outline'} focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    right: -8,
    top: -4,
    backgroundColor: '#DC2626',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
});