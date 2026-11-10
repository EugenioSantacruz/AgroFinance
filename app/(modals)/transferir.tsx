import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SecureFormTemplate } from '../../src/templates/SecureFormTemplate';
import {
  AmountInput,
  Card,
  Chip,
  EmptyState,
  IconBadge,
  SectionHeader,
} from '../../src/components/ui';
import { useTheme } from '../../src/context/ThemeContext';
import { useCotizacion } from '../../src/hooks/useCotizacion';
import { useCuentas, useTransferirBimoneda } from '../../src/hooks/useCuentas';
import { isTarjetaCuenta } from '../../src/utils/accounts';
import {
  getTodayDDMMYYYY,
  getYesterdayDDMMYYYY,
  isValidDDMMYYYY,
} from '../../src/utils/dates';
import { convertCurrency, formatMoney } from '../../src/utils/formatters';

export default function TransferirBimonedaModal() {
  const router = useRouter();
  const { theme } = useTheme();
  const { data: cuentas } = useCuentas();
  const { data: cotizacion } = useCotizacion();
  const transferirMutation = useTransferirBimoneda();

  const cuentasOrigen = useMemo(
    () => (cuentas || []).filter((c) => !isTarjetaCuenta(c.tipo)),
    [cuentas]
  );
  const todasCuentas = cuentas || [];

  const [origenId, setOrigenId] = useState('');
  const [destinoId, setDestinoId] = useState('');
  const [montoStr, setMontoStr] = useState('');
  const [fecha, setFecha] = useState(getTodayDDMMYYYY());
  const [concepto, setConcepto] = useState('');
  const [tasaCustomStr, setTasaCustomStr] = useState(
    String(cotizacion?.referenciaBCP || 7835)
  );

  useEffect(() => {
    if (cuentasOrigen.length > 0 && !cuentasOrigen.some((c) => c.id === origenId)) {
      setOrigenId(cuentasOrigen[0].id);
    }
  }, [cuentasOrigen, origenId]);

  useEffect(() => {
    const candidatos = todasCuentas.filter((c) => c.id !== origenId);
    if (candidatos.length > 0 && !candidatos.some((c) => c.id === destinoId)) {
      setDestinoId(candidatos[0].id);
    }
  }, [todasCuentas, origenId, destinoId]);

  const origen = todasCuentas.find((c) => c.id === origenId);
  const destino = todasCuentas.find((c) => c.id === destinoId);
  const montoOrigen = parseFloat(montoStr.replace(/,/g, '.')) || 0;
  const tasa = parseFloat(tasaCustomStr) || cotizacion?.referenciaBCP || 7835;

  const montoAcreditar =
    origen && destino
      ? convertCurrency(montoOrigen, origen.moneda, destino.moneda, tasa)
      : 0;

  const tipoOperacionLabel = useMemo(() => {
    if (!origen || !destino) return 'Transferencia';
    const origAmb = origen.ambito || 'NEGOCIO';
    const destAmb = destino.ambito || 'NEGOCIO';
    if (origAmb === 'NEGOCIO' && destAmb === 'PERSONAL') {
      return 'Retiro Personal del Negocio (no afecta margen del maní)';
    }
    if (origAmb === 'PERSONAL' && destAmb === 'NEGOCIO') {
      return 'Aporte Personal al Negocio';
    }
    return 'Transferencia / Cambio Bimoneda';
  }, [origen, destino]);

  const handleSubmit = async () => {
    if (
      !origen ||
      !destino ||
      origen.id === destino.id ||
      montoOrigen <= 0 ||
      !isValidDDMMYYYY(fecha)
    )
      return;

    await transferirMutation.mutateAsync({
      fecha,
      cuentaOrigenId: origen.id,
      cuentaDestinoId: destino.id,
      montoOrigen,
      tasaCambio: tasa,
      concepto:
        concepto.trim() ||
        `${tipoOperacionLabel}: ${origen.nombre} -> ${destino.nombre}`,
    });

    router.replace({
      pathname: '/(modals)/comprobante',
      params: {
        id: `TRF-${Date.now()}`,
        title: tipoOperacionLabel,
        date: fecha,
        amount: String(montoOrigen),
        currency: origen.moneda,
        cuenta: `${origen.nombre} -> ${destino.nombre}`,
        campana: `${origen.ambito} -> ${destino.ambito}`,
        concepto: `Acreditado: ${formatMoney(montoAcreditar, destino.moneda)}`,
      },
    });
  };

  return (
    <SecureFormTemplate
      title="Transferencia, Retiro o Cambio"
      subtitle="Mové fondos entre cuentas, registrá retiros personales o cambiá USD/PYG"
      isSubmitting={transferirMutation.isPending}
      canSubmit={
        Boolean(origen && destino && origen.id !== destino.id) &&
        montoOrigen > 0 &&
        isValidDDMMYYYY(fecha)
      }
      submitLabel="Confirmar Movimiento"
      onSubmit={handleSubmit}
      validationSummary={[
        { label: 'Clasificación', value: tipoOperacionLabel },
        { label: 'Fecha', value: fecha },
        {
          label: 'Origen (Debitar)',
          value: origen ? `${origen.nombre} (${origen.moneda})` : '-',
        },
        {
          label: 'Destino (Acreditar)',
          value: destino ? `${destino.nombre} (${destino.moneda})` : '-',
        },
        {
          label: 'Monto Acreditado',
          value: destino ? formatMoney(montoAcreditar, destino.moneda) : '-',
          highlight: true,
        },
      ]}
    >
      {todasCuentas.length < 2 ? (
        <EmptyState
          icon="ArrowLeftRight"
          title="Necesitás al menos 2 cuentas"
          description="Creá una segunda cuenta (ej. Personal y Negocio) desde Ajustes para poder transferir o registrar retiros."
        />
      ) : (
        <>
          {origen && destino && origen.ambito !== destino.ambito ? (
            <Card
              style={{
                backgroundColor: theme.primarySoft,
                borderColor: theme.primary,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <IconBadge icon="ArrowLeftRight" tone="primary" />
              <Text style={{ flex: 1, fontSize: 12, fontWeight: '700', color: theme.primary }}>
                {tipoOperacionLabel}
              </Text>
            </Card>
          ) : null}

          <AmountInput
            value={montoStr}
            onChangeText={setMontoStr}
            currency={origen?.moneda || 'PYG'}
            label="MONTO A DEBITAR EN CUENTA ORIGEN"
          />

          <SectionHeader title="Fecha (DD-MM-AAAA)" />
          <View style={styles.row}>
            <Chip
              label="Hoy"
              selected={fecha === getTodayDDMMYYYY()}
              onPress={() => setFecha(getTodayDDMMYYYY())}
            />
            <Chip
              label="Ayer"
              selected={fecha === getYesterdayDDMMYYYY()}
              onPress={() => setFecha(getYesterdayDDMMYYYY())}
            />
          </View>
          <TextInput
            value={fecha}
            onChangeText={setFecha}
            placeholder="DD-MM-AAAA"
            placeholderTextColor={theme.textMuted}
            style={[
              styles.input,
              {
                backgroundColor: theme.surface,
                borderColor: isValidDDMMYYYY(fecha) ? theme.border : theme.danger,
                color: theme.textPrimary,
              },
            ]}
          />

          <SectionHeader title="1. Cuenta Origen (Debitar)" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.row}
          >
            {cuentasOrigen.map((c) => (
              <Chip
                key={c.id}
                label={`${c.nombre} (${c.ambito})`}
                icon={c.icono}
                selected={origenId === c.id}
                onPress={() => setOrigenId(c.id)}
              />
            ))}
          </ScrollView>

          <SectionHeader title="2. Cuenta Destino (Acreditar / Pagar Tarjeta)" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.row}
          >
            {todasCuentas
              .filter((c) => c.id !== origenId)
              .map((c) => (
                <Chip
                  key={c.id}
                  label={`${c.nombre} (${c.ambito})`}
                  icon={c.icono}
                  selected={destinoId === c.id}
                  onPress={() => setDestinoId(c.id)}
                />
              ))}
          </ScrollView>

          <SectionHeader title="Tasa de Cambio Pactada (Gs. por 1 USD)" />
          <TextInput
            value={tasaCustomStr}
            onChangeText={setTasaCustomStr}
            keyboardType="numeric"
            style={[
              styles.input,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                color: theme.textPrimary,
              },
            ]}
          />

          <TextInput
            value={concepto}
            onChangeText={setConcepto}
            placeholder="Motivo o detalle (ej: Retiro mensual para la casa)"
            placeholderTextColor={theme.textMuted}
            style={[
              styles.input,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                color: theme.textPrimary,
              },
            ]}
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
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '600',
  },
});
