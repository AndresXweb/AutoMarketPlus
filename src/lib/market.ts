import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { parseImageList } from "@/lib/images";
import { parseSwapPrefs, vehicleMatchesPrefs, type SwapPrefs } from "@/lib/swap";

export type { SwapPrefs };

export type Vehicle = {
  id: number;
  userId: string;
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
  imageUrl: string;
  images: string[];
  listingType: string;
  status: string;
  createdAt: string;
  lastActivityAt?: string | null;
  pausedReason?: string | null;
  freeReactivationsUsed?: number;
  reactivationRequestedAt?: string | null;
  showWhatsapp?: boolean;
  acceptLowerOffers?: boolean;
  minOfferPercent?: number | null;
  activeOffersCount?: number;
  sellerName?: string | null;
  sellerVerified?: boolean;
  sellerPhone?: string | null;
  sellerWhatsapp?: string | null;
  sellerEmail?: string | null;
  isFavorite?: boolean;
  soatExpires?: string | null;
  tecnoExpires?: string | null;
  taxesCurrent: boolean;
  taxesDetail?: string | null;
  taxesAmount: number;
  finesCurrent: boolean;
  finesDetail?: string | null;
  finesAmount: number;
  swapAny: boolean;
  swapPrefs: SwapPrefs;
};

export type Deal = {
  id: number;
  offerId: number;
  vehicleId: number;
  sellerId: string;
  buyerId: string;
  sellerName: string | null;
  buyerName: string | null;
  vehicleTitle: string | null;
  offerType: string;
  finalAmount: number | null;
  acceptedAt: string;
  acceptedBy: string;
};

export type OfferEvent = {
  id: number;
  offerId: number;
  actorId: string;
  actorName?: string | null;
  action: string;
  amount: number | null;
  swapVehicleId: number | null;
  message: string | null;
  createdAt: string;
};

export type Offer = {
  id: number;
  vehicleId: number;
  buyerId: string;
  offerType: string;
  amount: number | null;
  swapVehicleId: number | null;
  message: string | null;
  status: string;
  createdAt: string;
  lastActorId?: string | null;
  counterCount: number;
  acceptedAt?: string | null;
  acceptedBy?: string | null;
  finalAmount?: number | null;
  vehicleTitle?: string;
  vehicleImage?: string;
  vehicleOwnerId?: string;
  swapTitle?: string | null;
  buyerName?: string | null;
  sellerName?: string | null;
  /** Contacto de la otra parte (solo útil cuando la oferta está aceptada). */
  counterpartName?: string | null;
  counterpartPhone?: string | null;
  counterpartWhatsapp?: string | null;
  counterpartEmail?: string | null;
  matchesPrefs?: boolean | null;
  events?: OfferEvent[];
};

export type Profile = {
  userId: string;
  displayName: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  city: string | null;
  address: string | null;
  documentType: string | null;
  documentNumber: string | null;
  role: string;
  verificationStatus: string;
  accountStatus: string;
  idFrontUrl: string | null;
  idBackUrl: string | null;
  verificationNote: string | null;
  createdAt: string;
  verifiedAt: string | null;
};

