import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BaseContainerTemplate } from '../../src/templates/BaseContainerTemplate';
import {
  Card,
  ListRow,
  SectionHeader,
  SecureButton,
} from '../../src/components/ui';
import { APP_CONFIG } from '../../src/constants/config';
import { useBiometric } from '../../src/context/BiometricContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useCotizacion } from '../../src/hooks/useCotizacion';
import {
  useResetCleanData,
  useRestoreDemoLocal,
} from '../../src/hooks/useCuentas';
import { formatNumberPY } from '../../src/utils/formatters';

export default function AjustesScreen() {
  const router = useRouter();
  const { theme, isDark, toggleTheme } = useTheme();
  const {
    pinEnabled,
    setPinEnabled,
    hasPasskeyLinked,
    webAuthnSupported,
    linkPasskey,
    unlinkPasskey,
    lockApp,
    deviceRemembered,
    forgetDevice,
  } = useBiometric();
  const { data: cotizacion, refetch } = useCotizacion();
  const resetMutation = useResetCleanData();
  const restoreDemoMutation = useRestoreDemoLocal();

  const [bioFeedback, setBioFeedback] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const isGoogleSheetsConnected = Boolean(APP_CONFIG.GAS_URL);

  const handleLinkPasskey = async () => {
    setBioFeedback(null);
    const res = await linkPasskey();
    if (res.ok) {
      setBioFeedback(
        'Face ID / Passkey vinculado correctamente con verificación UV.'
      );
    } else {
      setBioFeedback(res.error || 'No se pudo vincular Face ID.');
    }
  };

  const handleResetClean = async () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    setConfirmReset(false);
    await resetMutation.mutateAsync();
    setBioFeedback('Datos limpiados. Podés cargar tus cuentas reales ahora.');
  };

  return (
    <BaseContainerTemplate
      title="Ajustes & Cuentas"
      subtitle="Cuentas, Google Sheets, Tasa USD/PYG y Acceso Rápido"
      heroLabel="Cotización Vigente USD / PYG (Referencia BCP)"
      heroAmount={cotizacion?.referenciaBCP || 7835}
      heroCurrency="PYG"
      exchangeRateBadge={`Actualizado: ${cotizacion?.fecha || 'Hoy'}`}
      onRefresh={refetch}
      quickActions={[
        {
          id: 'cta',
          label: 'Nueva Cuenta',
          icon: 'Plus',
          onPress: () => router.push('/(modals)/crear-cuenta'),
        },
        {
          id: 'cot',
          label: 'Cambiar Tasa',
          icon: 'Coins',
          onPress: () => router.push('/(modals)/cotizacion'),
        },
        {
          id: 'conciliar',
          label: 'Conciliar',
          icon: 'Scale',
          onPress: () => router.push('/(modals)/ajustar-saldo'),
        },
        {
          id: 'tema',
          label: isDark ? 'Modo Sol' : 'Modo Noche',
          icon: isDark ? 'Sun' : 'Moon',
          onPress: toggleTheme,
        },
      ]}
    >
      <SectionHeader title="Sincronización & Cuentas Propias" />
      <View style={{ gap: 10 }}>
        <ListRow
          icon={isGoogleSheetsConnected ? 'CheckCircle2' : 'FileText'}
          tone={isGoogleSheetsConnected ? 'primary' : 'gold'}
          title={
            isGoogleSheetsConnected
              ? 'Conectado a Google Sheets'
              : 'Modo Local Offline (Demo)'
          }
          subtitle={
            isGoogleSheetsConnected
              ? 'Sincronizando directo contra tu Web App de Apps Script (.env).'
              : 'Pegá tu URL /exec en .env (EXPO_PUBLIC_GAS_URL) para sincronizar con Sheets.'
          }
        />
        <ListRow
          icon="Landmark"
          tone="primary"
          title="Agregar Cuenta Bancaria, Efectivo o Tarjeta"
          subtitle="Creá cuentas separadas para Negocio (Maní) y Personal"
          onPress={() => router.push('/(modals)/crear-cuenta')}
        />
        <ListRow
          icon="Scale"
          tone="primary"
          title="Conciliar Saldo Real de Cuenta"
          subtitle="Ajustar saldo real según extracto bancario o arqueo de caja"
          onPress={() => router.push('/(modals)/ajustar-saldo')}
        />
        <ListRow
          icon="Coins"
          tone="gold"
          title={`Compra: Gs. ${formatNumberPY(
            cotizacion?.compraPYG || 7810
          )} · Venta: Gs. ${formatNumberPY(cotizacion?.ventaPYG || 7860)}`}
          subtitle={`Referencia Contable: Gs. ${formatNumberPY(
            cotizacion?.referenciaBCP || 7835
          )} (${cotizacion?.fecha || '-'})`}
          onPress={() => router.push('/(modals)/cotizacion')}
        />
      </View>

      <SectionHeader title="Seguridad y Carga Rápida" />
      <Card style={{ gap: 12 }}>
        <ListRow
          icon="Lock"
          tone={pinEnabled ? 'primary' : 'neutral'}
          title={
            pinEnabled
              ? 'Bloqueo con PIN al Abrir Activo'
              : 'Acceso Directo Sin PIN (Carga Rápida)'
          }
          subtitle={
            pinEnabled
              ? 'Pide PIN de 6 dígitos o Face ID al iniciar la app.'
              : 'Abre directo sin pedir PIN para anotar gastos al instante.'
          }
          actionLabel={pinEnabled ? 'Desactivar' : 'Activar'}
          actionTone={pinEnabled ? 'gold' : 'primary'}
          onActionPress={() => setPinEnabled(!pinEnabled)}
        />

        <ListRow
          icon="Fingerprint"
          tone="primary"
          title={
            hasPasskeyLinked
              ? 'Face ID / Passkey Activo'
              : 'Face ID / Passkey No Vinculado'
          }
          subtitle={
            webAuthnSupported
              ? 'Autenticador biométrico de plataforma detectado'
              : 'Usá tu PIN de 6 dígitos para desbloquear'
          }
        />

        {deviceRemembered ? (
          <ListRow
            icon="Lock"
            tone="gold"
            title="Dispositivo recordado"
            subtitle="No se pide PIN al abrir. Se olvida solo a los 30 días o al bloquear."
            actionLabel="Olvidar"
            actionTone="gold"
            onActionPress={forgetDevice}
          />
        ) : null}

        {bioFeedback ? (
          <Text style={[styles.feedbackText, { color: theme.primary }]}>
            {bioFeedback}
          </Text>
        ) : null}

        <View style={styles.btnRow}>
          {!hasPasskeyLinked ? (
            <SecureButton
              label="Vincular Face ID / Touch ID (WebAuthn)"
              onPress={handleLinkPasskey}
              icon="Fingerprint"
            />
          ) : (
            <SecureButton
              label="Desvincular Passkey de este Dispositivo"
              onPress={unlinkPasskey}
              variant="danger"
            />
          )}
          <SecureButton
            label="Bloquear Bóveda Ahora"
            onPress={lockApp}
            variant="secondary"
            icon="Lock"
          />
        </View>
      </Card>

      <SectionHeader title="Gestión de Datos Iniciales" />
      <Card style={{ gap: 10 }}>
        <SecureButton
          label={
            confirmReset
              ? 'Tocar otra vez para confirmar borrado completo'
              : 'Empezar de Cero (Limpiar Cuentas y Movimientos)'
          }
          onPress={handleResetClean}
          variant="danger"
          disabled={resetMutation.isPending}
          icon="Trash2"
        />
        {!isGoogleSheetsConnected ? (
          <SecureButton
            label="Restaurar Datos Demo de Dani (Maní + Personal)"
            onPress={() => restoreDemoMutation.mutateAsync()}
            variant="secondary"
            disabled={restoreDemoMutation.isPending}
            icon="RefreshCw"
          />
        ) : null}
      </Card>
    </BaseContainerTemplate>
  );
}

const styles = StyleSheet.create({
  feedbackText: {
    fontSize: 12,
    fontWeight: '700',
  },
  btnRow: {
    gap: 10,
  },
});
