import { describe, it, expect } from 'vitest';
import { parseSwapPrefs, vehicleMatchesPrefs, emptySwapPrefs, type SwapPrefs, type SwapVehicleShape } from './swap';

const vehiculo: SwapVehicleShape = {
  brand: 'Mazda',
  model: 'CX-5 Grand Touring',
  year: 2020,
  mileage: 50_000,
  condition: 'used',
  fuel: 'gasoline',
  transmission: 'automatic',
  bodyType: 'suv',
  city: 'Bogotá',
  price: 80_000_000,
};

describe('vehicleMatchesPrefs', () => {
  it.each([[null], [undefined]])('acepta cualquier vehículo si las preferencias son %s', (prefs) => {
    expect(vehicleMatchesPrefs(vehiculo, prefs)).toBe(true);
  });

  it('acepta cualquier vehículo si any es true, aunque haya otros filtros que no cumple', () => {
    expect(vehicleMatchesPrefs(vehiculo, { any: true, brand: 'Toyota' })).toBe(true);
  });

  it('compara la marca de forma exacta', () => {
    expect(vehicleMatchesPrefs(vehiculo, { any: false, brand: 'Mazda' })).toBe(true);
    expect(vehicleMatchesPrefs(vehiculo, { any: false, brand: 'Toyota' })).toBe(false);
  });

  it('busca el modelo por coincidencia parcial sin importar mayúsculas', () => {
    expect(vehicleMatchesPrefs(vehiculo, { any: false, model: 'cx-5' })).toBe(true);
    expect(vehicleMatchesPrefs(vehiculo, { any: false, model: 'mazda3' })).toBe(false);
  });

  it.each([
    { caso: 'año mínimo igual al del vehículo (borde)', prefs: { any: false, yearMin: 2020 }, esperado: true },
    { caso: 'año mínimo mayor al del vehículo', prefs: { any: false, yearMin: 2021 }, esperado: false },
    { caso: 'año máximo igual al del vehículo (borde)', prefs: { any: false, yearMax: 2020 }, esperado: true },
    { caso: 'año máximo menor al del vehículo', prefs: { any: false, yearMax: 2019 }, esperado: false },
  ])('año: $caso', ({ prefs, esperado }) => {
    expect(vehicleMatchesPrefs(vehiculo, prefs)).toBe(esperado);
  });

  it.each([
    { caso: 'kilometraje máximo igual al del vehículo (borde)', prefs: { any: false, mileageMax: 50_000 }, esperado: true },
    { caso: 'kilometraje máximo un km por debajo', prefs: { any: false, mileageMax: 49_999 }, esperado: false },
  ])('kilometraje: $caso', ({ prefs, esperado }) => {
    expect(vehicleMatchesPrefs(vehiculo, prefs)).toBe(esperado);
  });

  it.each([
    { caso: 'precio mínimo igual al del vehículo (borde)', prefs: { any: false, priceMin: 80_000_000 }, esperado: true },
    { caso: 'precio mínimo un peso por encima', prefs: { any: false, priceMin: 80_000_001 }, esperado: false },
    { caso: 'precio máximo igual al del vehículo (borde)', prefs: { any: false, priceMax: 80_000_000 }, esperado: true },
    { caso: 'precio máximo un peso por debajo', prefs: { any: false, priceMax: 79_999_999 }, esperado: false },
  ])('precio: $caso', ({ prefs, esperado }) => {
    expect(vehicleMatchesPrefs(vehiculo, prefs)).toBe(esperado);
  });

  it.each([
    { campo: 'condition', valorOk: 'used', valorMal: 'new' },
    { campo: 'fuel', valorOk: 'gasoline', valorMal: 'diesel' },
    { campo: 'transmission', valorOk: 'automatic', valorMal: 'manual' },
    { campo: 'bodyType', valorOk: 'suv', valorMal: 'sedan' },
  ])('compara $campo de forma exacta', ({ campo, valorOk, valorMal }) => {
    expect(vehicleMatchesPrefs(vehiculo, { any: false, [campo]: valorOk } as SwapPrefs)).toBe(true);
    expect(vehicleMatchesPrefs(vehiculo, { any: false, [campo]: valorMal } as SwapPrefs)).toBe(false);
  });

  it('exige que se cumplan todos los filtros a la vez', () => {
    expect(vehicleMatchesPrefs(vehiculo, { any: false, brand: 'Mazda', city: 'Bogotá' })).toBe(true);
    expect(vehicleMatchesPrefs(vehiculo, { any: false, brand: 'Mazda', city: 'Medellín' })).toBe(false);
  });

  it('trata el 0 como un límite válido y no como "sin filtro"', () => {
    expect(vehicleMatchesPrefs(vehiculo, { any: false, priceMax: 0 })).toBe(false);
  });
});

describe('parseSwapPrefs', () => {
  it.each([[null], [undefined], ['']])('devuelve el valor por defecto si el texto es %s', (raw) => {
    expect(parseSwapPrefs(raw)).toEqual({ any: true });
    expect(parseSwapPrefs(raw, false)).toEqual({ any: false });
  });

  it('conserva los campos de un JSON válido', () => {
    expect(parseSwapPrefs('{"any":false,"brand":"Mazda"}')).toEqual({ any: false, brand: 'Mazda' });
  });

  it('deja any en false si el JSON no lo trae, aunque swapAny sea true', () => {
    expect(parseSwapPrefs('{"brand":"Mazda"}', true)).toEqual({ brand: 'Mazda', any: false });
  });

  it('devuelve el valor por defecto si el JSON es inválido', () => {
    expect(parseSwapPrefs('{no es json')).toEqual({ any: true });
    expect(parseSwapPrefs('{no es json', false)).toEqual({ any: false });
  });

  it('devuelve el valor por defecto si el JSON no es un objeto', () => {
    expect(parseSwapPrefs('null', false)).toEqual({ any: false });
    expect(parseSwapPrefs('123', false)).toEqual({ any: false });
  });
});

describe('emptySwapPrefs', () => {
  it('crea preferencias abiertas que aceptan cualquier vehículo', () => {
    const prefs = emptySwapPrefs();
    expect(prefs).toEqual({ any: true });
    expect(vehicleMatchesPrefs(vehiculo, prefs)).toBe(true);
  });
});