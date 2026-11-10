import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SecureFormTemplate } from '../../src/templates/SecureFormTemplate';
import {
  Chip,
  EmptyState,
  SectionHeader,
  SecureButton,
} from '../../src/components/ui';
import { useTheme } from '../../src/context/ThemeContext';
import {
  useCambiarEstadoCheque,
  useLiquidarCheque,
} from '../../src/hooks/useCheques';
import { useCotizacion } from '../../src/hooks/useCotizacion';
import { useCuentas } from '../../src/hooks/useCuentas';
import { usePagarCuota } from '../../src/hooks/usePrestamos';
import { CurrencyCode } from '../../src/types/domain';
import { isTarjetaCuenta } from '../../src/utils/accounts';
import {
  getTodayDDMMYYYY,
  getYesterdayDDMMYYYY,
  isValidDDMMYYYY,
} from '../../src/utils/dates';
import { formatMoney } from '../../src/utils/formatters';

export default function LiquidarVencimientoModal() {
  const router = useRouter();
  const { theme } = useTheme();
  const params = useLocalSearchParams<{
    tipo?: 'CHEQUE' | 'CUOTA';
    chequeId?: string;
    prestamoId?: string;
    cuotaId?: string;
    titulo?: string;
    monto?: string;
    moneda?: CurrencyCode;
    direccion?: 'INGRESO' | 'EGRESO';
    cuentaSugeridaId?: string;
    ambito?: string;
  }>();

  const { data: cuentas } = useCuentas();
  const { data: cotizacion } = useCotizacion();
  const liquidarChequeMutation = useLiquidarCheque();
  const cambiarEstadoChequeMutation = useCambiarEstadoCheque();
  const pagarCuotaMutation = usePagarCuota();

  const isCheque = params.tipo === 'CHEQUE' || Boolean(params.chequeId);
  const isIncome = params.direccion === 'INGRESO';
  const monto = parseFloat(params.monto || '0') || 0;
  const moneda: CurrencyCode = params.moneda === 'USD' ? 'USD' : 'PYG';
  const tasa = cotizacion?.referenciaBCP || 7835;

  const [fechaReal, setFechaReal] = useState(getTodayDDMMYYYY());
  const [cuentaId, setCuentaId] = useState(params.cuentaSugeridaId || '');

  const cuentasDisponibles = useMemo(() => {
    const all = cuentas || [];
    if (isIncome || isCheque) {
      return all.filter((c) => !isTarjetaCuenta(c.tipo));
    }
    return all;
  }, [cuentas, isIncome, isCheque]);

  useEffect(() => {
    if (cuentasDisponibles.length === 0) return;
    const valid = cuentasDisponibles.some((c) => c.id === cuentaId);
    if (!valid) {
      const scopeMatch = cuentasDisponibles.find(
        (c) => c.ambito === params.ambito
      );
      setCuentaId((scopeMatch || cuentasDisponibles[0]).id);
    }
  }, [cuentasDisponibles, cuentaId, params.ambito]);

  const cuentaObj = cuentasDisponibles.find((c) => c.id === cuentaId);
  const isSubmitting =
    liquidarChequeMutation.isPending ||
    pagarCuotaMutation.isPending ||
    cambiarEstadoChequeMutation.isPending;

  const handleConfirm = async () => {
    if (!cuentaObj || !isValidDDMMYYYY(fechaReal)) return;

    if (isCheque && params.chequeId) {
      await liquidarChequeMutation.mutateAsync({
        chequeId: params.chequeId,
        cuentaId: cuentaObj.id,
        fechaLiquidacion: fechaReal,
        tasaCambio: tasa,
      });
    } else if (params.prestamoId && params.cuotaId) {
      await pagarCuotaMutation.mutateAsync({
        prestamoId: params.prestamoId,
        cuotaId: params.cuotaId,
        cuentaId: cuentaObj.id,
        fechaPago: fechaReal,
        tasaCambio: tasa,
      });
    }

    router.replace({
      pathname: '/(modals)/comprobante',
      params: {
        id: params.chequeId || params.cuotaId || `LIQ-${Date.now()}`,
        title: isIncome ? 'Cobro Asentado en Cuenta' : 'Pago Asentado en Cuenta',
        date: fechaReal,
        amount: String(monto),
        currency: moneda,
        cuenta: cuentaObj.nombre,
        campana:
          params.ambito === 'PERSONAL' ? 'Personal / Casa' : 'Negocio (Maní)',
        concepto: params.titulo || 'Liquidación de vencimiento',
      },
    });
  };

  const handleRechazarCheque = async () => {
    if (!params.chequeId) return;
    await cambiarEstadoChequeMutation.mutateAsync({
      chequeId: params.chequeId,
      estado: 'RECHAZADO',
    });
    router.back();
  };

  return (
    <SecureFormTemplate
      title={isIncome ? 'Confirmar Cobro / Depósito' : 'Confirmar Pago / Débito'}
      subtitle={params.titulo || 'Impactar compromiso en saldo real'}
      isSubmitting={isSubmitting}
      canSubmit={Boolean(cuentaObj) && isValidDDMMYYYY(fechaReal)}
      submitLabel={
        isIncome
          ? 'Confirmar Acreditación en Cuenta'
          : 'Confirmar Débito y Marcar Pagado'
      }
      onSubmit={handleConfirm}
      validationSummary={[
        { label: 'Concepto', value: params.titulo || '-' },
        {
          label: 'Impacto',
          value: isIncome ? 'Suma al saldo (Ingreso)' : 'Resta del saldo (Egreso)',
        },
        { label: 'Cuenta', value: cuentaObj?.nombre || 'Seleccione cuenta' },
        {
          label: 'Monto',
          value: formatMoney(monto, moneda),
          highlight: true,
        },
      ]}
    >
      <SectionHeader title="Fecha Real de Ejecución (DD-MM-AAAA)" />
      <View style={styles.rowChips}>
        <Chip
          label="Hoy"
          selected={fechaReal === getTodayDDMMYYYY()}
          onPress={() => setFechaReal(getTodayDDMMYYYY())}
        />
        <Chip
          label="Ayer"
          selected={fechaReal === getYesterdayDDMMYYYY()}
          onPress={() => setFechaReal(getYesterdayDDMMYYYY())}
        />
      </View>
      <TextInput
        value={fechaReal}
        onChangeText={setFechaReal}
        placeholder="DD-MM-AAAA"
        placeholderTextColor={theme.textMuted}
        style={[
          styles.input,
          {
            backgroundColor: theme.surface,
            borderColor: isValidDDMMYYYY(fechaReal)
              ? theme.border
              : theme.danger,
            color: theme.textPrimary,
          },
        ]}
      />

      <SectionHeader
        title={
          isIncome
            ? 'Cuenta donde se acredita el dinero'
            : 'Cuenta desde donde se paga'
        }
      />
      {cuentasDisponibles.length === 0 ? (
        <View style={{ gap: 8 }}>
          <EmptyState
            icon="Landmark"
            title="Sin cuentas disponibles"
            description="Creá una cuenta bancaria o caja para poder liquidar este compromiso."
          />
          <SecureButton
            label="Crear Cuenta"
            icon="Plus"
            onPress={() => router.push('/(modals)/crear-cuenta')}
          />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rowChips}
        >
          {cuentasDisponibles.map((c) => (
            <Chip
              key={c.id}
              label={`${c.nombre} (${c.moneda})`}
              icon={c.icono}
              selected={cuentaId === c.id}
              onPress={() => setCuentaId(c.id)}
            />
          ))}
        </ScrollView>
      )}

      {isCheque && params.chequeId ? (
        <View style={{ marginTop: 8 }}>
          <SecureButton
            label="Marcar Cheque como Rechazado / Anulado"
            variant="danger"
            icon="XCircle"
            onPress={handleRechazarCheque}
            disabled={isSubmitting}
          />
        </View>
      ) : null}
    </SecureFormTemplate>
  );
}

const styles = StyleSheet.create({
  rowChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '700',
  },
});

