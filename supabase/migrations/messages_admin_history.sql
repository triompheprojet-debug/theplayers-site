-- messages_admin_history.sql
-- Historique admin : voir / modifier / supprimer les messages envoyes.
--
--  * is_deleted + deleted_at : suppression DOUCE (le message disparait cote
--    admin ET joueur, mais reste en base pour l'audit).
--  * edited_at : marqueur de modification (NULL = jamais modifie).
--
-- La RLS `messages_select_own` est mise a jour pour masquer les messages
-- supprimes cote joueur (l'admin lit en service_role, hors RLS, et filtre
-- explicitement). Index partiel pour la liste admin.
--
-- CHANGE LE SCHEMA -> lancer `pnpm db:types` apres execution. Idempotent.

alter table public.messages
  add column if not exists is_deleted boolean not null default false,
  add column if not exists deleted_at timestamptz,
  add column if not exists edited_at  timestamptz;

-- Masque les messages supprimes cote joueur (recus + ses propres reponses).
drop policy if exists messages_select_own on public.messages;
create policy messages_select_own on public.messages
  for select to authenticated
  using (
    is_deleted = false
    and (recipient_player_id = auth.uid() or sender_player_id = auth.uid())
  );

-- Liste admin : ses messages envoyes, non supprimes, par date.
create index if not exists idx_messages_admin_sent
  on public.messages (sender_admin_id, sent_at desc)
  where sender_type = 'admin' and is_deleted = false;