export type ContactRow = {
  id: number;
  userId: string | null;
  name: string;
  email: string;
  phone: string;
  subject: string | null;
  message: string;
  createdAt: string;
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

function asBool(v: boolean | number | null | undefined, fallback = false) {
  if (v == null) return fallback;
  return Boolean(v);
}

function mapVehicle(row: VehicleRow, favoriteIds?: Set<number>): Vehicle {
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
      row.min_offer_percent == null || row.min_offer_percent === undefined
        ? null
        : Number(row.min_offer_percent),
    activeOffersCount:
      row.active_offers_count == null ? undefined : Number(row.active_offers_count),
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

/** Días de vigencia por defecto de un anuncio activo. */
export const LISTING_ACTIVE_DAYS = 30;

/** Máximo de reactivaciones gratuitas (después de la 1ª caducidad). */
export const FREE_REACTIVATIONS = 1;

async function pauseInactiveVehicles(sql: Awaited<ReturnType<typeof getSql>>) {
  try {
    await sql`
      update vehicles
      set status = 'pausado',
          paused_reason = 'inactividad'
      where status = 'activo'
        and last_activity_at is not null
        and last_activity_at < now() - (${LISTING_ACTIVE_DAYS} * interval '1 day')
    `;
  } catch (err) {
    // Si la migración 0004 aún no está en esta base, no tumbar toda la app
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("last_activity_at") || msg.includes("paused_reason")) {
      console.warn("[market] pauseInactiveVehicles omitido (migración 0004 pendiente):", msg);
      return;
    }
    throw err;
  }
}

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

function mapProfile(r: ProfileRow): Profile {
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

const PROFILE_COLS = `
  user_id, display_name, first_name, last_name, email, phone, whatsapp, city, address,
  document_type, document_number, role, verification_status, account_status,
  id_front_url, id_back_url, verification_note, created_at, verified_at
`;

async function ensureProfileRow(userId: string, name?: string, email?: string) {
  const sql = await getSql();
  const existing = await sql<{ user_id: string }>`
    select user_id from profiles where user_id = ${userId}
  `;
  if (existing.length) return;
  let display = name;
  let mail = email ?? null;
  if (!display || !mail) {
    try {
      const { getSessionUser } = await import("@/lib/auth/verify.server");
      const session = await getSessionUser();
      if (session?.id === userId) {
        mail = mail ?? session.email;
        display = display ?? (session.email ? session.email.split("@")[0] : "Usuario");
      }
    } catch {
      /* session lookup is best-effort */
    }
  }
  const admins = await sql<{ c: number }>`
    select count(*)::int as c from profiles
    where role = 'admin' and user_id not like 'seed-%' and user_id not like 'catalog-%'
  `;
  const role = (admins[0]?.c ?? 0) === 0 ? "admin" : "cliente";
  const verification = role === "admin" ? "verificado" : "sin_verificar";
  await sql`
    insert into profiles (user_id, display_name, email, role, verification_status, account_status, verified_at)
    values (
      ${userId}, ${display || "Usuario"}, ${mail}, ${role}, ${verification}, 'activo',
      ${role === "admin" ? new Date().toISOString() : null}
    )
  `;
}

async function loadProfile(userId: string) {
  const sql = await getSql();
  const result = await sql.query<ProfileRow>(
    `select ${PROFILE_COLS} from profiles where user_id = $1`,
    [userId],
  );
  return result[0] ? mapProfile(result[0]) : null;
}

async function requireAdmin(userId: string) {
  await ensureProfileRow(userId);
  const sql = await getSql();
  const rows = await sql<{ role: string; account_status: string }>`
    select role, account_status from profiles where user_id = ${userId}
  `;
  if (rows[0]?.role !== "admin") throw new Error("Forbidden");
  if (rows[0]?.account_status === "deshabilitado") {
    throw new Error("Tu cuenta está deshabilitada.");
  }
}

async function requireActiveAccount(userId: string) {
  await ensureProfileRow(userId);
  const sql = await getSql();
  const rows = await sql<{ account_status: string }>`
    select account_status from profiles where user_id = ${userId}
  `;
  if (rows[0]?.account_status === "deshabilitado") {
    throw new Error("Tu cuenta está deshabilitada. Escribe a soporte desde Contacto.");
  }
}

/** Correo confirmado en la tabla user de Better Auth (obligatorio para operar). */
async function requireVerifiedEmail(userId: string) {
  const sql = await getSql();
  const rows = await sql<{ verified: boolean | number | null }>`
    select "emailVerified" as verified from "user" where id = ${userId}
  `;
  if (!rows[0] || !rows[0].verified) {
    throw new Error(
      "Confirma tu correo antes de publicar u ofertar. Revisa tu bandeja o la carpeta de spam.",
    );
  }
}

async function isAdminUser(userId: string) {
  const sql = await getSql();
  const rows = await sql<{ role: string }>`select role from profiles where user_id = ${userId}`;
  return rows[0]?.role === "admin";
}

async function currentSessionId(): Promise<string | null> {
  try {
    const { getSessionUser } = await import("@/lib/auth/verify.server");
    const session = await getSessionUser();
    return session?.id ?? null;
  } catch {
    return null;
  }
}

const swapPrefsSchema = z.object({
  any: z.boolean(),
  brand: z.string().max(40).optional(),
  model: z.string().max(40).optional(),
  yearMin: z.number().int().min(1980).max(2030).optional(),
  yearMax: z.number().int().min(1980).max(2030).optional(),
  mileageMax: z.number().int().min(0).max(1_000_000).optional(),
  condition: z.string().max(20).optional(),
  fuel: z.string().max(20).optional(),
  transmission: z.string().max(20).optional(),
  bodyType: z.string().max(20).optional(),
  city: z.string().max(60).optional(),
  priceMin: z.number().min(0).optional(),
  priceMax: z.number().min(0).optional(),
});

const vehicleInput = z.object({
  title: z.string().min(3).max(120),
  brand: z.string().min(1).max(40),
  model: z.string().min(1).max(40),
  year: z.number().int().min(1980).max(2030),
  mileage: z.number().int().min(0).max(1_000_000),
  price: z.number().min(0),
  condition: z.enum(["nuevo", "seminuevo", "usado"]),
  fuel: z.enum(["gasolina", "diesel", "hibrido", "electrico"]),
  transmission: z.enum(["manual", "automatica"]),
  bodyType: z.enum(["sedan", "suv", "pickup", "hatchback", "van", "coupe"]),
  city: z.string().min(2).max(60),
  description: z.string().min(10).max(2000),
  images: z.array(z.string().min(1)).min(1).max(6),
  listingType: z.enum(["venta", "permuta", "ambos"]),
  soatExpires: z.string().optional(),
  tecnoExpires: z.string().optional(),
  taxesCurrent: z.boolean(),
  taxesDetail: z.string().max(400).optional(),
  taxesAmount: z.number().min(0).optional(),
  finesCurrent: z.boolean(),
  finesDetail: z.string().max(400).optional(),
  finesAmount: z.number().min(0).optional(),
  swapPrefs: swapPrefsSchema.optional(),
  showWhatsapp: z.boolean().optional(),
  acceptLowerOffers: z.boolean().optional(),
  minOfferPercent: z.number().min(1).max(100).nullable().optional(),
});

const listFilter = z.object({
  q: z.string().optional(),
  brand: z.string().optional(),
  listingType: z.string().optional(),
  bodyType: z.string().optional(),
  city: z.string().optional(),
  fuel: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  yearMin: z.number().optional(),
  yearMax: z.number().optional(),
  verifiedOnly: z.boolean().optional(),
});

const VEHICLE_SELECT = `
  v.*, p.display_name as seller_name,
  (p.verification_status = 'verificado') as seller_verified,
  p.phone as seller_phone, coalesce(p.whatsapp, p.phone) as seller_whatsapp,
  p.email as seller_email
`;

export const listVehicles = createServerFn({ method: "GET" })
  .validator(listFilter)
  .handler(async ({ data }) => {
    const sql = await getSql();
    await pauseInactiveVehicles(sql);
    const where: string[] = ["v.status = 'activo'"];
    const params: unknown[] = [];
    const add = (clause: string, value: unknown) => {
      params.push(value);
      where.push(clause.replaceAll("?", `$${params.length}`));
    };
    const q = data.q?.trim();
    if (q) {
      params.push(`%${q}%`);
      const i = params.length;
      where.push(
        `(v.title ilike $${i} or v.brand ilike $${i} or v.model ilike $${i} or v.city ilike $${i})`,
      );
    }
    if (data.brand) add("v.brand = ?", data.brand);
    if (data.bodyType) add("v.body_type = ?", data.bodyType);
    if (data.city) add("v.city = ?", data.city);
    if (data.fuel) add("v.fuel = ?", data.fuel);
    if (data.minPrice != null) add("v.price >= ?", data.minPrice);
    if (data.maxPrice != null) add("v.price <= ?", data.maxPrice);
    if (data.yearMin != null) add("v.year >= ?", data.yearMin);
    if (data.yearMax != null) add("v.year <= ?", data.yearMax);
    if (data.listingType) {
      params.push(data.listingType);
      const i = params.length;
      where.push(`(v.listing_type = $${i} or v.listing_type = 'ambos')`);
    }
    if (data.verifiedOnly) {
      where.push(`p.verification_status = 'verificado'`);
    }
    const rows = await sql.query<VehicleRow>(
      `select ${VEHICLE_SELECT}
       from vehicles v
       left join profiles p on p.user_id = v.user_id
       where ${where.join(" and ")}
       order by v.created_at desc`,
      params,
    );
    return rows.map((r) => mapVehicle(r));
  });

export const getVehicle = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.number() }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    await pauseInactiveVehicles(sql);
    const rows = await sql.query<VehicleRow>(
      `select ${VEHICLE_SELECT}
       from vehicles v
       left join profiles p on p.user_id = v.user_id
       where v.id = $1`,
      [data.id],
    );
    const row = rows[0];
    if (!row) return null;
    if (row.status !== "activo") {
      const uid = await currentSessionId();
      const admin = uid ? await isAdminUser(uid) : false;
      if (!uid || (uid !== row.user_id && !admin)) return null;
    }
    const vehicle = mapVehicle(row);
    const uid = await currentSessionId();
    if (uid && uid === row.user_id) {
      const cnt = await sql<{ c: number }>`
        select count(*)::int as c from offers
        where vehicle_id = ${data.id} and status in ('pendiente','contraoferta')
      `;
      vehicle.activeOffersCount = cnt[0]?.c ?? 0;
    }
    return vehicle;
  });

