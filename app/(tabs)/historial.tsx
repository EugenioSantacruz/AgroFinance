import React, { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { BaseContainerTemplate } from '../../src/templates/BaseContainerTemplate';
import {
  AmbitoSwitch,
  Chip,
  EmptyState,
  ListRow,
  SectionHeader,
  SkeletonList,
} from '../../src/components/ui';
import { usePrivacy } from '../../src/context/PrivacyContext';
import { useMetricas } from '../../src/hooks/useMetricas';
import {
  useAnularMovimiento,
  useMovimientos,
} from '../../src/hooks/useMovimientos';
import {
  isCashInflow,
  isCashOutflow,
} from '../../src/services/mockData';
import { CurrencyCode } from '../../src/types/domain';
import { getAmbitoLabel } from '../../src/utils/accounts';
import { formatMoney } from '../../src/utils/formatters';

type TipoFiltro = 'ALL' | 'INGRESOS' | 'GASTOS' | 'TRANSFERENCIAS';

export default function HistorialScreen() {
  const router = useRouter();
  const {
    displayCurrency,
    activeCampanaId,
    activeAmbito,
    setActiveAmbito,
    isPrivate,
  } = usePrivacy();
  const [monedaFilter, setMonedaFilter] = useState<'ALL' | CurrencyCode>('ALL');
  const [tipoFilter, setTipoFilter] = useState<TipoFiltro>('ALL');
  const { theme } = useTheme();
  const [pendingAnular, setPendingAnular] = useState<string | null>(null);
  const pendingRef = useRef<{
    id: string;
    timer: ReturnType<typeof setTimeout>;
  } | null>(null);

  const {
    data: movimientos,
    isLoading,
    isFetching,
    refetch,
  } = useMovimientos();
  const anularMutation = useAnularMovimiento();
  const { data: metricas, isLoading: loadingMetricas } = useMetricas(
    activeCampanaId,
    activeAmbito
  );

  const filtered = (movimientos || []).filter((m) => {
    if (m.anulado || m.id === pendingAnular) return false;
    const matchAmbito =
      activeAmbito === 'TODOS' || (m.ambito || 'NEGOCIO') === activeAmbito;
    const matchMoneda = monedaFilter === 'ALL' || m.moneda === monedaFilter;
    const matchTipo =
      tipoFilter === 'ALL'
        ? true
        : tipoFilter === 'INGRESOS'
        ? isCashInflow(m.tipo)
        : tipoFilter === 'GASTOS'
        ? isCashOutflow(m.tipo)
        : m.tipo === 'TRANSFERENCIA' ||
          m.tipo === 'RETIRO_PERSONAL' ||
          m.tipo === 'APORTE_NEGOCIO' ||
          m.tipo === 'PAGO_TARJETA';
    return matchAmbito && matchMoneda && matchTipo;
  });

  // Anular con "Deshacer": se aplica a los 6 s salvo que el usuario lo cancele.
  const flushPending = () => {
    const p = pendingRef.current;
    if (!p) return;
    clearTimeout(p.timer);
    pendingRef.current = null;
    setPendingAnular(null);
    anularMutation.mutate({ movimientoId: p.id });
  };

  // Si el usuario sale de la pantalla, se aplica lo que había pedido anular.
  useEffect(() => () => flushPending(), []);

  const handleAnular = (movId: string) => {
    flushPending();
    const timer = setTimeout(() => {
      pendingRef.current = null;
      setPendingAnular(null);
      anularMutation.mutate({ movimientoId: movId });
    }, 6000);
    pendingRef.current = { id: movId, timer };
    setPendingAnular(movId);
  };

  const handleUndoAnular = () => {
    const p = pendingRef.current;
    if (p) clearTimeout(p.timer);
    pendingRef.current = null;
    setPendingAnular(null);
  };

  return (
    <BaseContainerTemplate
      title="Libro Diario"
      subtitle="Asientos Bimoneda (Negocio y Personal)"
      isSyncing={isFetching || anularMutation.isPending}
      isLoadingHero={loadingMetricas}
      heroLabel={`Resultado Neto · ${getAmbitoLabel(activeAmbito)}`}
      heroAmount={
        displayCurrency === 'USD'
          ? metricas?.margenBrutoCampanaUSD || 0
          : metricas?.margenBrutoCampanaPYG || 0
      }
      heroCurrency={displayCurrency}
      heroSecondaryLabel="Egresos acumulados:"
      heroSecondaryAmount={
        displayCurrency === 'USD'
          ? metricas?.costosCampanaUSD || 0
          : metricas?.costosCampanaPYG || 0
      }
      heroSecondaryCurrency={displayCurrency}
      onRefresh={refetch}
      quickActions={[
        {
          id: 'reg',
          label: 'Contado',
          icon: 'Plus',
          onPress: () =>
            router.push({
              pathname: '/(modals)/registrar',
              params: { modo: 'CONTADO' },
            }),
        },
        {
          id: 'chq',
          label: 'Cheque Dif.',
          icon: 'Banknote',
          onPress: () =>
            router.push({
              pathname: '/(modals)/registrar',
              params: { modo: 'CHEQUE' },
            }),
        },
        {
          id: 'trf',
          label: 'Transf/Retiro',
          icon: 'ArrowLeftRight',
          onPress: () => router.push('/(modals)/transferir'),
        },
        {
          id: 'cot',
          label: 'Tasa USD',
          icon: 'Coins',
          onPress: () => router.push('/(modals)/cotizacion'),
        },
      ]}
    >
      <View style={{ marginTop: 14 }}>
        <AmbitoSwitch value={activeAmbito} onChange={setActiveAmbito} />
      </View>

      <SectionHeader title="Filtrar Movimientos" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersRow}
      >
        <Chip
          label="Todos"
          selected={tipoFilter === 'ALL'}
          onPress={() => setTipoFilter('ALL')}
        />
        <Chip
          label="Ingresos"
          icon="TrendingUp"
          selected={tipoFilter === 'INGRESOS'}
          onPress={() => setTipoFilter('INGRESOS')}
        />
        <Chip
          label="Gastos / Pagos"
          icon="TrendingDown"
          selected={tipoFilter === 'GASTOS'}
          onPress={() => setTipoFilter('GASTOS')}
        />
        <Chip
          label="Retiros / Transf."
          icon="ArrowLeftRight"
          selected={tipoFilter === 'TRANSFERENCIAS'}
          onPress={() => setTipoFilter('TRANSFERENCIAS')}
        />
      </ScrollView>

      <View style={[styles.filtersRow, { marginTop: 8 }]}>
        <Chip
          label="PYG + USD"
          selected={monedaFilter === 'ALL'}
          onPress={() => setMonedaFilter('ALL')}
        />
        <Chip
          label="Solo PYG"
          selected={monedaFilter === 'PYG'}
          onPress={() => setMonedaFilter('PYG')}
        />
        <Chip
          label="Solo USD"
          selected={monedaFilter === 'USD'}
          onPress={() => setMonedaFilter('USD')}
        />
      </View>

      {pendingAnular ? (
        <View
          accessibilityLiveRegion="polite"
          style={[
            styles.undoBar,
            { backgroundColor: theme.surface, borderColor: theme.borderStrong },
          ]}
        >
          <Text
            style={{
              flex: 1,
              fontSize: 13,
              fontWeight: '700',
              color: theme.textPrimary,
            }}
          >
            Movimiento anulado
          </Text>
          <TouchableOpacity
            onPress={handleUndoAnular}
            accessibilityRole="button"
            accessibilityLabel="Deshacer anulación"
          >
            <Text
              style={{ color: theme.primary, fontWeight: '800', fontSize: 13 }}
            >
              Deshacer
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <SectionHeader
        title={`Movimientos Registrados (${filtered.length})`}
      />
      {isLoading ? (
        <SkeletonList rows={5} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="Receipt"
          title="Sin movimientos para este filtro"
          description="Cargá un gasto, ingreso, pago de cuota o retiro desde los atajos superiores."
        />
      ) : (
        <View style={{ gap: 10 }}>
          {filtered.map((m) => {
            const isIncome = isCashInflow(m.tipo);
            const isNeutral =
              m.tipo === 'TRANSFERENCIA' ||
              m.tipo === 'RETIRO_PERSONAL' ||
              m.tipo === 'APORTE_NEGOCIO' ||
              m.tipo === 'PAGO_TARJETA';

            const icon =
              m.tipo === 'CHEQUE_COBRADO' || m.tipo === 'CHEQUE_PAGADO'
                ? 'Banknote'
                : m.tipo === 'PAGO_CUOTA' || m.tipo === 'COBRO_CUOTA'
                ? 'CalendarClock'
                : isNeutral
                ? 'ArrowLeftRight'
                : m.macroCategoria === 'HOGAR_ALIMENTACION'
                ? 'Home'
                : m.macroCategoria === 'SERVICIOS_SALUD'
                ? 'HeartPulse'
                : m.macroCategoria === 'MOVILIDAD_PERSONAL'
                ? 'Car'
                : m.macroCategoria === 'INSUMOS_AGRICOLAS'
                ? 'Sprout'
                : m.macroCategoria === 'VENTAS_AGRO'
                ? 'Wheat'
                : 'Receipt';

            const contraparteMeta = m.contraparte ? ` · ${m.contraparte}` : '';
            const canAnnul =
              !m.referenciaId && (isIncome || isCashOutflow(m.tipo));

            return (
              <ListRow
                key={m.id}
                icon={icon}
                tone={isIncome ? 'primary' : isNeutral ? 'neutral' : 'gold'}
                title={m.subCategoria}
                scope={
                  activeAmbito === 'TODOS'
                    ? m.ambito || 'NEGOCIO'
                    : undefined
                }
                badgeText={m.moneda}
                subtitle={`${m.fecha}${contraparteMeta} · ${m.concepto}`}
                amount={m.monto}
                currency={m.moneda}
                amountTone={
                  isNeutral ? 'default' : isIncome ? 'positive' : 'negative'
                }
                secondaryRightText={`Eq ${formatMoney(
                  m.moneda === 'USD' ? m.montoPYG : m.montoUSD,
                  m.moneda === 'USD' ? 'PYG' : 'USD',
                  isPrivate
                )}`}
                actionLabel={canAnnul ? 'Anular' : undefined}
                actionTone="danger"
                onActionPress={canAnnul ? () => handleAnular(m.id) : undefined}
              />
            );
          })}
        </View>
      )}
    </BaseContainerTemplate>
  );
}

const styles = StyleSheet.create({
  undoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
  },
});
