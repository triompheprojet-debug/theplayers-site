export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action_type: string
          admin_id: string | null
          created_at: string
          description: string | null
          id: string
          ip_address: unknown
          metadata: Json
          player_id: string | null
          target_id: string | null
          target_table: string | null
          user_agent: string | null
        }
        Insert: {
          action_type: string
          admin_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json
          player_id?: string | null
          target_id?: string | null
          target_table?: string | null
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json
          player_id?: string | null
          target_id?: string | null
          target_table?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admin_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_accounts: {
        Row: {
          created_at: string
          created_by: string | null
          display_name: string
          failed_attempts: number
          id: string
          is_active: boolean
          last_login_at: string | null
          locked_until: string | null
          pin_hash: string
          role: Database["public"]["Enums"]["admin_role"]
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          display_name: string
          failed_attempts?: number
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          locked_until?: string | null
          pin_hash: string
          role: Database["public"]["Enums"]["admin_role"]
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          display_name?: string
          failed_attempts?: number
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          locked_until?: string | null
          pin_hash?: string
          role?: Database["public"]["Enums"]["admin_role"]
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_accounts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      app_config: {
        Row: {
          description: string | null
          id: string
          is_secret: boolean
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          is_secret?: boolean
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          id?: string
          is_secret?: boolean
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "app_config_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admin_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          doc_type: string
          file_size_bytes: number | null
          generated_at: string
          generated_by: string | null
          id: string
          is_valid: boolean
          player_id: string
          qr_encrypted_payload: string | null
          qr_signature: string | null
          qr_version: number
          registration_id: string
          storage_path: string
          tournament_id: string
        }
        Insert: {
          created_at?: string
          doc_type: string
          file_size_bytes?: number | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          is_valid?: boolean
          player_id: string
          qr_encrypted_payload?: string | null
          qr_signature?: string | null
          qr_version?: number
          registration_id: string
          storage_path: string
          tournament_id: string
        }
        Update: {
          created_at?: string
          doc_type?: string
          file_size_bytes?: number | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          is_valid?: boolean
          player_id?: string
          qr_encrypted_payload?: string | null
          qr_signature?: string | null
          qr_version?: number
          registration_id?: string
          storage_path?: string
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "admin_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "public_tournament_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          bracket_position: string | null
          console_number: number | null
          created_at: string
          forfeit_player_id: string | null
          forfeit_reason: string | null
          id: string
          match_number: number
          next_match_id: string | null
          next_match_slot: string | null
          played_at: string | null
          player_a_badge: number | null
          player_a_id: string | null
          player_b_badge: number | null
          player_b_id: string | null
          round_number: number
          scheduled_time: string | null
          score_a: number | null
          score_b: number | null
          scored_by: string | null
          status: Database["public"]["Enums"]["match_status"]
          tournament_id: string
          updated_at: string
          wave_number: number | null
          winner_id: string | null
        }
        Insert: {
          bracket_position?: string | null
          console_number?: number | null
          created_at?: string
          forfeit_player_id?: string | null
          forfeit_reason?: string | null
          id?: string
          match_number: number
          next_match_id?: string | null
          next_match_slot?: string | null
          played_at?: string | null
          player_a_badge?: number | null
          player_a_id?: string | null
          player_b_badge?: number | null
          player_b_id?: string | null
          round_number: number
          scheduled_time?: string | null
          score_a?: number | null
          score_b?: number | null
          scored_by?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          tournament_id: string
          updated_at?: string
          wave_number?: number | null
          winner_id?: string | null
        }
        Update: {
          bracket_position?: string | null
          console_number?: number | null
          created_at?: string
          forfeit_player_id?: string | null
          forfeit_reason?: string | null
          id?: string
          match_number?: number
          next_match_id?: string | null
          next_match_slot?: string | null
          played_at?: string | null
          player_a_badge?: number | null
          player_a_id?: string | null
          player_b_badge?: number | null
          player_b_id?: string | null
          round_number?: number
          scheduled_time?: string | null
          score_a?: number | null
          score_b?: number | null
          scored_by?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          tournament_id?: string
          updated_at?: string
          wave_number?: number | null
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_forfeit_player_id_fkey"
            columns: ["forfeit_player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_next_match_id_fkey"
            columns: ["next_match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_next_match_id_fkey"
            columns: ["next_match_id"]
            isOneToOne: false
            referencedRelation: "public_bracket_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_player_a_id_fkey"
            columns: ["player_a_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_player_b_id_fkey"
            columns: ["player_b_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_scored_by_fkey"
            columns: ["scored_by"]
            isOneToOne: false
            referencedRelation: "admin_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "public_tournament_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          allow_replies: boolean
          body: string
          broadcast_scope: string | null
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          id: string
          is_deleted: boolean
          parent_message_id: string | null
          read_at: string | null
          recipient_player_id: string | null
          scheduled_for: string | null
          sender_admin_id: string | null
          sender_player_id: string | null
          sender_type: string
          sent_at: string
          subject: string
          tournament_id: string | null
        }
        Insert: {
          allow_replies?: boolean
          body: string
          broadcast_scope?: string | null
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          is_deleted?: boolean
          parent_message_id?: string | null
          read_at?: string | null
          recipient_player_id?: string | null
          scheduled_for?: string | null
          sender_admin_id?: string | null
          sender_player_id?: string | null
          sender_type: string
          sent_at?: string
          subject: string
          tournament_id?: string | null
        }
        Update: {
          allow_replies?: boolean
          body?: string
          broadcast_scope?: string | null
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          is_deleted?: boolean
          parent_message_id?: string | null
          read_at?: string | null
          recipient_player_id?: string | null
          scheduled_for?: string | null
          sender_admin_id?: string | null
          sender_player_id?: string | null
          sender_type?: string
          sent_at?: string
          subject?: string
          tournament_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_recipient_player_id_fkey"
            columns: ["recipient_player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_admin_id_fkey"
            columns: ["sender_admin_id"]
            isOneToOne: false
            referencedRelation: "admin_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_player_id_fkey"
            columns: ["sender_player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "public_tournament_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          body: string | null
          created_at: string
          id: string
          notification_type: Database["public"]["Enums"]["notification_type"]
          payload: Json | null
          player_id: string
          read_at: string | null
          title: string
          tournament_id: string | null
        }
        Insert: {
          action_url?: string | null
          body?: string | null
          created_at?: string
          id?: string
          notification_type: Database["public"]["Enums"]["notification_type"]
          payload?: Json | null
          player_id: string
          read_at?: string | null
          title: string
          tournament_id?: string | null
        }
        Update: {
          action_url?: string | null
          body?: string | null
          created_at?: string
          id?: string
          notification_type?: Database["public"]["Enums"]["notification_type"]
          payload?: Json | null
          player_id?: string
          read_at?: string | null
          title?: string
          tournament_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "public_tournament_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_fcfa: number
          created_at: string
          id: string
          internal_note: string | null
          method: Database["public"]["Enums"]["payment_method"]
          player_id: string
          proof_file_url: string | null
          registration_id: string
          rejection_reason: string | null
          sender_name: string | null
          sender_phone: string | null
          status: Database["public"]["Enums"]["payment_status"]
          submitted_at: string
          time_slot: string | null
          tournament_id: string
          transaction_ref: string | null
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount_fcfa: number
          created_at?: string
          id?: string
          internal_note?: string | null
          method: Database["public"]["Enums"]["payment_method"]
          player_id: string
          proof_file_url?: string | null
          registration_id: string
          rejection_reason?: string | null
          sender_name?: string | null
          sender_phone?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          submitted_at?: string
          time_slot?: string | null
          tournament_id: string
          transaction_ref?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount_fcfa?: number
          created_at?: string
          id?: string
          internal_note?: string | null
          method?: Database["public"]["Enums"]["payment_method"]
          player_id?: string
          proof_file_url?: string | null
          registration_id?: string
          rejection_reason?: string | null
          sender_name?: string | null
          sender_phone?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          submitted_at?: string
          time_slot?: string | null
          tournament_id?: string
          transaction_ref?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "public_tournament_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "admin_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          best_finish: string | null
          blocked_until: string | null
          created_at: string
          first_name: string | null
          id: string
          is_blocked: boolean
          is_deleted: boolean
          last_name: string | null
          phone: string
          pseudo: string
          total_points: number
          tournaments_played: number
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          best_finish?: string | null
          blocked_until?: string | null
          created_at?: string
          first_name?: string | null
          id: string
          is_blocked?: boolean
          is_deleted?: boolean
          last_name?: string | null
          phone: string
          pseudo: string
          total_points?: number
          tournaments_played?: number
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          best_finish?: string | null
          blocked_until?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          is_blocked?: boolean
          is_deleted?: boolean
          last_name?: string | null
          phone?: string
          pseudo?: string
          total_points?: number
          tournaments_played?: number
          updated_at?: string
        }
        Relationships: []
      }
      qr_scan_log: {
        Row: {
          badge_number: number | null
          created_at: string
          error_message: string | null
          id: string
          ip_address: string | null
          player_id: string | null
          raw_payload: string | null
          result: string
          scanned_at: string
          scanned_by: string | null
          tournament_id: string | null
        }
        Insert: {
          badge_number?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          player_id?: string | null
          raw_payload?: string | null
          result: string
          scanned_at?: string
          scanned_by?: string | null
          tournament_id?: string | null
        }
        Update: {
          badge_number?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          player_id?: string | null
          raw_payload?: string | null
          result?: string
          scanned_at?: string
          scanned_by?: string | null
          tournament_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qr_scan_log_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_scan_log_scanned_by_fkey"
            columns: ["scanned_by"]
            isOneToOne: false
            referencedRelation: "admin_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_scan_log_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "public_tournament_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_scan_log_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      registrations: {
        Row: {
          badge_number: number | null
          cancelled_at: string | null
          confirmed_at: string | null
          created_at: string
          final_position: number | null
          final_round: string | null
          id: string
          notes: string | null
          player_id: string
          points_earned: number
          registered_at: string
          registered_by_admin: string | null
          registered_via: string
          rejected_at: string | null
          status: Database["public"]["Enums"]["registration_status"]
          tournament_id: string
          updated_at: string
        }
        Insert: {
          badge_number?: number | null
          cancelled_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          final_position?: number | null
          final_round?: string | null
          id?: string
          notes?: string | null
          player_id: string
          points_earned?: number
          registered_at?: string
          registered_by_admin?: string | null
          registered_via?: string
          rejected_at?: string | null
          status?: Database["public"]["Enums"]["registration_status"]
          tournament_id: string
          updated_at?: string
        }
        Update: {
          badge_number?: number | null
          cancelled_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          final_position?: number | null
          final_round?: string | null
          id?: string
          notes?: string | null
          player_id?: string
          points_earned?: number
          registered_at?: string
          registered_by_admin?: string | null
          registered_via?: string
          rejected_at?: string | null
          status?: Database["public"]["Enums"]["registration_status"]
          tournament_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "registrations_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_registered_by_admin_fkey"
            columns: ["registered_by_admin"]
            isOneToOne: false
            referencedRelation: "admin_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "public_tournament_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      season_standings: {
        Row: {
          best_finish: string | null
          current_rank: Database["public"]["Enums"]["player_rank"]
          id: string
          last_updated_at: string
          player_id: string
          qualified_grand_final: boolean
          season_id: string
          total_points: number
          tournaments_played: number
        }
        Insert: {
          best_finish?: string | null
          current_rank?: Database["public"]["Enums"]["player_rank"]
          id?: string
          last_updated_at?: string
          player_id: string
          qualified_grand_final?: boolean
          season_id: string
          total_points?: number
          tournaments_played?: number
        }
        Update: {
          best_finish?: string | null
          current_rank?: Database["public"]["Enums"]["player_rank"]
          id?: string
          last_updated_at?: string
          player_id?: string
          qualified_grand_final?: boolean
          season_id?: string
          total_points?: number
          tournaments_played?: number
        }
        Relationships: [
          {
            foreignKeyName: "season_standings_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "season_standings_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string
          expected_tournaments: number
          id: string
          is_deleted: boolean
          name: string
          qualification_threshold: number
          season_number: number
          start_date: string
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date: string
          expected_tournaments?: number
          id?: string
          is_deleted?: boolean
          name: string
          qualification_threshold: number
          season_number: number
          start_date: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string
          expected_tournaments?: number
          id?: string
          is_deleted?: boolean
          name?: string
          qualification_threshold?: number
          season_number?: number
          start_date?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seasons_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seasons_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admin_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_standings: {
        Row: {
          finalized_at: string
          goals_conceded: number
          goals_scored: number
          id: string
          matches_lost: number
          matches_played: number
          matches_won: number
          player_id: string
          points_earned: number
          position: number
          round_reached: string
          tournament_id: string
        }
        Insert: {
          finalized_at?: string
          goals_conceded?: number
          goals_scored?: number
          id?: string
          matches_lost?: number
          matches_played?: number
          matches_won?: number
          player_id: string
          points_earned?: number
          position: number
          round_reached: string
          tournament_id: string
        }
        Update: {
          finalized_at?: string
          goals_conceded?: number
          goals_scored?: number
          id?: string
          matches_lost?: number
          matches_played?: number
          matches_won?: number
          player_id?: string
          points_earned?: number
          position?: number
          round_reached?: string
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_standings_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_standings_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "public_tournament_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_standings_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          bracket_visibility: string
          capacity: number
          config: Json
          created_at: string
          created_by: string | null
          end_date: string
          id: string
          is_deleted: boolean
          is_registrations_open: boolean
          name: string
          registration_closes_at: string | null
          registration_opens_at: string | null
          runner_up_player_id: string | null
          season_id: string | null
          start_date: string
          status: Database["public"]["Enums"]["tournament_status"]
          third_player_id: string | null
          tournament_number: number | null
          tournament_type: Database["public"]["Enums"]["tournament_type"]
          updated_at: string
          updated_by: string | null
          winner_player_id: string | null
        }
        Insert: {
          bracket_visibility?: string
          capacity: number
          config?: Json
          created_at?: string
          created_by?: string | null
          end_date: string
          id?: string
          is_deleted?: boolean
          is_registrations_open?: boolean
          name: string
          registration_closes_at?: string | null
          registration_opens_at?: string | null
          runner_up_player_id?: string | null
          season_id?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["tournament_status"]
          third_player_id?: string | null
          tournament_number?: number | null
          tournament_type: Database["public"]["Enums"]["tournament_type"]
          updated_at?: string
          updated_by?: string | null
          winner_player_id?: string | null
        }
        Update: {
          bracket_visibility?: string
          capacity?: number
          config?: Json
          created_at?: string
          created_by?: string | null
          end_date?: string
          id?: string
          is_deleted?: boolean
          is_registrations_open?: boolean
          name?: string
          registration_closes_at?: string | null
          registration_opens_at?: string | null
          runner_up_player_id?: string | null
          season_id?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["tournament_status"]
          third_player_id?: string | null
          tournament_number?: number | null
          tournament_type?: Database["public"]["Enums"]["tournament_type"]
          updated_at?: string
          updated_by?: string | null
          winner_player_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournaments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournaments_runner_up_player_id_fkey"
            columns: ["runner_up_player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournaments_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournaments_third_player_id_fkey"
            columns: ["third_player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournaments_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admin_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournaments_winner_player_id_fkey"
            columns: ["winner_player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_app_config_view: {
        Row: {
          description: string | null
          key: string | null
          updated_at: string | null
          value: Json | null
        }
        Insert: {
          description?: string | null
          key?: string | null
          updated_at?: string | null
          value?: Json | null
        }
        Update: {
          description?: string | null
          key?: string | null
          updated_at?: string | null
          value?: Json | null
        }
        Relationships: []
      }
      public_bracket_view: {
        Row: {
          bracket_position: string | null
          console_number: number | null
          id: string | null
          match_number: number | null
          next_match_id: string | null
          next_match_slot: string | null
          player_a_badge: number | null
          player_a_pseudo: string | null
          player_b_badge: number | null
          player_b_pseudo: string | null
          round_number: number | null
          scheduled_time: string | null
          score_a: number | null
          score_b: number | null
          status: Database["public"]["Enums"]["match_status"] | null
          tournament_id: string | null
          wave_number: number | null
          winner_side: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_next_match_id_fkey"
            columns: ["next_match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_next_match_id_fkey"
            columns: ["next_match_id"]
            isOneToOne: false
            referencedRelation: "public_bracket_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "public_tournament_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      public_leaderboard_view: {
        Row: {
          avatar_url: string | null
          current_rank: Database["public"]["Enums"]["player_rank"] | null
          position: number | null
          pseudo: string | null
          season_id: string | null
          total_points: number | null
        }
        Relationships: [
          {
            foreignKeyName: "season_standings_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      public_tournament_view: {
        Row: {
          bracket_visibility: string | null
          consoles_info: Json | null
          created_at: string | null
          end_date: string | null
          game_info: Json | null
          id: string | null
          is_registrations_open: boolean | null
          location_info: Json | null
          match_info: Json | null
          name: string | null
          prizes: Json | null
          registration_closes_at: string | null
          registration_info: Json | null
          registration_opens_at: string | null
          rules_info: Json | null
          runner_up_player_id: string | null
          schedule_info: Json | null
          season_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["tournament_status"] | null
          third_player_id: string | null
          tournament_number: number | null
          tournament_type: Database["public"]["Enums"]["tournament_type"] | null
          updated_at: string | null
          winner_player_id: string | null
        }
        Insert: {
          bracket_visibility?: string | null
          consoles_info?: never
          created_at?: string | null
          end_date?: string | null
          game_info?: never
          id?: string | null
          is_registrations_open?: boolean | null
          location_info?: never
          match_info?: never
          name?: string | null
          prizes?: never
          registration_closes_at?: string | null
          registration_info?: never
          registration_opens_at?: string | null
          rules_info?: never
          runner_up_player_id?: string | null
          schedule_info?: never
          season_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["tournament_status"] | null
          third_player_id?: string | null
          tournament_number?: number | null
          tournament_type?:
            | Database["public"]["Enums"]["tournament_type"]
            | null
          updated_at?: string | null
          winner_player_id?: string | null
        }
        Update: {
          bracket_visibility?: string | null
          consoles_info?: never
          created_at?: string | null
          end_date?: string | null
          game_info?: never
          id?: string | null
          is_registrations_open?: boolean | null
          location_info?: never
          match_info?: never
          name?: string | null
          prizes?: never
          registration_closes_at?: string | null
          registration_info?: never
          registration_opens_at?: string | null
          rules_info?: never
          runner_up_player_id?: string | null
          schedule_info?: never
          season_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["tournament_status"] | null
          third_player_id?: string | null
          tournament_number?: number | null
          tournament_type?:
            | Database["public"]["Enums"]["tournament_type"]
            | null
          updated_at?: string | null
          winner_player_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournaments_runner_up_player_id_fkey"
            columns: ["runner_up_player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournaments_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournaments_third_player_id_fkey"
            columns: ["third_player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournaments_winner_player_id_fkey"
            columns: ["winner_player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      advance_winner_in_bracket: {
        Args: { p_match_id: string }
        Returns: undefined
      }
      assign_badge_number: {
        Args: { p_registration_id: string }
        Returns: number
      }
      get_active_tournament: {
        Args: never
        Returns: {
          bracket_visibility: string
          consoles_info: Json
          end_date: string
          game_info: Json
          id: string
          is_registrations_open: boolean
          location_info: Json
          match_info: Json
          name: string
          prizes: Json
          registration_closes_at: string
          registration_info: Json
          registration_opens_at: string
          rules_info: Json
          schedule_info: Json
          season_id: string
          start_date: string
          status: Database["public"]["Enums"]["tournament_status"]
          tournament_number: number
          tournament_type: Database["public"]["Enums"]["tournament_type"]
        }[]
      }
      get_app_config: { Args: { p_key: string }; Returns: Json }
      is_bracket_published: {
        Args: { p_tournament_id: string }
        Returns: boolean
      }
    }
    Enums: {
      admin_role: "super_admin" | "admin" | "referee"
      job_status: "pending" | "running" | "done" | "failed" | "cancelled"
      job_type:
        | "payment_reminder"
        | "registration_closing"
        | "bracket_auto_publish"
        | "tournament_auto_start"
        | "tournament_auto_archive"
        | "season_standings_refresh"
        | "document_generation"
        | "notification_dispatch"
      match_status:
        | "scheduled"
        | "in_progress"
        | "completed"
        | "forfeit"
        | "cancelled"
      notification_type:
        | "payment_confirmed"
        | "payment_rejected"
        | "registration_reminder"
        | "bracket_published"
        | "match_upcoming"
        | "tournament_starting"
        | "admin_message"
        | "badge_ready"
      payment_method: "mtn_mobile_money" | "airtel_money" | "cash"
      payment_status: "pending" | "confirmed" | "rejected"
      player_rank: "bronze" | "silver" | "gold" | "diamond" | "legend"
      registration_status:
        | "reserved"
        | "awaiting_verification"
        | "confirmed"
        | "rejected"
        | "cancelled"
      tournament_status:
        | "draft"
        | "registrations_open"
        | "registrations_closed"
        | "in_progress"
        | "completed"
        | "archived"
      tournament_type: "off_season" | "season" | "grand_final"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      admin_role: ["super_admin", "admin", "referee"],
      job_status: ["pending", "running", "done", "failed", "cancelled"],
      job_type: [
        "payment_reminder",
        "registration_closing",
        "bracket_auto_publish",
        "tournament_auto_start",
        "tournament_auto_archive",
        "season_standings_refresh",
        "document_generation",
        "notification_dispatch",
      ],
      match_status: [
        "scheduled",
        "in_progress",
        "completed",
        "forfeit",
        "cancelled",
      ],
      notification_type: [
        "payment_confirmed",
        "payment_rejected",
        "registration_reminder",
        "bracket_published",
        "match_upcoming",
        "tournament_starting",
        "admin_message",
        "badge_ready",
      ],
      payment_method: ["mtn_mobile_money", "airtel_money", "cash"],
      payment_status: ["pending", "confirmed", "rejected"],
      player_rank: ["bronze", "silver", "gold", "diamond", "legend"],
      registration_status: [
        "reserved",
        "awaiting_verification",
        "confirmed",
        "rejected",
        "cancelled",
      ],
      tournament_status: [
        "draft",
        "registrations_open",
        "registrations_closed",
        "in_progress",
        "completed",
        "archived",
      ],
      tournament_type: ["off_season", "season", "grand_final"],
    },
  },
} as const
