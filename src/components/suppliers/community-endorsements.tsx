import { Quote, MessageSquare } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * "What the Collective says" — anonymised endorsements mined from the community
 * chat archive. Server component; fetches published endorsements for a supplier.
 */
export async function CommunityEndorsements({ supplierId }: { supplierId: string }) {
  const supabase = createAdminClient()
  const { data: endorsements } = await supabase
    .from('SupplierEndorsement')
    .select('id, quoteSnippet, sentiment, createdAt')
    .eq('supplierId', supplierId)
    .eq('isPublished', true)
    .order('createdAt', { ascending: false })
    .limit(6)

  if (!endorsements || endorsements.length === 0) return null

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-coral" />
          <h3 className="font-display text-lg font-bold uppercase">What the Collective says</h3>
          <span className="text-xs font-bold uppercase text-gray-400">
            · {endorsements.length} {endorsements.length === 1 ? 'mention' : 'mentions'}
          </span>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Anonymised highlights from years of Kindred Collective community discussions.
        </p>
        <div className="space-y-3">
          {endorsements.map((e) => (
            <blockquote key={e.id} className="border-l-4 border-coral bg-gray-50 p-4 flex gap-3">
              <Quote className="w-4 h-4 text-coral shrink-0 mt-1" />
              <p className="text-sm text-gray-700 italic">{e.quoteSnippet}</p>
            </blockquote>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
