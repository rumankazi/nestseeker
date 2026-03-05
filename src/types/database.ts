export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ListingStatus =
  | 'new'
  | 'interested'
  | 'viewing_requested'
  | 'viewing_scheduled'
  | 'viewed'
  | 'accepted'
  | 'rejected'
  | 'unavailable'

export type ListingSource =
  | 'funda'
  | 'pararius'
  | 'housinganywhere'
  | 'kamernet'
  | 'huurwoningen'
  | 'manual'

export type CriteriaType = 'boolean' | 'numeric' | 'enum'

export type NotificationType =
  | 'new_listing'
  | 'listing_update'
  | 'viewing_reminder'
  | 'viewing_confirmation'
  | 'partner_action'
  | 'system'

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          notification_preferences: Json
          google_refresh_token: string | null
          google_calendar_enabled: boolean
          gmail_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          notification_preferences?: Json
          google_refresh_token?: string | null
          google_calendar_enabled?: boolean
          gmail_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          notification_preferences?: Json
          google_refresh_token?: string | null
          google_calendar_enabled?: boolean
          gmail_enabled?: boolean
          updated_at?: string
        }
      }
      households: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          updated_at?: string
        }
      }
      household_members: {
        Row: {
          id: string
          household_id: string
          user_id: string
          role: 'owner' | 'member'
          invited_at: string
          accepted_at: string | null
        }
        Insert: {
          id?: string
          household_id: string
          user_id: string
          role?: 'owner' | 'member'
          invited_at?: string
          accepted_at?: string | null
        }
        Update: {
          role?: 'owner' | 'member'
          accepted_at?: string | null
        }
      }
      listings: {
        Row: {
          id: string
          household_id: string
          source: ListingSource
          external_id: string | null
          url: string
          title: string
          description: string | null
          address: string | null
          city: string | null
          postal_code: string | null
          neighborhood: string | null
          price_per_month: number | null
          deposit: number | null
          square_meters: number | null
          bedrooms: number | null
          bathrooms: number | null
          property_type: string | null
          furnished: string | null
          features: Json
          energy_rating: string | null
          available_from: string | null
          minimum_contract_months: number | null
          images: string[]
          thumbnail_url: string | null
          status: ListingStatus
          status_changed_at: string
          status_changed_by: string | null
          ai_analysis: Json | null
          ai_analyzed_at: string | null
          total_score: number | null
          score_breakdown: Json
          viewing_requested_at: string | null
          viewing_scheduled_at: string | null
          viewing_notes: string | null
          google_calendar_event_id: string | null
          first_seen_at: string
          last_scraped_at: string | null
          scrape_hash: string | null
          is_urgent: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          household_id: string
          source: ListingSource
          external_id?: string | null
          url: string
          title: string
          description?: string | null
          address?: string | null
          city?: string | null
          postal_code?: string | null
          neighborhood?: string | null
          price_per_month?: number | null
          deposit?: number | null
          square_meters?: number | null
          bedrooms?: number | null
          bathrooms?: number | null
          property_type?: string | null
          furnished?: string | null
          features?: Json
          energy_rating?: string | null
          available_from?: string | null
          minimum_contract_months?: number | null
          images?: string[]
          thumbnail_url?: string | null
          status?: ListingStatus
          status_changed_at?: string
          status_changed_by?: string | null
          ai_analysis?: Json | null
          ai_analyzed_at?: string | null
          total_score?: number | null
          score_breakdown?: Json
          viewing_requested_at?: string | null
          viewing_scheduled_at?: string | null
          viewing_notes?: string | null
          google_calendar_event_id?: string | null
          first_seen_at?: string
          last_scraped_at?: string | null
          scrape_hash?: string | null
          is_urgent?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          source?: ListingSource
          external_id?: string | null
          url?: string
          title?: string
          description?: string | null
          address?: string | null
          city?: string | null
          postal_code?: string | null
          neighborhood?: string | null
          price_per_month?: number | null
          deposit?: number | null
          square_meters?: number | null
          bedrooms?: number | null
          bathrooms?: number | null
          property_type?: string | null
          furnished?: string | null
          features?: Json
          energy_rating?: string | null
          available_from?: string | null
          minimum_contract_months?: number | null
          images?: string[]
          thumbnail_url?: string | null
          status?: ListingStatus
          status_changed_at?: string
          status_changed_by?: string | null
          ai_analysis?: Json | null
          ai_analyzed_at?: string | null
          total_score?: number | null
          score_breakdown?: Json
          viewing_requested_at?: string | null
          viewing_scheduled_at?: string | null
          viewing_notes?: string | null
          google_calendar_event_id?: string | null
          last_scraped_at?: string | null
          scrape_hash?: string | null
          is_urgent?: boolean
          updated_at?: string
        }
      }
      scoring_criteria: {
        Row: {
          id: string
          household_id: string
          name: string
          description: string | null
          weight: number
          criteria_type: CriteriaType
          config: Json
          is_default: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          household_id: string
          name: string
          description?: string | null
          weight?: number
          criteria_type: CriteriaType
          config?: Json
          is_default?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          weight?: number
          criteria_type?: CriteriaType
          config?: Json
          is_default?: boolean
          display_order?: number
          updated_at?: string
        }
      }
      listing_notes: {
        Row: {
          id: string
          listing_id: string
          user_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          listing_id: string
          user_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          content?: string
          updated_at?: string
        }
      }
      listing_scores: {
        Row: {
          id: string
          listing_id: string
          criteria_id: string
          value: Json
          score: number
          is_ai_suggested: boolean
          confirmed_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          listing_id: string
          criteria_id: string
          value: Json
          score: number
          is_ai_suggested?: boolean
          confirmed_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          value?: Json
          score?: number
          is_ai_suggested?: boolean
          confirmed_by?: string | null
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          household_id: string
          user_id: string | null
          type: NotificationType
          title: string
          message: string
          data: Json
          priority: NotificationPriority
          read_at: string | null
          dismissed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          household_id: string
          user_id?: string | null
          type: NotificationType
          title: string
          message: string
          data?: Json
          priority?: NotificationPriority
          read_at?: string | null
          dismissed_at?: string | null
          created_at?: string
        }
        Update: {
          read_at?: string | null
          dismissed_at?: string | null
        }
      }
      search_profiles: {
        Row: {
          id: string
          household_id: string
          name: string
          is_active: boolean
          cities: string[]
          postal_codes: string[]
          neighborhoods: string[]
          min_price: number | null
          max_price: number | null
          min_square_meters: number | null
          max_square_meters: number | null
          min_bedrooms: number | null
          max_bedrooms: number | null
          property_types: string[]
          furnished_options: string[]
          sources: string[]
          notify_immediately: boolean
          minimum_score_to_notify: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          household_id: string
          name?: string
          is_active?: boolean
          cities?: string[]
          postal_codes?: string[]
          neighborhoods?: string[]
          min_price?: number | null
          max_price?: number | null
          min_square_meters?: number | null
          max_square_meters?: number | null
          min_bedrooms?: number | null
          max_bedrooms?: number | null
          property_types?: string[]
          furnished_options?: string[]
          sources?: string[]
          notify_immediately?: boolean
          minimum_score_to_notify?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          is_active?: boolean
          cities?: string[]
          postal_codes?: string[]
          neighborhoods?: string[]
          min_price?: number | null
          max_price?: number | null
          min_square_meters?: number | null
          max_square_meters?: number | null
          min_bedrooms?: number | null
          max_bedrooms?: number | null
          property_types?: string[]
          furnished_options?: string[]
          sources?: string[]
          notify_immediately?: boolean
          minimum_score_to_notify?: number | null
          updated_at?: string
        }
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

// Convenience types
export type Profile = Tables<'profiles'>
export type Household = Tables<'households'>
export type HouseholdMember = Tables<'household_members'>
export type Listing = Tables<'listings'>
export type ListingNote = Tables<'listing_notes'>
export type ScoringCriteria = Tables<'scoring_criteria'>
export type ListingScore = Tables<'listing_scores'>
export type Notification = Tables<'notifications'>
export type SearchProfile = Tables<'search_profiles'>
