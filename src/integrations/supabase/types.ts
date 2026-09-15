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
      admin_verifications: {
        Row: {
          created_at: string
          user_id: string
          verified_until: string
        }
        Insert: {
          created_at?: string
          user_id: string
          verified_until: string
        }
        Update: {
          created_at?: string
          user_id?: string
          verified_until?: string
        }
        Relationships: []
      }
      advances: {
        Row: {
          agreed_by_worker: boolean
          amount: number
          balance: number
          contractor_id: string
          created_at: string
          date: string
          id: string
          installment_amount: number | null
          reason: string | null
          repayment_type: string
          status: string
          total_repaid: number
          weeks: number | null
          worker_id: string
        }
        Insert: {
          agreed_by_worker?: boolean
          amount: number
          balance?: number
          contractor_id: string
          created_at?: string
          date?: string
          id?: string
          installment_amount?: number | null
          reason?: string | null
          repayment_type?: string
          status?: string
          total_repaid?: number
          weeks?: number | null
          worker_id: string
        }
        Update: {
          agreed_by_worker?: boolean
          amount?: number
          balance?: number
          contractor_id?: string
          created_at?: string
          date?: string
          id?: string
          installment_amount?: number | null
          reason?: string | null
          repayment_type?: string
          status?: string
          total_repaid?: number
          weeks?: number | null
          worker_id?: string
        }
        Relationships: []
      }
      appointment_letters: {
        Row: {
          content_json: Json
          contractor_id: string
          created_at: string
          id: string
          job_id: string | null
          pdf_url: string | null
          signed_at: string | null
          status: string
          worker_id: string
        }
        Insert: {
          content_json?: Json
          contractor_id: string
          created_at?: string
          id?: string
          job_id?: string | null
          pdf_url?: string | null
          signed_at?: string | null
          status?: string
          worker_id: string
        }
        Update: {
          content_json?: Json
          contractor_id?: string
          created_at?: string
          id?: string
          job_id?: string | null
          pdf_url?: string | null
          signed_at?: string | null
          status?: string
          worker_id?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: string | null
          entity: string | null
          entity_id: string | null
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: string | null
          entity?: string | null
          entity_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: string | null
          entity?: string | null
          entity_id?: string | null
          id?: string
        }
        Relationships: []
      }
      client_profiles: {
        Row: {
          company_name: string | null
          created_at: string
          id: string
          location: string | null
          project_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          id?: string
          location?: string | null
          project_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          id?: string
          location?: string | null
          project_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      completion_certificates: {
        Row: {
          certificate_number: string
          contractor_id: string
          contractor_name: string | null
          end_date: string | null
          id: string
          issued_at: string
          job_id: string | null
          job_title: string | null
          site_name: string | null
          skills: string | null
          start_date: string | null
          worker_id: string
          worker_name: string | null
        }
        Insert: {
          certificate_number: string
          contractor_id: string
          contractor_name?: string | null
          end_date?: string | null
          id?: string
          issued_at?: string
          job_id?: string | null
          job_title?: string | null
          site_name?: string | null
          skills?: string | null
          start_date?: string | null
          worker_id: string
          worker_name?: string | null
        }
        Update: {
          certificate_number?: string
          contractor_id?: string
          contractor_name?: string | null
          end_date?: string | null
          id?: string
          issued_at?: string
          job_id?: string | null
          job_title?: string | null
          site_name?: string | null
          skills?: string | null
          start_date?: string | null
          worker_id?: string
          worker_name?: string | null
        }
        Relationships: []
      }
      compliance_docs: {
        Row: {
          created_at: string
          doc_number: string | null
          doc_type: string
          expires_on: string | null
          file_url: string | null
          id: string
          issued_on: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          doc_number?: string | null
          doc_type: string
          expires_on?: string | null
          file_url?: string | null
          id?: string
          issued_on?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          doc_number?: string | null
          doc_type?: string
          expires_on?: string | null
          file_url?: string | null
          id?: string
          issued_on?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contractor_plans: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          plan: string
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contractor_profiles: {
        Row: {
          business_registration_number: string | null
          company_name: string
          created_at: string
          gst_number: string | null
          id: string
          kyc_document_url: string | null
          kyc_reviewed_at: string | null
          kyc_status: string
          max_labour_per_day: number
          total_hired_today: number
          updated_at: string
          user_id: string
        }
        Insert: {
          business_registration_number?: string | null
          company_name: string
          created_at?: string
          gst_number?: string | null
          id?: string
          kyc_document_url?: string | null
          kyc_reviewed_at?: string | null
          kyc_status?: string
          max_labour_per_day?: number
          total_hired_today?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          business_registration_number?: string | null
          company_name?: string
          created_at?: string
          gst_number?: string | null
          id?: string
          kyc_document_url?: string | null
          kyc_reviewed_at?: string | null
          kyc_status?: string
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
      daily_tasks: {
        Row: {
          completed_at: string | null
          contractor_id: string
          created_at: string
          description: string
          id: string
          job_id: string | null
          status: string
          task_date: string
          updated_at: string
          worker_id: string
        }
        Insert: {
          completed_at?: string | null
          contractor_id: string
          created_at?: string
          description: string
          id?: string
          job_id?: string | null
          status?: string
          task_date?: string
          updated_at?: string
          worker_id: string
        }
        Update: {
          completed_at?: string | null
          contractor_id?: string
          created_at?: string
          description?: string
          id?: string
          job_id?: string | null
          status?: string
          task_date?: string
          updated_at?: string
          worker_id?: string
        }
        Relationships: []
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
      documents: {
        Row: {
          created_at: string
          doc_type: string
          file_name: string
          file_path: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          doc_type: string
          file_name: string
          file_path: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          doc_type?: string
          file_name?: string
          file_path?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      dpr_reports: {
        Row: {
          contractor_id: string
          created_at: string
          id: string
          issues: string | null
          job_id: string | null
          materials_used: string | null
          notes: string | null
          photo_url: string | null
          report_date: string
          tasks_completed: number | null
          tasks_total: number | null
          updated_at: string
          workers_present: number | null
        }
        Insert: {
          contractor_id: string
          created_at?: string
          id?: string
          issues?: string | null
          job_id?: string | null
          materials_used?: string | null
          notes?: string | null
          photo_url?: string | null
          report_date?: string
          tasks_completed?: number | null
          tasks_total?: number | null
          updated_at?: string
          workers_present?: number | null
        }
        Update: {
          contractor_id?: string
          created_at?: string
          id?: string
          issues?: string | null
          job_id?: string | null
          materials_used?: string | null
          notes?: string | null
          photo_url?: string | null
          report_date?: string
          tasks_completed?: number | null
          tasks_total?: number | null
          updated_at?: string
          workers_present?: number | null
        }
        Relationships: []
      }
      fraud_flags: {
        Row: {
          created_at: string
          details: string | null
          flag_type: string
          id: string
          job_id: string | null
          resolved: boolean
          severity: string
          subject_id: string | null
        }
        Insert: {
          created_at?: string
          details?: string | null
          flag_type: string
          id?: string
          job_id?: string | null
          resolved?: boolean
          severity?: string
          subject_id?: string | null
        }
        Update: {
          created_at?: string
          details?: string | null
          flag_type?: string
          id?: string
          job_id?: string | null
          resolved?: boolean
          severity?: string
          subject_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fraud_flags_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
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
      job_work_proof: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          job_id: string | null
          photo_url: string
          stage: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          job_id?: string | null
          photo_url: string
          stage: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          job_id?: string | null
          photo_url?: string
          stage?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_work_proof_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          contractor_id: string
          created_at: string
          description: string | null
          duration_days: number | null
          geofence_radius_m: number
          id: string
          is_urgent: boolean
          live_progress_percent: number
          location: string
          pin_code: string | null
          price_offered: number
          progress_updated_at: string | null
          required_skill: string
          site_lat: number | null
          site_lng: number | null
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
          geofence_radius_m?: number
          id?: string
          is_urgent?: boolean
          live_progress_percent?: number
          location: string
          pin_code?: string | null
          price_offered?: number
          progress_updated_at?: string | null
          required_skill: string
          site_lat?: number | null
          site_lng?: number | null
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
          geofence_radius_m?: number
          id?: string
          is_urgent?: boolean
          live_progress_percent?: number
          location?: string
          pin_code?: string | null
          price_offered?: number
          progress_updated_at?: string | null
          required_skill?: string
          site_lat?: number | null
          site_lng?: number | null
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
      labour_payments: {
        Row: {
          advance_paid: number
          amount_due: number
          contractor_id: string
          created_at: string
          daily_rate: number
          days_worked: number
          expected_payment_date: string | null
          id: string
          job_id: string | null
          labour_id: string
          payment_promise_note: string | null
          skill: string | null
          status: string
          updated_at: string
        }
        Insert: {
          advance_paid?: number
          amount_due?: number
          contractor_id: string
          created_at?: string
          daily_rate?: number
          days_worked?: number
          expected_payment_date?: string | null
          id?: string
          job_id?: string | null
          labour_id: string
          payment_promise_note?: string | null
          skill?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          advance_paid?: number
          amount_due?: number
          contractor_id?: string
          created_at?: string
          daily_rate?: number
          days_worked?: number
          expected_payment_date?: string | null
          id?: string
          job_id?: string | null
          labour_id?: string
          payment_promise_note?: string | null
          skill?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
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
      materials: {
        Row: {
          contractor_id: string
          cost_per_unit: number
          created_at: string
          id: string
          job_id: string
          name: string
          notes: string | null
          quantity: number
          supplier: string | null
          unit: string
          updated_at: string
          used: number
        }
        Insert: {
          contractor_id: string
          cost_per_unit?: number
          created_at?: string
          id?: string
          job_id: string
          name: string
          notes?: string | null
          quantity?: number
          supplier?: string | null
          unit?: string
          updated_at?: string
          used?: number
        }
        Update: {
          contractor_id?: string
          cost_per_unit?: number
          created_at?: string
          id?: string
          job_id?: string
          name?: string
          notes?: string | null
          quantity?: number
          supplier?: string | null
          unit?: string
          updated_at?: string
          used?: number
        }
        Relationships: [
          {
            foreignKeyName: "materials_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          receiver_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          receiver_id: string
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      milestones: {
        Row: {
          client_approved: boolean
          client_approved_at: string | null
          client_note: string | null
          contractor_id: string
          created_at: string
          description: string | null
          id: string
          job_id: string
          progress_percent: number
          status: string
          target_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          client_approved?: boolean
          client_approved_at?: string | null
          client_note?: string | null
          contractor_id: string
          created_at?: string
          description?: string | null
          id?: string
          job_id: string
          progress_percent?: number
          status?: string
          target_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          client_approved?: boolean
          client_approved_at?: string | null
          client_note?: string | null
          contractor_id?: string
          created_at?: string
          description?: string | null
          id?: string
          job_id?: string
          progress_percent?: number
          status?: string
          target_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestones_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      minimum_wages: {
        Row: {
          created_at: string
          effective_date: string
          id: string
          skill_category: string
          source_url: string | null
          state: string
          wage_per_day: number
        }
        Insert: {
          created_at?: string
          effective_date?: string
          id?: string
          skill_category: string
          source_url?: string | null
          state: string
          wage_per_day: number
        }
        Update: {
          created_at?: string
          effective_date?: string
          id?: string
          skill_category?: string
          source_url?: string | null
          state?: string
          wage_per_day?: number
        }
        Relationships: []
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
      payment_history: {
        Row: {
          amount: number
          contractor_id: string
          created_at: string
          id: string
          labour_id: string
          labour_payment_id: string | null
          note: string | null
          payment_method: string
          payment_reference: string | null
        }
        Insert: {
          amount: number
          contractor_id: string
          created_at?: string
          id?: string
          labour_id: string
          labour_payment_id?: string | null
          note?: string | null
          payment_method?: string
          payment_reference?: string | null
        }
        Update: {
          amount?: number
          contractor_id?: string
          created_at?: string
          id?: string
          labour_id?: string
          labour_payment_id?: string | null
          note?: string | null
          payment_method?: string
          payment_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_history_labour_payment_id_fkey"
            columns: ["labour_payment_id"]
            isOneToOne: false
            referencedRelation: "labour_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_proofs: {
        Row: {
          amount: number | null
          confirmed_at: string | null
          confirmed_by_labour: boolean
          contractor_id: string
          created_at: string
          id: string
          labour_id: string
          labour_payment_id: string | null
          note: string | null
          payment_history_id: string | null
          proof_type: string
          proof_url: string
        }
        Insert: {
          amount?: number | null
          confirmed_at?: string | null
          confirmed_by_labour?: boolean
          contractor_id: string
          created_at?: string
          id?: string
          labour_id: string
          labour_payment_id?: string | null
          note?: string | null
          payment_history_id?: string | null
          proof_type?: string
          proof_url: string
        }
        Update: {
          amount?: number | null
          confirmed_at?: string | null
          confirmed_by_labour?: boolean
          contractor_id?: string
          created_at?: string
          id?: string
          labour_id?: string
          labour_payment_id?: string | null
          note?: string | null
          payment_history_id?: string | null
          proof_type?: string
          proof_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_proofs_labour_payment_id_fkey"
            columns: ["labour_payment_id"]
            isOneToOne: false
            referencedRelation: "labour_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_proofs_payment_history_id_fkey"
            columns: ["payment_history_id"]
            isOneToOne: false
            referencedRelation: "payment_history"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_receipts: {
        Row: {
          amount: number
          contractor_id: string
          contractor_name: string | null
          created_at: string
          days_worked: number | null
          id: string
          labour_id: string
          labour_name: string | null
          payment_history_id: string | null
          payment_method: string
          payment_reference: string | null
          receipt_number: string
          skill: string | null
          upi_id: string | null
        }
        Insert: {
          amount: number
          contractor_id: string
          contractor_name?: string | null
          created_at?: string
          days_worked?: number | null
          id?: string
          labour_id: string
          labour_name?: string | null
          payment_history_id?: string | null
          payment_method?: string
          payment_reference?: string | null
          receipt_number: string
          skill?: string | null
          upi_id?: string | null
        }
        Update: {
          amount?: number
          contractor_id?: string
          contractor_name?: string | null
          created_at?: string
          days_worked?: number | null
          id?: string
          labour_id?: string
          labour_name?: string | null
          payment_history_id?: string | null
          payment_method?: string
          payment_reference?: string | null
          receipt_number?: string
          skill?: string | null
          upi_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_receipts_payment_history_id_fkey"
            columns: ["payment_history_id"]
            isOneToOne: false
            referencedRelation: "payment_history"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          aadhaar_last4: string | null
          account_holder_name: string | null
          account_number: string | null
          address: string | null
          bank_branch: string | null
          bank_name: string | null
          created_at: string
          date_of_birth: string | null
          emergency_contact_email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          eshram_number: string | null
          eshram_verified: boolean
          eshram_verified_at: string | null
          full_name: string
          id: string
          id_card_generated_at: string | null
          id_card_number: string | null
          ifsc_code: string | null
          is_available: boolean
          location: string | null
          payment_details_updated_at: string | null
          payment_frequency: string
          phone: string | null
          pin_code: string | null
          profile_complete: boolean
          profile_image_url: string | null
          profile_photo_url: string | null
          rating_avg: number
          rating_count: number
          updated_at: string
          upi_id: string | null
          upi_verified: boolean
          work_passport_token: string | null
        }
        Insert: {
          aadhaar_last4?: string | null
          account_holder_name?: string | null
          account_number?: string | null
          address?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          created_at?: string
          date_of_birth?: string | null
          emergency_contact_email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          eshram_number?: string | null
          eshram_verified?: boolean
          eshram_verified_at?: string | null
          full_name: string
          id: string
          id_card_generated_at?: string | null
          id_card_number?: string | null
          ifsc_code?: string | null
          is_available?: boolean
          location?: string | null
          payment_details_updated_at?: string | null
          payment_frequency?: string
          phone?: string | null
          pin_code?: string | null
          profile_complete?: boolean
          profile_image_url?: string | null
          profile_photo_url?: string | null
          rating_avg?: number
          rating_count?: number
          updated_at?: string
          upi_id?: string | null
          upi_verified?: boolean
          work_passport_token?: string | null
        }
        Update: {
          aadhaar_last4?: string | null
          account_holder_name?: string | null
          account_number?: string | null
          address?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          created_at?: string
          date_of_birth?: string | null
          emergency_contact_email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          eshram_number?: string | null
          eshram_verified?: boolean
          eshram_verified_at?: string | null
          full_name?: string
          id?: string
          id_card_generated_at?: string | null
          id_card_number?: string | null
          ifsc_code?: string | null
          is_available?: boolean
          location?: string | null
          payment_details_updated_at?: string | null
          payment_frequency?: string
          phone?: string | null
          pin_code?: string | null
          profile_complete?: boolean
          profile_image_url?: string | null
          profile_photo_url?: string | null
          rating_avg?: number
          rating_count?: number
          updated_at?: string
          upi_id?: string | null
          upi_verified?: boolean
          work_passport_token?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          created_at: string
          enabled: boolean
          endpoint: string
          id: string
          lat: number | null
          lng: number | null
          radius_km: number
          subscription: Json | null
          updated_at: string
          worker_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          endpoint: string
          id?: string
          lat?: number | null
          lng?: number | null
          radius_km?: number
          subscription?: Json | null
          updated_at?: string
          worker_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          endpoint?: string
          id?: string
          lat?: number | null
          lng?: number | null
          radius_km?: number
          subscription?: Json | null
          updated_at?: string
          worker_id?: string
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
          tags: string[] | null
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
          tags?: string[] | null
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
          tags?: string[] | null
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
      site_attendance: {
        Row: {
          check_in_lat: number | null
          check_in_lng: number | null
          check_in_time: string
          check_out_time: string | null
          contractor_id: string | null
          created_at: string
          distance_m: number | null
          id: string
          is_within_geofence: boolean
          job_id: string | null
          worker_id: string
        }
        Insert: {
          check_in_lat?: number | null
          check_in_lng?: number | null
          check_in_time?: string
          check_out_time?: string | null
          contractor_id?: string | null
          created_at?: string
          distance_m?: number | null
          id?: string
          is_within_geofence?: boolean
          job_id?: string | null
          worker_id: string
        }
        Update: {
          check_in_lat?: number | null
          check_in_lng?: number | null
          check_in_time?: string
          check_out_time?: string | null
          contractor_id?: string | null
          created_at?: string
          distance_m?: number | null
          id?: string
          is_within_geofence?: boolean
          job_id?: string | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_attendance_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      site_checkins: {
        Row: {
          created_at: string
          id: string
          job_id: string | null
          kind: string
          latitude: number | null
          longitude: number | null
          photo_url: string | null
          place_name: string | null
          worker_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id?: string | null
          kind?: string
          latitude?: number | null
          longitude?: number | null
          photo_url?: string | null
          place_name?: string | null
          worker_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string | null
          kind?: string
          latitude?: number | null
          longitude?: number | null
          photo_url?: string | null
          place_name?: string | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_checkins_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      site_proofs: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          job_id: string | null
          media_type: string
          media_url: string
          status: string
          uploaded_by: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          job_id?: string | null
          media_type?: string
          media_url: string
          status?: string
          uploaded_by: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          job_id?: string | null
          media_type?: string
          media_url?: string
          status?: string
          uploaded_by?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_proofs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      sos_alerts: {
        Row: {
          address: string | null
          admin_notes: string | null
          created_at: string
          email_status: string
          id: string
          latitude: number | null
          longitude: number | null
          notify_detail: string | null
          resolved_at: string | null
          status: string
          whatsapp_status: string
          worker_id: string
        }
        Insert: {
          address?: string | null
          admin_notes?: string | null
          created_at?: string
          email_status?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          notify_detail?: string | null
          resolved_at?: string | null
          status?: string
          whatsapp_status?: string
          worker_id: string
        }
        Update: {
          address?: string | null
          admin_notes?: string | null
          created_at?: string
          email_status?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          notify_detail?: string | null
          resolved_at?: string | null
          status?: string
          whatsapp_status?: string
          worker_id?: string
        }
        Relationships: []
      }
      sub_contractors: {
        Row: {
          agreed_amount: number
          contractor_id: string
          created_at: string
          id: string
          job_id: string | null
          name: string
          notes: string | null
          paid_amount: number
          phone: string | null
          scope_of_work: string | null
          status: string
          updated_at: string
        }
        Insert: {
          agreed_amount?: number
          contractor_id: string
          created_at?: string
          id?: string
          job_id?: string | null
          name: string
          notes?: string | null
          paid_amount?: number
          phone?: string | null
          scope_of_work?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          agreed_amount?: number
          contractor_id?: string
          created_at?: string
          id?: string
          job_id?: string | null
          name?: string
          notes?: string | null
          paid_amount?: number
          phone?: string | null
          scope_of_work?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sub_contractors_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      training_videos: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          skill_category: string
          title: string
          youtube_url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          skill_category: string
          title: string
          youtube_url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          skill_category?: string
          title?: string
          youtube_url?: string
        }
        Relationships: []
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
      wage_advance_requests: {
        Row: {
          approved_at: string | null
          contractor_id: string
          created_at: string
          decision_note: string | null
          id: string
          job_id: string | null
          reason: string | null
          repaid_at: string | null
          requested_amount: number
          requested_at: string
          status: string
          updated_at: string
          worker_id: string
        }
        Insert: {
          approved_at?: string | null
          contractor_id: string
          created_at?: string
          decision_note?: string | null
          id?: string
          job_id?: string | null
          reason?: string | null
          repaid_at?: string | null
          requested_amount: number
          requested_at?: string
          status?: string
          updated_at?: string
          worker_id: string
        }
        Update: {
          approved_at?: string | null
          contractor_id?: string
          created_at?: string
          decision_note?: string | null
          id?: string
          job_id?: string | null
          reason?: string | null
          repaid_at?: string | null
          requested_amount?: number
          requested_at?: string
          status?: string
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wage_advance_requests_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
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
      wage_escrow: {
        Row: {
          amount: number
          contractor_id: string
          created_at: string
          id: string
          job_id: string | null
          released_at: string | null
          status: string
          updated_at: string
          worker_id: string
          worker_marked_complete_at: string | null
        }
        Insert: {
          amount: number
          contractor_id: string
          created_at?: string
          id?: string
          job_id?: string | null
          released_at?: string | null
          status?: string
          updated_at?: string
          worker_id: string
          worker_marked_complete_at?: string | null
        }
        Update: {
          amount?: number
          contractor_id?: string
          created_at?: string
          id?: string
          job_id?: string | null
          released_at?: string | null
          status?: string
          updated_at?: string
          worker_id?: string
          worker_marked_complete_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wage_escrow_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      work_orders: {
        Row: {
          amount: number
          contractor_id: string
          contractor_signed_at: string | null
          created_at: string
          description: string
          duration_days: number
          id: string
          job_id: string | null
          start_date: string | null
          status: string
          updated_at: string
          worker_id: string
          worker_signed_at: string | null
        }
        Insert: {
          amount?: number
          contractor_id: string
          contractor_signed_at?: string | null
          created_at?: string
          description: string
          duration_days?: number
          id?: string
          job_id?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
          worker_id: string
          worker_signed_at?: string | null
        }
        Update: {
          amount?: number
          contractor_id?: string
          contractor_signed_at?: string | null
          created_at?: string
          description?: string
          duration_days?: number
          id?: string
          job_id?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
          worker_id?: string
          worker_signed_at?: string | null
        }
        Relationships: []
      }
      worker_availability: {
        Row: {
          created_at: string
          expires_at: string
          full_name: string
          id: string
          location: string
          note: string | null
          phone: string | null
          price_per_day: number
          skill: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          full_name: string
          id?: string
          location: string
          note?: string | null
          phone?: string | null
          price_per_day?: number
          skill: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          full_name?: string
          id?: string
          location?: string
          note?: string | null
          phone?: string | null
          price_per_day?: number
          skill?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      worker_skill_badges: {
        Row: {
          badge_level: string
          certified_at: string
          certified_by: string | null
          created_at: string
          id: string
          note: string | null
          skill_name: string
          worker_id: string
        }
        Insert: {
          badge_level?: string
          certified_at?: string
          certified_by?: string | null
          created_at?: string
          id?: string
          note?: string | null
          skill_name: string
          worker_id: string
        }
        Update: {
          badge_level?: string
          certified_at?: string
          certified_by?: string | null
          created_at?: string
          id?: string
          note?: string | null
          skill_name?: string
          worker_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_get_profile: {
        Args: { _user_id: string }
        Returns: {
          aadhaar_last4: string | null
          account_holder_name: string | null
          account_number: string | null
          address: string | null
          bank_branch: string | null
          bank_name: string | null
          created_at: string
          date_of_birth: string | null
          emergency_contact_email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          eshram_number: string | null
          eshram_verified: boolean
          eshram_verified_at: string | null
          full_name: string
          id: string
          id_card_generated_at: string | null
          id_card_number: string | null
          ifsc_code: string | null
          is_available: boolean
          location: string | null
          payment_details_updated_at: string | null
          payment_frequency: string
          phone: string | null
          pin_code: string | null
          profile_complete: boolean
          profile_image_url: string | null
          profile_photo_url: string | null
          rating_avg: number
          rating_count: number
          updated_at: string
          upi_id: string | null
          upi_verified: boolean
          work_passport_token: string | null
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_list_profiles: {
        Args: never
        Returns: {
          aadhaar_last4: string | null
          account_holder_name: string | null
          account_number: string | null
          address: string | null
          bank_branch: string | null
          bank_name: string | null
          created_at: string
          date_of_birth: string | null
          emergency_contact_email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          eshram_number: string | null
          eshram_verified: boolean
          eshram_verified_at: string | null
          full_name: string
          id: string
          id_card_generated_at: string | null
          id_card_number: string | null
          ifsc_code: string | null
          is_available: boolean
          location: string | null
          payment_details_updated_at: string | null
          payment_frequency: string
          phone: string | null
          pin_code: string | null
          profile_complete: boolean
          profile_image_url: string | null
          profile_photo_url: string | null
          rating_avg: number
          rating_count: number
          updated_at: string
          upi_id: string | null
          upi_verified: boolean
          work_passport_token: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_my_profile: {
        Args: never
        Returns: {
          aadhaar_last4: string | null
          account_holder_name: string | null
          account_number: string | null
          address: string | null
          bank_branch: string | null
          bank_name: string | null
          created_at: string
          date_of_birth: string | null
          emergency_contact_email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          eshram_number: string | null
          eshram_verified: boolean
          eshram_verified_at: string | null
          full_name: string
          id: string
          id_card_generated_at: string | null
          id_card_number: string | null
          ifsc_code: string | null
          is_available: boolean
          location: string | null
          payment_details_updated_at: string | null
          payment_frequency: string
          phone: string | null
          pin_code: string | null
          profile_complete: boolean
          profile_image_url: string | null
          profile_photo_url: string | null
          rating_avg: number
          rating_count: number
          updated_at: string
          upi_id: string | null
          upi_verified: boolean
          work_passport_token: string | null
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_public_worker: {
        Args: { _user_id: string }
        Returns: {
          created_at: string
          full_name: string
          id: string
          id_card_number: string
          location: string
          phone: string
          profile_photo_url: string
          rating_avg: number
          rating_count: number
          upi_id: string
        }[]
      }
      get_public_worker_skill: {
        Args: { _user_id: string }
        Returns: {
          experience_years: number
          price_per_day: number
          skill: string
        }[]
      }
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
      is_job_contractor: {
        Args: { _job_id: string; _uid: string }
        Returns: boolean
      }
      is_my_worker: {
        Args: { _contractor_uid: string; _worker_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "contractor" | "labour" | "client"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "contractor", "labour", "client"],
      job_status: ["open", "closed"],
      notification_type: ["request", "accepted", "rejected", "system"],
      request_status: ["pending", "accepted", "rejected"],
    },
  },
} as const
