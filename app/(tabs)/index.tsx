import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BaseContainerTemplate } from '../../src/templates/BaseContainerTemplate';
import {
  AmbitoSwitch,
  Card,
  EmptyState,
  IconBadge,
  ListRow,
  Money,
  SectionHeader,
  SecureButton,
  SkeletonList,
  SkeletonPillarsGrid,
} from '../../src/components/ui';
import { usePrivacy } from '../../src/context/PrivacyContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useBreakpoint } from '../../src/hooks/useBreakpoint';
import { useCuentas } from '../../src/hooks/useCuentas';
import { useFlujoProyectado } from '../../src/hooks/useFlujoProyectado';
import { useMetricas } from '../../src/hooks/useMetricas';
import { usePrestamos } from '../../src/hooks/usePrestamos';
import {
  getAmbitoLabel,
  getTipoCuentaLabel,
  isTarjetaCuenta,
} from '../../src/utils/accounts';
import { formatRelativeDueLabel } from '../../src/utils/dates';
import { formatMoney, formatNumberPY } from '../../src/utils/formatters';

export default function DashboardScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { isDesktop } = useBreakpoint();
  const {
    displayCurrency,
    activeCampanaId,
    activeAmbito,
    setActiveAmbito,
    isPrivate,
  } = usePrivacy();

  const {
    data: metricas,
    isLoading: loadingMetricas,
    isFetching: fetchingMetricas,
    refetch: refetchMetricas,
  } = useMetricas(activeCampanaId, activeAmbito);

  const {
    data: flujo,
    refetch: refetchFlujo,
  } = useFlujoProyectado(activeAmbito);

  const {
    data: cuentas,
    isLoading: loadingCuentas,
    refetch: refetchCuentas,
  } = useCuentas();

  const {
    data: prestamos,
    isLoading: loadingPrestamos,
    refetch: refetchPrestamos,
  } = usePrestamos();

  const handleRefresh = () => {
    refetchMetricas();
    refetchCuentas();
    refetchFlujo();
    refetchPrestamos();
  };

  const cuentasFiltradas = (cuentas || []).filter(
    (c) => activeAmbito === 'TODOS' || (c.ambito || 'NEGOCIO') === activeAmbito
  );

  const prestamosFiltrados = (prestamos || []).filter(
    (p) =>
      p.estado !== 'CANCELADO' &&
      (activeAmbito === 'TODOS' || (p.ambito || 'NEGOCIO') === activeAmbito)
  );

  const proximosEventos = (flujo?.eventos || []).slice(0, 5);

  const heroPrimary =
    displayCurrency === 'USD'
      ? metricas?.patrimonioNetoUSD || 0
      : metricas?.patrimonioNetoPYG || 0;

  const heroSecondary =
    displayCurrency === 'USD'
      ? metricas?.patrimonioNetoPYG || 0
      : metricas?.patrimonioNetoUSD || 0;

  const heroSecondaryCurr = displayCurrency === 'USD' ? 'PYG' : 'USD';

  const proj30 =
    displayCurrency === 'USD'
      ? flujo?.proximos30Dias.saldoFinalUSD || 0
      : flujo?.proximos30Dias.saldoFinalPYG || 0;

  const cobrar30 =
    displayCurrency === 'USD'
      ? flujo?.proximos30Dias.ingresosUSD || 0
      : flujo?.proximos30Dias.ingresosPYG || 0;

  const pagar30 =
    displayCurrency === 'USD'
      ? flujo?.proximos30Dias.egresosUSD || 0
      : flujo?.proximos30Dias.egresosPYG || 0;

  // Componentes modulares reutilizables para Desktop / Mobile
  const renderAlertaDeficit = () => {
    if (!flujo?.alertaDeficit) return null;
    return (
      <Card
        onPress={() => router.push('/(tabs)/resumen')}
        style={[
          styles.alertCard,
          {
            backgroundColor: theme.dangerSoft,
            borderColor: theme.danger,
          },
        ]}
      >
        <View style={styles.alertRow}>
          <IconBadge icon="AlertTriangle" tone="danger" />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[styles.alertTitle, { color: theme.danger }]}>
              Alerta de Quiebre de Caja ({flujo.alertaDeficit.fecha})
            </Text>
            <Text style={[styles.alertSub, { color: theme.textPrimary }]}>
              Tras "{flujo.alertaDeficit.eventoTitulo}" tu saldo proyectado cae a{' '}
              {formatMoney(
                displayCurrency === 'USD'
                  ? flujo.alertaDeficit.saldoProyectadoUSD
                  : flujo.alertaDeficit.saldoProyectadoPYG,
                displayCurrency,
                isPrivate
              )}
            </Text>
          </View>
        </View>
      </Card>
    );
  };

  const renderPrevisionCaja = () => (
    <View style={{ gap: 8 }}>
      <SectionHeader
        title="Previsión de Caja (Próximos 30 días)"
        actionLabel="Ver Agenda"
        onActionPress={() => router.push('/(tabs)/resumen')}
      />
      <Card
        onPress={() => router.push('/(tabs)/resumen')}
        style={{ gap: 10, padding: 14 }}
      >
        <View style={styles.flowSummaryRow}>
          <View style={styles.flowCell}>
            <Text style={[styles.flowLabel, { color: theme.textSecondary }]}>
              A COBRAR
            </Text>
            <Money
              amount={cobrar30}
              currency={displayCurrency}
              size="sm"
              tone="positive"
            />
          </View>
          <View style={styles.flowCell}>
            <Text style={[styles.flowLabel, { color: theme.textSecondary }]}>
              A PAGAR
            </Text>
            <Money
              amount={pagar30}
              currency={displayCurrency}
              size="sm"
              tone="negative"
            />
          </View>
          <View style={styles.flowCell}>
            <Text style={[styles.flowLabel, { color: theme.textSecondary }]}>
              SALDO PROY. 30D
            </Text>
            <Money
              amount={proj30}
              currency={displayCurrency}
              size="md"
              tone={proj30 >= 0 ? 'positive' : 'negative'}
            />
          </View>
        </View>
      </Card>
    </View>
  );

  const renderPilaresFinancieros = () => (
    <View style={{ gap: 8 }}>
      <SectionHeader title="Pilares Financieros Bimoneda" />
      {loadingMetricas ? (
        <SkeletonPillarsGrid />
      ) : (
        <View style={[styles.pillarsGrid, isDesktop && styles.pillarsGridDesktop]}>
          <Card
            style={[styles.pillarCard, isDesktop && styles.pillarCardDesktop]}
            onPress={() => router.push('/desglose/liquidez')}
          >
            <IconBadge icon="Landmark" tone="primary" />
            <Text style={[styles.pillarLabel, { color: theme.textSecondary }]}>
              Liquidez Disponible
            </Text>
            <Money
              amount={
                displayCurrency === 'USD'
                  ? metricas?.liquidezConsolidadaUSD || 0
                  : metricas?.liquidezConsolidadaPYG || 0
              }
              currency={displayCurrency}
              size="lg"
              tone="positive"
            />
            <Text style={[styles.pillarSub, { color: theme.textMuted }]}>
              USD: {formatMoney(metricas?.liquidezNativaUSD, 'USD', isPrivate)}{' '}
              · PYG:{' '}
              {formatMoney(metricas?.liquidezNativaPYG, 'PYG', isPrivate)}
            </Text>
          </Card>

          <Card
            style={[styles.pillarCard, isDesktop && styles.pillarCardDesktop]}
            onPress={() => router.push('/desglose/pasivos')}
          >
            <IconBadge icon="CalendarClock" tone="danger" />
            <Text style={[styles.pillarLabel, { color: theme.textSecondary }]}>
              Deudas & Cheques
            </Text>
            <Money
              amount={
                displayCurrency === 'USD'
                  ? metricas?.pasivoTotalUSD || 0
                  : metricas?.pasivoTotalPYG || 0
              }
              currency={displayCurrency}
              size="lg"
              tone="negative"
            />
            <Text style={[styles.pillarSub, { color: theme.textMuted }]}>
              Cuotas + Cheques Emit. + Tarjetas
            </Text>
          </Card>

          <Card
            style={[styles.pillarCard, isDesktop && styles.pillarCardDesktop]}
            onPress={() => router.push('/desglose/ingresos')}
          >
            <IconBadge icon="TrendingUp" tone="primary" />
            <Text style={[styles.pillarLabel, { color: theme.textSecondary }]}>
              Ingresos Cobrados
            </Text>
            <Money
              amount={
                displayCurrency === 'USD'
                  ? metricas?.ingresosCampanaUSD || 0
                  : metricas?.ingresosCampanaPYG || 0
              }
              currency={displayCurrency}
              size="lg"
            />
            <Text style={[styles.pillarSub, { color: theme.textMuted }]}>
              Contado + Cheques/Cuotas cobr.
            </Text>
          </Card>

          <Card
            style={[styles.pillarCard, isDesktop && styles.pillarCardDesktop]}
            onPress={() => router.push('/desglose/costos')}
          >
            <IconBadge icon="Fuel" tone="gold" />
            <Text style={[styles.pillarLabel, { color: theme.textSecondary }]}>
              Egresos Pagados
            </Text>
            <Money
              amount={
                displayCurrency === 'USD'
                  ? metricas?.costosCampanaUSD || 0
                  : metricas?.costosCampanaPYG || 0
              }
              currency={displayCurrency}
              size="lg"
            />
            <Text style={[styles.pillarSub, { color: theme.textMuted }]}>
              Neto:{' '}
              {formatMoney(
                displayCurrency === 'USD'
                  ? metricas?.margenBrutoCampanaUSD
                  : metricas?.margenBrutoCampanaPYG,
                displayCurrency,
                isPrivate
              )}
            </Text>
          </Card>
        </View>
      )}
    </View>
  );

  const renderProximosVencimientos = () => (
    <View style={{ gap: 8 }}>
      <SectionHeader
        title="Próximos Vencimientos (Cheques y Cuotas)"
        actionLabel="Agenda Completa"
        onActionPress={() => router.push('/(tabs)/resumen')}
      />
      {proximosEventos.length === 0 ? (
        <EmptyState
          icon="CalendarClock"
          title="Sin vencimientos pendientes"
          description="Cargá un cheque diferido o compra en cuotas desde el botón superior."
        />
      ) : (
        <View style={{ gap: 8 }}>
          {proximosEventos.map((ev) => {
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
                )}) · ${ev.contraparte}`}
                amount={ev.monto}
                currency={ev.moneda}
                amountTone={isIncome ? 'positive' : 'negative'}
                actionLabel={isIncome ? 'Cobrar' : 'Pagar'}
                actionTone={isIncome ? 'primary' : 'gold'}
                onActionPress={() =>
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
                  })
                }
                onPress={() =>
                  ev.prestamoId
                    ? router.push(`/prestamo/${ev.prestamoId}`)
                    : router.push('/(tabs)/resumen')
                }
              />
            );
          })}
        </View>
      )}
    </View>
  );

  const renderCuentasYCajas = () => (
    <View style={{ gap: 8 }}>
      <SectionHeader
        title="Cuentas, Cajas y Tarjetas"
        actionLabel="+ Nueva Cuenta"
        onActionPress={() => router.push('/(modals)/crear-cuenta')}
      />
      {loadingCuentas ? (
        <SkeletonList rows={3} />
      ) : cuentasFiltradas.length === 0 ? (
        <Card style={{ gap: 12 }}>
          <EmptyState
            icon="Landmark"
            title="Sin cuentas en este ámbito"
            description="Agregá tu cuenta bancaria, caja de efectivo o tarjeta para comenzar."
          />
          <SecureButton
            label="Crear Primera Cuenta"
            icon="Plus"
            onPress={() => router.push('/(modals)/crear-cuenta')}
          />
        </Card>
      ) : (
        <View style={{ gap: 8 }}>
          {cuentasFiltradas.map((cta) => {
            const isCard = isTarjetaCuenta(cta.tipo);
            return (
              <ListRow
                key={cta.id}
                icon={cta.icono}
                tone={isCard ? 'gold' : 'primary'}
                title={cta.nombre}
                scope={
                  activeAmbito === 'TODOS'
                    ? cta.ambito || 'NEGOCIO'
                    : undefined
                }
                badgeText={cta.moneda}
                subtitle={`${cta.entidad} · ${getTipoCuentaLabel(cta.tipo)}`}
                amount={isCard ? cta.deudaActual : cta.saldoActual}
                currency={cta.moneda}
                amountTone={isCard ? 'negative' : 'default'}
                secondaryRightText={
                  isCard
                    ? `Disp: ${formatMoney(
                        cta.disponibleCredito,
                        cta.moneda,
                        isPrivate
                      )}`
                    : `Eq: ${formatMoney(
                        cta.moneda === 'USD'
                          ? cta.equivalentePYG
                          : cta.equivalenteUSD,
                        cta.moneda === 'USD' ? 'PYG' : 'USD',
                        isPrivate
                      )}`
                }
                onPress={() => router.push(`/cuenta/${cta.id}`)}
              />
            );
          })}
        </View>
      )}
    </View>
  );

  const renderPlanesFinanciacion = () => {
    if (loadingPrestamos) {
      return (
        <View style={{ gap: 8 }}>
          <SectionHeader title="Planes en Cuotas & Financiación" />
          <SkeletonList rows={2} />
        </View>
      );
    }
    if (prestamosFiltrados.length === 0) return null;

    return (
      <View style={{ gap: 8 }}>
        <SectionHeader title="Planes en Cuotas & Financiación Activa" />
        <View style={{ gap: 8 }}>
          {prestamosFiltrados.map((pr) => (
            <ListRow
              key={pr.id}
              icon="CalendarClock"
              tone={pr.direccion === 'COBRAR' ? 'primary' : 'gold'}
              title={pr.nombre}
              scope={
                activeAmbito === 'TODOS'
                  ? pr.ambito || 'NEGOCIO'
                  : undefined
              }
              badgeText={pr.moneda}
              subtitle={`${pr.entidad} · Próx. Venc: ${pr.proximoVencimiento}`}
              amount={pr.saldoPendiente}
              currency={pr.moneda}
              amountTone={
                pr.direccion === 'COBRAR' ? 'positive' : 'negative'
              }
              secondaryRightText={`Cuota ${pr.cuotasPagadas + 1}/${
                pr.cuotasTotales
              }: ${formatMoney(pr.montoProximaCuota, pr.moneda, isPrivate)}`}
              onPress={() => router.push(`/prestamo/${pr.id}`)}
            />
          ))}
        </View>
      </View>
    );
  };

  return (
    <BaseContainerTemplate
      title="AgroFinance PY"
      subtitle="Negocio, Finanzas Personales & Flujo Bimoneda"
      isSyncing={fetchingMetricas}
      isLoadingHero={loadingMetricas}
      heroLabel={`Patrimonio Neto · ${getAmbitoLabel(activeAmbito)}`}
      heroAmount={heroPrimary}
      heroCurrency={displayCurrency}
      heroSecondaryLabel="Equivalente en"
      heroSecondaryAmount={heroSecondary}
      heroSecondaryCurrency={heroSecondaryCurr}
      exchangeRateBadge={`TC BCP: Gs. ${formatNumberPY(
        metricas?.tasaCambioReferencia || 7835
      )}`}
      onRefresh={handleRefresh}
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
          id: 'cheque',
          label: 'Cheque Dif.',
          icon: 'Banknote',
          onPress: () =>
            router.push({
              pathname: '/(modals)/registrar',
              params: { modo: 'CHEQUE' },
            }),
        },
        {
          id: 'cuotas',
          label: 'En Cuotas',
          icon: 'CalendarClock',
          onPress: () =>
            router.push({
              pathname: '/(modals)/registrar',
              params: { modo: 'CUOTAS' },
            }),
        },
        {
          id: 'trf',
          label: 'Transf/Retiro',
          icon: 'ArrowLeftRight',
          onPress: () => router.push('/(modals)/transferir'),
        },
      ]}
    >
      {/* Selector de Ámbito: Todos / Negocio / Personal */}
      <View style={{ marginTop: 14 }}>
        <AmbitoSwitch value={activeAmbito} onChange={setActiveAmbito} />
      </View>

      {/* Pilares Financieros: En Desktop ocupan la fila completa superior (1x4) */}
      <View style={{ marginTop: 16 }}>
        {renderPilaresFinancieros()}
      </View>

      {/* Grid Desktop 2 Columnas vs Flujo Mobile Vertical */}
      {isDesktop ? (
        <View style={styles.desktopColumnsLayout}>
          {/* Columna Izquierda: Cuentas y Financiación (60% ancho) */}
          <View style={styles.desktopLeftColumn}>
            {renderCuentasYCajas()}
            {renderPlanesFinanciacion()}
          </View>

          {/* Columna Derecha: Previsión, Alertas y Vencimientos (40% ancho) */}
          <View style={styles.desktopRightColumn}>
            {renderAlertaDeficit()}
            {renderPrevisionCaja()}
            {renderProximosVencimientos()}
          </View>
        </View>
      ) : (
        /* Modo Mobile */
        <View style={{ gap: 14, marginTop: 14 }}>
          {renderAlertaDeficit()}
          {renderPrevisionCaja()}
          {renderProximosVencimientos()}
          {renderCuentasYCajas()}
          {renderPlanesFinanciacion()}
        </View>
      )}
    </BaseContainerTemplate>
  );
}

const styles = StyleSheet.create({
  alertCard: {
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
  flowSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  flowCell: {
    flex: 1,
    gap: 4,
  },
  flowLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  pillarsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  pillarsGridDesktop: {
    flexWrap: 'nowrap',
    gap: 12,
  },
  pillarCard: {
    width: '48.5%',
    gap: 6,
  },
  pillarCardDesktop: {
    width: 'auto',
    flex: 1,
    padding: 16,
  },
  pillarLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  pillarSub: {
    fontSize: 11,
  },
  desktopColumnsLayout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 20,
    marginTop: 18,
  },
  desktopLeftColumn: {
    flex: 1.15,
    gap: 18,
  },
  desktopRightColumn: {
    flex: 0.85,
    gap: 18,
  },
});
