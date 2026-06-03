-- =====================================================================
-- Migration 10 — Table `documents` (reçus + badges officiels) — M11
-- =====================================================================
-- Le fichier 10_create_documents.sql existait mais était vide.
-- À appliquer dans le SQL Editor cloud (theplayers-prod) puis `pnpm db:types`.
-- Idempotent (IF NOT EXISTS / DROP POLICY IF EXISTS).
--
-- Décision M11 : UNIQUE (registration_id, doc_type) — une seule ligne par
-- (inscription, type). La régénération MET À JOUR cette ligne (is_valid,
-- qr_version, payload) au lieu d'en créer une nouvelle (UPSERT côté code).
-- =====================================================================

create table if not exists public.documents (
  id                    uuid primary key default gen_random_uuid(),

  -- Liens
  registration_id       uuid not null references public.registrations(id) on delete cascade,
  tournament_id         uuid not null references public.tournaments(id),
  player_id             uuid not null references public.profiles(id),

  -- Fichier
  doc_type              text not null,
  storage_path          text not null,
  file_size_bytes       int,

  -- Sécurité QR (badge)
  qr_encrypted_payload  text,
  qr_signature          text,
  qr_version            int  not null default 1,

  -- Génération
  generated_at          timestamptz not null default now(),
  generated_by          uuid references public.admin_accounts(id),
  is_valid              boolean not null default true,  -- false si clé QR régénérée

  created_at            timestamptz not null default now(),

  constraint documents_doc_type_check
    check (doc_type in ('receipt_badge', 'bracket', 'rulebook'))
);

-- Une seule ligne valide par (inscription, type) → support de l'UPSERT.
create unique index if not exists uq_documents_registration_doctype
  on public.documents (registration_id, doc_type);

create index if not exists idx_documents_registration on public.documents (registration_id);
create index if not exists idx_documents_tournament   on public.documents (tournament_id);
create index if not exists idx_documents_player        on public.documents (player_id);

-- RLS : le joueur lit SES documents. Admin = service_role (bypass RLS).
alter table public.documents enable row level security;

drop policy if exists documents_select_own on public.documents;
create policy documents_select_own
  on public.documents
  for select
  to authenticated
  using (player_id = auth.uid());