import React from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../src/context/ThemeContext';
import { PrivacyProvider } from '../src/context/PrivacyContext';
import { BiometricProvider } from '../src/context/BiometricContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 3,
      retry: 1,
    },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <PrivacyProvider>
          <BiometricProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="(modals)/registrar"
                options={{ presentation: 'modal' }}
              />
              <Stack.Screen
                name="(modals)/liquidar"
                options={{ presentation: 'modal' }}
              />
              <Stack.Screen
                name="(modals)/crear-cuenta"
                options={{ presentation: 'modal' }}
              />
              <Stack.Screen
                name="(modals)/accion-rapida"
                options={{ presentation: 'modal' }}
              />
              <Stack.Screen
                name="(modals)/transferir"
                options={{ presentation: 'modal' }}
              />
              <Stack.Screen
                name="(modals)/pagar-tarjeta"
                options={{ presentation: 'modal' }}
              />
              <Stack.Screen
                name="(modals)/ajustar-saldo"
                options={{ presentation: 'modal' }}
              />
              <Stack.Screen
                name="(modals)/cotizacion"
                options={{ presentation: 'modal' }}
              />
              <Stack.Screen
                name="(modals)/comprobante"
                options={{ presentation: 'modal' }}
              />
            </Stack>
          </BiometricProvider>
        </PrivacyProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
