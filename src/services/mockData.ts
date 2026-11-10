import {
  AgendaEventoItem,
  AlertaDeficitCaja,
  AmbitoFiltro,
  CampanaLoteAgro,
  CategoriaConfigAgro,
  ChequeDiferido,
  CotizacionBimoneda,
  CuentaAgro,
  FlujoCajaProyectado,
  MetricasDashboardAgro,
  MovimientoAgro,
  PrestamoAgro,
  PresupuestoRubroAgro,
  TipoMovimientoAgro,
  VentanaFlujoCaja,
} from '../types/domain';
import {
  addDaysDDMMYYYY,
  diffDaysFromToday,
  getTodayDDMMYYYY,
  parseDDMMYYYYToTime,
} from '../utils/dates';
import { isTarjetaCuenta } from '../utils/accounts';
import { convertCurrency } from '../utils/formatters';

const HOY = getTodayDDMMYYYY();

export const INITIAL_COTIZACION: CotizacionBimoneda = {
  id: 'COT-INIT',
  fecha: HOY,
  compraPYG: 7810,
  ventaPYG: 7860,
  referenciaBCP: 7835,
  vigente: true,
};

export const INITIAL_CAMPANAS: CampanaLoteAgro[] = [
  {
    id: 'CMP-MANI-2627',
    nombre: 'Producción Maní 26/27',
    ambito: 'NEGOCIO',
    actividad: 'AGRICULTURA',
    cultivoRodeo: 'Maní Seleccionado',
    hectareasCabezas: 85,
    unidadMedida: 'HA',
    estado: 'EN_CURSO',
    metaRinde: 2900,
    monedaBase: 'PYG',
    fechaInicio: '01-09-2026',
    fechaFinEstimada: '30-03-2027',
  },
];

export const INITIAL_CUENTAS: CuentaAgro[] = [
  {
    id: 'CTA-NEG-ITAU-PYG',
    nombre: 'Itaú Cta. Cte. Negocio',
    ambito: 'NEGOCIO',
    tipo: 'BANCO',
    moneda: 'PYG',
    saldoActual: 22500000,
    limiteCredito: 0,
    deudaActual: 0,
    disponibleCredito: 0,
    cierreDia: 1,
    vencimientoDia: 1,
    entidad: 'Banco Itaú Paraguay',
    icono: 'Landmark',
    activa: true,
    equivalentePYG: 22500000,
    equivalenteUSD: Number((22500000 / 7835).toFixed(2)),
  },
  {
    id: 'CTA-NEG-USD',
    nombre: 'Caja / Banco USD Maní',
    ambito: 'NEGOCIO',
    tipo: 'BANCO',
    moneda: 'USD',
    saldoActual: 2500.0,
    limiteCredito: 0,
    deudaActual: 0,
    disponibleCredito: 0,
    cierreDia: 1,
    vencimientoDia: 1,
    entidad: 'Banco Sudameris',
    icono: 'Briefcase',
    activa: true,
    equivalentePYG: Math.round(2500 * 7835),
    equivalenteUSD: 2500.0,
  },
  {
    id: 'CTA-PER-EFECTIVO',
    nombre: 'Billetera & Cuenta Casa',
    ambito: 'PERSONAL',
    tipo: 'EFECTIVO',
    moneda: 'PYG',
    saldoActual: 4800000,
    limiteCredito: 0,
    deudaActual: 0,
    disponibleCredito: 0,
    cierreDia: 1,
    vencimientoDia: 1,
    entidad: 'Personal / Hogar',
    icono: 'Wallet',
    activa: true,
    equivalentePYG: 4800000,
    equivalenteUSD: Number((4800000 / 7835).toFixed(2)),
  },
  {
    id: 'CTA-PER-TARJETA',
    nombre: 'Tarjeta Personal Hogar',
    ambito: 'PERSONAL',
    tipo: 'TARJETA',
    moneda: 'PYG',
    saldoActual: 0,
    limiteCredito: 12000000,
    deudaActual: 2150000,
    disponibleCredito: 9850000,
    cierreDia: 24,
    vencimientoDia: 5,
    entidad: 'Banco Itaú Personal',
    icono: 'CreditCard',
    activa: true,
    equivalentePYG: 0,
    equivalenteUSD: 0,
  },
];