export const featuredVehicles = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  await pauseInactiveVehicles(sql);
  const rows = await sql.query<VehicleRow>(
    `select ${VEHICLE_SELECT}
     from vehicles v
     left join profiles p on p.user_id = v.user_id
     where v.status = 'activo'
     order by v.created_at desc
     limit 6`,
    [],
  );
  return rows.map((r) => mapVehicle(r));
});

export const marketStats = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  const v = await sql<{ c: number }>`select count(*)::int as c from vehicles where status = 'activo'`;
  const sale = await sql<{ c: number }>`select count(*)::int as c from vehicles where status = 'activo' and listing_type in ('venta','ambos')`;
  const swap = await sql<{ c: number }>`select count(*)::int as c from vehicles where status = 'activo' and listing_type in ('permuta','ambos')`;
  const cities = await sql<{ c: number }>`select count(distinct city)::int as c from vehicles where status = 'activo'`;
  const verified = await sql<{ c: number }>`select count(*)::int as c from profiles where verification_status = 'verificado'`;
  return {
    active: v[0]?.c ?? 0,
    sale: sale[0]?.c ?? 0,
    swap: swap[0]?.c ?? 0,
    cities: cities[0]?.c ?? 0,
    verified: verified[0]?.c ?? 0,
  };
});

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await ensureProfileRow(context.userId);
    return loadProfile(context.userId);
  });

