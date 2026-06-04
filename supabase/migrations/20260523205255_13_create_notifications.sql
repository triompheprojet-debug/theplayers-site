-- =============================================================================
-- 13_create_notifications.sql  —  Module M13 (Notifications in-app)
-- =============================================================================
-- Table des notifications joueur (temps reel via Supabase Realtime) + RLS +
-- triggers d'EMISSION automatique depuis les flux existants (paiement, badge,
-- message admin). Conception autonome : AUCUNE modification de M10/M11/M12.
--
-- Schema conforme a 04_modele_donnees.md §4.14. Idempotent.
-- A appliquer en SQL Editor cloud, puis `pnpm db:types`.
-- =============================================================================

create table if not exists public.notifications (
  id                uuid primary key default gen_random_uuid(),

  player_id         uuid not null references public.profiles(id) on delete cascade,
  notification_type notification_type not null,

  title             text not null,
  body              text,

  -- Contexte
  tournament_id     uuid references public.tournaments(id),
  payload           jsonb,

  -- Lecture
  read_at           timestamptz,

  -- Lien cliquable optionnel
  action_url        text,

  created_at        timestamptz not null default now()
);

create index if not exists idx_notifications_player
  on public.notifications (player_id, created_at desc);

create index if not exists idx_notifications_unread
  on public.notifications (player_id) where read_at is null;

-- ----------------------------------------------------------------------------
-- RLS : le joueur lit/maj UNIQUEMENT ses notifications. Insertion = trigger
-- (definer) / service_role. Pas de policy INSERT/DELETE pour authenticated.
-- ----------------------------------------------------------------------------
alter table public.notifications enable row level security;

drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own
  on public.notifications
  for select
  to authenticated
  using (player_id = auth.uid());

-- Le joueur peut marquer comme lu (read_at). Un trigger garde-fou empeche de
-- modifier toute autre colonne (RLS ne filtre pas au niveau colonne).
drop policy if exists notifications_update_read on public.notifications;
create policy notifications_update_read
  on public.notifications
  for update
  to authenticated
  using (player_id = auth.uid())
  with check (player_id = auth.uid());

create or replace function public.protect_notification_columns()
returns trigger
language plpgsql
as $$
begin
  -- auth.uid() non nul = contexte joueur (client RLS). service_role = NULL = libre.
  if auth.uid() is not null then
    new.id                := old.id;
    new.player_id         := old.player_id;
    new.notification_type := old.notification_type;
    new.title             := old.title;
    new.body              := old.body;
    new.tournament_id     := old.tournament_id;
    new.payload           := old.payload;
    new.action_url        := old.action_url;
    new.created_at        := old.created_at;
    -- seul read_at reste modifiable
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notifications_protect_columns on public.notifications;
create trigger trg_notifications_protect_columns
  before update on public.notifications
  for each row execute function public.protect_notification_columns();

-- ----------------------------------------------------------------------------
-- EMISSION AUTOMATIQUE (triggers) — autonomie M13, zero retouche M10/M11/M12.
-- Fonctions SECURITY DEFINER : l'insertion contourne la RLS notifications.
-- ----------------------------------------------------------------------------

-- 1) Paiement confirme / rejete (table payments, M09/M10)
create or replace function public.notify_on_payment_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'confirmed' and old.status is distinct from 'confirmed' then
    insert into public.notifications (player_id, notification_type, title, body, tournament_id, action_url)
    values (new.player_id, 'payment_confirmed', 'Paiement confirme',
            'Ton inscription est confirmee. Ton badge officiel arrive.',
            new.tournament_id, '/joueur/documents');
  elsif new.status = 'rejected' and old.status is distinct from 'rejected' then
    insert into public.notifications (player_id, notification_type, title, body, tournament_id, action_url)
    values (new.player_id, 'payment_rejected', 'Paiement rejete',
            'Ta preuve de paiement a ete rejetee. Verifie et renvoie-la.',
            new.tournament_id, '/joueur/paiement');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_payments_notify on public.payments;
create trigger trg_payments_notify
  after update on public.payments
  for each row execute function public.notify_on_payment_status();

-- 2) Badge officiel pret (table documents, M11)
create or replace function public.notify_on_document_ready()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.doc_type = 'receipt_badge' and new.is_valid = true
     and (tg_op = 'INSERT' or old.is_valid is distinct from true) then
    insert into public.notifications (player_id, notification_type, title, body, tournament_id, action_url)
    values (new.player_id, 'badge_ready', 'Badge pret',
            'Ton badge officiel (recu + QR) est disponible au telechargement.',
            new.tournament_id, '/joueur/documents');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_documents_notify on public.documents;
create trigger trg_documents_notify
  after insert or update on public.documents
  for each row execute function public.notify_on_document_ready();

-- 3) Message admin -> joueur (table messages, M12). Exclut les reponses joueur.
create or replace function public.notify_on_admin_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.sender_type = 'admin' and new.recipient_player_id is not null then
    insert into public.notifications (player_id, notification_type, title, body, tournament_id, action_url)
    values (new.recipient_player_id, 'admin_message', 'Nouveau message',
            new.subject, new.tournament_id, '/joueur/messages/' || new.id::text);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_messages_notify on public.messages;
create trigger trg_messages_notify
  after insert on public.messages
  for each row execute function public.notify_on_admin_message();

-- ----------------------------------------------------------------------------
-- Realtime : publier la table pour les souscriptions postgres_changes.
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end
$$;