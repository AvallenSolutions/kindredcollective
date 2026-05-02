import Link from 'next/link'
import { FileText, Video, Link2, Plus, Filter, Eye, Download, Search } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { formatDate, getInitials } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const TYPE_FILTERS = [
  { value: 'FILE', label: 'Files', Icon: FileText },
  { value: 'VIDEO', label: 'Videos', Icon: Video },
  { value: 'LINK', label: 'Links', Icon: Link2 },
] as const

const TYPE_BADGE: Record<string, { label: string; color: string; Icon: typeof FileText }> = {
  FILE: { label: 'File', color: 'bg-cyan', Icon: FileText },
  VIDEO: { label: 'Video', color: 'bg-coral', Icon: Video },
  LINK: { label: 'Link', color: 'bg-lime', Icon: Link2 },
}

interface SearchParams {
  category?: string
  type?: string
  tag?: string
  search?: string
  sort?: string
}

async function getResourcesData(filters: SearchParams) {
  const supabase = createAdminClient()

  const { data: categories } = await supabase
    .from('ResourceCategory')
    .select('id, name, slug, description, color, order')
    .order('order', { ascending: true })

  let query = supabase
    .from('Resource')
    .select(`
      id, title, description, type, fileName, fileSize, fileMime, url, tags,
      viewCount, downloadCount, createdAt,
      category:ResourceCategory(id, name, slug, color),
      author:User!authorId(
        id, email,
        member:Member(firstName, lastName, avatarUrl, jobTitle, company)
      )
    `, { count: 'exact' })
    .eq('status', 'PUBLISHED')

  if (filters.category) {
    const cat = (categories || []).find(c => c.slug === filters.category)
    if (cat) query = query.eq('categoryId', cat.id)
  }

  if (filters.type && ['FILE', 'VIDEO', 'LINK'].includes(filters.type)) {
    query = query.eq('type', filters.type)
  }

  if (filters.tag) {
    query = query.contains('tags', [filters.tag.toLowerCase()])
  }

  if (filters.search) {
    const pattern = `%${filters.search.replace(/[%_]/g, m => `\\${m}`)}%`
    query = query.or(`title.ilike.${pattern},description.ilike.${pattern}`)
  }

  if (filters.sort === 'oldest') {
    query = query.order('createdAt', { ascending: true })
  } else if (filters.sort === 'popular') {
    query = query.order('downloadCount', { ascending: false })
  } else {
    query = query.order('createdAt', { ascending: false })
  }

  query = query.range(0, 29)

  const { data: resources, count } = await query

  const formatted = (resources || []).map((r: any) => {
    const member = Array.isArray(r.author?.member) ? r.author.member[0] : r.author?.member
    const categoryData = Array.isArray(r.category) ? r.category[0] : r.category
    return {
      id: r.id,
      title: r.title,
      description: r.description,
      type: r.type,
      fileName: r.fileName,
      url: r.url,
      tags: (r.tags || []) as string[],
      viewCount: r.viewCount,
      downloadCount: r.downloadCount,
      createdAt: r.createdAt,
      category: categoryData,
      author: {
        id: r.author?.id,
        name: member ? `${member.firstName} ${member.lastName}` : 'Unknown',
        avatarUrl: member?.avatarUrl,
      },
    }
  })

  return { categories: categories || [], resources: formatted, totalResources: count || 0 }
}

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await getSession()
  if (!session.isAuthenticated) redirect('/login')

  const filters = await searchParams
  const { categories, resources, totalResources } = await getResourcesData(filters)

  function buildQuery(overrides: Partial<SearchParams>): string {
    const params = new URLSearchParams()
    const merged = { ...filters, ...overrides }
    Object.entries(merged).forEach(([k, v]) => {
      if (v) params.set(k, v as string)
    })
    const qs = params.toString()
    return qs ? `?${qs}` : ''
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <section className="pt-32 pb-12 px-6 border-b-2 border-black bg-gray-100 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern pointer-events-none"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 mb-4">
                <span className="w-3 h-3 bg-cyan rounded-full border border-black"></span>
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Member Library</span>
              </div>
              <h1 className="font-display text-5xl md:text-7xl font-bold uppercase tracking-tighter leading-none mb-4">
                Resources
              </h1>
              <p className="text-xl font-medium text-gray-600 max-w-xl">
                Documents, videos, and useful links shared by the community.
              </p>
            </div>
            <Link
              href="/community/resources/new"
              className="px-6 py-3 bg-cyan border-2 border-black font-bold uppercase hover:bg-black hover:text-cyan transition-colors neo-shadow flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Resource
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 shrink-0 space-y-6">
            {/* Search */}
            <form className="bg-white border-2 border-black neo-shadow">
              {/* Preserve other filters */}
              {filters.category && <input type="hidden" name="category" value={filters.category} />}
              {filters.type && <input type="hidden" name="type" value={filters.type} />}
              {filters.tag && <input type="hidden" name="tag" value={filters.tag} />}
              {filters.sort && <input type="hidden" name="sort" value={filters.sort} />}
              <div className="px-4 py-3 bg-black text-white font-bold uppercase text-sm flex items-center gap-2">
                <Search className="w-4 h-4" />
                Search
              </div>
              <div className="p-3">
                <input
                  type="text"
                  name="search"
                  defaultValue={filters.search || ''}
                  placeholder="Title or description"
                  className="w-full px-3 py-2 border-2 border-black text-sm font-medium focus:outline-none focus:border-coral"
                />
                <button
                  type="submit"
                  className="mt-2 w-full px-3 py-2 bg-cyan border-2 border-black text-xs font-bold uppercase hover:bg-black hover:text-cyan transition-colors"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Type filter */}
            <div className="bg-white border-2 border-black neo-shadow">
              <div className="px-4 py-3 bg-black text-white font-bold uppercase text-sm flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Type
              </div>
              <div className="p-2">
                <Link
                  href={`/community/resources${buildQuery({ type: undefined })}`}
                  className={`block px-3 py-2 text-sm font-bold uppercase hover:bg-gray-100 transition-colors ${
                    !filters.type ? 'bg-gray-100 border-l-4 border-black' : ''
                  }`}
                >
                  All Types
                </Link>
                {TYPE_FILTERS.map((t) => (
                  <Link
                    key={t.value}
                    href={`/community/resources${buildQuery({ type: t.value })}`}
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-bold uppercase hover:bg-gray-100 transition-colors ${
                      filters.type === t.value ? 'bg-gray-100 border-l-4 border-black' : ''
                    }`}
                  >
                    <t.Icon className="w-3.5 h-3.5" />
                    {t.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="bg-white border-2 border-black neo-shadow">
              <div className="px-4 py-3 bg-black text-white font-bold uppercase text-sm flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Categories
              </div>
              <div className="p-2">
                <Link
                  href={`/community/resources${buildQuery({ category: undefined })}`}
                  className={`block px-3 py-2 text-sm font-bold uppercase hover:bg-gray-100 transition-colors ${
                    !filters.category ? 'bg-gray-100 border-l-4 border-black' : ''
                  }`}
                >
                  All Categories
                  <span className="text-gray-400 ml-1">({totalResources})</span>
                </Link>
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/community/resources${buildQuery({ category: cat.slug })}`}
                    className={`block px-3 py-2 text-sm font-bold uppercase hover:bg-gray-100 transition-colors ${
                      filters.category === cat.slug ? 'bg-gray-100 border-l-4 border-black' : ''
                    }`}
                  >
                    <span
                      className="inline-block w-2 h-2 rounded-full border border-black mr-2"
                      style={{ backgroundColor: cat.color }}
                    ></span>
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>

            {filters.tag && (
              <div className="bg-amber-50 border-2 border-black p-3 text-xs">
                <p className="font-bold uppercase mb-1">Tag filter</p>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-amber-200 border border-black font-bold">#{filters.tag}</span>
                  <Link
                    href={`/community/resources${buildQuery({ tag: undefined })}`}
                    className="text-coral font-bold underline"
                  >
                    Clear
                  </Link>
                </div>
              </div>
            )}
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <span className="text-xs font-bold uppercase text-gray-500">Sort:</span>
              <Link
                href={`/community/resources${buildQuery({ sort: undefined })}`}
                className={`px-3 py-1 text-xs font-bold uppercase border-2 border-black transition-colors ${
                  !filters.sort || filters.sort === 'newest' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'
                }`}
              >
                Newest
              </Link>
              <Link
                href={`/community/resources${buildQuery({ sort: 'oldest' })}`}
                className={`px-3 py-1 text-xs font-bold uppercase border-2 border-black transition-colors ${
                  filters.sort === 'oldest' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'
                }`}
              >
                Oldest
              </Link>
              <Link
                href={`/community/resources${buildQuery({ sort: 'popular' })}`}
                className={`px-3 py-1 text-xs font-bold uppercase border-2 border-black transition-colors ${
                  filters.sort === 'popular' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'
                }`}
              >
                Most Downloaded
              </Link>
            </div>

            {resources.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {resources.map((r) => {
                  const typeMeta = TYPE_BADGE[r.type] || TYPE_BADGE.LINK
                  const TypeIcon = typeMeta.Icon
                  return (
                    <Link key={r.id} href={`/community/resources/${r.id}`}>
                      <div className="group bg-white border-2 border-black p-5 h-full flex flex-col hover:bg-gray-50 transition-colors neo-shadow-hover cursor-pointer">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className={`w-12 h-12 ${typeMeta.color} border-2 border-black flex items-center justify-center shrink-0`}>
                            <TypeIcon className="w-6 h-6" />
                          </div>
                          {r.category && (
                            <span
                              className="px-2 py-0.5 border border-black text-[10px] font-bold uppercase shrink-0"
                              style={{ backgroundColor: (r.category as any).color + '33' }}
                            >
                              {(r.category as any).name}
                            </span>
                          )}
                        </div>

                        <h3 className="font-display font-bold text-lg uppercase leading-tight mb-2 group-hover:text-coral transition-colors line-clamp-2">
                          {r.title}
                        </h3>

                        <p className="text-sm text-gray-600 line-clamp-3 mb-4 flex-1">
                          {r.description}
                        </p>

                        {r.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {r.tags.slice(0, 4).map((t) => (
                              <span
                                key={t}
                                className="px-2 py-0.5 bg-gray-100 border border-gray-300 text-[10px] font-bold uppercase"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-2 text-xs text-gray-500 pt-3 border-t border-gray-200">
                          <span className="flex items-center gap-1 truncate">
                            <span className="w-5 h-5 rounded-full border border-black bg-cyan flex items-center justify-center overflow-hidden">
                              {r.author.avatarUrl ? (
                                <img src={r.author.avatarUrl} className="w-full h-full object-cover" alt="" />
                              ) : (
                                <span className="text-[8px] font-bold">{getInitials(r.author.name)}</span>
                              )}
                            </span>
                            <span className="font-bold truncate">{r.author.name}</span>
                          </span>
                          <span className="flex items-center gap-3 shrink-0">
                            <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{r.viewCount}</span>
                            {r.type === 'FILE' && (
                              <span className="flex items-center gap-1"><Download className="w-3 h-3" />{r.downloadCount}</span>
                            )}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2">{formatDate(r.createdAt)}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-gray-50 border-2 border-black">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium mb-4">
                  {filters.search || filters.category || filters.type || filters.tag
                    ? 'No resources match your filters.'
                    : 'No resources yet. Be the first to share!'}
                </p>
                <Link
                  href="/community/resources/new"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-cyan border-2 border-black font-bold uppercase hover:bg-black hover:text-cyan transition-colors neo-shadow"
                >
                  <Plus className="w-5 h-5" />
                  Add Resource
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