export const INITIAL_CATEGORIAS: CategoriaConfigAgro[] = [
  {
    id: 'CAT-INS-MANI',
    tipoFlujo: 'GASTO',
    ambito: 'NEGOCIO',
    macro: 'INSUMOS_AGRICOLAS',
    nombre: 'Semillas, Insumos & Bolsas',
    icono: 'Sprout',
    monedaSugerida: 'PYG',
  },
  {
    id: 'CAT-MAQ-COMB',
    tipoFlujo: 'GASTO',
    ambito: 'NEGOCIO',
    macro: 'LABORES_COMBUSTIBLE',
    nombre: 'Maquinaria, Repuestos & Gasoil',
    icono: 'Fuel',
    monedaSugerida: 'PYG',
  },
  {
    id: 'CAT-FLT-COM',
    tipoFlujo: 'GASTO',
    ambito: 'NEGOCIO',
    macro: 'LOGISTICA_COMERCIAL',
    nombre: 'Fletes, Jornales & Embolsado',
    icono: 'Truck',
    monedaSugerida: 'PYG',
  },
  {
    id: 'CAT-IMP-FIN',
    tipoFlujo: 'GASTO',
    ambito: 'NEGOCIO',
    macro: 'FINANCIERO_IMPUESTOS',
    nombre: 'Cuotas, Bancos & Impuestos',
    icono: 'ShieldCheck',
    monedaSugerida: 'PYG',
  },
  {
    id: 'CAT-VTA-MANI',
    tipoFlujo: 'INGRESO',
    ambito: 'NEGOCIO',
    macro: 'VENTAS_AGRO',
    nombre: 'Venta de Maní / Clientes',
    icono: 'Wheat',
    monedaSugerida: 'PYG',
  },
  {
    id: 'CAT-PER-HOGAR',
    tipoFlujo: 'GASTO',
    ambito: 'PERSONAL',
    macro: 'HOGAR_ALIMENTACION',
    nombre: 'Casa, Supermercado & Alquiler',
    icono: 'Home',
    monedaSugerida: 'PYG',
  },
  {
    id: 'CAT-PER-SERV',
    tipoFlujo: 'GASTO',
    ambito: 'PERSONAL',
    macro: 'SERVICIOS_SALUD',
    nombre: 'Servicios, Salud & Familia',
    icono: 'HeartPulse',
    monedaSugerida: 'PYG',
  },
  {
    id: 'CAT-PER-MOV',
    tipoFlujo: 'GASTO',
    ambito: 'PERSONAL',
    macro: 'MOVILIDAD_PERSONAL',
    nombre: 'Vehículo & Gastos Personales',
    icono: 'Car',
    monedaSugerida: 'PYG',
  },
  {
    id: 'CAT-PER-ING',
    tipoFlujo: 'INGRESO',
    ambito: 'PERSONAL',
    macro: 'INGRESO_PERSONAL',
    nombre: 'Ingreso Personal / Otros',
    icono: 'Wallet',
    monedaSugerida: 'PYG',
  },
];

