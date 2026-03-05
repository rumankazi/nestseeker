import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { Listing, UpdateTables } from '@/types/database'

// GET /api/listings/[id] - Get a single listing
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's household
  const membershipResult = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .not('accepted_at', 'is', null)
    .single()

  const membership = membershipResult.data as { household_id: string } | null

  if (!membership?.household_id) {
    return NextResponse.json({ error: 'No household found' }, { status: 404 })
  }

  const { data: listing, error } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .eq('household_id', membership.household_id)
    .single()

  if (error || !listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  }

  return NextResponse.json(listing as Listing)
}

// PATCH /api/listings/[id] - Update a listing
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's household
  const membershipResult = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .not('accepted_at', 'is', null)
    .single()

  const membership = membershipResult.data as { household_id: string } | null

  if (!membership?.household_id) {
    return NextResponse.json({ error: 'No household found' }, { status: 404 })
  }

  const body = await request.json()

  // Build update object
  const updates: UpdateTables<'listings'> = {}

  // Only include fields that are provided
  const allowedFields = [
    'title', 'description', 'address', 'city', 'postal_code', 'neighborhood',
    'price_per_month', 'deposit', 'square_meters', 'bedrooms', 'bathrooms',
    'property_type', 'furnished', 'features', 'energy_rating', 'available_from',
    'minimum_contract_months', 'images', 'thumbnail_url', 'status',
    'viewing_requested_at', 'viewing_scheduled_at', 'viewing_notes',
    'google_calendar_event_id', 'is_urgent', 'total_score', 'score_breakdown',
    'ai_analysis', 'ai_analyzed_at'
  ]

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      (updates as Record<string, unknown>)[field] = body[field]
    }
  }

  // Handle status change
  if (body.status) {
    updates.status_changed_at = new Date().toISOString()
    updates.status_changed_by = user.id
  }

  const { data: listing, error } = await supabase
    .from('listings')
    .update(updates as never)
    .eq('id', id)
    .eq('household_id', membership.household_id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  }

  return NextResponse.json(listing as Listing)
}

// DELETE /api/listings/[id] - Delete a listing
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's household
  const membershipResult = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .not('accepted_at', 'is', null)
    .single()

  const membership = membershipResult.data as { household_id: string } | null

  if (!membership?.household_id) {
    return NextResponse.json({ error: 'No household found' }, { status: 404 })
  }

  const { error } = await supabase
    .from('listings')
    .delete()
    .eq('id', id)
    .eq('household_id', membership.household_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
