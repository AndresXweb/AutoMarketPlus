/**
 * Lógica de negocio para rutas /api/* (Flutter).
 * No usa authMiddleware ni assertSameSiteRequest.
 * Duplica lo esencial de market.ts con userId explícito.
 */
import { getSql } from "@/lib/db";
import { parseImageList } from "@/lib/images";
import { parseSwapPrefs, type SwapPrefs } from "@/lib/swap";

// ── Types mínimos (alineados con market.ts) ───────────────────────────────

type ProfileRow = {
  user_id: string;
  display_name: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  city: string | null;
  address: string | null;
  document_type: string | null;
  document_number: string | null;
  role: string;
  verification_status: string;
  account_status: string;
  id_front_url: string | null;
  id_back_url: string | null;
  verification_note: string | null;
  created_at: string;
  verified_at: string | null;
};

type VehicleRow = {
  id: number;
  user_id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  price: number;
  condition: string;
  fuel: string;
  transmission: string;
  body_type: string;
  city: string;
  description: string;
  image_url: string;
  images?: string | null;
  listing_type: string;
  status: string;
  created_at: string;
  last_activity_at?: string | null;
  paused_reason?: string | null;
  free_reactivations_used?: number | null;
  reactivation_requested_at?: string | null;
  show_whatsapp?: boolean | number | null;
  accept_lower_offers?: boolean | number | null;
  min_offer_percent?: number | null;
  active_offers_count?: number | null;
  seller_name?: string | null;
  seller_verified?: boolean | number | null;
  seller_phone?: string | null;
  seller_whatsapp?: string | null;
  seller_email?: string | null;
  soat_expires?: string | null;
  tecno_expires?: string | null;
  taxes_current?: boolean | number | null;
  taxes_detail?: string | null;
  taxes_amount?: number | null;
  fines_current?: boolean | number | null;
  fines_detail?: string | null;
  fines_amount?: number | null;
  swap_any?: boolean | number | null;
  swap_prefs?: string | null;
};

const PROFILE_COLS = `
  user_id, display_name, first_name, last_name, email, phone, whatsapp, city, address,
  document_type, document_number, role, verification_status, account_status,
  id_front_url, id_back_url, verification_note, created_at, verified_at
`;

const VEHICLE_SELECT = `
  v.*, p.display_name as seller_name,
  (p.verification_status = 'verificado') as seller_verified,
  p.phone as seller_phone, coalesce(p.whatsapp, p.phone) as seller_whatsapp,
  p.email as seller_email
`;

const OFFER_SELECT = `
  o.*, v.title as vehicle_title, v.image_url as vehicle_image, v.user_id as vehicle_owner_id,
  v.swap_any, v.swap_prefs, s.title as swap_title,
  p.display_name as buyer_name,
  p.phone as buyer_phone, coalesce(p.whatsapp, p.phone) as buyer_whatsapp, p.email as buyer_email,
  own.display_name as seller_name,
  own.phone as seller_phone, coalesce(own.whatsapp, own.phone) as seller_whatsapp, own.email as seller_email
`;

const FREE_REACTIVATIONS = 1;
const LISTING_ACTIVE_DAYS = 30;

function asBool(v: boolean | number | null | undefined, fallback = false) {
  if (v == null) return fallback;
  return Boolean(v);
}

function mapProfile(r: ProfileRow) {
  return {
    userId: r.user_id,
    displayName: r.display_name,
    firstName: r.first_name,
    lastName: r.last_name,
    email: r.email,
    phone: r.phone,
    whatsapp: r.whatsapp,
    city: r.city,
    address: r.address,
    documentType: r.document_type,
    documentNumber: r.document_number,
    role: r.role,
    verificationStatus: r.verification_status,
    accountStatus: r.account_status,
    idFrontUrl: r.id_front_url,
    idBackUrl: r.id_back_url,
    verificationNote: r.verification_note,
    createdAt: String(r.created_at),
    verifiedAt: r.verified_at ? String(r.verified_at) : null,
  };
}