export const INITIAL_MOVIMIENTOS: MovimientoAgro[] = [
  {
    id: 'MOV-101',
    fecha: HOY,
    ambito: 'NEGOCIO',
    tipo: 'GASTO',
    cuentaId: 'CTA-NEG-ITAU-PYG',
    campanaId: 'CMP-MANI-2627',
    macroCategoria: 'LOGISTICA_COMERCIAL',
    subCategoria: 'Fletes, Jornales & Embolsado',
    concepto: 'Jornales selección y embolsado maní confitería',
    contraparte: 'Cuadrilla Local',
    moneda: 'PYG',
    monto: 2800000,
    tasaCambio: 7835,
    montoPYG: 2800000,
    montoUSD: Number((2800000 / 7835).toFixed(2)),
    comprobanteNro: 'REC-00412',
  },
  {
    id: 'MOV-102',
    fecha: addDaysDDMMYYYY(HOY, -2),
    ambito: 'PERSONAL',
    tipo: 'GASTO',
    cuentaId: 'CTA-PER-EFECTIVO',
    macroCategoria: 'HOGAR_ALIMENTACION',
    subCategoria: 'Casa, Supermercado & Alquiler',
    concepto: 'Compra semanal supermercado y despensa',
    contraparte: 'Supermercado Stock',
    moneda: 'PYG',
    monto: 950000,
    tasaCambio: 7835,
    montoPYG: 950000,
    montoUSD: Number((950000 / 7835).toFixed(2)),
  },
  {
    id: 'MOV-103',
    fecha: addDaysDDMMYYYY(HOY, -5),
    ambito: 'NEGOCIO',
    tipo: 'INGRESO',
    cuentaId: 'CTA-NEG-USD',
    campanaId: 'CMP-MANI-2627',
    macroCategoria: 'VENTAS_AGRO',
    subCategoria: 'Venta de Maní / Clientes',
    concepto: 'Entrega 5 Ton maní pelado mayorista',
    contraparte: 'Industrias Guaraní S.A.',
    moneda: 'USD',
    monto: 4850.0,
    tasaCambio: 7835,
    montoPYG: Math.round(4850 * 7835),
    montoUSD: 4850.0,
    toneladasCabezas: 5,
    comprobanteNro: 'FAC-001-00218',
  },
  {
    id: 'MOV-104',
    fecha: addDaysDDMMYYYY(HOY, -8),
    ambito: 'NEGOCIO',
    tipo: 'RETIRO_PERSONAL',
    cuentaId: 'CTA-NEG-ITAU-PYG',
    cuentaDestinoId: 'CTA-PER-EFECTIVO',
    macroCategoria: 'RETIRO_APORTE',
    subCategoria: 'Retiro Personal del Negocio',
    concepto: 'Retiro mensual para gastos de la casa',
    moneda: 'PYG',
    monto: 4500000,
    tasaCambio: 7835,
    montoPYG: 4500000,
    montoUSD: Number((4500000 / 7835).toFixed(2)),
  },
];

export const INITIAL_PRESUPUESTOS: PresupuestoRubroAgro[] = [
  {
    id: 'PRES-01',
    campanaId: 'CMP-MANI-2627',
    macroCategoria: 'INSUMOS_AGRICOLAS',
    nombreRubro: 'Semillas, Insumos y Bolsas Maní',
    moneda: 'PYG',
    montoAsignadoUSD: Number((65000000 / 7835).toFixed(2)),
    montoAsignadoPYG: 65000000,
    ejecutadoUSD: Number((38000000 / 7835).toFixed(2)),
    ejecutadoPYG: 38000000,
    disponibleUSD: Number((27000000 / 7835).toFixed(2)),
    disponiblePYG: 27000000,
    porcentajeUso: 58,
    alertaExceso: false,
    icono: 'Sprout',
  },
];

