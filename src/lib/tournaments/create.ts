/**
 * Création d'un tournoi (M03).
 *
 * Trois variantes factorisées :
 *   - Hors Saison       (type='off_season', season_id NULL)
 *   - Tournoi en Saison (type='season', season_id + tournament_number requis)
 *   - Grande Finale     (type='grand_final', season_id requis, pas de number)
 *
 * Toutes utilisent le service_role (RLS bloquante sur tournaments).
 * Toutes journalisent dans activity_log.
 *
 * Le status est forcé à 'draft' à la création (Règle DB).
 * Aucun retry : risque de doublon (le tournoi serait créé 2× sans contrainte
 * d'idempotence supplémentaire).
 */
import 'server-only'

import { logActivity } from '@/lib/activity/log'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import type {
  GrandFinalCreateInput,
  OffSeasonCreateInput,
  SeasonTournamentCreateInput,
} from '@/lib/validation/tournament'

import type { Database } from '@/types/database.types'

type TournamentInsert =
  Database['public']['Tables']['tournaments']['Insert']

// ---------------------------------------------------------------------------
// Type union discriminé pour les 3 variantes
// ---------------------------------------------------------------------------
export type CreateTournamentArgs =
  | { kind: 'off_season'; input: OffSeasonCreateInput }
  | { kind: 'season'; input: SeasonTournamentCreateInput }
  | { kind: 'grand_final'; input: GrandFinalCreateInput }

export interface CreateTournamentResult {
  id: string
}

/**
 * Crée un tournoi de l'un des 3 types et journalise l'action.
 *
 * Lève une erreur en cas d'échec (à attraper dans la Server Action
 * pour retourner un `actionError`).
 *
 * @param args     - Variante + input validé par Zod
 * @param adminId  - UUID de l'admin créateur (depuis getAdminSession)
 */
export async function createTournament(
  args: CreateTournamentArgs,
  adminId: string,
): Promise<CreateTournamentResult> {
  const supabase = createServiceRoleClient()

  // ---------------------------------------------------------------
  // Construction de l'insert selon le type
  // ---------------------------------------------------------------
  const base = buildBaseInsert(args.input, adminId)

  let insert: TournamentInsert
  if (args.kind === 'off_season') {
    insert = {
      ...base,
      tournament_type: 'off_season',
      season_id: null,
      tournament_number: null,
    }
  } else if (args.kind === 'season') {
    insert = {
      ...base,
      tournament_type: 'season',
      season_id: args.input.season_id,
      tournament_number: args.input.tournament_number,
    }
  } else {
    insert = {
      ...base,
      tournament_type: 'grand_final',
      season_id: args.input.season_id,
      tournament_number: null,
    }
  }

  // ---------------------------------------------------------------
  // INSERT
  // ---------------------------------------------------------------
  const { data, error } = await supabase
    .from('tournaments')
    .insert(insert)
    .select('id')
    .single()

  if (error || !data) {
    throw new Error(
      `Création du tournoi impossible : ${error?.message ?? 'erreur inconnue'}`,
    )
  }

  // ---------------------------------------------------------------
  // Audit log (best-effort, ne bloque pas)
  // ---------------------------------------------------------------
  await logActivity({
    adminId,
    actionType: 'tournament_created',
    targetTable: 'tournaments',
    targetId: data.id,
    description: `Création tournoi "${insert.name}" (${args.kind})`,
    metadata: {
      tournament_type: insert.tournament_type,
      season_id: insert.season_id,
      tournament_number: insert.tournament_number,
      start_date: insert.start_date,
      end_date: insert.end_date,
      // PAS de capacity dans le log (Règle 1 — confidentiel)
    },
  })

  return { id: data.id }
}

/**
 * Construit la partie commune de l'insert à partir de l'input validé.
 * Note : les 3 inputs partagent les mêmes champs `tournamentBaseShape`
 * (cf. tournament.ts) → on peut accepter le supertype.
 */
function buildBaseInsert(
  input: OffSeasonCreateInput | SeasonTournamentCreateInput | GrandFinalCreateInput,
  adminId: string,
): Omit<
  TournamentInsert,
  'tournament_type' | 'season_id' | 'tournament_number'
> {
  return {
    name: input.name,
    start_date: input.start_date,
    end_date: input.end_date,
    registration_opens_at: input.registration_opens_at ?? null,
    registration_closes_at: input.registration_closes_at ?? null,
    capacity: input.capacity,
    config: input.config as never,
    status: 'draft',
    is_registrations_open: false,
    bracket_visibility: 'draft',
    is_deleted: false,
    created_by: adminId,
    updated_by: adminId,
  }
}