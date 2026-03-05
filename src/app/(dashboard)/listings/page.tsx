import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { Building2 } from 'lucide-react'
import { ListingCard, ListingCardSkeleton } from '@/components/listings/listing-card'
import { ListingFilters } from '@/components/listings/listing-filters'
import { AddListingDialog } from '@/components/listings/add-listing-dialog'
import type { Listing } from '@/types/database'

interface SearchParams {
  status?: string
  source?: string
  search?: string
  sortBy?: string
  sortOrder?: string
  minScore?: string
}

async function getListings(searchParams: SearchParams): Promise<Listing[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  // Get user's household
  const membershipResult = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .not('accepted_at', 'is', null)
    .single()

  const membership = membershipResult.data as { household_id: string } | null

  if (!membership?.household_id) return []

  // Build query
  let query = supabase
    .from('listings')
    .select('*')
    .eq('household_id', membership.household_id)

  // Apply filters
  if (searchParams.status && searchParams.status !== 'all') {
    query = query.eq('status', searchParams.status)
  }

  if (searchParams.source && searchParams.source !== 'all') {
    query = query.eq('source', searchParams.source)
  }

  if (searchParams.search) {
    query = query.or(`title.ilike.%${searchParams.search}%,address.ilike.%${searchParams.search}%,city.ilike.%${searchParams.search}%`)
  }

  if (searchParams.minScore) {
    query = query.gte('total_score', parseFloat(searchParams.minScore))
  }

  // Apply sorting
  const sortBy = searchParams.sortBy || 'created_at'
  const ascending = searchParams.sortOrder === 'asc'
  query = query.order(sortBy, { ascending, nullsFirst: false })

  const { data: listings } = await query

  return (listings as Listing[]) || []
}

function ListingsGrid({ listings }: { listings: Listing[] }) {
  if (listings.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Building2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="mb-2">No listings found</CardTitle>
          <CardDescription className="text-center mb-4">
            Start tracking your house search by adding your first listing.
          </CardDescription>
          <AddListingDialog />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  )
}

function ListingsGridSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  )
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const listings = await getListings(params)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Listings</h1>
          <p className="text-muted-foreground">
            {listings.length} {listings.length === 1 ? 'property' : 'properties'} tracked
          </p>
        </div>
        <AddListingDialog />
      </div>

      <Suspense fallback={null}>
        <ListingFilters />
      </Suspense>

      <Suspense fallback={<ListingsGridSkeleton />}>
        <ListingsGrid listings={listings} />
      </Suspense>
    </div>
  )
}
