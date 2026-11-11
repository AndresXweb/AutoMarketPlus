import { FREE_REACTIVATIONS, LISTING_ACTIVE_DAYS } from './market';

/** Monto mínimo de oferta según precio y % configurado por el vendedor. */
export function minOfferAmount(price: number, minOfferPercent: number | null | undefined): number | null {
  if (minOfferPercent == null || minOfferPercent <= 0) return null;
  return Math.ceil((price * Number(minOfferPercent)) / 100);
}

/**
 * Valida una oferta de compra contra las reglas del anuncio.
 * Devuelve null si es válida, o el mensaje de error.
 */
export function validateBuyOfferAmount(params: {
  amount: number | null | undefined;
  price: number;
  acceptLowerOffers?: boolean | null;
  minOfferPercent?: number | null;
}): string | null {
  const { amount, price } = params;
  if (amount == null || amount <= 0) {
    return 'Indica un monto válido para la oferta de compra.';
  }
  if (amount > price) {
    return 'La oferta no puede ser mayor al precio publicado.';
  }
  const acceptLower = params.acceptLowerOffers == null ? true : Boolean(params.acceptLowerOffers);
  if (!acceptLower && amount < price) {
    return 'El vendedor solo acepta el precio publicado (no ofertas menores).';
  }
  const floor = minOfferAmount(price, params.minOfferPercent);
  if (acceptLower && floor != null && amount < floor) {
    return `La oferta mínima permitida es ${floor.toLocaleString('es-CO')} COP (${params.minOfferPercent}% del precio).`;
  }
  return null;
}

/** ¿Puede reactivar gratis un anuncio pausado por inactividad? */
export function canFreeReactivate(freeReactivationsUsed: number): boolean {
  return freeReactivationsUsed < FREE_REACTIVATIONS;
}

export { LISTING_ACTIVE_DAYS, FREE_REACTIVATIONS };