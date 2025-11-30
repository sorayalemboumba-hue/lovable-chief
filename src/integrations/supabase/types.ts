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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          actions: Json | null
          application_email: string | null
          application_instructions: string | null
          ats_compliant: boolean | null
          compatibility: number | null
          contacts: Json | null
          created_at: string
          cv_template_id: string | null
          deadline: string
          entreprise: string
          id: string
          is_complete: boolean | null
          keywords: string | null
          letter_template_id: string | null
          lieu: string
          matching_skills: Json | null
          missing_requirements: Json | null
          notes: string | null
          original_offer_url: string | null
          poste: string
          priorite: number
          publication_date: string | null
          recommended_channel: string | null
          referent: string | null
          required_documents: string[] | null
          statut: string
          type: string | null
          url: string | null
          user_id: string
        }
        Insert: {
          actions?: Json | null
          application_email?: string | null
          application_instructions?: string | null
          ats_compliant?: boolean | null
          compatibility?: number | null
          contacts?: Json | null
          created_at?: string
          cv_template_id?: string | null
          deadline: string
          entreprise: string
          id?: string
          is_complete?: boolean | null
          keywords?: string | null
          letter_template_id?: string | null
          lieu: string
          matching_skills?: Json | null
          missing_requirements?: Json | null
          notes?: string | null
          original_offer_url?: string | null
          poste: string
          priorite?: number
          publication_date?: string | null
          recommended_channel?: string | null
          referent?: string | null
          required_documents?: string[] | null
          statut: string
          type?: string | null
          url?: string | null
          user_id: string
        }
        Update: {
          actions?: Json | null
          application_email?: string | null
          application_instructions?: string | null
          ats_compliant?: boolean | null
          compatibility?: number | null
          contacts?: Json | null
          created_at?: string
          cv_template_id?: string | null
          deadline?: string
          entreprise?: string
          id?: string
          is_complete?: boolean | null
          keywords?: string | null
          letter_template_id?: string | null
          lieu?: string
          matching_skills?: Json | null
          missing_requirements?: Json | null
          notes?: string | null
          original_offer_url?: string | null
          poste?: string
          priorite?: number
          publication_date?: string | null
          recommended_channel?: string | null
          referent?: string | null
          required_documents?: string[] | null
          statut?: string
          type?: string | null
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_cv_template_id_fkey"
            columns: ["cv_template_id"]
            isOneToOne: false
            referencedRelation: "document_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_letter_template_id_fkey"
            columns: ["letter_template_id"]
            isOneToOne: false
            referencedRelation: "document_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      coaching_tips: {
        Row: {
          created_at: string
          id: string
          note: string
          title: string
          url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note: string
          title: string
          url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string
          title?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      document_templates: {
        Row: {
          created_at: string
          file_url: string
          id: string
          is_default: boolean
          name: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_url: string
          id?: string
          is_default?: boolean
          name: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_url?: string
          id?: string
          is_default?: boolean
          name?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
