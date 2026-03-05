'use client'

import { ListingNotes } from '@/components/listings/listing-notes'

interface ListingNotesClientProps {
  listingId: string
}

export function ListingNotesClient({ listingId }: ListingNotesClientProps) {
  return <ListingNotes listingId={listingId} />
}
