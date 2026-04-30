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
  public: {
    Tables: {
      contractor_profiles: {
        Row: {
          company_name: string
          created_at: string
          id: string
          max_labour_per_day: number
          total_hired_today: number
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name: string
          created_at?: string
          id?: string
          max_labour_per_day?: number
          total_hired_today?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string
          created_at?: string
          id?: string
          max_labour_per_day?: number
          total_hired_today?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contractor_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          admin_resolution: string | null
          against_user: string
          agreement_id: string | null
          amount_agreed: number
          amount_claimed: number
          created_at: string
          description: string | null
          evidence_url: string | null
          id: string
          raised_by: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_resolution?: string | null
          against_user: string
          agreement_id?: string | null
          amount_agreed?: number
          amount_claimed?: number
          created_at?: string
          description?: string | null
          evidence_url?: string | null
          id?: string
          raised_by: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_resolution?: string | null
          against_user?: string
          agreement_id?: string | null
          amount_agreed?: number
          amount_claimed?: number
          created_at?: string
          description?: string | null
          evidence_url?: string | null
          id?: string
          raised_by?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_agreement_id_fkey"
            columns: ["agreement_id"]
            isOneToOne: false
            referencedRelation: "wage_agreements"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_claims: {
        Row: {
          admin_note: string | null
          claim_amount: number
          created_at: string
          description: string | null
          evidence_url: string | null
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          claim_amount: number
          created_at?: string
          description?: string | null
          evidence_url?: string | null
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          claim_amount?: number
          created_at?: string
          description?: string | null
          evidence_url?: string | null
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      insurance_pool: {
        Row: {
          created_at: string
          id: string
          is_opted_in: boolean
          total_contributed: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_opted_in?: boolean
          total_contributed?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_opted_in?: boolean
          total_contributed?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          contractor_id: string
          created_at: string
          description: string | null
          duration_days: number | null
          id: string
          is_urgent: boolean
          location: string
          pin_code: string | null
          price_offered: number
          required_skill: string
          start_date: string | null
          status: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at: string
          wage_per_day: number | null
          work_type: string
        }
        Insert: {
          contractor_id: string
          created_at?: string
          description?: string | null
          duration_days?: number | null
          id?: string
          is_urgent?: boolean
          location: string
          pin_code?: string | null
          price_offered?: number
          required_skill: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at?: string
          wage_per_day?: number | null
          work_type: string
        }
        Update: {
          contractor_id?: string
          created_at?: string
          description?: string | null
          duration_days?: number | null
          id?: string
          is_urgent?: boolean
          location?: string
          pin_code?: string | null
          price_offered?: number
          required_skill?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          title?: string
          updated_at?: string
          wage_per_day?: number | null
          work_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      labour_profiles: {
        Row: {
          bio: string | null
          created_at: string
          experience_years: number
          id: string
          is_available: boolean
          price_per_day: number
          skill: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          experience_years?: number
          id?: string
          is_available?: boolean
          price_per_day?: number
          skill: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          experience_years?: number
          id?: string
          is_available?: boolean
          price_per_day?: number
          skill?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "labour_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          title: string | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          title?: string | null
          type?: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string | null
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          is_available: boolean
          location: string | null
          phone: string | null
          pin_code: string | null
          profile_image_url: string | null
          rating_avg: number
          rating_count: number
          updated_at: string
          work_passport_token: string | null
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          is_available?: boolean
          location?: string | null
          phone?: string | null
          pin_code?: string | null
          profile_image_url?: string | null
          rating_avg?: number
          rating_count?: number
          updated_at?: string
          work_passport_token?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          is_available?: boolean
          location?: string | null
          phone?: string | null
          pin_code?: string | null
          profile_image_url?: string | null
          rating_avg?: number
          rating_count?: number
          updated_at?: string
          work_passport_token?: string | null
        }
        Relationships: []
      }
      ratings: {
        Row: {
          comment: string | null
          created_at: string
          given_by: string
          given_to: string
          id: string
          job_id: string | null
          score: number
          skill_verified: boolean
        }
        Insert: {
          comment?: string | null
          created_at?: string
          given_by: string
          given_to: string
          id?: string
          job_id?: string | null
          score: number
          skill_verified?: boolean
        }
        Update: {
          comment?: string | null
          created_at?: string
          given_by?: string
          given_to?: string
          id?: string
          job_id?: string | null
          score?: number
          skill_verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "ratings_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      requests: {
        Row: {
          contractor_id: string
          created_at: string
          id: string
          initiated_by: Database["public"]["Enums"]["app_role"]
          job_id: string | null
          labour_id: string
          message: string | null
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
        }
        Insert: {
          contractor_id: string
          created_at?: string
          id?: string
          initiated_by?: Database["public"]["Enums"]["app_role"]
          job_id?: string | null
          labour_id: string
          message?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
        }
        Update: {
          contractor_id?: string
          created_at?: string
          id?: string
          initiated_by?: Database["public"]["Enums"]["app_role"]
          job_id?: string | null
          labour_id?: string
          message?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "requests_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_labour_id_fkey"
            columns: ["labour_id"]
            isOneToOne: false
            referencedRelation: "labour_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wage_agreements: {
        Row: {
          agreed_duration_days: number | null
          agreed_start_date: string | null
          agreed_wage: number
          contractor_confirmed: boolean
          contractor_id: string
          created_at: string
          id: string
          is_disputed: boolean
          job_id: string | null
          labour_confirmed: boolean
          labour_id: string
          payment_status: string
          updated_at: string
        }
        Insert: {
          agreed_duration_days?: number | null
          agreed_start_date?: string | null
          agreed_wage: number
          contractor_confirmed?: boolean
          contractor_id: string
          created_at?: string
          id?: string
          is_disputed?: boolean
          job_id?: string | null
          labour_confirmed?: boolean
          labour_id: string
          payment_status?: string
          updated_at?: string
        }
        Update: {
          agreed_duration_days?: number | null
          agreed_start_date?: string | null
          agreed_wage?: number
          contractor_confirmed?: boolean
          contractor_id?: string
          created_at?: string
          id?: string
          is_disputed?: boolean
          job_id?: string | null
          labour_confirmed?: boolean
          labour_id?: string
          payment_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wage_agreements_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "contractor" | "labour"
      job_status: "open" | "closed"
      notification_type: "request" | "accepted" | "rejected" | "system"
      request_status: "pending" | "accepted" | "rejected"
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
  public: {
    Enums: {
      app_role: ["admin", "contractor", "labour"],
      job_status: ["open", "closed"],
      notification_type: ["request", "accepted", "rejected", "system"],
      request_status: ["pending", "accepted", "rejected"],
    },
  },
} as const
