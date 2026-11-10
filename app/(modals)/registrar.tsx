import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SecureFormTemplate } from '../../src/templates/SecureFormTemplate';
import {
  AmbitoSwitch,
  AmountInput,
  Chip,
  EmptyState,
  SectionHeader,
  SecureButton,
} from '../../src/components/ui';
import { usePrivacy } from '../../src/context/PrivacyContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useCategorias } from '../../src/hooks/useCategorias';
import { useCheques, useCrearCheque } from '../../src/hooks/useCheques';
import { useCotizacion } from '../../src/hooks/useCotizacion';
import { useCuentas } from '../../src/hooks/useCuentas';
import {
  useMovimientos,
  useRegistrarMovimiento,
} from '../../src/hooks/useMovimientos';
import {
  useCrearCompraCuotas,
  usePrestamos,
} from '../../src/hooks/usePrestamos';
import {
  AmbitoFinanciero,
  CurrencyCode,
  MacroCategoriaAgro,
  PeriodicidadCuota,
  TipoChequeDiferido,
} from '../../src/types/domain';
import { canDebitFromAccount, isTarjetaCuenta } from '../../src/utils/accounts';
import {
  addDaysDDMMYYYY,
  generateInstallmentDates,
  getNextMonthDayDDMMYYYY,
  getTodayDDMMYYYY,
  getYesterdayDDMMYYYY,
  isValidDDMMYYYY,
} from '../../src/utils/dates';
import { convertCurrency, formatMoney } from '../../src/utils/formatters';

type ModoRegistro = 'CONTADO' | 'CHEQUE' | 'CUOTAS';

const BANCOS_SUGERIDOS = [
  'Banco Itaú',
  'Banco Sudameris',
  'Banco Continental',
  'Ueno Bank',
  'Banco Familiar',
  'BNF',
];