const profileFields = z.object({
  firstName: z.string().min(2).max(60),
  lastName: z.string().min(2).max(60),
  phone: z.string().min(7).max(30),
  whatsapp: z.string().max(30).optional(),
  city: z.string().min(2).max(60),
  address: z.string().max(160).optional(),
  email: z.string().email().optional(),
  documentType: z.enum(["CC", "CE", "NIT", "PA"]).optional(),
  documentNumber: z.string().max(30).optional(),
});

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(profileFields)
  .handler(async ({ context, data }) => {
    await requireActiveAccount(context.userId);
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
      where user_id = ${context.userId}
    `;
    return { ok: true };
  });

export const submitVerification = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      idFrontUrl: z.string().min(100),
      idBackUrl: z.string().min(100),
      documentType: z.enum(["CC", "CE", "NIT", "PA"]),
      documentNumber: z.string().min(4).max(30),
    }),
  )
  .handler(async ({ context, data }) => {
    await requireActiveAccount(context.userId);
    const isDataImage = (s: string) =>
      s.startsWith("data:image/") && s.length >= 500 && s.length <= 2_500_000;
    if (!isDataImage(data.idFrontUrl) || !isDataImage(data.idBackUrl)) {
      throw new Error(
        "Las fotos de la cédula no son válidas. Vuelve a subir frente y reverso (JPG o PNG, bien legibles).",
      );
    }
    const sql = await getSql();
    const current = await sql<{ verification_status: string }>`
      select verification_status from profiles where user_id = ${context.userId}
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
      where user_id = ${context.userId}
    `;
    return { ok: true };
  });

export const createVehicle = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(vehicleInput)
  .handler(async ({ context, data }) => {
    await requireActiveAccount(context.userId);
    await requireVerifiedEmail(context.userId);
    const sql = await getSql();
    const profile = await sql<{ role: string; verification_status: string }>`
      select role, verification_status from profiles where user_id = ${context.userId}
    `;
    const verified =
      profile[0]?.role === "admin" || profile[0]?.verification_status === "verificado";
    const status = verified ? "activo" : "pendiente_revision";
    const images = data.images.slice(0, 6);
    const prefs = data.listingType === "venta" ? { any: true } : (data.swapPrefs ?? { any: true });
    const showWhatsapp = data.showWhatsapp !== false;
    const acceptLower = data.acceptLowerOffers !== false;
    const minPercent =
      acceptLower && data.minOfferPercent != null && data.minOfferPercent > 0
        ? data.minOfferPercent
        : null;
    const rows = await sql<{ id: number }>`
      insert into vehicles (
        user_id, title, brand, model, year, mileage, price, condition, fuel,
        transmission, body_type, city, description, image_url, images, listing_type, status,
        soat_expires, tecno_expires, taxes_current, taxes_detail, taxes_amount,
        fines_current, fines_detail, fines_amount, swap_any, swap_prefs,
        last_activity_at, show_whatsapp, accept_lower_offers, min_offer_percent,
        free_reactivations_used
      ) values (
        ${context.userId}, ${data.title}, ${data.brand}, ${data.model}, ${data.year},
        ${data.mileage}, ${data.price}, ${data.condition}, ${data.fuel},
        ${data.transmission}, ${data.bodyType}, ${data.city}, ${data.description},
        ${images[0]}, ${JSON.stringify(images)}, ${data.listingType}, ${status},
        ${data.soatExpires || null}, ${data.tecnoExpires || null},
        ${data.taxesCurrent}, ${data.taxesCurrent ? null : data.taxesDetail ?? null},
        ${data.taxesCurrent ? 0 : data.taxesAmount ?? 0},
        ${data.finesCurrent}, ${data.finesCurrent ? null : data.finesDetail ?? null},
        ${data.finesCurrent ? 0 : data.finesAmount ?? 0},
        ${Boolean(prefs.any)}, ${JSON.stringify(prefs)},
        now(), ${showWhatsapp}, ${acceptLower}, ${minPercent},
        0
      )
      returning id
    `;
    return { id: rows[0].id, status };
  });

export const listMyVehicles = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await ensureProfileRow(context.userId);
    const sql = await getSql();
    await pauseInactiveVehicles(sql);
    const rows = await sql.query<VehicleRow>(
      `select ${VEHICLE_SELECT},
        (select count(*)::int from offers o
         where o.vehicle_id = v.id and o.status in ('pendiente','contraoferta')) as active_offers_count
       from vehicles v
       left join profiles p on p.user_id = v.user_id
       where v.user_id = $1
       order by v.created_at desc`,
      [context.userId],
    );
    return rows.map((r) => mapVehicle(r));
  });

export const updateVehicleStatus = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.number(), status: z.enum(["activo", "pausado", "vendido"]) }))
  .handler(async ({ context, data }) => {
    await requireActiveAccount(context.userId);
    const sql = await getSql();
    const current = await sql<{
      status: string;
      paused_reason: string | null;
      free_reactivations_used: number | null;
    }>`
      select status, paused_reason, free_reactivations_used
      from vehicles where id = ${data.id} and user_id = ${context.userId}
    `;
    if (!current[0]) throw new Error("Anuncio no encontrado.");
    if (current[0].status === "pendiente_revision" || current[0].status === "rechazado") {
      throw new Error("Este anuncio sigue en revisión del administrador.");
    }

    // Reactivar desde pausa por inactividad
    if (data.status === "activo" && current[0].status === "pausado") {
      const used = Number(current[0].free_reactivations_used ?? 0);
      if (current[0].paused_reason === "inactividad") {
        if (used < FREE_REACTIVATIONS) {
          await sql`
            update vehicles
            set status = 'activo',
                paused_reason = null,
                last_activity_at = now(),
                free_reactivations_used = ${used + 1},
                reactivation_requested_at = null
            where id = ${data.id} and user_id = ${context.userId}
          `;
          return { ok: true, reactivated: true, free: true };
        }
        // Ya usó la reactivación gratis → solicitar
        await sql`
          update vehicles
          set reactivation_requested_at = now()
          where id = ${data.id} and user_id = ${context.userId}
        `;
        return {
          ok: true,
          reactivated: false,
          requested: true,
          message: "Solicitud enviada. Un administrador extenderá tu anuncio.",
        };
      }
      // Pausa manual: reactivar y resetear actividad
      await sql`
        update vehicles
        set status = 'activo',
            paused_reason = null,
            last_activity_at = now(),
            reactivation_requested_at = null
        where id = ${data.id} and user_id = ${context.userId}
      `;
      return { ok: true };
    }

    if (data.status === "pausado") {
      await sql`
        update vehicles
        set status = 'pausado',
            paused_reason = 'manual'
        where id = ${data.id} and user_id = ${context.userId}
      `;
      return { ok: true };
    }

    await sql`
      update vehicles
      set status = ${data.status}
      where id = ${data.id} and user_id = ${context.userId}
    `;
    return { ok: true };
  });

/** Solicitar reactivación explícita (cuando ya no hay reactivaciones gratis). */
export const requestReactivation = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.number() }))
  .handler(async ({ context, data }) => {
    await requireActiveAccount(context.userId);
    const sql = await getSql();
    const rows = await sql<{ status: string; paused_reason: string | null }>`
      select status, paused_reason from vehicles
      where id = ${data.id} and user_id = ${context.userId}
    `;
    if (!rows[0]) throw new Error("Anuncio no encontrado.");
    if (rows[0].status !== "pausado") {
      throw new Error("Solo se puede solicitar reactivación de anuncios pausados.");
    }
    await sql`
      update vehicles
      set reactivation_requested_at = now()
      where id = ${data.id} and user_id = ${context.userId}
    `;
    return { ok: true };
  });

export const deleteMyVehicle = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.number() }))
  .handler(async ({ context, data }) => {
    await requireActiveAccount(context.userId);
    const sql = await getSql();
    await sql`delete from vehicles where id = ${data.id} and user_id = ${context.userId}`;
    return { ok: true };
  });

export const toggleFavorite = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ vehicleId: z.number() }))
  .handler(async ({ context, data }) => {
    await requireActiveAccount(context.userId);
    const sql = await getSql();
    const existing = await sql<{ vehicle_id: number }>`
      select vehicle_id from favorites
      where user_id = ${context.userId} and vehicle_id = ${data.vehicleId}
    `;
    if (existing.length) {
      await sql`
        delete from favorites
        where user_id = ${context.userId} and vehicle_id = ${data.vehicleId}
      `;
      return { favorite: false };
    }
    await sql`
      insert into favorites (user_id, vehicle_id)
      values (${context.userId}, ${data.vehicleId})
    `;
    return { favorite: true };
  });

export const listFavorites = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql.query<VehicleRow>(
      `select ${VEHICLE_SELECT}
       from favorites f
       join vehicles v on v.id = f.vehicle_id
       left join profiles p on p.user_id = v.user_id
       where f.user_id = $1
       order by f.created_at desc`,
      [context.userId],
    );
    return rows.map((r) => mapVehicle(r, new Set(rows.map((x) => x.id))));
  });

export const listFavoriteIds = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<{ vehicle_id: number }>`
      select vehicle_id from favorites where user_id = ${context.userId}
    `;
    return rows.map((r) => r.vehicle_id);
  });

export const isFavorite = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ vehicleId: z.number() }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<{ c: number }>`
      select count(*)::int as c from favorites
      where user_id = ${context.userId} and vehicle_id = ${data.vehicleId}
    `;
    return { favorite: (rows[0]?.c ?? 0) > 0 };
  });

export const createOffer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      vehicleId: z.number(),
      offerType: z.enum(["compra", "permuta"]),
      amount: z.number().optional(),
      swapVehicleId: z.number().optional(),
      message: z.string().max(800).optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    await requireActiveAccount(context.userId);
    await requireVerifiedEmail(context.userId);
    const sql = await getSql();
    const vehicle = await sql<{
      user_id: string;
      listing_type: string;
      status: string;
      price: number;
      swap_any: boolean | number | null;
      swap_prefs: string | null;
      accept_lower_offers: boolean | number | null;
      min_offer_percent: number | null;
    }>`
      select user_id, listing_type, status, price, swap_any, swap_prefs,
             accept_lower_offers, min_offer_percent
      from vehicles where id = ${data.vehicleId}
    `;
    if (!vehicle[0] || vehicle[0].status !== "activo") {
      throw new Error("El anuncio no está disponible.");
    }
    if (vehicle[0].user_id === context.userId) {
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
      const acceptLower = vehicle[0].accept_lower_offers == null
        ? true
        : Boolean(vehicle[0].accept_lower_offers);
      if (!acceptLower && amount < price) {
        throw new Error("El vendedor solo acepta el precio publicado (no ofertas menores).");
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
      if (!data.swapVehicleId) throw new Error("Elige un vehículo para permutar.");
      const mine = await sql.query<VehicleRow>(
        `select ${VEHICLE_SELECT}
         from vehicles v
         left join profiles p on p.user_id = v.user_id
         where v.id = $1 and v.user_id = $2 and v.status = 'activo'`,
        [data.swapVehicleId, context.userId],
      );
      if (!mine[0]) throw new Error("El vehículo de permuta no es tuyo o no está activo.");
    }
    const rows = await sql<{ id: number }>`
      insert into offers (vehicle_id, buyer_id, offer_type, amount, swap_vehicle_id, message, status, last_actor_id)
      values (
        ${data.vehicleId}, ${context.userId}, ${data.offerType},
        ${data.amount ?? null}, ${data.swapVehicleId ?? null}, ${data.message ?? null},
        'pendiente', ${context.userId}
      )
      returning id
    `;
    await sql`
      insert into offer_events (offer_id, actor_id, action, amount, swap_vehicle_id, message)
      values (
        ${rows[0].id}, ${context.userId}, 'oferta',
        ${data.amount ?? null}, ${data.swapVehicleId ?? null}, ${data.message ?? null}
      )
    `;
    // Actividad del anuncio al recibir oferta
    await sql`
      update vehicles set last_activity_at = now()
      where id = ${data.vehicleId} and status = 'activo'
    `;
    return { id: rows[0].id };
  });

type OfferRow = {
  id: number;
  vehicle_id: number;
  buyer_id: string;
  offer_type: string;
  amount: number | null;
  swap_vehicle_id: number | null;
  message: string | null;
  status: string;
  created_at: string;
  last_actor_id?: string | null;
  counter_count?: number | null;
  vehicle_title?: string;
  vehicle_image?: string;
  vehicle_owner_id?: string;
  swap_title?: string | null;
  buyer_name?: string | null;
  swap_any?: boolean | number | null;
  swap_prefs?: string | null;
  swap_brand?: string | null;
  swap_model?: string | null;
  swap_year?: number | null;
  swap_mileage?: number | null;
  swap_condition?: string | null;
  swap_fuel?: string | null;
  swap_transmission?: string | null;
  swap_body?: string | null;
  swap_city?: string | null;
  swap_price?: number | null;
};

function mapOffer(row: OfferRow): Offer {
  let matchesPrefs: boolean | null = null;
  if (row.offer_type === "permuta" && row.swap_vehicle_id && row.swap_brand) {
    matchesPrefs = vehicleMatchesPrefs(
      {
        brand: row.swap_brand,
        model: row.swap_model ?? "",
        year: Number(row.swap_year ?? 0),
        mileage: Number(row.swap_mileage ?? 0),
        condition: row.swap_condition ?? "",
        fuel: row.swap_fuel ?? "",
        transmission: row.swap_transmission ?? "",
        bodyType: row.swap_body ?? "",
        city: row.swap_city ?? "",
        price: Number(row.swap_price ?? 0),
      },
      parseSwapPrefs(row.swap_prefs, asBool(row.swap_any, true)),
    );
  }
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    buyerId: row.buyer_id,
    offerType: row.offer_type,
    amount: row.amount == null ? null : Number(row.amount),
    swapVehicleId: row.swap_vehicle_id,
    message: row.message,
    status: row.status,
    createdAt: String(row.created_at),
    lastActorId: row.last_actor_id ?? null,
    counterCount: Number(row.counter_count ?? 0),
    acceptedAt: (row as OfferRow & { accepted_at?: string | null }).accepted_at
      ? String((row as OfferRow & { accepted_at?: string | null }).accepted_at)
      : null,
    acceptedBy: (row as OfferRow & { accepted_by?: string | null }).accepted_by ?? null,
    finalAmount:
      (row as OfferRow & { final_amount?: number | null }).final_amount == null
        ? null
        : Number((row as OfferRow & { final_amount?: number | null }).final_amount),
    vehicleTitle: row.vehicle_title,
    vehicleImage: row.vehicle_image,
    vehicleOwnerId: row.vehicle_owner_id,
    swapTitle: row.swap_title ?? null,
    buyerName: row.buyer_name ?? null,
    sellerName: (row as OfferRow & { seller_name?: string | null }).seller_name ?? null,
    matchesPrefs,
  };
}

type OfferContactRow = OfferRow & {
  buyer_phone?: string | null;
  buyer_whatsapp?: string | null;
  buyer_email?: string | null;
  seller_name?: string | null;
  seller_phone?: string | null;
  seller_whatsapp?: string | null;
  seller_email?: string | null;
};

function mapOfferWithContacts(row: OfferContactRow, viewerId?: string): Offer {
  const base = mapOffer(row);
  base.sellerName = row.seller_name ?? null;
  if (viewerId && base.status === "aceptada") {
    const isBuyer = base.buyerId === viewerId;
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

const OFFER_SELECT = `
  o.*, v.title as vehicle_title, v.image_url as vehicle_image, v.user_id as vehicle_owner_id,
  v.swap_any, v.swap_prefs, s.title as swap_title,
  p.display_name as buyer_name,
  p.phone as buyer_phone, coalesce(p.whatsapp, p.phone) as buyer_whatsapp, p.email as buyer_email,
  own.display_name as seller_name,
  own.phone as seller_phone, coalesce(own.whatsapp, own.phone) as seller_whatsapp, own.email as seller_email,
  s.brand as swap_brand, s.model as swap_model, s.year as swap_year, s.mileage as swap_mileage,
  s.condition as swap_condition, s.fuel as swap_fuel, s.transmission as swap_transmission,
  s.body_type as swap_body, s.city as swap_city, s.price as swap_price
`;

async function loadEvents(offerIds: number[]) {
  if (!offerIds.length) return new Map<number, OfferEvent[]>();
  const sql = await getSql();
  const placeholders = offerIds.map((_, i) => `$${i + 1}`).join(", ");
  const rows = await sql.query<{
    id: number;
    offer_id: number;
    actor_id: string;
    action: string;
    amount: number | null;
    swap_vehicle_id: number | null;
    message: string | null;
    created_at: string;
    actor_name: string | null;
  }>(
    `select e.*, p.display_name as actor_name
     from offer_events e
     left join profiles p on p.user_id = e.actor_id
     where e.offer_id in (${placeholders})
     order by e.created_at asc`,
    offerIds,
  );
  const map = new Map<number, OfferEvent[]>();
  for (const r of rows) {
    const list = map.get(r.offer_id) ?? [];
    list.push({
      id: r.id,
      offerId: r.offer_id,
      actorId: r.actor_id,
      actorName: r.actor_name,
      action: r.action,
      amount: r.amount == null ? null : Number(r.amount),
      swapVehicleId: r.swap_vehicle_id,
      message: r.message,
      createdAt: String(r.created_at),
    });
    map.set(r.offer_id, list);
  }
  return map;
}

export const listMyOffers = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await ensureProfileRow(context.userId);
    const sql = await getSql();
    const sent = await sql.query<OfferRow>(
      `select ${OFFER_SELECT}
       from offers o
       join vehicles v on v.id = o.vehicle_id
       left join vehicles s on s.id = o.swap_vehicle_id
       left join profiles p on p.user_id = o.buyer_id
       left join profiles own on own.user_id = v.user_id
       where o.buyer_id = $1
       order by o.created_at desc`,
      [context.userId],
    );
    const received = await sql.query<OfferRow>(
      `select ${OFFER_SELECT}
       from offers o
       join vehicles v on v.id = o.vehicle_id
       left join vehicles s on s.id = o.swap_vehicle_id
       left join profiles p on p.user_id = o.buyer_id
       left join profiles own on own.user_id = v.user_id
       where v.user_id = $1
       order by o.created_at desc`,
      [context.userId],
    );
    const events = await loadEvents([...sent, ...received].map((o) => o.id));
    const withEvents = (rows: OfferRow[]) =>
      rows.map((r) => {
        const o = mapOfferWithContacts(r as OfferContactRow, context.userId);
        o.events = events.get(r.id) ?? [];
        return o;
      });
    return { sent: withEvents(sent), received: withEvents(received) };
  });

export const respondOffer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.number(), status: z.enum(["aceptada", "rechazada"]) }))
  .handler(async ({ context, data }) => {
    await requireActiveAccount(context.userId);
    await requireVerifiedEmail(context.userId);
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
      where o.id = ${data.id}
    `;
    const offer = rows[0];
    if (!offer) throw new Error("Oferta no encontrada.");
    if (!["pendiente", "contraoferta"].includes(offer.status)) {
      throw new Error("Esta oferta ya no está abierta.");
    }
    const isOwner = offer.owner_id === context.userId;
    const isBuyer = offer.buyer_id === context.userId;
    if (!isOwner && !isBuyer) throw new Error("No puedes responder esta oferta.");
    if (offer.last_actor_id === context.userId) {
      throw new Error("Espera la respuesta de la otra parte.");
    }

    if (data.status === "aceptada") {
      const finalAmount = offer.amount == null ? null : Number(offer.amount);
      const nowIso = new Date().toISOString();
      await sql`
        update offers
        set status = 'aceptada',
            accepted_at = ${nowIso},
            accepted_by = ${context.userId},
            final_amount = ${finalAmount}
        where id = ${data.id}
      `;
      await sql`
        insert into offer_events (offer_id, actor_id, action, amount)
        values (${data.id}, ${context.userId}, 'aceptada', ${finalAmount})
      `;
      await sql`
        update vehicles set status = 'vendido'
        where id = ${offer.vehicle_id} and user_id = ${offer.owner_id}
      `;
      await sql`
        update offers set status = 'cerrada'
        where vehicle_id = ${offer.vehicle_id} and id <> ${data.id}
          and status in ('pendiente','contraoferta')
      `;
      // Snapshot del negocio para el admin
      const names = await sql<{ seller_name: string | null; buyer_name: string | null }>`
        select
          (select display_name from profiles where user_id = ${offer.owner_id}) as seller_name,
          (select display_name from profiles where user_id = ${offer.buyer_id}) as buyer_name
      `;
      await sql`
        insert into deals (
          offer_id, vehicle_id, seller_id, buyer_id, seller_name, buyer_name,
          vehicle_title, offer_type, final_amount, accepted_at, accepted_by
        ) values (
          ${data.id}, ${offer.vehicle_id}, ${offer.owner_id}, ${offer.buyer_id},
          ${names[0]?.seller_name ?? null}, ${names[0]?.buyer_name ?? null},
          ${offer.vehicle_title ?? null}, ${offer.offer_type}, ${finalAmount},
          ${nowIso}, ${context.userId}
        )
      `;
    } else {
      await sql`update offers set status = ${data.status} where id = ${data.id}`;
      await sql`
        insert into offer_events (offer_id, actor_id, action)
        values (${data.id}, ${context.userId}, ${data.status})
      `;
    }
    return { ok: true };
  });

