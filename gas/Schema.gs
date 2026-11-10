/**
 * ============================================================================
 * AGROFINANCE - ESQUEMA DECLARATIVO Y MOTOR DE MIGRACIÓN (01_Schema.gs)
 * ============================================================================
 * Este archivo centraliza TODAS las pestañas, columnas, tipos de dato y valores
 * por defecto de la planilla Google Sheets.
 *
 * CÓMO EVOLUCIONAR EL ESQUEMA EN EL FUTURO:
 * 1. Agregá o modificá columnas dentro de `AGROFINANCE_SCHEMA.SHEETS`.
 * 2. En Google Sheets, ejecutá: Menú "AgroFinance" -> "Inicializar / Actualizar Esquema"
 *    (o llamá ?action=initSchema).
 * 3. Las columnas nuevas se agregan automáticamente sin borrar ni desordenar datos.
 *    Toda lectura/escritura mapea por NOMBRE DE CABECERA, no por índice fijo.
 * ============================================================================
 */

const AGROFINANCE_SCHEMA = {
  VERSION: '2.0.0',
  SHEETS: {
    Config: {
      columns: ['key', 'value', 'updatedAt'],
      types: { key: 'text', value: 'text', updatedAt: 'date' },
      defaults: {},
    },
    Cuentas: {
      columns: [
        'id',
        'nombre',
        'ambito',
        'tipo',
        'moneda',
        'saldoActual',
        'limiteCredito',
        'deudaActual',
        'disponibleCredito',
        'cierreDia',
        'vencimientoDia',
        'entidad',
        'icono',
        'activa',
        'equivalentePYG',
        'equivalenteUSD',
      ],
      types: {
        id: 'text',
        nombre: 'text',
        ambito: 'text',
        tipo: 'text',
        moneda: 'text',
        saldoActual: 'number',
        limiteCredito: 'number',
        deudaActual: 'number',
        disponibleCredito: 'number',
        cierreDia: 'number',
        vencimientoDia: 'number',
        entidad: 'text',
        icono: 'text',
        activa: 'boolean',
        equivalentePYG: 'number',
        equivalenteUSD: 'number',
      },
      defaults: {
        ambito: 'NEGOCIO',
        limiteCredito: 0,
        deudaActual: 0,
        disponibleCredito: 0,
        cierreDia: 1,
        vencimientoDia: 1,
        activa: true,
      },
    },
    Campanas: {
      columns: [
        'id',
        'nombre',
        'ambito',
        'actividad',
        'cultivoRodeo',
        'hectareasCabezas',
        'unidadMedida',
        'estado',
        'metaRinde',
        'monedaBase',
        'fechaInicio',
        'fechaFinEstimada',
      ],
      types: {
        id: 'text',
        nombre: 'text',
        ambito: 'text',
        actividad: 'text',
        cultivoRodeo: 'text',
        hectareasCabezas: 'number',
        unidadMedida: 'text',
        estado: 'text',
        metaRinde: 'number',
        monedaBase: 'text',
        fechaInicio: 'date',
        fechaFinEstimada: 'date',
      },
      defaults: {
        ambito: 'NEGOCIO',
        unidadMedida: 'HA',
        estado: 'EN_CURSO',
        monedaBase: 'PYG',
      },
    },
    Categorias: {
      columns: ['id', 'tipoFlujo', 'ambito', 'macro', 'nombre', 'icono', 'monedaSugerida'],
      types: {
        id: 'text',
        tipoFlujo: 'text',
        ambito: 'text',
        macro: 'text',
        nombre: 'text',
        icono: 'text',
        monedaSugerida: 'text',
      },
      defaults: {
        ambito: 'NEGOCIO',
        monedaSugerida: 'PYG',
      },
    },
    Movimientos: {
      columns: [
        'id',
        'fecha',
        'ambito',
        'tipo',
        'cuentaId',
        'cuentaDestinoId',
        'campanaId',
        'macroCategoria',
        'subCategoria',
        'concepto',
        'contraparte',
        'moneda',
        'monto',
        'tasaCambio',
        'montoPYG',
        'montoUSD',
        'litrosGasoil',
        'precioLitro',
        'toneladasCabezas',
        'comprobanteNro',
        'referenciaId',
        'anulado',
      ],
      types: {
        id: 'text',
        fecha: 'date',
        ambito: 'text',
        tipo: 'text',
        cuentaId: 'text',
        cuentaDestinoId: 'text',
        campanaId: 'text',
        macroCategoria: 'text',
        subCategoria: 'text',
        concepto: 'text',
        contraparte: 'text',
        moneda: 'text',
        monto: 'number',
        tasaCambio: 'number',
        montoPYG: 'number',
        montoUSD: 'number',
        litrosGasoil: 'number',
        precioLitro: 'number',
        toneladasCabezas: 'number',
        comprobanteNro: 'text',
        referenciaId: 'text',
        anulado: 'boolean',
      },
      defaults: {
        ambito: 'NEGOCIO',
        anulado: false,
      },
    },
    Prestamos: {
      columns: [
        'id',
        'ambito',
        'direccion',
        'nombre',
        'entidad',
        'contraparte',
        'instrumento',
        'periodicidad',
        'campanaId',
        'moneda',
        'capitalOriginal',
        'saldoPendiente',
        'tasaAnualPct',
        'cuotasTotales',
        'cuotasPagadas',
        'proximoVencimiento',
        'montoProximaCuota',
        'estado',
      ],
      types: {
        id: 'text',
        ambito: 'text',
        direccion: 'text',
        nombre: 'text',
        entidad: 'text',
        contraparte: 'text',
        instrumento: 'text',
        periodicidad: 'text',
        campanaId: 'text',
        moneda: 'text',
        capitalOriginal: 'number',
        saldoPendiente: 'number',
        tasaAnualPct: 'number',
        cuotasTotales: 'number',
        cuotasPagadas: 'number',
        proximoVencimiento: 'date',
        montoProximaCuota: 'number',
        estado: 'text',
      },
      defaults: {
        ambito: 'NEGOCIO',
        direccion: 'PAGAR',
        periodicidad: 'MENSUAL',
        tasaAnualPct: 0,
        estado: 'ACTIVO',
      },
    },
    Cuotas: {
      columns: [
        'id',
        'prestamoId',
        'numeroCuota',
        'fechaVencimiento',
        'moneda',
        'montoCapital',
        'montoInteres',
        'montoTotal',
        'estado',
        'fechaPago',
        'cuentaId',
        'movimientoId',
      ],
      types: {
        id: 'text',
        prestamoId: 'text',
        numeroCuota: 'number',
        fechaVencimiento: 'date',
        moneda: 'text',
        montoCapital: 'number',
        montoInteres: 'number',
        montoTotal: 'number',
        estado: 'text',
        fechaPago: 'date',
        cuentaId: 'text',
        movimientoId: 'text',
      },
      defaults: {
        montoInteres: 0,
        estado: 'PENDIENTE',
      },
    },
    Cheques: {
      columns: [
        'id',
        'ambito',
        'tipo',
        'numeroCheque',
        'bancoEntidad',
        'cuentaId',
        'contraparte',
        'concepto',
        'moneda',
        'monto',
        'tasaCambio',
        'montoPYG',
        'montoUSD',
        'fechaEmision',
        'fechaCobroPago',
        'estado',
        'fechaLiquidacion',
        'movimientoId',
      ],
      types: {
        id: 'text',
        ambito: 'text',
        tipo: 'text',
        numeroCheque: 'text',
        bancoEntidad: 'text',
        cuentaId: 'text',
        contraparte: 'text',
        concepto: 'text',
        moneda: 'text',
        monto: 'number',
        tasaCambio: 'number',
        montoPYG: 'number',
        montoUSD: 'number',
        fechaEmision: 'date',
        fechaCobroPago: 'date',
        estado: 'text',
        fechaLiquidacion: 'date',
        movimientoId: 'text',
      },
      defaults: {
        ambito: 'NEGOCIO',
        estado: 'PENDIENTE',
      },
    },
    Presupuestos: {
      columns: [
        'id',
        'campanaId',
        'macroCategoria',
        'nombreRubro',
        'moneda',
        'montoAsignadoUSD',
        'montoAsignadoPYG',
        'ejecutadoUSD',
        'ejecutadoPYG',
        'disponibleUSD',
        'disponiblePYG',
        'porcentajeUso',
        'alertaExceso',
        'icono',
      ],
      types: {
        id: 'text',
        campanaId: 'text',
        macroCategoria: 'text',
        nombreRubro: 'text',
        moneda: 'text',
        montoAsignadoUSD: 'number',
        montoAsignadoPYG: 'number',
        ejecutadoUSD: 'number',
        ejecutadoPYG: 'number',
        disponibleUSD: 'number',
        disponiblePYG: 'number',
        porcentajeUso: 'number',
        alertaExceso: 'boolean',
        icono: 'text',
      },
      defaults: {
        alertaExceso: false,
      },
    },
  },
};

