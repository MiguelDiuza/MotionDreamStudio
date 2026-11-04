-- =====================================================================
-- Motion Dreams · Galería administrable
-- Pegar entero en Supabase > SQL Editor > New query > Run.
-- Se puede volver a ejecutar sin romper nada (idempotente).
-- =====================================================================

-- ---------- Tablas ----------------------------------------------------

-- Usuarios que pueden administrar la galería (lista blanca).
-- Estar registrado en Auth NO basta: hay que estar en esta tabla.
create table if not exists public.gallery_admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Categorías fijas de la web (coinciden con ?cat= / ?project= de las páginas).
create table if not exists public.gallery_categories (
  slug     text primary key,
  title    text not null,
  subtitle text not null default '',
  sort     int  not null default 0
);

-- Grupos dentro de cada categoría ("Flyers Night clubs", "Carruseles"...).
create table if not exists public.gallery_groups (
  id            uuid primary key default gen_random_uuid(),
  category_slug text not null references public.gallery_categories (slug)
                on update cascade on delete cascade,
  title         text not null check (char_length(title) between 1 and 80),
  landscape     boolean not null default false,  -- carrusel horizontal (16:9)
  sort          int not null default 0,
  created_at    timestamptz not null default now()
);
create index if not exists gallery_groups_category_idx on public.gallery_groups (category_slug, sort);

-- Cada imagen o vídeo. "path" es la ruta dentro del bucket "gallery"
-- (o una ruta local "assets/..." para material que sigue en el repo).
create table if not exists public.gallery_items (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.gallery_groups (id) on delete cascade,
  path       text not null check (char_length(path) between 1 and 500),
  media_type text not null check (media_type in ('image', 'video')),
  sort       int  not null default 0,
  visible    boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists gallery_items_group_idx on public.gallery_items (group_id, sort);
create index if not exists gallery_items_path_idx  on public.gallery_items (path);

-- ---------- ¿Es admin? ------------------------------------------------

create or replace function public.is_gallery_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.gallery_admins where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_gallery_admin() from public;
grant execute on function public.is_gallery_admin() to anon, authenticated;

-- ---------- Permisos (RLS) --------------------------------------------

alter table public.gallery_admins     enable row level security;
alter table public.gallery_categories enable row level security;
alter table public.gallery_groups     enable row level security;
alter table public.gallery_items      enable row level security;

grant select on public.gallery_categories, public.gallery_groups, public.gallery_items to anon, authenticated;
grant insert, update, delete on public.gallery_categories, public.gallery_groups, public.gallery_items to authenticated;
grant select on public.gallery_admins to authenticated;

-- gallery_admins: cada usuario solo puede ver su propia fila (para que el panel sepa si es admin).
-- Nadie puede insertar desde la web: los admins se añaden a mano con SQL (ver README).
drop policy if exists "admins: ver la propia fila" on public.gallery_admins;
create policy "admins: ver la propia fila" on public.gallery_admins
  for select to authenticated using (user_id = (select auth.uid()));

-- Categorías: lectura pública, edición solo admins.
drop policy if exists "categorias: lectura publica" on public.gallery_categories;
create policy "categorias: lectura publica" on public.gallery_categories
  for select to anon, authenticated using (true);
drop policy if exists "categorias: admins escriben" on public.gallery_categories;
create policy "categorias: admins escriben" on public.gallery_categories
  for all to authenticated using (public.is_gallery_admin()) with check (public.is_gallery_admin());

-- Grupos: lectura pública, edición solo admins.
drop policy if exists "grupos: lectura publica" on public.gallery_groups;
create policy "grupos: lectura publica" on public.gallery_groups
  for select to anon, authenticated using (true);
drop policy if exists "grupos: admins escriben" on public.gallery_groups;
create policy "grupos: admins escriben" on public.gallery_groups
  for all to authenticated using (public.is_gallery_admin()) with check (public.is_gallery_admin());

-- Ítems: el público solo ve los visibles; los admins ven y editan todo.
drop policy if exists "items: lectura" on public.gallery_items;
create policy "items: lectura" on public.gallery_items
  for select to anon, authenticated using (visible or public.is_gallery_admin());
drop policy if exists "items: admins escriben" on public.gallery_items;
create policy "items: admins escriben" on public.gallery_items
  for all to authenticated using (public.is_gallery_admin()) with check (public.is_gallery_admin());

-- ---------- Almacenamiento (bucket "gallery") --------------------------

-- Bucket público (las imágenes se ven en la web), máx. 50 MB por fichero
-- y solo tipos de imagen / vídeo permitidos.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gallery', 'gallery', true, 52428800,
        array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Solo los admins suben, reemplazan o borran ficheros del bucket.
drop policy if exists "gallery: admins leen" on storage.objects;
create policy "gallery: admins leen" on storage.objects
  for select to authenticated using (bucket_id = 'gallery' and public.is_gallery_admin());
drop policy if exists "gallery: admins suben" on storage.objects;
create policy "gallery: admins suben" on storage.objects
  for insert to authenticated with check (bucket_id = 'gallery' and public.is_gallery_admin());
drop policy if exists "gallery: admins reemplazan" on storage.objects;
create policy "gallery: admins reemplazan" on storage.objects
  for update to authenticated using (bucket_id = 'gallery' and public.is_gallery_admin())
  with check (bucket_id = 'gallery' and public.is_gallery_admin());
drop policy if exists "gallery: admins borran" on storage.objects;
create policy "gallery: admins borran" on storage.objects
  for delete to authenticated using (bucket_id = 'gallery' and public.is_gallery_admin());

-- ---------- Categorías iniciales --------------------------------------

insert into public.gallery_categories (slug, title, subtitle, sort) values
  ('flyers',       'Flyers',           'Eventos, conciertos, urbanos, corporativos y más.',           1),
  ('animaciones',  'Animaciones',      'Motion design, flyers animados y visuales que cobran vida.',  2),
  ('social-media', 'Social Media',     'Identidad visual, carruseles y piezas para redes.',          3),
  ('diseno-marca', 'Diseño de Marca',  'Logotipos, identidad corporativa y papelería.',              4)
on conflict (slug) do nothing;
