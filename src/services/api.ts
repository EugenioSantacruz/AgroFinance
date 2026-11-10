import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_CONFIG } from '../constants/config';
import {
  ActualizarCotizacionInput,
  AjustarSaldoInput,
  AnularMovimientoInput,
  BootstrapPayload,
  CambiarEstadoChequeInput,
  CrearChequeDiferidoInput,
  CrearCompraCuotasInput,
  CrearCuentaInput,
  GasResponse,
  LiquidarChequeInput,
  PagarCuotaInput,
  PagarTarjetaInput,
  RegistrarMovimientoInput,
  RegistrarTransferenciaInput,
} from '../types/api';
import {
  AmbitoFiltro,
  CampanaLoteAgro,
  CategoriaConfigAgro,
  ChequeDiferido,
  CotizacionBimoneda,
  CuentaAgro,
  MovimientoAgro,
  PrestamoAgro,
  PresupuestoRubroAgro,
  TipoMovimientoAgro,
} from '../types/domain';
import { isTarjetaCuenta } from '../utils/accounts';
import {
  ensureDDMMYYYY,
  generateInstallmentDates,
  getTodayDDMMYYYY,
} from '../utils/dates';
import {
  computeFlujoCajaProyectado,
  computeServerMetricas,
  INITIAL_CAMPANAS,
  INITIAL_CATEGORIAS,
  INITIAL_CHEQUES,
  INITIAL_COTIZACION,
  INITIAL_CUENTAS,
  INITIAL_MOVIMIENTOS,
  INITIAL_PRESTAMOS,
  INITIAL_PRESUPUESTOS,
  isCashInflow,
  isCashOutflow,
} from './mockData';

interface LocalStoreState {
  cotizacion: CotizacionBimoneda;
  cuentas: CuentaAgro[];
  campanas: CampanaLoteAgro[];
  categorias: CategoriaConfigAgro[];
  movimientos: MovimientoAgro[];
  presupuestos: PresupuestoRubroAgro[];
  prestamos: PrestamoAgro[];
  cheques: ChequeDiferido[];
}

let memoryStore: LocalStoreState | null = null;

function createDemoState(): LocalStoreState {
  return {
    cotizacion: { ...INITIAL_COTIZACION },
    cuentas: [...INITIAL_CUENTAS],
    campanas: [...INITIAL_CAMPANAS],
    categorias: [...INITIAL_CATEGORIAS],
    movimientos: [...INITIAL_MOVIMIENTOS],
    presupuestos: [...INITIAL_PRESUPUESTOS],
    prestamos: [...INITIAL_PRESTAMOS],
    cheques: [...INITIAL_CHEQUES],
  };
}

function createCleanState(): LocalStoreState {
  return {
    cotizacion: { ...INITIAL_COTIZACION },
    cuentas: [],
    campanas: [],
    categorias: [...INITIAL_CATEGORIAS],
    movimientos: [],
    presupuestos: [],
    prestamos: [],
    cheques: [],
  };
}

async function getLocalStore(): Promise<LocalStoreState> {
  if (memoryStore) return memoryStore;
  try {
    const raw = await AsyncStorage.getItem(
      APP_CONFIG.STORAGE_KEYS.MOCK_STATE_CACHE
    );
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<LocalStoreState>;
      memoryStore = {
        cotizacion: parsed.cotizacion || { ...INITIAL_COTIZACION },
        cuentas: parsed.cuentas || [...INITIAL_CUENTAS],
        campanas: parsed.campanas || [...INITIAL_CAMPANAS],
        categorias: parsed.categorias || [...INITIAL_CATEGORIAS],
        movimientos: parsed.movimientos || [...INITIAL_MOVIMIENTOS],
        presupuestos: parsed.presupuestos || [...INITIAL_PRESUPUESTOS],
        prestamos: parsed.prestamos || [...INITIAL_PRESTAMOS],
        cheques: parsed.cheques || [...INITIAL_CHEQUES],
      };
      return memoryStore;
    }
  } catch {
    // Fallback a semilla en memoria
  }

  memoryStore = createDemoState();
  return memoryStore;
}