function mapVehicle(row: VehicleRow, favoriteIds?: Set<number>) {
  const images = parseImageList(row.images, row.image_url);
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    brand: row.brand,
    model: row.model,
    year: Number(row.year),
    mileage: Number(row.mileage),
    price: Number(row.price),
    condition: row.condition,
    fuel: row.fuel,
    transmission: row.transmission,
    bodyType: row.body_type,
    city: row.city,
    description: row.description,
    imageUrl: images[0] ?? row.image_url,
    images,
    listingType: row.listing_type,
    status: row.status,
    createdAt: String(row.created_at),
    lastActivityAt: row.last_activity_at ? String(row.last_activity_at) : null,
    pausedReason: row.paused_reason ?? null,
    freeReactivationsUsed: Number(row.free_reactivations_used ?? 0),
    reactivationRequestedAt: row.reactivation_requested_at
      ? String(row.reactivation_requested_at)
      : null,
    showWhatsapp: asBool(row.show_whatsapp, true),
    acceptLowerOffers: asBool(row.accept_lower_offers, true),
    minOfferPercent:
      row.min_offer_percent == null ? null : Number(row.min_offer_percent),
    activeOffersCount:
      row.active_offers_count == null
        ? undefined
        : Number(row.active_offers_count),
    sellerName: row.seller_name ?? null,
    sellerVerified: asBool(row.seller_verified),
    sellerPhone: row.seller_phone ?? null,
    sellerWhatsapp: asBool(row.show_whatsapp, true)
      ? (row.seller_whatsapp ?? row.seller_phone ?? null)
      : null,
    sellerEmail: row.seller_email ?? null,
    isFavorite: favoriteIds ? favoriteIds.has(row.id) : false,
    soatExpires: row.soat_expires ?? null,
    tecnoExpires: row.tecno_expires ?? null,
    taxesCurrent: asBool(row.taxes_current, true),
    taxesDetail: row.taxes_detail ?? null,
    taxesAmount: Number(row.taxes_amount ?? 0),
    finesCurrent: asBool(row.fines_current, true),
    finesDetail: row.fines_detail ?? null,
    finesAmount: Number(row.fines_amount ?? 0),
    swapAny: asBool(row.swap_any, true),
    swapPrefs: parseSwapPrefs(row.swap_prefs, asBool(row.swap_any, true)),
  };
}

function mapOffer(row: Record<string, unknown>, viewerId?: string) {
  const status = String(row.status);
  const buyerId = String(row.buyer_id);
  const base: Record<string, unknown> = {
    id: Number(row.id),
    vehicleId: Number(row.vehicle_id),
    buyerId,
    offerType: row.offer_type,
    amount: row.amount == null ? null : Number(row.amount),
    swapVehicleId: row.swap_vehicle_id ?? null,
    message: row.message ?? null,
    status,
    createdAt: String(row.created_at),
    lastActorId: row.last_actor_id ?? null,
    counterCount: Number(row.counter_count ?? 0),
    acceptedAt: row.accepted_at ? String(row.accepted_at) : null,
    acceptedBy: row.accepted_by ?? null,
    finalAmount: row.final_amount == null ? null : Number(row.final_amount),
    vehicleTitle: row.vehicle_title,
    vehicleImage: row.vehicle_image,
    vehicleOwnerId: row.vehicle_owner_id,
    swapTitle: row.swap_title ?? null,
    buyerName: row.buyer_name ?? null,
    sellerName: row.seller_name ?? null,
  };
  if (viewerId && status === "aceptada") {
    const isBuyer = buyerId === viewerId;
    if (isBuyer) {
      base.counterpartName = row.seller_name ?? "Vendedor";
      base.counterpartPhone = row.seller_phone ?? null;
      base.counterpartWhatsapp = row.seller_whatsapp ?? null;
      base.counterpartEmail = row.seller_email ?? null;
    } else {
      base.counterpartName = row.buyer_name ?? "Comprador";
      base.counterpartPhone = row.buyer_phone ?? null;
      base.counterpartWhatsapp = row.buyer_whatsapp ?? null;
      base.counterpartEmail = row.buyer_email ?? null;
    }
  }
  return base;
}

async function pauseInactive(sql: Awaited<ReturnType<typeof getSql>>) {
  try {
    await sql`
      update vehicles
      set status = 'pausado', paused_reason = 'inactividad'
      where status = 'activo'
        and last_activity_at is not null
        and last_activity_at < now() - (${LISTING_ACTIVE_DAYS} * interval '1 day')
    `;
  } catch {
    /* migración 0004 opcional */
  }
}

