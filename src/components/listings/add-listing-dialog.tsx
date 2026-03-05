'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Link as LinkIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import type { ListingSource } from '@/types/database'

interface AddListingDialogProps {
  children?: React.ReactNode
}

export function AddListingDialog({ children }: AddListingDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('url')
  const router = useRouter()

  // URL import form
  const [url, setUrl] = useState('')

  // Manual form
  const [title, setTitle] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [price, setPrice] = useState('')
  const [squareMeters, setSquareMeters] = useState('')
  const [bedrooms, setBedrooms] = useState('')

  const resetForm = () => {
    setUrl('')
    setTitle('')
    setAddress('')
    setCity('')
    setPrice('')
    setSquareMeters('')
    setBedrooms('')
  }

  const detectSource = (url: string): ListingSource => {
    if (url.includes('funda.nl')) return 'funda'
    if (url.includes('pararius.')) return 'pararius'
    if (url.includes('housinganywhere.')) return 'housinganywhere'
    if (url.includes('kamernet.')) return 'kamernet'
    if (url.includes('huurwoningen.')) return 'huurwoningen'
    return 'manual'
  }

  const handleImportUrl = async () => {
    if (!url.trim()) {
      toast.error('Please enter a URL')
      return
    }

    setIsLoading(true)

    try {
      const source = detectSource(url)

      // For now, create a basic listing with the URL
      // In the future, we'll scrape the URL for details
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          source,
          title: `Listing from ${source}`,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create listing')
      }

      const listing = await response.json()
      toast.success('Listing added successfully!')
      setOpen(false)
      resetForm()
      router.push(`/listings/${listing.id}`)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to import listing')
    } finally {
      setIsLoading(false)
    }
  }

  const handleManualCreate = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: '#manual',
          source: 'manual',
          title: title.trim(),
          address: address.trim() || undefined,
          city: city.trim() || undefined,
          price_per_month: price ? parseFloat(price) : undefined,
          square_meters: squareMeters ? parseInt(squareMeters) : undefined,
          bedrooms: bedrooms ? parseInt(bedrooms) : undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create listing')
      }

      const listing = await response.json()
      toast.success('Listing created successfully!')
      setOpen(false)
      resetForm()
      router.push(`/listings/${listing.id}`)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create listing')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Listing
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Listing</DialogTitle>
          <DialogDescription>
            Import from a URL or add listing details manually.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url">Import from URL</TabsTrigger>
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="url">Listing URL</Label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="url"
                  placeholder="https://www.funda.nl/huur/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="pl-9"
                  disabled={isLoading}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Supported: Funda, Pararius, HousingAnywhere, Kamernet, Huurwoningen
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleImportUrl} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Import
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Beautiful apartment in Amsterdam"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="Street name 123"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="Amsterdam"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (€/mo)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="1500"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sqm">Size (m²)</Label>
                <Input
                  id="sqm"
                  type="number"
                  placeholder="65"
                  value={squareMeters}
                  onChange={(e) => setSquareMeters(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="beds">Bedrooms</Label>
                <Input
                  id="beds"
                  type="number"
                  placeholder="2"
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleManualCreate} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
