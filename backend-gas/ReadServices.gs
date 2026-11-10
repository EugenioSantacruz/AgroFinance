/**
 * AGROFINANCE PARAGUAY - READ SERVICES (CÁLCULO CENTRALIZADO EN EL SERVIDOR)
 * Regla de Oro #1: El frontend NO inventa fórmulas financieras. Todo se consolida acá.
 */

function sheetToObjects(sheetName) {
  const sheet = getSheetByNameSafe(sheetName);
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  const headers = rows[0];
  return rows.slice(1).filter(function(r) { return r[0] !== ''; }).map(function(row) {
    const obj = {};
    headers.forEach(function(h, idx) {
      obj[h] = row[idx];
    });
    return obj;
  });
}

function getCotizacionVigente() {
  const rows = sheetToObjects(SHEET_NAMES.COTIZACIONES);
  const vigente = rows.find(function(r) { return String(r.vigente).toUpperCase() === 'TRUE'; }) || rows[rows.length - 1];
  if (!vigente) {
    return { id: 'COT-DEFAULT', fecha: '09-11-2026', compraPYG: 7810, ventaPYG: 7860, referenciaBCP: 7835, vigente: true };
  }
  return {
    id: String(vigente.id),
    fecha: String(vigente.fecha),
    compraPYG: Number(vigente.compraPYG) || 7810,
    ventaPYG: Number(vigente.ventaPYG) || 7860,
    referenciaBCP: Number(vigente.referenciaBCP) || 7835,
    vigente: true
  };
}

function getCuentas() {
  const cot = getCotizacionVigente();
  const tasa = cot.referenciaBCP;
  return sheetToObjects(SHEET_NAMES.CUENTAS).map(function(c) {
    const saldo = Number(c.saldoActual) || 0;
    const deuda = Number(c.deudaActual) || 0;
    const limite = Number(c.limiteCredito) || 0;
    const moneda = String(c.moneda || 'PYG');
    const equivalentePYG = moneda === 'USD' ? Math.round(saldo * tasa) : Math.round(saldo);
    const equivalenteUSD = moneda === 'USD' ? Number(saldo.toFixed(2)) : Number((saldo / tasa).toFixed(2));
    return {
      id: String(c.id),
      nombre: String(c.nombre),
      tipo: String(c.tipo),
      moneda: moneda,
      saldoActual: saldo,
      limiteCredito: limite,
      deudaActual: deuda,
      disponibleCredito: Math.max(0, limite - deuda),
      cierreDia: Number(c.cierreDia) || 25,
      vencimientoDia: Number(c.vencimientoDia) || 5,
      entidad: String(c.entidad),
      icono: String(c.icono || 'Landmark'),
      activa: String(c.activa).toUpperCase() !== 'FALSE',
      equivalentePYG: equivalentePYG,
      equivalenteUSD: equivalenteUSD
    };
  });
}

function getCampanasLotes() {
  return sheetToObjects(SHEET_NAMES.CAMPANAS_LOTES).map(function(c) {
    return {
      id: String(c.id),
      nombre: String(c.nombre),
      actividad: String(c.actividad),
      cultivoRodeo: String(c.cultivoRodeo),
      hectareasCabezas: Number(c.hectareasCabezas) || 0,
      unidadMedida: String(c.unidadMedida || 'HA'),
      estado: String(c.estado || 'EN_CURSO'),
      metaRinde: Number(c.metaRinde) || 0,
      monedaBase: String(c.monedaBase || 'USD'),
      fechaInicio: String(c.fechaInicio),
      fechaFinEstimada: String(c.fechaFinEstimada)
    };
  });
}

