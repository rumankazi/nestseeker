import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface Note {
  id: string
  content: string
  created_at: string
  user_id: string
  user_name?: string
}

// GET /api/listings/[id]/notes - Get all notes for a listing
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

  // Verify listing belongs to household
  const { data: listing } = await supabase
    .from('listings')
    .select('id')
    .eq('id', id)
    .eq('household_id', membership.household_id)
    .single()

  if (!listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  }

  // Get notes with user info
  const { data: notes, error } = await supabase
    .from('listing_notes')
    .select(`
      id,
      content,
      created_at,
      user_id,
      profiles!listing_notes_user_id_fkey (
        full_name
      )
    `)
    .eq('listing_id', id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Transform to include user_name
  const transformedNotes: Note[] = (notes || []).map((note: {
    id: string
    content: string
    created_at: string
    user_id: string
    profiles: { full_name: string | null } | null
  }) => ({
    id: note.id,
    content: note.content,
    created_at: note.created_at,
    user_id: note.user_id,
    user_name: note.profiles?.full_name || undefined,
  }))

  return NextResponse.json(transformedNotes)
}

// POST /api/listings/[id]/notes - Add a note to a listing
export async function POST(
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

  // Verify listing belongs to household
  const { data: listing } = await supabase
    .from('listings')
    .select('id')
    .eq('id', id)
    .eq('household_id', membership.household_id)
    .single()

  if (!listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  }

  const body = await request.json()
  const { content } = body

  if (!content?.trim()) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 })
  }

  // Get user's profile for the name
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const profileData = profile as { full_name: string | null } | null

  // Use type assertion since types aren't generated from actual schema yet
  const { data: note, error } = await supabase
    .from('listing_notes')
    .insert({
      listing_id: id,
      user_id: user.id,
      content: content.trim(),
    } as never)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const noteData = note as { id: string; content: string; created_at: string; user_id: string }

  return NextResponse.json({
    ...noteData,
    user_name: profileData?.full_name || undefined,
  } as Note)
}
