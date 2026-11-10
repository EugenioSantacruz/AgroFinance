import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BaseContainerTemplate } from '../../src/templates/BaseContainerTemplate';
import {
  AmbitoSwitch,
  Card,
  Chip,
  EmptyState,
  IconBadge,
  ListRow,
  Money,
  SectionHeader,
  SkeletonList,
} from '../../src/components/ui';
import { usePrivacy } from '../../src/context/PrivacyContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useFlujoProyectado } from '../../src/hooks/useFlujoProyectado';
import { AgendaEventoItem } from '../../src/types/domain';
import { getAmbitoLabel } from '../../src/utils/accounts';
import { formatRelativeDueLabel } from '../../src/utils/dates';
import { formatMoney } from '../../src/utils/formatters';

type AgendaFilter = 'TODOS' | 'PAGAR' | 'COBRAR' | 'CHEQUES' | 'CUOTAS';

export default function AgendaYCajaScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { displayCurrency, activeAmbito, setActiveAmbito, isPrivate } =
    usePrivacy();
  const [filter, setFilter] = useState<AgendaFilter>('TODOS');

  const {
    data: flujo,
    isLoading,
    isFetching,
    refetch,
  } = useFlujoProyectado(activeAmbito);

  const pickVal = (pyg?: number, usd?: number) =>
    displayCurrency === 'USD' ? usd || 0 : pyg || 0;

  const eventosFiltrados = (flujo?.eventos || []).filter((ev) => {
    if (filter === 'PAGAR') return ev.direccion === 'EGRESO';
    if (filter === 'COBRAR') return ev.direccion === 'INGRESO';
    if (filter === 'CHEQUES') return Boolean(ev.chequeId);
    if (filter === 'CUOTAS') return Boolean(ev.cuotaId);
    return true;
  });

  const vencidos = eventosFiltrados.filter((e) => e.ventana === 'VENCIDO');
  const estaSemana = eventosFiltrados.filter(
    (e) => e.ventana === 'ESTA_SEMANA'
  );
  const esteMes = eventosFiltrados.filter(
    (e) => e.ventana === 'PROXIMOS_30_DIAS'
  );
  const posteriores = eventosFiltrados.filter((e) => e.ventana === 'POSTERIOR');

  const openLiquidar = (ev: AgendaEventoItem) => {
    router.push({
      pathname: '/(modals)/liquidar',
      params: {
        tipo: ev.chequeId ? 'CHEQUE' : 'CUOTA',
        chequeId: ev.chequeId || '',
        prestamoId: ev.prestamoId || '',
        cuotaId: ev.cuotaId || '',
        titulo: ev.titulo,
        monto: String(ev.monto),
        moneda: ev.moneda,
        direccion: ev.direccion,
        cuentaSugeridaId: ev.cuentaSugeridaId || '',
        ambito: ev.ambito,
      },
    });
  };

  const renderSection = (title: string, items: AgendaEventoItem[]) => {
    if (items.length === 0) return null;
    return (
      <View>
        <SectionHeader title={`${title} (${items.length})`} />
        <View style={{ gap: 10 }}>
          {items.map((ev) => {
            const isIncome = ev.direccion === 'INGRESO';
            return (
              <ListRow
                key={ev.id}
                icon={
                  ev.chequeId
                    ? 'Banknote'
                    : isIncome
                    ? 'ArrowDownLeft'
                    : 'CalendarClock'
                }
                tone={
                  ev.diasRestantes < 0
                    ? 'danger'
                    : isIncome
                    ? 'primary'
                    : 'gold'
                }
                title={ev.titulo}
                scope={activeAmbito === 'TODOS' ? ev.ambito : undefined}
                badgeText={ev.moneda}
                subtitle={`${ev.fechaVencimiento} (${formatRelativeDueLabel(
                  ev.diasRestantes
                )}) · ${ev.contraparte}${
                  ev.entidadBancaria ? ` · ${ev.entidadBancaria}` : ''
                }`}
                amount={ev.monto}
                currency={ev.moneda}
                amountTone={isIncome ? 'positive' : 'negative'}
                actionLabel={isIncome ? 'Cobrar' : 'Pagar'}
                actionTone={isIncome ? 'primary' : 'gold'}
                onActionPress={() => openLiquidar(ev)}
                onPress={
                  ev.prestamoId
                    ? () => router.push(`/prestamo/${ev.prestamoId}`)
                    : undefined
                }
              />
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <BaseContainerTemplate
      title="Agenda & Flujo Proyectado"
      subtitle="Cheques Diferidos, Cuotas y Previsión de Caja"
      isSyncing={isFetching}
      isLoadingHero={isLoading}
      heroLabel={`Saldo Proyectado a 30 Días · ${getAmbitoLabel(activeAmbito)}`}
      heroAmount={pickVal(
        flujo?.proximos30Dias.saldoFinalPYG,
        flujo?.proximos30Dias.saldoFinalUSD
      )}
      heroCurrency={displayCurrency}
      heroSecondaryLabel="Saldo Real Disponible Hoy:"
      heroSecondaryAmount={pickVal(flujo?.saldoActualPYG, flujo?.saldoActualUSD)}
      heroSecondaryCurrency={displayCurrency}
      onRefresh={refetch}
      quickActions={[
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
          id: 'cuo',
          label: 'En Cuotas',
          icon: 'CalendarClock',
          onPress: () =>
            router.push({
              pathname: '/(modals)/registrar',
              params: { modo: 'CUOTAS' },
            }),
        },
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
          id: 'cot',
          label: 'Tasa BCP',
          icon: 'Coins',
          onPress: () => router.push('/(modals)/cotizacion'),
        },
      ]}
    >
      <View style={{ marginTop: 14 }}>
        <AmbitoSwitch value={activeAmbito} onChange={setActiveAmbito} />
      </View>

      {flujo?.alertaDeficit ? (
        <Card
          style={[
            styles.alertCard,
            { backgroundColor: theme.dangerSoft, borderColor: theme.danger },
          ]}
        >
          <View style={styles.alertRow}>
            <IconBadge icon="AlertTriangle" tone="danger" />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.alertTitle, { color: theme.danger }]}>
                Atención: Déficit proyectado el {flujo.alertaDeficit.fecha}
              </Text>
              <Text style={[styles.alertSub, { color: theme.textPrimary }]}>
                Al vencer "{flujo.alertaDeficit.eventoTitulo}" el saldo cae a{' '}
                {formatMoney(
                  pickVal(
                    flujo.alertaDeficit.saldoProyectadoPYG,
                    flujo.alertaDeficit.saldoProyectadoUSD
                  ),
                  displayCurrency,
                  isPrivate
                )}{' '}
                antes de tus próximos cobros.
              </Text>
            </View>
          </View>
        </Card>
      ) : null}

      {/* Horizontes 7 días y 30 días */}
      <SectionHeader title="Horizontes de Flujo de Caja" />
      <View style={styles.windowsGrid}>
        <Card style={styles.windowCard}>
          <Text style={[styles.windowTitle, { color: theme.textSecondary }]}>
            PRÓXIMOS 7 DÍAS
          </Text>
          <Text style={[styles.windowLine, { color: theme.success }]}>
            +{' '}
            {formatMoney(
              pickVal(
                flujo?.proximos7Dias.ingresosPYG,
                flujo?.proximos7Dias.ingresosUSD
              ),
              displayCurrency,
              isPrivate
            )}
          </Text>
          <Text style={[styles.windowLine, { color: theme.danger }]}>
            -{' '}
            {formatMoney(
              pickVal(
                flujo?.proximos7Dias.egresosPYG,
                flujo?.proximos7Dias.egresosUSD
              ),
              displayCurrency,
              isPrivate
            )}
          </Text>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <Money
            amount={pickVal(
              flujo?.proximos7Dias.saldoFinalPYG,
              flujo?.proximos7Dias.saldoFinalUSD
            )}
            currency={displayCurrency}
            size="md"
            tone={
              (flujo?.proximos7Dias.saldoFinalPYG || 0) >= 0
                ? 'positive'
                : 'negative'
            }
          />
        </Card>

        <Card style={styles.windowCard}>
          <Text style={[styles.windowTitle, { color: theme.textSecondary }]}>
            PRÓXIMOS 30 DÍAS
          </Text>
          <Text style={[styles.windowLine, { color: theme.success }]}>
            +{' '}
            {formatMoney(
              pickVal(
                flujo?.proximos30Dias.ingresosPYG,
                flujo?.proximos30Dias.ingresosUSD
              ),
              displayCurrency,
              isPrivate
            )}
          </Text>
          <Text style={[styles.windowLine, { color: theme.danger }]}>
            -{' '}
            {formatMoney(
              pickVal(
                flujo?.proximos30Dias.egresosPYG,
                flujo?.proximos30Dias.egresosUSD
              ),
              displayCurrency,
              isPrivate
            )}
          </Text>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <Money
            amount={pickVal(
              flujo?.proximos30Dias.saldoFinalPYG,
              flujo?.proximos30Dias.saldoFinalUSD
            )}
            currency={displayCurrency}
            size="md"
            tone={
              (flujo?.proximos30Dias.saldoFinalPYG || 0) >= 0
                ? 'positive'
                : 'negative'
            }
          />
        </Card>
      </View>

      {/* Filtros de Agenda */}
      <SectionHeader title="Agenda Cronológica de Vencimientos" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersRow}
      >
        <Chip
          label="Todos"
          selected={filter === 'TODOS'}
          onPress={() => setFilter('TODOS')}
        />
        <Chip
          label="A Pagar"
          icon="TrendingDown"
          selected={filter === 'PAGAR'}
          onPress={() => setFilter('PAGAR')}
        />
        <Chip
          label="A Cobrar"
          icon="TrendingUp"
          selected={filter === 'COBRAR'}
          onPress={() => setFilter('COBRAR')}
        />
        <Chip
          label="Cheques"
          icon="Banknote"
          selected={filter === 'CHEQUES'}
          onPress={() => setFilter('CHEQUES')}
        />
        <Chip
          label="Cuotas"
          icon="CalendarClock"
          selected={filter === 'CUOTAS'}
          onPress={() => setFilter('CUOTAS')}
        />
      </ScrollView>

      {isLoading ? (
        <View style={{ marginTop: 12 }}>
          <SkeletonList rows={4} />
        </View>
      ) : eventosFiltrados.length === 0 ? (
        <View style={{ marginTop: 12 }}>
          <EmptyState
            icon="CalendarClock"
            title="Agenda al día"
            description="No hay cheques diferidos ni cuotas pendientes para este filtro."
          />
        </View>
      ) : (
        <>
          {renderSection('Vencidos', vencidos)}
          {renderSection('Esta Semana (0 a 7 días)', estaSemana)}
          {renderSection('Este Mes (8 a 30 días)', esteMes)}
          {renderSection('Próximos Meses (+30 días)', posteriores)}
        </>
      )}
    </BaseContainerTemplate>
  );
}

const styles = StyleSheet.create({
  alertCard: {
    marginTop: 14,
    padding: 13,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  alertSub: {
    fontSize: 12,
    lineHeight: 17,
  },
  windowsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  windowCard: {
    flex: 1,
    gap: 5,
    padding: 13,
  },
  windowTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  windowLine: {
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
});
