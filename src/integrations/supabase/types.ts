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
      cached_ideas: {
        Row: {
          created_at: string
          diet_type: string
          id: string
          meal_type: string
          meal_weight: string
          suggestions: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          diet_type: string
          id?: string
          meal_type: string
          meal_weight: string
          suggestions: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          diet_type?: string
          id?: string
          meal_type?: string
          meal_weight?: string
          suggestions?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          allergies: string[] | null
          app_jobs: string[] | null
          avatar_url: string | null
          bmi: number | null
          calorie_target: number | null
          carbs_target: number | null
          created_at: string
          current_hydration_ml: number | null
          custom_allergies: string[] | null
          diet_type: string | null
          display_name: string | null
          fat_target: number | null
          fiber_target: number | null
          goals: string[] | null
          height_cm: number | null
          hydration_target: number | null
          hydration_unit: string | null
          id: string
          language: string | null
          log_prefs: string[] | null
          onboarded_at: string | null
          pain_points: string[] | null
          protein_target: number | null
          reminder_times: Json | null
          reminders_enabled: boolean | null
          sat_fat_target: number | null
          sodium_target: number | null
          sugar_target: number | null
          updated_at: string
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          age?: number | null
          allergies?: string[] | null
          app_jobs?: string[] | null
          avatar_url?: string | null
          bmi?: number | null
          calorie_target?: number | null
          carbs_target?: number | null
          created_at?: string
          current_hydration_ml?: number | null
          custom_allergies?: string[] | null
          diet_type?: string | null
          display_name?: string | null
          fat_target?: number | null
          fiber_target?: number | null
          goals?: string[] | null
          height_cm?: number | null
          hydration_target?: number | null
          hydration_unit?: string | null
          id?: string
          language?: string | null
          log_prefs?: string[] | null
          onboarded_at?: string | null
          pain_points?: string[] | null
          protein_target?: number | null
          reminder_times?: Json | null
          reminders_enabled?: boolean | null
          sat_fat_target?: number | null
          sodium_target?: number | null
          sugar_target?: number | null
          updated_at?: string
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          age?: number | null
          allergies?: string[] | null
          app_jobs?: string[] | null
          avatar_url?: string | null
          bmi?: number | null
          calorie_target?: number | null
          carbs_target?: number | null
          created_at?: string
          current_hydration_ml?: number | null
          custom_allergies?: string[] | null
          diet_type?: string | null
          display_name?: string | null
          fat_target?: number | null
          fiber_target?: number | null
          goals?: string[] | null
          height_cm?: number | null
          hydration_target?: number | null
          hydration_unit?: string | null
          id?: string
          language?: string | null
          log_prefs?: string[] | null
          onboarded_at?: string | null
          pain_points?: string[] | null
          protein_target?: number | null
          reminder_times?: Json | null
          reminders_enabled?: boolean | null
          sat_fat_target?: number | null
          sodium_target?: number | null
          sugar_target?: number | null
          updated_at?: string
          user_id?: string
          weight_kg?: number | null
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
