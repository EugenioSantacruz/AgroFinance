export type CurrencyCode = 'PYG' | 'USD';

export type AmbitoFinanciero = 'NEGOCIO' | 'PERSONAL';
export type AmbitoFiltro = 'TODOS' | AmbitoFinanciero;

export type TipoCuentaAgro =
  | 'BANCO'
  | 'EFECTIVO'
  | 'TARJETA'
  | 'CAJA_ESTANCIA'
  | 'TARJETA_AGRO'
  | 'CUENTA_GRANARIA';

export type ActividadAgro = 'AGRICULTURA' | 'GANADERIA' | 'MIXTO' | 'MAQUINARIA';

export type MacroCategoriaAgro =
  | 'INSUMOS_AGRICOLAS'
  | 'LABORES_COMBUSTIBLE'
  | 'SANIDAD_NUTRICION'
  | 'LOGISTICA_COMERCIAL'
  | 'FINANCIERO_IMPUESTOS'
  | 'VENTAS_AGRO'
  | 'HOGAR_ALIMENTACION'
  | 'SERVICIOS_SALUD'
  | 'MOVILIDAD_PERSONAL'
  | 'INGRESO_PERSONAL'
  | 'RETIRO_APORTE';

export type TipoMovimientoAgro =
  | 'GASTO'
  | 'INGRESO'
  | 'TRANSFERENCIA'
  | 'PAGO_TARJETA'
  | 'PAGO_CUOTA'
  | 'COBRO_CUOTA'
  | 'CHEQUE_PAGADO'
  | 'CHEQUE_COBRADO'
  | 'RETIRO_PERSONAL'
  | 'APORTE_NEGOCIO'
  | 'AJUSTE';

export type PeriodicidadCuota =
  | 'SEMANAL'
  | 'QUINCENAL'
  | 'MENSUAL'
  | 'ANUAL'
  | 'UNICO';

export type DireccionObligacion = 'PAGAR' | 'COBRAR';

export type InstrumentoFinanciero =
  | 'COMPRA_CUOTAS'
  | 'CUENTA_POR_PAGAR'
  | 'CUENTA_POR_COBRAR'
  | 'VENTA_CREDITO'
  | 'PRENDA_MAQUINARIA'
  | 'INSUMOS_ZAFRA'
  | 'WARRANT_GRANOS'
  | 'CREDITO_GANADERO';

export type TipoChequeDiferido = 'EMITIDO' | 'RECIBIDO';
export type EstadoChequeDiferido =
  | 'PENDIENTE'
  | 'LIQUIDADO'
  | 'RECHAZADO'
  | 'ANULADO';

export interface CotizacionBimoneda {
  id: string;
  fecha: string; // DD-MM-AAAA
  compraPYG: number;
  ventaPYG: number;
  referenciaBCP: number;
  vigente: boolean;
}

export interface CuentaAgro {
  id: string;
  nombre: string;
  ambito: AmbitoFinanciero;
  tipo: TipoCuentaAgro;
  moneda: CurrencyCode;
  saldoActual: number;
  limiteCredito: number;
  deudaActual: number;
  disponibleCredito: number;
  cierreDia: number;
  vencimientoDia: number;
  entidad: string;
  icono: string;
  activa: boolean;
  equivalentePYG: number;
  equivalenteUSD: number;
}

export interface CampanaLoteAgro {
  id: string;
  nombre: string;
  ambito?: AmbitoFinanciero;
  actividad: ActividadAgro;
  cultivoRodeo: string;
  hectareasCabezas: number;
  unidadMedida: 'HA' | 'CABEZAS' | 'UNIDAD';
  estado: 'EN_CURSO' | 'PLANIFICADA' | 'CERRADA';
  metaRinde: number;
  monedaBase: CurrencyCode;
  fechaInicio: string; // DD-MM-AAAA
  fechaFinEstimada: string; // DD-MM-AAAA
}

export interface CategoriaConfigAgro {
  id: string;
  tipoFlujo: 'GASTO' | 'INGRESO';
  ambito: AmbitoFinanciero | 'AMBOS';
  macro: MacroCategoriaAgro;
  nombre: string;
  icono: string;
  monedaSugerida: CurrencyCode;
}

export interface MovimientoAgro {
  id: string;
  fecha: string; // DD-MM-AAAA
  ambito: AmbitoFinanciero;
  tipo: TipoMovimientoAgro;
  cuentaId: string;
  cuentaDestinoId?: string;
  campanaId?: string;
  macroCategoria: MacroCategoriaAgro;
  subCategoria: string;
  concepto: string;
  contraparte?: string;
  moneda: CurrencyCode;
  monto: number;
  tasaCambio: number;
  montoPYG: number;
  montoUSD: number;
  litrosGasoil?: number;
  precioLitro?: number;
  toneladasCabezas?: number;
  comprobanteNro?: string;
  referenciaId?: string;
  anulado?: boolean;
}