export default function RegistrarMovimientoModal() {
  const router = useRouter();
  const { modo } = useLocalSearchParams<{ modo?: string }>();
  const { theme } = useTheme();
  const { activeAmbito } = usePrivacy();

  const { data: cuentas } = useCuentas();
  const { data: categorias } = useCategorias();
  const { data: cotizacion } = useCotizacion();
  const { data: movimientos } = useMovimientos();
  const { data: cheques } = useCheques();
  const { data: prestamos } = usePrestamos();

  const registrarMutation = useRegistrarMovimiento();
  const crearChequeMutation = useCrearCheque();
  const crearCuotasMutation = useCrearCompraCuotas();

  const initialMode: ModoRegistro =
    modo === 'CHEQUE' || modo === 'CUOTAS' ? modo : 'CONTADO';

  const [mode, setMode] = useState<ModoRegistro>(initialMode);
  const [ambito, setAmbito] = useState<AmbitoFinanciero>(
    activeAmbito === 'PERSONAL' ? 'PERSONAL' : 'NEGOCIO'
  );

  // Campos compartidos
  const [moneda, setMoneda] = useState<CurrencyCode>('PYG');
  const [montoStr, setMontoStr] = useState('');
  const [contraparte, setContraparte] = useState('');
  const [concepto, setConcepto] = useState('');

  // Campos Contado
  const [tipoFlujo, setTipoFlujo] = useState<'GASTO' | 'INGRESO'>('GASTO');
  const [fechaContado, setFechaContado] = useState(getTodayDDMMYYYY());
  const [mostrarTodasCuentas, setMostrarTodasCuentas] = useState(false);
  const [cuentaId, setCuentaId] = useState('');
  const [macroCategoria, setMacroCategoria] =
    useState<MacroCategoriaAgro>('INSUMOS_AGRICOLAS');
  const [comprobanteNro, setComprobanteNro] = useState('');

  // Campos Cheque Diferido
  const [tipoCheque, setTipoCheque] = useState<TipoChequeDiferido>('EMITIDO');
  const [numeroCheque, setNumeroCheque] = useState('');
  const [bancoEntidad, setBancoEntidad] = useState('Banco Itaú');
  const [fechaCobroCheque, setFechaCobroCheque] = useState(
    addDaysDDMMYYYY(getTodayDDMMYYYY(), 30)
  );
  const [cuentaChequeId, setCuentaChequeId] = useState('');

  // Campos Compra / Venta en Cuotas
  const [direccionCuota, setDireccionCuota] = useState<'PAGAR' | 'COBRAR'>(
    'PAGAR'
  );
  const [modoImporteCuota, setModoImporteCuota] = useState<'TOTAL' | 'CUOTA'>(
    'TOTAL'
  );
  const [cantCuotasStr, setCantCuotasStr] = useState('3');
  const [periodicidad, setPeriodicidad] =
    useState<PeriodicidadCuota>('MENSUAL');
  const [primerVencimiento, setPrimerVencimiento] = useState(
    addDaysDDMMYYYY(getTodayDDMMYYYY(), 30)
  );

  useEffect(() => {
    if (modo === 'CHEQUE' || modo === 'CUOTAS' || modo === 'CONTADO') {
      setMode(modo);
    }
  }, [modo]);

  // Cuentas filtradas por ámbito (o todas)
  const cuentasAmbito = useMemo(() => {
    const all = cuentas || [];
    if (mostrarTodasCuentas) return all;
    const matched = all.filter((c) => (c.ambito || 'NEGOCIO') === ambito);
    return matched.length > 0 ? matched : all;
  }, [cuentas, ambito, mostrarTodasCuentas]);

  const cuentasBancariasEfectivo = useMemo(
    () => (cuentas || []).filter((c) => !isTarjetaCuenta(c.tipo)),
    [cuentas]
  );

  useEffect(() => {
    if (cuentasAmbito.length > 0) {
      const stillExists = cuentasAmbito.some((c) => c.id === cuentaId);
      if (!stillExists) {
        setCuentaId(cuentasAmbito[0].id);
        setMoneda(cuentasAmbito[0].moneda);
      }
    }
  }, [cuentasAmbito, cuentaId]);

  useEffect(() => {
    if (cuentasBancariasEfectivo.length > 0 && !cuentaChequeId) {
      const preferred =
        cuentasBancariasEfectivo.find((c) => c.ambito === ambito) ||
        cuentasBancariasEfectivo[0];
      setCuentaChequeId(preferred.id);
    }
  }, [cuentasBancariasEfectivo, ambito, cuentaChequeId]);

  const categoriasFiltradas = useMemo(() => {
    return (categorias || []).filter((cat) => {
      const matchTipo = cat.tipoFlujo === tipoFlujo;
      const matchAmbito =
        !cat.ambito || cat.ambito === 'AMBOS' || cat.ambito === ambito;
      return matchTipo && matchAmbito;
    });
  }, [categorias, tipoFlujo, ambito]);

  useEffect(() => {
    if (
      categoriasFiltradas.length > 0 &&
      !categoriasFiltradas.some((c) => c.macro === macroCategoria)
    ) {
      setMacroCategoria(categoriasFiltradas[0].macro);
    }
  }, [categoriasFiltradas, macroCategoria]);

  // Contrapartes frecuentes extraídas de historial reciente
  const contrapartesFrecuentes = useMemo(() => {
    const set = new Set<string>();
    (movimientos || []).forEach((m) => {
      if (m.contraparte) set.add(m.contraparte.trim());
    });
    (cheques || []).forEach((ch) => {
      if (ch.contraparte) set.add(ch.contraparte.trim());
    });
    (prestamos || []).forEach((p) => {
      if (p.contraparte) set.add(p.contraparte.trim());
    });
    return Array.from(set).filter(Boolean).slice(0, 6);
  }, [movimientos, cheques, prestamos]);

  const tasa = cotizacion?.referenciaBCP || 7835;
  const montoNum = parseFloat(montoStr.replace(/,/g, '.')) || 0;
  const cuentaSeleccionada = (cuentas || []).find((c) => c.id === cuentaId);

  const montoEnMonedaCuenta = cuentaSeleccionada
    ? convertCurrency(montoNum, moneda, cuentaSeleccionada.moneda, tasa)
    : montoNum;

  const checkSaldo =
    mode === 'CONTADO' && cuentaSeleccionada && tipoFlujo === 'GASTO'
      ? canDebitFromAccount(cuentaSeleccionada, montoEnMonedaCuenta)
      : { ok: true, saldoResultante: 0, warning: undefined };

  const cantCuotas = Math.max(1, parseInt(cantCuotasStr, 10) || 1);
  const montoTotalPlan =
    modoImporteCuota === 'TOTAL' ? montoNum : montoNum * cantCuotas;
  const valorCadaCuota =
    cantCuotas > 0
      ? Number(
          (montoTotalPlan / cantCuotas).toFixed(moneda === 'USD' ? 2 : 0)
        )
      : 0;
  const fechasPlan = useMemo(() => {
    if (!isValidDDMMYYYY(primerVencimiento)) return [];
    return generateInstallmentDates(primerVencimiento, cantCuotas, periodicidad);
  }, [primerVencimiento, cantCuotas, periodicidad]);

  const isSubmitting =
    registrarMutation.isPending ||
    crearChequeMutation.isPending ||
    crearCuotasMutation.isPending;

  const canSubmit = useMemo(() => {
    if (montoNum <= 0) return false;
    if (mode === 'CONTADO') {
      return (
        Boolean(cuentaSeleccionada) &&
        checkSaldo.ok &&
        isValidDDMMYYYY(fechaContado)
      );
    }
    if (mode === 'CHEQUE') {
      return (
        bancoEntidad.trim().length > 0 && isValidDDMMYYYY(fechaCobroCheque)
      );
    }
    return (
      cantCuotas >= 1 &&
      isValidDDMMYYYY(primerVencimiento) &&
      (concepto.trim().length > 0 || contraparte.trim().length > 0)
    );
  }, [
    montoNum,
    mode,
    cuentaSeleccionada,
    checkSaldo.ok,
    fechaContado,
    bancoEntidad,
    fechaCobroCheque,
    cantCuotas,
    primerVencimiento,
    concepto,
    contraparte,
  ]);

  const handleSubmit = async () => {
    if (!canSubmit) return;

    if (mode === 'CONTADO' && cuentaSeleccionada) {
      const catObj = categoriasFiltradas.find(
        (c) => c.macro === macroCategoria
      );
      const mov = await registrarMutation.mutateAsync({
        fecha: fechaContado,
        ambito,
        tipo: tipoFlujo,
        cuentaId: cuentaSeleccionada.id,
        macroCategoria,
        subCategoria: catObj?.nombre || 'Operación Directa',
        concepto: concepto.trim() || catObj?.nombre || 'Registro rápido',
        contraparte: contraparte.trim() || undefined,
        moneda,
        monto: montoNum,
        tasaCambio: tasa,
        comprobanteNro: comprobanteNro.trim() || undefined,
      });

      router.replace({
        pathname: '/(modals)/comprobante',
        params: {
          id: mov.id,
          title:
            tipoFlujo === 'INGRESO'
              ? 'Ingreso Registrado'
              : 'Gasto Registrado',
          date: mov.fecha,
          amount: String(mov.monto),
          currency: mov.moneda,
          cuenta: cuentaSeleccionada.nombre,
          campana: ambito === 'NEGOCIO' ? 'Negocio (Maní)' : 'Personal / Casa',
          concepto: mov.concepto,
        },
      });
      return;
    }

    if (mode === 'CHEQUE') {
      const ch = await crearChequeMutation.mutateAsync({
        ambito,
        tipo: tipoCheque,
        numeroCheque: numeroCheque.trim() || 'S/N',
        bancoEntidad: bancoEntidad.trim(),
        cuentaId: cuentaChequeId || undefined,
        contraparte: contraparte.trim() || 'Sin especificar',
        concepto:
          concepto.trim() ||
          `Cheque ${tipoCheque === 'RECIBIDO' ? 'recibido' : 'emitido'}`,
        moneda,
        monto: montoNum,
        tasaCambio: tasa,
        fechaEmision: getTodayDDMMYYYY(),
        fechaCobroPago: fechaCobroCheque,
      });

      router.replace({
        pathname: '/(modals)/comprobante',
        params: {
          id: ch.id,
          title:
            tipoCheque === 'RECIBIDO'
              ? 'Cheque Recibido Agendado'
              : 'Cheque Emitido Agendado',
          date: ch.fechaCobroPago,
          amount: String(ch.monto),
          currency: ch.moneda,
          cuenta: `${ch.bancoEntidad} (#${ch.numeroCheque})`,
          campana: ambito === 'NEGOCIO' ? 'Negocio (Maní)' : 'Personal / Casa',
          concepto: `No impacta saldo hasta cobrar/pagar · ${ch.contraparte}`,
        },
      });
      return;
    }

    // Mode CUOTAS
    const planNombre =
      concepto.trim() ||
      `${direccionCuota === 'COBRAR' ? 'Cobro' : 'Compra'} ${
        contraparte.trim() || 'en cuotas'
      }`;
    const plan = await crearCuotasMutation.mutateAsync({
      ambito,
      direccion: direccionCuota,
      nombre: planNombre,
      contraparte: contraparte.trim() || 'Proveedor / Cliente',
      periodicidad,
      moneda,
      montoTotal: montoTotalPlan,
      cuotasTotales: cantCuotas,
      primerVencimiento,
    });

    router.replace({
      pathname: '/(modals)/comprobante',
      params: {
        id: plan.id,
        title: `Plan en ${cantCuotas} Cuotas Agendado`,
        date: plan.proximoVencimiento,
        amount: String(plan.capitalOriginal),
        currency: plan.moneda,
        cuenta: `${cantCuotas} cuotas de ${formatMoney(
          valorCadaCuota,
          moneda
        )}`,
        campana: ambito === 'NEGOCIO' ? 'Negocio (Maní)' : 'Personal / Casa',
        concepto: `${plan.nombre} · 1° Venc: ${plan.proximoVencimiento}`,
      },
    });
  };

  const validationSummary =
    mode === 'CONTADO'
      ? [
          { label: 'Ámbito', value: ambito === 'NEGOCIO' ? 'Negocio' : 'Personal' },
          { label: 'Fecha', value: fechaContado },
          {
            label: 'Cuenta',
            value: cuentaSeleccionada
              ? `${cuentaSeleccionada.nombre} (${cuentaSeleccionada.moneda})`
              : 'Sin cuenta',
          },
          {
            label: 'Monto',
            value: formatMoney(montoNum, moneda),
            highlight: true,
          },
        ]
      : mode === 'CHEQUE'
      ? [
          {
            label: 'Cheque Diferido',
            value:
              tipoCheque === 'RECIBIDO'
                ? 'A Cobrar (Entra)'
                : 'Emitido (A Pagar)',
          },
          { label: 'Fecha Cobro/Pago', value: fechaCobroCheque, highlight: true },
          { label: 'Banco', value: bancoEntidad || '-' },
          {
            label: 'Impacto en Caja Hoy',
            value: 'Pendiente (solo agenda)',
          },
        ]
      : [
          {
            label: 'Plan',
            value: `${cantCuotas} cuotas (${periodicidad.toLowerCase()})`,
          },
          {
            label: 'Cada Cuota',
            value: formatMoney(valorCadaCuota, moneda),
            highlight: true,
          },
          {
            label: '1° / Último Venc.',
            value:
              fechasPlan.length > 0
                ? `${fechasPlan[0]} -> ${fechasPlan[fechasPlan.length - 1]}`
                : 'Fecha inválida',
          },
          { label: 'Total Plan', value: formatMoney(montoTotalPlan, moneda) },
        ];

  return (
    <SecureFormTemplate
      title="Carga Rápida"
      subtitle="Anotá un gasto, ingreso, cheque diferido o compra en cuotas"
      isSubmitting={isSubmitting}
      warningMessage={checkSaldo.warning}
      canSubmit={canSubmit}
      submitLabel={
        mode === 'CONTADO'
          ? 'Guardar Movimiento'
          : mode === 'CHEQUE'
          ? 'Agendar Cheque Diferido'
          : `Generar ${cantCuotas} Cuotas en Agenda`
      }
      onSubmit={handleSubmit}
      validationSummary={validationSummary}
    >
      {/* Paso 0: Ámbito Negocio vs Personal */}
      <AmbitoSwitch
        includeAll={false}
        value={ambito}
        onChange={(v) => setAmbito(v as AmbitoFinanciero)}
      />

      {/* Selector de Modalidad */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rowChips}
      >
        <Chip
          label="Contado (Hoy/Ayer)"
          icon="Receipt"
          selected={mode === 'CONTADO'}
          onPress={() => setMode('CONTADO')}
        />
        <Chip
          label="Cheque Diferido"
          icon="Banknote"
          selected={mode === 'CHEQUE'}
          onPress={() => setMode('CHEQUE')}
        />
        <Chip
          label="En Cuotas"
          icon="CalendarClock"
          selected={mode === 'CUOTAS'}
          onPress={() => setMode('CUOTAS')}
        />
      </ScrollView>

      {/* Tipo dentro de cada modo */}
      {mode === 'CONTADO' ? (
        <View style={styles.rowChips}>
          <Chip
            label="Gasto / Pago"
            icon="TrendingDown"
            selected={tipoFlujo === 'GASTO'}
            onPress={() => setTipoFlujo('GASTO')}
          />
          <Chip
            label="Ingreso / Venta"
            icon="TrendingUp"
            selected={tipoFlujo === 'INGRESO'}
            onPress={() => setTipoFlujo('INGRESO')}
          />
        </View>
      ) : null}

      {mode === 'CHEQUE' ? (
        <View style={styles.rowChips}>
          <Chip
            label="Emitido (A Pagar)"
            icon="ArrowUpRight"
            selected={tipoCheque === 'EMITIDO'}
            onPress={() => setTipoCheque('EMITIDO')}
          />
          <Chip
            label="Recibido (A Cobrar)"
            icon="ArrowDownLeft"
            selected={tipoCheque === 'RECIBIDO'}
            onPress={() => setTipoCheque('RECIBIDO')}
          />
        </View>
      ) : null}

      {mode === 'CUOTAS' ? (
        <View style={styles.rowChips}>
          <Chip
            label="Compra / A Pagar"
            icon="TrendingDown"
            selected={direccionCuota === 'PAGAR'}
            onPress={() => setDireccionCuota('PAGAR')}
          />
          <Chip
            label="Venta a Plazo / A Cobrar"
            icon="TrendingUp"
            selected={direccionCuota === 'COBRAR'}
            onPress={() => setDireccionCuota('COBRAR')}
          />
        </View>
      ) : null}

      <AmountInput
        value={montoStr}
        onChangeText={setMontoStr}
        currency={moneda}
        label={
          mode === 'CUOTAS' && modoImporteCuota === 'CUOTA'
            ? 'VALOR DE CADA CUOTA'
            : mode === 'CUOTAS'
            ? 'MONTO TOTAL DE LA COMPRA / VENTA'
            : 'MONTO EN MONEDA NATIVA'
        }
        onToggleCurrency={() =>
          setMoneda((prev) => (prev === 'USD' ? 'PYG' : 'USD'))
        }
      />

      {/* CONTENIDO MODO CONTADO */}
      {mode === 'CONTADO' ? (
        <>
          <SectionHeader title="Fecha de Operación (DD-MM-AAAA)" />
          <View style={styles.rowChips}>
            <Chip
              label="Hoy"
              selected={fechaContado === getTodayDDMMYYYY()}
              onPress={() => setFechaContado(getTodayDDMMYYYY())}
            />
            <Chip
              label="Ayer"
              selected={fechaContado === getYesterdayDDMMYYYY()}
              onPress={() => setFechaContado(getYesterdayDDMMYYYY())}
            />
          </View>
          <TextInput
            value={fechaContado}
            onChangeText={setFechaContado}
            placeholder="DD-MM-AAAA"
            placeholderTextColor={theme.textMuted}
            style={[
              styles.input,
              {
                backgroundColor: theme.surface,
                borderColor: isValidDDMMYYYY(fechaContado)
                  ? theme.border
                  : theme.danger,
                color: theme.textPrimary,
              },
            ]}
          />

          <SectionHeader
            title="Cuenta / Caja / Tarjeta"
            actionLabel={
              mostrarTodasCuentas ? 'Solo este ámbito' : 'Ver todas'
            }
            onActionPress={() => setMostrarTodasCuentas((v) => !v)}
          />
          {cuentasAmbito.length === 0 ? (
            <View style={{ gap: 8 }}>
              <EmptyState
                icon="Landmark"
                title="No tenés cuentas creadas"
                description="Creá al menos una cuenta o billetera para registrar movimientos al contado."
              />
              <SecureButton
                label="Crear Cuenta Ahora"
                icon="Plus"
                onPress={() => router.push('/(modals)/crear-cuenta')}
              />
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.rowChips}
            >
              {cuentasAmbito.map((c) => (
                <Chip
                  key={c.id}
                  label={`${c.nombre} (${c.moneda})`}
                  icon={c.icono}
                  selected={cuentaId === c.id}
                  onPress={() => {
                    setCuentaId(c.id);
                    setMoneda(c.moneda);
                  }}
                />
              ))}
            </ScrollView>
          )}

          <SectionHeader title="Rubro / Categoría" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.rowChips}
          >
            {categoriasFiltradas.map((cat) => (
              <Chip
                key={cat.id}
                label={cat.nombre}
                icon={cat.icono}
                selected={macroCategoria === cat.macro}
                onPress={() => setMacroCategoria(cat.macro)}
              />
            ))}
          </ScrollView>
        </>
      ) : null}

      {/* CONTENIDO MODO CHEQUE */}
      {mode === 'CHEQUE' ? (
        <>
          <SectionHeader title="Fecha de Cobro / Pago del Cheque (DD-MM-AAAA)" />
          <View style={styles.rowChips}>
            <Chip
              label="+15 días"
              onPress={() =>
                setFechaCobroCheque(addDaysDDMMYYYY(getTodayDDMMYYYY(), 15))
              }
            />
            <Chip
              label="+30 días"
              onPress={() =>
                setFechaCobroCheque(addDaysDDMMYYYY(getTodayDDMMYYYY(), 30))
              }
            />
            <Chip
              label="+60 días"
              onPress={() =>
                setFechaCobroCheque(addDaysDDMMYYYY(getTodayDDMMYYYY(), 60))
              }
            />
          </View>
          <TextInput
            value={fechaCobroCheque}
            onChangeText={setFechaCobroCheque}
            placeholder="DD-MM-AAAA"
            placeholderTextColor={theme.textMuted}
            style={[
              styles.input,
              {
                backgroundColor: theme.surface,
                borderColor: isValidDDMMYYYY(fechaCobroCheque)
                  ? theme.border
                  : theme.danger,
                color: theme.textPrimary,
              },
            ]}
          />

          <SectionHeader title="Entidad Bancaria del Cheque" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.rowChips}
          >
            {BANCOS_SUGERIDOS.map((b) => (
              <Chip
                key={b}
                label={b}
                icon="Landmark"
                selected={bancoEntidad === b}
                onPress={() => setBancoEntidad(b)}
              />
            ))}
          </ScrollView>
          <TextInput
            value={bancoEntidad}
            onChangeText={setBancoEntidad}
            placeholder="Nombre del Banco"
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
          <TextInput
            value={numeroCheque}
            onChangeText={setNumeroCheque}
            placeholder="N° de Cheque (ej: 449108)"
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

          {cuentasBancariasEfectivo.length > 0 ? (
            <>
              <SectionHeader title="Cuenta Propia Vinculada (Sugerida al cobrar/pagar)" />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.rowChips}
              >
                {cuentasBancariasEfectivo.map((c) => (
                  <Chip
                    key={c.id}
                    label={`${c.nombre} (${c.moneda})`}
                    icon={c.icono}
                    selected={cuentaChequeId === c.id}
                    onPress={() => setCuentaChequeId(c.id)}
                  />
                ))}
              </ScrollView>
            </>
          ) : null}
        </>
      ) : null}

      {/* CONTENIDO MODO CUOTAS */}
      {mode === 'CUOTAS' ? (
        <>
          <View style={styles.rowChips}>
            <Chip
              label="Ingresé Monto Total"
              selected={modoImporteCuota === 'TOTAL'}
              onPress={() => setModoImporteCuota('TOTAL')}
            />
            <Chip
              label="Ingresé Valor de Cada Cuota"
              selected={modoImporteCuota === 'CUOTA'}
              onPress={() => setModoImporteCuota('CUOTA')}
            />
          </View>

          <SectionHeader title="Cantidad de Cuotas (N)" />
          <View style={styles.rowChips}>
            {['2', '3', '4', '6', '12'].map((n) => (
              <Chip
                key={n}
                label={`${n} cuotas`}
                selected={cantCuotasStr === n}
                onPress={() => setCantCuotasStr(n)}
              />
            ))}
          </View>
          <TextInput
            value={cantCuotasStr}
            onChangeText={setCantCuotasStr}
            keyboardType="numeric"
            placeholder="Cantidad de cuotas (ej: 3)"
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

          <SectionHeader title="Periodicidad" />
          <View style={styles.rowChips}>
            {(
              [
                { k: 'MENSUAL', l: 'Mensual' },
                { k: 'QUINCENAL', l: 'Quincenal' },
                { k: 'SEMANAL', l: 'Semanal' },
              ] as const
            ).map((per) => (
              <Chip
                key={per.k}
                label={per.l}
                selected={periodicidad === per.k}
                onPress={() => setPeriodicidad(per.k)}
              />
            ))}
          </View>

          <SectionHeader title="Fecha de 1° Vencimiento (DD-MM-AAAA)" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.rowChips}
          >
            <Chip
              label="En 30 días"
              onPress={() =>
                setPrimerVencimiento(addDaysDDMMYYYY(getTodayDDMMYYYY(), 30))
              }
            />
            <Chip
              label="Día 5 próx. mes"
              onPress={() => setPrimerVencimiento(getNextMonthDayDDMMYYYY(5))}
            />
            <Chip
              label="Día 15 próx. mes"
              onPress={() => setPrimerVencimiento(getNextMonthDayDDMMYYYY(15))}
            />
          </ScrollView>
          <TextInput
            value={primerVencimiento}
            onChangeText={setPrimerVencimiento}
            placeholder="DD-MM-AAAA"
            placeholderTextColor={theme.textMuted}
            style={[
              styles.input,
              {
                backgroundColor: theme.surface,
                borderColor: isValidDDMMYYYY(primerVencimiento)
                  ? theme.border
                  : theme.danger,
                color: theme.textPrimary,
              },
            ]}
          />
        </>
      ) : null}

      {/* Cliente / Proveedor frecuente y detalle */}
      <SectionHeader title="Cliente / Proveedor (Contraparte)" />
      {contrapartesFrecuentes.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rowChips}
        >
          {contrapartesFrecuentes.map((cp) => (
            <TouchableOpacity
              key={cp}
              onPress={() => setContraparte(cp)}
              style={[
                styles.quickPeer,
                {
                  backgroundColor:
                    contraparte === cp ? theme.primarySoft : theme.surface,
                  borderColor:
                    contraparte === cp ? theme.primary : theme.border,
                },
              ]}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color:
                    contraparte === cp ? theme.primary : theme.textSecondary,
                }}
              >
                {cp}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : null}

      <TextInput
        value={contraparte}
        onChangeText={setContraparte}
        placeholder="Ej: Distribuidora El Grano / Agromecánica / Supermercado"
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

      <TextInput
        value={concepto}
        onChangeText={setConcepto}
        placeholder={
          mode === 'CUOTAS'
            ? 'Descripción del bien o compra (ej: Descascaradora maní)'
            : 'Detalle o concepto (opcional)'
        }
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

      {mode === 'CONTADO' ? (
        <TextInput
          value={comprobanteNro}
          onChangeText={setComprobanteNro}
          placeholder="N° Comprobante / Factura (opcional)"
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
      ) : null}
    </SecureFormTemplate>
  );
}

const styles = StyleSheet.create({
  rowChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickPeer: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
});