/**
 * Menú personalizado en Google Sheets para administrar el esquema con 1 clic.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('AgroFinance')
    .addItem('1. Inicializar / Actualizar Esquema', 'menuInitSchema')
    .addItem('2. Cargar Catálogo Base (Categorías y Tasa)', 'menuSeedBase')
    .addSeparator()
    .addItem('3. Cargar Datos Demo (Caso Dani: Maní + Personal)', 'menuSeedDemoDani')
    .addItem('4. Limpiar Datos Transaccionales (Empezar de cero)', 'menuResetClean')
    .addToUi();
}

function menuInitSchema() {
  const report = initOrMigrateSchema();
  SpreadsheetApp.getUi().alert(
    'Esquema AgroFinance v' + AGROFINANCE_SCHEMA.VERSION + ' listo:\n' + report.join('\n')
  );
}

function menuSeedBase() {
  initOrMigrateSchema();
  seedBaseConfigAndCategories_(true);
  SpreadsheetApp.getUi().alert('Configuración base y categorías cargadas.');
}

function menuSeedDemoDani() {
  initOrMigrateSchema();
  seedDemoDaniData_();
  SpreadsheetApp.getUi().alert('Datos demo de Dani (Maní + Personal) cargados en la planilla.');
}

function menuResetClean() {
  const ui = SpreadsheetApp.getUi();
  const res = ui.alert(
    'Confirmar limpieza',
    '¿Querés vaciar Cuentas, Movimientos, Cheques, Préstamos y Cuotas para empezar de cero (conservando Categorías y Cotización)?',
    ui.ButtonSet.YES_NO
  );
  if (res !== ui.Button.YES) return;
  resetUserSheetsKeepCatalog_();
  ui.alert('Planilla limpiada. Lista para cargar datos reales.');
}

/**
 * Crea pestañas faltantes y agrega columnas nuevas sin sobrescribir datos existentes.
 */
