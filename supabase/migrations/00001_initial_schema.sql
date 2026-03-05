-- NestSeeker Database Schema
-- Initial migration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USER PROFILES
-- ============================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  notification_preferences JSONB DEFAULT '{
    "email": true,
    "push": true,
    "urgent_only": false,
    "quiet_hours_start": null,
    "quiet_hours_end": null
  }'::jsonb,
  google_refresh_token TEXT,
  google_calendar_enabled BOOLEAN DEFAULT false,
  gmail_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- HOUSEHOLDS (Multi-user support)
-- ============================================

CREATE TABLE public.households (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT 'My Household',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.household_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(household_id, user_id)
);

CREATE TABLE public.household_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES public.profiles(id),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SCORING CRITERIA
-- ============================================

CREATE TABLE public.scoring_criteria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  weight INTEGER NOT NULL DEFAULT 1 CHECK (weight >= 1 AND weight <= 10),
  criteria_type TEXT NOT NULL CHECK (criteria_type IN ('boolean', 'numeric', 'enum')),
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_default BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LISTINGS
-- ============================================

CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,

  -- Source information
  source TEXT NOT NULL CHECK (source IN ('funda', 'pararius', 'housinganywhere', 'kamernet', 'huurwoningen', 'manual')),
  external_id TEXT,
  url TEXT NOT NULL,

  -- Basic info
  title TEXT NOT NULL,
  description TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  neighborhood TEXT,

  -- Property details
  price_per_month DECIMAL(10, 2),
  deposit DECIMAL(10, 2),
  square_meters INTEGER,
  bedrooms INTEGER,
  bathrooms INTEGER,
  property_type TEXT,
  furnished TEXT CHECK (furnished IN ('furnished', 'unfurnished', 'partially_furnished', 'unknown')),

  -- Features
  features JSONB DEFAULT '{}'::jsonb,
  energy_rating TEXT,
  available_from DATE,
  minimum_contract_months INTEGER,

  -- Images
  images TEXT[] DEFAULT '{}',
  thumbnail_url TEXT,

  -- Status workflow
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN (
    'new',
    'interested',
    'viewing_requested',
    'viewing_scheduled',
    'viewed',
    'accepted',
    'rejected',
    'unavailable'
  )),
  status_changed_at TIMESTAMPTZ DEFAULT NOW(),
  status_changed_by UUID REFERENCES public.profiles(id),

  -- AI analysis
  ai_analysis JSONB DEFAULT NULL,
  ai_analyzed_at TIMESTAMPTZ,

  -- Scores
  total_score DECIMAL(5, 2),
  score_breakdown JSONB DEFAULT '{}'::jsonb,

  -- Viewing information
  viewing_requested_at TIMESTAMPTZ,
  viewing_scheduled_at TIMESTAMPTZ,
  viewing_notes TEXT,
  google_calendar_event_id TEXT,

  -- Metadata
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_scraped_at TIMESTAMPTZ,
  scrape_hash TEXT,
  is_urgent BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(household_id, source, external_id)
);

-- Listing notes from household members
CREATE TABLE public.listing_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual criteria scores per listing
CREATE TABLE public.listing_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  criteria_id UUID NOT NULL REFERENCES public.scoring_criteria(id) ON DELETE CASCADE,
  value JSONB NOT NULL,
  score DECIMAL(5, 2) NOT NULL,
  is_ai_suggested BOOLEAN DEFAULT false,
  confirmed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(listing_id, criteria_id)
);

-- ============================================
-- SEARCH PROFILES & SCRAPING
-- ============================================

CREATE TABLE public.search_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Default Search',
  is_active BOOLEAN DEFAULT true,

  -- Location criteria
  cities TEXT[] DEFAULT '{}',
  postal_codes TEXT[] DEFAULT '{}',
  neighborhoods TEXT[] DEFAULT '{}',

  -- Price range
  min_price DECIMAL(10, 2),
  max_price DECIMAL(10, 2),

  -- Property criteria
  min_square_meters INTEGER,
  max_square_meters INTEGER,
  min_bedrooms INTEGER,
  max_bedrooms INTEGER,
  property_types TEXT[] DEFAULT '{}',
  furnished_options TEXT[] DEFAULT '{}',

  -- Sources to scrape
  sources TEXT[] DEFAULT ARRAY['funda', 'pararius'],

  -- Notification settings
  notify_immediately BOOLEAN DEFAULT true,
  minimum_score_to_notify DECIMAL(5, 2),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.scrape_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  search_profile_id UUID REFERENCES public.search_profiles(id) ON DELETE SET NULL,
  source TEXT NOT NULL,

  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  listings_found INTEGER DEFAULT 0,
  listings_new INTEGER DEFAULT 0,
  listings_updated INTEGER DEFAULT 0,

  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),

  type TEXT NOT NULL CHECK (type IN (
    'new_listing',
    'listing_update',
    'viewing_reminder',
    'viewing_confirmation',
    'partner_action',
    'system'
  )),

  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,

  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

  read_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  keys JSONB NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- ============================================