async function ensureProfile(userId: string) {
  const sql = await getSql();
  const existing = await sql<{ user_id: string }>`
    select user_id from profiles where user_id = ${userId}
  `;
  if (existing.length) return;
  const admins = await sql<{ c: number }>`
    select count(*)::int as c from profiles
    where role = 'admin' and user_id not like 'seed-%' and user_id not like 'catalog-%'
  `;
  const role = (admins[0]?.c ?? 0) === 0 ? "admin" : "cliente";
  const verification = role === "admin" ? "verificado" : "sin_verificar";
  await sql`
    insert into profiles (user_id, display_name, role, verification_status, account_status, verified_at)
    values (
      ${userId}, 'Usuario', ${role}, ${verification}, 'activo',
      ${role === "admin" ? new Date().toISOString() : null}
    )
  `;
}

async function requireActive(userId: string) {
  await ensureProfile(userId);
  const sql = await getSql();
  const rows = await sql<{ account_status: string }>`
    select account_status from profiles where user_id = ${userId}
  `;
  if (rows[0]?.account_status === "deshabilitado") {
    throw new Error(
      "Tu cuenta está deshabilitada. Escribe a soporte desde Contacto.",
    );
  }
}

async function requireEmailVerified(userId: string) {
  const sql = await getSql();
  const rows = await sql<{ verified: boolean | number | null }>`
    select "emailVerified" as verified from "user" where id = ${userId}
  `;
  if (!rows[0] || !rows[0].verified) {
    throw new Error(
      "Confirma tu correo antes de publicar u ofertar. Revisa tu bandeja o spam.",
    );
  }
}

// ── Perfil ────────────────────────────────────────────────────────────────

export async function svcGetProfile(userId: string) {
  await ensureProfile(userId);
  const sql = await getSql();
  const result = await sql.query<ProfileRow>(
    `select ${PROFILE_COLS} from profiles where user_id = $1`,
    [userId],
  );
  return result[0] ? mapProfile(result[0]) : null;
}

export async function svcUpdateProfile(
  userId: string,
  data: {
    firstName: string;
    lastName: string;
    phone: string;
    whatsapp?: string;
    city: string;
    address?: string;
    email?: string;
    documentType?: string;
    documentNumber?: string;
  },
) {
  await requireActive(userId);
  const displayName = `${data.firstName} ${data.lastName}`.trim();
  const sql = await getSql();
  await sql`
    update profiles
    set display_name = ${displayName},
        first_name = ${data.firstName},
        last_name = ${data.lastName},
        phone = ${data.phone},
        whatsapp = ${data.whatsapp || data.phone},
        city = ${data.city},
        address = ${data.address ?? null},
        email = ${data.email ?? null},
        document_type = ${data.documentType ?? null},
        document_number = ${data.documentNumber ?? null}
    where user_id = ${userId}
  `;
  return { ok: true };
}

export async function svcSubmitVerification(
  userId: string,
  data: {
    idFrontUrl: string;
    idBackUrl: string;
    documentType: string;
    documentNumber: string;
  },
) {
  await requireActive(userId);
  const isDataImage = (s: string) =>
    s.startsWith("data:image/") && s.length >= 500 && s.length <= 2_500_000;
  if (!isDataImage(data.idFrontUrl) || !isDataImage(data.idBackUrl)) {
    throw new Error(
      "Las fotos de la cédula no son válidas. Vuelve a subir frente y reverso.",
    );
  }
  const sql = await getSql();
  const current = await sql<{ verification_status: string }>`
    select verification_status from profiles where user_id = ${userId}
  `;
  if (current[0]?.verification_status === "verificado") {
    throw new Error("Tu cuenta ya está verificada.");
  }
  await sql`
    update profiles
    set id_front_url = ${data.idFrontUrl},
        id_back_url = ${data.idBackUrl},
        document_type = ${data.documentType},
        document_number = ${data.documentNumber},
        verification_status = 'pendiente',
        verification_note = null
    where user_id = ${userId}
  `;
  return { ok: true };
}

// ── Mis vehículos ─────────────────────────────────────────────────────────

export async function svcListMyVehicles(userId: string) {
  await ensureProfile(userId);
  const sql = await getSql();
  await pauseInactive(sql);
  const rows = await sql.query<VehicleRow>(
    `select ${VEHICLE_SELECT},
      (select count(*)::int from offers o
       where o.vehicle_id = v.id and o.status in ('pendiente','contraoferta')) as active_offers_count
     from vehicles v
     left join profiles p on p.user_id = v.user_id
     where v.user_id = $1
     order by v.created_at desc`,
    [userId],
  );
  return rows.map((r) => mapVehicle(r));
}

