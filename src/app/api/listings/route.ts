import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { Listing, InsertTables } from '@/types/database'

// GET /api/listings - Get all listings for the user's household
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const source = searchParams.get('source')
  const minScore = searchParams.get('minScore')
  const sortBy = searchParams.get('sortBy') || 'created_at'
  const sortOrder = searchParams.get('sortOrder') || 'desc'

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

  // Build query
  let query = supabase
    .from('listings')
    .select('*')
    .eq('household_id', membership.household_id)

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  if (source && source !== 'all') {
    query = query.eq('source', source)
  }

  if (minScore) {
    query = query.gte('total_score', parseFloat(minScore))
  }

  // Apply sorting
  const ascending = sortOrder === 'asc'
  query = query.order(sortBy, { ascending, nullsFirst: false })

  const { data: listings, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(listings as Listing[])
}

// POST /api/listings - Create a new listing
export async function POST(request: Request) {
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

  const listing: InsertTables<'listings'> = {
    household_id: membership.household_id,
    source: body.source || 'manual',
    url: body.url,
    title: body.title,
    description: body.description,
    address: body.address,
    city: body.city,
    postal_code: body.postal_code,
    neighborhood: body.neighborhood,
    price_per_month: body.price_per_month,
    deposit: body.deposit,
    square_meters: body.square_meters,
    bedrooms: body.bedrooms,
    bathrooms: body.bathrooms,
    property_type: body.property_type,
    furnished: body.furnished,
    features: body.features || {},
    energy_rating: body.energy_rating,
    available_from: body.available_from,
    minimum_contract_months: body.minimum_contract_months,
    images: body.images || [],
    thumbnail_url: body.thumbnail_url,
    external_id: body.external_id,
    status: 'new',
    status_changed_by: user.id,
  }

  const { data, error } = await supabase
    .from('listings')
    .insert(listing as never)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data as Listing, { status: 201 })
}