function getMovimientos(params) {
  const list = sheetToObjects(SHEET_NAMES.MOVIMIENTOS).map(function(m) {
    return {
      id: String(m.id),
      fecha: String(m.fecha),
      tipo: String(m.tipo),
      cuentaId: String(m.cuentaId),
      cuentaDestinoId: m.cuentaDestinoId ? String(m.cuentaDestinoId) : undefined,
      campanaId: String(m.campanaId || 'GENERAL'),
      macroCategoria: String(m.macroCategoria),
      subCategoria: String(m.subCategoria),
      concepto: String(m.concepto),
      moneda: String(m.moneda),
      monto: Number(m.monto) || 0,
      tasaCambio: Number(m.tasaCambio) || 7850,
      montoPYG: Math.round(Number(m.montoPYG) || 0),
      montoUSD: Number(Number(m.montoUSD || 0).toFixed(2)),
      litrosGasoil: m.litrosGasoil ? Number(m.litrosGasoil) : undefined,
      precioLitro: m.precioLitro ? Number(m.precioLitro) : undefined,
      toneladasCabezas: m.toneladasCabezas ? Number(m.toneladasCabezas) : undefined,
      comprobanteNro: m.comprobanteNro ? String(m.comprobanteNro) : undefined
    };
  });

  return list.reverse();
}

function getPrestamosConCuotas() {
  const prestamos = sheetToObjects(SHEET_NAMES.PRESTAMOS);
  const cuotas = sheetToObjects(SHEET_NAMES.CUOTAS_PROYECTADAS);
  return prestamos.map(function(p) {
    const id = String(p.id);
    const misCuotas = cuotas.filter(function(c) { return String(c.prestamoId) === id; }).map(function(c) {
      return {
        id: String(c.id),
        prestamoId: id,
        numeroCuota: Number(c.numeroCuota),
        fechaVencimiento: String(c.fechaVencimiento),
        moneda: String(c.moneda),
        montoCapital: Number(c.montoCapital) || 0,
        montoInteres: Number(c.montoInteres) || 0,
        montoTotal: Number(c.montoTotal) || 0,
        estado: String(c.estado)
      };
    });
    return {
      id: id,
      nombre: String(p.nombre),
      entidad: String(p.entidad),
      instrumento: String(p.instrumento),
      campanaId: String(p.campanaId),
      moneda: String(p.moneda),
      capitalOriginal: Number(p.capitalOriginal) || 0,
      saldoPendiente: Number(p.saldoPendiente) || 0,
      tasaAnualPct: Number(p.tasaAnualPct) || 0,
      cuotasTotales: Number(p.cuotasTotales) || 1,
      cuotasPagadas: Number(p.cuotasPagadas) || 0,
      proximoVencimiento: String(p.proximoVencimiento),
      montoProximaCuota: Number(p.montoProximaCuota) || 0,
      estado: String(p.estado),
      cuotas: misCuotas
    };
  });
}

function getPresupuestosEjecucion(campanaId) {
  const presupuestos = sheetToObjects(SHEET_NAMES.PRESUPUESTOS);
  const movimientos = getMovimientos({});

  return presupuestos
    .filter(function(pr) { return !campanaId || campanaId === 'ALL' || String(pr.campanaId) === campanaId; })
    .map(function(pr) {
      const movsRubro = movimientos.filter(function(m) {
        const matchCamp = !campanaId || campanaId === 'ALL' || m.campanaId === String(pr.campanaId);
        return matchCamp && m.tipo === 'GASTO' && m.macroCategoria === String(pr.macroCategoria);
      });

      const ejecutadoUSD = movsRubro.reduce(function(acc, m) { return acc + m.montoUSD; }, 0);
      const ejecutadoPYG = movsRubro.reduce(function(acc, m) { return acc + m.montoPYG; }, 0);
      const asignadoUSD = Number(pr.montoAsignadoUSD) || 1;
      const asignadoPYG = Number(pr.montoAsignadoPYG) || 1;
      const porcentajeUso = Math.min(999, Math.round((ejecutadoUSD / asignadoUSD) * 100));

      return {
        id: String(pr.id),
        campanaId: String(pr.campanaId),
        macroCategoria: String(pr.macroCategoria),
        nombreRubro: String(pr.nombreRubro),
        moneda: String(pr.moneda),
        montoAsignadoUSD: asignadoUSD,
        montoAsignadoPYG: asignadoPYG,
        ejecutadoUSD: Number(ejecutadoUSD.toFixed(2)),
        ejecutadoPYG: Math.round(ejecutadoPYG),
        disponibleUSD: Number(Math.max(0, asignadoUSD - ejecutadoUSD).toFixed(2)),
        disponiblePYG: Math.max(0, Math.round(asignadoPYG - ejecutadoPYG)),
        porcentajeUso: porcentajeUso,
        alertaExceso: porcentajeUso >= 85,
        icono: String(pr.icono || 'Sprout')
      };
    });
}

