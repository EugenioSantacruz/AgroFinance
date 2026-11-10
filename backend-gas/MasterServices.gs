/**
 * AGROFINANCE PARAGUAY - MASTER SERVICES (COTIZACIÓN USD/PYG & CONFIGURACIÓN)
 */

function actualizarCotizacionUSD(payload) {
  const sheet = getSheetByNameSafe(SHEET_NAMES.COTIZACIONES);
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    sheet.getRange(i + 1, 6).setValue(false);
  }

  const fecha = formatDateDDMMYYYY(new Date());
  const id = 'COT-' + new Date().getTime();
  const compra = Math.round(Number(payload.compraPYG) || 7810);
  const venta = Math.round(Number(payload.ventaPYG) || 7860);
  const ref = Math.round(Number(payload.referenciaBCP) || Math.round((compra + venta) / 2));

  sheet.appendRow([id, fecha, compra, venta, ref, true]);

  return {
    id: id,
    fecha: fecha,
    compraPYG: compra,
    ventaPYG: venta,
    referenciaBCP: ref,
    vigente: true
  };
}