async function saveLocalStore(state: LocalStoreState): Promise<void> {
  memoryStore = state;
  try {
    await AsyncStorage.setItem(
      APP_CONFIG.STORAGE_KEYS.MOCK_STATE_CACHE,
      JSON.stringify(state)
    );
  } catch {
    // Ignorar error de almacenamiento
  }
}

function applyDeltaToCuentas(
  cuentas: CuentaAgro[],
  cuentaId: string,
  montoPYG: number,
  montoUSD: number,
  tipoMov: TipoMovimientoAgro,
  tasa: number
): CuentaAgro[] {
  return cuentas.map((c) => {
    if (c.id !== cuentaId) return c;
    const montoCuenta = c.moneda === 'PYG' ? montoPYG : montoUSD;

    if (isTarjetaCuenta(c.tipo)) {
      const nuevaDeuda = isCashOutflow(tipoMov)
        ? c.deudaActual + montoCuenta
        : Math.max(0, c.deudaActual - montoCuenta);
      return {
        ...c,
        deudaActual: nuevaDeuda,
        disponibleCredito: Math.max(0, c.limiteCredito - nuevaDeuda),
      };
    }

    const nuevoSaldo = isCashInflow(tipoMov)
      ? c.saldoActual + montoCuenta
      : c.saldoActual - montoCuenta;

    return {
      ...c,
      saldoActual: nuevoSaldo,
      equivalentePYG:
        c.moneda === 'PYG'
          ? Math.round(nuevoSaldo)
          : Math.round(nuevoSaldo * tasa),
      equivalenteUSD:
        c.moneda === 'USD'
          ? Number(nuevoSaldo.toFixed(2))
          : Number((nuevoSaldo / tasa).toFixed(2)),
    };
  });
}

async function parseGasHttpResponse<T>(
  res: Response,
  fallbackError: string
): Promise<T> {
  const rawText = await res.text();
  let json: GasResponse<T>;
  try {
    json = JSON.parse(rawText) as GasResponse<T>;
  } catch {
    const trimmed = rawText.trim().toLowerCase();
    if (trimmed.startsWith('<!doctype') || trimmed.startsWith('<html')) {
      throw new Error(
        'Google Apps Script devolvió HTML en lugar de JSON. Verificá que la URL en .env termine en /exec y esté implementada como Web App con acceso "Cualquier persona".'
      );
    }
    throw new Error(
      `Respuesta inválida de Google Apps Script (HTTP ${res.status}): ${rawText.slice(0, 140)}`
    );
  }

  if (!res.ok || !json.ok || json.data === undefined) {
    throw new Error(json.error || fallbackError);
  }
  return json.data;
}

/**
 * Cliente HTTP hacia Google Apps Script con Content-Type: text/plain;charset=utf-8
 * para evitar preflights CORS en Web/PWA y fallback automático a estado local.
 */
