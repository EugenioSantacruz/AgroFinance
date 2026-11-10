import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BaseContainerTemplate } from '../../src/templates/BaseContainerTemplate';
import {
  EmptyState,
  ListRow,
  SectionHeader,
} from '../../src/components/ui';
import { usePrivacy } from '../../src/context/PrivacyContext';
import { useMovimientos } from '../../src/hooks/useMovimientos';
import { usePresupuestos } from '../../src/hooks/usePresupuestos';

export default function AuditoriaPresupuestoScreen() {
  const router = useRouter();
  const { macro } = useLocalSearchParams<{ macro: string }>();
  const { displayCurrency } = usePrivacy();
  const { data: presupuestos } = usePresupuestos('ALL');
  const { data: movimientos } = useMovimientos();

  const rubro = (presupuestos || []).find((p) => p.macroCategoria === macro);
  const movsRubro = (movimientos || []).filter(
    (m) => m.macroCategoria === macro && !m.anulado && m.tipo === 'GASTO'
  );

  return (
    <BaseContainerTemplate
      title={rubro?.nombreRubro || 'Auditoría de Rubro'}
      subtitle={`Ejecución Presupuestaria (${rubro?.porcentajeUso || 0}%)`}
      heroLabel="Total Ejecutado en este Rubro"
      heroAmount={
        displayCurrency === 'USD'
          ? rubro?.ejecutadoUSD || 0
          : rubro?.ejecutadoPYG || 0
      }
      heroCurrency={displayCurrency}
      heroSecondaryLabel="Remanente Disponible:"
      heroSecondaryAmount={
        displayCurrency === 'USD'
          ? rubro?.disponibleUSD || 0
          : rubro?.disponiblePYG || 0
      }
      heroSecondaryCurrency={displayCurrency}
      quickActions={[
        {
          id: 'volver',
          label: 'Volver',
          icon: 'Layers',
          onPress: () => router.back(),
        },
        {
          id: 'cargar',
          label: 'Cargar Gasto',
          icon: 'Plus',
          onPress: () => router.push('/(modals)/registrar'),
        },
      ]}
    >
      <SectionHeader
        title={`Facturas y Gastos Imputados (${movsRubro.length})`}
      />
      {movsRubro.length === 0 ? (
        <EmptyState
          title="Sin gastos imputados en este rubro"
          description="Todos los asientos de este rubro técnico aparecerán aquí."
        />
      ) : (
        <View style={{ gap: 10 }}>
          {movsRubro.map((m) => (
            <ListRow
              key={m.id}
              icon={rubro?.icono || 'Sprout'}
              tone="gold"
              title={m.subCategoria}
              badgeText={m.moneda}
              subtitle={`${m.fecha} · ${m.concepto}`}
              amount={m.monto}
              currency={m.moneda}
              amountTone="negative"
            />
          ))}
        </View>
      )}
    </BaseContainerTemplate>
  );
}

