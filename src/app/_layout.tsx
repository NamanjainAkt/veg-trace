import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors } from '../design-system/colors';
import { AppQueryProvider } from '../query/client';
import { usePreferencesStore } from '../store/usePreferencesStore';
import { useSessionStore } from '../store/useSessionStore';
import '../i18n';

export default function RootLayout() {
  const { t } = useTranslation();

  useEffect(() => {
    usePreferencesStore.getState().hydrate();
    useSessionStore.getState().hydrate();
  }, []);

  return (
    <SafeAreaProvider>
      <AppQueryProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.canvas,
          },
          headerTintColor: colors.ink,
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 17,
          },
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: colors.canvas,
          },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="(auth)/onboarding"
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
          }}
        />
        <Stack.Screen
          name="(auth)/login"
          options={{
            title: t('login.title'),
          }}
        />
        <Stack.Screen
          name="scan/index"
          options={{
            title: t('scan.title'),
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="scan/barcode"
          options={{
            title: t('scan.barcode'),
          }}
        />
        <Stack.Screen
          name="scan/ingredients"
          options={{
            title: t('scan.ingredientLabel'),
          }}
        />
        <Stack.Screen
          name="scan/processing"
          options={{
            title: t('scan.evaluating'),
          }}
        />
        <Stack.Screen
          name="product/[id]"
          options={{
            title: t('product.ingredientAnalysis'),
          }}
        />
        <Stack.Screen
          name="ingredient/[code]"
          options={{
            title: t('ingredient.dualTitle'),
          }}
        />
        <Stack.Screen
          name="verification/[id]"
          options={{
            title: t('verification.title'),
          }}
        />
        <Stack.Screen
          name="settings/index"
          options={{
            title: t('settings.methodologyTitle'),
          }}
        />
        <Stack.Screen
          name="settings/privacy"
          options={{
            title: t('settings.privacy'),
          }}
        />
        <Stack.Screen
          name="settings/about"
          options={{
            title: t('settings.about'),
          }}
        />
      </Stack>
      </AppQueryProvider>
    </SafeAreaProvider>
  );
}