export async function gasGet<T>(
  action: string,
  params: Record<string, string> = {}
): Promise<T> {
  const gasUrl = APP_CONFIG.GAS_URL.trim();
  if (gasUrl) {
    const query = Object.entries({ action, ...params })
      .map(
        ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`
      )
      .join('&');
    const sep = gasUrl.includes('?') ? '&' : '?';

    const res = await fetch(`${gasUrl}${sep}${query}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });
    return parseGasHttpResponse<T>(
      res,
      'Error en respuesta de Google Apps Script'
    );
  }

  await new Promise((r) => setTimeout(r, 180));
  const store = await getLocalStore();
  const ambito = (params.ambito as AmbitoFiltro) || 'TODOS';

  switch (action) {
    case 'getCotizacion':
      return store.cotizacion as unknown as T;
    case 'getCuentas':
      return store.cuentas as unknown as T;
    case 'getCampanas':
      return store.campanas as unknown as T;
    case 'getCategorias':
      return store.categorias as unknown as T;
    case 'getMovimientos':
      return store.movimientos.filter((m) => !m.anulado) as unknown as T;
    case 'getPresupuestos': {
      const campId = params.campanaId;
      const list =
        !campId || campId === 'ALL'
          ? store.presupuestos
          : store.presupuestos.filter((p) => p.campanaId === campId);
      return list as unknown as T;
    }
    case 'getPrestamos':
      return store.prestamos as unknown as T;
    case 'getCheques':
      return store.cheques as unknown as T;
    case 'getMetricasDashboard': {
      const metricas = computeServerMetricas(
        store.cuentas,
        store.prestamos,
        store.cheques,
        store.movimientos,
        store.cotizacion,
        params.campanaId || 'ALL',
        ambito
      );
      return metricas as unknown as T;
    }
    case 'getFlujoCajaProyectado': {
      const flujo = computeFlujoCajaProyectado(
        store.cuentas,
        store.prestamos,
        store.cheques,
        store.cotizacion,
        ambito
      );
      return flujo as unknown as T;
    }
    case 'getBootstrapData': {
      const payload: BootstrapPayload = {
        cotizacion: store.cotizacion,
        cuentas: store.cuentas,
        campanas: store.campanas,
        categorias: store.categorias,
        movimientos: store.movimientos.filter((m) => !m.anulado),
        presupuestos: store.presupuestos,
        prestamos: store.prestamos,
        cheques: store.cheques,
        metricas: computeServerMetricas(
          store.cuentas,
          store.prestamos,
          store.cheques,
          store.movimientos,
          store.cotizacion,
          'ALL',
          ambito
        ),
        flujo: computeFlujoCajaProyectado(
          store.cuentas,
          store.prestamos,
          store.cheques,
          store.cotizacion,
          ambito
        ),
      };
      return payload as unknown as T;
    }
    default:
      throw new Error(`Acción GET desconocida: ${action}`);
  }
}

