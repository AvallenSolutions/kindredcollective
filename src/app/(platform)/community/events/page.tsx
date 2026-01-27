import { Calendar } from 'lucide-react'
import { Badge } from '@/components/ui'
import { createAdminClient } from '@/lib/supabase/admin'
import { EventsDirectory } from './events-directory'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getEvents() {
  try {
    const supabase = createAdminClient()

    const { data: events, error } = await supabase
      .from('Event')
      .select('id, title, slug, description, type, status, startDate, endDate, isVirtual, venueName, city, country, capacity, isFree, price, isFeatured')
      .eq('status', 'PUBLISHED')
      .order('startDate', { ascending: true })

    if (error || !events) {
      console.error('Error fetching events:', error)
      return []
    }

    return events
  } catch (err) {
    console.error('Failed to fetch events:', err)
    return []
  }
}

export default async function EventsPage() {
  const events = await getEvents()

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-amber-400 py-12 border-b-4 border-black">
        <div className="section-container">
          <Badge className="mb-4 bg-black text-amber-400 border-black">
            <Calendar className="w-3 h-3 mr-1" />
            {events.length} Events
          </Badge>
          <h1 className="font-display text-display-sm lg:text-display-md mb-4">
            Events & Meetups
          </h1>
          <p className="text-lg max-w-2xl">
            Trade shows, networking events, workshops, and Kindred community gatherings.
            Connect with the industry in person and online.
          </p>
        </div>
      </section>

      <EventsDirectory events={events} />
    </div>
  )
}