export const INITIAL_PRESTAMOS: PrestamoAgro[] = [
  {
    id: 'PRE-MAQ-MANI',
    ambito: 'NEGOCIO',
    direccion: 'PAGAR',
    nombre: 'Descascaradora de Maní (3 Cuotas)',
    entidad: 'Agromecánica del Sur',
    contraparte: 'Agromecánica del Sur',
    instrumento: 'COMPRA_CUOTAS',
    periodicidad: 'MENSUAL',
    campanaId: 'CMP-MANI-2627',
    moneda: 'PYG',
    capitalOriginal: 45000000,
    saldoPendiente: 30000000,
    tasaAnualPct: 0,
    cuotasTotales: 3,
    cuotasPagadas: 1,
    proximoVencimiento: addDaysDDMMYYYY(HOY, 6),
    montoProximaCuota: 15000000,
    estado: 'ACTIVO',
    cuotas: [
      {
        id: 'CUO-MANI-1',
        prestamoId: 'PRE-MAQ-MANI',
        numeroCuota: 1,
        fechaVencimiento: addDaysDDMMYYYY(HOY, -24),
        moneda: 'PYG',
        montoCapital: 15000000,
        montoInteres: 0,
        montoTotal: 15000000,
        estado: 'PAGADA',
        fechaPago: addDaysDDMMYYYY(HOY, -24),
        cuentaId: 'CTA-NEG-ITAU-PYG',
      },
      {
        id: 'CUO-MANI-2',
        prestamoId: 'PRE-MAQ-MANI',
        numeroCuota: 2,
        fechaVencimiento: addDaysDDMMYYYY(HOY, 6),
        moneda: 'PYG',
        montoCapital: 15000000,
        montoInteres: 0,
        montoTotal: 15000000,
        estado: 'PENDIENTE',
      },
      {
        id: 'CUO-MANI-3',
        prestamoId: 'PRE-MAQ-MANI',
        numeroCuota: 3,
        fechaVencimiento: addDaysDDMMYYYY(HOY, 36),
        moneda: 'PYG',
        montoCapital: 15000000,
        montoInteres: 0,
        montoTotal: 15000000,
        estado: 'PENDIENTE',
      },
    ],
  },
  {
    id: 'PRE-PER-HOGAR',
    ambito: 'PERSONAL',
    direccion: 'PAGAR',
    nombre: 'Cuota Electrodoméstico / Hogar',
    entidad: 'Casa Paraná',
    contraparte: 'Casa Paraná',
    instrumento: 'COMPRA_CUOTAS',
    periodicidad: 'MENSUAL',
    moneda: 'PYG',
    capitalOriginal: 7200000,
    saldoPendiente: 4800000,
    tasaAnualPct: 0,
    cuotasTotales: 3,
    cuotasPagadas: 1,
    proximoVencimiento: addDaysDDMMYYYY(HOY, 5),
    montoProximaCuota: 2400000,
    estado: 'ACTIVO',
    cuotas: [
      {
        id: 'CUO-HOG-1',
        prestamoId: 'PRE-PER-HOGAR',
        numeroCuota: 1,
        fechaVencimiento: addDaysDDMMYYYY(HOY, -25),
        moneda: 'PYG',
        montoCapital: 2400000,
        montoInteres: 0,
        montoTotal: 2400000,
        estado: 'PAGADA',
        fechaPago: addDaysDDMMYYYY(HOY, -25),
        cuentaId: 'CTA-PER-EFECTIVO',
      },
      {
        id: 'CUO-HOG-2',
        prestamoId: 'PRE-PER-HOGAR',
        numeroCuota: 2,
        fechaVencimiento: addDaysDDMMYYYY(HOY, 5),
        moneda: 'PYG',
        montoCapital: 2400000,
        montoInteres: 0,
        montoTotal: 2400000,
        estado: 'PENDIENTE',
      },
      {
        id: 'CUO-HOG-3',
        prestamoId: 'PRE-PER-HOGAR',
        numeroCuota: 3,
        fechaVencimiento: addDaysDDMMYYYY(HOY, 35),
        moneda: 'PYG',
        montoCapital: 2400000,
        montoInteres: 0,
        montoTotal: 2400000,
        estado: 'PENDIENTE',
      },
    ],
  },
];

export const INITIAL_CHEQUES: ChequeDiferido[] = [
  {
    id: 'CHQ-101',
    ambito: 'NEGOCIO',
    tipo: 'EMITIDO',
    numeroCheque: '449102',
    bancoEntidad: 'Banco Itaú',
    cuentaId: 'CTA-NEG-ITAU-PYG',
    contraparte: 'Agroinsumos Chaco',
    concepto: 'Fertilizante foliar y bolsas de arpillera',
    moneda: 'PYG',
    monto: 18500000,
    tasaCambio: 7835,
    montoPYG: 18500000,
    montoUSD: Number((18500000 / 7835).toFixed(2)),
    fechaEmision: addDaysDDMMYYYY(HOY, -10),
    fechaCobroPago: addDaysDDMMYYYY(HOY, 3),
    estado: 'PENDIENTE',
  },
  {
    id: 'CHQ-102',
    ambito: 'NEGOCIO',
    tipo: 'EMITIDO',
    numeroCheque: '449105',
    bancoEntidad: 'Banco Itaú',
    cuentaId: 'CTA-NEG-ITAU-PYG',
    contraparte: 'Transporte Norte S.R.L.',
    concepto: 'Flete acopio y traslado de lotes',
    moneda: 'PYG',
    monto: 12000000,
    tasaCambio: 7835,
    montoPYG: 12000000,
    montoUSD: Number((12000000 / 7835).toFixed(2)),
    fechaEmision: addDaysDDMMYYYY(HOY, -4),
    fechaCobroPago: addDaysDDMMYYYY(HOY, 9),
    estado: 'PENDIENTE',
  },
  {
    id: 'CHQ-103',
    ambito: 'NEGOCIO',
    tipo: 'RECIBIDO',
    numeroCheque: '882014',
    bancoEntidad: 'Banco Continental',
    cuentaId: 'CTA-NEG-ITAU-PYG',
    contraparte: 'Distribuidora El Grano S.A.',
    concepto: 'Venta 18 Ton maní seleccionado (Cliente Mayorista)',
    moneda: 'PYG',
    monto: 42000000,
    tasaCambio: 7835,
    montoPYG: 42000000,
    montoUSD: Number((42000000 / 7835).toFixed(2)),
    fechaEmision: addDaysDDMMYYYY(HOY, -6),
    fechaCobroPago: addDaysDDMMYYYY(HOY, 14),
    estado: 'PENDIENTE',
  },
];