export async function gasPost<T>(action: string, payload: unknown): Promise<T> {
  const gasUrl = APP_CONFIG.GAS_URL.trim();
  if (gasUrl) {
    const res = await fetch(gasUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({ action, payload }),
    });
    return parseGasHttpResponse<T>(res, 'Error al guardar en Google Sheets');
  }

  await new Promise((r) => setTimeout(r, 260));
  const store = await getLocalStore();
  const tasaDefault = store.cotizacion.referenciaBCP || 7835;

  switch (action) {
    case 'registrarMovimiento': {
      const input = payload as RegistrarMovimientoInput;
      const tasa = input.tasaCambio || tasaDefault;
      const fecha = ensureDDMMYYYY(input.fecha);
      const montoPYG =
        input.moneda === 'PYG'
          ? Math.round(input.monto)
          : Math.round(input.monto * tasa);
      const montoUSD =
        input.moneda === 'USD'
          ? Number(input.monto.toFixed(2))
          : Number((input.monto / tasa).toFixed(2));

      const nuevoMov: MovimientoAgro = {
        id: `MOV-${Date.now()}`,
        fecha,
        ambito: input.ambito || 'NEGOCIO',
        tipo: input.tipo,
        cuentaId: input.cuentaId,
        campanaId: input.campanaId,
        macroCategoria: input.macroCategoria,
        subCategoria: input.subCategoria,
        concepto: input.concepto,
        contraparte: input.contraparte,
        moneda: input.moneda,
        monto: input.monto,
        tasaCambio: tasa,
        montoPYG,
        montoUSD,
        litrosGasoil: input.litrosGasoil,
        precioLitro: input.precioLitro,
        toneladasCabezas: input.toneladasCabezas,
        comprobanteNro: input.comprobanteNro,
        referenciaId: input.referenciaId,
        anulado: false,
      };

      const cuentasActualizadas = applyDeltaToCuentas(
        store.cuentas,
        input.cuentaId,
        montoPYG,
        montoUSD,
        input.tipo,
        tasa
      );

      const presupuestosActualizados = store.presupuestos.map((pr) => {
        if (
          input.tipo !== 'GASTO' ||
          pr.macroCategoria !== input.macroCategoria ||
          pr.campanaId !== input.campanaId
        ) {
          return pr;
        }
        const ejUSD = Number((pr.ejecutadoUSD + montoUSD).toFixed(2));
        const ejPYG = Math.round(pr.ejecutadoPYG + montoPYG);
        const pct = Math.min(
          999,
          Math.round((ejUSD / (pr.montoAsignadoUSD || 1)) * 100)
        );
        return {
          ...pr,
          ejecutadoUSD: ejUSD,
          ejecutadoPYG: ejPYG,
          disponibleUSD: Math.max(
            0,
            Number((pr.montoAsignadoUSD - ejUSD).toFixed(2))
          ),
          disponiblePYG: Math.max(0, pr.montoAsignadoPYG - ejPYG),
          porcentajeUso: pct,
          alertaExceso: pct >= 85,
        };
      });

      await saveLocalStore({
        ...store,
        cuentas: cuentasActualizadas,
        movimientos: [nuevoMov, ...store.movimientos],
        presupuestos: presupuestosActualizados,
      });

      return nuevoMov as unknown as T;
    }

    case 'anularMovimiento': {
      const input = payload as AnularMovimientoInput;
      const mov = store.movimientos.find((m) => m.id === input.movimientoId);
      if (!mov || mov.anulado) {
        throw new Error('Movimiento no encontrado o ya anulado.');
      }
      if (mov.referenciaId) {
        throw new Error(
          'No se puede anular un movimiento vinculado a un cheque o cuota liquidada.'
        );
      }

      const isIn = isCashInflow(mov.tipo);
      const isOut = isCashOutflow(mov.tipo);
      const hasDest = Boolean(mov.cuentaDestinoId);
      if (!isIn && !isOut && !hasDest) {
        throw new Error('Este tipo de asiento no admite anulación automática.');
      }

      const tasa = mov.tasaCambio || tasaDefault;
      let cuentasActualizadas = store.cuentas;
      if (isIn) {
        cuentasActualizadas = applyDeltaToCuentas(
          cuentasActualizadas,
          mov.cuentaId,
          mov.montoPYG,
          mov.montoUSD,
          'GASTO',
          tasa
        );
      } else if (isOut) {
        cuentasActualizadas = applyDeltaToCuentas(
          cuentasActualizadas,
          mov.cuentaId,
          mov.montoPYG,
          mov.montoUSD,
          'INGRESO',
          tasa
        );
      } else if (hasDest && mov.cuentaDestinoId) {
        cuentasActualizadas = applyDeltaToCuentas(
          cuentasActualizadas,
          mov.cuentaId,
          mov.montoPYG,
          mov.montoUSD,
          'INGRESO',
          tasa
        );
        cuentasActualizadas = applyDeltaToCuentas(
          cuentasActualizadas,
          mov.cuentaDestinoId,
          mov.montoPYG,
          mov.montoUSD,
          'GASTO',
          tasa
        );
      }

      const movsActualizados = store.movimientos.map((m) =>
        m.id === mov.id ? { ...m, anulado: true } : m
      );

      await saveLocalStore({
        ...store,
        cuentas: cuentasActualizadas,
        movimientos: movsActualizados,
      });

      return { ok: true, movimientoId: mov.id } as unknown as T;
    }

    case 'registrarTransferencia': {
      const input = payload as RegistrarTransferenciaInput;
      const origen = store.cuentas.find((c) => c.id === input.cuentaOrigenId);
      const destino = store.cuentas.find(
        (c) => c.id === input.cuentaDestinoId
      );
      if (!origen || !destino) {
        throw new Error('Seleccione cuentas origen y destino válidas.');
      }

      const tasa = input.tasaCambio || tasaDefault;
      const montoPYG =
        origen.moneda === 'PYG'
          ? Math.round(input.montoOrigen)
          : Math.round(input.montoOrigen * tasa);
      const montoUSD =
        origen.moneda === 'USD'
          ? Number(input.montoOrigen.toFixed(2))
          : Number((input.montoOrigen / tasa).toFixed(2));

      let cuentasActualizadas = applyDeltaToCuentas(
        store.cuentas,
        origen.id,
        montoPYG,
        montoUSD,
        'GASTO',
        tasa
      );
      cuentasActualizadas = applyDeltaToCuentas(
        cuentasActualizadas,
        destino.id,
        montoPYG,
        montoUSD,
        'INGRESO',
        tasa
      );

      const origAmb = origen.ambito || 'NEGOCIO';
      const destAmb = destino.ambito || 'NEGOCIO';
      let tipo: TipoMovimientoAgro = 'TRANSFERENCIA';
      let subCategoria = 'Transferencia entre Cuentas';
      if (origAmb === 'NEGOCIO' && destAmb === 'PERSONAL') {
        tipo = 'RETIRO_PERSONAL';
        subCategoria = 'Retiro Personal del Negocio';
      } else if (origAmb === 'PERSONAL' && destAmb === 'NEGOCIO') {
        tipo = 'APORTE_NEGOCIO';
        subCategoria = 'Aporte Personal al Negocio';
      }

      const mov: MovimientoAgro = {
        id: `TRF-${Date.now()}`,
        fecha: ensureDDMMYYYY(input.fecha),
        ambito: origAmb,
        tipo,
        cuentaId: origen.id,
        cuentaDestinoId: destino.id,
        campanaId: input.campanaId,
        macroCategoria:
          origAmb !== destAmb ? 'RETIRO_APORTE' : 'FINANCIERO_IMPUESTOS',
        subCategoria,
        concepto:
          input.concepto || `Transferencia ${origen.nombre} -> ${destino.nombre}`,
        moneda: origen.moneda,
        monto: input.montoOrigen,
        tasaCambio: tasa,
        montoPYG,
        montoUSD,
        anulado: false,
      };

      await saveLocalStore({
        ...store,
        cuentas: cuentasActualizadas,
        movimientos: [mov, ...store.movimientos],
      });

      return mov as unknown as T;
    }

    case 'pagarTarjetaAgro': {
      const input = payload as PagarTarjetaInput;
      return gasPost<T>('registrarTransferencia', {
        cuentaOrigenId: input.cuentaOrigenId,
        cuentaDestinoId: input.tarjetaId,
        montoOrigen: input.monto,
        tasaCambio: input.tasaCambio,
        concepto: input.concepto || 'Pago de Tarjeta',
      });
    }

    case 'ajustarSaldoCuenta': {
      const input = payload as AjustarSaldoInput;
      const cuentasActualizadas = store.cuentas.map((c) => {
        if (c.id !== input.cuentaId) return c;
        const ns = input.nuevoSaldo;
        return {
          ...c,
          saldoActual: ns,
          equivalentePYG:
            c.moneda === 'PYG'
              ? Math.round(ns)
              : Math.round(ns * tasaDefault),
          equivalenteUSD:
            c.moneda === 'USD'
              ? Number(ns.toFixed(2))
              : Number((ns / tasaDefault).toFixed(2)),
        };
      });

      await saveLocalStore({
        ...store,
        cuentas: cuentasActualizadas,
      });

      return {
        ok: true,
        cuentaId: input.cuentaId,
        nuevoSaldo: input.nuevoSaldo,
      } as unknown as T;
    }

    case 'actualizarCotizacion': {
      const input = payload as ActualizarCotizacionInput;
      const nuevaCot: CotizacionBimoneda = {
        id: `COT-${Date.now()}`,
        fecha: getTodayDDMMYYYY(),
        compraPYG: Math.round(input.compraPYG),
        ventaPYG: Math.round(input.ventaPYG),
        referenciaBCP: Math.round(input.referenciaBCP),
        vigente: true,
      };

      await saveLocalStore({
        ...store,
        cotizacion: nuevaCot,
      });

      return nuevaCot as unknown as T;
    }

    case 'crearCuenta': {
      const input = payload as CrearCuentaInput;
      const saldo = Number(input.saldoActual) || 0;
      const limite = Number(input.limiteCredito) || 0;
      const deuda = Number(input.deudaActual) || 0;
      const nueva: CuentaAgro = {
        id: `CTA-${Date.now()}`,
        nombre: input.nombre,
        ambito: input.ambito || 'NEGOCIO',
        tipo: input.tipo,
        moneda: input.moneda,
        saldoActual: saldo,
        limiteCredito: limite,
        deudaActual: deuda,
        disponibleCredito: Math.max(0, limite - deuda),
        cierreDia: input.cierreDia || 1,
        vencimientoDia: input.vencimientoDia || 1,
        entidad: input.entidad || 'Cuenta Propia',
        icono:
          input.tipo === 'EFECTIVO' || input.tipo === 'CAJA_ESTANCIA'
            ? 'Wallet'
            : isTarjetaCuenta(input.tipo)
            ? 'CreditCard'
            : 'Landmark',
        activa: true,
        equivalentePYG:
          input.moneda === 'PYG'
            ? Math.round(saldo)
            : Math.round(saldo * tasaDefault),
        equivalenteUSD:
          input.moneda === 'USD'
            ? Number(saldo.toFixed(2))
            : Number((saldo / tasaDefault).toFixed(2)),
      };

      await saveLocalStore({
        ...store,
        cuentas: [...store.cuentas, nueva],
      });

      return nueva as unknown as T;
    }

    case 'crearCompraCuotas': {
      const input = payload as CrearCompraCuotasInput;
      const n = Math.max(1, Math.round(input.cuotasTotales));
      const montoTotal = Number(input.montoTotal) || 0;
      const decimals = input.moneda === 'USD' ? 2 : 0;
      const baseCuota = Number((montoTotal / n).toFixed(decimals));
      const fechas = generateInstallmentDates(
        input.primerVencimiento,
        n,
        input.periodicidad
      );
      const prestamoId = `PRE-${Date.now()}`;

      const cuotas = fechas.map((fv, idx) => {
        const isLast = idx === n - 1;
        const acumulado = baseCuota * (n - 1);
        const montoCuota = isLast
          ? Number((montoTotal - acumulado).toFixed(decimals))
          : baseCuota;
        return {
          id: `CUO-${Date.now()}-${idx + 1}`,
          prestamoId,
          numeroCuota: idx + 1,
          fechaVencimiento: fv,
          moneda: input.moneda,
          montoCapital: montoCuota,
          montoInteres: 0,
          montoTotal: montoCuota,
          estado: 'PENDIENTE' as const,
        };
      });

      const nuevo: PrestamoAgro = {
        id: prestamoId,
        ambito: input.ambito || 'NEGOCIO',
        direccion: input.direccion || 'PAGAR',
        nombre: input.nombre,
        entidad: input.contraparte || 'Proveedor',
        contraparte: input.contraparte,
        instrumento:
          input.direccion === 'COBRAR'
            ? 'CUENTA_POR_COBRAR'
            : input.instrumento || 'COMPRA_CUOTAS',
        periodicidad: input.periodicidad,
        campanaId: input.campanaId,
        moneda: input.moneda,
        capitalOriginal: montoTotal,
        saldoPendiente: montoTotal,
        tasaAnualPct: input.tasaAnualPct || 0,
        cuotasTotales: n,
        cuotasPagadas: 0,
        proximoVencimiento: cuotas[0].fechaVencimiento,
        montoProximaCuota: cuotas[0].montoTotal,
        estado: 'ACTIVO',
        cuotas,
      };

      await saveLocalStore({
        ...store,
        prestamos: [nuevo, ...store.prestamos],
      });

      return nuevo as unknown as T;
    }

    case 'pagarCuota': {
      const input = payload as PagarCuotaInput;
      const prestamo = store.prestamos.find((p) => p.id === input.prestamoId);
      if (!prestamo) throw new Error('Plan de cuotas no encontrado.');
      const cuota = prestamo.cuotas.find((c) => c.id === input.cuotaId);
      if (!cuota || cuota.estado === 'PAGADA') {
        throw new Error('Cuota inválida o ya liquidada.');
      }

      const tasa = input.tasaCambio || tasaDefault;
      const fechaReal = ensureDDMMYYYY(input.fechaPago);
      const esCobro = (prestamo.direccion || 'PAGAR') === 'COBRAR';
      const tipoMov: TipoMovimientoAgro = esCobro
        ? 'COBRO_CUOTA'
        : 'PAGO_CUOTA';
      const montoPYG =
        cuota.moneda === 'PYG'
          ? Math.round(cuota.montoTotal)
          : Math.round(cuota.montoTotal * tasa);
      const montoUSD =
        cuota.moneda === 'USD'
          ? Number(cuota.montoTotal.toFixed(2))
          : Number((cuota.montoTotal / tasa).toFixed(2));

      const mov: MovimientoAgro = {
        id: `MOV-${Date.now()}`,
        fecha: fechaReal,
        ambito: prestamo.ambito || 'NEGOCIO',
        tipo: tipoMov,
        cuentaId: input.cuentaId,
        campanaId: prestamo.campanaId,
        macroCategoria: esCobro ? 'VENTAS_AGRO' : 'FINANCIERO_IMPUESTOS',
        subCategoria: esCobro ? 'Cobro de Cuota' : 'Pago de Cuota',
        concepto: `${prestamo.nombre} - Cuota ${cuota.numeroCuota}/${prestamo.cuotasTotales}`,
        contraparte: prestamo.contraparte || prestamo.entidad,
        moneda: cuota.moneda,
        monto: cuota.montoTotal,
        tasaCambio: tasa,
        montoPYG,
        montoUSD,
        referenciaId: cuota.id,
        anulado: false,
      };

      const cuentasActualizadas = applyDeltaToCuentas(
        store.cuentas,
        input.cuentaId,
        montoPYG,
        montoUSD,
        tipoMov,
        tasa
      );

      const prestamosActualizados = store.prestamos.map((p) => {
        if (p.id !== prestamo.id) return p;
        const nuevasCuotas = p.cuotas.map((c) =>
          c.id === cuota.id
            ? {
                ...c,
                estado: 'PAGADA' as const,
                fechaPago: fechaReal,
                cuentaId: input.cuentaId,
                movimientoId: mov.id,
              }
            : c
        );
        const pendientes = nuevasCuotas.filter((c) => c.estado !== 'PAGADA');
        const nuevoSaldo =
          pendientes.length === 0
            ? 0
            : Math.max(
                0,
                Number((p.saldoPendiente - cuota.montoTotal).toFixed(2))
              );
        return {
          ...p,
          cuotas: nuevasCuotas,
          cuotasPagadas: p.cuotasPagadas + 1,
          saldoPendiente: nuevoSaldo,
          proximoVencimiento: pendientes[0]?.fechaVencimiento || '-',
          montoProximaCuota: pendientes[0]?.montoTotal || 0,
          estado:
            pendientes.length === 0
              ? ('CANCELADO' as const)
              : ('ACTIVO' as const),
        };
      });

      await saveLocalStore({
        ...store,
        cuentas: cuentasActualizadas,
        prestamos: prestamosActualizados,
        movimientos: [mov, ...store.movimientos],
      });

      return mov as unknown as T;
    }

    case 'crearChequeDiferido': {
      const input = payload as CrearChequeDiferidoInput;
      const tasa = input.tasaCambio || tasaDefault;
      const montoPYG =
        input.moneda === 'PYG'
          ? Math.round(input.monto)
          : Math.round(input.monto * tasa);
      const montoUSD =
        input.moneda === 'USD'
          ? Number(input.monto.toFixed(2))
          : Number((input.monto / tasa).toFixed(2));

      const nuevoCheque: ChequeDiferido = {
        id: `CHQ-${Date.now()}`,
        ambito: input.ambito || 'NEGOCIO',
        tipo: input.tipo,
        numeroCheque: input.numeroCheque.trim(),
        bancoEntidad: input.bancoEntidad.trim(),
        cuentaId: input.cuentaId,
        contraparte: input.contraparte.trim(),
        concepto:
          input.concepto.trim() ||
          `Cheque ${input.tipo === 'RECIBIDO' ? 'recibido' : 'emitido'}`,
        moneda: input.moneda,
        monto: input.monto,
        tasaCambio: tasa,
        montoPYG,
        montoUSD,
        fechaEmision: ensureDDMMYYYY(input.fechaEmision),
        fechaCobroPago: ensureDDMMYYYY(input.fechaCobroPago),
        estado: 'PENDIENTE',
      };

      await saveLocalStore({
        ...store,
        cheques: [nuevoCheque, ...store.cheques],
      });

      return nuevoCheque as unknown as T;
    }

    case 'liquidarChequeDiferido': {
      const input = payload as LiquidarChequeInput;
      const cheque = store.cheques.find((c) => c.id === input.chequeId);
      if (!cheque || cheque.estado !== 'PENDIENTE') {
        throw new Error('Cheque no encontrado o ya procesado.');
      }

      const tasa = input.tasaCambio || cheque.tasaCambio || tasaDefault;
      const fechaReal = ensureDDMMYYYY(input.fechaLiquidacion);
      const esRecibido = cheque.tipo === 'RECIBIDO';
      const tipoMov: TipoMovimientoAgro = esRecibido
        ? 'CHEQUE_COBRADO'
        : 'CHEQUE_PAGADO';
      const montoPYG =
        cheque.moneda === 'PYG'
          ? Math.round(cheque.monto)
          : Math.round(cheque.monto * tasa);
      const montoUSD =
        cheque.moneda === 'USD'
          ? Number(cheque.monto.toFixed(2))
          : Number((cheque.monto / tasa).toFixed(2));

      const mov: MovimientoAgro = {
        id: `MOV-${Date.now()}`,
        fecha: fechaReal,
        ambito: cheque.ambito || 'NEGOCIO',
        tipo: tipoMov,
        cuentaId: input.cuentaId,
        macroCategoria: esRecibido ? 'VENTAS_AGRO' : 'FINANCIERO_IMPUESTOS',
        subCategoria: esRecibido
          ? 'Acreditación Cheque Recibido'
          : 'Débito Cheque Emitido',
        concepto: `Cheque #${cheque.numeroCheque || '-'} (${cheque.bancoEntidad}) · ${cheque.concepto}`,
        contraparte: cheque.contraparte,
        moneda: cheque.moneda,
        monto: cheque.monto,
        tasaCambio: tasa,
        montoPYG,
        montoUSD,
        comprobanteNro: cheque.numeroCheque,
        referenciaId: cheque.id,
        anulado: false,
      };

      const cuentasActualizadas = applyDeltaToCuentas(
        store.cuentas,
        input.cuentaId,
        montoPYG,
        montoUSD,
        tipoMov,
        tasa
      );

      const chequesActualizados = store.cheques.map((c) =>
        c.id === cheque.id
          ? {
              ...c,
              estado: 'LIQUIDADO' as const,
              fechaLiquidacion: fechaReal,
              cuentaId: input.cuentaId,
              movimientoId: mov.id,
            }
          : c
      );

      await saveLocalStore({
        ...store,
        cuentas: cuentasActualizadas,
        cheques: chequesActualizados,
        movimientos: [mov, ...store.movimientos],
      });

      return {
        cheque: chequesActualizados.find((c) => c.id === cheque.id),
        movimiento: mov,
      } as unknown as T;
    }

    case 'cambiarEstadoCheque': {
      const input = payload as CambiarEstadoChequeInput;
      const chequesActualizados = store.cheques.map((c) =>
        c.id === input.chequeId ? { ...c, estado: input.estado } : c
      );
      await saveLocalStore({
        ...store,
        cheques: chequesActualizados,
      });
      return chequesActualizados.find(
        (c) => c.id === input.chequeId
      ) as unknown as T;
    }

    case 'resetCleanSheet': {
      const clean = createCleanState();
      await saveLocalStore(clean);
      return { ok: true } as unknown as T;
    }

    case 'restoreDemoLocal': {
      const demo = createDemoState();
      await saveLocalStore(demo);
      return { ok: true } as unknown as T;
    }

    default:
      throw new Error(`Acción POST desconocida: ${action}`);
  }
}
