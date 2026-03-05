-- Row Level Security Policies
-- Ensures users can only access data from their households

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoring_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrape_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_drafts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTION
-- ============================================

-- Get all household IDs for a user
CREATE OR REPLACE FUNCTION public.get_user_household_ids(user_uuid UUID)
RETURNS UUID[] AS $$
  SELECT COALESCE(
    array_agg(household_id),
    '{}'::UUID[]
  )
  FROM public.household_members
  WHERE user_id = user_uuid AND accepted_at IS NOT NULL;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- PROFILES POLICIES
-- ============================================

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- HOUSEHOLDS POLICIES
-- ============================================

CREATE POLICY "Members can view their households"
  ON public.households FOR SELECT
  USING (id = ANY(public.get_user_household_ids(auth.uid())));

CREATE POLICY "Owners can update their households"
  ON public.households FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = id
        AND user_id = auth.uid()
        AND role = 'owner'
        AND accepted_at IS NOT NULL
    )
  );

-- ============================================
-- HOUSEHOLD MEMBERS POLICIES
-- ============================================

CREATE POLICY "Members can view household members"
  ON public.household_members FOR SELECT
  USING (household_id = ANY(public.get_user_household_ids(auth.uid())));

CREATE POLICY "Owners can insert members"
  ON public.household_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.household_members hm
      WHERE hm.household_id = household_members.household_id
        AND hm.user_id = auth.uid()
        AND hm.role = 'owner'
        AND hm.accepted_at IS NOT NULL
    )
  );

CREATE POLICY "Members can update their own membership"
  ON public.household_members FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Owners can delete members"
  ON public.household_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members hm
      WHERE hm.household_id = household_members.household_id
        AND hm.user_id = auth.uid()
        AND hm.role = 'owner'
        AND hm.accepted_at IS NOT NULL
    )
    OR user_id = auth.uid()
  );

-- ============================================
-- HOUSEHOLD INVITATIONS POLICIES
-- ============================================

CREATE POLICY "Members can view invitations"
  ON public.household_invitations FOR SELECT
  USING (household_id = ANY(public.get_user_household_ids(auth.uid())));

CREATE POLICY "Owners can create invitations"
  ON public.household_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.household_members hm
      WHERE hm.household_id = household_invitations.household_id
        AND hm.user_id = auth.uid()
        AND hm.role = 'owner'
        AND hm.accepted_at IS NOT NULL
    )
  );

CREATE POLICY "Owners can delete invitations"
  ON public.household_invitations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members hm
      WHERE hm.household_id = household_invitations.household_id
        AND hm.user_id = auth.uid()
        AND hm.role = 'owner'
        AND hm.accepted_at IS NOT NULL
    )
  );

-- ============================================
-- LISTINGS POLICIES
-- ============================================

CREATE POLICY "Members can view household listings"
  ON public.listings FOR SELECT
  USING (household_id = ANY(public.get_user_household_ids(auth.uid())));

CREATE POLICY "Members can create listings"
  ON public.listings FOR INSERT
  WITH CHECK (household_id = ANY(public.get_user_household_ids(auth.uid())));

CREATE POLICY "Members can update listings"
  ON public.listings FOR UPDATE
  USING (household_id = ANY(public.get_user_household_ids(auth.uid())));

CREATE POLICY "Members can delete listings"
  ON public.listings FOR DELETE
  USING (household_id = ANY(public.get_user_household_ids(auth.uid())));

-- ============================================
-- LISTING NOTES POLICIES
-- ============================================

CREATE POLICY "Members can view listing notes"
  ON public.listing_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_notes.listing_id
        AND l.household_id = ANY(public.get_user_household_ids(auth.uid()))
    )
  );

CREATE POLICY "Members can create notes"
  ON public.listing_notes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_notes.listing_id
        AND l.household_id = ANY(public.get_user_household_ids(auth.uid()))
    )
  );

CREATE POLICY "Users can update own notes"
  ON public.listing_notes FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own notes"
  ON public.listing_notes FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- LISTING SCORES POLICIES
