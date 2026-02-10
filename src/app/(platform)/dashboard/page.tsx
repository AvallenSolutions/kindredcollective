import { redirect } from 'next/navigation'
import { getSession, getUserMember, getUserBrands, getUserSuppliers } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { DashboardContent } from './dashboard-content'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session.isAuthenticated || !session.user) {
    redirect('/login')
  }

  const supabase = createAdminClient()
  const member = await getUserMember(session.user.id)

  // Fetch ALL user's brands and suppliers via orgs
  const brands = await getUserBrands(session.user.id)
  const suppliers = await getUserSuppliers(session.user.id)

  // Fetch member-level stats (these use userId on their own tables, not brand/supplier)
  const [savedSuppliersResult, eventsResult, offersClaimedResult] = await Promise.all([
    supabase.from('SavedSupplier').select('*', { count: 'exact', head: true }).eq('userId', session.user.id),
    supabase.from('EventRsvp').select('*', { count: 'exact', head: true }).eq('userId', session.user.id).eq('status', 'GOING'),
    supabase.from('OfferClaim').select('*', { count: 'exact', head: true }).eq('userId', session.user.id),
  ])

  const stats = {
    savedSuppliers: savedSuppliersResult.count || 0,
    eventsAttending: eventsResult.count || 0,
    offersClaimed: offersClaimedResult.count || 0,
  }

  // Fetch saved suppliers
  const { data: savedSuppliers } = await supabase
    .from('SavedSupplier')
    .select('supplier:Supplier(id, companyName, slug, tagline, description, logoUrl, category, services, location, country, isVerified)')
    .eq('userId', session.user.id)
    .limit(4)

  // Fetch upcoming events
  const { data: upcomingEvents } = await supabase
    .from('EventRsvp')
    .select('event:Event(*)')
    .eq('userId', session.user.id)
    .eq('status', 'GOING')
    .limit(3)

  // Fetch recent offer claims
  const { data: recentOfferClaims } = await supabase
    .from('OfferClaim')
    .select('*, offer:Offer(*, supplier:Supplier(companyName, slug))')
    .eq('userId', session.user.id)
    .order('createdAt', { ascending: false })
    .limit(4)

  const userData = {
    id: session.user.id,
    email: session.user.email,
    role: session.user.role,
    firstName: member?.firstName || null,
    lastName: member?.lastName || null,
    isAdmin: session.isAdmin,
  }

  const transformedSuppliers = savedSuppliers
    ?.map(s => s.supplier)
    .filter((s): s is NonNullable<typeof s> => s !== null) || []

  const transformedEvents = upcomingEvents
    ?.map(e => e.event)
    .filter((e): e is NonNullable<typeof e> => e !== null) || []

  return (
    <DashboardContent
      user={userData}
      organisations={session.organisations}
      stats={stats}
      savedSuppliers={transformedSuppliers as any}
      upcomingEvents={transformedEvents as any}
      recentOfferClaims={recentOfferClaims as any || []}
      brands={brands}
      suppliers={suppliers}
    />
  )
}
