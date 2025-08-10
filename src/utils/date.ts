// Utilities for São Paulo timezone-safe date handling
// We treat dates as date-only (YYYY-MM-DD) strings computed in America/Sao_Paulo.
// All arithmetic is done in a timezone-agnostic way using UTC to avoid client TZ drift.

export const SAO_PAULO_TZ = 'America/Sao_Paulo';

// Format a Date into components as seen in São Paulo timezone
function formatInSaoPauloComponents(d: Date): { y: number; m: number; d: number } {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: SAO_PAULO_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = fmt.formatToParts(d);
  const y = Number(parts.find(p => p.type === 'year')?.value || '1970');
  const m = Number(parts.find(p => p.type === 'month')?.value || '01');
  const day = Number(parts.find(p => p.type === 'day')?.value || '01');
  return { y, m, d: day };
}

// Convert ISO (with or without offset) to a YMD string as it would be in São Paulo
export function isoToSaoPauloYMD(iso: string): string {
  const date = new Date(iso);
  const { y, m, d } = formatInSaoPauloComponents(date);
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// Difference in whole days between two ISO datetimes, evaluating calendar day in São Paulo
export function diffDaysISOInSP(startISO: string, endISO: string): number {
  const a = isoToSaoPauloYMD(startISO);
  const b = isoToSaoPauloYMD(endISO);
  return diffDaysYMD(a, b);
}

export function todayInSaoPauloYMD(): string {
  const now = new Date();
  const { y, m, d } = formatInSaoPauloComponents(now);
  const mm = String(m).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  return `${y}-${mm}-${dd}`;
}

export function toYMD({ y, m, d }: { y: number; m: number; d: number }): string {
  const mm = String(m).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  return `${y}-${mm}-${dd}`;
}

export function parseYMD(ymd: string): { y: number; m: number; d: number } {
  const [ys, ms, ds] = ymd.split('-');
  return { y: Number(ys), m: Number(ms), d: Number(ds) };
}

// Add days to a date represented by YMD (date-only arithmetic)
export function addDaysYMD(ymd: string, days: number): string {
  const { y, m, d } = parseYMD(ymd);
  // Use UTC date to avoid client timezone effects
  const base = new Date(Date.UTC(y, m - 1, d));
  base.setUTCDate(base.getUTCDate() + days);
  const y2 = base.getUTCFullYear();
  const m2 = base.getUTCMonth() + 1;
  const d2 = base.getUTCDate();
  return toYMD({ y: y2, m: m2, d: d2 });
}

// Difference in days between two YMD strings: end - start
export function diffDaysYMD(startYMD: string, endYMD: string): number {
  const a = parseYMD(startYMD);
  const b = parseYMD(endYMD);
  const da = Date.UTC(a.y, a.m - 1, a.d);
  const db = Date.UTC(b.y, b.m - 1, b.d);
  return Math.floor((db - da) / (1000 * 60 * 60 * 24));
}

// --- DateTime helpers with São Paulo timezone offset ---

function formatOffsetFor(date: Date): string {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: SAO_PAULO_TZ,
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    timeZoneName: 'shortOffset', hour12: false,
  });
  const parts = fmt.formatToParts(date);
  // timeZoneName like 'GMT-3' or 'UTC-3'
  const tzName = parts.find(p => p.type === 'timeZoneName')?.value || 'GMT-3';
  const match = tzName.match(/([+-])(\d+)/);
  const sign = match?.[1] || '-';
  const hours = match ? match[2].padStart(2, '0') : '03';
  return `${sign}${hours}:00`;
}

export function nowInSaoPauloISO(): string {
  const now = new Date();
  const { y, m, d } = formatInSaoPauloComponents(now);
  const timeFmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: SAO_PAULO_TZ,
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
  const timeParts = timeFmt.formatToParts(now);
  const HH = timeParts.find(p => p.type === 'hour')?.value?.padStart(2, '0') || '00';
  const MM = timeParts.find(p => p.type === 'minute')?.value?.padStart(2, '0') || '00';
  const SS = timeParts.find(p => p.type === 'second')?.value?.padStart(2, '0') || '00';
  const offset = formatOffsetFor(now);
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T${HH}:${MM}:${SS}${offset}`;
}

export function addDaysPreserveTimeISO(isoWithOffset: string, days: number): string {
  // Parse ISO including its offset to get the exact instant
  const baseUtcMs = Date.parse(isoWithOffset);
  if (Number.isNaN(baseUtcMs)) return isoWithOffset;
  const target = new Date(baseUtcMs + days * 24 * 60 * 60 * 1000);
  const { y: ty, m: tm, d: td } = formatInSaoPauloComponents(target);
  const timeFmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: SAO_PAULO_TZ,
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
  const parts = timeFmt.formatToParts(target);
  const HH = parts.find(p => p.type === 'hour')?.value?.padStart(2, '0') || '00';
  const MM = parts.find(p => p.type === 'minute')?.value?.padStart(2, '0') || '00';
  const SS = parts.find(p => p.type === 'second')?.value?.padStart(2, '0') || '00';
  const offset = formatOffsetFor(target);
  return `${ty}-${String(tm).padStart(2, '0')}-${String(td).padStart(2, '0')}T${HH}:${MM}:${SS}${offset}`;
}