export async function svcCreateVehicle(
  userId: string,
  data: {
    title: string;
    brand: string;
    model: string;
    year: number;
    mileage: number;
    price: number;
    condition: string;
    fuel: string;
    transmission: string;
    bodyType: string;
    city: string;
    description: string;
    images: string[];
    listingType: string;
    soatExpires?: string | null;
    tecnoExpires?: string | null;
    taxesCurrent?: boolean;
    taxesDetail?: string | null;
    taxesAmount?: number;
    finesCurrent?: boolean;
    finesDetail?: string | null;
    finesAmount?: number;
    swapPrefs?: SwapPrefs;
    showWhatsapp?: boolean;
    acceptLowerOffers?: boolean;
    minOfferPercent?: number | null;
  },
) {
  await requireActive(userId);
  await requireEmailVerified(userId);
  const sql = await getSql();
  const profile = await sql<{ role: string; verification_status: string }>`
    select role, verification_status from profiles where user_id = ${userId}
  `;
  const verified =
    profile[0]?.role === "admin" ||
    profile[0]?.verification_status === "verificado";
  const status = verified ? "activo" : "pendiente_revision";
  const images = (data.images ?? []).slice(0, 6);
  if (!images.length) throw new Error("Sube al menos una foto.");
  const prefs =
    data.listingType === "venta" ? { any: true } : (data.swapPrefs ?? { any: true });
  const showWhatsapp = data.showWhatsapp !== false;
  const acceptLower = data.acceptLowerOffers !== false;
  const minPercent =
    acceptLower && data.minOfferPercent != null && data.minOfferPercent > 0
      ? data.minOfferPercent
      : null;
  const taxesCurrent = data.taxesCurrent !== false;
  const finesCurrent = data.finesCurrent !== false;
  const rows = await sql<{ id: number }>`
    insert into vehicles (
      user_id, title, brand, model, year, mileage, price, condition, fuel,
      transmission, body_type, city, description, image_url, images, listing_type, status,
      soat_expires, tecno_expires, taxes_current, taxes_detail, taxes_amount,
      fines_current, fines_detail, fines_amount, swap_any, swap_prefs,
      last_activity_at, show_whatsapp, accept_lower_offers, min_offer_percent,
      free_reactivations_used
    ) values (
      ${userId}, ${data.title}, ${data.brand}, ${data.model}, ${data.year},
      ${data.mileage}, ${data.price}, ${data.condition}, ${data.fuel},
      ${data.transmission}, ${data.bodyType}, ${data.city}, ${data.description},
      ${images[0]}, ${JSON.stringify(images)}, ${data.listingType}, ${status},
      ${data.soatExpires || null}, ${data.tecnoExpires || null},
      ${taxesCurrent}, ${taxesCurrent ? null : data.taxesDetail ?? null},
      ${taxesCurrent ? 0 : data.taxesAmount ?? 0},
      ${finesCurrent}, ${finesCurrent ? null : data.finesDetail ?? null},
      ${finesCurrent ? 0 : data.finesAmount ?? 0},
      ${Boolean(prefs.any)}, ${JSON.stringify(prefs)},
      now(), ${showWhatsapp}, ${acceptLower}, ${minPercent},
      0
    )
    returning id
  `;
  return { id: rows[0].id, status };
}

export async function svcUpdateVehicleStatus(
  userId: string,
  id: number,
  status: "activo" | "pausado" | "vendido",
) {
  await requireActive(userId);
  const sql = await getSql();
  const current = await sql<{
    status: string;
    paused_reason: string | null;
    free_reactivations_used: number | null;
  }>`
    select status, paused_reason, free_reactivations_used
    from vehicles where id = ${id} and user_id = ${userId}
  `;
  if (!current[0]) throw new Error("Anuncio no encontrado.");
  if (
    current[0].status === "pendiente_revision" ||
    current[0].status === "rechazado"
  ) {
    throw new Error("Este anuncio sigue en revisión del administrador.");
  }

  if (status === "activo" && current[0].status === "pausado") {
    const used = Number(current[0].free_reactivations_used ?? 0);
    if (current[0].paused_reason === "inactividad") {
      if (used < FREE_REACTIVATIONS) {
        await sql`
          update vehicles
          set status = 'activo', paused_reason = null, last_activity_at = now(),
              free_reactivations_used = ${used + 1}, reactivation_requested_at = null
          where id = ${id} and user_id = ${userId}
        `;
        return { ok: true, reactivated: true, free: true };
      }
      await sql`
        update vehicles set reactivation_requested_at = now()
        where id = ${id} and user_id = ${userId}
      `;
      return {
        ok: true,
        reactivated: false,
        requested: true,
        message: "Solicitud enviada. Un administrador extenderá tu anuncio.",
      };
    }
    await sql`
      update vehicles
      set status = 'activo', paused_reason = null, last_activity_at = now(),
          reactivation_requested_at = null
      where id = ${id} and user_id = ${userId}
    `;
    return { ok: true };
  }

  if (status === "pausado") {
    await sql`
      update vehicles set status = 'pausado', paused_reason = 'manual'
      where id = ${id} and user_id = ${userId}
    `;
    return { ok: true };
  }

  await sql`
    update vehicles set status = ${status}
    where id = ${id} and user_id = ${userId}
  `;
  return { ok: true };
}