function initOrMigrateSchema() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const report = [];

  Object.keys(AGROFINANCE_SCHEMA.SHEETS).forEach((sheetName) => {
    const def = AGROFINANCE_SCHEMA.SHEETS[sheetName];
    let sheet = ss.getSheetByName(sheetName);
    let created = false;

    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      created = true;
    }

    const lastCol = sheet.getLastColumn();
    const existingHeaders =
      lastCol > 0
        ? sheet
            .getRange(1, 1, 1, lastCol)
            .getValues()[0]
            .map((h) => String(h).trim())
            .filter((h) => h !== '')
        : [];

    const missingCols = def.columns.filter((col) => existingHeaders.indexOf(col) === -1);

    if (existingHeaders.length === 0) {
      sheet.getRange(1, 1, 1, def.columns.length).setValues([def.columns]);
      styleHeaderRange_(sheet, 1, def.columns.length);
      applyColumnFormats_(sheet, def);
      report.push(`+ ${sheetName}: creada (${def.columns.length} columnas)`);
    } else if (missingCols.length > 0) {
      const startCol = existingHeaders.length + 1;
      sheet.getRange(1, startCol, 1, missingCols.length).setValues([missingCols]);
      styleHeaderRange_(sheet, startCol, missingCols.length);

      // Rellenar defaults en filas existentes para columnas recién agregadas
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        missingCols.forEach((col, idx) => {
          const defaultVal =
            def.defaults && Object.prototype.hasOwnProperty.call(def.defaults, col)
              ? def.defaults[col]
              : '';
          if (defaultVal !== '') {
            const fill = Array.from({ length: lastRow - 1 }, () => [defaultVal]);
            sheet.getRange(2, startCol + idx, lastRow - 1, 1).setValues(fill);
          }
        });
      }
      applyColumnFormats_(sheet, def);
      report.push(`~ ${sheetName}: agregadas columnas [${missingCols.join(', ')}]`);
    } else if (created) {
      report.push(`+ ${sheetName}: creada`);
    } else {
      report.push(`= ${sheetName}: esquema al día`);
    }

    sheet.setFrozenRows(1);
  });

  // Eliminar "Hoja 1" / "Sheet1" vacía por defecto si existen otras pestañas
  ['Hoja 1', 'Sheet1'].forEach((defaultName) => {
    const defSheet = ss.getSheetByName(defaultName);
    if (defSheet && ss.getSheets().length > 1 && defSheet.getLastRow() === 0) {
      ss.deleteSheet(defSheet);
    }
  });

  seedBaseConfigAndCategories_(false);

  PropertiesService.getScriptProperties().setProperty(
    'AGROFINANCE_SCHEMA_VERSION',
    AGROFINANCE_SCHEMA.VERSION
  );

  return report;
}

