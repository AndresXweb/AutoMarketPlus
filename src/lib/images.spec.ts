import { describe, it, expect } from 'vitest';
import { isValidDataImage, parseImageList } from './images';

describe('isValidDataImage', () => {
  it('rechaza valores que no son string data:image', () => {
    expect(isValidDataImage('')).toBe(false);
    expect(isValidDataImage('https://ejemplo.com/x.jpg')).toBe(false);
    expect(isValidDataImage('data:text/plain,hola')).toBe(false);
  });

  it('exige longitud mínima (borde: minLen por defecto 500)', () => {
    const corto = 'data:image/jpeg;base64,' + 'a'.repeat(10);
    expect(isValidDataImage(corto)).toBe(false);

    const ok = 'data:image/jpeg;base64,' + 'a'.repeat(500);
    expect(isValidDataImage(ok)).toBe(true);
  });

  it('respeta un minLen personalizado (borde exacto)', () => {
    const s = 'data:image/png;base64,xxxx'; // length corta
    expect(isValidDataImage(s, s.length)).toBe(true);
    expect(isValidDataImage(s, s.length + 1)).toBe(false);
  });
});

describe('parseImageList', () => {
  it.each([[null], [undefined], ['']])('sin raw válido usa fallback o lista vacía (%s)', (raw) => {
    expect(parseImageList(raw)).toEqual([]);
    expect(parseImageList(raw, 'https://cdn/img.jpg')).toEqual(['https://cdn/img.jpg']);
  });

  it('parsea un JSON array de strings', () => {
    expect(parseImageList('["a.jpg","b.jpg"]')).toEqual(['a.jpg', 'b.jpg']);
  });

  it('filtra no-strings y vacíos y limita a 6', () => {
    const raw = JSON.stringify(['1', '', 2, '3', '4', '5', '6', '7', '8']);
    expect(parseImageList(raw)).toEqual(['1', '3', '4', '5', '6', '7']);
  });

  it('JSON inválido o no-array → fallback', () => {
    expect(parseImageList('{no json', 'fb.jpg')).toEqual(['fb.jpg']);
    expect(parseImageList('"solo-string"')).toEqual([]);
    expect(parseImageList('123')).toEqual([]);
  });

  it('array vacío de strings útiles → fallback', () => {
    expect(parseImageList('[""]', 'fb.jpg')).toEqual(['fb.jpg']);
  });
});