export async function svcDeleteMyVehicle(userId: string, id: number) {
  await requireActive(userId);
  const sql = await getSql();
  await sql`delete from vehicles where id = ${id} and user_id = ${userId}`;
  return { ok: true };
}

// ── Favoritos ─────────────────────────────────────────────────────────────

export async function svcListFavorites(userId: string) {
  const sql = await getSql();
  const rows = await sql.query<VehicleRow>(
    `select ${VEHICLE_SELECT}
     from favorites f
     join vehicles v on v.id = f.vehicle_id
     left join profiles p on p.user_id = v.user_id
     where f.user_id = $1
     order by f.created_at desc`,
    [userId],
  );
  return rows.map((r) => mapVehicle(r, new Set(rows.map((x) => x.id))));
}

export async function svcToggleFavorite(userId: string, vehicleId: number) {
  await requireActive(userId);
  const sql = await getSql();
  const existing = await sql<{ vehicle_id: number }>`
    select vehicle_id from favorites
    where user_id = ${userId} and vehicle_id = ${vehicleId}
  `;
  if (existing.length) {
    await sql`
      delete from favorites
      where user_id = ${userId} and vehicle_id = ${vehicleId}
    `;
    return { favorite: false };
  }
  await sql`
    insert into favorites (user_id, vehicle_id)
    values (${userId}, ${vehicleId})
  `;
  return { favorite: true };
}

// ── Ofertas ───────────────────────────────────────────────────────────────

export async function svcListMyOffers(userId: string) {
  await ensureProfile(userId);
  const sql = await getSql();
  const sent = await sql.query<Record<string, unknown>>(
    `select ${OFFER_SELECT}
     from offers o
     join vehicles v on v.id = o.vehicle_id
     left join vehicles s on s.id = o.swap_vehicle_id
     left join profiles p on p.user_id = o.buyer_id
     left join profiles own on own.user_id = v.user_id
     where o.buyer_id = $1
     order by o.created_at desc`,
    [userId],
  );
  const received = await sql.query<Record<string, unknown>>(
    `select ${OFFER_SELECT}
     from offers o
     join vehicles v on v.id = o.vehicle_id
     left join vehicles s on s.id = o.swap_vehicle_id
     left join profiles p on p.user_id = o.buyer_id
     left join profiles own on own.user_id = v.user_id
     where v.user_id = $1
     order by o.created_at desc`,
    [userId],
  );
  return {
    sent: sent.map((r) => mapOffer(r, userId)),
    received: received.map((r) => mapOffer(r, userId)),
  };
}

