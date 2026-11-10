import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SecureFormTemplate } from '../../src/templates/SecureFormTemplate';
import {
  AmountInput,
  Card,
  Chip,
  EmptyState,
  SectionHeader,
} from '../../src/components/ui';
import { useTheme } from '../../src/context/ThemeContext';
import { useCotizacion } from '../../src/hooks/useCotizacion';
import { useCuentas } from '../../src/hooks/useCuentas';
import { useRegistrarMovimiento } from '../../src/hooks/useMovimientos';
import {
  AmbitoFinanciero,
  CurrencyCode,
  MacroCategoriaAgro,
} from '../../src/types/domain';
import { getTodayDDMMYYYY } from '../../src/utils/dates';
import { formatMoney } from '../../src/utils/formatters';

type AtajoTipo = 'VENTA_MANI' | 'INSUMO_FLETE' | 'GASTO_CASA';

export default function AccionRapidaModal() {
  const router = useRouter();
  const { theme } = useTheme();
  const { data: cuentas } = useCuentas();
  const { data: cotizacion } = useCotizacion();
  const registrarMutation = useRegistrarMovimiento();

  const [atajo, setAtajo] = useState<AtajoTipo>('VENTA_MANI');
  const [moneda, setMoneda] = useState<CurrencyCode>('PYG');
  const [montoStr, setMontoStr] = useState('');
  const [toneladasStr, setToneladasStr] = useState('');
  const [contraparte, setContraparte] = useState('');
  const [cuentaId, setCuentaId] = useState('');

  const tasa = cotizacion?.referenciaBCP || 7835;
  const montoNum = parseFloat(montoStr.replace(/,/g, '.')) || 0;
  const toneladasNum =
    atajo === 'VENTA_MANI' ? parseFloat(toneladasStr) || undefined : undefined;

  const targetAmbito: AmbitoFinanciero =
    atajo === 'GASTO_CASA' ? 'PERSONAL' : 'NEGOCIO';

  useEffect(() => {
    const all = cuentas || [];
    if (all.length === 0) return;
    if (!all.some((c) => c.id === cuentaId)) {
      const match = all.find((c) => c.ambito === targetAmbito) || all[0];
      setCuentaId(match.id);
      setMoneda(match.moneda);
    }
  }, [cuentas, cuentaId, targetAmbito]);

  const cuentaObj = (cuentas || []).find((c) => c.id === cuentaId);

  const handleSelectAtajo = (nuevo: AtajoTipo) => {
    setAtajo(nuevo);
    const nextScope: AmbitoFinanciero =
      nuevo === 'GASTO_CASA' ? 'PERSONAL' : 'NEGOCIO';
    const match =
      (cuentas || []).find((c) => c.ambito === nextScope) || (cuentas || [])[0];
    if (match) {
      setCuentaId(match.id);
      setMoneda(match.moneda);
    }
  };

  const handleSubmit = async () => {
    if (montoNum <= 0 || !cuentaObj) return;

    const macroMap: Record<AtajoTipo, MacroCategoriaAgro> = {
      VENTA_MANI: 'VENTAS_AGRO',
      INSUMO_FLETE: 'INSUMOS_AGRICOLAS',
      GASTO_CASA: 'HOGAR_ALIMENTACION',
    };

    const subMap: Record<AtajoTipo, string> = {
      VENTA_MANI: 'Venta de Maní / Clientes',
      INSUMO_FLETE: 'Insumos / Fletes Negocio',
      GASTO_CASA: 'Gasto Personal / Casa',
    };

    const mov = await registrarMutation.mutateAsync({
      fecha: getTodayDDMMYYYY(),
      ambito: targetAmbito,
      tipo: atajo === 'VENTA_MANI' ? 'INGRESO' : 'GASTO',
      cuentaId: cuentaObj.id,
      macroCategoria: macroMap[atajo],
      subCategoria: subMap[atajo],
      concepto:
        atajo === 'VENTA_MANI' && toneladasNum
          ? `Venta de ${toneladasNum} Ton maní`
          : subMap[atajo],
      contraparte: contraparte.trim() || undefined,
      moneda,
      monto: montoNum,
      tasaCambio: tasa,
      toneladasCabezas: toneladasNum,
    });

    router.replace({
      pathname: '/(modals)/comprobante',
      params: {
        id: mov.id,
        title: subMap[atajo],
        date: mov.fecha,
        amount: String(mov.monto),
        currency: mov.moneda,
        cuenta: cuentaObj.nombre,
        campana: targetAmbito === 'NEGOCIO' ? 'Negocio (Maní)' : 'Personal',
        concepto: mov.concepto,
      },
    });
  };

  return (
    <SecureFormTemplate
      title="Atajos Rápidos"
      subtitle="Registrá ventas de maní, insumos o gastos de la casa en 2 toques"
      isSubmitting={registrarMutation.isPending}
      canSubmit={montoNum > 0 && Boolean(cuentaObj)}
      submitLabel="Guardar Atajo"
      onSubmit={handleSubmit}
      validationSummary={[
        {
          label: 'Ámbito',
          value: targetAmbito === 'NEGOCIO' ? 'Negocio (Maní)' : 'Personal / Casa',
        },
        { label: 'Cuenta', value: cuentaObj?.nombre || '-' },
        {
          label: 'Monto',
          value: formatMoney(montoNum, moneda),
          highlight: true,
        },
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        <Chip
          label="Venta de Maní"
          icon="Wheat"
          selected={atajo === 'VENTA_MANI'}
          onPress={() => handleSelectAtajo('VENTA_MANI')}
        />
        <Chip
          label="Insumo / Flete"
          icon="Truck"
          selected={atajo === 'INSUMO_FLETE'}
          onPress={() => handleSelectAtajo('INSUMO_FLETE')}
        />
        <Chip
          label="Gasto Personal"
          icon="Home"
          selected={atajo === 'GASTO_CASA'}
          onPress={() => handleSelectAtajo('GASTO_CASA')}
        />
      </ScrollView>

      <AmountInput
        value={montoStr}
        onChangeText={setMontoStr}
        currency={moneda}
        onToggleCurrency={() =>
          setMoneda((prev) => (prev === 'USD' ? 'PYG' : 'USD'))
        }
      />

      {atajo === 'VENTA_MANI' ? (
        <Card style={{ gap: 8 }}>
          <Text style={[styles.helperLabel, { color: theme.textSecondary }]}>
            TONELADAS VENDIDAS (OPCIONAL)
          </Text>
          <TextInput
            value={toneladasStr}
            onChangeText={setToneladasStr}
            keyboardType="numeric"
            placeholder="Ej: 15"
            placeholderTextColor={theme.textMuted}
            style={[
              styles.input,
              {
                backgroundColor: theme.surfaceMuted,
                borderColor: theme.border,
                color: theme.textPrimary,
              },
            ]}
          />
        </Card>
      ) : null}

      <TextInput
        value={contraparte}
        onChangeText={setContraparte}
        placeholder="Cliente o Proveedor (opcional)"
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

      <SectionHeader title="Cuenta Utilizada" />
      {(cuentas || []).length === 0 ? (
        <EmptyState
          icon="Landmark"
          title="Sin cuentas creadas"
          description="Creá una cuenta desde Ajustes primero."
        />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {(cuentas || []).map((cta) => (
            <Chip
              key={cta.id}
              label={`${cta.nombre} (${cta.ambito})`}
              icon={cta.icono}
              selected={cuentaId === cta.id}
              onPress={() => {
                setCuentaId(cta.id);
                setMoneda(cta.moneda);
              }}
            />
          ))}
        </ScrollView>
      )}
    </SecureFormTemplate>
  );
}

const styles = StyleSheet.create({
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  helperLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '600',
  },
});
