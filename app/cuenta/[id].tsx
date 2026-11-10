import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BaseContainerTemplate } from '../../src/templates/BaseContainerTemplate';
import {
  EmptyState,
  ListRow,
  SectionHeader,
} from '../../src/components/ui';
import { useCuentas } from '../../src/hooks/useCuentas';
import { useMovimientos } from '../../src/hooks/useMovimientos';
import { isCashInflow } from '../../src/services/mockData';
import { getTipoCuentaLabel, isTarjetaCuenta } from '../../src/utils/accounts';

export default function DetalleCuentaScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: cuentas, isLoading } = useCuentas();
  const { data: movimientos } = useMovimientos();

  const cuenta = (cuentas || []).find((c) => c.id === id);
  const movsCuenta = (movimientos || []).filter(
    (m) => !m.anulado && (m.cuentaId === id || m.cuentaDestinoId === id)
  );

  if (!cuenta) {
    return (
      <BaseContainerTemplate
        title="Detalle de Cuenta"
        heroLabel="Saldo Disponible"
        heroAmount={0}
        heroCurrency="PYG"
        isLoadingHero={isLoading}
      >
        <EmptyState
          title="Cuenta no encontrada"
          description="Regresá al panel principal para seleccionar una cuenta válida."
        />
      </BaseContainerTemplate>
    );
  }

  const isCard = isTarjetaCuenta(cuenta.tipo);

  return (
    <BaseContainerTemplate
      title={cuenta.nombre}
      subtitle={`${cuenta.entidad} · ${getTipoCuentaLabel(cuenta.tipo)} · ${
        cuenta.ambito === 'PERSONAL' ? 'Personal' : 'Negocio'
      }`}
      heroLabel={
        isCard ? 'Deuda Acumulada a Pagar' : 'Saldo Disponible en Moneda Nativa'
      }
      heroAmount={isCard ? cuenta.deudaActual : cuenta.saldoActual}
      heroCurrency={cuenta.moneda}
      heroSecondaryLabel={
        isCard ? 'Límite Disponible:' : 'Equivalente Bimoneda:'
      }
      heroSecondaryAmount={
        isCard
          ? cuenta.disponibleCredito
          : cuenta.moneda === 'USD'
          ? cuenta.equivalentePYG
          : cuenta.equivalenteUSD
      }
      heroSecondaryCurrency={
        isCard ? cuenta.moneda : cuenta.moneda === 'USD' ? 'PYG' : 'USD'
      }
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
        {
          id: 'trf',
          label: 'Transferir',
          icon: 'ArrowLeftRight',
          onPress: () => router.push('/(modals)/transferir'),
        },
        {
          id: 'conc',
          label: 'Conciliar',
          icon: 'Scale',
          onPress: () => router.push('/(modals)/ajustar-saldo'),
        },
      ]}
    >
      <SectionHeader
        title={`Extracto de Movimientos (${movsCuenta.length})`}
      />
      {movsCuenta.length === 0 ? (
        <EmptyState
          title="Sin movimientos recientes"
          description="No se registran asientos en esta cuenta."
        />
      ) : (
        <View style={{ gap: 10 }}>
          {movsCuenta.map((m) => {
            const incomingHere =
              isCashInflow(m.tipo) || m.cuentaDestinoId === id;
            return (
              <ListRow
                key={m.id}
                icon={incomingHere ? 'TrendingUp' : 'TrendingDown'}
                tone={incomingHere ? 'primary' : 'gold'}
                title={m.subCategoria}
                scope={m.ambito}
                badgeText={m.moneda}
                subtitle={`${m.fecha}${
                  m.contraparte ? ` · ${m.contraparte}` : ''
                } · ${m.concepto}`}
                amount={m.monto}
                currency={m.moneda}
                amountTone={incomingHere ? 'positive' : 'negative'}
              />
            );
          })}
        </View>
      )}
    </BaseContainerTemplate>
  );
}
