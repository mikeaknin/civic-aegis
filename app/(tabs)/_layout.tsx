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
          height: 82,
          paddingTop: 8,
          paddingBottom: 22,
          position: 'relative',
        },
        tabBarActiveTintColor: '#EF4444',
        tabBarInactiveTintColor: '#71717A',
        tabBarItemStyle: {
          justifyContent: 'flex-start',
          alignItems: 'center',
          height: 52,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 2,
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
