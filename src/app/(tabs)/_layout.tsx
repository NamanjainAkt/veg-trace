import React from 'react';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Home, History, User } from 'lucide-react-native';
import { colors } from '../../design-system/colors';

export default function TabLayout() {
  const { t } = useTranslation();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.canvas,
          borderTopColor: colors.hairlineSoft,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: colors.canvas,
        },
        headerTintColor: colors.ink,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t('tabs.explore'),
          headerTitle: t('tabs.vegtrace'),
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t('tabs.history'),
          headerTitle: t('tabs.scanHistory'),
          tabBarIcon: ({ color, size }) => <History size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          headerTitle: t('tabs.dietPrefs'),
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
