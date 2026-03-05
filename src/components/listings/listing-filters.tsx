'use client'

import { useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'new', label: 'New' },
  { value: 'interested', label: 'Interested' },
  { value: 'viewing_requested', label: 'Viewing Requested' },
  { value: 'viewing_scheduled', label: 'Viewing Scheduled' },
  { value: 'viewed', label: 'Viewed' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
]

const sourceOptions = [
  { value: 'all', label: 'All Sources' },
  { value: 'funda', label: 'Funda' },
  { value: 'pararius', label: 'Pararius' },
  { value: 'housinganywhere', label: 'HousingAnywhere' },
  { value: 'kamernet', label: 'Kamernet' },
  { value: 'huurwoningen', label: 'Huurwoningen' },
  { value: 'manual', label: 'Manual' },
]

const sortOptions = [
  { value: 'created_at:desc', label: 'Newest First' },
  { value: 'created_at:asc', label: 'Oldest First' },
  { value: 'price_per_month:asc', label: 'Price: Low to High' },
  { value: 'price_per_month:desc', label: 'Price: High to Low' },
  { value: 'total_score:desc', label: 'Score: High to Low' },
  { value: 'total_score:asc', label: 'Score: Low to High' },
  { value: 'square_meters:desc', label: 'Size: Large to Small' },
  { value: 'square_meters:asc', label: 'Size: Small to Large' },
]

interface ListingFiltersProps {
  className?: string
}

export function ListingFilters({ className }: ListingFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const status = searchParams.get('status') || 'all'
  const source = searchParams.get('source') || 'all'
  const sort = `${searchParams.get('sortBy') || 'created_at'}:${searchParams.get('sortOrder') || 'desc'}`
  const search = searchParams.get('search') || ''

  const createQueryString = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())

      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === '' || value === 'all') {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      }

      return params.toString()
    },
    [searchParams]
  )

  const updateFilters = (updates: Record<string, string | null>) => {
    const queryString = createQueryString(updates)
    router.push(`/listings${queryString ? `?${queryString}` : ''}`)
  }

  const handleStatusChange = (value: string) => {
    updateFilters({ status: value })
  }

  const handleSourceChange = (value: string) => {
    updateFilters({ source: value })
  }

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split(':')
    updateFilters({ sortBy, sortOrder })
  }

  const handleSearchChange = (value: string) => {
    updateFilters({ search: value || null })
  }

  const clearFilters = () => {
    router.push('/listings')
  }

  const hasActiveFilters = status !== 'all' || source !== 'all' || search

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search listings..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filters Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 px-1.5">
                  {[status !== 'all', source !== 'all', search].filter(Boolean).length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Status</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={status} onValueChange={handleStatusChange}>
              {statusOptions.map((option) => (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>

            <DropdownMenuSeparator />

            <DropdownMenuLabel>Source</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={source} onValueChange={handleSourceChange}>
              {sourceOptions.map((option) => (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>

            <DropdownMenuSeparator />

            <DropdownMenuLabel>Sort By</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={sort} onValueChange={handleSortChange}>
              {sortOptions.map((option) => (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {status !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Status: {statusOptions.find(o => o.value === status)?.label}
              <button onClick={() => handleStatusChange('all')} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {source !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Source: {sourceOptions.find(o => o.value === source)?.label}
              <button onClick={() => handleSourceChange('all')} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {search && (
            <Badge variant="secondary" className="gap-1">
              Search: {search}
              <button onClick={() => handleSearchChange('')} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
