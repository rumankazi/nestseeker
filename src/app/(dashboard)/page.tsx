import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Eye, Calendar, CheckCircle2 } from 'lucide-react'

interface DashboardStats {
  total: number
  interested: number
  viewingsScheduled: number
  viewed: number
}

async function getDashboardStats(): Promise<DashboardStats | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Get user's household
  // Type assertion needed until we generate types from actual Supabase schema
  const membershipResult = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .not('accepted_at', 'is', null)
    .single()

  const membership = membershipResult.data as { household_id: string } | null

  if (!membership?.household_id) return null

  // Get listing counts by status
  const listingsResult = await supabase
    .from('listings')
    .select('status')
    .eq('household_id', membership.household_id)

  const listingsArray = (listingsResult.data as { status: string }[] | null) || []

  const stats: DashboardStats = {
    total: listingsArray.length,
    interested: listingsArray.filter(l => l.status === 'interested').length,
    viewingsScheduled: listingsArray.filter(l => l.status === 'viewing_scheduled').length,
    viewed: listingsArray.filter(l => l.status === 'viewed').length,
  }

  return stats
}

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to NestSeeker. Track your house hunting progress here.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              Properties you&apos;re tracking
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interested</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.interested || 0}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting viewing request
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Viewings Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.viewingsScheduled || 0}</div>
            <p className="text-xs text-muted-foreground">
              Upcoming viewings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Viewed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.viewed || 0}</div>
            <p className="text-xs text-muted-foreground">
              Ready for decision
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest updates on your listings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No recent activity. Start by adding your first listing!
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Viewings</CardTitle>
            <CardDescription>
              Your scheduled property viewings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No viewings scheduled yet.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
