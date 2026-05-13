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
      ai_adaptive_learning: {
        Row: {
          action_type: string
          context: Json | null
          created_at: string | null
          final_data: Json | null
          id: string
          lead_id: string | null
          original_data: Json | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          context?: Json | null
          created_at?: string | null
          final_data?: Json | null
          id?: string
          lead_id?: string | null
          original_data?: Json | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          context?: Json | null
          created_at?: string | null
          final_data?: Json | null
          id?: string
          lead_id?: string | null
          original_data?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_adaptive_learning_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_import"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_adaptive_learning_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_master_view"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_performance: {
        Row: {
          avg_response_time_ms: number | null
          channel: string
          id: string
          niche: string | null
          total_converted: number | null
          total_opened: number | null
          total_replied: number | null
          total_revenue: number | null
          total_sent: number | null
          updated_at: string | null
        }
        Insert: {
          avg_response_time_ms?: number | null
          channel: string
          id?: string
          niche?: string | null
          total_converted?: number | null
          total_opened?: number | null
          total_replied?: number | null
          total_revenue?: number | null
          total_sent?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_response_time_ms?: number | null
          channel?: string
          id?: string
          niche?: string | null
          total_converted?: number | null
          total_opened?: number | null
          total_replied?: number | null
          total_revenue?: number | null
          total_sent?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cnpj_base_receita: {
        Row: {
          bairro: string | null
          capital_social: number | null
          cep: string | null
          cidade: string | null
          cnae_principal: string | null
          cnae_secundario: string[] | null
          cnpj: string
          complemento: string | null
          data_abertura: string | null
          id: string
          last_updated_at: string | null
          logradouro: string | null
          nome_fantasia: string | null
          numero: string | null
          porte: string | null
          razao_social: string | null
          situacao_cadastral: string | null
          uf: string | null
        }
        Insert: {
          bairro?: string | null
          capital_social?: number | null
          cep?: string | null
          cidade?: string | null
          cnae_principal?: string | null
          cnae_secundario?: string[] | null
          cnpj: string
          complemento?: string | null
          data_abertura?: string | null
          id?: string
          last_updated_at?: string | null
          logradouro?: string | null
          nome_fantasia?: string | null
          numero?: string | null
          porte?: string | null
          razao_social?: string | null
          situacao_cadastral?: string | null
          uf?: string | null
        }
        Update: {
          bairro?: string | null
          capital_social?: number | null
          cep?: string | null
          cidade?: string | null
          cnae_principal?: string | null
          cnae_secundario?: string[] | null
          cnpj?: string
          complemento?: string | null
          data_abertura?: string | null
          id?: string
          last_updated_at?: string | null
          logradouro?: string | null
          nome_fantasia?: string | null
          numero?: string | null
          porte?: string | null
          razao_social?: string | null
          situacao_cadastral?: string | null
          uf?: string | null
        }
        Relationships: []
      }
      commercial_opportunities: {
        Row: {
          best_channel_hint: string | null
          closing_probability: number | null
          commercial_insight: string | null
          commercial_tags: string[] | null
          conversion_probability: number | null
          critical_failure_type: string | null
          diagnostic_message: string | null
          financial_impact_reason: string | null
          follow_up_day: number | null
          id: string
          last_detected_at: string | null
          lead_id: string | null
          opportunity_level: string | null
          opportunity_score: number | null
          reasoning: string[] | null
          suggested_next_action: string | null
          technical_meta: Json | null
          urgency_level: string | null
        }
        Insert: {
          best_channel_hint?: string | null
          closing_probability?: number | null
          commercial_insight?: string | null
          commercial_tags?: string[] | null
          conversion_probability?: number | null
          critical_failure_type?: string | null
          diagnostic_message?: string | null
          financial_impact_reason?: string | null
          follow_up_day?: number | null
          id?: string
          last_detected_at?: string | null
          lead_id?: string | null
          opportunity_level?: string | null
          opportunity_score?: number | null
          reasoning?: string[] | null
          suggested_next_action?: string | null
          technical_meta?: Json | null
          urgency_level?: string | null
        }
        Update: {
          best_channel_hint?: string | null
          closing_probability?: number | null
          commercial_insight?: string | null
          commercial_tags?: string[] | null
          conversion_probability?: number | null
          critical_failure_type?: string | null
          diagnostic_message?: string | null
          financial_impact_reason?: string | null
          follow_up_day?: number | null
          id?: string
          last_detected_at?: string | null
          lead_id?: string | null
          opportunity_level?: string | null
          opportunity_score?: number | null
          reasoning?: string[] | null
          suggested_next_action?: string | null
          technical_meta?: Json | null
          urgency_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commercial_opportunities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "leads_import"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_opportunities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "leads_master_view"
            referencedColumns: ["id"]
          },
        ]
      }
      consentimentos_pf: {
        Row: {
          assinado_em: string
          base_legal: string
          cpf_hash: string
          created_at: string
          created_by: string
          documento_url: string | null
          expira_em: string
          finalidade: string
          id: string
          ip_origem: unknown
          revogado_em: string | null
          titular_email: string | null
          titular_nome: string
          user_agent: string | null
        }
        Insert: {
          assinado_em?: string
          base_legal: string
          cpf_hash: string
          created_at?: string
          created_by: string
          documento_url?: string | null
          expira_em?: string
          finalidade: string
          id?: string
          ip_origem?: unknown
          revogado_em?: string | null
          titular_email?: string | null
          titular_nome: string
          user_agent?: string | null
        }
        Update: {
          assinado_em?: string
          base_legal?: string
          cpf_hash?: string
          created_at?: string
          created_by?: string
          documento_url?: string | null
          expira_em?: string
          finalidade?: string
          id?: string
          ip_origem?: unknown
          revogado_em?: string | null
          titular_email?: string | null
          titular_nome?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      consultas_audit: {
        Row: {
          alvo_hash: string
          alvo_mascarado: string
          consentimento_id: string | null
          created_at: string
          custo_centavos: number
          id: string
          ip_origem: unknown
          provedor: string
          request_payload: Json | null
          response_summary: Json | null
          status: string
          tipo: string
          user_id: string
        }
        Insert: {
          alvo_hash: string
          alvo_mascarado: string
          consentimento_id?: string | null
          created_at?: string
          custo_centavos?: number
          id?: string
          ip_origem?: unknown
          provedor: string
          request_payload?: Json | null
          response_summary?: Json | null
          status: string
          tipo: string
          user_id: string
        }
        Update: {
          alvo_hash?: string
          alvo_mascarado?: string
          consentimento_id?: string | null
          created_at?: string
          custo_centavos?: number
          id?: string
          ip_origem?: unknown
          provedor?: string
          request_payload?: Json | null
          response_summary?: Json | null
          status?: string
          tipo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultas_audit_consentimento_id_fkey"
            columns: ["consentimento_id"]
            isOneToOne: false
            referencedRelation: "consentimentos_pf"
            referencedColumns: ["id"]
          },
        ]
      }
      consultas_pj_cache: {
        Row: {
          cnpj: string
          expires_at: string
          fetched_at: string
          fonte: string
          payload: Json
        }
        Insert: {
          cnpj: string
          expires_at?: string
          fetched_at?: string
          fonte: string
          payload: Json
        }
        Update: {
          cnpj?: string
          expires_at?: string
          fetched_at?: string
          fonte?: string
          payload?: Json
        }
        Relationships: []
      }
      data_conflicts: {
        Row: {
          conflict_type: string | null
          created_at: string | null
          field_name: string
          id: string
          lead_id: string | null
          resolved: boolean | null
          resolved_by: string | null
          source_a: string
          source_b: string
          value_a: string | null
          value_b: string | null
        }
        Insert: {
          conflict_type?: string | null
          created_at?: string | null
          field_name: string
          id?: string
          lead_id?: string | null
          resolved?: boolean | null
          resolved_by?: string | null
          source_a: string
          source_b: string
          value_a?: string | null
          value_b?: string | null
        }
        Update: {
          conflict_type?: string | null
          created_at?: string | null
          field_name?: string
          id?: string
          lead_id?: string | null
          resolved?: boolean | null
          resolved_by?: string | null
          source_a?: string
          source_b?: string
          value_a?: string | null
          value_b?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_conflicts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_import"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_conflicts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_master_view"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_presence_analysis: {
        Row: {
          confidence_level: string | null
          confidence_score: number | null
          id: string
          last_analyzed_at: string | null
          lead_id: string | null
          presence_score: number | null
          validations: Json | null
          web_status: string | null
        }
        Insert: {
          confidence_level?: string | null
          confidence_score?: number | null
          id?: string
          last_analyzed_at?: string | null
          lead_id?: string | null
          presence_score?: number | null
          validations?: Json | null
          web_status?: string | null
        }
        Update: {
          confidence_level?: string | null
          confidence_score?: number | null
          id?: string
          last_analyzed_at?: string | null
          lead_id?: string | null
          presence_score?: number | null
          validations?: Json | null
          web_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "digital_presence_analysis_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_import"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_presence_analysis_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_master_view"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas_cache: {
        Row: {
          cidade: string | null
          cnpj: string | null
          created_at: string
          data_fresh: string
          email: string | null
          id: string
          latitude: number | null
          longitude: number | null
          nicho: string | null
          nome: string
          nome_fantasia: string | null
          place_id: string | null
          rating: number | null
          raw_brasilapi: Json | null
          raw_places: Json | null
          site: string | null
          source: string
          telefone: string | null
          uf: string | null
          updated_at: string
          user_ratings_total: number | null
        }
        Insert: {
          cidade?: string | null
          cnpj?: string | null
          created_at?: string
          data_fresh?: string
          email?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          nicho?: string | null
          nome: string
          nome_fantasia?: string | null
          place_id?: string | null
          rating?: number | null
          raw_brasilapi?: Json | null
          raw_places?: Json | null
          site?: string | null
          source?: string
          telefone?: string | null
          uf?: string | null
          updated_at?: string
          user_ratings_total?: number | null
        }
        Update: {
          cidade?: string | null
          cnpj?: string | null
          created_at?: string
          data_fresh?: string
          email?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          nicho?: string | null
          nome?: string
          nome_fantasia?: string | null
          place_id?: string | null
          rating?: number | null
          raw_brasilapi?: Json | null
          raw_places?: Json | null
          site?: string | null
          source?: string
          telefone?: string | null
          uf?: string | null
          updated_at?: string
          user_ratings_total?: number | null
        }
        Relationships: []
      }
      enriquecimento_cache: {
        Row: {
          attempts: number
          cnpj: string
          consultado_em: string
          created_at: string
          dados: Json | null
          dominio_site: string | null
          erro: string | null
          fonte: string | null
          id: string
          nome_socio: string
          proxima_consulta: string
          razao_social: string | null
          score_confianca: number
          socio_key: string
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          cnpj: string
          consultado_em?: string
          created_at?: string
          dados?: Json | null
          dominio_site?: string | null
          erro?: string | null
          fonte?: string | null
          id?: string
          nome_socio: string
          proxima_consulta?: string
          razao_social?: string | null
          score_confianca?: number
          socio_key: string
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          cnpj?: string
          consultado_em?: string
          created_at?: string
          dados?: Json | null
          dominio_site?: string | null
          erro?: string | null
          fonte?: string | null
          id?: string
          nome_socio?: string
          proxima_consulta?: string
          razao_social?: string | null
          score_confianca?: number
          socio_key?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      field_validation: {
        Row: {
          conflict_detected: boolean | null
          field_name: string
          id: string
          is_valid: boolean | null
          last_validated_at: string | null
          lead_id: string | null
          sources_checked: string[] | null
        }
        Insert: {
          conflict_detected?: boolean | null
          field_name: string
          id?: string
          is_valid?: boolean | null
          last_validated_at?: string | null
          lead_id?: string | null
          sources_checked?: string[] | null
        }
        Update: {
          conflict_detected?: boolean | null
          field_name?: string
          id?: string
          is_valid?: boolean | null
          last_validated_at?: string | null
          lead_id?: string | null
          sources_checked?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "field_validation_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_import"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_validation_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_master_view"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_settings: {
        Row: {
          created_at: string
          default_tone: string
          enabled: boolean
          id: string
          max_retries: number
          provider: string
          retry_interval_sec: number
          secret_token: string | null
          updated_at: string
          user_id: string
          webhook_url: string | null
        }
        Insert: {
          created_at?: string
          default_tone?: string
          enabled?: boolean
          id?: string
          max_retries?: number
          provider?: string
          retry_interval_sec?: number
          secret_token?: string | null
          updated_at?: string
          user_id: string
          webhook_url?: string | null
        }
        Update: {
          created_at?: string
          default_tone?: string
          enabled?: boolean
          id?: string
          max_retries?: number
          provider?: string
          retry_interval_sec?: number
          secret_token?: string | null
          updated_at?: string
          user_id?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      job_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          job_id: string | null
          message: string
          metadata: Json | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          job_id?: string | null
          message: string
          metadata?: Json | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          job_id?: string | null
          message?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "job_events_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "lead_import_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          attempts: number | null
          cancel_requested: boolean | null
          cancelled_at: string | null
          created_at: string | null
          error: string | null
          finished_at: string | null
          id: string
          idempotency_key: string
          max_attempts: number | null
          owner_user_id: string | null
          payload: Json | null
          result: Json | null
          scheduled_at: string | null
          started_at: string | null
          status: string
          tipo: string
          updated_at: string | null
        }
        Insert: {
          attempts?: number | null
          cancel_requested?: boolean | null
          cancelled_at?: string | null
          created_at?: string | null
          error?: string | null
          finished_at?: string | null
          id?: string
          idempotency_key: string
          max_attempts?: number | null
          owner_user_id?: string | null
          payload?: Json | null
          result?: Json | null
          scheduled_at?: string | null
          started_at?: string | null
          status: string
          tipo: string
          updated_at?: string | null
        }
        Update: {
          attempts?: number | null
          cancel_requested?: boolean | null
          cancelled_at?: string | null
          created_at?: string | null
          error?: string | null
          finished_at?: string | null
          id?: string
          idempotency_key?: string
          max_attempts?: number | null
          owner_user_id?: string | null
          payload?: Json | null
          result?: Json | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          tipo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      lead_data_sources: {
        Row: {
          confidence_score: number | null
          fetched_at: string | null
          field_name: string
          id: string
          lead_id: string | null
          raw_response: Json | null
          source_name: string
        }
        Insert: {
          confidence_score?: number | null
          fetched_at?: string | null
          field_name: string
          id?: string
          lead_id?: string | null
          raw_response?: Json | null
          source_name: string
        }
        Update: {
          confidence_score?: number | null
          fetched_at?: string | null
          field_name?: string
          id?: string
          lead_id?: string | null
          raw_response?: Json | null
          source_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_data_sources_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_import"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_data_sources_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_master_view"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_dedupe_audit: {
        Row: {
          action_taken: string | null
          confidence_score: number | null
          created_at: string | null
          id: string
          incoming_data: Json
          job_id: string | null
          lead_identifier: string
          normalized_values: Json | null
          original_lead_id: string | null
          reason: string
          reviewed_at: string | null
          reviewed_by: string | null
          similarity_score: number | null
          user_id: string
        }
        Insert: {
          action_taken?: string | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          incoming_data: Json
          job_id?: string | null
          lead_identifier: string
          normalized_values?: Json | null
          original_lead_id?: string | null
          reason: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          similarity_score?: number | null
          user_id: string
        }
        Update: {
          action_taken?: string | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          incoming_data?: Json
          job_id?: string | null
          lead_identifier?: string
          normalized_values?: Json | null
          original_lead_id?: string | null
          reason?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          similarity_score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_dedupe_audit_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "lead_import_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_enrichment_queue: {
        Row: {
          attempts: number | null
          created_at: string | null
          id: string
          job_id: string | null
          last_error: string | null
          lead_id: string | null
          priority: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          id?: string
          job_id?: string | null
          last_error?: string | null
          lead_id?: string | null
          priority?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          id?: string
          job_id?: string | null
          last_error?: string | null
          lead_id?: string | null
          priority?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_enrichment_queue_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "lead_import_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_enrichment_queue_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_import"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_enrichment_queue_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_master_view"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_import_errors: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          job_id: string
          raw_payload: Json | null
          row_number: number | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          job_id: string
          raw_payload?: Json | null
          row_number?: number | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          job_id?: string
          raw_payload?: Json | null
          row_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_import_errors_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "lead_import_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_import_jobs: {
        Row: {
          auto_insights: string[] | null
          batch_size: number | null
          confidence_score: number | null
          created_at: string
          duplicate_rows: number | null
          error_message: string | null
          estimated_completion_at: string | null
          eta_seconds: number | null
          failed_rows: number | null
          filename: string | null
          finished_at: string | null
          id: string
          last_heartbeat: string | null
          mode: string | null
          processed_rows: number | null
          sample_rate: number | null
          source_stats: Json | null
          sources_stat: Json | null
          started_at: string | null
          status: string
          success_rows: number | null
          total_rows: number | null
          updated_at: string
          user_id: string | null
          worker_config: Json | null
        }
        Insert: {
          auto_insights?: string[] | null
          batch_size?: number | null
          confidence_score?: number | null
          created_at?: string
          duplicate_rows?: number | null
          error_message?: string | null
          estimated_completion_at?: string | null
          eta_seconds?: number | null
          failed_rows?: number | null
          filename?: string | null
          finished_at?: string | null
          id?: string
          last_heartbeat?: string | null
          mode?: string | null
          processed_rows?: number | null
          sample_rate?: number | null
          source_stats?: Json | null
          sources_stat?: Json | null
          started_at?: string | null
          status?: string
          success_rows?: number | null
          total_rows?: number | null
          updated_at?: string
          user_id?: string | null
          worker_config?: Json | null
        }
        Update: {
          auto_insights?: string[] | null
          batch_size?: number | null
          confidence_score?: number | null
          created_at?: string
          duplicate_rows?: number | null
          error_message?: string | null
          estimated_completion_at?: string | null
          eta_seconds?: number | null
          failed_rows?: number | null
          filename?: string | null
          finished_at?: string | null
          id?: string
          last_heartbeat?: string | null
          mode?: string | null
          processed_rows?: number | null
          sample_rate?: number | null
          source_stats?: Json | null
          sources_stat?: Json | null
          started_at?: string | null
          status?: string
          success_rows?: number | null
          total_rows?: number | null
          updated_at?: string
          user_id?: string | null
          worker_config?: Json | null
        }
        Relationships: []
      }
      lead_job_reports: {
        Row: {
          created_at: string | null
          executive_summary: Json | null
          id: string
          insights: string[] | null
          job_id: string | null
          pdf_url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          executive_summary?: Json | null
          id?: string
          insights?: string[] | null
          job_id?: string | null
          pdf_url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          executive_summary?: Json | null
          id?: string
          insights?: string[] | null
          job_id?: string | null
          pdf_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_job_reports_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "lead_import_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_partners: {
        Row: {
          cargo: string | null
          created_at: string | null
          id: string
          lead_id: string
          nome: string
          qualificacao: string | null
        }
        Insert: {
          cargo?: string | null
          created_at?: string | null
          id?: string
          lead_id: string
          nome: string
          qualificacao?: string | null
        }
        Update: {
          cargo?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string
          nome?: string
          qualificacao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_partners_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_import"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_partners_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_master_view"
            referencedColumns: ["id"]
          },
        ]
      }
      leads_analysis: {
        Row: {
          city: string
          company_name: string
          confidence: number
          created_at: string | null
          extracted_features: Json | null
          google_maps_url: string | null
          id: string
          instagram: string | null
          instagram_bio: string | null
          instagram_posts: string | null
          instagram_url: string | null
          maps_text: string | null
          opportunity: string
          problems: string[]
          raw_data: Json
          recommended_services: string[]
          sales_message: string
          score: number
          segment: string | null
          site_sections: Json | null
          target_tone: string | null
          website: string | null
        }
        Insert: {
          city: string
          company_name: string
          confidence: number
          created_at?: string | null
          extracted_features?: Json | null
          google_maps_url?: string | null
          id?: string
          instagram?: string | null
          instagram_bio?: string | null
          instagram_posts?: string | null
          instagram_url?: string | null
          maps_text?: string | null
          opportunity: string
          problems: string[]
          raw_data: Json
          recommended_services: string[]
          sales_message: string
          score: number
          segment?: string | null
          site_sections?: Json | null
          target_tone?: string | null
          website?: string | null
        }
        Update: {
          city?: string
          company_name?: string
          confidence?: number
          created_at?: string | null
          extracted_features?: Json | null
          google_maps_url?: string | null
          id?: string
          instagram?: string | null
          instagram_bio?: string | null
          instagram_posts?: string | null
          instagram_url?: string | null
          maps_text?: string | null
          opportunity?: string
          problems?: string[]
          raw_data?: Json
          recommended_services?: string[]
          sales_message?: string
          score?: number
          segment?: string | null
          site_sections?: Json | null
          target_tone?: string | null
          website?: string | null
        }
        Relationships: []
      }
      leads_import: {
        Row: {
          atividade: string | null
          bairro: string | null
          capital_social: number | null
          cep: string | null
          cidade: string | null
          cnae_principal: string | null
          cnpj: string
          confidence_level: string | null
          confidence_score: number | null
          contact_notes: string | null
          created_at: string
          discard_reason: string | null
          email: string | null
          enrichment_data: Json | null
          fantasia: string | null
          follow_up_step: number | null
          followup_history: Json | null
          followup_status: string | null
          funnel_stage: string | null
          has_whatsapp_btn: boolean | null
          id: string
          identity_hash: string | null
          instagram_handle: string | null
          interaction_outcome: string | null
          interest_level: string | null
          is_discarded: boolean | null
          last_contact_at: string | null
          last_enriched_at: string | null
          last_verification_at: string | null
          lead_operation_status: string | null
          meta_pixel_detected: boolean | null
          next_followup_at: string | null
          next_retry_at: string | null
          niche: string | null
          nicho: string | null
          nome: string
          porte: string | null
          raw: Json | null
          razao_social: string | null
          site: string | null
          socios: Json | null
          source: string
          status: string | null
          telefone: string | null
          uf: string | null
          updated_at: string
          verification_error: string | null
          verification_flags: Json | null
          verification_status: string
          verified_at: string | null
          verify_attempts: number
        }
        Insert: {
          atividade?: string | null
          bairro?: string | null
          capital_social?: number | null
          cep?: string | null
          cidade?: string | null
          cnae_principal?: string | null
          cnpj: string
          confidence_level?: string | null
          confidence_score?: number | null
          contact_notes?: string | null
          created_at?: string
          discard_reason?: string | null
          email?: string | null
          enrichment_data?: Json | null
          fantasia?: string | null
          follow_up_step?: number | null
          followup_history?: Json | null
          followup_status?: string | null
          funnel_stage?: string | null
          has_whatsapp_btn?: boolean | null
          id?: string
          identity_hash?: string | null
          instagram_handle?: string | null
          interaction_outcome?: string | null
          interest_level?: string | null
          is_discarded?: boolean | null
          last_contact_at?: string | null
          last_enriched_at?: string | null
          last_verification_at?: string | null
          lead_operation_status?: string | null
          meta_pixel_detected?: boolean | null
          next_followup_at?: string | null
          next_retry_at?: string | null
          niche?: string | null
          nicho?: string | null
          nome: string
          porte?: string | null
          raw?: Json | null
          razao_social?: string | null
          site?: string | null
          socios?: Json | null
          source?: string
          status?: string | null
          telefone?: string | null
          uf?: string | null
          updated_at?: string
          verification_error?: string | null
          verification_flags?: Json | null
          verification_status?: string
          verified_at?: string | null
          verify_attempts?: number
        }
        Update: {
          atividade?: string | null
          bairro?: string | null
          capital_social?: number | null
          cep?: string | null
          cidade?: string | null
          cnae_principal?: string | null
          cnpj?: string
          confidence_level?: string | null
          confidence_score?: number | null
          contact_notes?: string | null
          created_at?: string
          discard_reason?: string | null
          email?: string | null
          enrichment_data?: Json | null
          fantasia?: string | null
          follow_up_step?: number | null
          followup_history?: Json | null
          followup_status?: string | null
          funnel_stage?: string | null
          has_whatsapp_btn?: boolean | null
          id?: string
          identity_hash?: string | null
          instagram_handle?: string | null
          interaction_outcome?: string | null
          interest_level?: string | null
          is_discarded?: boolean | null
          last_contact_at?: string | null
          last_enriched_at?: string | null
          last_verification_at?: string | null
          lead_operation_status?: string | null
          meta_pixel_detected?: boolean | null
          next_followup_at?: string | null
          next_retry_at?: string | null
          niche?: string | null
          nicho?: string | null
          nome?: string
          porte?: string | null
          raw?: Json | null
          razao_social?: string | null
          site?: string | null
          socios?: Json | null
          source?: string
          status?: string | null
          telefone?: string | null
          uf?: string | null
          updated_at?: string
          verification_error?: string | null
          verification_flags?: Json | null
          verification_status?: string
          verified_at?: string | null
          verify_attempts?: number
        }
        Relationships: []
      }
      location_cache: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          results: Json
          search_key: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          results: Json
          search_key: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          results?: Json
          search_key?: string
        }
        Relationships: []
      }
      make_send_log: {
        Row: {
          attempts: number
          channels: string[]
          delivered_at: string | null
          error_message: string | null
          http_status: number | null
          id: string
          last_attempt_at: string | null
          lead_id: string | null
          message_preview: string | null
          request_id: string
          response_time_ms: number | null
          sent_at: string
          status: string
          user_id: string
          variant: string | null
        }
        Insert: {
          attempts?: number
          channels?: string[]
          delivered_at?: string | null
          error_message?: string | null
          http_status?: number | null
          id?: string
          last_attempt_at?: string | null
          lead_id?: string | null
          message_preview?: string | null
          request_id: string
          response_time_ms?: number | null
          sent_at?: string
          status?: string
          user_id: string
          variant?: string | null
        }
        Update: {
          attempts?: number
          channels?: string[]
          delivered_at?: string | null
          error_message?: string | null
          http_status?: number | null
          id?: string
          last_attempt_at?: string | null
          lead_id?: string | null
          message_preview?: string | null
          request_id?: string
          response_time_ms?: number | null
          sent_at?: string
          status?: string
          user_id?: string
          variant?: string | null
        }
        Relationships: []
      }
      make_send_queue: {
        Row: {
          attempts: number
          created_at: string
          id: string
          last_error: string | null
          log_id: string
          next_attempt_at: string
          payload: Json
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          id?: string
          last_error?: string | null
          log_id: string
          next_attempt_at?: string
          payload: Json
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          created_at?: string
          id?: string
          last_error?: string | null
          log_id?: string
          next_attempt_at?: string
          payload?: Json
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "make_send_queue_log_id_fkey"
            columns: ["log_id"]
            isOneToOne: false
            referencedRelation: "make_send_log"
            referencedColumns: ["id"]
          },
        ]
      }
      market_niche_opportunities: {
        Row: {
          analysis_id: string | null
          confidence_score: number | null
          created_at: string | null
          evidence: string
          id: string
          metadata: Json | null
          name: string
          next_step: string | null
          risk_level: string | null
          source_origin: string
          user_id: string | null
        }
        Insert: {
          analysis_id?: string | null
          confidence_score?: number | null
          created_at?: string | null
          evidence: string
          id?: string
          metadata?: Json | null
          name: string
          next_step?: string | null
          risk_level?: string | null
          source_origin: string
          user_id?: string | null
        }
        Update: {
          analysis_id?: string | null
          confidence_score?: number | null
          created_at?: string | null
          evidence?: string
          id?: string
          metadata?: Json | null
          name?: string
          next_step?: string | null
          risk_level?: string | null
          source_origin?: string
          user_id?: string | null
        }
        Relationships: []
      }
      market_research_reports: {
        Row: {
          created_at: string | null
          errors: Json | null
          id: string
          input: string
          normalized_intent: Json | null
          owner_user_id: string | null
          report: Json
          sources: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          errors?: Json | null
          id?: string
          input: string
          normalized_intent?: Json | null
          owner_user_id?: string | null
          report: Json
          sources?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          errors?: Json | null
          id?: string
          input?: string
          normalized_intent?: Json | null
          owner_user_id?: string | null
          report?: Json
          sources?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      niche_evidence_logs: {
        Row: {
          created_at: string | null
          id: string
          opportunity_id: string | null
          raw_evidence_payload: Json | null
          verification_status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          opportunity_id?: string | null
          raw_evidence_payload?: Json | null
          verification_status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          opportunity_id?: string | null
          raw_evidence_payload?: Json | null
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "niche_evidence_logs_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "market_niche_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      pesquisas_cache: {
        Row: {
          cidade: string | null
          created_at: string
          hit_count: number
          id: string
          last_hit_at: string
          nicho: string | null
          query_hash: string
          query_text: string | null
          result_cnpjs: string[]
          result_place_ids: string[]
          total_count: number
          uf: string | null
        }
        Insert: {
          cidade?: string | null
          created_at?: string
          hit_count?: number
          id?: string
          last_hit_at?: string
          nicho?: string | null
          query_hash: string
          query_text?: string | null
          result_cnpjs?: string[]
          result_place_ids?: string[]
          total_count?: number
          uf?: string | null
        }
        Update: {
          cidade?: string | null
          created_at?: string
          hit_count?: number
          id?: string
          last_hit_at?: string
          nicho?: string | null
          query_hash?: string
          query_text?: string | null
          result_cnpjs?: string[]
          result_place_ids?: string[]
          total_count?: number
          uf?: string | null
        }
        Relationships: []
      }
      profile_conversion_stats: {
        Row: {
          avg_velocity_ms: number | null
          closures_count: number | null
          id: string
          last_updated: string | null
          leads_count: number | null
          profile_type: string
          responses_count: number | null
        }
        Insert: {
          avg_velocity_ms?: number | null
          closures_count?: number | null
          id?: string
          last_updated?: string | null
          leads_count?: number | null
          profile_type: string
          responses_count?: number | null
        }
        Update: {
          avg_velocity_ms?: number | null
          closures_count?: number | null
          id?: string
          last_updated?: string | null
          leads_count?: number | null
          profile_type?: string
          responses_count?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      prospect_audit_logs: {
        Row: {
          action: string
          changes: Json
          id: string
          lead_id: string
          message: string | null
          source: string
          timestamp: string
          user_id: string
        }
        Insert: {
          action: string
          changes?: Json
          id?: string
          lead_id: string
          message?: string | null
          source: string
          timestamp?: string
          user_id?: string
        }
        Update: {
          action?: string
          changes?: Json
          id?: string
          lead_id?: string
          message?: string | null
          source?: string
          timestamp?: string
          user_id?: string
        }
        Relationships: []
      }
      prospect_leads: {
        Row: {
          behavioral_profile: string | null
          city: string | null
          company_name: string
          conversion_score_by_profile: number | null
          created_at: string
          diagnosis: string | null
          id: string
          niche: string | null
          opportunity_level: string | null
          opportunity_score: number | null
          psychological_analysis: Json | null
          raw_data: Json
          real_time_strategy: string | null
          source: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          behavioral_profile?: string | null
          city?: string | null
          company_name: string
          conversion_score_by_profile?: number | null
          created_at?: string
          diagnosis?: string | null
          id?: string
          niche?: string | null
          opportunity_level?: string | null
          opportunity_score?: number | null
          psychological_analysis?: Json | null
          raw_data?: Json
          real_time_strategy?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          behavioral_profile?: string | null
          city?: string | null
          company_name?: string
          conversion_score_by_profile?: number | null
          created_at?: string
          diagnosis?: string | null
          id?: string
          niche?: string | null
          opportunity_level?: string | null
          opportunity_score?: number | null
          psychological_analysis?: Json | null
          raw_data?: Json
          real_time_strategy?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      provider_quota: {
        Row: {
          bloqueado_ate: string | null
          consumido_dia: number
          consumido_mes: number
          dia_referencia: string
          fonte: string
          limite_diario: number
          limite_mensal: number
          mes_referencia: string
          ultimo_erro: string | null
          updated_at: string
        }
        Insert: {
          bloqueado_ate?: string | null
          consumido_dia?: number
          consumido_mes?: number
          dia_referencia?: string
          fonte: string
          limite_diario: number
          limite_mensal: number
          mes_referencia?: string
          ultimo_erro?: string | null
          updated_at?: string
        }
        Update: {
          bloqueado_ate?: string | null
          consumido_dia?: number
          consumido_mes?: number
          dia_referencia?: string
          fonte?: string
          limite_diario?: number
          limite_mensal?: number
          mes_referencia?: string
          ultimo_erro?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      public_api_cache: {
        Row: {
          api_key: string
          created_at: string | null
          expires_at: string
          id: string
          provider: string
          response_data: Json
        }
        Insert: {
          api_key: string
          created_at?: string | null
          expires_at: string
          id?: string
          provider: string
          response_data: Json
        }
        Update: {
          api_key?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          provider?: string
          response_data?: Json
        }
        Relationships: []
      }
      revenue_analytics_daily: {
        Row: {
          check_date: string | null
          id: string
          revenue_impact_estimated: number | null
          top_converting_failure_type: string | null
          total_conversions: number | null
          total_hot_leads: number | null
          total_pitches_sent: number | null
          total_replies: number | null
        }
        Insert: {
          check_date?: string | null
          id?: string
          revenue_impact_estimated?: number | null
          top_converting_failure_type?: string | null
          total_conversions?: number | null
          total_hot_leads?: number | null
          total_pitches_sent?: number | null
          total_replies?: number | null
        }
        Update: {
          check_date?: string | null
          id?: string
          revenue_impact_estimated?: number | null
          top_converting_failure_type?: string | null
          total_conversions?: number | null
          total_hot_leads?: number | null
          total_pitches_sent?: number | null
          total_replies?: number | null
        }
        Relationships: []
      }
      sales_followup_sequences: {
        Row: {
          campaign_name: string | null
          created_at: string | null
          current_day: number | null
          id: string
          last_message_at: string | null
          last_reply_at: string | null
          lead_id: string | null
          next_message_at: string | null
          opportunity_id: string | null
          preferred_channel: string | null
          sequence_history: Json | null
          status: string | null
        }
        Insert: {
          campaign_name?: string | null
          created_at?: string | null
          current_day?: number | null
          id?: string
          last_message_at?: string | null
          last_reply_at?: string | null
          lead_id?: string | null
          next_message_at?: string | null
          opportunity_id?: string | null
          preferred_channel?: string | null
          sequence_history?: Json | null
          status?: string | null
        }
        Update: {
          campaign_name?: string | null
          created_at?: string | null
          current_day?: number | null
          id?: string
          last_message_at?: string | null
          last_reply_at?: string | null
          lead_id?: string | null
          next_message_at?: string | null
          opportunity_id?: string | null
          preferred_channel?: string | null
          sequence_history?: Json | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_followup_sequences_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_import"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_followup_sequences_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_master_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_followup_sequences_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "commercial_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_pitch_history: {
        Row: {
          ab_test_variant: string | null
          channel: string
          converted: boolean | null
          created_at: string | null
          detected_problems: string[] | null
          edited_content: string | null
          id: string
          lead_id: string | null
          message_content: string
          meta_info: Json | null
          opened: boolean | null
          opportunity_id: string | null
          pitch_variation: string | null
          presence_score: number | null
          replied: boolean | null
          reply_type: string | null
          response_time_ms: number | null
          revenue_generated: number | null
          sent_at: string | null
          was_edited: boolean | null
        }
        Insert: {
          ab_test_variant?: string | null
          channel: string
          converted?: boolean | null
          created_at?: string | null
          detected_problems?: string[] | null
          edited_content?: string | null
          id?: string
          lead_id?: string | null
          message_content: string
          meta_info?: Json | null
          opened?: boolean | null
          opportunity_id?: string | null
          pitch_variation?: string | null
          presence_score?: number | null
          replied?: boolean | null
          reply_type?: string | null
          response_time_ms?: number | null
          revenue_generated?: number | null
          sent_at?: string | null
          was_edited?: boolean | null
        }
        Update: {
          ab_test_variant?: string | null
          channel?: string
          converted?: boolean | null
          created_at?: string | null
          detected_problems?: string[] | null
          edited_content?: string | null
          id?: string
          lead_id?: string | null
          message_content?: string
          meta_info?: Json | null
          opened?: boolean | null
          opportunity_id?: string | null
          pitch_variation?: string | null
          presence_score?: number | null
          replied?: boolean | null
          reply_type?: string | null
          response_time_ms?: number | null
          revenue_generated?: number | null
          sent_at?: string | null
          was_edited?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_pitch_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_import"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_pitch_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_master_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_pitch_history_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "commercial_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      system_health_status: {
        Row: {
          component: string
          id: string
          last_check: string | null
          message: string | null
          metrics: Json | null
          status: string
          updated_at: string | null
        }
        Insert: {
          component: string
          id?: string
          last_check?: string | null
          message?: string | null
          metrics?: Json | null
          status: string
          updated_at?: string | null
        }
        Update: {
          component?: string
          id?: string
          last_check?: string | null
          message?: string | null
          metrics?: Json | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sales_profile: {
        Row: {
          avg_message_length: number | null
          created_at: string | null
          id: string
          learning_paused: boolean | null
          messages_edited_count: number | null
          messages_sent_count: number | null
          preferred_channels: string[] | null
          preferred_cta: string | null
          preferred_intensity: string | null
          preferred_size: string | null
          preferred_tone: string | null
          success_rate_by_channel: Json | null
          success_rate_by_trigger: Json | null
          top_triggers: string[] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          avg_message_length?: number | null
          created_at?: string | null
          id?: string
          learning_paused?: boolean | null
          messages_edited_count?: number | null
          messages_sent_count?: number | null
          preferred_channels?: string[] | null
          preferred_cta?: string | null
          preferred_intensity?: string | null
          preferred_size?: string | null
          preferred_tone?: string | null
          success_rate_by_channel?: Json | null
          success_rate_by_trigger?: Json | null
          top_triggers?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          avg_message_length?: number | null
          created_at?: string | null
          id?: string
          learning_paused?: boolean | null
          messages_edited_count?: number | null
          messages_sent_count?: number | null
          preferred_channels?: string[] | null
          preferred_cta?: string | null
          preferred_intensity?: string | null
          preferred_size?: string | null
          preferred_tone?: string | null
          success_rate_by_channel?: Json | null
          success_rate_by_trigger?: Json | null
          top_triggers?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_style_references: {
        Row: {
          analysis: Json | null
          content: string
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          analysis?: Json | null
          content: string
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          analysis?: Json | null
          content?: string
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      validation_conflicts: {
        Row: {
          created_at: string | null
          field_name: string
          id: string
          lead_id: string | null
          resolved: boolean | null
          source_a: string
          source_b: string
          value_a: string | null
          value_b: string | null
        }
        Insert: {
          created_at?: string | null
          field_name: string
          id?: string
          lead_id?: string | null
          resolved?: boolean | null
          source_a: string
          source_b: string
          value_a?: string | null
          value_b?: string | null
        }
        Update: {
          created_at?: string | null
          field_name?: string
          id?: string
          lead_id?: string | null
          resolved?: boolean | null
          source_a?: string
          source_b?: string
          value_a?: string | null
          value_b?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "validation_conflicts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_import"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "validation_conflicts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_master_view"
            referencedColumns: ["id"]
          },
        ]
      }
      winner_messages: {
        Row: {
          channel: string | null
          created_at: string | null
          id: string
          is_favorite: boolean | null
          lead_score: number | null
          message_content: string
          niche: string | null
          outcome: string | null
          trigger_used: string | null
          user_id: string | null
        }
        Insert: {
          channel?: string | null
          created_at?: string | null
          id?: string
          is_favorite?: boolean | null
          lead_score?: number | null
          message_content: string
          niche?: string | null
          outcome?: string | null
          trigger_used?: string | null
          user_id?: string | null
        }
        Update: {
          channel?: string | null
          created_at?: string | null
          id?: string
          is_favorite?: boolean | null
          lead_score?: number | null
          message_content?: string
          niche?: string | null
          outcome?: string | null
          trigger_used?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      leads_master_view: {
        Row: {
          atividade: string | null
          bairro: string | null
          capital_social: number | null
          cep: string | null
          cidade: string | null
          cnae_principal: string | null
          cnpj: string | null
          confidence_score: number | null
          created_at: string | null
          email: string | null
          email_provider: string | null
          enrichment_data: Json | null
          fantasia: string | null
          final_score: number | null
          funnel_stage: string | null
          has_whatsapp_btn: boolean | null
          id: string | null
          identity_hash: string | null
          instagram_handle: string | null
          is_verified_business: boolean | null
          last_enriched_at: string | null
          meta_pixel_detected: boolean | null
          next_retry_at: string | null
          nicho: string | null
          nome: string | null
          porte: string | null
          raw: Json | null
          razao_social: string | null
          site: string | null
          source: string | null
          status: string | null
          telefone: string | null
          uf: string | null
          updated_at: string | null
          verification_error: string | null
          verification_status: string | null
          verified_at: string | null
          verify_attempts: number | null
        }
        Insert: {
          atividade?: string | null
          bairro?: string | null
          capital_social?: number | null
          cep?: string | null
          cidade?: string | null
          cnae_principal?: string | null
          cnpj?: string | null
          confidence_score?: number | null
          created_at?: string | null
          email?: string | null
          email_provider?: never
          enrichment_data?: Json | null
          fantasia?: string | null
          final_score?: never
          funnel_stage?: string | null
          has_whatsapp_btn?: boolean | null
          id?: string | null
          identity_hash?: string | null
          instagram_handle?: string | null
          is_verified_business?: never
          last_enriched_at?: string | null
          meta_pixel_detected?: boolean | null
          next_retry_at?: string | null
          nicho?: string | null
          nome?: string | null
          porte?: string | null
          raw?: Json | null
          razao_social?: string | null
          site?: string | null
          source?: string | null
          status?: string | null
          telefone?: string | null
          uf?: string | null
          updated_at?: string | null
          verification_error?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verify_attempts?: number | null
        }
        Update: {
          atividade?: string | null
          bairro?: string | null
          capital_social?: number | null
          cep?: string | null
          cidade?: string | null
          cnae_principal?: string | null
          cnpj?: string | null
          confidence_score?: number | null
          created_at?: string | null
          email?: string | null
          email_provider?: never
          enrichment_data?: Json | null
          fantasia?: string | null
          final_score?: never
          funnel_stage?: string | null
          has_whatsapp_btn?: boolean | null
          id?: string | null
          identity_hash?: string | null
          instagram_handle?: string | null
          is_verified_business?: never
          last_enriched_at?: string | null
          meta_pixel_detected?: boolean | null
          next_retry_at?: string | null
          nicho?: string | null
          nome?: string | null
          porte?: string | null
          raw?: Json | null
          razao_social?: string | null
          site?: string | null
          source?: string | null
          status?: string | null
          telefone?: string | null
          uf?: string | null
          updated_at?: string | null
          verification_error?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verify_attempts?: number | null
        }
        Relationships: []
      }
      sales_efficiency_analytics: {
        Row: {
          avg_response_time: number | null
          channel: string | null
          conversions: number | null
          efficiency_score: number | null
          replies: number | null
          total_attempts: number | null
          total_revenue: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      buscar_empresas: {
        Args: { filtro: string }
        Returns: {
          atividade: string | null
          bairro: string | null
          capital_social: number | null
          cep: string | null
          cidade: string | null
          cnae_principal: string | null
          cnpj: string
          confidence_level: string | null
          confidence_score: number | null
          contact_notes: string | null
          created_at: string
          discard_reason: string | null
          email: string | null
          enrichment_data: Json | null
          fantasia: string | null
          follow_up_step: number | null
          followup_history: Json | null
          followup_status: string | null
          funnel_stage: string | null
          has_whatsapp_btn: boolean | null
          id: string
          identity_hash: string | null
          instagram_handle: string | null
          interaction_outcome: string | null
          interest_level: string | null
          is_discarded: boolean | null
          last_contact_at: string | null
          last_enriched_at: string | null
          last_verification_at: string | null
          lead_operation_status: string | null
          meta_pixel_detected: boolean | null
          next_followup_at: string | null
          next_retry_at: string | null
          niche: string | null
          nicho: string | null
          nome: string
          porte: string | null
          raw: Json | null
          razao_social: string | null
          site: string | null
          socios: Json | null
          source: string
          status: string | null
          telefone: string | null
          uf: string | null
          updated_at: string
          verification_error: string | null
          verification_flags: Json | null
          verification_status: string
          verified_at: string | null
          verify_attempts: number
        }[]
        SetofOptions: {
          from: "*"
          to: "leads_import"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      calculate_conversion_probability: {
        Args: { p_lead_id: string }
        Returns: number
      }
      calculate_lead_confidence: {
        Args: { p_lead_id: string }
        Returns: number
      }
      cleanup_expired_location_cache: { Args: never; Returns: undefined }
      cleanup_old_job_events: { Args: never; Returns: undefined }
      generate_lead_identity_hash: {
        Args: {
          p_cidade: string
          p_cnpj: string
          p_nome: string
          p_telefone: string
        }
        Returns: string
      }
      get_buscador_metrics:
        | {
            Args: {
              p_cidades?: string[]
              p_cnae_codes?: string[]
              p_estados?: string[]
              p_fontes?: string[]
              p_portes?: string[]
              p_search_text?: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_cidades?: string[]
              p_cnae_codes?: string[]
              p_estados?: string[]
              p_fontes?: string[]
              p_job_id?: string
              p_portes?: string[]
              p_search_text?: string
            }
            Returns: Json
          }
      get_most_common_import_errors: {
        Args: { p_job_id: string }
        Returns: {
          count: number
          error_message: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      mask_cpf: { Args: { p_cpf: string }; Returns: string }
      normalize_cnae: { Args: { input: string }; Returns: string }
      normalize_socio_key: { Args: { nome: string }; Returns: string }
      recover_stuck_import_jobs: { Args: never; Returns: undefined }
      reset_provider_counters_if_needed: { Args: never; Returns: undefined }
      socios_repetidos: {
        Args: { p_cnpj: string }
        Returns: {
          cnpjs: string[]
          nome_socio: string
          total_empresas: number
        }[]
      }
      unaccent: { Args: { "": string }; Returns: string }
      upsert_lead_merge: { Args: { p: Json }; Returns: Json }
      valida_cpf: { Args: { p_cpf: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "compliance"
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
      app_role: ["admin", "moderator", "user", "compliance"],
    },
  },
} as const
