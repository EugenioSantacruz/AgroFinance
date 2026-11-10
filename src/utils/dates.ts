import { PeriodicidadCuota } from '../types/domain';

/**
 * REGLA ESTRICTA DE FECHAS:
 * Todas las fechas en la UI y en el Libro Google Sheets usan formato DD-MM-AAAA.
 */

export function getTodayDDMMYYYY(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

export function getYesterdayDDMMYYYY(): string {
  return addDaysDDMMYYYY(getTodayDDMMYYYY(), -1);
}

export function ensureDDMMYYYY(input?: string | Date): string {
  if (!input) return getTodayDDMMYYYY();
  if (input instanceof Date) {
    const dd = String(input.getDate()).padStart(2, '0');
    const mm = String(input.getMonth() + 1).padStart(2, '0');
    const yyyy = input.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }
  const clean = input.trim();
  if (/^\d{2}-\d{2}-\d{4}$/.test(clean)) {
    return clean;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
    const [yyyy, mm, dd] = clean.slice(0, 10).split('-');
    return `${dd}-${mm}-${yyyy}`;
  }
  return clean;
}

export function isValidDDMMYYYY(input: string): boolean {
  if (!/^\d{2}-\d{2}-\d{4}$/.test(input.trim())) return false;
  const [dd, mm, yyyy] = input.trim().split('-').map(Number);
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return false;
  const d = new Date(yyyy, mm - 1, dd, 12, 0, 0, 0);
  return (
    d.getFullYear() === yyyy &&
    d.getMonth() === mm - 1 &&
    d.getDate() === dd
  );
}

export function parseDDMMYYYYToDate(ddmmyyyy: string): Date {
  const normalized = ensureDDMMYYYY(ddmmyyyy);
  const parts = String(normalized || '').split('-');
  if (parts.length !== 3) return new Date();
  const [dd, mm, yyyy] = parts.map(Number);
  if (!dd || !mm || !yyyy) return new Date();
  return new Date(yyyy, mm - 1, dd, 12, 0, 0, 0);
}

export function parseDDMMYYYYToTime(ddmmyyyy: string): number {
  return parseDDMMYYYYToDate(ddmmyyyy).getTime();
}

export function diffDaysFromToday(ddmmyyyy: string): number {
  const today = parseDDMMYYYYToDate(getTodayDDMMYYYY());
  const target = parseDDMMYYYYToDate(ddmmyyyy);
  return Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
}

export function addDaysDDMMYYYY(ddmmyyyy: string, days: number): string {
  const base = parseDDMMYYYYToDate(ddmmyyyy);
  base.setDate(base.getDate() + days);
  return ensureDDMMYYYY(base);
}

export function addMonthsDDMMYYYY(ddmmyyyy: string, months: number): string {
  const d = parseDDMMYYYYToDate(ddmmyyyy);
  const originalDay = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const lastDayOfTargetMonth = new Date(
    d.getFullYear(),
    d.getMonth() + 1,
    0
  ).getDate();
  d.setDate(Math.min(originalDay, lastDayOfTargetMonth));
  return ensureDDMMYYYY(d);
}

export function getNextMonthDayDDMMYYYY(dayOfMonth: number): string {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 12, 0, 0);
  const maxDay = new Date(
    nextMonth.getFullYear(),
    nextMonth.getMonth() + 1,
    0
  ).getDate();
  nextMonth.setDate(Math.min(dayOfMonth, maxDay));
  return ensureDDMMYYYY(nextMonth);
}

export function generateInstallmentDates(
  firstDateDDMMYYYY: string,
  count: number,
  periodicidad: PeriodicidadCuota
): string[] {
  const dates: string[] = [];
  const start = ensureDDMMYYYY(firstDateDDMMYYYY);
  for (let i = 0; i < count; i++) {
    if (i === 0) {
      dates.push(start);
    } else if (periodicidad === 'SEMANAL') {
      dates.push(addDaysDDMMYYYY(start, i * 7));
    } else if (periodicidad === 'QUINCENAL') {
      dates.push(addDaysDDMMYYYY(start, i * 15));
    } else if (periodicidad === 'ANUAL') {
      dates.push(addMonthsDDMMYYYY(start, i * 12));
    } else {
      dates.push(addMonthsDDMMYYYY(start, i));
    }
  }
  return dates;
}

export function formatRelativeDueLabel(diasRestantes: number): string {
  if (diasRestantes < -1) return `Venció hace ${Math.abs(diasRestantes)} días`;
  if (diasRestantes === -1) return 'Venció ayer';
  if (diasRestantes === 0) return 'Vence HOY';
  if (diasRestantes === 1) return 'Vence mañana';
  if (diasRestantes <= 7) return `En ${diasRestantes} días`;
  return `En ${diasRestantes} días`;
}
