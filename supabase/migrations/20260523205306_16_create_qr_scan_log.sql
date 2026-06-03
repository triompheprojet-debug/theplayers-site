-- =====================================================================
-- Migration 16 — Table `qr_scan_log` (journal des scans QR) — M11
-- =====================================================================
-- Le fichier 16_create_qr_scan_log.sql existait mais était vide.
-- Audit complet des scans le jour J : qui / quand / résultat / ip.
-- Écriture & lecture par service_role uniquement (admin = auth custom) →
-- pas de policy `authenticated`.
-- =====================================================================

create table if not exists public.qr_scan_log (
  id              uuid primary key default gen_random_uuid(),

  -- Résultat de la validation
  result          text not null,

  -- Données identifiées (si déchiffrement possible)
  player_id       uuid references public.profiles(id),
  tournament_id   uuid references public.tournaments(id),
  badge_number    int,

  -- Contexte
  scanned_at      timestamptz not null default now(),
  scanned_by      uuid references public.admin_accounts(id),
  ip_address      text,

  -- Debug
  raw_payload     text,
  error_message   text,

  created_at      timestamptz not null default now(),

  constraint qr_scan_log_result_check check (
    result in (
      'valid',
      'invalid_signature',
      'wrong_tournament',
      'already_scanned',
      'corrupted',
      'unknown_player'
    )
  )
);

create index if not exists idx_qr_scan_player     on public.qr_scan_log (player_id);
create index if not exists idx_qr_scan_tournament on public.qr_scan_log (tournament_id);
create index if not exists idx_qr_scan_date       on public.qr_scan_log (scanned_at);

-- RLS active sans policy authenticated → service_role only.
alter table public.qr_scan_log enable row level security;