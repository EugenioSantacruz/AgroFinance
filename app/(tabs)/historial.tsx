import React, { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Search, X } from 'lucide-react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { BaseContainerTemplate } from '../../src/templates/BaseContainerTemplate';
import {
  AmbitoSwitch,
  Chip,
  EmptyState,
  IconBadge,
  ListRow,
  Money,
  ScopeBadge,
  SectionHeader,
  SkeletonList,
} from '../../src/components/ui';
import { usePrivacy } from '../../src/context/PrivacyContext';
import { useBreakpoint } from '../../src/hooks/useBreakpoint';
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
  const { isDesktop } = useBreakpoint();
  const {
    displayCurrency,
    activeCampanaId,
    activeAmbito,
    setActiveAmbito,
    isPrivate,
  } = usePrivacy();
  const [monedaFilter, setMonedaFilter] = useState<'ALL' | CurrencyCode>('ALL');
  const [tipoFilter, setTipoFilter] = useState<TipoFiltro>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
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

    if (!matchAmbito || !matchMoneda || !matchTipo) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchConcepto = (m.concepto || '').toLowerCase().includes(q);
      const matchContraparte = (m.contraparte || '').toLowerCase().includes(q);
      const matchCat = (m.subCategoria || '').toLowerCase().includes(q);
      if (!matchConcepto && !matchContraparte && !matchCat) return false;
    }

    return true;
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

  const getMovementIcon = (tipo: string, macroCategoria: string) => {
    const isNeutral =
      tipo === 'TRANSFERENCIA' ||
      tipo === 'RETIRO_PERSONAL' ||
      tipo === 'APORTE_NEGOCIO' ||
      tipo === 'PAGO_TARJETA';

    if (tipo === 'CHEQUE_COBRADO' || tipo === 'CHEQUE_PAGADO') return 'Banknote';
    if (tipo === 'PAGO_CUOTA' || tipo === 'COBRO_CUOTA') return 'CalendarClock';
    if (isNeutral) return 'ArrowLeftRight';
    if (macroCategoria === 'HOGAR_ALIMENTACION') return 'Home';
    if (macroCategoria === 'SERVICIOS_SALUD') return 'HeartPulse';
    if (macroCategoria === 'MOVILIDAD_PERSONAL') return 'Car';
    if (macroCategoria === 'INSUMOS_AGRICOLAS') return 'Sprout';
    if (macroCategoria === 'VENTAS_AGRO') return 'Wheat';
    return 'Receipt';
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

      {/* Barra de Filtros & Búsqueda (Optimizada para Desktop & Mobile) */}
      <View style={{ marginTop: 16, gap: 10 }}>
        <SectionHeader title="Filtros & Búsqueda" />

        {/* Buscador de Texto */}
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <Search size={18} color={theme.textMuted} />
          <TextInput
            placeholder="Buscar por concepto, proveedor o categoría..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: theme.textPrimary }]}
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={{ padding: 4 }}
            >
              <X size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Chips de Categoría y Moneda */}
        <View
          style={[
            styles.filterControlsContainer,
            isDesktop && styles.filterControlsDesktop,
          ]}
        >
          {/* Tipos */}
          <ScrollView
            horizontal={!isDesktop}
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

          {/* Monedas */}
          <View style={styles.filtersRow}>
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
        </View>
      </View>

      {/* Undo Bar */}
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

      <View style={{ marginTop: 14 }}>
        <SectionHeader
          title={`Movimientos Registrados (${filtered.length})`}
        />
      </View>

      {isLoading ? (
        <SkeletonList rows={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="Receipt"
          title="Sin movimientos para este filtro"
          description="Cargá un gasto, ingreso, pago de cuota o retiro desde los atajos superiores."
        />
      ) : isDesktop ? (
        /* Vista Tabla Ejecutiva Desktop */
        <View
          style={[
            styles.desktopTableCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          {/* Encabezado de la tabla */}
          <View
            style={[
              styles.tableHeader,
              {
                backgroundColor: theme.surfaceMuted,
                borderBottomColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.th, { width: 100 }, { color: theme.textMuted }]}>
              FECHA
            </Text>
            <Text style={[styles.th, { width: 180 }, { color: theme.textMuted }]}>
              CATEGORÍA
            </Text>
            <Text style={[styles.th, { width: 95 }, { color: theme.textMuted }]}>
              ÁMBITO
            </Text>
            <Text style={[styles.th, { flex: 1 }, { color: theme.textMuted }]}>
              DETALLE / CONTRAPARTE
            </Text>
            <Text
              style={[
                styles.th,
                { width: 150, textAlign: 'right' },
                { color: theme.textMuted },
              ]}
            >
              MONTO
            </Text>
            <Text
              style={[
                styles.th,
                { width: 140, textAlign: 'right' },
                { color: theme.textMuted },
              ]}
            >
              EQUIVALENTE
            </Text>
            <Text
              style={[
                styles.th,
                { width: 90, textAlign: 'center' },
                { color: theme.textMuted },
              ]}
            >
              ACCIÓN
            </Text>
          </View>

          {/* Filas */}
          {filtered.map((m, index) => {
            const isIncome = isCashInflow(m.tipo);
            const isNeutral =
              m.tipo === 'TRANSFERENCIA' ||
              m.tipo === 'RETIRO_PERSONAL' ||
              m.tipo === 'APORTE_NEGOCIO' ||
              m.tipo === 'PAGO_TARJETA';
            const icon = getMovementIcon(m.tipo, m.macroCategoria);
            const canAnnul =
              !m.referenciaId && (isIncome || isCashOutflow(m.tipo));

            const isLast = index === filtered.length - 1;

            return (
              <View
                key={m.id}
                style={[
                  styles.tableRow,
                  { borderBottomColor: theme.border },
                  isLast && { borderBottomWidth: 0 },
                ]}
              >
                {/* Fecha */}
                <View style={{ width: 100 }}>
                  <Text style={[styles.tableCellDate, { color: theme.textSecondary }]}>
                    {m.fecha}
                  </Text>
                </View>

                {/* Categoría con Icono */}
                <View style={[styles.tableCellCat, { width: 180 }]}>
                  <IconBadge
                    icon={icon}
                    size={15}
                    tone={isIncome ? 'primary' : isNeutral ? 'neutral' : 'gold'}
                  />
                  <Text
                    numberOfLines={1}
                    style={[styles.tableCellTitle, { color: theme.textPrimary }]}
                  >
                    {m.subCategoria}
                  </Text>
                </View>

                {/* Ámbito */}
                <View style={{ width: 95 }}>
                  <ScopeBadge scope={m.ambito || 'NEGOCIO'} />
                </View>

                {/* Concepto y Contraparte */}
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text
                    numberOfLines={1}
                    style={[styles.tableCellConcept, { color: theme.textPrimary }]}
                  >
                    {m.concepto}
                  </Text>
                  {m.contraparte ? (
                    <Text
                      numberOfLines={1}
                      style={[styles.tableCellSub, { color: theme.textMuted }]}
                    >
                      {m.contraparte}
                    </Text>
                  ) : null}
                </View>

                {/* Monto Original */}
                <View style={{ width: 150, alignItems: 'flex-end' }}>
                  <Money
                    amount={m.monto}
                    currency={m.moneda}
                    size="md"
                    tone={
                      isNeutral ? 'default' : isIncome ? 'positive' : 'negative'
                    }
                  />
                </View>

                {/* Equivalente Bimoneda */}
                <View style={{ width: 140, alignItems: 'flex-end' }}>
                  <Text style={[styles.tableCellEq, { color: theme.textSecondary }]}>
                    Eq:{' '}
                    {formatMoney(
                      m.moneda === 'USD' ? m.montoPYG : m.montoUSD,
                      m.moneda === 'USD' ? 'PYG' : 'USD',
                      isPrivate
                    )}
                  </Text>
                </View>

                {/* Botón Acción */}
                <View style={{ width: 90, alignItems: 'center' }}>
                  {canAnnul ? (
                    <TouchableOpacity
                      onPress={() => handleAnular(m.id)}
                      style={[
                        styles.tableActionBtn,
                        { backgroundColor: theme.dangerSoft },
                      ]}
                    >
                      <Text
                        style={[
                          styles.tableActionText,
                          { color: theme.danger },
                        ]}
                      >
                        Anular
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={{ fontSize: 11, color: theme.textMuted }}>
                      —
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        /* Vista Móvil Clásica con ListRow */
        <View style={{ gap: 10 }}>
          {filtered.map((m) => {
            const isIncome = isCashInflow(m.tipo);
            const isNeutral =
              m.tipo === 'TRANSFERENCIA' ||
              m.tipo === 'RETIRO_PERSONAL' ||
              m.tipo === 'APORTE_NEGOCIO' ||
              m.tipo === 'PAGO_TARJETA';
            const icon = getMovementIcon(m.tipo, m.macroCategoria);
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  filterControlsContainer: {
    gap: 8,
  },
  filterControlsDesktop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  desktopTableCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  th: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  tableCellDate: {
    fontSize: 12,
    fontWeight: '600',
  },
  tableCellCat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tableCellTitle: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  tableCellConcept: {
    fontSize: 13,
    fontWeight: '500',
  },
  tableCellSub: {
    fontSize: 11,
    marginTop: 2,
  },
  tableCellEq: {
    fontSize: 12,
    fontWeight: '600',
  },
  tableActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  tableActionText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
