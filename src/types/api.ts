import {
  AmbitoFinanciero,
  CampanaLoteAgro,
  CategoriaConfigAgro,
  ChequeDiferido,
  CotizacionBimoneda,
  CuentaAgro,
  CurrencyCode,
  DireccionObligacion,
  EstadoChequeDiferido,
  FlujoCajaProyectado,
  InstrumentoFinanciero,
  MacroCategoriaAgro,
  MetricasDashboardAgro,
  MovimientoAgro,
  PeriodicidadCuota,
  PrestamoAgro,
  PresupuestoRubroAgro,
  TipoChequeDiferido,
  TipoCuentaAgro,
  TipoMovimientoAgro,
} from './domain';

export interface GasResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
  timestamp?: string;
}

export interface BootstrapPayload {
  cotizacion: CotizacionBimoneda;
  cuentas: CuentaAgro[];
  campanas: CampanaLoteAgro[];
  categorias?: CategoriaConfigAgro[];
  movimientos: MovimientoAgro[];
  presupuestos: PresupuestoRubroAgro[];
  prestamos: PrestamoAgro[];
  cheques: ChequeDiferido[];
  metricas: MetricasDashboardAgro;
  flujo?: FlujoCajaProyectado;
}

export interface RegistrarMovimientoInput {
  fecha?: string;
  ambito: AmbitoFinanciero;
  tipo: TipoMovimientoAgro;
  cuentaId: string;
  campanaId?: string;
  macroCategoria: MacroCategoriaAgro;
  subCategoria: string;
  concepto: string;
  contraparte?: string;
  moneda: CurrencyCode;
  monto: number;
  tasaCambio?: number;
  litrosGasoil?: number;
  precioLitro?: number;
  toneladasCabezas?: number;
  comprobanteNro?: string;
  referenciaId?: string;
}

export interface AnularMovimientoInput {
  movimientoId: string;
}

export interface RegistrarTransferenciaInput {
  fecha?: string;
  cuentaOrigenId: string;
  cuentaDestinoId: string;
  campanaId?: string;
  montoOrigen: number;
  tasaCambio: number;
  concepto: string;
}

export interface PagarTarjetaInput {
  cuentaOrigenId: string;
  tarjetaId: string;
  monto: number;
  tasaCambio: number;
  concepto: string;
}

export interface AjustarSaldoInput {
  cuentaId: string;
  nuevoSaldo: number;
  motivo: string;
}

export interface ActualizarCotizacionInput {
  compraPYG: number;
  ventaPYG: number;
  referenciaBCP: number;
}

export interface CrearCuentaInput {
  nombre: string;
  ambito: AmbitoFinanciero;
  tipo: TipoCuentaAgro;
  moneda: CurrencyCode;
  saldoActual: number;
  limiteCredito?: number;
  deudaActual?: number;
  cierreDia?: number;
  vencimientoDia?: number;
  entidad: string;
}

export interface CrearCompraCuotasInput {
  ambito: AmbitoFinanciero;
  direccion: DireccionObligacion;
  nombre: string;
  contraparte: string;
  instrumento?: InstrumentoFinanciero;
  periodicidad: PeriodicidadCuota;
  campanaId?: string;
  moneda: CurrencyCode;
  montoTotal: number;
  cuotasTotales: number;
  primerVencimiento: string; // DD-MM-AAAA
  tasaAnualPct?: number;
}

export interface PagarCuotaInput {
  prestamoId: string;
  cuotaId: string;
  cuentaId: string;
  fechaPago?: string; // DD-MM-AAAA
  tasaCambio?: number;
}

export interface CrearChequeDiferidoInput {
  ambito: AmbitoFinanciero;
  tipo: TipoChequeDiferido;
  numeroCheque: string;
  bancoEntidad: string;
  cuentaId?: string;
  contraparte: string;
  concepto: string;
  moneda: CurrencyCode;
  monto: number;
  tasaCambio?: number;
  fechaEmision?: string;
  fechaCobroPago: string; // DD-MM-AAAA
}

export interface LiquidarChequeInput {
  chequeId: string;
  cuentaId: string;
  fechaLiquidacion?: string; // DD-MM-AAAA
  tasaCambio?: number;
}

export interface CambiarEstadoChequeInput {
  chequeId: string;
  estado: EstadoChequeDiferido;
}
