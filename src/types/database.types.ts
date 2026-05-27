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
            foreignKeyName: "tournaments_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournaments_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admin_accounts"
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
            foreignKeyName: "tournaments_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
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