export interface PresupuestoRubroAgro {
  id: string;
  campanaId: string;
  macroCategoria: MacroCategoriaAgro;
  nombreRubro: string;
  moneda: CurrencyCode;
  montoAsignadoUSD: number;
  montoAsignadoPYG: number;
  ejecutadoUSD: number;
  ejecutadoPYG: number;
  disponibleUSD: number;
  disponiblePYG: number;
  porcentajeUso: number;
  alertaExceso: boolean;
  icono: string;
}

export interface CuotaPrestamoAgro {
  id: string;
  prestamoId: string;
  numeroCuota: number;
  fechaVencimiento: string; // DD-MM-AAAA
  moneda: CurrencyCode;
  montoCapital: number;
  montoInteres: number;
  montoTotal: number;
  estado: 'PENDIENTE' | 'PAGADA' | 'VENCIDA';
  fechaPago?: string;
  cuentaId?: string;
  movimientoId?: string;
}

export interface PrestamoAgro {
  id: string;
  ambito: AmbitoFinanciero;
  direccion: DireccionObligacion;
  nombre: string;
  entidad: string;
  contraparte?: string;
  instrumento: InstrumentoFinanciero;
  periodicidad: PeriodicidadCuota;
  campanaId?: string;
  moneda: CurrencyCode;
  capitalOriginal: number;
  saldoPendiente: number;
  tasaAnualPct: number;
  cuotasTotales: number;
  cuotasPagadas: number;
  proximoVencimiento: string; // DD-MM-AAAA
  montoProximaCuota: number;
  estado: 'ACTIVO' | 'CANCELADO' | 'VENCIDO';
  cuotas: CuotaPrestamoAgro[];
}

export interface ChequeDiferido {
  id: string;
  ambito: AmbitoFinanciero;
  tipo: TipoChequeDiferido;
  numeroCheque: string;
  bancoEntidad: string;
  cuentaId?: string;
  contraparte: string;
  concepto: string;
  moneda: CurrencyCode;
  monto: number;
  tasaCambio: number;
  montoPYG: number;
  montoUSD: number;
  fechaEmision: string; // DD-MM-AAAA
  fechaCobroPago: string; // DD-MM-AAAA
  estado: EstadoChequeDiferido;
  fechaLiquidacion?: string;
  movimientoId?: string;
}

export type OrigenEventoAgenda =
  | 'CHEQUE_EMITIDO'
  | 'CHEQUE_RECIBIDO'
  | 'CUOTA_PAGAR'
  | 'CUOTA_COBRAR';

export interface AgendaEventoItem {
  id: string;
  origen: OrigenEventoAgenda;
  ambito: AmbitoFinanciero;
  direccion: 'INGRESO' | 'EGRESO';
  titulo: string;
  subtitulo: string;
  contraparte: string;
  entidadBancaria?: string;
  fechaVencimiento: string; // DD-MM-AAAA
  diasRestantes: number;
  ventana: 'VENCIDO' | 'ESTA_SEMANA' | 'PROXIMOS_30_DIAS' | 'POSTERIOR';
  moneda: CurrencyCode;
  monto: number;
  montoPYG: number;
  montoUSD: number;
  cuentaSugeridaId?: string;
  prestamoId?: string;
  cuotaId?: string;
  chequeId?: string;
  estado: 'PENDIENTE' | 'VENCIDA';
}

export interface AlertaDeficitCaja {
  fecha: string;
  eventoTitulo: string;
  saldoProyectadoPYG: number;
  saldoProyectadoUSD: number;
}

export interface VentanaFlujoCaja {
  ingresosPYG: number;
  ingresosUSD: number;
  egresosPYG: number;
  egresosUSD: number;
  saldoFinalPYG: number;
  saldoFinalUSD: number;
}

export interface FlujoCajaProyectado {
  ambito: AmbitoFiltro;
  tasaCambio: number;
  saldoActualPYG: number;
  saldoActualUSD: number;
  vencido: {
    porCobrarPYG: number;
    porCobrarUSD: number;
    porPagarPYG: number;
    porPagarUSD: number;
  };
  proximos7Dias: VentanaFlujoCaja;
  proximos30Dias: VentanaFlujoCaja;
  proximos90Dias: VentanaFlujoCaja;
  saldoMinimo30DiasPYG: number;
  saldoMinimo30DiasUSD: number;
  alertaDeficit: AlertaDeficitCaja | null;
  eventos: AgendaEventoItem[];
}

export interface MetricasDashboardAgro {
  tasaCambioReferencia: number;
  liquidezNativaPYG: number;
  liquidezNativaUSD: number;
  liquidezConsolidadaPYG: number;
  liquidezConsolidadaUSD: number;
  pasivoTotalPYG: number;
  pasivoTotalUSD: number;
  patrimonioNetoPYG: number;
  patrimonioNetoUSD: number;
  ingresosCampanaUSD: number;
  ingresosCampanaPYG: number;
  costosCampanaUSD: number;
  costosCampanaPYG: number;
  margenBrutoCampanaUSD: number;
  margenBrutoCampanaPYG: number;
}
