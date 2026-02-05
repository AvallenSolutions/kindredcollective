import { redirect } from 'next/navigation'
import { getSession, getUserMember, getUserSupplier, getUserBrand } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { DashboardContent } from './dashboard-content'

export default async function DashboardPage() {
  const session = await getSession()

  if (!session.isAuthenticated || !session.user) {
    redirect('/login')
  }

  const supabase = createAdminClient()

  // Fetch user's member profile
  const member = await getUserMember(session.user.id)

  // Fetch user's supplier profile if they are a supplier
  const supplier = session.isSupplier ? await getUserSupplier(session.user.id) : null

  // Fetch user's brand profile if they are a brand
  const brand = session.isBrand ? await getUserBrand(session.user.id) : null

  // Fetch stats based on user role
  let stats = {
    savedSuppliers: 0,
    eventsAttending: 0,
    offersClaimed: 0,
    profileViews: 0,
    activeOffers: 0,
    offerClaims: 0,
    enquiries: 0,
  }

  // Get counts from database
  const [savedSuppliersResult, eventsResult, offersClaimedResult] = await Promise.all([
    supabase.from('SavedSupplier').select('*', { count: 'exact', head: true }).eq('userId', session.user.id),
    supabase.from('EventRsvp').select('*', { count: 'exact', head: true }).eq('userId', session.user.id).eq('status', 'GOING'),
    supabase.from('OfferClaim').select('*', { count: 'exact', head: true }).eq('userId', session.user.id),
  ])

  stats.savedSuppliers = savedSuppliersResult.count || 0
  stats.eventsAttending = eventsResult.count || 0
  stats.offersClaimed = offersClaimedResult.count || 0

  // If user is a supplier, get supplier-specific stats
  if (supplier) {
    const [offersResult, claimsResult] = await Promise.all([
      supabase.from('Offer').select('*', { count: 'exact', head: true }).eq('supplierId', supplier.id).eq('status', 'ACTIVE'),
      supabase.from('OfferClaim').select('*, offer:Offer!inner(supplierId)', { count: 'exact', head: true }).eq('offer.supplierId', supplier.id),
    ])

    stats.profileViews = supplier.viewCount || 0
    stats.activeOffers = offersResult.count || 0
    stats.offerClaims = claimsResult.count || 0
  }

  // Fetch saved suppliers for the dashboard
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
    isSupplier: session.isSupplier,
    isBrand: session.isBrand,
    isMember: session.isMember,
  }

  // Transform data for the dashboard content
  const transformedSuppliers = savedSuppliers
    ?.map(s => s.supplier)
    .filter((s): s is NonNullable<typeof s> => s !== null) || []

  const transformedEvents = upcomingEvents
    ?.map(e => e.event)
    .filter((e): e is NonNullable<typeof e> => e !== null) || []

  return (
    <DashboardContent
      user={userData}
      stats={stats}
      savedSuppliers={transformedSuppliers as any}
      upcomingEvents={transformedEvents as any}
      recentOfferClaims={recentOfferClaims as any || []}
      supplier={supplier}
      brand={brand}
    />
  )
}