export const counterOffer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      id: z.number(),
      amount: z.number().optional(),
      swapVehicleId: z.number().optional(),
      message: z.string().min(2).max(800),
    }),
  )
  .handler(async ({ context, data }) => {
    await requireActiveAccount(context.userId);
    await requireVerifiedEmail(context.userId);
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
    const isOwner = offer.owner_id === context.userId;
    const isBuyer = offer.buyer_id === context.userId;
    if (!isOwner && !isBuyer) throw new Error("No puedes contraofertar aquí.");
    if (offer.last_actor_id === context.userId) {
      throw new Error("Espera la respuesta de la otra parte antes de contraofertar.");
    }
    if (offer.offer_type === "compra" && data.amount == null) {
      throw new Error("Indica el nuevo monto de la contraoferta.");
    }
    if (offer.offer_type === "permuta" && isBuyer && data.swapVehicleId) {
      const mine = await sql<{ id: number }>`
        select id from vehicles
        where id = ${data.swapVehicleId} and user_id = ${context.userId} and status = 'activo'
      `;
      if (!mine[0]) throw new Error("El vehículo de permuta no es tuyo o no está activo.");
    }
    await sql`
      update offers
      set amount = ${data.amount ?? null},
          swap_vehicle_id = ${data.swapVehicleId ?? null},
          message = ${data.message},
          status = 'contraoferta',
          last_actor_id = ${context.userId},
          counter_count = ${Number(offer.counter_count) + 1}
      where id = ${data.id}
    `;
    await sql`
      insert into offer_events (offer_id, actor_id, action, amount, swap_vehicle_id, message)
      values (
        ${data.id}, ${context.userId}, 'contraoferta',
        ${data.amount ?? null}, ${data.swapVehicleId ?? null}, ${data.message}
      )
    `;
    return { ok: true };
  });

