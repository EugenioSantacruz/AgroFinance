/**
 * AGROFINANCE PARAGUAY - WRITE SERVICES (TRANSACCIONES ATÓMICAS BIMONEDA)
 */

function registrarMovimientoAtomico(payload) {
  const sheetMov = getSheetByNameSafe(SHEET_NAMES.MOVIMIENTOS);
  const sheetCta = getSheetByNameSafe(SHEET_NAMES.CUENTAS);
  const cot = getCotizacionVigente();
  const tasa = Number(payload.tasaCambio) || cot.referenciaBCP;

  const moneda = String(payload.moneda || 'PYG');
  const monto = Number(payload.monto) || 0;
  if (monto <= 0) throw new Error('El monto debe ser mayor a cero.');

  const montoPYG = moneda === 'PYG' ? Math.round(monto) : Math.round(monto * tasa);
  const montoUSD = moneda === 'USD' ? Number(monto.toFixed(2)) : Number((monto / tasa).toFixed(2));
  const id = 'MOV-' + new Date().getTime();
  const fecha = payload.fecha || formatDateDDMMYYYY(new Date());

  // Actualizar saldo de la cuenta
  const ctaRows = sheetCta.getDataRange().getValues();
  let cuentaEncontrada = false;
  let nuevoSaldo = 0;

  for (let i = 1; i < ctaRows.length; i++) {
    if (String(ctaRows[i][0]) === String(payload.cuentaId)) {
      cuentaEncontrada = true;
      const tipoCuenta = String(ctaRows[i][2]);
      const monedaCuenta = String(ctaRows[i][3]);
      const montoEnMonedaCuenta = monedaCuenta === moneda
        ? monto
        : (monedaCuenta === 'USD' ? montoUSD : montoPYG);

      if (tipoCuenta === 'TARJETA_AGRO') {
        const deudaActual = Number(ctaRows[i][6]) || 0;
        const nuevaDeuda = payload.tipo === 'GASTO' ? deudaActual + montoEnMonedaCuenta : Math.max(0, deudaActual - montoEnMonedaCuenta);
        sheetCta.getRange(i + 1, 7).setValue(nuevaDeuda);
        nuevoSaldo = (Number(ctaRows[i][5]) || 0) - nuevaDeuda;
      } else {
        const saldoActual = Number(ctaRows[i][4]) || 0;
        nuevoSaldo = payload.tipo === 'INGRESO' ? saldoActual + montoEnMonedaCuenta : saldoActual - montoEnMonedaCuenta;
        sheetCta.getRange(i + 1, 5).setValue(nuevoSaldo);
      }
      break;
    }
  }

  if (!cuentaEncontrada) throw new Error('Cuenta no encontrada: ' + payload.cuentaId);

  sheetMov.appendRow([
    id,
    fecha,
    payload.tipo,
    payload.cuentaId,
    payload.cuentaDestinoId || '',
    payload.campanaId || 'GENERAL',
    payload.macroCategoria || 'LABORES_COMBUSTIBLE',
    payload.subCategoria || 'Operativo',
    payload.concepto || '',
    moneda,
    monto,
    tasa,
    montoPYG,
    montoUSD,
    payload.litrosGasoil || '',
    payload.precioLitro || '',
    payload.toneladasCabezas || '',
    payload.comprobanteNro || ''
  ]);

  return { id: id, fecha: fecha, montoPYG: montoPYG, montoUSD: montoUSD, nuevoSaldo: nuevoSaldo };
}

function registrarTransferenciaBimoneda(payload) {
  const sheetMov = getSheetByNameSafe(SHEET_NAMES.MOVIMIENTOS);
  const sheetCta = getSheetByNameSafe(SHEET_NAMES.CUENTAS);
  const tasa = Number(payload.tasaCambio) || getCotizacionVigente().referenciaBCP;
  const fecha = payload.fecha || formatDateDDMMYYYY(new Date());
  const id = 'TRF-' + new Date().getTime();

  const ctaRows = sheetCta.getDataRange().getValues();
  let idxOrigen = -1;
  let idxDestino = -1;

  for (let i = 1; i < ctaRows.length; i++) {
    if (String(ctaRows[i][0]) === String(payload.cuentaOrigenId)) idxOrigen = i;
    if (String(ctaRows[i][0]) === String(payload.cuentaDestinoId)) idxDestino = i;
  }

  if (idxOrigen === -1 || idxDestino === -1) {
    throw new Error('Debe seleccionar cuentas origen y destino válidas.');
  }

  const monedaOrigen = String(ctaRows[idxOrigen][3]);
  const monedaDestino = String(ctaRows[idxDestino][3]);
  const montoOrigen = Number(payload.montoOrigen) || 0;

  const montoPYG = monedaOrigen === 'PYG' ? Math.round(montoOrigen) : Math.round(montoOrigen * tasa);
  const montoUSD = monedaOrigen === 'USD' ? Number(montoOrigen.toFixed(2)) : Number((montoOrigen / tasa).toFixed(2));
  const montoAcreditarDestino = monedaDestino === 'PYG' ? montoPYG : montoUSD;

  const saldoOrigen = Number(ctaRows[idxOrigen][4]) || 0;
  const saldoDestino = Number(ctaRows[idxDestino][4]) || 0;

  sheetCta.getRange(idxOrigen + 1, 5).setValue(saldoOrigen - montoOrigen);
  sheetCta.getRange(idxDestino + 1, 5).setValue(saldoDestino + montoAcreditarDestino);

  sheetMov.appendRow([
    id,
    fecha,
    'TRANSFERENCIA',
    payload.cuentaOrigenId,
    payload.cuentaDestinoId,
    payload.campanaId || 'GENERAL',
    'FINANCIERO_IMPUESTOS',
    'Transferencia / Cambio Divisa',
    payload.concepto || 'Transferencia entre cuentas',
    monedaOrigen,
    montoOrigen,
    tasa,
    montoPYG,
    montoUSD,
    '',
    '',
    '',
    ''
  ]);

  return { id: id, fecha: fecha, montoPYG: montoPYG, montoUSD: montoUSD };
}

function pagarTarjetaAgroAtomico(payload) {
  return registrarTransferenciaBimoneda({
    cuentaOrigenId: payload.cuentaOrigenId,
    cuentaDestinoId: payload.tarjetaId,
    montoOrigen: payload.monto,
    tasaCambio: payload.tasaCambio,
    concepto: payload.concepto || 'Pago de Tarjeta Agro / Línea Rural'
  });
}

function pagarCuotaPrestamoAtomico(payload) {
  return registrarMovimientoAtomico({
    tipo: 'PAGO_CUOTA',
    cuentaId: payload.cuentaOrigenId,
    campanaId: payload.campanaId || 'GENERAL',
    macroCategoria: 'FINANCIERO_IMPUESTOS',
    subCategoria: 'Amortización Prenda / Préstamo',
    concepto: payload.concepto || 'Pago cuota de financiación agro',
    moneda: payload.moneda,
    monto: payload.monto,
    tasaCambio: payload.tasaCambio
  });
}

function ajustarSaldoCuentaAtomico(payload) {
  const sheetCta = getSheetByNameSafe(SHEET_NAMES.CUENTAS);
  const rows = sheetCta.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(payload.cuentaId)) {
      sheetCta.getRange(i + 1, 5).setValue(Number(payload.nuevoSaldo));
      return { cuentaId: payload.cuentaId, nuevoSaldo: Number(payload.nuevoSaldo) };
    }
  }
  throw new Error('Cuenta no encontrada para conciliación.');
}