export function isCashInflow(tipo: TipoMovimientoAgro): boolean {
  return (
    tipo === 'INGRESO' ||
    tipo === 'CHEQUE_COBRADO' ||
    tipo === 'COBRO_CUOTA'
  );
}

export function isCashOutflow(tipo: TipoMovimientoAgro): boolean {
  return (
    tipo === 'GASTO' ||
    tipo === 'CHEQUE_PAGADO' ||
    tipo === 'PAGO_CUOTA'
  );
}

export function computeServerMetricas(
  cuentas: CuentaAgro[],
  prestamos: PrestamoAgro[],
  cheques: ChequeDiferido[],
  movimientos: MovimientoAgro[],
  cotizacion: CotizacionBimoneda,
  campanaId = 'ALL',
  ambito: AmbitoFiltro = 'TODOS'
): MetricasDashboardAgro {
  const tasa = cotizacion.referenciaBCP || 7835;
  const matchScope = (itemAmbito?: string) =>
    ambito === 'TODOS' || (itemAmbito || 'NEGOCIO') === ambito;

  const scopedCuentas = cuentas.filter((c) => matchScope(c.ambito));
  const scopedPrestamos = prestamos.filter((p) => matchScope(p.ambito));
  const scopedCheques = cheques.filter((ch) => matchScope(ch.ambito));

  const liquidezPYG = scopedCuentas
    .filter((c) => !isTarjetaCuenta(c.tipo) && c.moneda === 'PYG')
    .reduce((acc, c) => acc + c.saldoActual, 0);

  const liquidezUSD = scopedCuentas
    .filter((c) => !isTarjetaCuenta(c.tipo) && c.moneda === 'USD')
    .reduce((acc, c) => acc + c.saldoActual, 0);

  const liquidezConsolidadaPYG = Math.round(liquidezPYG + liquidezUSD * tasa);
  const liquidezConsolidadaUSD = Number(
    (liquidezUSD + liquidezPYG / tasa).toFixed(2)
  );

  const deudaTarjetasUSD = scopedCuentas
    .filter((c) => isTarjetaCuenta(c.tipo))
    .reduce(
      (acc, c) =>
        acc + (c.moneda === 'USD' ? c.deudaActual : c.deudaActual / tasa),
      0
    );

  const deudaPrestamosUSD = scopedPrestamos
    .filter((p) => p.estado !== 'CANCELADO' && (p.direccion || 'PAGAR') === 'PAGAR')
    .reduce(
      (acc, p) =>
        acc + (p.moneda === 'USD' ? p.saldoPendiente : p.saldoPendiente / tasa),
      0
    );

  const chequesEmitidosUSD = scopedCheques
    .filter((ch) => ch.estado === 'PENDIENTE' && ch.tipo === 'EMITIDO')
    .reduce((acc, ch) => acc + ch.montoUSD, 0);

  const pasivoTotalUSD = Number(
    (deudaPrestamosUSD + deudaTarjetasUSD + chequesEmitidosUSD).toFixed(2)
  );
  const pasivoTotalPYG = Math.round(pasivoTotalUSD * tasa);

  const patrimonioNetoUSD = Number(
    (liquidezConsolidadaUSD - pasivoTotalUSD).toFixed(2)
  );
  const patrimonioNetoPYG = Math.round(liquidezConsolidadaPYG - pasivoTotalPYG);

  const filteredMovs = movimientos.filter((m) => {
    if (m.anulado) return false;
    const scopeOk = matchScope(m.ambito);
    const campOk =
      !campanaId || campanaId === 'ALL' || m.campanaId === campanaId;
    return scopeOk && campOk;
  });

  const ingresosCampanaUSD = Number(
    filteredMovs
      .filter((m) => isCashInflow(m.tipo))
      .reduce((acc, m) => acc + m.montoUSD, 0)
      .toFixed(2)
  );

  const costosCampanaUSD = Number(
    filteredMovs
      .filter((m) => isCashOutflow(m.tipo))
      .reduce((acc, m) => acc + m.montoUSD, 0)
      .toFixed(2)
  );

  return {
    tasaCambioReferencia: tasa,
    liquidezNativaPYG: Math.round(liquidezPYG),
    liquidezNativaUSD: Number(liquidezUSD.toFixed(2)),
    liquidezConsolidadaPYG,
    liquidezConsolidadaUSD,
    pasivoTotalPYG,
    pasivoTotalUSD,
    patrimonioNetoPYG,
    patrimonioNetoUSD,
    ingresosCampanaUSD,
    ingresosCampanaPYG: Math.round(ingresosCampanaUSD * tasa),
    costosCampanaUSD,
    costosCampanaPYG: Math.round(costosCampanaUSD * tasa),
    margenBrutoCampanaUSD: Number(
      (ingresosCampanaUSD - costosCampanaUSD).toFixed(2)
    ),
    margenBrutoCampanaPYG: Math.round(
      (ingresosCampanaUSD - costosCampanaUSD) * tasa
    ),
  };
}