-- ============================================

CREATE POLICY "Members can view listing scores"
  ON public.listing_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_scores.listing_id
        AND l.household_id = ANY(public.get_user_household_ids(auth.uid()))
    )
  );

CREATE POLICY "Members can create scores"
  ON public.listing_scores FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_scores.listing_id
        AND l.household_id = ANY(public.get_user_household_ids(auth.uid()))
    )
  );

CREATE POLICY "Members can update scores"
  ON public.listing_scores FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_scores.listing_id
        AND l.household_id = ANY(public.get_user_household_ids(auth.uid()))
    )
  );

CREATE POLICY "Members can delete scores"
  ON public.listing_scores FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_scores.listing_id
        AND l.household_id = ANY(public.get_user_household_ids(auth.uid()))
    )
  );

-- ============================================
-- SCORING CRITERIA POLICIES
-- ============================================

CREATE POLICY "Members can view scoring criteria"
  ON public.scoring_criteria FOR SELECT
  USING (household_id = ANY(public.get_user_household_ids(auth.uid())));

CREATE POLICY "Members can create criteria"
  ON public.scoring_criteria FOR INSERT
  WITH CHECK (household_id = ANY(public.get_user_household_ids(auth.uid())));

CREATE POLICY "Members can update criteria"
  ON public.scoring_criteria FOR UPDATE
  USING (household_id = ANY(public.get_user_household_ids(auth.uid())));

CREATE POLICY "Members can delete criteria"
  ON public.scoring_criteria FOR DELETE
  USING (household_id = ANY(public.get_user_household_ids(auth.uid())));

-- ============================================
-- SEARCH PROFILES POLICIES
-- ============================================

CREATE POLICY "Members can view search profiles"
  ON public.search_profiles FOR SELECT
  USING (household_id = ANY(public.get_user_household_ids(auth.uid())));

CREATE POLICY "Members can create search profiles"
  ON public.search_profiles FOR INSERT
  WITH CHECK (household_id = ANY(public.get_user_household_ids(auth.uid())));

CREATE POLICY "Members can update search profiles"
  ON public.search_profiles FOR UPDATE
  USING (household_id = ANY(public.get_user_household_ids(auth.uid())));

CREATE POLICY "Members can delete search profiles"
  ON public.search_profiles FOR DELETE
  USING (household_id = ANY(public.get_user_household_ids(auth.uid())));

-- ============================================
-- SCRAPE RUNS POLICIES
-- ============================================

CREATE POLICY "Members can view scrape runs"
  ON public.scrape_runs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.search_profiles sp
      WHERE sp.id = scrape_runs.search_profile_id
        AND sp.household_id = ANY(public.get_user_household_ids(auth.uid()))
    )
  );

-- ============================================
-- NOTIFICATIONS POLICIES
-- ============================================

CREATE POLICY "Users can view their notifications"
  ON public.notifications FOR SELECT
  USING (
    user_id = auth.uid()
    OR (
      user_id IS NULL
      AND household_id = ANY(public.get_user_household_ids(auth.uid()))
    )
  );

CREATE POLICY "Users can update their notifications"
  ON public.notifications FOR UPDATE
  USING (
    user_id = auth.uid()
    OR (
      user_id IS NULL
      AND household_id = ANY(public.get_user_household_ids(auth.uid()))
    )
  );

-- ============================================
-- PUSH SUBSCRIPTIONS POLICIES
-- ============================================

CREATE POLICY "Users can view own subscriptions"
  ON public.push_subscriptions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create subscriptions"
  ON public.push_subscriptions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own subscriptions"
  ON public.push_subscriptions FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- EMAIL DRAFTS POLICIES
-- ============================================

CREATE POLICY "Users can view own email drafts"
  ON public.email_drafts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create email drafts"
  ON public.email_drafts FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own email drafts"
  ON public.email_drafts FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own email drafts"
  ON public.email_drafts FOR DELETE
  USING (user_id = auth.uid());