export async function svcCreateOffer(
  userId: string,
  data: {
    vehicleId: number;
    offerType: "compra" | "permuta";
    amount?: number;
    swapVehicleId?: number;
    message?: string;
  },
) {
  await requireActive(userId);
  await requireEmailVerified(userId);
  const sql = await getSql();
  const vehicle = await sql<{
    user_id: string;
    listing_type: string;
    status: string;
    price: number;
    accept_lower_offers: boolean | number | null;
    min_offer_percent: number | null;
  }>`
    select user_id, listing_type, status, price, accept_lower_offers, min_offer_percent
    from vehicles where id = ${data.vehicleId}
  `;
  if (!vehicle[0] || vehicle[0].status !== "activo") {
    throw new Error("El anuncio no está disponible.");
  }
  if (vehicle[0].user_id === userId) {
    throw new Error("No puedes ofertar sobre tu propio anuncio.");
  }
  const listing = vehicle[0].listing_type;
  if (data.offerType === "compra" && listing === "permuta") {
    throw new Error("Este anuncio solo acepta permuta.");
  }
  if (data.offerType === "permuta" && listing === "venta") {
    throw new Error("Este anuncio solo está en venta.");
  }
  if (data.offerType === "compra") {
    const amount = data.amount;
    if (amount == null || amount <= 0) {
      throw new Error("Indica un monto válido para la oferta de compra.");
    }
    const price = Number(vehicle[0].price);
    if (amount > price) {
      throw new Error("La oferta no puede ser mayor al precio publicado.");
    }
    const acceptLower =
      vehicle[0].accept_lower_offers == null
        ? true
        : Boolean(vehicle[0].accept_lower_offers);
    if (!acceptLower && amount < price) {
      throw new Error(
        "El vendedor solo acepta el precio publicado (no ofertas menores).",
      );
    }
    const minPct = vehicle[0].min_offer_percent;
    if (acceptLower && minPct != null && minPct > 0) {
      const floor = Math.ceil((price * Number(minPct)) / 100);
      if (amount < floor) {
        throw new Error(
          `La oferta mínima permitida es ${floor.toLocaleString("es-CO")} COP (${minPct}% del precio).`,
        );
      }
    }
  }
  if (data.offerType === "permuta") {
    if (!data.swapVehicleId) {
      throw new Error("Elige un vehículo para permutar.");
    }
    const mine = await sql<{ id: number }>`
      select id from vehicles
      where id = ${data.swapVehicleId} and user_id = ${userId} and status = 'activo'
    `;
    if (!mine[0]) {
      throw new Error("El vehículo de permuta no es tuyo o no está activo.");
    }
  }
  const rows = await sql<{ id: number }>`
    insert into offers (vehicle_id, buyer_id, offer_type, amount, swap_vehicle_id, message, status, last_actor_id)
    values (
      ${data.vehicleId}, ${userId}, ${data.offerType},
      ${data.amount ?? null}, ${data.swapVehicleId ?? null}, ${data.message ?? null},
      'pendiente', ${userId}
    )
    returning id
  `;
  await sql`
    insert into offer_events (offer_id, actor_id, action, amount, swap_vehicle_id, message)
    values (
      ${rows[0].id}, ${userId}, 'oferta',
      ${data.amount ?? null}, ${data.swapVehicleId ?? null}, ${data.message ?? null}
    )
  `;
  await sql`
    update vehicles set last_activity_at = now()
    where id = ${data.vehicleId} and status = 'activo'
  `;
  return { id: rows[0].id };
}

export async function svcRespondOffer(
  userId: string,
  id: number,
  status: "aceptada" | "rechazada",
) {
  await requireActive(userId);
  await requireEmailVerified(userId);
  const sql = await getSql();
  const rows = await sql<{
    id: number;
    vehicle_id: number;
    buyer_id: string;
    last_actor_id: string | null;
    status: string;
    owner_id: string;
    amount: number | null;
    offer_type: string;
    vehicle_title: string | null;
  }>`
    select o.id, o.vehicle_id, o.buyer_id, o.last_actor_id, o.status, o.amount, o.offer_type,
           v.user_id as owner_id, v.title as vehicle_title
    from offers o
    join vehicles v on v.id = o.vehicle_id
    where o.id = ${id}
  `;
  const offer = rows[0];
  if (!offer) throw new Error("Oferta no encontrada.");
  if (!["pendiente", "contraoferta"].includes(offer.status)) {
    throw new Error("Esta oferta ya no está abierta.");
  }
  const isOwner = offer.owner_id === userId;
  const isBuyer = offer.buyer_id === userId;
  if (!isOwner && !isBuyer) throw new Error("No puedes responder esta oferta.");
  if (offer.last_actor_id === userId) {
    throw new Error("Espera la respuesta de la otra parte.");
  }

  if (status === "aceptada") {
    const finalAmount = offer.amount == null ? null : Number(offer.amount);
    const nowIso = new Date().toISOString();
    await sql`
      update offers
      set status = 'aceptada',
          accepted_at = ${nowIso},
          accepted_by = ${userId},
          final_amount = ${finalAmount}
      where id = ${id}
    `;
    await sql`
      insert into offer_events (offer_id, actor_id, action, amount)
      values (${id}, ${userId}, 'aceptada', ${finalAmount})
    `;
    await sql`
      update vehicles set status = 'vendido'
      where id = ${offer.vehicle_id} and user_id = ${offer.owner_id}
    `;
    await sql`
      update offers set status = 'cerrada'
      where vehicle_id = ${offer.vehicle_id} and id <> ${id}
        and status in ('pendiente','contraoferta')
    `;
    const names = await sql<{
      seller_name: string | null;
      buyer_name: string | null;
    }>`
      select
        (select display_name from profiles where user_id = ${offer.owner_id}) as seller_name,
        (select display_name from profiles where user_id = ${offer.buyer_id}) as buyer_name
    `;
    try {
      await sql`
        insert into deals (
          offer_id, vehicle_id, seller_id, buyer_id, seller_name, buyer_name,
          vehicle_title, offer_type, final_amount, accepted_at, accepted_by
        ) values (
          ${id}, ${offer.vehicle_id}, ${offer.owner_id}, ${offer.buyer_id},
          ${names[0]?.seller_name ?? null}, ${names[0]?.buyer_name ?? null},
          ${offer.vehicle_title ?? null}, ${offer.offer_type}, ${finalAmount},
          ${nowIso}, ${userId}
        )
      `;
    } catch {
      /* deals puede no existir si falta migración 0004 */
    }
  } else {
    await sql`update offers set status = ${status} where id = ${id}`;
    await sql`
      insert into offer_events (offer_id, actor_id, action)
      values (${id}, ${userId}, ${status})
    `;
  }
  return { ok: true };
}

