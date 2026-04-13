import React from 'react';
import { Tabs } from 'expo-router';
import { Platform, Text, View, StyleSheet } from 'react-native';
import { useAppColors, useTheme } from '../../src/hooks/useColorScheme';
import { fontSize, fontWeight } from '../../src/theme/spacing';

function TabIcon({ icon, label, focused, color }: { icon: string; label: string; focused: boolean; color: string }) {
  return (
    <View style={styles.tabItem}>
      <Text style={[styles.tabIcon, { opacity: focused ? 1 : 0.5 }]}>{icon}</Text>
      <Text style={[styles.tabLabel, { color, opacity: focused ? 1 : 0.6, fontWeight: focused ? '600' : '400' }]}>
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const colors = useAppColors();
  const { isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isDark ? colors.brand.teal[400] : colors.brand.teal[500],
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
            <TabIcon icon="🏠" label="" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="turniere"
        options={{
          title: 'Turniere',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon="🏆" label="" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="spielen"
        options={{
          title: 'Spielen',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon="🎮" label="" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon="👥" label="" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon="👤" label="" focused={focused} color={color} />
          ),
        }}
      />
      {/* Hide old tabs */}
      <Tabs.Screen name="padel" options={{ href: null }} />
      <Tabs.Screen name="bookings" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 22,
  },
  tabLabel: {
    fontSize: fontSize.xxs,
    marginTop: 2,
  },
});