import React from 'react';
import { Tabs } from 'expo-router';
import {
  Landmark,
  Receipt,
  CalendarClock,
  SlidersHorizontal,
} from 'lucide-react-native';
import { useTheme } from '../../src/context/ThemeContext';

export default function TabsLayout() {
  const { theme } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Patrimonio',
          tabBarIcon: ({ color, size }) => (
            <Landmark size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="historial"
        options={{
          title: 'Libro Diario',
          tabBarIcon: ({ color, size }) => (
            <Receipt size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="resumen"
        options={{
          title: 'Agenda & Caja',
          tabBarIcon: ({ color, size }) => (
            <CalendarClock size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ajustes"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color, size }) => (
            <SlidersHorizontal size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
