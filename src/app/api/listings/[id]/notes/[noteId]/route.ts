import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// DELETE /api/listings/[id]/notes/[noteId] - Delete a note
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  const { id, noteId } = await params
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

  // Delete the note (only if user owns it)
  const { error } = await supabase
    .from('listing_notes')
    .delete()
    .eq('id', noteId)
    .eq('listing_id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
