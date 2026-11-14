-- Destacados (admin) y solicitudes de búsqueda (compradores)
alter table vehicles add column if not exists featured boolean not null default false;
alter table vehicles add column if not exists featured_at timestamptz;

create table if not exists search_requests (
  id serial primary key,
  user_id text not null,
  brand text,
  model text,
  year_min integer,
  year_max integer,
  max_price double precision,
  city text,
  notes text,
  status text not null default 'activa',
  created_at timestamptz not null default now()
);

create index if not exists search_requests_user_idx on search_requests (user_id);
create index if not exists search_requests_status_idx on search_requests (status);
