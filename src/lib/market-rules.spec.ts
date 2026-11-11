import { describe, it, expect } from 'vitest';
import {
  minOfferAmount,
  validateBuyOfferAmount,
  canFreeReactivate,
  FREE_REACTIVATIONS,
} from './market-rules';

describe('minOfferAmount', () => {
  it('null o % inválido → null', () => {
    expect(minOfferAmount(100_000, null)).toBeNull();
    expect(minOfferAmount(100_000, 0)).toBeNull();
    expect(minOfferAmount(100_000, -5)).toBeNull();
  });

  it('calcula techo del % (borde 80%)', () => {
    expect(minOfferAmount(100_000, 80)).toBe(80_000);
    expect(minOfferAmount(100_001, 80)).toBe(80_001); // ceil
  });
});

describe('validateBuyOfferAmount', () => {
  const price = 80_000_000;

  it.each([[null], [undefined], [0], [-1]])('rechaza monto inválido %s', (amount) => {
    expect(validateBuyOfferAmount({ amount, price })).toMatch(/monto válido/i);
  });

  it('rechaza oferta mayor al precio (borde: price+1)', () => {
    expect(validateBuyOfferAmount({ amount: price + 1, price })).toMatch(/mayor al precio/i);
  });

  it('acepta el precio exacto', () => {
    expect(validateBuyOfferAmount({ amount: price, price })).toBeNull();
  });

  it('sin ofertas menores: rechaza amount < price', () => {
    expect(
      validateBuyOfferAmount({ amount: price - 1, price, acceptLowerOffers: false }),
    ).toMatch(/solo acepta el precio/i);
  });

  it('con min %: rechaza por debajo del piso (borde floor-1)', () => {
    const floor = minOfferAmount(price, 90)!;
    expect(
      validateBuyOfferAmount({
        amount: floor - 1,
        price,
        acceptLowerOffers: true,
        minOfferPercent: 90,
      }),
    ).toMatch(/oferta mínima/i);
  });

  it('con min %: acepta el piso exacto', () => {
    const floor = minOfferAmount(price, 90)!;
    expect(
      validateBuyOfferAmount({
        amount: floor,
        price,
        acceptLowerOffers: true,
        minOfferPercent: 90,
      }),
    ).toBeNull();
  });
});

describe('canFreeReactivate', () => {
  it('true si aún no usó el cupo gratis', () => {
    expect(canFreeReactivate(0)).toBe(true);
  });

  it('false en el borde FREE_REACTIVATIONS', () => {
    expect(canFreeReactivate(FREE_REACTIVATIONS)).toBe(false);
  });
});