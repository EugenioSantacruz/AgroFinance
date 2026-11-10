import { CurrencyCode } from '../types/domain';

/**
 * Formateador Bimoneda Estricto para Agro Paraguay (es-PY)
 * - PYG: "Gs. 15.800.000" (entero sin decimales, separador de miles con punto)
 * - USD: "US$ 12,450.00" (2 decimales exactos)
 */
export function formatMoney(
  amount: number | undefined | null,
  currency: CurrencyCode,
  isPrivate = false
): string {
  if (isPrivate) {
    return currency === 'USD' ? 'US$ ••••••' : 'Gs. ••••••••';
  }

  const safeAmount = Number(amount) || 0;
  const isNegative = safeAmount < 0;
  const absAmount = Math.abs(safeAmount);

  if (currency === 'PYG') {
    const rounded = Math.round(absAmount);
    const formatted = rounded
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${isNegative ? '- ' : ''}Gs. ${formatted}`;
  }

  const [intPart, decPart] = absAmount.toFixed(2).split('.');
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${isNegative ? '- ' : ''}US$ ${formattedInt}.${decPart}`;
}

export function formatNumberPY(value: number, decimals = 0): string {
  const safe = Number(value) || 0;
  if (decimals === 0) {
    return Math.round(safe)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  const [i, d] = safe.toFixed(decimals).split('.');
  return `${i.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${d}`;
}

export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  exchangeRate: number
): number {
  const rate = exchangeRate > 0 ? exchangeRate : 7835;
  if (from === to) {
    return from === 'PYG' ? Math.round(amount) : Number(amount.toFixed(2));
  }
  if (from === 'USD' && to === 'PYG') {
    return Math.round(amount * rate);
  }
  return Number((amount / rate).toFixed(2));
}