export function computeFlujoCajaProyectado(
  cuentas: CuentaAgro[],
  prestamos: PrestamoAgro[],
  cheques: ChequeDiferido[],
  cotizacion: CotizacionBimoneda,
  ambito: AmbitoFiltro = 'TODOS'
): FlujoCajaProyectado {
  const tasa = cotizacion.referenciaBCP || 7835;
  const matchScope = (itemAmbito?: string) =>
    ambito === 'TODOS' || (itemAmbito || 'NEGOCIO') === ambito;

  const saldoActualPYG = Math.round(
    cuentas
      .filter((c) => matchScope(c.ambito) && !isTarjetaCuenta(c.tipo))
      .reduce(
        (acc, c) =>
          acc +
          (c.moneda === 'PYG'
            ? c.saldoActual
            : convertCurrency(c.saldoActual, 'USD', 'PYG', tasa)),
        0
      )
  );
  const saldoActualUSD = Number((saldoActualPYG / tasa).toFixed(2));

  const eventos: AgendaEventoItem[] = [];

  cheques
    .filter((ch) => matchScope(ch.ambito) && ch.estado === 'PENDIENTE')
    .forEach((ch) => {
      const dias = diffDaysFromToday(ch.fechaCobroPago);
      const ventana =
        dias < 0
          ? 'VENCIDO'
          : dias <= 7
          ? 'ESTA_SEMANA'
          : dias <= 30
          ? 'PROXIMOS_30_DIAS'
          : 'POSTERIOR';
      eventos.push({
        id: ch.id,
        origen: ch.tipo === 'RECIBIDO' ? 'CHEQUE_RECIBIDO' : 'CHEQUE_EMITIDO',
        ambito: ch.ambito || 'NEGOCIO',
        direccion: ch.tipo === 'RECIBIDO' ? 'INGRESO' : 'EGRESO',
        titulo: `${
          ch.tipo === 'RECIBIDO' ? 'Cheque a Cobrar' : 'Cheque a Pagar'
        } #${ch.numeroCheque || '-'}`,
        subtitulo: ch.concepto || ch.bancoEntidad,
        contraparte: ch.contraparte || '-',
        entidadBancaria: ch.bancoEntidad,
        fechaVencimiento: ch.fechaCobroPago,
        diasRestantes: dias,
        ventana,
        moneda: ch.moneda,
        monto: ch.monto,
        montoPYG: ch.montoPYG,
        montoUSD: ch.montoUSD,
        cuentaSugeridaId: ch.cuentaId,
        chequeId: ch.id,
        estado: dias < 0 ? 'VENCIDA' : 'PENDIENTE',
      });
    });

  prestamos
    .filter((p) => matchScope(p.ambito) && p.estado !== 'CANCELADO')
    .forEach((p) => {
      const esIngreso = (p.direccion || 'PAGAR') === 'COBRAR';
      (p.cuotas || [])
        .filter((cuo) => cuo.estado !== 'PAGADA')
        .forEach((cuo) => {
          const dias = diffDaysFromToday(cuo.fechaVencimiento);
          const ventana =
            dias < 0
              ? 'VENCIDO'
              : dias <= 7
              ? 'ESTA_SEMANA'
              : dias <= 30
              ? 'PROXIMOS_30_DIAS'
              : 'POSTERIOR';
          const montoPYG =
            cuo.moneda === 'PYG'
              ? Math.round(cuo.montoTotal)
              : Math.round(cuo.montoTotal * tasa);
          const montoUSD =
            cuo.moneda === 'USD'
              ? Number(cuo.montoTotal.toFixed(2))
              : Number((cuo.montoTotal / tasa).toFixed(2));
          eventos.push({
            id: cuo.id,
            origen: esIngreso ? 'CUOTA_COBRAR' : 'CUOTA_PAGAR',
            ambito: p.ambito || 'NEGOCIO',
            direccion: esIngreso ? 'INGRESO' : 'EGRESO',
            titulo: `${p.nombre} · Cuota ${cuo.numeroCuota}/${p.cuotasTotales}`,
            subtitulo: p.contraparte || p.entidad,
            contraparte: p.contraparte || p.entidad,
            entidadBancaria: p.entidad,
            fechaVencimiento: cuo.fechaVencimiento,
            diasRestantes: dias,
            ventana,
            moneda: cuo.moneda,
            monto: cuo.montoTotal,
            montoPYG,
            montoUSD,
            prestamoId: p.id,
            cuotaId: cuo.id,
            estado: dias < 0 ? 'VENCIDA' : 'PENDIENTE',
          });
        });
    });

  eventos.sort(
    (a, b) =>
      parseDDMMYYYYToTime(a.fechaVencimiento) -
      parseDDMMYYYYToTime(b.fechaVencimiento)
  );

  const vencidos = eventos.filter((e) => e.diasRestantes < 0);
  const vencPorCobrarPYG = Math.round(
    vencidos
      .filter((e) => e.direccion === 'INGRESO')
      .reduce((a, e) => a + e.montoPYG, 0)
  );
  const vencPorPagarPYG = Math.round(
    vencidos
      .filter((e) => e.direccion === 'EGRESO')
      .reduce((a, e) => a + e.montoPYG, 0)
  );

  const buildWindow = (maxDays: number): VentanaFlujoCaja => {
    const subset = eventos.filter((e) => e.diasRestantes <= maxDays);
    const ingresosPYG = Math.round(
      subset
        .filter((e) => e.direccion === 'INGRESO')
        .reduce((a, e) => a + e.montoPYG, 0)
    );
    const egresosPYG = Math.round(
      subset
        .filter((e) => e.direccion === 'EGRESO')
        .reduce((a, e) => a + e.montoPYG, 0)
    );
    const saldoFinalPYG = Math.round(saldoActualPYG + ingresosPYG - egresosPYG);
    return {
      ingresosPYG,
      ingresosUSD: Number((ingresosPYG / tasa).toFixed(2)),
      egresosPYG,
      egresosUSD: Number((egresosPYG / tasa).toFixed(2)),
      saldoFinalPYG,
      saldoFinalUSD: Number((saldoFinalPYG / tasa).toFixed(2)),
    };
  };

  let runningPYG = saldoActualPYG;
  let minPYG = saldoActualPYG;
  let alertaDeficit: AlertaDeficitCaja | null = null;

  eventos
    .filter((e) => e.diasRestantes <= 30)
    .forEach((e) => {
      runningPYG += e.direccion === 'INGRESO' ? e.montoPYG : -e.montoPYG;
      if (runningPYG < minPYG) minPYG = runningPYG;
      if (runningPYG < 0 && !alertaDeficit) {
        alertaDeficit = {
          fecha: e.fechaVencimiento,
          eventoTitulo: e.titulo,
          saldoProyectadoPYG: Math.round(runningPYG),
          saldoProyectadoUSD: Number((runningPYG / tasa).toFixed(2)),
        };
      }
    });

  return {
    ambito,
    tasaCambio: tasa,
    saldoActualPYG,
    saldoActualUSD,
    vencido: {
      porCobrarPYG: vencPorCobrarPYG,
      porCobrarUSD: Number((vencPorCobrarPYG / tasa).toFixed(2)),
      porPagarPYG: vencPorPagarPYG,
      porPagarUSD: Number((vencPorPagarPYG / tasa).toFixed(2)),
    },
    proximos7Dias: buildWindow(7),
    proximos30Dias: buildWindow(30),
    proximos90Dias: buildWindow(90),
    saldoMinimo30DiasPYG: Math.round(minPYG),
    saldoMinimo30DiasUSD: Number((minPYG / tasa).toFixed(2)),
    alertaDeficit,
    eventos,
  };
}
