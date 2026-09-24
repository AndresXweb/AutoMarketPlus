-- Inactividad, reglas de oferta, WhatsApp visible, reactivaciones y trazabilidad de deals.

-- ── Vehículos ──────────────────────────────────────────────────────────────
alter table vehicles add column if not exists last_activity_at timestamptz not null default now();
alter table vehicles add column if not exists paused_reason text;
alter table vehicles add column if not exists free_reactivations_used integer not null default 0;
alter table vehicles add column if not exists reactivation_requested_at timestamptz;
alter table vehicles add column if not exists show_whatsapp boolean not null default true;
alter table vehicles add column if not exists accept_lower_offers boolean not null default true;
alter table vehicles add column if not exists min_offer_percent double precision;

-- Backfill activity desde created_at
update vehicles set last_activity_at = coalesce(created_at, now()) where last_activity_at is null;

-- ── Ofertas: cierre estructurado ───────────────────────────────────────────
alter table offers add column if not exists accepted_at timestamptz;
alter table offers add column if not exists accepted_by text;
alter table offers add column if not exists final_amount double precision;

-- ── Snapshot de negocios concretados (trazabilidad admin) ──────────────────
create table if not exists deals (
  id serial primary key,
  offer_id integer not null references offers(id) on delete cascade,
  vehicle_id integer not null references vehicles(id) on delete cascade,
  seller_id text not null,
  buyer_id text not null,
  seller_name text,
  buyer_name text,
  vehicle_title text,
  offer_type text not null,
  final_amount double precision,
  accepted_at timestamptz not null default now(),
  accepted_by text not null
);

create index if not exists deals_accepted_at_idx on deals (accepted_at desc);
create index if not exists deals_vehicle_id_idx on deals (vehicle_id);
create index if not exists vehicles_last_activity_idx on vehicles (last_activity_at);
create index if not exists vehicles_status_activity_idx on vehicles (status, last_activity_at);
