import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SecureFormTemplate } from '../../src/templates/SecureFormTemplate';
import {
  AmountInput,
  Chip,
  EmptyState,
  SectionHeader,
} from '../../src/components/ui';
import { useCotizacion } from '../../src/hooks/useCotizacion';
import { useCuentas, usePagarTarjetaAgro } from '../../src/hooks/useCuentas';
import { isTarjetaCuenta } from '../../src/utils/accounts';
import { getTodayDDMMYYYY } from '../../src/utils/dates';
import { formatMoney } from '../../src/utils/formatters';

export default function PagarTarjetaAgroModal() {
  const router = useRouter();
  const { data: cuentas } = useCuentas();
  const { data: cotizacion } = useCotizacion();
  const pagarMutation = usePagarTarjetaAgro();

  const tarjetas = useMemo(
    () => (cuentas || []).filter((c) => isTarjetaCuenta(c.tipo)),
    [cuentas]
  );
  const bancos = useMemo(
    () => (cuentas || []).filter((c) => !isTarjetaCuenta(c.tipo)),
    [cuentas]
  );

  const [tarjetaId, setTarjetaId] = useState('');
  const [origenId, setOrigenId] = useState('');
  const [montoStr, setMontoStr] = useState('');

  useEffect(() => {
    if (tarjetas.length > 0 && !tarjetas.some((t) => t.id === tarjetaId)) {
      setTarjetaId(tarjetas[0].id);
      setMontoStr(String(tarjetas[0].deudaActual || 0));
    }
  }, [tarjetas, tarjetaId]);

  useEffect(() => {
    if (bancos.length > 0 && !bancos.some((b) => b.id === origenId)) {
      setOrigenId(bancos[0].id);
    }
  }, [bancos, origenId]);

  const tarjeta = tarjetas.find((t) => t.id === tarjetaId) || tarjetas[0];
  const origen = bancos.find((b) => b.id === origenId) || bancos[0];
  const monto = parseFloat(montoStr.replace(/,/g, '.')) || 0;
  const tasa = cotizacion?.referenciaBCP || 7835;

  const handleSubmit = async () => {
    if (!tarjeta || !origen || monto <= 0) return;
    await pagarMutation.mutateAsync({
      cuentaOrigenId: origen.id,
      tarjetaId: tarjeta.id,
      monto,
      tasaCambio: tasa,
      concepto: `Pago de Tarjeta ${tarjeta.nombre}`,
    });

    router.replace({
      pathname: '/(modals)/comprobante',
      params: {
        id: `PAG-TC-${Date.now()}`,
        title: 'Pago de Tarjeta Aplicado',
        date: getTodayDDMMYYYY(),
        amount: String(monto),
        currency: origen.moneda,
        cuenta: origen.nombre,
        campana: tarjeta.nombre,
        concepto: 'Liberación de límite disponible',
      },
    });
  };

  return (
    <SecureFormTemplate
      title="Pago de Tarjeta"
      subtitle="Cancelación de saldo de tarjeta de crédito"
      isSubmitting={pagarMutation.isPending}
      canSubmit={Boolean(tarjeta && origen) && monto > 0}
      submitLabel="Confirmar Pago de Tarjeta"
      onSubmit={handleSubmit}
      validationSummary={[
        { label: 'Tarjeta', value: tarjeta?.nombre || '-' },
        {
          label: 'Deuda Actual',
          value: tarjeta ? formatMoney(tarjeta.deudaActual, tarjeta.moneda) : '-',
        },
        {
          label: 'Cuenta Origen',
          value: origen ? `${origen.nombre} (${origen.moneda})` : '-',
        },
        {
          label: 'Monto a Cancelar',
          value: origen ? formatMoney(monto, origen.moneda) : '-',
          highlight: true,
        },
      ]}
    >
      {tarjetas.length === 0 || bancos.length === 0 ? (
        <EmptyState
          icon="CreditCard"
          title="Faltan cuentas o tarjetas"
          description="Necesitás al menos una tarjeta y una cuenta de origen para registrar un pago."
        />
      ) : (
        <>
          <AmountInput
            value={montoStr}
            onChangeText={setMontoStr}
            currency={origen?.moneda || 'PYG'}
            label="MONTO A ABONAR"
          />

          <SectionHeader title="Tarjeta a Pagar" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.row}
          >
            {tarjetas.map((t) => (
              <Chip
                key={t.id}
                label={`${t.nombre} (Deuda: ${formatMoney(t.deudaActual, t.moneda)})`}
                icon="CreditCard"
                selected={tarjetaId === t.id}
                onPress={() => {
                  setTarjetaId(t.id);
                  setMontoStr(String(t.deudaActual || 0));
                }}
              />
            ))}
          </ScrollView>

          <SectionHeader title="Debitar Desde Cuenta" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.row}
          >
            {bancos.map((b) => (
              <Chip
                key={b.id}
                label={`${b.nombre} (${b.moneda})`}
                icon={b.icono}
                selected={origenId === b.id}
                onPress={() => setOrigenId(b.id)}
              />
            ))}
          </ScrollView>
        </>
      )}
    </SecureFormTemplate>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
});