function ensureSchemaInitialized_() {
  const props = PropertiesService.getScriptProperties();
  const ver = props.getProperty('AGROFINANCE_SCHEMA_VERSION');
  if (ver === AGROFINANCE_SCHEMA.VERSION) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss.getSheetByName('Cheques') && ss.getSheetByName('Movimientos')) {
      return;
    }
  }
  initOrMigrateSchema();
}

function styleHeaderRange_(sheet, startCol, count) {
  const range = sheet.getRange(1, startCol, 1, count);
  range
    .setBackground('#064E3B')
    .setFontColor('#ECFDF5')
    .setFontWeight('bold')
    .setHorizontalAlignment('left')
    .setVerticalAlignment('middle');
  sheet.setRowHeight(1, 30);
}

function applyColumnFormats_(sheet, def) {
  const availableRows = sheet.getMaxRows() - 1;
  const lastCol = sheet.getLastColumn();
  if (availableRows <= 0 || lastCol <= 0) return;

  const headers = sheet
    .getRange(1, 1, 1, lastCol)
    .getValues()[0]
    .map((h) => String(h).trim());

  headers.forEach((colName, idx) => {
    const colType = (def.types && def.types[colName]) || 'text';
    if (colType === 'text' || colType === 'date') {
      sheet.getRange(2, idx + 1, availableRows, 1).setNumberFormat('@');
    }
  });
}

// ============================================================================
// HELPERS GENÉRICOS BASADOS EN CABECERAS (SCHEMA-AWARE CRUD)
// ============================================================================

function getSheetHeaders_(sheet) {
  const lastCol = sheet.getLastColumn();
  if (lastCol === 0) return [];
  return sheet
    .getRange(1, 1, 1, lastCol)
    .getValues()[0]
    .map((h) => String(h).trim());
}

function coerceCellRead_(val, colName, schemaDef) {
  const colType = (schemaDef.types && schemaDef.types[colName]) || 'text';
  if (val === '' || val === null || val === undefined) {
    if (schemaDef.defaults && Object.prototype.hasOwnProperty.call(schemaDef.defaults, colName)) {
      return schemaDef.defaults[colName];
    }
    return colType === 'number' ? undefined : colType === 'boolean' ? false : '';
  }

  if (colType === 'date') {
    if (val instanceof Date) {
      return Utilities.formatDate(val, Session.getScriptTimeZone() || 'America/Asuncion', 'dd-MM-yyyy');
    }
    return String(val).trim();
  }

  if (colType === 'number') {
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  }

  if (colType === 'boolean') {
    if (typeof val === 'boolean') return val;
    const s = String(val).trim().toLowerCase();
    return s === 'true' || s === '1' || s === 'si' || s === 'sí';
  }

  return String(val);
}

