-- messages_reply_limit.sql
-- Quota de reponses joueur (M12, correctif).
--
-- Regle : un joueur peut envoyer AU PLUS 2 reponses par message admin, decomptees
-- depuis le DERNIER message admin du fil (le message racine, ou plus tard une
-- relance admin dans le meme fil). Des qu'un nouveau message admin arrive dans le
-- fil, le repere avance et le quota du joueur se reinitialise automatiquement.
--
-- Pose en trigger BEFORE INSERT : couvre le chemin reel (Server Action ->
-- service_role) que la RLS ne filtre pas. Idempotent (re-executable sans risque).
-- Aucune modification de schema (pas de colonne / table / enum) -> `pnpm db:types`
-- NON requis.

create or replace function public.enforce_player_reply_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cutoff timestamptz;
  v_count  integer;
begin
  -- Ne concerne que les reponses joueur rattachees a un fil.
  if new.sender_type = 'player' and new.parent_message_id is not null then

    -- Repere = dernier message admin du fil (racine OU relance admin in-thread).
    select max(a.sent_at)
      into v_cutoff
    from public.messages a
    where (a.id = new.parent_message_id or a.parent_message_id = new.parent_message_id)
      and a.sender_type = 'admin';

    -- Reponses joueur DEJA presentes dans le fil depuis ce repere.
    select count(*)
      into v_count
    from public.messages s
    where s.parent_message_id = new.parent_message_id
      and s.sender_type = 'player'
      and s.sent_at > coalesce(v_cutoff, '1970-01-01T00:00:00Z'::timestamptz);

    if v_count >= 2 then
      raise exception 'reply_limit_reached'
        using errcode = 'check_violation',
              hint = 'Le joueur a deja utilise ses 2 reponses depuis le dernier message admin.';
    end if;

  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_player_reply_limit on public.messages;

create trigger trg_enforce_player_reply_limit
  before insert on public.messages
  for each row
  execute function public.enforce_player_reply_limit();