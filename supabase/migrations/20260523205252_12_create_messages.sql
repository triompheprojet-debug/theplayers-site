-- =============================================================================
-- 12_create_messages.sql  —  Module M12 (Messagerie admin <-> joueur)
-- =============================================================================
-- Envois admin -> joueur (unitaire OU broadcast : UNE ligne par destinataire,
-- décision B) + réponses contrôlées joueur -> admin.
--
-- Schéma conforme à 04_modele_donnees.md §4.13. La contrainte de routage est
-- ELARGIE (décision A) pour autoriser les réponses joueur, qui n'ont ni
-- recipient_player_id (les admins ne sont pas dans profiles) ni broadcast_scope.
--
-- Idempotent : ré-exécutable sans erreur.
-- A appliquer dans le SQL Editor cloud, puis `pnpm db:types`.
-- =============================================================================

create table if not exists public.messages (
  id                  uuid primary key default gen_random_uuid(),

  -- Direction
  sender_type         text not null,
  sender_admin_id     uuid references public.admin_accounts(id),
  sender_player_id    uuid references public.profiles(id),

  -- Destinataire (un joueur) ou broadcast
  recipient_player_id uuid references public.profiles(id),
  broadcast_scope     text,
  tournament_id       uuid references public.tournaments(id),

  -- Contenu
  subject             text not null,
  body                text not null,

  -- Reponse
  allow_replies       boolean not null default false,
  parent_message_id   uuid references public.messages(id) on delete set null,

  -- Lecture
  read_at             timestamptz,

  -- Envoi
  sent_at             timestamptz not null default now(),
  scheduled_for       timestamptz,

  created_at          timestamptz not null default now(),

  constraint messages_sender_type
    check (sender_type in ('admin', 'player', 'system')),

  -- Routage elargi (decision A) : destinataire OU broadcast OU reponse joueur.
  constraint messages_routing check (
    recipient_player_id is not null
    or broadcast_scope is not null
    or (sender_type = 'player' and parent_message_id is not null)
  )
);

-- ----------------------------------------------------------------------------
-- Index
-- ----------------------------------------------------------------------------
create index if not exists idx_messages_recipient
  on public.messages (recipient_player_id, sent_at desc);

create index if not exists idx_messages_unread
  on public.messages (recipient_player_id) where read_at is null;

create index if not exists idx_messages_broadcast
  on public.messages (broadcast_scope, sent_at desc);

-- Boite de reception admin (« recus ») : reponses joueur, plus recentes d'abord.
create index if not exists idx_messages_player_replies
  on public.messages (sent_at desc) where sender_type = 'player';

-- Fil de discussion (reponses rattachees a un parent).
create index if not exists idx_messages_parent
  on public.messages (parent_message_id);

-- ----------------------------------------------------------------------------
-- RLS  —  conventions du projet : role `authenticated`, `auth.uid()`.
-- L'admin lit/ecrit en service_role (bypass RLS) -> aucune policy admin requise.
-- (Bloc deplacable dans 20_create_rls_policies.sql si tu preferes regrouper.)
-- ----------------------------------------------------------------------------
alter table public.messages enable row level security;

-- Lecture : le joueur voit les messages qui lui sont adresses ET ses reponses.
drop policy if exists messages_select_own on public.messages;
create policy messages_select_own
  on public.messages
  for select
  to authenticated
  using (
    recipient_player_id = auth.uid()
    or sender_player_id = auth.uid()
  );

-- Insertion : le joueur ne peut inserer QU'UNE reponse, et seulement si le
-- message parent lui etait adresse et autorise les reponses (allow_replies).
-- Revérifie aussi cote serveur dans replies.ts (defense en profondeur).
drop policy if exists messages_insert_reply on public.messages;
create policy messages_insert_reply
  on public.messages
  for insert
  to authenticated
  with check (
    sender_type = 'player'
    and sender_player_id = auth.uid()
    and parent_message_id is not null
    and exists (
      select 1
      from public.messages parent
      where parent.id = messages.parent_message_id
        and parent.recipient_player_id = auth.uid()
        and parent.allow_replies = true
    )
  );

-- NB : le marquage « lu » (read_at) est effectue cote serveur en service_role
-- a l'ouverture du message par le joueur (Etape 2). Pas de policy UPDATE
-- joueur ici : RLS ne restreint pas les colonnes, on evite ainsi qu'un joueur
-- puisse modifier subject/body/allow_replies de ses messages recus.