function coerceCellWrite_(val, colName, schemaDef) {
  if (val === undefined || val === null) {
    if (schemaDef.defaults && Object.prototype.hasOwnProperty.call(schemaDef.defaults, colName)) {
      return schemaDef.defaults[colName];
    }
    return '';
  }
  const colType = (schemaDef.types && schemaDef.types[colName]) || 'text';
  if (colType === 'number') {
    const n = Number(val);
    return isNaN(n) ? 0 : n;
  }
  if (colType === 'boolean') {
    return Boolean(val);
  }
  return String(val);
}

function readTable_(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  const schemaDef = AGROFINANCE_SCHEMA.SHEETS[sheetName];
  if (!sheet || !schemaDef) return [];

  const lastRow = sheet.getLastRow();
  const headers = getSheetHeaders_(sheet);
  if (lastRow <= 1 || headers.length === 0) return [];

  const rows = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  return rows
    .filter((row) => row.some((cell) => cell !== '' && cell !== null && cell !== undefined))
    .map((row) => {
      const obj = {};
      headers.forEach((h, idx) => {
        if (!h) return;
        const coerced = coerceCellRead_(row[idx], h, schemaDef);
        if (coerced !== undefined && coerced !== '') {
          obj[h] = coerced;
        } else if (schemaDef.types[h] === 'boolean') {
          obj[h] = Boolean(coerced);
        } else if (
          schemaDef.types[h] === 'number' &&
          schemaDef.defaults &&
          Object.prototype.hasOwnProperty.call(schemaDef.defaults, h)
        ) {
          obj[h] = schemaDef.defaults[h];
        } else if (schemaDef.types[h] === 'number' && (row[idx] === 0 || row[idx] === '0')) {
          obj[h] = 0;
        }
      });
      return obj;
    });
}

function appendRecord_(sheetName, record) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  const schemaDef = AGROFINANCE_SCHEMA.SHEETS[sheetName];
  if (!sheet || !schemaDef) throw new Error('Pestaña no encontrada: ' + sheetName);

  const headers = getSheetHeaders_(sheet);
  const row = headers.map((h) => coerceCellWrite_(record[h], h, schemaDef));
  sheet.appendRow(row);

  // Asegurar formato texto en celdas de texto/fecha de la nueva fila
  const newRowIdx = sheet.getLastRow();
  headers.forEach((h, idx) => {
    const t = (schemaDef.types && schemaDef.types[h]) || 'text';
    if (t === 'text' || t === 'date') {
      sheet.getRange(newRowIdx, idx + 1).setNumberFormat('@');
    }
  });
  return record;
}

function appendRecordsBatch_(sheetName, records) {
  if (!records || records.length === 0) return;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  const schemaDef = AGROFINANCE_SCHEMA.SHEETS[sheetName];
  if (!sheet || !schemaDef) throw new Error('Pestaña no encontrada: ' + sheetName);

  const headers = getSheetHeaders_(sheet);
  const matrix = records.map((rec) =>
    headers.map((h) => coerceCellWrite_(rec[h], h, schemaDef))
  );
  const startRow = sheet.getLastRow() + 1;
  sheet.getRange(startRow, 1, matrix.length, headers.length).setValues(matrix);
  headers.forEach((h, idx) => {
    const t = (schemaDef.types && schemaDef.types[h]) || 'text';
    if (t === 'text' || t === 'date') {
      sheet.getRange(startRow, idx + 1, matrix.length, 1).setNumberFormat('@');
    }
  });
}