export const submitContact = createServerFn({ method: "POST" })
  .validator(
    z.object({
      name: z.string().min(2).max(80),
      email: z.string().email(),
      phone: z.string().min(6).max(30),
      subject: z.string().max(120).optional(),
      message: z.string().min(8).max(2000),
    }),
  )
  .handler(async ({ data }) => {
    const sql = await getSql();
    await sql`
      insert into contacts (name, email, phone, subject, message)
      values (${data.name}, ${data.email}, ${data.phone}, ${data.subject ?? null}, ${data.message})
    `;
    return { ok: true };
  });

export const adminStats = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    const users = await sql<{ c: number }>`select count(*)::int as c from profiles`;
    const vehicles = await sql<{ c: number }>`select count(*)::int as c from vehicles`;
    const pending = await sql<{ c: number }>`select count(*)::int as c from offers where status in ('pendiente','contraoferta')`;
    const contacts = await sql<{ c: number }>`select count(*)::int as c from contacts`;
    const pendingListings = await sql<{ c: number }>`select count(*)::int as c from vehicles where status = 'pendiente_revision'`;
    const pendingVerifications = await sql<{ c: number }>`select count(*)::int as c from profiles where verification_status = 'pendiente'`;
    const byStatus = await sql<{ status: string; c: number }>`
      select status, count(*)::int as c from vehicles group by status
    `;
    const byType = await sql<{ listing_type: string; c: number }>`
      select listing_type, count(*)::int as c from vehicles group by listing_type
    `;
    const byCity = await sql<{ city: string; c: number }>`
      select city, count(*)::int as c from vehicles where status = 'activo' group by city order by c desc
    `;
    const recentOffers = await sql.query<OfferRow>(
      `select ${OFFER_SELECT}
       from offers o
       join vehicles v on v.id = o.vehicle_id
       left join vehicles s on s.id = o.swap_vehicle_id
       left join profiles p on p.user_id = o.buyer_id
       left join profiles own on own.user_id = v.user_id
       order by o.created_at desc
       limit 8`,
      [],
    );
    const dealsMonth = await sql<{ c: number }>`
      select count(*)::int as c from deals
      where accepted_at >= date_trunc('month', now())
    `;
    const recentDeals = await sql<{
      id: number;
      offer_id: number;
      vehicle_id: number;
      seller_id: string;
      buyer_id: string;
      seller_name: string | null;
      buyer_name: string | null;
      vehicle_title: string | null;
      offer_type: string;
      final_amount: number | null;
      accepted_at: string;
      accepted_by: string;
    }>`
      select id, offer_id, vehicle_id, seller_id, buyer_id, seller_name, buyer_name,
             vehicle_title, offer_type, final_amount, accepted_at, accepted_by
      from deals order by accepted_at desc limit 5
    `;
    const reactivationRequests = await sql<{ c: number }>`
      select count(*)::int as c from vehicles
      where reactivation_requested_at is not null and status = 'pausado'
    `;
    return {
      users: users[0]?.c ?? 0,
      vehicles: vehicles[0]?.c ?? 0,
      pending: pending[0]?.c ?? 0,
      contacts: contacts[0]?.c ?? 0,
      pendingListings: pendingListings[0]?.c ?? 0,
      pendingVerifications: pendingVerifications[0]?.c ?? 0,
      dealsThisMonth: dealsMonth[0]?.c ?? 0,
      reactivationRequests: reactivationRequests[0]?.c ?? 0,
      byStatus,
      byType,
      byCity,
      recentOffers: recentOffers.map(mapOffer),
      recentDeals: recentDeals.map(
        (r) =>
          ({
            id: r.id,
            offerId: r.offer_id,
            vehicleId: r.vehicle_id,
            sellerId: r.seller_id,
            buyerId: r.buyer_id,
            sellerName: r.seller_name,
            buyerName: r.buyer_name,
            vehicleTitle: r.vehicle_title,
            offerType: r.offer_type,
            finalAmount: r.final_amount == null ? null : Number(r.final_amount),
            acceptedAt: String(r.accepted_at),
            acceptedBy: r.accepted_by,
          }) satisfies Deal,
      ),
    };
  });

