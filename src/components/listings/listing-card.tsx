'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Building2, MapPin, Bed, Maximize2, Zap, ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Listing, ListingStatus, ListingSource } from '@/types/database'

const statusConfig: Record<ListingStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
  new: { label: 'New', variant: 'default', className: 'bg-blue-500 hover:bg-blue-600' },
  interested: { label: 'Interested', variant: 'default', className: 'bg-purple-500 hover:bg-purple-600' },
  viewing_requested: { label: 'Viewing Requested', variant: 'default', className: 'bg-amber-500 hover:bg-amber-600' },
  viewing_scheduled: { label: 'Viewing Scheduled', variant: 'default', className: 'bg-cyan-500 hover:bg-cyan-600' },
  viewed: { label: 'Viewed', variant: 'default', className: 'bg-indigo-500 hover:bg-indigo-600' },
  accepted: { label: 'Accepted', variant: 'default', className: 'bg-green-500 hover:bg-green-600' },
  rejected: { label: 'Rejected', variant: 'destructive' },
  unavailable: { label: 'Unavailable', variant: 'secondary' },
}

const sourceLogos: Record<ListingSource, string> = {
  funda: '/images/sources/funda.svg',
  pararius: '/images/sources/pararius.svg',
  housinganywhere: '/images/sources/housinganywhere.svg',
  kamernet: '/images/sources/kamernet.svg',
  huurwoningen: '/images/sources/huurwoningen.svg',
  manual: '',
}

function getScoreColor(score: number | null): string {
  if (score === null) return 'bg-gray-100 text-gray-600'
  if (score >= 80) return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
  if (score >= 60) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
  if (score >= 40) return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
  return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
}

interface ListingCardProps {
  listing: Listing
  className?: string
}

export function ListingCard({ listing, className }: ListingCardProps) {
  const status = statusConfig[listing.status]
  const hasScore = listing.total_score !== null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link href={`/listings/${listing.id}`}>
        <Card className={cn(
          'overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer group',
          listing.is_urgent && 'ring-2 ring-red-500',
          className
        )}>
          {/* Image */}
          <div className="aspect-[16/10] bg-muted relative overflow-hidden">
            {listing.thumbnail_url ? (
              <Image
                src={listing.thumbnail_url}
                alt={listing.title}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Building2 className="h-16 w-16 text-muted-foreground/50" />
              </div>
            )}

            {/* Status Badge */}
            <div className="absolute top-2 left-2">
              <Badge className={cn('shadow-sm', status.className)} variant={status.variant}>
                {status.label}
              </Badge>
            </div>

            {/* Score Badge */}
            {hasScore && (
              <div className="absolute top-2 right-2">
                <div className={cn(
                  'px-2 py-1 rounded-md font-semibold text-sm shadow-sm',
                  getScoreColor(listing.total_score)
                )}>
                  {listing.total_score?.toFixed(0)}
                </div>
              </div>
            )}

            {/* Urgent Badge */}
            {listing.is_urgent && (
              <div className="absolute bottom-2 left-2">
                <Badge variant="destructive" className="animate-pulse">
                  Urgent
                </Badge>
              </div>
            )}

            {/* Source Logo */}
            {listing.source !== 'manual' && sourceLogos[listing.source] && (
              <div className="absolute bottom-2 right-2 bg-white/90 rounded px-1.5 py-0.5">
                <span className="text-xs font-medium capitalize">{listing.source}</span>
              </div>
            )}
          </div>

          {/* Content */}
          <CardContent className="p-4">
            {/* Title & Price */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">
                {listing.title}
              </h3>
              {listing.price_per_month && (
                <span className="font-bold text-primary whitespace-nowrap">
                  €{listing.price_per_month.toLocaleString()}
                </span>
              )}
            </div>

            {/* Location */}
            {(listing.address || listing.city) && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="line-clamp-1">
                  {listing.address ? `${listing.address}, ` : ''}{listing.city}
                </span>
              </div>
            )}

            {/* Features */}
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {listing.square_meters && (
                <div className="flex items-center gap-1">
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span>{listing.square_meters}m²</span>
                </div>
              )}
              {listing.bedrooms && (
                <div className="flex items-center gap-1">
                  <Bed className="h-3.5 w-3.5" />
                  <span>{listing.bedrooms} bed</span>
                </div>
              )}
              {listing.energy_rating && (
                <div className="flex items-center gap-1">
                  <Zap className="h-3.5 w-3.5" />
                  <span>{listing.energy_rating}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
}

export function ListingCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-[16/10] bg-muted animate-pulse" />
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between">
          <div className="h-5 bg-muted animate-pulse rounded w-2/3" />
          <div className="h-5 bg-muted animate-pulse rounded w-16" />
        </div>
        <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
        <div className="flex gap-3">
          <div className="h-4 bg-muted animate-pulse rounded w-12" />
          <div className="h-4 bg-muted animate-pulse rounded w-12" />
          <div className="h-4 bg-muted animate-pulse rounded w-8" />
        </div>
      </CardContent>
    </Card>
  )
}
