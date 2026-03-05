'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Clock, Eye, Calendar, CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { ListingStatus } from '@/types/database'

interface StatusWorkflowProps {
  currentStatus: ListingStatus
  listingId: string
  onStatusChange?: (newStatus: ListingStatus) => void
  className?: string
}

const statusConfig: Record<ListingStatus, {
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  description: string
}> = {
  new: {
    label: 'New',
    icon: Clock,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900',
    description: 'Just added, needs review',
  },
  interested: {
    label: 'Interested',
    icon: Eye,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900',
    description: 'Worth scheduling a viewing',
  },
  viewing_requested: {
    label: 'Viewing Requested',
    icon: Calendar,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900',
    description: 'Waiting for confirmation',
  },
  viewing_scheduled: {
    label: 'Viewing Scheduled',
    icon: Calendar,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900',
    description: 'Appointment confirmed',
  },
  viewed: {
    label: 'Viewed',
    icon: CheckCircle2,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900',
    description: 'Ready for decision',
  },
  accepted: {
    label: 'Accepted',
    icon: Check,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900',
    description: 'Selected as a favorite',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900',
    description: 'Not a good fit',
  },
  unavailable: {
    label: 'Unavailable',
    icon: AlertTriangle,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    description: 'No longer available',
  },
}

const statusOrder: ListingStatus[] = [
  'new',
  'interested',
  'viewing_requested',
  'viewing_scheduled',
  'viewed',
  'accepted',
]

const getNextStatus = (current: ListingStatus): ListingStatus | null => {
  const currentIndex = statusOrder.indexOf(current)
  if (currentIndex === -1 || currentIndex >= statusOrder.length - 1) return null
  return statusOrder[currentIndex + 1]
}

export function StatusWorkflow({ currentStatus, listingId, onStatusChange, className }: StatusWorkflowProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const config = statusConfig[currentStatus]
  const Icon = config.icon
  const nextStatus = getNextStatus(currentStatus)

  const updateStatus = async (newStatus: ListingStatus) => {
    if (isUpdating) return

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/listings/${listingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        onStatusChange?.(newStatus)
      }
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Current Status Display */}
      <div className="flex items-center gap-3">
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className={cn('p-3 rounded-full', config.bgColor)}
        >
          <Icon className={cn('h-6 w-6', config.color)} />
        </motion.div>
        <div>
          <p className={cn('font-semibold', config.color)}>{config.label}</p>
          <p className="text-sm text-muted-foreground">{config.description}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex gap-1">
        {statusOrder.map((status, index) => {
          const currentIndex = statusOrder.indexOf(currentStatus)
          const isCompleted = index <= currentIndex
          const isCurrent = status === currentStatus

          return (
            <div
              key={status}
              className={cn(
                'h-2 flex-1 rounded-full transition-colors',
                isCompleted ? 'bg-primary' : 'bg-muted',
                isCurrent && 'ring-2 ring-primary ring-offset-2'
              )}
            />
          )
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {/* Primary: Move to next status */}
        {nextStatus && currentStatus !== 'rejected' && currentStatus !== 'unavailable' && (
          <Button
            onClick={() => updateStatus(nextStatus)}
            disabled={isUpdating}
            className="flex-1 min-w-[140px]"
          >
            {isUpdating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Move to {statusConfig[nextStatus].label}
          </Button>
        )}

        {/* Status Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" disabled={isUpdating}>
              Change Status
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {Object.entries(statusConfig).map(([status, config]) => {
              const StatusIcon = config.icon
              const isCurrentStatus = status === currentStatus

              return (
                <DropdownMenuItem
                  key={status}
                  onClick={() => updateStatus(status as ListingStatus)}
                  disabled={isCurrentStatus}
                  className={cn(isCurrentStatus && 'bg-muted')}
                >
                  <StatusIcon className={cn('h-4 w-4 mr-2', config.color)} />
                  <span className={cn(isCurrentStatus && 'font-medium')}>
                    {config.label}
                  </span>
                  {isCurrentStatus && (
                    <Check className="h-4 w-4 ml-auto" />
                  )}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Quick Reject */}
        {currentStatus !== 'rejected' && currentStatus !== 'unavailable' && currentStatus !== 'accepted' && (
          <Button
            variant="outline"
            onClick={() => updateStatus('rejected')}
            disabled={isUpdating}
            className="text-destructive hover:text-destructive"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </Button>
        )}
      </div>
    </div>
  )
}

export function StatusBadge({ status, className }: { status: ListingStatus; className?: string }) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium',
      config.bgColor,
      config.color,
      className
    )}>
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </div>
  )
}
