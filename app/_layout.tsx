import React from 'react';
import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, StyleSheet, Platform } from 'react-native';

export default function RootLayout() {
  return (
    <SafeAreaProvider style={styles.rootContainer}>
      <Head>
        <title>Civic Aegis — Autonomous Roadside Civil Rights Agent</title>
        <meta name="title" content="Civic Aegis — Autonomous Roadside Civil Rights Agent" />
        <meta
          name="description"
          content="Real-time civil rights guidance, ambient audio recording, speech recognition prompter, and attorney defense brief synthesis for roadway traffic stops."
        />

        {/* Apple Touch Icons & iOS Home Screen */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon-precomposed" href="/apple-touch-icon-precomposed.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon.png" />
        <link rel="shortcut icon" href="/favicon.ico" />

        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Civic Aegis" />
        <meta name="theme-color" content="#000000" />
      </Head>

      <StatusBar style="light" />
      <View style={styles.appWrapper}>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: '#080808',
            },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: {
              fontWeight: '800',
              fontSize: 17,
            },
            headerShadowVisible: false,
            contentStyle: {
              backgroundColor: '#000000',
            },
            animation: 'fade',
          }}
        >
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="session/[id]"
            options={{
              title: 'Incident Defense Brief',
              presentation: 'card',
              headerBackTitle: 'Back',
            }}
          />
        </Stack>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#000000',
    ...(Platform.OS === 'web' && {
      minHeight: '100dvh' as any,
      height: '100dvh' as any,
      width: '100%',
    }),
  },
  appWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 480 : undefined,
    alignSelf: 'center',
    backgroundColor: '#000000',
    ...(Platform.OS === 'web' && {
      minHeight: '100dvh' as any,
      height: '100dvh' as any,
      boxShadow: '0 0 50px rgba(239, 68, 68, 0.15)',
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: '#2F1517',
      overflow: 'hidden',
    }),
  },
});
