import React, { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SecureFormTemplate } from '../../src/templates/SecureFormTemplate';
import { SectionHeader } from '../../src/components/ui';
import { useTheme } from '../../src/context/ThemeContext';
import {
  useActualizarCotizacion,
  useCotizacion,
} from '../../src/hooks/useCotizacion';
import { getTodayDDMMYYYY } from '../../src/utils/dates';
import { formatNumberPY } from '../../src/utils/formatters';

export default function CotizacionModal() {
  const router = useRouter();
  const { theme } = useTheme();
  const { data: cotizacion } = useCotizacion();
  const updateMutation = useActualizarCotizacion();

  const [compraStr, setCompraStr] = useState(
    String(cotizacion?.compraPYG || 7810)
  );
  const [ventaStr, setVentaStr] = useState(
    String(cotizacion?.ventaPYG || 7860)
  );
  const [refStr, setRefStr] = useState(
    String(cotizacion?.referenciaBCP || 7835)
  );

  const compra = parseInt(compraStr, 10) || 7810;
  const venta = parseInt(ventaStr, 10) || 7860;
  const ref = parseInt(refStr, 10) || Math.round((compra + venta) / 2);

  const handleSubmit = async () => {
    await updateMutation.mutateAsync({
      compraPYG: compra,
      ventaPYG: venta,
      referenciaBCP: ref,
    });
    router.back();
  };

  return (
    <SecureFormTemplate
      title="Tasa de Cambio USD / PYG"
      subtitle="Actualización de Cotización para Consolidación Patrimonial"
      isSubmitting={updateMutation.isPending}
      canSubmit={compra > 1000 && venta > 1000 && ref > 1000}
      submitLabel="Guardar Nueva Cotización en Google Sheets"
      onSubmit={handleSubmit}
      validationSummary={[
        {
          label: 'Fecha de Vigencia',
          value: getTodayDDMMYYYY(),
        },
        {
          label: 'Dólar Compra / Venta',
          value: `Gs. ${formatNumberPY(compra)} / Gs. ${formatNumberPY(venta)}`,
        },
        {
          label: 'Tasa Referencia BCP Aplicada',
          value: `1 USD = Gs. ${formatNumberPY(ref)}`,
          highlight: true,
        },
      ]}
    >
      <SectionHeader title="Cotización Compra (Gs.)" />
      <TextInput
        value={compraStr}
        onChangeText={setCompraStr}
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

      <SectionHeader title="Cotización Venta (Gs.)" />
      <TextInput
        value={ventaStr}
        onChangeText={setVentaStr}
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

      <SectionHeader title="Cotización Referencial Contable / BCP (Gs.)" />
      <TextInput
        value={refStr}
        onChangeText={setRefStr}
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
    </SecureFormTemplate>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '800',
  },
});