function updateRecordById_(sheetName, id, patchOrFn, idField) {
  const keyField = idField || 'id';
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  const schemaDef = AGROFINANCE_SCHEMA.SHEETS[sheetName];
  if (!sheet || !schemaDef) throw new Error('Pestaña no encontrada: ' + sheetName);

  const lastRow = sheet.getLastRow();
  const headers = getSheetHeaders_(sheet);
  const idColIdx = headers.indexOf(keyField);
  if (lastRow <= 1 || idColIdx === -1) return null;

  const dataRange = sheet.getRange(2, 1, lastRow - 1, headers.length);
  const values = dataRange.getValues();

  for (let r = 0; r < values.length; r++) {
    if (String(values[r][idColIdx]).trim() === String(id).trim()) {
      const currentObj = {};
      headers.forEach((h, idx) => {
        currentObj[h] = coerceCellRead_(values[r][idx], h, schemaDef);
      });
      const nextObj =
        typeof patchOrFn === 'function'
          ? patchOrFn(currentObj)
          : Object.assign({}, currentObj, patchOrFn);

      const nextRow = headers.map((h) => coerceCellWrite_(nextObj[h], h, schemaDef));
      sheet.getRange(r + 2, 1, 1, headers.length).setValues([nextRow]);
      return nextObj;
    }
  }
  return null;
}

function replaceTable_(sheetName, records) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  const schemaDef = AGROFINANCE_SCHEMA.SHEETS[sheetName];
  if (!sheet || !schemaDef) return;

  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  }
  if (records && records.length > 0) {
    appendRecordsBatch_(sheetName, records);
  }
}

// ============================================================================
// SEMILLAS DE CATÁLOGO BASE Y DEMO OPCIONAL DE DANI
// ============================================================================

function schemaTodayDDMMYYYY_() {
  return Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone() || 'America/Asuncion',
    'dd-MM-yyyy'
  );
}

function schemaAddDaysDDMMYYYY_(ddmmyyyy, days) {
  const parts = String(ddmmyyyy || '').split('-');
  const d =
    parts.length === 3
      ? new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]), 12, 0, 0, 0)
      : new Date();
  d.setDate(d.getDate() + days);
  return Utilities.formatDate(
    d,
    Session.getScriptTimeZone() || 'America/Asuncion',
    'dd-MM-yyyy'
  );
}

function seedBaseConfigAndCategories_(forceCategories) {
  const existingConfig = readTable_('Config');
  if (existingConfig.length === 0) {
    const hoy = schemaTodayDDMMYYYY_();
    appendRecordsBatch_('Config', [
      { key: 'cotizacion_id', value: 'COT-INIT', updatedAt: hoy },
      { key: 'cotizacion_fecha', value: hoy, updatedAt: hoy },
      { key: 'compraPYG', value: '7810', updatedAt: hoy },
      { key: 'ventaPYG', value: '7860', updatedAt: hoy },
      { key: 'referenciaBCP', value: '7835', updatedAt: hoy },
    ]);
  }

  const existingCats = readTable_('Categorias');
  if (existingCats.length === 0 || forceCategories) {
    const defaultCats = [
      {
        id: 'CAT-INS-MANI',
        tipoFlujo: 'GASTO',
        ambito: 'NEGOCIO',
        macro: 'INSUMOS_AGRICOLAS',
        nombre: 'Semillas, Insumos & Bolsa Maní',
        icono: 'Sprout',
        monedaSugerida: 'PYG',
      },
      {
        id: 'CAT-MAQ-COMB',
        tipoFlujo: 'GASTO',
        ambito: 'NEGOCIO',
        macro: 'LABORES_COMBUSTIBLE',
        nombre: 'Maquinaria, Repuestos & Combustible',
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
        nombre: 'Impuestos, Cuotas & Gastos Bancarios',
        icono: 'ShieldCheck',
        monedaSugerida: 'PYG',
      },
      {
        id: 'CAT-VTA-MANI',
        tipoFlujo: 'INGRESO',
        ambito: 'NEGOCIO',
        macro: 'VENTAS_AGRO',
        nombre: 'Venta de Maní / Clientes Mayoristas',
        icono: 'Wheat',
        monedaSugerida: 'USD',
      },
      {
        id: 'CAT-PER-HOGAR',
        tipoFlujo: 'GASTO',
        ambito: 'PERSONAL',
        macro: 'HOGAR_ALIMENTACION',
        nombre: 'Hogar, Supermercado & Alquiler',
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
        nombre: 'Vehículo, Nafta & Gastos Personales',
        icono: 'Car',
        monedaSugerida: 'PYG',
      },
      {
        id: 'CAT-PER-ING',
        tipoFlujo: 'INGRESO',
        ambito: 'PERSONAL',
        macro: 'INGRESO_PERSONAL',
        nombre: 'Ingreso Personal / Honorarios',
        icono: 'Wallet',
        monedaSugerida: 'PYG',
      },
    ];
    if (forceCategories) {
      replaceTable_('Categorias', defaultCats);
    } else {
      appendRecordsBatch_('Categorias', defaultCats);
    }
  }
}

