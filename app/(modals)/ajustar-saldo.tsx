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
import { useAjustarSaldo, useCuentas } from '../../src/hooks/useCuentas';
import { isTarjetaCuenta } from '../../src/utils/accounts';
import { getTodayDDMMYYYY } from '../../src/utils/dates';
import { formatMoney } from '../../src/utils/formatters';

export default function AjustarSaldoModal() {
  const router = useRouter();
  const { data: cuentas } = useCuentas();
  const ajustarMutation = useAjustarSaldo();

  const cuentasOperativas = useMemo(
    () => (cuentas || []).filter((c) => !isTarjetaCuenta(c.tipo)),
    [cuentas]
  );

  const [cuentaId, setCuentaId] = useState('');
  const [nuevoSaldoStr, setNuevoSaldoStr] = useState('0');

  useEffect(() => {
    if (
      cuentasOperativas.length > 0 &&
      !cuentasOperativas.some((c) => c.id === cuentaId)
    ) {
      setCuentaId(cuentasOperativas[0].id);
      setNuevoSaldoStr(String(cuentasOperativas[0].saldoActual));
    }
  }, [cuentasOperativas, cuentaId]);

  const cuenta =
    cuentasOperativas.find((c) => c.id === cuentaId) || cuentasOperativas[0];
  const nuevoSaldo = parseFloat(nuevoSaldoStr.replace(/,/g, '.')) || 0;

  const handleSubmit = async () => {
    if (!cuenta) return;
    await ajustarMutation.mutateAsync({
      cuentaId: cuenta.id,
      nuevoSaldo,
      motivo: 'Conciliación de extracto bancario / arqueo de caja',
    });

    router.replace({
      pathname: '/(modals)/comprobante',
      params: {
        id: `CONC-${Date.now()}`,
        title: 'Conciliación de Saldo Aplicada',
        date: getTodayDDMMYYYY(),
        amount: String(nuevoSaldo),
        currency: cuenta.moneda,
        cuenta: cuenta.nombre,
        campana: cuenta.ambito === 'PERSONAL' ? 'Personal / Casa' : 'Negocio',
        concepto: 'Arqueo de saldo real verificado',
      },
    });
  };

  return (
    <SecureFormTemplate
      title="Conciliación de Saldos"
      subtitle="Arqueo de Cajas y Extractos Bancarios"
      isSubmitting={ajustarMutation.isPending}
      canSubmit={Boolean(cuenta)}
      submitLabel="Aplicar Conciliación"
      onSubmit={handleSubmit}
      validationSummary={[
        {
          label: 'Cuenta Auditada',
          value: cuenta ? `${cuenta.nombre} (${cuenta.moneda})` : '-',
        },
        {
          label: 'Saldo Anterior',
          value: cuenta ? formatMoney(cuenta.saldoActual, cuenta.moneda) : '-',
        },
        {
          label: 'Nuevo Saldo Real',
          value: cuenta ? formatMoney(nuevoSaldo, cuenta.moneda) : '-',
          highlight: true,
        },
      ]}
    >
      {cuentasOperativas.length === 0 ? (
        <EmptyState
          icon="Scale"
          title="Sin cuentas para conciliar"
          description="Creá una cuenta bancaria o de efectivo primero."
        />
      ) : (
        <>
          <SectionHeader title="Seleccione Cuenta o Caja a Conciliar" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.row}
          >
            {cuentasOperativas.map((c) => (
              <Chip
                key={c.id}
                label={`${c.nombre} (${c.moneda})`}
                icon={c.icono}
                selected={cuentaId === c.id}
                onPress={() => {
                  setCuentaId(c.id);
                  setNuevoSaldoStr(String(c.saldoActual));
                }}
              />
            ))}
          </ScrollView>

          <AmountInput
            value={nuevoSaldoStr}
            onChangeText={setNuevoSaldoStr}
            currency={cuenta?.moneda || 'PYG'}
            label="NUEVO SALDO REAL EN EXTRACTOS"
          />
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