export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    const rows = await sql.query<ProfileRow>(
      `select ${PROFILE_COLS} from profiles order by created_at desc`,
      [],
    );
    return rows.map(mapProfile);
  });

export const adminSetRole = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ userId: z.string(), role: z.enum(["admin", "cliente"]) }))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    if (data.userId === context.userId && data.role !== "admin") {
      throw new Error("No puedes quitarte el rol de administrador.");
    }
    const sql = await getSql();
    await sql`update profiles set role = ${data.role} where user_id = ${data.userId}`;
    return { ok: true };
  });

export const adminUpdateUser = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      userId: z.string(),
      firstName: z.string().min(2).max(60),
      lastName: z.string().min(2).max(60),
      phone: z.string().max(30).optional(),
      whatsapp: z.string().max(30).optional(),
      city: z.string().max(60).optional(),
      address: z.string().max(160).optional(),
      email: z.string().email().optional(),
      documentType: z.enum(["CC", "CE", "NIT", "PA"]).optional(),
      documentNumber: z.string().max(30).optional(),
      role: z.enum(["admin", "cliente"]),
    }),
  )
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    if (data.userId === context.userId && data.role !== "admin") {
      throw new Error("No puedes quitarte el rol de administrador.");
    }
    const displayName = `${data.firstName} ${data.lastName}`.trim();
    const sql = await getSql();
    await sql`
      update profiles
      set display_name = ${displayName},
          first_name = ${data.firstName},
          last_name = ${data.lastName},
          phone = ${data.phone ?? null},
          whatsapp = ${data.whatsapp || data.phone || null},
          city = ${data.city ?? null},
          address = ${data.address ?? null},
          email = ${data.email ?? null},
          document_type = ${data.documentType ?? null},
          document_number = ${data.documentNumber ?? null},
          role = ${data.role}
      where user_id = ${data.userId}
    `;
    if (data.email) {
      await sql`update "user" set email = ${data.email}, name = ${displayName} where id = ${data.userId}`;
    }
    return { ok: true };
  });

export const adminSetAccountStatus = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ userId: z.string(), status: z.enum(["activo", "deshabilitado"]) }))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    if (data.userId === context.userId) {
      throw new Error("No puedes deshabilitar tu propia cuenta.");
    }
    const sql = await getSql();
    await sql`update profiles set account_status = ${data.status} where user_id = ${data.userId}`;
    return { ok: true };
  });

export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ userId: z.string() }))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    if (data.userId === context.userId) {
      throw new Error("No puedes eliminar tu propia cuenta.");
    }
    const sql = await getSql();
    const target = await sql<{ role: string }>`select role from profiles where user_id = ${data.userId}`;
    if (target[0]?.role === "admin") {
      const admins = await sql<{ c: number }>`
        select count(*)::int as c from profiles where role = 'admin' and account_status = 'activo'
      `;
      if ((admins[0]?.c ?? 0) <= 1) {
        throw new Error("No puedes eliminar al último administrador.");
      }
    }
    await sql`delete from favorites where user_id = ${data.userId}`;
    await sql`delete from offers where buyer_id = ${data.userId}`;
    await sql`delete from vehicles where user_id = ${data.userId}`;
    await sql`delete from profiles where user_id = ${data.userId}`;
    await sql`delete from "session" where "userId" = ${data.userId}`;
    await sql`delete from "account" where "userId" = ${data.userId}`;
    await sql`delete from "user" where id = ${data.userId}`;
    return { ok: true };
  });