export async function svcCounterOffer(
  userId: string,
  data: {
    id: number;
    amount?: number;
    swapVehicleId?: number;
    message: string;
  },
) {
  await requireActive(userId);
  await requireEmailVerified(userId);
  const sql = await getSql();
  const rows = await sql<{
    id: number;
    vehicle_id: number;
    buyer_id: string;
    last_actor_id: string | null;
    status: string;
    owner_id: string;
    offer_type: string;
    counter_count: number;
  }>`
    select o.id, o.vehicle_id, o.buyer_id, o.last_actor_id, o.status, v.user_id as owner_id,
           o.offer_type, o.counter_count
    from offers o
    join vehicles v on v.id = o.vehicle_id
    where o.id = ${data.id}
  `;
  const offer = rows[0];
  if (!offer) throw new Error("Oferta no encontrada.");
  if (!["pendiente", "contraoferta"].includes(offer.status)) {
    throw new Error("Esta oferta ya no está abierta.");
  }
  const isOwner = offer.owner_id === userId;
  const isBuyer = offer.buyer_id === userId;
  if (!isOwner && !isBuyer) throw new Error("No puedes contraofertar aquí.");
  if (offer.last_actor_id === userId) {
    throw new Error(
      "Espera la respuesta de la otra parte antes de contraofertar.",
    );
  }
  if (offer.offer_type === "compra" && data.amount == null) {
    throw new Error("Indica el nuevo monto de la contraoferta.");
  }
  if (offer.offer_type === "permuta" && isBuyer && data.swapVehicleId) {
    const mine = await sql<{ id: number }>`
      select id from vehicles
      where id = ${data.swapVehicleId} and user_id = ${userId} and status = 'activo'
    `;
    if (!mine[0]) {
      throw new Error("El vehículo de permuta no es tuyo o no está activo.");
    }
  }
  await sql`
    update offers
    set amount = ${data.amount ?? null},
        swap_vehicle_id = ${data.swapVehicleId ?? null},
        message = ${data.message},
        status = 'contraoferta',
        last_actor_id = ${userId},
        counter_count = ${Number(offer.counter_count) + 1}
    where id = ${data.id}
  `;
  await sql`
    insert into offer_events (offer_id, actor_id, action, amount, swap_vehicle_id, message)
    values (
      ${data.id}, ${userId}, 'contraoferta',
      ${data.amount ?? null}, ${data.swapVehicleId ?? null}, ${data.message}
    )
  `;
  return { ok: true };
}

// ── Contacto ──────────────────────────────────────────────────────────────

export async function svcSubmitContact(data: {
  name: string;
  email: string;
  phone: string;
  subject?: string;
  message: string;
  userId?: string | null;
}) {
  const sql = await getSql();
  await sql`
    insert into contacts (user_id, name, email, phone, subject, message)
    values (
      ${data.userId ?? null}, ${data.name}, ${data.email}, ${data.phone},
      ${data.subject ?? null}, ${data.message}
    )
  `;
  return { ok: true };
}