-- EMAIL DRAFTS
-- ============================================

CREATE TABLE public.email_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),

  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  recipient_email TEXT,

  is_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  gmail_message_id TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_listings_household_status ON public.listings(household_id, status);
CREATE INDEX idx_listings_household_source ON public.listings(household_id, source);
CREATE INDEX idx_listings_created_at ON public.listings(created_at DESC);
CREATE INDEX idx_listings_total_score ON public.listings(total_score DESC NULLS LAST);
CREATE INDEX idx_listings_is_urgent ON public.listings(household_id, is_urgent) WHERE is_urgent = true;
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, created_at DESC) WHERE read_at IS NULL;
CREATE INDEX idx_household_members_user ON public.household_members(user_id);
CREATE INDEX idx_search_profiles_active ON public.search_profiles(household_id, is_active) WHERE is_active = true;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_households_updated_at
  BEFORE UPDATE ON public.households
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_listing_notes_updated_at
  BEFORE UPDATE ON public.listing_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_listing_scores_updated_at
  BEFORE UPDATE ON public.listing_scores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_scoring_criteria_updated_at
  BEFORE UPDATE ON public.scoring_criteria
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_search_profiles_updated_at
  BEFORE UPDATE ON public.search_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_email_drafts_updated_at
  BEFORE UPDATE ON public.email_drafts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- USER CREATION TRIGGER
-- ============================================

-- Auto-create profile and household on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_household_id UUID;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );

  -- Create default household
  INSERT INTO public.households (name)
  VALUES ('My Household')
  RETURNING id INTO new_household_id;

  -- Add user as household owner
  INSERT INTO public.household_members (household_id, user_id, role, accepted_at)
  VALUES (new_household_id, NEW.id, 'owner', NOW());

  -- Create default scoring criteria
  INSERT INTO public.scoring_criteria (household_id, name, description, weight, criteria_type, config, is_default, display_order)
  VALUES
    (new_household_id, 'Balcony', 'Does the property have a balcony?', 3, 'boolean', '{}', true, 1),
    (new_household_id, 'Bedrooms', 'Number of bedrooms', 5, 'numeric', '{"min": 1, "max": 5, "optimal": 2}', true, 2),
    (new_household_id, 'Energy Rating', 'Energy efficiency rating', 4, 'enum', '{"values": ["A+++", "A++", "A+", "A", "B", "C", "D", "E", "F", "G"], "scores": {"A+++": 100, "A++": 95, "A+": 90, "A": 85, "B": 70, "C": 55, "D": 40, "E": 30, "F": 20, "G": 10}}', true, 3),
    (new_household_id, 'Price', 'Monthly rent (lower is better)', 5, 'numeric', '{"min": 800, "max": 2500, "optimal_direction": "lower"}', true, 4),
    (new_household_id, 'Square Meters', 'Living space size', 4, 'numeric', '{"min": 30, "max": 150, "optimal_direction": "higher"}', true, 5),
    (new_household_id, 'Furnished', 'Is the property furnished?', 2, 'boolean', '{}', true, 6),
    (new_household_id, 'Parking', 'Parking availability', 2, 'boolean', '{}', true, 7),
    (new_household_id, 'Garden', 'Access to garden or outdoor space', 3, 'boolean', '{}', true, 8),
    (new_household_id, 'Kitchen Island', 'Has a kitchen island', 2, 'boolean', '{}', true, 9),
    (new_household_id, 'Gas Stove', 'Has gas cooking', 2, 'boolean', '{}', true, 10);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- REALTIME NOTIFICATION TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION public.notify_new_listing()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'new_listing',
    json_build_object(
      'household_id', NEW.household_id,
      'listing_id', NEW.id,
      'title', NEW.title,
      'is_urgent', NEW.is_urgent
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_listing_created
  AFTER INSERT ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_listing();
