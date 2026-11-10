import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SecureFormTemplate } from '../../src/templates/SecureFormTemplate';
import {
  AmbitoSwitch,
  AmountInput,
  Chip,
  SectionHeader,
} from '../../src/components/ui';
import { useTheme } from '../../src/context/ThemeContext';
import { useCrearCuenta } from '../../src/hooks/useCuentas';
import {
  AmbitoFinanciero,
  CurrencyCode,
  TipoCuentaAgro,
} from '../../src/types/domain';
import { isTarjetaCuenta } from '../../src/utils/accounts';
import { getTodayDDMMYYYY } from '../../src/utils/dates';
import { formatMoney } from '../../src/utils/formatters';

export default function CrearCuentaModal() {
  const router = useRouter();
  const { theme } = useTheme();
  const crearCuentaMutation = useCrearCuenta();

  const [ambito, setAmbito] = useState<AmbitoFinanciero>('NEGOCIO');
  const [tipo, setTipo] = useState<TipoCuentaAgro>('BANCO');
  const [moneda, setMoneda] = useState<CurrencyCode>('PYG');
  const [nombre, setNombre] = useState('');
  const [entidad, setEntidad] = useState('');
  const [saldoStr, setSaldoStr] = useState('0');
  const [limiteStr, setLimiteStr] = useState('10000000');
  const [deudaStr, setDeudaStr] = useState('0');

  const isCard = isTarjetaCuenta(tipo);
  const saldoNum = parseFloat(saldoStr.replace(/,/g, '.')) || 0;
  const limiteNum = parseFloat(limiteStr.replace(/,/g, '.')) || 0;
  const deudaNum = parseFloat(deudaStr.replace(/,/g, '.')) || 0;

  const handleSubmit = async () => {
    if (!nombre.trim()) return;
    const cta = await crearCuentaMutation.mutateAsync({
      nombre: nombre.trim(),
      ambito,
      tipo,
      moneda,
      saldoActual: isCard ? 0 : saldoNum,
      limiteCredito: isCard ? limiteNum : 0,
      deudaActual: isCard ? deudaNum : 0,
      entidad:
        entidad.trim() ||
        (tipo === 'EFECTIVO' ? 'Efectivo / Caja' : 'Entidad Bancaria'),
    });

    router.replace({
      pathname: '/(modals)/comprobante',
      params: {
        id: cta.id,
        title: 'Cuenta Creada Exitosamente',
        date: getTodayDDMMYYYY(),
        amount: String(isCard ? deudaNum : saldoNum),
        currency: cta.moneda,
        cuenta: cta.nombre,
        campana: ambito === 'NEGOCIO' ? 'Negocio (Maní)' : 'Personal / Casa',
        concepto: cta.entidad,
      },
    });
  };

  return (
    <SecureFormTemplate
      title="Nueva Cuenta / Caja / Tarjeta"
      subtitle="Separá tus cuentas de Negocio y Personal en un mismo lugar"
      isSubmitting={crearCuentaMutation.isPending}
      canSubmit={nombre.trim().length > 0}
      submitLabel="Crear Cuenta"
      onSubmit={handleSubmit}
      validationSummary={[
        { label: 'Nombre', value: nombre.trim() || '-' },
        {
          label: 'Ámbito',
          value: ambito === 'NEGOCIO' ? 'Negocio (Maní)' : 'Personal / Casa',
        },
        { label: 'Moneda', value: moneda },
        {
          label: isCard ? 'Deuda Inicial' : 'Saldo Inicial',
          value: formatMoney(isCard ? deudaNum : saldoNum, moneda),
          highlight: true,
        },
      ]}
    >
      <AmbitoSwitch
        includeAll={false}
        value={ambito}
        onChange={(v) => setAmbito(v as AmbitoFinanciero)}
      />

      <SectionHeader title="Tipo de Cuenta" />
      <View style={styles.rowChips}>
        <Chip
          label="Banco"
          icon="Landmark"
          selected={tipo === 'BANCO'}
          onPress={() => setTipo('BANCO')}
        />
        <Chip
          label="Efectivo / Caja"
          icon="Wallet"
          selected={tipo === 'EFECTIVO'}
          onPress={() => setTipo('EFECTIVO')}
        />
        <Chip
          label="Tarjeta"
          icon="CreditCard"
          selected={tipo === 'TARJETA'}
          onPress={() => setTipo('TARJETA')}
        />
        <Chip
          label="Cta. Acopio"
          icon="Wheat"
          selected={tipo === 'CUENTA_GRANARIA'}
          onPress={() => setTipo('CUENTA_GRANARIA')}
        />
      </View>

      <SectionHeader title="Moneda de la Cuenta" />
      <View style={styles.rowChips}>
        <Chip
          label="Guaraníes (PYG)"
          selected={moneda === 'PYG'}
          onPress={() => setMoneda('PYG')}
        />
        <Chip
          label="Dólares (USD)"
          selected={moneda === 'USD'}
          onPress={() => setMoneda('USD')}
        />
      </View>

      <SectionHeader title="Nombre y Banco / Entidad" />
      <TextInput
        value={nombre}
        onChangeText={setNombre}
        placeholder="Ej: Itaú Negocio Maní / Billetera Personal"
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
      <TextInput
        value={entidad}
        onChangeText={setEntidad}
        placeholder="Banco o Entidad (ej: Banco Itaú / Efectivo)"
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

      {!isCard ? (
        <AmountInput
          value={saldoStr}
          onChangeText={setSaldoStr}
          currency={moneda}
          label="SALDO INICIAL REAL"
        />
      ) : (
        <>
          <AmountInput
            value={limiteStr}
            onChangeText={setLimiteStr}
            currency={moneda}
            label="LÍMITE DE CRÉDITO"
          />
          <AmountInput
            value={deudaStr}
            onChangeText={setDeudaStr}
            currency={moneda}
            label="DEUDA ACTUAL A PAGAR"
          />
        </>
      )}
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
    fontSize: 14,
  },
});

