import React from 'react';
import { Tabs } from 'expo-router';
import { Shield, BookOpen, Users, Clock } from 'lucide-react-native';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = Platform.OS === 'web' ? 16 : Math.max(16, insets.bottom);
  const tabHeight = Platform.OS === 'web' ? 72 : 56 + bottomInset;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#080808',
          borderTopColor: '#2F1517',
          borderTopWidth: 1.5,
          height: tabHeight,
          paddingBottom: bottomInset,
          paddingTop: 8,
          position: 'relative',
        },
        tabBarActiveTintColor: '#EF4444',
        tabBarInactiveTintColor: '#71717A',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
        },
        tabBarItemStyle: {
          minHeight: 48,
          justifyContent: 'center',
          alignItems: 'center',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Monitor',
          tabBarIcon: ({ color, size }) => <Shield size={size || 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="rights"
        options={{
          title: 'Rights',
          tabBarIcon: ({ color, size }) => <BookOpen size={size || 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: 'Contacts',
          tabBarIcon: ({ color, size }) => <Users size={size || 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => <Clock size={size || 22} color={color} />,
        }}
      />
    </Tabs>
  );
}
