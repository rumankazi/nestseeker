import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  ArrowLeft,
  ExternalLink,
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Zap,
  Calendar,
  Euro,
  Home,
  Sofa,
  Clock,
  AlertTriangle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ImageGallery } from '@/components/listings/image-gallery'
import { StatusWorkflow, StatusBadge } from '@/components/listings/status-workflow'
import { ListingNotesClient } from './listing-notes-client'
import { cn } from '@/lib/utils'
import type { Listing } from '@/types/database'

interface PageProps {
  params: Promise<{ id: string }>
}

async function getListing(id: string): Promise<Listing | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Get user's household
  const membershipResult = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .not('accepted_at', 'is', null)
    .single()

  const membership = membershipResult.data as { household_id: string } | null

  if (!membership?.household_id) return null

  const { data: listing } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .eq('household_id', membership.household_id)
    .single()

  if (!listing) return null
  return listing as Listing
}

function getScoreColor(score: number | null): string {
  if (score === null) return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
  if (score >= 80) return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
  if (score >= 60) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
  if (score >= 40) return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
  return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
}

function FeatureItem({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined) return null

  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm">
        <span className="text-muted-foreground">{label}:</span>{' '}
        <span className="font-medium">{value}</span>
      </span>
    </div>
  )
}

export default async function ListingDetailPage({ params }: PageProps) {
  const { id } = await params
  const listing = await getListing(id)

  if (!listing) {
    notFound()
  }

  const features = (listing.features as Record<string, boolean | string | number> | null) || {}
  const featureList = Object.entries(features)
    .filter(([, value]) => value === true || (typeof value === 'string' && value))
    .map(([key]) => key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link href="/listings">
          <Button variant="ghost" size="sm" className="w-fit">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Listings
          </Button>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">{listing.title}</h1>
              {listing.is_urgent && (
                <Badge variant="destructive" className="animate-pulse">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Urgent
                </Badge>
              )}
            </div>

            {(listing.address || listing.city) && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>
                  {[listing.address, listing.postal_code, listing.city].filter(Boolean).join(', ')}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {listing.total_score !== null && (
              <div className={cn(
                'px-4 py-2 rounded-lg font-bold text-xl',
                getScoreColor(listing.total_score)
              )}>
                {listing.total_score.toFixed(0)}
              </div>
            )}

            <Button asChild variant="outline">
              <a href={listing.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Original
              </a>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Images & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery */}
          <ImageGallery images={listing.images || []} title={listing.title} />

          {/* Property Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Property Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <FeatureItem
                  icon={Euro}
                  label="Price"
                  value={listing.price_per_month ? `€${listing.price_per_month.toLocaleString()}/month` : null}
                />
                <FeatureItem
                  icon={Euro}
                  label="Deposit"
                  value={listing.deposit ? `€${listing.deposit.toLocaleString()}` : null}
                />
                <FeatureItem
                  icon={Maximize2}
                  label="Size"
                  value={listing.square_meters ? `${listing.square_meters}m²` : null}
                />
                <FeatureItem
                  icon={Bed}
                  label="Bedrooms"
                  value={listing.bedrooms}
                />
                <FeatureItem
                  icon={Bath}
                  label="Bathrooms"
                  value={listing.bathrooms}
                />
                <FeatureItem
                  icon={Zap}
                  label="Energy Rating"
                  value={listing.energy_rating}
                />
                <FeatureItem
                  icon={Home}
                  label="Property Type"
                  value={listing.property_type}
                />
                <FeatureItem
                  icon={Sofa}
                  label="Furnished"
                  value={listing.furnished}
                />
                <FeatureItem
                  icon={Calendar}
                  label="Available From"
                  value={listing.available_from ? format(new Date(listing.available_from), 'MMM d, yyyy') : null}
                />
                <FeatureItem
                  icon={Clock}
                  label="Min. Contract"
                  value={listing.minimum_contract_months ? `${listing.minimum_contract_months} months` : null}
                />
              </div>

              {/* Features/Amenities */}
              {featureList.length > 0 && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <h4 className="text-sm font-medium mb-2">Features & Amenities</h4>
                    <div className="flex flex-wrap gap-2">
                      {featureList.map((feature) => (
                        <Badge key={feature} variant="secondary">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          {listing.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {listing.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <ListingNotesClient listingId={listing.id} />
        </div>

        {/* Right Column - Status & Actions */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusWorkflow
                currentStatus={listing.status}
                listingId={listing.id}
              />

              {listing.viewing_scheduled_at && (
                <div className="mt-4 p-3 bg-cyan-50 dark:bg-cyan-950 rounded-lg">
                  <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-300">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm font-medium">Viewing Scheduled</span>
                  </div>
                  <p className="text-sm mt-1">
                    {format(new Date(listing.viewing_scheduled_at), 'EEEE, MMMM d, yyyy')} at{' '}
                    {format(new Date(listing.viewing_scheduled_at), 'h:mm a')}
                  </p>
                </div>
              )}

              {listing.viewing_notes && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-1">Viewing Notes</p>
                  <p className="text-sm text-muted-foreground">{listing.viewing_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Score Breakdown */}
          {listing.score_breakdown && Object.keys(listing.score_breakdown as object).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Score Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(listing.score_breakdown as Record<string, number>).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{key.replace(/_/g, ' ')}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${Math.min(100, value)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8 text-right">{value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Source & Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Source & History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Source</span>
                <Badge variant="outline" className="capitalize">{listing.source}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">First Seen</span>
                <span>{format(new Date(listing.first_seen_at), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated</span>
                <span>{format(new Date(listing.updated_at), 'MMM d, yyyy')}</span>
              </div>
              {listing.neighborhood && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Neighborhood</span>
                  <span>{listing.neighborhood}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
