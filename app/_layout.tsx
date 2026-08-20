import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, StyleSheet, Platform } from 'react-native';

export default function RootLayout() {
  return (
    <SafeAreaProvider style={styles.rootContainer}>
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