function resetUserSheetsKeepCatalog_() {
  ['Cuentas', 'Campanas', 'Movimientos', 'Prestamos', 'Cuotas', 'Cheques', 'Presupuestos'].forEach(
    (name) => replaceTable_(name, [])
  );
  seedBaseConfigAndCategories_(false);
}

function seedDemoDaniData_() {
  resetUserSheetsKeepCatalog_();
  const tasa = 7835;
  const hoy = schemaTodayDDMMYYYY_();

  replaceTable_('Campanas', [
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
  ]);

  replaceTable_('Cuentas', [
    {
      id: 'CTA-NEG-ITAU-PYG',
      nombre: 'Itaú Cta. Cte. Negocio',
      ambito: 'NEGOCIO',
      tipo: 'BANCO',
      moneda: 'PYG',
      saldoActual: 24500000,
      limiteCredito: 0,
      deudaActual: 0,
      disponibleCredito: 0,
      cierreDia: 1,
      vencimientoDia: 1,
      entidad: 'Banco Itaú',
      icono: 'Landmark',
      activa: true,
      equivalentePYG: 24500000,
      equivalenteUSD: Number((24500000 / tasa).toFixed(2)),
    },
    {
      id: 'CTA-NEG-USD',
      nombre: 'Caja / Banco USD Maní',
      ambito: 'NEGOCIO',
      tipo: 'BANCO',
      moneda: 'USD',
      saldoActual: 3200,
      limiteCredito: 0,
      deudaActual: 0,
      disponibleCredito: 0,
      cierreDia: 1,
      vencimientoDia: 1,
      entidad: 'Banco Sudameris',
      icono: 'Briefcase',
      activa: true,
      equivalentePYG: Math.round(3200 * tasa),
      equivalenteUSD: 3200,
    },
    {
      id: 'CTA-PER-EFECTIVO',
      nombre: 'Billetera / Caja Personal',
      ambito: 'PERSONAL',
      tipo: 'EFECTIVO',
      moneda: 'PYG',
      saldoActual: 4800000,
      limiteCredito: 0,
      deudaActual: 0,
      disponibleCredito: 0,
      cierreDia: 1,
      vencimientoDia: 1,
      entidad: 'Efectivo Personal',
      icono: 'Wallet',
      activa: true,
      equivalentePYG: 4800000,
      equivalenteUSD: Number((4800000 / tasa).toFixed(2)),
    },
  ]);

  replaceTable_('Prestamos', [
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
      capitalOriginal: 36000000,
      saldoPendiente: 24000000,
      tasaAnualPct: 0,
      cuotasTotales: 3,
      cuotasPagadas: 1,
      proximoVencimiento: schemaAddDaysDDMMYYYY_(hoy, 6),
      montoProximaCuota: 12000000,
      estado: 'ACTIVO',
    },
  ]);

  replaceTable_('Cuotas', [
    {
      id: 'CUO-MANI-1',
      prestamoId: 'PRE-MAQ-MANI',
      numeroCuota: 1,
      fechaVencimiento: schemaAddDaysDDMMYYYY_(hoy, -24),
      moneda: 'PYG',
      montoCapital: 12000000,
      montoInteres: 0,
      montoTotal: 12000000,
      estado: 'PAGADA',
      fechaPago: schemaAddDaysDDMMYYYY_(hoy, -24),
      cuentaId: 'CTA-NEG-ITAU-PYG',
    },
    {
      id: 'CUO-MANI-2',
      prestamoId: 'PRE-MAQ-MANI',
      numeroCuota: 2,
      fechaVencimiento: schemaAddDaysDDMMYYYY_(hoy, 6),
      moneda: 'PYG',
      montoCapital: 12000000,
      montoInteres: 0,
      montoTotal: 12000000,
      estado: 'PENDIENTE',
    },
    {
      id: 'CUO-MANI-3',
      prestamoId: 'PRE-MAQ-MANI',
      numeroCuota: 3,
      fechaVencimiento: schemaAddDaysDDMMYYYY_(hoy, 36),
      moneda: 'PYG',
      montoCapital: 12000000,
      montoInteres: 0,
      montoTotal: 12000000,
      estado: 'PENDIENTE',
    },
  ]);

  replaceTable_('Cheques', [
    {
      id: 'CHQ-101',
      ambito: 'NEGOCIO',
      tipo: 'EMITIDO',
      numeroCheque: '449102',
      bancoEntidad: 'Banco Itaú',
      cuentaId: 'CTA-NEG-ITAU-PYG',
      contraparte: 'Agroinsumos Chaco',
      concepto: 'Bolsas y fertilizante foliar maní',
      moneda: 'PYG',
      monto: 16500000,
      tasaCambio: tasa,
      montoPYG: 16500000,
      montoUSD: Number((16500000 / tasa).toFixed(2)),
      fechaEmision: schemaAddDaysDDMMYYYY_(hoy, -12),
      fechaCobroPago: schemaAddDaysDDMMYYYY_(hoy, 5),
      estado: 'PENDIENTE',
    },
    {
      id: 'CHQ-102',
      ambito: 'NEGOCIO',
      tipo: 'RECIBIDO',
      numeroCheque: '882014',
      bancoEntidad: 'Banco Continental',
      cuentaId: 'CTA-NEG-ITAU-PYG',
      contraparte: 'Distribuidora El Grano S.A.',
      concepto: 'Cobro lote 18 Ton maní confitería',
      moneda: 'PYG',
      monto: 38000000,
      tasaCambio: tasa,
      montoPYG: 38000000,
      montoUSD: Number((38000000 / tasa).toFixed(2)),
      fechaEmision: schemaAddDaysDDMMYYYY_(hoy, -5),
      fechaCobroPago: schemaAddDaysDDMMYYYY_(hoy, 11),
      estado: 'PENDIENTE',
    },
  ]);

  replaceTable_('Movimientos', [
    {
      id: 'MOV-101',
      fecha: hoy,
      ambito: 'NEGOCIO',
      tipo: 'GASTO',
      cuentaId: 'CTA-NEG-ITAU-PYG',
      campanaId: 'CMP-MANI-2627',
      macroCategoria: 'LOGISTICA_COMERCIAL',
      subCategoria: 'Fletes, Jornales & Embolsado',
      concepto: 'Jornales selección y embolsado maní',
      contraparte: 'Cuadrilla Local',
      moneda: 'PYG',
      monto: 2800000,
      tasaCambio: tasa,
      montoPYG: 2800000,
      montoUSD: Number((2800000 / tasa).toFixed(2)),
      comprobanteNro: 'REC-00412',
      anulado: false,
    },
    {
      id: 'MOV-102',
      fecha: schemaAddDaysDDMMYYYY_(hoy, -2),
      ambito: 'PERSONAL',
      tipo: 'GASTO',
      cuentaId: 'CTA-PER-EFECTIVO',
      macroCategoria: 'HOGAR_ALIMENTACION',
      subCategoria: 'Hogar, Supermercado & Alquiler',
      concepto: 'Compra semanal supermercado y despensa',
      contraparte: 'Supermercado Stock',
      moneda: 'PYG',
      monto: 950000,
      tasaCambio: tasa,
      montoPYG: 950000,
      montoUSD: Number((950000 / tasa).toFixed(2)),
      anulado: false,
    },
  ]);
}
