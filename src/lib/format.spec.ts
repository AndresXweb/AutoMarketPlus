import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  formatCop,
  formatKm,
  formatDate,
  isExpired,
  isExpiringSoon,
  digitsPhone,
  whatsappHref,
  mailtoHref,
} from './format';

describe('formatCop', () => {
  it('formatea en pesos colombianos sin decimales', () => {
    const out = formatCop(80_000_000);
    expect(out).toMatch(/80/);
    expect(out).toMatch(/000/);
  });

  it('trata 0 como valor válido', () => {
    expect(formatCop(0)).toMatch(/0/);
  });
});

describe('formatKm', () => {
  it('agrega el sufijo km', () => {
    expect(formatKm(50_000)).toMatch(/km$/);
    expect(formatKm(50_000)).toMatch(/50/);
  });
});

describe('formatDate', () => {
  it.each([[null], [undefined], ['']])('devuelve "Sin registrar" si el valor es %s', (v) => {
    expect(formatDate(v)).toBe('Sin registrar');
  });

  it('formatea una fecha válida en es-CO', () => {
    const out = formatDate('2020-01-15');
    expect(out).not.toBe('Sin registrar');
    expect(out).toMatch(/2020/);
  });

  it('devuelve el texto original si no es una fecha válida', () => {
    expect(formatDate('no-es-fecha')).toBe('no-es-fecha');
  });
});

describe('isExpired / isExpiringSoon', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([[null], [undefined], ['']])('isExpired es false si el valor es %s', (v) => {
    expect(isExpired(v)).toBe(false);
  });

  it('isExpired: fecha pasada es true (borde: ayer)', () => {
    expect(isExpired('2026-06-14')).toBe(true);
  });

  it('isExpired: hoy no está vencido', () => {
    expect(isExpired('2026-06-15')).toBe(false);
  });

  it('isExpired: fecha futura es false', () => {
    expect(isExpired('2026-06-16')).toBe(false);
  });

  it('isExpiringSoon: null/undefined/vacío es false', () => {
    expect(isExpiringSoon(null)).toBe(false);
    expect(isExpiringSoon(undefined)).toBe(false);
  });

  it('isExpiringSoon: ya vencido no cuenta como "pronto"', () => {
    expect(isExpiringSoon('2026-06-14')).toBe(false);
  });

  it('isExpiringSoon: dentro de la ventana (borde: exactamente en el límite de 30 días)', () => {
    expect(isExpiringSoon('2026-07-15', 30)).toBe(true);
  });

  it('isExpiringSoon: un día después del límite no está "pronto"', () => {
    expect(isExpiringSoon('2026-07-16', 30)).toBe(false);
  });
});

describe('digitsPhone', () => {
  it('devuelve vacío si no hay dígitos', () => {
    expect(digitsPhone('')).toBe('');
    expect(digitsPhone('abc')).toBe('');
  });

  it('antepone 57 si el número no lo trae', () => {
    expect(digitsPhone('3001234567')).toBe('573001234567');
  });

  it('no duplica el 57 si ya empieza con 57', () => {
    expect(digitsPhone('573001234567')).toBe('573001234567');
  });

  it('elimina caracteres no numéricos', () => {
    expect(digitsPhone('+57 300 123 4567')).toBe('573001234567');
  });
});

describe('whatsappHref', () => {
  it('devuelve vacío si el teléfono no tiene dígitos', () => {
    expect(whatsappHref('xxx', 'hola')).toBe('');
  });

  it('arma el enlace wa.me con mensaje codificado', () => {
    const href = whatsappHref('3001234567', 'Hola mundo');
    expect(href).toMatch(/^https:\/\/wa\.me\/573001234567\?text=/);
    expect(href).toContain(encodeURIComponent('Hola mundo'));
  });
});

describe('mailtoHref', () => {
  it('arma mailto con subject y body codificados', () => {
    const href = mailtoHref('a@b.com', 'Asunto', 'Cuerpo con espacios');
    expect(href).toBe(
      `mailto:a@b.com?subject=${encodeURIComponent('Asunto')}&body=${encodeURIComponent('Cuerpo con espacios')}`,
    );
  });
});