export const adminListVerifications = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    const rows = await sql.query<ProfileRow>(
      `select ${PROFILE_COLS}
       from profiles
       where verification_status in ('pendiente','verificado','rechazado')
         and (id_front_url is not null or verification_status <> 'sin_verificar')
       order by
         case verification_status when 'pendiente' then 0 when 'rechazado' then 1 else 2 end,
         created_at desc`,
      [],
    );
    return rows.map(mapProfile);
  });

export const adminReviewVerification = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      userId: z.string(),
      status: z.enum(["verificado", "rechazado"]),
      note: z.string().max(400).optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    await sql`
      update profiles
      set verification_status = ${data.status},
          verification_note = ${data.note ?? null},
          verified_at = ${data.status === "verificado" ? new Date().toISOString() : null}
      where user_id = ${data.userId}
    `;
    if (data.status === "verificado") {
      await sql`
        update vehicles
        set status = 'activo'
        where user_id = ${data.userId} and status = 'pendiente_revision'
      `;
    }
    return { ok: true };
  });

export const adminListVehicles = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    const rows = await sql.query<VehicleRow>(
      `select ${VEHICLE_SELECT}
       from vehicles v
       left join profiles p on p.user_id = v.user_id
       order by
         case v.status when 'pendiente_revision' then 0 else 1 end,
         v.created_at desc`,
      [],
    );
    return rows.map((r) => mapVehicle(r));
  });

export const adminSetVehicleStatus = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      id: z.number(),
      status: z.enum(["activo", "pausado", "vendido", "rechazado", "pendiente_revision"]),
    }),
  )
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    if (data.status === "activo") {
      await sql`
        update vehicles
        set status = 'activo',
            paused_reason = null,
            reactivation_requested_at = null,
            last_activity_at = now()
        where id = ${data.id}
      `;
    } else if (data.status === "pausado") {
      await sql`
        update vehicles
        set status = 'pausado', paused_reason = 'manual'
        where id = ${data.id}
      `;
    } else {
      await sql`update vehicles set status = ${data.status} where id = ${data.id}`;
    }
    return { ok: true };
  });

export const adminListOffers = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    const rows = await sql.query<OfferRow>(
      `select ${OFFER_SELECT}
       from offers o
       join vehicles v on v.id = o.vehicle_id
       left join vehicles s on s.id = o.swap_vehicle_id
       left join profiles p on p.user_id = o.buyer_id
       left join profiles own on own.user_id = v.user_id
       order by o.created_at desc`,
      [],
    );
    return rows.map(mapOffer);
  });

export const adminListContacts = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    const rows = await sql<{
      id: number;
      user_id: string | null;
      name: string;
      email: string;
      phone: string;
      subject: string | null;
      message: string;
      created_at: string;
    }>`
      select id, user_id, name, email, phone, subject, message, created_at
      from contacts
      order by created_at desc
    `;
    return rows.map(
      (r) =>
        ({
          id: r.id,
          userId: r.user_id,
          name: r.name,
          email: r.email,
          phone: r.phone,
          subject: r.subject,
          message: r.message,
          createdAt: String(r.created_at),
        }) satisfies ContactRow,
    );
  });

export const adminDeleteContact = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.number() }))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    await sql`delete from contacts where id = ${data.id}`;
    return { ok: true };
  });


export const adminListDeals = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    const rows = await sql<{
      id: number;
      offer_id: number;
      vehicle_id: number;
      seller_id: string;
      buyer_id: string;
      seller_name: string | null;
      buyer_name: string | null;
      vehicle_title: string | null;
      offer_type: string;
      final_amount: number | null;
      accepted_at: string;
      accepted_by: string;
      accepted_by_name: string | null;
    }>`
      select d.id, d.offer_id, d.vehicle_id, d.seller_id, d.buyer_id, d.seller_name, d.buyer_name,
             d.vehicle_title, d.offer_type, d.final_amount, d.accepted_at, d.accepted_by,
             ap.display_name as accepted_by_name
      from deals d
      left join profiles ap on ap.user_id = d.accepted_by
      order by d.accepted_at desc
      limit 200
    `;
    return rows.map(
      (r) =>
        ({
          id: r.id,
          offerId: r.offer_id,
          vehicleId: r.vehicle_id,
          sellerId: r.seller_id,
          buyerId: r.buyer_id,
          sellerName: r.seller_name,
          buyerName: r.buyer_name,
          vehicleTitle: r.vehicle_title,
          offerType: r.offer_type,
          finalAmount: r.final_amount == null ? null : Number(r.final_amount),
          acceptedAt: String(r.accepted_at),
          acceptedBy: r.accepted_by_name ?? r.accepted_by,
        }) satisfies Deal,
    );
  });

/** Admin: extender / reactivar un anuncio eligiendo los días. */
export const adminExtendListing = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      id: z.number(),
      days: z.number().int().min(1).max(365),
    }),
  )
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    const rows = await sql<{ id: number }>`select id from vehicles where id = ${data.id}`;
    if (!rows[0]) throw new Error("Anuncio no encontrado.");
    await sql`
      update vehicles
      set status = 'activo',
          paused_reason = null,
          reactivation_requested_at = null,
          last_activity_at = now() + ((${data.days} - ${LISTING_ACTIVE_DAYS}) * interval '1 day')
      where id = ${data.id}
    `;
    // last_activity_at = now() + (days - 30) hace que quede activo exactamente `days` días
    // desde ahora, porque pauseInactiveVehicles corta a 30 días desde last_activity_at.
    // Si days == 30, last_activity_at = now(). Si days == 60, last_activity_at = now()+30d.
    return { ok: true, days: data.days };
  });

export const adminListReactivationRequests = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    const rows = await sql.query<VehicleRow>(
      `select ${VEHICLE_SELECT}
       from vehicles v
       left join profiles p on p.user_id = v.user_id
       where v.reactivation_requested_at is not null
         and v.status = 'pausado'
       order by v.reactivation_requested_at asc`,
      [],
    );
    return rows.map((r) => mapVehicle(r));
  });
