/**
 * ============================================================================
 * AGROFINANCE - API WEB APP GOOGLE APPS SCRIPT (02_Code.gs)
 * ============================================================================
 * Requiere 01_Schema.gs en el mismo proyecto de Apps Script.
 * Desplegar como "Aplicación web":
 *  - Ejecutar como: Yo
 *  - Quién tiene acceso: Cualquier persona (o tu usuario según configuración)
 * ============================================================================
 */

function jsonOk_(data) {
  return ContentService.createTextOutput(
    JSON.stringify({
      ok: true,
      data: data === undefined || data === null ? {} : data,
      timestamp: new Date().toISOString(),
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

function jsonErr_(message) {
  return ContentService.createTextOutput(
    JSON.stringify({
      ok: false,
      error: String(message || 'Error inesperado en Google Apps Script'),
      timestamp: new Date().toISOString(),
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

// ============================================================================
// UTILIDADES DE FECHAS (DD-MM-AAAA) Y MONEDA
// ============================================================================

function formatTodayDDMMYYYY_() {
  return Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone() || 'America/Asuncion',
    'dd-MM-yyyy'
  );
}

function ensureDDMMYYYY_(input) {
  if (!input) return formatTodayDDMMYYYY_();
  if (input instanceof Date) {
    return Utilities.formatDate(
      input,
      Session.getScriptTimeZone() || 'America/Asuncion',
      'dd-MM-yyyy'
    );
  }
  const s = String(input).trim();
  if (/^\d{2}-\d{2}-\d{4}$/.test(s)) return s;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const p = s.slice(0, 10).split('-');
    return `${p[2]}-${p[1]}-${p[0]}`;
  }
  return s;
}

function parseDDMMYYYYToDate_(ddmmyyyy) {
  const normalized = ensureDDMMYYYY_(ddmmyyyy);
  const parts = String(normalized || '').split('-');
  if (parts.length !== 3) return new Date();
  const dd = Number(parts[0]);
  const mm = Number(parts[1]);
  const yyyy = Number(parts[2]);
  if (!dd || !mm || !yyyy) return new Date();
  return new Date(yyyy, mm - 1, dd, 12, 0, 0, 0);
}

function parseDDMMYYYYToTime_(ddmmyyyy) {
  return parseDDMMYYYYToDate_(ddmmyyyy).getTime();
}

function diffDaysFromToday_(ddmmyyyy) {
  const hoyParts = formatTodayDDMMYYYY_().split('-').map(Number);
  const hoy = new Date(hoyParts[2], hoyParts[1] - 1, hoyParts[0], 12, 0, 0, 0);
  const target = parseDDMMYYYYToDate_(ddmmyyyy);
  return Math.round((target.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
}

function addDaysDDMMYYYY_(ddmmyyyy, days) {
  const d = parseDDMMYYYYToDate_(ddmmyyyy);
  d.setDate(d.getDate() + days);
  return ensureDDMMYYYY_(d);
}

function addMonthsDDMMYYYY_(ddmmyyyy, months) {
  const d = parseDDMMYYYYToDate_(ddmmyyyy);
  const targetDay = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const lastDayOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(targetDay, lastDayOfMonth));
  return ensureDDMMYYYY_(d);
}

function generateInstallmentDates_(firstDate, count, periodicidad) {
  const dates = [];
  for (let i = 0; i < count; i++) {
    if (i === 0) {
      dates.push(ensureDDMMYYYY_(firstDate));
    } else if (periodicidad === 'SEMANAL') {
      dates.push(addDaysDDMMYYYY_(firstDate, i * 7));
    } else if (periodicidad === 'QUINCENAL') {
      dates.push(addDaysDDMMYYYY_(firstDate, i * 15));
    } else if (periodicidad === 'ANUAL') {
      dates.push(addMonthsDDMMYYYY_(firstDate, i * 12));
    } else {
      dates.push(addMonthsDDMMYYYY_(firstDate, i));
    }
  }
  return dates;
}

function toBimoneda_(monto, moneda, tasa) {
  const t = tasa > 0 ? tasa : 7835;
  const montoPYG = moneda === 'PYG' ? Math.round(monto) : Math.round(monto * t);
  const montoUSD =
    moneda === 'USD' ? Number(Number(monto).toFixed(2)) : Number((monto / t).toFixed(2));
  return { montoPYG, montoUSD };
}

function getCotizacion_() {
  const rows = readTable_('Config');
  const map = {};
  rows.forEach((r) => {
    map[r.key] = r.value;
  });
  return {
    id: map.cotizacion_id || 'COT-DEFAULT',
    fecha: map.cotizacion_fecha || formatTodayDDMMYYYY_(),
    compraPYG: Number(map.compraPYG) || 7810,
    ventaPYG: Number(map.ventaPYG) || 7860,
    referenciaBCP: Number(map.referenciaBCP) || 7835,
    vigente: true,
  };
}

function getPrestamosJoined_() {
  const prestamos = readTable_('Prestamos');
  const cuotas = readTable_('Cuotas');
  const cuotasByPrestamo = {};

  cuotas.forEach((c) => {
    if (!cuotasByPrestamo[c.prestamoId]) cuotasByPrestamo[c.prestamoId] = [];
    cuotasByPrestamo[c.prestamoId].push(c);
  });

  return prestamos.map((p) => {
    const list = (cuotasByPrestamo[p.id] || []).sort(
      (a, b) => Number(a.numeroCuota) - Number(b.numeroCuota)
    );
    return Object.assign({}, p, { cuotas: list });
  });
}

function isCashInflow_(tipo) {
  return tipo === 'INGRESO' || tipo === 'CHEQUE_COBRADO' || tipo === 'COBRO_CUOTA';
}

function isCashOutflow_(tipo) {
  return tipo === 'GASTO' || tipo === 'CHEQUE_PAGADO' || tipo === 'PAGO_CUOTA';
}

function computeMetricasServer_(cuentas, prestamos, cheques, movimientos, cotizacion, campanaId, ambito) {
  const tasa = cotizacion.referenciaBCP || 7835;
  const scopeFilter = (item) =>
    !ambito || ambito === 'TODOS' || (item.ambito || 'NEGOCIO') === ambito;

  const scopedCuentas = cuentas.filter(scopeFilter);
  const scopedPrestamos = prestamos.filter(scopeFilter);
  const scopedCheques = cheques.filter(scopeFilter);

  const isCard = (c) => c.tipo === 'TARJETA_AGRO' || c.tipo === 'TARJETA';

  const liquidezPYG = scopedCuentas
    .filter((c) => !isCard(c) && c.moneda === 'PYG')
    .reduce((acc, c) => acc + (Number(c.saldoActual) || 0), 0);

  const liquidezUSD = scopedCuentas
    .filter((c) => !isCard(c) && c.moneda === 'USD')
    .reduce((acc, c) => acc + (Number(c.saldoActual) || 0), 0);

  const liquidezConsolidadaPYG = Math.round(liquidezPYG + liquidezUSD * tasa);
  const liquidezConsolidadaUSD = Number((liquidezUSD + liquidezPYG / tasa).toFixed(2));

  const deudaTarjetasUSD = scopedCuentas
    .filter(isCard)
    .reduce((acc, c) => {
      const d = Number(c.deudaActual) || 0;
      return acc + (c.moneda === 'USD' ? d : d / tasa);
    }, 0);

  const deudaPrestamosUSD = scopedPrestamos
    .filter((p) => p.estado !== 'CANCELADO' && (p.direccion || 'PAGAR') === 'PAGAR')
    .reduce((acc, p) => {
      const sp = Number(p.saldoPendiente) || 0;
      return acc + (p.moneda === 'USD' ? sp : sp / tasa);
    }, 0);

  const chequesEmitidosPendUSD = scopedCheques
    .filter((ch) => ch.estado === 'PENDIENTE' && ch.tipo === 'EMITIDO')
    .reduce((acc, ch) => acc + (Number(ch.montoUSD) || 0), 0);

  const pasivoTotalUSD = Number(
    (deudaPrestamosUSD + deudaTarjetasUSD + chequesEmitidosPendUSD).toFixed(2)
  );
  const pasivoTotalPYG = Math.round(pasivoTotalUSD * tasa);

  const patrimonioNetoUSD = Number((liquidezConsolidadaUSD - pasivoTotalUSD).toFixed(2));
  const patrimonioNetoPYG = Math.round(liquidezConsolidadaPYG - pasivoTotalPYG);

  const filteredMovs = movimientos.filter((m) => {
    if (m.anulado) return false;
    const matchScope = scopeFilter(m);
    const matchCamp = !campanaId || campanaId === 'ALL' || m.campanaId === campanaId;
    return matchScope && matchCamp;
  });

  const ingresosCampanaUSD = Number(
    filteredMovs
      .filter((m) => isCashInflow_(m.tipo))
      .reduce((acc, m) => acc + (Number(m.montoUSD) || 0), 0)
      .toFixed(2)
  );

  const costosCampanaUSD = Number(
    filteredMovs
      .filter((m) => isCashOutflow_(m.tipo))
      .reduce((acc, m) => acc + (Number(m.montoUSD) || 0), 0)
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
    margenBrutoCampanaUSD: Number((ingresosCampanaUSD - costosCampanaUSD).toFixed(2)),
    margenBrutoCampanaPYG: Math.round((ingresosCampanaUSD - costosCampanaUSD) * tasa),
  };
}

function computeFlujoProyectadoServer_(cuentas, prestamos, cheques, cotizacion, ambito) {
  const tasa = cotizacion.referenciaBCP || 7835;
  const scopeFilter = (item) =>
    !ambito || ambito === 'TODOS' || (item.ambito || 'NEGOCIO') === ambito;

  const isCard = (c) => c.tipo === 'TARJETA_AGRO' || c.tipo === 'TARJETA';
  const scopedCuentas = cuentas.filter((c) => scopeFilter(c) && !isCard(c));

  const saldoActualPYG = Math.round(
    scopedCuentas.reduce((acc, c) => {
      const s = Number(c.saldoActual) || 0;
      return acc + (c.moneda === 'PYG' ? s : s * tasa);
    }, 0)
  );
  const saldoActualUSD = Number((saldoActualPYG / tasa).toFixed(2));

  const eventos = [];

  cheques
    .filter((ch) => scopeFilter(ch) && ch.estado === 'PENDIENTE')
    .forEach((ch) => {
      const dias = diffDaysFromToday_(ch.fechaCobroPago);
      const ventana =
        dias < 0
          ? 'VENCIDO'
          : dias <= 7
          ? 'ESTA_SEMANA'
          : dias <= 30
          ? 'PROXIMOS_30_DIAS'
          : 'POSTERIOR';
      const dir = ch.tipo === 'RECIBIDO' ? 'INGRESO' : 'EGRESO';
      eventos.push({
        id: ch.id,
        origen: ch.tipo === 'RECIBIDO' ? 'CHEQUE_RECIBIDO' : 'CHEQUE_EMITIDO',
        ambito: ch.ambito || 'NEGOCIO',
        direccion: dir,
        titulo: `${ch.tipo === 'RECIBIDO' ? 'Cheque a Cobrar' : 'Cheque a Pagar'} #${ch.numeroCheque || '-'}`,
        subtitulo: ch.concepto || ch.bancoEntidad,
        contraparte: ch.contraparte || '-',
        entidadBancaria: ch.bancoEntidad || '',
        fechaVencimiento: ch.fechaCobroPago,
        diasRestantes: dias,
        ventana,
        moneda: ch.moneda,
        monto: Number(ch.monto) || 0,
        montoPYG: Number(ch.montoPYG) || toBimoneda_(ch.monto, ch.moneda, tasa).montoPYG,
        montoUSD: Number(ch.montoUSD) || toBimoneda_(ch.monto, ch.moneda, tasa).montoUSD,
        cuentaSugeridaId: ch.cuentaId || undefined,
        chequeId: ch.id,
        estado: dias < 0 ? 'VENCIDA' : 'PENDIENTE',
      });
    });

  prestamos
    .filter((p) => scopeFilter(p) && p.estado !== 'CANCELADO')
    .forEach((p) => {
      const dir = (p.direccion || 'PAGAR') === 'COBRAR' ? 'INGRESO' : 'EGRESO';
      (p.cuotas || [])
        .filter((cuo) => cuo.estado !== 'PAGADA')
        .forEach((cuo) => {
          const dias = diffDaysFromToday_(cuo.fechaVencimiento);
          const ventana =
            dias < 0
              ? 'VENCIDO'
              : dias <= 7
              ? 'ESTA_SEMANA'
              : dias <= 30
              ? 'PROXIMOS_30_DIAS'
              : 'POSTERIOR';
          const conv = toBimoneda_(cuo.montoTotal, cuo.moneda, tasa);
          eventos.push({
            id: cuo.id,
            origen: dir === 'INGRESO' ? 'CUOTA_COBRAR' : 'CUOTA_PAGAR',
            ambito: p.ambito || 'NEGOCIO',
            direccion: dir,
            titulo: `${p.nombre} (Cuota ${cuo.numeroCuota}/${p.cuotasTotales})`,
            subtitulo: p.entidad,
            contraparte: p.contraparte || p.entidad,
            entidadBancaria: p.entidad,
            fechaVencimiento: cuo.fechaVencimiento,
            diasRestantes: dias,
            ventana,
            moneda: cuo.moneda,
            monto: Number(cuo.montoTotal) || 0,
            montoPYG: conv.montoPYG,
            montoUSD: conv.montoUSD,
            prestamoId: p.id,
            cuotaId: cuo.id,
            estado: dias < 0 ? 'VENCIDA' : 'PENDIENTE',
          });
        });
    });

  eventos.sort((a, b) => parseDDMMYYYYToTime_(a.fechaVencimiento) - parseDDMMYYYYToTime_(b.fechaVencimiento));

  const vencido = {
    porCobrarPYG: 0,
    porCobrarUSD: 0,
    porPagarPYG: 0,
    porPagarUSD: 0,
  };

  eventos
    .filter((e) => e.diasRestantes < 0)
    .forEach((e) => {
      if (e.direccion === 'INGRESO') {
        vencido.porCobrarPYG += e.montoPYG;
        vencido.porCobrarUSD += e.montoUSD;
      } else {
        vencido.porPagarPYG += e.montoPYG;
        vencido.porPagarUSD += e.montoUSD;
      }
    });

  const buildWindow = (maxDays) => {
    const subset = eventos.filter((e) => e.diasRestantes <= maxDays);
    const ingPYG = subset.filter((e) => e.direccion === 'INGRESO').reduce((a, e) => a + e.montoPYG, 0);
    const egrPYG = subset.filter((e) => e.direccion === 'EGRESO').reduce((a, e) => a + e.montoPYG, 0);
    const saldoFinalPYG = Math.round(saldoActualPYG + ingPYG - egrPYG);
    return {
      ingresosPYG: Math.round(ingPYG),
      ingresosUSD: Number((ingPYG / tasa).toFixed(2)),
      egresosPYG: Math.round(egrPYG),
      egresosUSD: Number((egrPYG / tasa).toFixed(2)),
      saldoFinalPYG,
      saldoFinalUSD: Number((saldoFinalPYG / tasa).toFixed(2)),
    };
  };

  let runningPYG = saldoActualPYG;
  let minPYG = saldoActualPYG;
  let alertaDeficit = null;

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
    ambito: ambito || 'TODOS',
    tasaCambio: tasa,
    saldoActualPYG,
    saldoActualUSD,
    vencido: {
      porCobrarPYG: Math.round(vencido.porCobrarPYG),
      porCobrarUSD: Number(vencido.porCobrarUSD.toFixed(2)),
      porPagarPYG: Math.round(vencido.porPagarPYG),
      porPagarUSD: Number(vencido.porPagarUSD.toFixed(2)),
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

// ============================================================================
// MUTACIONES DE CUENTAS Y MOVIMIENTOS
// ============================================================================

function applyAccountDelta_(cuentaId, deltaPYG, deltaUSD, tipoMovimiento, tasa) {
  return updateRecordById_('Cuentas', cuentaId, (c) => {
    const montoCuenta = c.moneda === 'PYG' ? deltaPYG : deltaUSD;
    const isCard = c.tipo === 'TARJETA_AGRO' || c.tipo === 'TARJETA';

    if (isCard) {
      const nuevaDeuda = isCashOutflow_(tipoMovimiento)
        ? Number(c.deudaActual || 0) + montoCuenta
        : Math.max(0, Number(c.deudaActual || 0) - montoCuenta);
      return Object.assign({}, c, {
        deudaActual: nuevaDeuda,
        disponibleCredito: Math.max(0, Number(c.limiteCredito || 0) - nuevaDeuda),
      });
    }

    const nuevoSaldo = isCashInflow_(tipoMovimiento)
      ? Number(c.saldoActual || 0) + montoCuenta
      : Number(c.saldoActual || 0) - montoCuenta;

    return Object.assign({}, c, {
      saldoActual: nuevoSaldo,
      equivalentePYG: c.moneda === 'PYG' ? Math.round(nuevoSaldo) : Math.round(nuevoSaldo * tasa),
      equivalenteUSD:
        c.moneda === 'USD'
          ? Number(nuevoSaldo.toFixed(2))
          : Number((nuevoSaldo / tasa).toFixed(2)),
    });
  });
}

function handleRegistrarMovimiento_(input) {
  const cot = getCotizacion_();
  const tasa = Number(input.tasaCambio) || cot.referenciaBCP;
  const fecha = ensureDDMMYYYY_(input.fecha);
  const conv = toBimoneda_(Number(input.monto), input.moneda, tasa);

  const nuevoMov = {
    id: `MOV-${Date.now()}`,
    fecha,
    ambito: input.ambito || 'NEGOCIO',
    tipo: input.tipo,
    cuentaId: input.cuentaId,
    campanaId: input.campanaId || '',
    macroCategoria: input.macroCategoria,
    subCategoria: input.subCategoria || 'Operación',
    concepto: input.concepto || 'Registro operativo',
    contraparte: input.contraparte || '',
    moneda: input.moneda,
    monto: Number(input.monto),
    tasaCambio: tasa,
    montoPYG: conv.montoPYG,
    montoUSD: conv.montoUSD,
    litrosGasoil: input.litrosGasoil || '',
    precioLitro: input.precioLitro || '',
    toneladasCabezas: input.toneladasCabezas || '',
    comprobanteNro: input.comprobanteNro || '',
    referenciaId: input.referenciaId || '',
    anulado: false,
  };

  appendRecord_('Movimientos', nuevoMov);
  applyAccountDelta_(input.cuentaId, conv.montoPYG, conv.montoUSD, input.tipo, tasa);

  if (input.tipo === 'GASTO' && input.campanaId) {
    const presupuestos = readTable_('Presupuestos');
    const match = presupuestos.find(
      (pr) => pr.macroCategoria === input.macroCategoria && pr.campanaId === input.campanaId
    );
    if (match) {
      const ejUSD = Number((Number(match.ejecutadoUSD || 0) + conv.montoUSD).toFixed(2));
      const ejPYG = Math.round(Number(match.ejecutadoPYG || 0) + conv.montoPYG);
      const pct = Math.min(999, Math.round((ejUSD / (Number(match.montoAsignadoUSD) || 1)) * 100));
      updateRecordById_('Presupuestos', match.id, {
        ejecutadoUSD: ejUSD,
        ejecutadoPYG: ejPYG,
        disponibleUSD: Math.max(0, Number(((Number(match.montoAsignadoUSD) || 0) - ejUSD).toFixed(2))),
        disponiblePYG: Math.max(0, (Number(match.montoAsignadoPYG) || 0) - ejPYG),
        porcentajeUso: pct,
        alertaExceso: pct >= 85,
      });
    }
  }

  return nuevoMov;
}

function handleAnularMovimiento_(payload) {
  const movId = payload.movimientoId;
  const cot = getCotizacion_();
  const existing = readTable_('Movimientos').find((m) => m.id === movId);
  if (!existing) throw new Error('Movimiento no encontrado.');
  if (existing.anulado) throw new Error('El movimiento ya fue anulado.');
  if (existing.referenciaId) {
    throw new Error('No se puede anular un movimiento vinculado a un cheque o cuota liquidada.');
  }

  const isIn = isCashInflow_(existing.tipo);
  const isOut = isCashOutflow_(existing.tipo);
  const hasDest = Boolean(existing.cuentaDestinoId);
  if (!isIn && !isOut && !hasDest) {
    throw new Error('Este tipo de asiento no admite anulación automática.');
  }

  const mov = updateRecordById_('Movimientos', movId, { anulado: true });
  if (!mov) throw new Error('Movimiento no encontrado.');

  const tasa = Number(mov.tasaCambio) || cot.referenciaBCP;
  if (isIn) {
    applyAccountDelta_(mov.cuentaId, mov.montoPYG, mov.montoUSD, 'GASTO', tasa);
  } else if (isOut) {
    applyAccountDelta_(mov.cuentaId, mov.montoPYG, mov.montoUSD, 'INGRESO', tasa);
  } else if (hasDest) {
    applyAccountDelta_(mov.cuentaId, mov.montoPYG, mov.montoUSD, 'INGRESO', tasa);
    applyAccountDelta_(mov.cuentaDestinoId, mov.montoPYG, mov.montoUSD, 'GASTO', tasa);
  }
  return { ok: true, movimientoId: movId };
}

function handleRegistrarTransferencia_(input) {
  const cuentas = readTable_('Cuentas');
  const origen = cuentas.find((c) => c.id === input.cuentaOrigenId);
  const destino = cuentas.find((c) => c.id === input.cuentaDestinoId);
  if (!origen || !destino) throw new Error('Seleccione cuentas origen y destino válidas.');

  const cot = getCotizacion_();
  const tasa = Number(input.tasaCambio) || cot.referenciaBCP;
  const conv = toBimoneda_(Number(input.montoOrigen), origen.moneda, tasa);

  // Debitar origen
  applyAccountDelta_(origen.id, conv.montoPYG, conv.montoUSD, 'GASTO', tasa);
  // Acreditar destino (si es tarjeta, reduce deuda)
  applyAccountDelta_(destino.id, conv.montoPYG, conv.montoUSD, 'INGRESO', tasa);

  const origAmbito = origen.ambito || 'NEGOCIO';
  const destAmbito = destino.ambito || 'NEGOCIO';
  let tipo = 'TRANSFERENCIA';
  let subCategoria = 'Transferencia entre Cuentas';
  if (origAmbito === 'NEGOCIO' && destAmbito === 'PERSONAL') {
    tipo = 'RETIRO_PERSONAL';
    subCategoria = 'Retiro Personal del Negocio';
  } else if (origAmbito === 'PERSONAL' && destAmbito === 'NEGOCIO') {
    tipo = 'APORTE_NEGOCIO';
    subCategoria = 'Aporte Personal al Negocio';
  }

  const mov = {
    id: `TRF-${Date.now()}`,
    fecha: ensureDDMMYYYY_(input.fecha),
    ambito: origAmbito,
    tipo,
    cuentaId: origen.id,
    cuentaDestinoId: destino.id,
    campanaId: input.campanaId || '',
    macroCategoria: origAmbito !== destAmbito ? 'RETIRO_APORTE' : 'FINANCIERO_IMPUESTOS',
    subCategoria,
    concepto: input.concepto || `${origen.nombre} -> ${destino.nombre}`,
    moneda: origen.moneda,
    monto: Number(input.montoOrigen),
    tasaCambio: tasa,
    montoPYG: conv.montoPYG,
    montoUSD: conv.montoUSD,
    anulado: false,
  };
  appendRecord_('Movimientos', mov);
  return mov;
}

function handleCrearCuenta_(input) {
  const cot = getCotizacion_();
  const tasa = cot.referenciaBCP;
  const saldo = Number(input.saldoActual) || 0;
  const limite = Number(input.limiteCredito) || 0;
  const deuda = Number(input.deudaActual) || 0;
  const conv = toBimoneda_(saldo, input.moneda, tasa);

  const nueva = {
    id: `CTA-${Date.now()}`,
    nombre: input.nombre,
    ambito: input.ambito || 'NEGOCIO',
    tipo: input.tipo || 'BANCO',
    moneda: input.moneda || 'PYG',
    saldoActual: saldo,
    limiteCredito: limite,
    deudaActual: deuda,
    disponibleCredito: Math.max(0, limite - deuda),
    cierreDia: Number(input.cierreDia) || 1,
    vencimientoDia: Number(input.vencimientoDia) || 1,
    entidad: input.entidad || 'Cuenta Propia',
    icono:
      input.tipo === 'EFECTIVO' || input.tipo === 'CAJA_ESTANCIA'
        ? 'Wallet'
        : input.tipo === 'TARJETA' || input.tipo === 'TARJETA_AGRO'
        ? 'CreditCard'
        : 'Landmark',
    activa: true,
    equivalentePYG: conv.montoPYG,
    equivalenteUSD: conv.montoUSD,
  };

  appendRecord_('Cuentas', nueva);
  return nueva;
}

function handleCrearCompraCuotas_(input) {
  const n = Math.max(1, parseInt(input.cuotasTotales, 10) || 1);
  const montoTotal = Number(input.montoTotal) || 0;
  const decimals = input.moneda === 'USD' ? 2 : 0;
  const montoCuotaBase = Number((montoTotal / n).toFixed(decimals));
  const periodicidad = input.periodicidad || 'MENSUAL';
  const fechas = generateInstallmentDates_(input.primerVencimiento, n, periodicidad);
  const prestamoId = `PRE-${Date.now()}`;

  const cuotas = fechas.map((fv, idx) => {
    const isLast = idx === n - 1;
    const acumulado = montoCuotaBase * (n - 1);
    const montoCuota = isLast ? Number((montoTotal - acumulado).toFixed(decimals)) : montoCuotaBase;
    return {
      id: `CUO-${Date.now()}-${idx + 1}`,
      prestamoId,
      numeroCuota: idx + 1,
      fechaVencimiento: fv,
      moneda: input.moneda || 'PYG',
      montoCapital: montoCuota,
      montoInteres: 0,
      montoTotal: montoCuota,
      estado: 'PENDIENTE',
    };
  });

  const prestamo = {
    id: prestamoId,
    ambito: input.ambito || 'NEGOCIO',
    direccion: input.direccion || 'PAGAR',
    nombre: input.nombre,
    entidad: input.contraparte || input.entidad || 'Proveedor',
    contraparte: input.contraparte || input.entidad || 'Proveedor',
    instrumento:
      input.direccion === 'COBRAR' ? 'CUENTA_POR_COBRAR' : input.instrumento || 'COMPRA_CUOTAS',
    periodicidad,
    campanaId: input.campanaId || '',
    moneda: input.moneda || 'PYG',
    capitalOriginal: montoTotal,
    saldoPendiente: montoTotal,
    tasaAnualPct: Number(input.tasaAnualPct) || 0,
    cuotasTotales: n,
    cuotasPagadas: 0,
    proximoVencimiento: cuotas[0].fechaVencimiento,
    montoProximaCuota: cuotas[0].montoTotal,
    estado: 'ACTIVO',
  };

  appendRecord_('Prestamos', prestamo);
  appendRecordsBatch_('Cuotas', cuotas);

  return Object.assign({}, prestamo, { cuotas });
}

function handlePagarCuota_(input) {
  const prestamos = getPrestamosJoined_();
  const prestamo = prestamos.find((p) => p.id === input.prestamoId);
  if (!prestamo) throw new Error('Plan de cuotas no encontrado.');
  const cuota = (prestamo.cuotas || []).find((c) => c.id === input.cuotaId);
  if (!cuota || cuota.estado === 'PAGADA') throw new Error('Cuota inválida o ya liquidada.');

  const fechaReal = ensureDDMMYYYY_(input.fechaPago);
  const esCobro = (prestamo.direccion || 'PAGAR') === 'COBRAR';
  const tipoMov = esCobro ? 'COBRO_CUOTA' : 'PAGO_CUOTA';

  const mov = handleRegistrarMovimiento_({
    fecha: fechaReal,
    ambito: prestamo.ambito || 'NEGOCIO',
    tipo: tipoMov,
    cuentaId: input.cuentaId,
    campanaId: prestamo.campanaId || '',
    macroCategoria: esCobro ? 'VENTAS_AGRO' : 'FINANCIERO_IMPUESTOS',
    subCategoria: esCobro ? 'Cobro de Cuota / Venta a Plazo' : 'Pago de Cuota',
    concepto: `${prestamo.nombre} - Cuota ${cuota.numeroCuota}/${prestamo.cuotasTotales}`,
    contraparte: prestamo.contraparte || prestamo.entidad,
    moneda: cuota.moneda,
    monto: cuota.montoTotal,
    tasaCambio: input.tasaCambio,
    referenciaId: cuota.id,
  });

  updateRecordById_('Cuotas', cuota.id, {
    estado: 'PAGADA',
    fechaPago: fechaReal,
    cuentaId: input.cuentaId,
    movimientoId: mov.id,
  });

  const pendientes = (prestamo.cuotas || []).filter((c) => c.id !== cuota.id && c.estado !== 'PAGADA');
  const nuevoSaldo = Math.max(
    0,
    Number((Number(prestamo.saldoPendiente) - Number(cuota.montoTotal)).toFixed(2))
  );
  const pagadas = Number(prestamo.cuotasPagadas || 0) + 1;

  updateRecordById_('Prestamos', prestamo.id, {
    cuotasPagadas: pagadas,
    saldoPendiente: pendientes.length === 0 ? 0 : nuevoSaldo,
    proximoVencimiento: pendientes[0] ? pendientes[0].fechaVencimiento : '-',
    montoProximaCuota: pendientes[0] ? pendientes[0].montoTotal : 0,
    estado: pendientes.length === 0 ? 'CANCELADO' : 'ACTIVO',
  });

  return mov;
}

function handleCrearChequeDiferido_(input) {
  const cot = getCotizacion_();
  const tasa = Number(input.tasaCambio) || cot.referenciaBCP;
  const conv = toBimoneda_(Number(input.monto), input.moneda, tasa);

  const cheque = {
    id: `CHQ-${Date.now()}`,
    ambito: input.ambito || 'NEGOCIO',
    tipo: input.tipo, // EMITIDO | RECIBIDO
    numeroCheque: input.numeroCheque || '',
    bancoEntidad: input.bancoEntidad,
    cuentaId: input.cuentaId || '',
    contraparte: input.contraparte || '',
    concepto: input.concepto || `Cheque ${input.tipo === 'RECIBIDO' ? 'recibido' : 'emitido'}`,
    moneda: input.moneda || 'PYG',
    monto: Number(input.monto),
    tasaCambio: tasa,
    montoPYG: conv.montoPYG,
    montoUSD: conv.montoUSD,
    fechaEmision: ensureDDMMYYYY_(input.fechaEmision),
    fechaCobroPago: ensureDDMMYYYY_(input.fechaCobroPago),
    estado: 'PENDIENTE',
  };

  appendRecord_('Cheques', cheque);
  return cheque;
}

function handleLiquidarChequeDiferido_(input) {
  const cheques = readTable_('Cheques');
  const ch = cheques.find((c) => c.id === input.chequeId);
  if (!ch || ch.estado !== 'PENDIENTE') {
    throw new Error('Cheque no encontrado o ya procesado.');
  }

  const fechaReal = ensureDDMMYYYY_(input.fechaLiquidacion);
  const esRecibido = ch.tipo === 'RECIBIDO';
  const tipoMov = esRecibido ? 'CHEQUE_COBRADO' : 'CHEQUE_PAGADO';

  const mov = handleRegistrarMovimiento_({
    fecha: fechaReal,
    ambito: ch.ambito || 'NEGOCIO',
    tipo: tipoMov,
    cuentaId: input.cuentaId,
    macroCategoria: esRecibido ? 'VENTAS_AGRO' : 'FINANCIERO_IMPUESTOS',
    subCategoria: esRecibido ? 'Acreditación Cheque Recibido' : 'Débito Cheque Emitido',
    concepto: `Cheque #${ch.numeroCheque || '-'} (${ch.bancoEntidad}) · ${ch.concepto}`,
    contraparte: ch.contraparte,
    moneda: ch.moneda,
    monto: ch.monto,
    tasaCambio: input.tasaCambio || ch.tasaCambio,
    comprobanteNro: ch.numeroCheque,
    referenciaId: ch.id,
  });

  const actualizado = updateRecordById_('Cheques', ch.id, {
    estado: 'LIQUIDADO',
    fechaLiquidacion: fechaReal,
    cuentaId: input.cuentaId,
    movimientoId: mov.id,
  });

  return { cheque: actualizado, movimiento: mov };
}

// ============================================================================
// HTTP ENTRYPOINTS: doGet / doPost
// ============================================================================

function doGet(e) {
  try {
    ensureSchemaInitialized_();
    const params = (e && e.parameter) || {};
    const action = params.action || 'getBootstrapData';
    const campanaId = params.campanaId || 'ALL';
    const ambito = params.ambito || 'TODOS';

    switch (action) {
      case 'ping':
        return jsonOk_({ status: 'ok', version: AGROFINANCE_SCHEMA.VERSION });
      case 'initSchema':
        return jsonOk_({ report: initOrMigrateSchema() });
      case 'getCotizacion':
        return jsonOk_(getCotizacion_());
      case 'getCuentas':
        return jsonOk_(readTable_('Cuentas'));
      case 'getCampanas':
        return jsonOk_(readTable_('Campanas'));
      case 'getCategorias':
        return jsonOk_(readTable_('Categorias'));
      case 'getMovimientos':
        return jsonOk_(readTable_('Movimientos').filter((m) => !m.anulado).reverse());
      case 'getPresupuestos': {
        const list = readTable_('Presupuestos');
        return jsonOk_(campanaId === 'ALL' ? list : list.filter((p) => p.campanaId === campanaId));
      }
      case 'getPrestamos':
        return jsonOk_(getPrestamosJoined_());
      case 'getCheques':
        return jsonOk_(readTable_('Cheques'));
      case 'getMetricasDashboard': {
        const m = computeMetricasServer_(
          readTable_('Cuentas'),
          getPrestamosJoined_(),
          readTable_('Cheques'),
          readTable_('Movimientos'),
          getCotizacion_(),
          campanaId,
          ambito
        );
        return jsonOk_(m);
      }
      case 'getFlujoCajaProyectado': {
        const flujo = computeFlujoProyectadoServer_(
          readTable_('Cuentas'),
          getPrestamosJoined_(),
          readTable_('Cheques'),
          getCotizacion_(),
          ambito
        );
        return jsonOk_(flujo);
      }
      case 'getBootstrapData': {
        const cuentas = readTable_('Cuentas');
        const prestamos = getPrestamosJoined_();
        const cheques = readTable_('Cheques');
        const movimientos = readTable_('Movimientos').filter((m) => !m.anulado).reverse();
        const cotizacion = getCotizacion_();
        return jsonOk_({
          cotizacion,
          cuentas,
          campanas: readTable_('Campanas'),
          categorias: readTable_('Categorias'),
          movimientos,
          presupuestos: readTable_('Presupuestos'),
          prestamos,
          cheques,
          metricas: computeMetricasServer_(
            cuentas,
            prestamos,
            cheques,
            movimientos,
            cotizacion,
            campanaId,
            ambito
          ),
          flujo: computeFlujoProyectadoServer_(cuentas, prestamos, cheques, cotizacion, ambito),
        });
      }
      default:
        return jsonErr_('Acción GET desconocida: ' + action);
    }
  } catch (err) {
    return jsonErr_(err && err.message ? err.message : String(err));
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    ensureSchemaInitialized_();

    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const action = body.action;
    const payload = body.payload || {};

    switch (action) {
      case 'registrarMovimiento':
        return jsonOk_(handleRegistrarMovimiento_(payload));
      case 'anularMovimiento':
        return jsonOk_(handleAnularMovimiento_(payload));
      case 'registrarTransferencia':
        return jsonOk_(handleRegistrarTransferencia_(payload));
      case 'pagarTarjetaAgro':
        return jsonOk_(
          handleRegistrarTransferencia_({
            cuentaOrigenId: payload.cuentaOrigenId,
            cuentaDestinoId: payload.tarjetaId,
            montoOrigen: payload.monto,
            tasaCambio: payload.tasaCambio,
            concepto: payload.concepto || 'Pago de Tarjeta',
          })
        );
      case 'ajustarSaldoCuenta': {
        const cot = getCotizacion_();
        const tasa = cot.referenciaBCP;
        const ns = Number(payload.nuevoSaldo) || 0;
        updateRecordById_('Cuentas', payload.cuentaId, (c) => {
          const conv = toBimoneda_(ns, c.moneda, tasa);
          return Object.assign({}, c, {
            saldoActual: ns,
            equivalentePYG: conv.montoPYG,
            equivalenteUSD: conv.montoUSD,
          });
        });
        return jsonOk_({ ok: true, cuentaId: payload.cuentaId, nuevoSaldo: ns });
      }
      case 'actualizarCotizacion': {
        const hoy = formatTodayDDMMYYYY_();
        const cotId = `COT-${Date.now()}`;
        const updates = {
          cotizacion_id: cotId,
          cotizacion_fecha: hoy,
          compraPYG: String(Math.round(Number(payload.compraPYG) || 7810)),
          ventaPYG: String(Math.round(Number(payload.ventaPYG) || 7860)),
          referenciaBCP: String(Math.round(Number(payload.referenciaBCP) || 7835)),
        };
        Object.keys(updates).forEach((k) => {
          const updated = updateRecordById_(
            'Config',
            k,
            { value: updates[k], updatedAt: hoy },
            'key'
          );
          if (!updated) appendRecord_('Config', { key: k, value: updates[k], updatedAt: hoy });
        });
        return jsonOk_(getCotizacion_());
      }
      case 'crearCuenta':
        return jsonOk_(handleCrearCuenta_(payload));
      case 'crearCompraCuotas':
        return jsonOk_(handleCrearCompraCuotas_(payload));
      case 'pagarCuota':
        return jsonOk_(handlePagarCuota_(payload));
      case 'crearChequeDiferido':
        return jsonOk_(handleCrearChequeDiferido_(payload));
      case 'liquidarChequeDiferido':
        return jsonOk_(handleLiquidarChequeDiferido_(payload));
      case 'cambiarEstadoCheque': {
        const updated = updateRecordById_('Cheques', payload.chequeId, {
          estado: payload.estado,
        });
        if (!updated) throw new Error('Cheque no encontrado.');
        return jsonOk_(updated);
      }
      case 'resetCleanSheet':
        resetUserSheetsKeepCatalog_();
        return jsonOk_({ ok: true });
      default:
        return jsonErr_('Acción POST desconocida: ' + action);
    }
  } catch (err) {
    return jsonErr_(err && err.message ? err.message : String(err));
  } finally {
    lock.releaseLock();
  }
}
