import React from 'react';
import { Pressable, View } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import {
  Plus,
  Landmark,
  Receipt,
  CalendarClock,
  SlidersHorizontal,
} from 'lucide-react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { useBreakpoint } from '../../src/hooks/useBreakpoint';
import { DesktopSidebar } from '../../src/components/navigation/DesktopSidebar';

export default function TabsLayout() {
  const { theme } = useTheme();
  const { isDesktop } = useBreakpoint();
  const router = useRouter();

  return (
    <View style={{ flex: 1, flexDirection: isDesktop ? 'row' : 'column' }}>
      {/* Sidebar persistente en Desktop */}
      {isDesktop ? <DesktopSidebar /> : null}

      <View style={{ flex: 1, minWidth: 0 }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: theme.primary,
            tabBarInactiveTintColor: theme.textMuted,
            tabBarStyle: isDesktop
              ? { display: 'none' }
              : {
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

        {/* Botón flotante sólo en Mobile; en Desktop está integrado en el Sidebar */}
        {!isDesktop && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Registrar movimiento"
            onPress={() => router.push('/(modals)/registrar' as never)}
            style={{
              position: 'absolute',
              right: 20,
              bottom: 80,
              width: 56,
              height: 56,
              borderRadius: 28,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.primary,
              elevation: 6,
              shadowColor: '#000',
              shadowOpacity: 0.25,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 3 },
            }}
          >
            <Plus size={26} color="#FFFFFF" />
          </Pressable>
        )}
      </View>
    </View>
  );
}
