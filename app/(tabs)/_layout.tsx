import React from 'react';
import { Tabs } from 'expo-router';
import { Shield, BookOpen, Users, Clock } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0A0A0C',
          borderTopColor: '#1F1F24',
          borderTopWidth: 1,
          height: 68,
          paddingTop: 6,
          paddingBottom: 8,
          position: 'relative',
        },
        tabBarActiveTintColor: '#EF4444',
        tabBarInactiveTintColor: '#71717A',
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 2,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
          marginBottom: 0,
        },
        tabBarIconStyle: {
          marginBottom: 0,
          marginTop: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Monitor',
          tabBarIcon: ({ color }) => <Shield size={21} color={color} />,
        }}
      />
      <Tabs.Screen
        name="rights"
        options={{
          title: 'Rights',
          tabBarIcon: ({ color }) => <BookOpen size={21} color={color} />,
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: 'Contacts',
          tabBarIcon: ({ color }) => <Users size={21} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <Clock size={21} color={color} />,
        }}
      />
    </Tabs>
  );
}
