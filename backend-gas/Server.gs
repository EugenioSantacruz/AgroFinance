/**
 * AGROFINANCE PARAGUAY - ROUTER SERVERLESS (doGet / doPost)
 * Soporta Content-Type: text/plain;charset=utf-8 para evitar bloqueos CORS en Web/PWA
 */

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'getBootstrapData';
    let payload = null;

    switch (action) {
      case 'getBootstrapData':
        payload = getBootstrapData();
        break;
      case 'getMetricasDashboard':
        payload = getMetricasDashboard(e.parameter.campanaId || 'ALL');
        break;
      case 'getCuentas':
        payload = getCuentas();
        break;
      case 'getMovimientos':
        payload = getMovimientos(e.parameter);
        break;
      case 'getPresupuestos':
        payload = getPresupuestosEjecucion(e.parameter.campanaId || 'ALL');
        break;
      case 'getPrestamos':
        payload = getPrestamosConCuotas();
        break;
      case 'getCotizacion':
        payload = getCotizacionVigente();
        break;
      default:
        throw new Error('Acción GET no reconocida: ' + action);
    }

    return buildJsonResponse({ ok: true, data: payload, timestamp: formatDateDDMMYYYY(new Date()) });
  } catch (err) {
    return buildJsonResponse({ ok: false, error: err.message || String(err) });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const rawBody = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    const body = JSON.parse(rawBody);
    const action = body.action;
    let result = null;

    switch (action) {
      case 'registrarMovimiento':
        result = registrarMovimientoAtomico(body.payload);
        break;
      case 'registrarTransferencia':
        result = registrarTransferenciaBimoneda(body.payload);
        break;
      case 'pagarTarjetaAgro':
        result = pagarTarjetaAgroAtomico(body.payload);
        break;
      case 'pagarCuotaPrestamo':
        result = pagarCuotaPrestamoAtomico(body.payload);
        break;
      case 'ajustarSaldoCuenta':
        result = ajustarSaldoCuentaAtomico(body.payload);
        break;
      case 'actualizarCotizacion':
        result = actualizarCotizacionUSD(body.payload);
        break;
      default:
        throw new Error('Acción POST no reconocida: ' + action);
    }

    return buildJsonResponse({ ok: true, data: result, timestamp: formatDateDDMMYYYY(new Date()) });
  } catch (err) {
    return buildJsonResponse({ ok: false, error: err.message || String(err) });
  } finally {
    lock.releaseLock();
  }
}

function buildJsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function formatDateDDMMYYYY(dateObj) {
  const d = String(dateObj.getDate()).padStart(2, '0');
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const y = dateObj.getFullYear();
  return d + '-' + m + '-' + y;
}