function getMetricasDashboard(campanaId) {
  const cot = getCotizacionVigente();
  const tasa = cot.referenciaBCP;
  const cuentas = getCuentas();
  const prestamos = getPrestamosConCuotas();
  const movimientos = getMovimientos({});

  const liquidezPYG = cuentas
    .filter(function(c) { return c.tipo !== 'TARJETA_AGRO' && c.moneda === 'PYG'; })
    .reduce(function(s, c) { return s + c.saldoActual; }, 0);

  const liquidezUSD = cuentas
    .filter(function(c) { return c.tipo !== 'TARJETA_AGRO' && c.moneda === 'USD'; })
    .reduce(function(s, c) { return s + c.saldoActual; }, 0);

  const liquidezTotalConsolidadaPYG = Math.round(liquidezPYG + liquidezUSD * tasa);
  const liquidezTotalConsolidadaUSD = Number((liquidezUSD + liquidezPYG / tasa).toFixed(2));

  const deudaTarjetasPYG = cuentas
    .filter(function(c) { return c.tipo === 'TARJETA_AGRO'; })
    .reduce(function(s, c) {
      return s + (c.moneda === 'USD' ? Math.round(c.deudaActual * tasa) : c.deudaActual);
    }, 0);

  const deudaPrestamosUSD = prestamos
    .filter(function(p) { return p.estado === 'ACTIVO'; })
    .reduce(function(s, p) {
      return s + (p.moneda === 'USD' ? p.saldoPendiente : p.saldoPendiente / tasa);
    }, 0);

  const pasivoTotalUSD = Number((deudaPrestamosUSD + deudaTarjetasPYG / tasa).toFixed(2));
  const pasivoTotalPYG = Math.round(pasivoTotalUSD * tasa);

  const patrimonioNetoUSD = Number((liquidezTotalConsolidadaUSD - pasivoTotalUSD).toFixed(2));
  const patrimonioNetoPYG = Math.round(liquidezTotalConsolidadaPYG - pasivoTotalPYG);

  const movsCampana = movimientos.filter(function(m) {
    return !campanaId || campanaId === 'ALL' || m.campanaId === campanaId;
  });

  const ingresosCampanaUSD = Number(movsCampana
    .filter(function(m) { return m.tipo === 'INGRESO'; })
    .reduce(function(s, m) { return s + m.montoUSD; }, 0).toFixed(2));

  const costosCampanaUSD = Number(movsCampana
    .filter(function(m) { return m.tipo === 'GASTO'; })
    .reduce(function(s, m) { return s + m.montoUSD; }, 0).toFixed(2));

  return {
    tasaCambioReferencia: tasa,
    liquidezNativaPYG: Math.round(liquidezPYG),
    liquidezNativaUSD: Number(liquidezUSD.toFixed(2)),
    liquidezConsolidadaPYG: liquidezTotalConsolidadaPYG,
    liquidezConsolidadaUSD: liquidezTotalConsolidadaUSD,
    pasivoTotalPYG: pasivoTotalPYG,
    pasivoTotalUSD: pasivoTotalUSD,
    patrimonioNetoPYG: patrimonioNetoPYG,
    patrimonioNetoUSD: patrimonioNetoUSD,
    ingresosCampanaUSD: ingresosCampanaUSD,
    ingresosCampanaPYG: Math.round(ingresosCampanaUSD * tasa),
    costosCampanaUSD: costosCampanaUSD,
    costosCampanaPYG: Math.round(costosCampanaUSD * tasa),
    margenBrutoCampanaUSD: Number((ingresosCampanaUSD - costosCampanaUSD).toFixed(2)),
    margenBrutoCampanaPYG: Math.round((ingresosCampanaUSD - costosCampanaUSD) * tasa)
  };
}

function getBootstrapData() {
  return {
    cotizacion: getCotizacionVigente(),
    cuentas: getCuentas(),
    campanas: getCampanasLotes(),
    movimientos: getMovimientos({}),
    presupuestos: getPresupuestosEjecucion('ALL'),
    prestamos: getPrestamosConCuotas(),
    metricas: getMetricasDashboard('ALL')
  };
}

