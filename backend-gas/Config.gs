/**
 * AGROFINANCE PARAGUAY - CONFIGURACIÓN MAESTRA DEL LIBRO GOOGLE SHEETS
 * Arquitectura Bimoneda Estricta: PYG (Guaraníes) y USD (Dólares Estadounidenses)
 */

const SHEET_NAMES = {
  CUENTAS: 'Cuentas',
  CAMPANAS_LOTES: 'Campanas_Lotes',
  MOVIMIENTOS: 'Movimientos',
  CONFIG_CATEGORIAS: 'Config_Categorias',
  PRESUPUESTOS: 'Presupuestos',
  PRESTAMOS: 'Prestamos',
  CUOTAS_PROYECTADAS: 'Cuotas_Proyectadas',
  COTIZACIONES: 'Cotizaciones',
};

/**
 * Definición exacta de columnas (0-indexed) para validación y lectura estructurada
 */
const SCHEMA = {
  // 1. Pestaña: Cuentas (Bancos, Cajas de Estancia, Silos/Cuentas Corrientes Granarias, Tarjetas Agro)
  CUENTAS: [
    'id',                 // A: CTA-01
    'nombre',             // B: Itaú Agro USD / Caja Estancia San Pedro / Tarjeta Campo Sudameris
    'tipo',               // C: BANCO | CAJA_ESTANCIA | TARJETA_AGRO | CUENTA_GRANARIA
    'moneda',             // D: PYG | USD
    'saldoActual',        // E: Número (en moneda nativa de la cuenta)
    'limiteCredito',      // F: Número (0 si no es TARJETA_AGRO / línea rotativa)
    'deudaActual',        // G: Número (para TARJETA_AGRO)
    'cierreDia',          // H: Día de cierre (1-31)
    'vencimientoDia',     // I: Día de vencimiento (1-31)
    'entidad',            // J: Banco Itaú / Regional / Sudameris / BNF / Propia
    'icono',              // K: Landmark | Wallet | CreditCard | Wheat
    'activa'              // L: TRUE | FALSE
  ],

  // 2. Pestaña: Campanas_Lotes (Unidades Productivas / Zafras / Lotes / Rodeos)
  CAMPANAS_LOTES: [
    'id',                 // A: CMP-SOJA-2627
    'nombre',             // B: Soja Zafra 26/27 - Lote Norte
    'actividad',          // C: AGRICULTURA | GANADERIA | MIXTO | MAQUINARIA
    'cultivoRodeo',       // D: Soja | Maíz Zafriña | Trigo | Cría | Invernada
    'hectareasCabezas',   // E: 450 (ha o cabezas)
    'unidadMedida',       // F: HA | CABEZAS
    'estado',             // G: EN_CURSO | PLANIFICADA | CERRADA
    'metaRinde',          // H: 3600 (kg/ha o kg/cab)
    'monedaBase',         // I: USD | PYG
    'fechaInicio',        // J: DD-MM-AAAA
    'fechaFinEstimada'    // K: DD-MM-AAAA
  ],

  // 3. Pestaña: Movimientos (Libro Diario Bimoneda)
  MOVIMIENTOS: [
    'id',                 // A: MOV-20261109-001
    'fecha',              // B: DD-MM-AAAA
    'tipo',               // C: GASTO | INGRESO | TRANSFERENCIA | PAGO_TARJETA | PAGO_CUOTA | AJUSTE
    'cuentaId',           // D: FK -> Cuentas.id
    'cuentaDestinoId',    // E: FK -> Cuentas.id (solo transferencias)
    'campanaId',          // F: FK -> Campanas_Lotes.id
    'macroCategoria',     // G: INSUMOS_AGRICOLAS | LABORES_COMBUSTIBLE | SANIDAD_NUTRICION | LOGISTICA_COMERCIAL | FINANCIERO_IMPUESTOS | VENTAS_AGRO
    'subCategoria',       // H: Gasoil / Semillas / Flete / Herbicidas / Venta Soja / Jornal
    'concepto',           // I: Descripción operativa
    'moneda',             // J: PYG | USD (moneda nativa de la transacción)
    'monto',              // K: Monto en moneda nativa
    'tasaCambio',         // L: Cotización USD/PYG aplicada en el momento (ej. 7850)
    'montoPYG',           // M: Equivalente exacto en Guaraníes (entero)
    'montoUSD',           // N: Equivalente exacto en Dólares (2 decimales)
    'litrosGasoil',       // O: Opcional (control de tanque/combustible)
    'precioLitro',        // P: Opcional (Gs/Litro)
    'toneladasCabezas',   // Q: Opcional (para liquidaciones de grano/hacienda)
    'comprobanteNro'      // R: Factura Timbrado / Boleta Báscula / Recibo
  ],

  // 4. Pestaña: Config_Categorias
  CONFIG_CATEGORIAS: [
    'id',                 // A: CAT-01
    'tipoFlujo',          // B: GASTO | INGRESO
    'macro',              // C: INSUMOS_AGRICOLAS
    'nombre',             // D: Semillas & Inoculantes
    'icono',              // E: Sprout | Fuel | Truck | ShieldAlert | Tractor | Wheat | Beef
    'monedaSugerida'      // F: USD | PYG
  ],

  // 5. Pestaña: Presupuestos (Presupuesto por Campaña y Rubro Macro)
  PRESUPUESTOS: [
    'id',                 // A: PRES-01
    'campanaId',          // B: FK -> Campanas_Lotes.id
    'macroCategoria',     // C: INSUMOS_AGRICOLAS
    'nombreRubro',        // D: Semillas, Fertilizantes y Defensivos
    'moneda',             // E: USD | PYG
    'montoAsignadoUSD',   // F: Presupuesto tope en USD
    'montoAsignadoPYG',   // G: Presupuesto tope en PYG
    'icono'               // H: Sprout | Fuel | Tractor | Beef | Wrench
  ],

  // 6. Pestaña: Prestamos (Financiación de Insumos, Prendas de Maquinaria, Warrants)
  PRESTAMOS: [
    'id',                 // A: PRE-01
    'nombre',             // B: Prenda John Deere 6155J / Financiación Zafra Cargill
    'entidad',            // C: Banco Regional / Cargill / ADM / Sudameris
    'instrumento',        // D: PRENDA_MAQUINARIA | INSUMOS_ZAFRA | WARRANT_GRANOS | CREDITO_GANADERO
    'campanaId',          // E: FK -> Campanas_Lotes.id
    'moneda',             // F: USD | PYG
    'capitalOriginal',    // G: Monto original
    'saldoPendiente',     // H: Capital + interés pendiente
    'tasaAnualPct',       // I: 8.5
    'cuotasTotales',      // J: 10
    'cuotasPagadas',      // K: 4
    'proximoVencimiento', // L: DD-MM-AAAA
    'montoProximaCuota',  // M: Monto cuota próxima
    'estado'              // N: ACTIVO | CANCELADO | VENCIDO
  ],

  // 7. Pestaña: Cuotas_Proyectadas
  CUOTAS_PROYECTADAS: [
    'id',                 // A: CUO-01
    'prestamoId',         // B: FK -> Prestamos.id
    'numeroCuota',        // C: 5
    'fechaVencimiento',   // D: DD-MM-AAAA
    'moneda',             // E: USD | PYG
    'montoCapital',       // F: Capital
    'montoInteres',       // G: Interés
    'montoTotal',         // H: Total Cuota
    'estado',             // I: PENDIENTE | PAGADA | VENCIDA
    'fechaPago',          // J: DD-MM-AAAA
    'movimientoId'        // K: FK -> Movimientos.id
  ],

  // 8. Pestaña: Cotizaciones
  COTIZACIONES: [
    'id',                 // A: COT-001
    'fecha',              // B: DD-MM-AAAA
    'compraPYG',          // C: 7800
    'ventaPYG',           // D: 7860
    'referenciaBCP',      // E: 7835
    'vigente'             // F: TRUE | FALSE
  ]
};

function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getSheetByNameSafe(name) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(name);
  if (!sheet) {
    throw new Error('No se encontró la pestaña requerida: ' + name);
  }
  return sheet;
}

