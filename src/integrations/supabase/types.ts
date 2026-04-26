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
      applications: {
        Row: {
          candidate_id: string
          created_at: string
          id: string
          message: string | null
          owner_id: string
          proposed_price: number | null
          status: Database["public"]["Enums"]["application_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["application_target"]
          updated_at: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          id?: string
          message?: string | null
          owner_id: string
          proposed_price?: number | null
          status?: Database["public"]["Enums"]["application_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["application_target"]
          updated_at?: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          id?: string
          message?: string | null
          owner_id?: string
          proposed_price?: number | null
          status?: Database["public"]["Enums"]["application_status"]
          target_id?: string
          target_type?: Database["public"]["Enums"]["application_target"]
          updated_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          created_at: string
          from_user_id: string
          id: string
          text: string
          thread_id: string
        }
        Insert: {
          created_at?: string
          from_user_id: string
          id?: string
          text: string
          thread_id: string
        }
        Update: {
          created_at?: string
          from_user_id?: string
          id?: string
          text?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_threads: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          participant_a: string
          participant_b: string
          topic: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          participant_a: string
          participant_b: string
          topic?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          participant_a?: string
          participant_b?: string
          topic?: string | null
        }
        Relationships: []
      }
      company_jobs: {
        Row: {
          category: Database["public"]["Enums"]["request_category"]
          city: string
          company_id: string
          created_at: string
          description: string
          id: string
          modality: string
          salary: string | null
          status: Database["public"]["Enums"]["job_status"]
          title: string
        }
        Insert: {
          category: Database["public"]["Enums"]["request_category"]
          city: string
          company_id: string
          created_at?: string
          description: string
          id?: string
          modality?: string
          salary?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          title: string
        }
        Update: {
          category?: Database["public"]["Enums"]["request_category"]
          city?: string
          company_id?: string
          created_at?: string
          description?: string
          id?: string
          modality?: string
          salary?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          title?: string
        }
        Relationships: []
      }
      help_offers: {
        Row: {
          active: boolean
          category: Database["public"]["Enums"]["request_category"]
          city: string
          coverage: string | null
          created_at: string
          description: string
          freelancer_id: string
          id: string
          latitude: number | null
          longitude: number | null
          portfolio_urls: string[]
          pricing_type: string
          pricing_value: number
          service_name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          category: Database["public"]["Enums"]["request_category"]
          city: string
          coverage?: string | null
          created_at?: string
          description: string
          freelancer_id: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          portfolio_urls?: string[]
          pricing_type?: string
          pricing_value?: number
          service_name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: Database["public"]["Enums"]["request_category"]
          city?: string
          coverage?: string | null
          created_at?: string
          description?: string
          freelancer_id?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          portfolio_urls?: string[]
          pricing_type?: string
          pricing_value?: number
          service_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      help_requests: {
        Row: {
          author_id: string
          budget: number
          category: Database["public"]["Enums"]["request_category"]
          city: string
          created_at: string
          description: string
          id: string
          image_urls: string[]
          latitude: number | null
          longitude: number | null
          neighborhood: string | null
          proposals_count: number
          scheduled_at: string | null
          state: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          budget?: number
          category: Database["public"]["Enums"]["request_category"]
          city: string
          created_at?: string
          description: string
          id?: string
          image_urls?: string[]
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string | null
          proposals_count?: number
          scheduled_at?: string | null
          state?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          budget?: number
          category?: Database["public"]["Enums"]["request_category"]
          city?: string
          created_at?: string
          description?: string
          id?: string
          image_urls?: string[]
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string | null
          proposals_count?: number
          scheduled_at?: string | null
          state?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_cents: number
          application_id: string | null
          asaas_invoice_url: string | null
          asaas_payment_id: string | null
          asaas_pix_copy_paste: string | null
          asaas_pix_qr: string | null
          created_at: string
          fee_cents: number
          id: string
          net_cents: number
          payee_id: string
          payer_id: string
          released_at: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount_cents: number
          application_id?: string | null
          asaas_invoice_url?: string | null
          asaas_payment_id?: string | null
          asaas_pix_copy_paste?: string | null
          asaas_pix_qr?: string | null
          created_at?: string
          fee_cents?: number
          id?: string
          net_cents?: number
          payee_id: string
          payer_id: string
          released_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          application_id?: string | null
          asaas_invoice_url?: string | null
          asaas_payment_id?: string | null
          asaas_pix_copy_paste?: string | null
          asaas_pix_qr?: string | null
          created_at?: string
          fee_cents?: number
          id?: string
          net_cents?: number
          payee_id?: string
          payer_id?: string
          released_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address_line: string | null
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          city: string | null
          company_cnpj: string | null
          company_name: string | null
          created_at: string
          display_name: string | null
          document_id: string | null
          document_type: string | null
          email: string | null
          full_name: string
          id: string
          identity_verified: boolean
          interests: string[]
          latitude: number | null
          longitude: number | null
          neighborhood: string | null
          onboarding_completed: boolean
          phone: string | null
          postal_code: string | null
          rating_avg: number
          reviews_count: number
          state: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line?: string | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          city?: string | null
          company_cnpj?: string | null
          company_name?: string | null
          created_at?: string
          display_name?: string | null
          document_id?: string | null
          document_type?: string | null
          email?: string | null
          full_name?: string
          id?: string
          identity_verified?: boolean
          interests?: string[]
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          postal_code?: string | null
          rating_avg?: number
          reviews_count?: number
          state?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line?: string | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          city?: string | null
          company_cnpj?: string | null
          company_name?: string | null
          created_at?: string
          display_name?: string | null
          document_id?: string | null
          document_type?: string | null
          email?: string | null
          full_name?: string
          id?: string
          identity_verified?: boolean
          interests?: string[]
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          postal_code?: string | null
          rating_avg?: number
          reviews_count?: number
          state?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          application_id: string | null
          comment: string | null
          created_at: string
          id: string
          rating: number
          reviewed_user_id: string
          reviewer_id: string
        }
        Insert: {
          application_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          reviewed_user_id: string
          reviewer_id: string
        }
        Update: {
          application_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          reviewed_user_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "freelancer" | "individual" | "company" | "admin"
      application_status:
        | "pending"
        | "review"
        | "rejected"
        | "hired"
        | "completed"
      application_target: "request" | "job"
      job_status: "open" | "closed"
      payment_status:
        | "pending"
        | "escrow_held"
        | "released"
        | "refunded"
        | "cancelled"
      request_category:
        | "limpeza"
        | "reparos"
        | "tecnologia"
        | "design"
        | "aulas"
        | "transporte"
        | "eventos"
        | "beleza"
        | "outros"
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
      app_role: ["freelancer", "individual", "company", "admin"],
      application_status: [
        "pending",
        "review",
        "rejected",
        "hired",
        "completed",
      ],
      application_target: ["request", "job"],
      job_status: ["open", "closed"],
      payment_status: [
        "pending",
        "escrow_held",
        "released",
        "refunded",
        "cancelled",
      ],
      request_category: [
        "limpeza",
        "reparos",
        "tecnologia",
        "design",
        "aulas",
        "transporte",
        "eventos",
        "beleza",
        "outros",
      ],
    },
  },
} as const
