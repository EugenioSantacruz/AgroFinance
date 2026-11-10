import { AmbitoFinanciero, CuentaAgro, TipoCuentaAgro } from '../types/domain';

export function isTarjetaCuenta(tipo: TipoCuentaAgro): boolean {
  return tipo === 'TARJETA_AGRO' || tipo === 'TARJETA';
}

export function getTipoCuentaLabel(tipo: TipoCuentaAgro): string {
  switch (tipo) {
    case 'BANCO':
      return 'Cuenta Bancaria';
    case 'EFECTIVO':
      return 'Efectivo / Billetera';
    case 'TARJETA':
      return 'Tarjeta de Crédito';
    case 'CAJA_ESTANCIA':
      return 'Caja Operativa';
    case 'TARJETA_AGRO':
      return 'Tarjeta / Línea Rural';
    case 'CUENTA_GRANARIA':
      return 'Cta. Cte. Acopio / Silo';
  }
}

export function getAmbitoLabel(ambito: AmbitoFinanciero | 'TODOS'): string {
  switch (ambito) {
    case 'NEGOCIO':
      return 'Negocio (Maní)';
    case 'PERSONAL':
      return 'Personal / Hogar';
    default:
      return 'Consolidado';
  }
}

export function canDebitFromAccount(
  cuenta: CuentaAgro,
  montoEnMonedaCuenta: number
): { ok: boolean; saldoResultante: number; warning?: string } {
  if (isTarjetaCuenta(cuenta.tipo)) {
    const disponible = cuenta.disponibleCredito;
    const resultante = disponible - montoEnMonedaCuenta;
    return {
      ok: resultante >= 0,
      saldoResultante: resultante,
      warning:
        resultante < 0
          ? 'El monto supera el límite disponible de la tarjeta.'
          : undefined,
    };
  }

  const resultante = cuenta.saldoActual - montoEnMonedaCuenta;
  return {
    ok: true,
    saldoResultante: resultante,
    warning:
      resultante < 0
        ? 'Atención: Esta operación dejará la cuenta con saldo negativo.'
        : undefined,
  };
}
