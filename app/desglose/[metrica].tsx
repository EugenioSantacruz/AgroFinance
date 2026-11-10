import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BaseContainerTemplate } from '../../src/templates/BaseContainerTemplate';
import { EmptyState, ListRow, SectionHeader } from '../../src/components/ui';
import { usePrivacy } from '../../src/context/PrivacyContext';
import { useCheques } from '../../src/hooks/useCheques';
import { useCuentas } from '../../src/hooks/useCuentas';
import { useMetricas } from '../../src/hooks/useMetricas';
import { useMovimientos } from '../../src/hooks/useMovimientos';
import { usePrestamos } from '../../src/hooks/usePrestamos';
import {
  isCashInflow,
  isCashOutflow,
} from '../../src/services/mockData';
import { getAmbitoLabel, isTarjetaCuenta } from '../../src/utils/accounts';

export default function DesgloseMetricaScreen() {
  const router = useRouter();
  const { metrica } = useLocalSearchParams<{ metrica: string }>();
  const { displayCurrency, activeCampanaId, activeAmbito } = usePrivacy();
  const { data: metricas } = useMetricas(activeCampanaId, activeAmbito);
  const { data: cuentas } = useCuentas();
  const { data: prestamos } = usePrestamos();
  const { data: cheques } = useCheques();
  const { data: movimientos } = useMovimientos();

  const matchScope = (ambito?: string) =>
    activeAmbito === 'TODOS' || (ambito || 'NEGOCIO') === activeAmbito;

  const titleMap: Record<string, string> = {
    liquidez: 'Desglose de Liquidez',
    pasivos: 'Deudas, Cuotas y Cheques Emitidos',
    ingresos: 'Desglose de Ingresos Cobrados',
    costos: 'Desglose de Egresos Pagados',
  };

  const heroVal =
    metrica === 'liquidez'
      ? displayCurrency === 'USD'
        ? metricas?.liquidezConsolidadaUSD || 0
        : metricas?.liquidezConsolidadaPYG || 0
      : metrica === 'pasivos'
      ? displayCurrency === 'USD'
        ? metricas?.pasivoTotalUSD || 0
        : metricas?.pasivoTotalPYG || 0
      : metrica === 'ingresos'
      ? displayCurrency === 'USD'
        ? metricas?.ingresosCampanaUSD || 0
        : metricas?.ingresosCampanaPYG || 0
      : displayCurrency === 'USD'
      ? metricas?.costosCampanaUSD || 0
      : metricas?.costosCampanaPYG || 0;

  const cuentasLiq = (cuentas || []).filter(
    (c) => !isTarjetaCuenta(c.tipo) && matchScope(c.ambito)
  );
  const tarjetasPas = (cuentas || []).filter(
    (c) => isTarjetaCuenta(c.tipo) && c.deudaActual > 0 && matchScope(c.ambito)
  );
  const prestamosPas = (prestamos || []).filter(
    (p) =>
      p.estado !== 'CANCELADO' &&
      (p.direccion || 'PAGAR') === 'PAGAR' &&
      matchScope(p.ambito)
  );
  const chequesPas = (cheques || []).filter(
    (ch) =>
      ch.estado === 'PENDIENTE' &&
      ch.tipo === 'EMITIDO' &&
      matchScope(ch.ambito)
  );
  const movsFiltered = (movimientos || []).filter(
    (m) =>
      !m.anulado &&
      matchScope(m.ambito) &&
      (metrica === 'ingresos' ? isCashInflow(m.tipo) : isCashOutflow(m.tipo))
  );

  return (
    <BaseContainerTemplate
      title={titleMap[metrica || 'liquidez'] || 'Auditoría'}
      subtitle={`Ámbito: ${getAmbitoLabel(activeAmbito)}`}
      heroLabel="Total Consolidado"
      heroAmount={heroVal}
      heroCurrency={displayCurrency}
      quickActions={[
        {
          id: 'back',
          label: 'Volver',
          icon: 'Layers',
          onPress: () => router.back(),
        },
        {
          id: 'reg',
          label: 'Registrar',
          icon: 'Plus',
          onPress: () => router.push('/(modals)/registrar'),
        },
      ]}
    >
      <SectionHeader title="Partidas que Componen este Indicador" />
      <View style={{ gap: 10 }}>
        {metrica === 'liquidez' ? (
          cuentasLiq.length === 0 ? (
            <EmptyState
              title="Sin cuentas activas"
              description="No hay cuentas con saldo en este ámbito."
            />
          ) : (
            cuentasLiq.map((c) => (
              <ListRow
                key={c.id}
                icon={c.icono}
                tone="primary"
                title={c.nombre}
                scope={activeAmbito === 'TODOS' ? c.ambito : undefined}
                badgeText={c.moneda}
                subtitle={c.entidad}
                amount={c.saldoActual}
                currency={c.moneda}
                amountTone="positive"
                onPress={() => router.push(`/cuenta/${c.id}`)}
              />
            ))
          )
        ) : null}

        {metrica === 'pasivos' ? (
          prestamosPas.length === 0 &&
          chequesPas.length === 0 &&
          tarjetasPas.length === 0 ? (
            <EmptyState
              title="Sin deudas ni compromisos"
              description="No hay cuotas, tarjetas ni cheques emitidos pendientes."
            />
          ) : (
            <>
              {chequesPas.map((ch) => (
                <ListRow
                  key={ch.id}
                  icon="Banknote"
                  tone="danger"
                  title={`Cheque Emitido #${ch.numeroCheque}`}
                  scope={activeAmbito === 'TODOS' ? ch.ambito : undefined}
                  badgeText={ch.moneda}
                  subtitle={`Vence: ${ch.fechaCobroPago} · ${ch.contraparte} (${ch.bancoEntidad})`}
                  amount={ch.monto}
                  currency={ch.moneda}
                  amountTone="negative"
                />
              ))}
              {prestamosPas.map((p) => (
                <ListRow
                  key={p.id}
                  icon="CalendarClock"
                  tone="danger"
                  title={p.nombre}
                  scope={activeAmbito === 'TODOS' ? p.ambito : undefined}
                  badgeText={p.moneda}
                  subtitle={`Próx. vence: ${p.proximoVencimiento} · ${p.entidad}`}
                  amount={p.saldoPendiente}
                  currency={p.moneda}
                  amountTone="negative"
                  onPress={() => router.push(`/prestamo/${p.id}`)}
                />
              ))}
              {tarjetasPas.map((t) => (
                <ListRow
                  key={t.id}
                  icon="CreditCard"
                  tone="gold"
                  title={t.nombre}
                  scope={activeAmbito === 'TODOS' ? t.ambito : undefined}
                  badgeText={t.moneda}
                  subtitle={t.entidad}
                  amount={t.deudaActual}
                  currency={t.moneda}
                  amountTone="negative"
                  onPress={() => router.push(`/cuenta/${t.id}`)}
                />
              ))}
            </>
          )
        ) : null}

        {metrica === 'ingresos' || metrica === 'costos' ? (
          movsFiltered.length === 0 ? (
            <EmptyState
              title="Sin movimientos en este indicador"
              description="Los movimientos liquidados aparecerán aquí."
            />
          ) : (
            movsFiltered.map((m) => (
              <ListRow
                key={m.id}
                icon={metrica === 'ingresos' ? 'Wheat' : 'Receipt'}
                tone={metrica === 'ingresos' ? 'primary' : 'gold'}
                title={m.subCategoria}
                scope={activeAmbito === 'TODOS' ? m.ambito : undefined}
                badgeText={m.moneda}
                subtitle={`${m.fecha}${
                  m.contraparte ? ` · ${m.contraparte}` : ''
                } · ${m.concepto}`}
                amount={m.monto}
                currency={m.moneda}
                amountTone={metrica === 'ingresos' ? 'positive' : 'negative'}
              />
            ))
          )
        ) : null}
      </View>
    </BaseContainerTemplate>
  );
}
