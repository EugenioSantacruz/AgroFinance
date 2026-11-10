import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BaseContainerTemplate } from '../../src/templates/BaseContainerTemplate';
import {
  EmptyState,
  ListRow,
  SectionHeader,
} from '../../src/components/ui';
import { usePrestamos } from '../../src/hooks/usePrestamos';
import { formatMoney } from '../../src/utils/formatters';

export default function DetallePrestamoScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: prestamos, isLoading, refetch, isFetching } = usePrestamos();

  const prestamo = (prestamos || []).find((p) => p.id === id);

  if (!prestamo) {
    return (
      <BaseContainerTemplate
        title="Plan de Cuotas"
        heroLabel="Saldo Pendiente"
        heroAmount={0}
        heroCurrency="PYG"
        isLoadingHero={isLoading}
      >
        <EmptyState
          title="Plan no encontrado"
          description="Seleccioná una compra en cuotas o financiación activa desde el panel."
        />
      </BaseContainerTemplate>
    );
  }

  const esCobro = (prestamo.direccion || 'PAGAR') === 'COBRAR';
  const nextPending = prestamo.cuotas.find((c) => c.estado !== 'PAGADA');

  return (
    <BaseContainerTemplate
      title={prestamo.nombre}
      subtitle={`${prestamo.contraparte || prestamo.entidad} · ${
        prestamo.ambito === 'PERSONAL' ? 'Personal' : 'Negocio'
      } · ${prestamo.periodicidad || 'MENSUAL'}`}
      isSyncing={isFetching}
      onRefresh={refetch}
      heroLabel={
        esCobro ? 'Saldo Pendiente a Cobrar' : 'Saldo Pendiente a Pagar'
      }
      heroAmount={prestamo.saldoPendiente}
      heroCurrency={prestamo.moneda}
      heroSecondaryLabel="Monto Original:"
      heroSecondaryAmount={prestamo.capitalOriginal}
      heroSecondaryCurrency={prestamo.moneda}
      exchangeRateBadge={`Cuotas: ${prestamo.cuotasPagadas}/${prestamo.cuotasTotales}`}
      quickActions={[
        {
          id: 'volver',
          label: 'Volver',
          icon: 'Layers',
          onPress: () => router.back(),
        },
        ...(nextPending
          ? [
              {
                id: 'pagar',
                label: esCobro ? 'Cobrar Próx.' : 'Pagar Próx.',
                icon: 'CheckCircle2',
                onPress: () =>
                  router.push({
                    pathname: '/(modals)/liquidar',
                    params: {
                      tipo: 'CUOTA',
                      prestamoId: prestamo.id,
                      cuotaId: nextPending.id,
                      titulo: `${prestamo.nombre} (Cuota ${nextPending.numeroCuota}/${prestamo.cuotasTotales})`,
                      monto: String(nextPending.montoTotal),
                      moneda: nextPending.moneda,
                      direccion: esCobro ? 'INGRESO' : 'EGRESO',
                      ambito: prestamo.ambito || 'NEGOCIO',
                    },
                  }),
              },
            ]
          : []),
      ]}
    >
      <SectionHeader title="Cronograma de Cuotas (DD-MM-AAAA)" />
      <View style={{ gap: 10 }}>
        {prestamo.cuotas.map((c) => {
          const pagada = c.estado === 'PAGADA';
          return (
            <ListRow
              key={c.id}
              icon={pagada ? 'CheckCircle2' : 'CalendarClock'}
              tone={pagada ? 'primary' : 'gold'}
              title={`Cuota ${c.numeroCuota}/${prestamo.cuotasTotales} · Vence ${c.fechaVencimiento}`}
              badgeText={c.moneda}
              subtitle={
                pagada
                  ? `Liquidada el ${c.fechaPago || '-'}`
                  : c.montoInteres > 0
                  ? `Capital: ${formatMoney(
                      c.montoCapital,
                      c.moneda
                    )} + Interés: ${formatMoney(c.montoInteres, c.moneda)}`
                  : 'Pendiente de pago'
              }
              amount={c.montoTotal}
              currency={c.moneda}
              amountTone={
                pagada ? 'default' : esCobro ? 'positive' : 'negative'
              }
              secondaryRightText={pagada ? 'PAGADA' : c.estado}
              actionLabel={
                !pagada ? (esCobro ? 'Cobrar' : 'Pagar') : undefined
              }
              actionTone={esCobro ? 'primary' : 'gold'}
              onActionPress={
                !pagada
                  ? () =>
                      router.push({
                        pathname: '/(modals)/liquidar',
                        params: {
                          tipo: 'CUOTA',
                          prestamoId: prestamo.id,
                          cuotaId: c.id,
                          titulo: `${prestamo.nombre} (Cuota ${c.numeroCuota}/${prestamo.cuotasTotales})`,
                          monto: String(c.montoTotal),
                          moneda: c.moneda,
                          direccion: esCobro ? 'INGRESO' : 'EGRESO',
                          ambito: prestamo.ambito || 'NEGOCIO',
                        },
                      })
                  : undefined
              }
            />
          );
        })}
      </View>
    </BaseContainerTemplate>
  );
}
