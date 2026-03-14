import type { Config } from '@netlify/functions'
import { syncAllFeeds } from '../../src/lib/rss/fetcher'

export default async () => {
  try {
    const result = await syncAllFeeds()
    console.log(`[fetch-news] Done. Added: ${result.added}, Feed errors: ${result.errors.length}`)
    if (result.errors.length > 0) {
      console.warn('[fetch-news] Feed errors:', result.errors)
    }
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[fetch-news] Fatal error:', err)
    return new Response(JSON.stringify({ error: 'Failed to sync feeds' }), { status: 500 })
  }
}

export const config: Config = {
  schedule: '0 */6 * * *', // every 6 hours
}
