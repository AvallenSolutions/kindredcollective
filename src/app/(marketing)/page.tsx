import Link from 'next/link'
import { Search, Globe, LayoutDashboard, Scissors, Star, ArrowRight, Ticket } from 'lucide-react'
import { Button } from '@/components/ui'
import { createAdminClient } from '@/lib/supabase/admin'

// Force dynamic rendering so featured suppliers rotate on every page load
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getFeaturedSuppliers(count = 4) {
  try {
    const supabase = createAdminClient()

    const { data: suppliers, error } = await supabase
      .from('Supplier')
      .select('id, companyName, slug, logoUrl, category, services, location, country, isVerified, isPublic')
      .eq('isPublic', true)

    if (error || !suppliers || suppliers.length === 0) {
      return []
    }

    // Shuffle and pick `count` random suppliers
    for (let i = suppliers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [suppliers[i], suppliers[j]] = [suppliers[j], suppliers[i]]
    }

    return suppliers.slice(0, count)
  } catch {
    return []
  }
}

const brands = [
  'DUPPY SHARE',
  'AVALLEN',
  'EVERLEAF',
  'LUCKY SAINT',
  'PENTIRE',
  'NICE WINE',
]

const trendingTags = [
  'Glass Bottles',
  'Aluminium Cans',
  'UK Logistics',
  'Label Printing',
]

const featuredOffers = [
  {
    id: 1,
    supplier: 'SAVERGLASS',
    logo: 'https://kindredcollective.co.uk/cdn/shop/files/SaverGlass.png',
    title: '10% Off First Order',
    code: 'KINDRED10',
    isNew: false,
    isExpiring: true,
  },
  {
    id: 2,
    supplier: 'London City Bond',
    logo: 'https://kindredcollective.co.uk/cdn/shop/files/Picture2.png',
    title: 'Free Month Storage',
    code: 'STOREFREE',
    isNew: true,
    isExpiring: false,
  },
]

export default async function HomePage() {
  const featuredSuppliers = await getFeaturedSuppliers(4)
  return (
    <>
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden bg-gray-100">
        <div className="absolute inset-0 bg-grid-pattern pointer-events-none"></div>

        {/* Floating Elements */}
        <div className="absolute top-32 right-[10%] w-24 h-24 bg-coral rounded-full border-2 border-black neo-shadow hidden lg:block animate-bounce" style={{ animationDuration: '3s' }}></div>
        <div className="absolute bottom-20 left-[5%] w-16 h-16 bg-blue-500 rotate-12 border-2 border-black neo-shadow hidden lg:block"></div>

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-black neo-shadow mb-8 rotate-[-2deg] hover:rotate-0 transition-transform">
            <span className="w-3 h-3 bg-cyan rounded-full border border-black animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-widest">The #1 Marketplace for Craft</span>
          </div>

          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold leading-[0.95] mb-8 tracking-tighter uppercase">
            Fuel Your <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-coral to-orange-500 relative">
              Liquid Revolution
            </span>
          </h1>

          <p className="text-lg md:text-2xl text-gray-800 mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
            Discover partners, source ingredients, and manage your supply chain with the operating system built for independent drinks brands.
          </p>

          {/* Power Search Component */}
          <div className="relative max-w-3xl mx-auto">
            <div className="bg-white border-2 border-black neo-shadow-lg p-2 flex flex-col md:flex-row gap-2 rounded-lg">
              <div className="flex-1 relative flex items-center">
                <div className="absolute left-4 text-gray-400 flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  <span className="text-xs font-mono bg-gray-100 px-1 rounded border border-gray-300">AI</span>
                </div>
                <input
                  type="text"
                  placeholder="Find me 'organic agave suppliers' with low MOQs..."
                  className="w-full pl-20 pr-4 py-4 bg-transparent border-none text-lg font-medium placeholder-gray-400 focus:ring-0 focus:outline-none"
                />
              </div>
              <Link href="/search">
                <Button className="bg-cyan text-black px-8 py-3 font-bold uppercase tracking-wide border-2 border-black hover:bg-black hover:text-cyan transition-colors rounded-md h-full">
                  Search
                </Button>
              </Link>
            </div>

            {/* Quick Tags */}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <span className="text-xs font-bold uppercase pt-1.5">Trending:</span>
              {trendingTags.map((tag) => (
                <Link
                  key={tag}
                  href={`/explore?q=${encodeURIComponent(tag)}`}
                  className="px-3 py-1 bg-white border border-black text-xs font-bold hover:bg-black hover:text-white transition-colors rounded-full"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Marquee Section */}
      <section className="py-6 bg-cyan border-y-2 border-black overflow-hidden">
        <div className="whitespace-nowrap flex animate-marquee">
          {[...brands, ...brands, ...brands].map((brand, i) => (
            <div key={i} className="flex items-center gap-12 mx-6">
              <span className="text-2xl font-display font-bold">{brand}</span>
              <Star className="w-5 h-5" />
            </div>
          ))}
        </div>
      </section>

      {/* Features Bento Grid */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4 uppercase">The Toolkit</h2>
            <p className="text-lg max-w-md font-medium text-gray-600">Everything you need to launch and scale, all in one dashboard.</p>
          </div>
          <Link href="/explore" className="group flex items-center gap-2 font-bold uppercase border-b-2 border-black pb-1 hover:text-coral transition-colors">
            View All Features
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">

          {/* Feature 1: Partner Perks (Offers) */}
          <div className="md:col-span-2 relative bg-white border-2 border-black neo-shadow rounded-2xl overflow-hidden group flex flex-col md:flex-row h-full">
            {/* Left Panel: Context */}
            <div className="p-6 md:w-2/5 flex flex-col justify-between bg-black text-white relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-cyan text-black border-2 border-white rounded-none flex items-center justify-center">
                    <Ticket className="w-5 h-5" />
                  </div>
                  <span className="bg-white text-black text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider border border-black transform -rotate-2">New Feature</span>
                </div>
                <h3 className="text-3xl font-display font-bold mb-2 uppercase leading-none">Partner <br/><span className="text-cyan">Perks</span></h3>
                <p className="text-gray-400 text-xs mt-2 leading-relaxed">Exclusive production & logistics deals for Kindred members.</p>
              </div>
              <div className="relative z-10 mt-4">
                <Link href="/offers" className="inline-block w-full py-2.5 bg-white text-black font-bold uppercase text-xs border-2 border-black hover:bg-cyan hover:border-cyan transition-colors text-center shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
                  View All Offers
                </Link>
              </div>
              {/* BG Decoration */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan rounded-full blur-[60px] opacity-20"></div>
            </div>

            {/* Right Panel: List of Offers */}
            <div className="p-4 md:w-3/5 bg-gray-50 overflow-y-auto custom-scrollbar relative">
              <div className="space-y-3">
                {featuredOffers.map((offer) => (
                  <Link
                    key={offer.id}
                    href="/offers"
                    className="block bg-white border-2 border-black p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-gray-200 border border-black overflow-hidden">
                          {offer.logo && (
                            <img src={offer.logo} alt={offer.supplier} className="w-full h-full object-cover" />
                          )}
                        </span>
                        <span className="text-[10px] font-bold text-gray-500 uppercase">{offer.supplier}</span>
                      </div>
                      {offer.isExpiring && (
                        <span className="text-[10px] font-bold text-red-500 border border-red-200 bg-red-50 px-1.5 rounded">Expiring</span>
                      )}
                      {offer.isNew && (
                        <span className="bg-lime border border-black px-1.5 text-[10px] font-bold">New</span>
                      )}
                    </div>
                    <h4 className="font-display font-bold text-base leading-tight mb-2">{offer.title}</h4>
                    <div className="flex items-center justify-between border-t border-dashed border-gray-300 pt-2">
                      <div className="flex items-center gap-2">
                        <Scissors className="w-3 h-3 text-gray-400" />
                        <code className="text-[10px] font-mono font-bold bg-gray-100 text-black px-1.5 py-0.5 border border-gray-300 rounded">{offer.code}</code>
                      </div>
                      <span className="text-[10px] font-bold underline">Claim</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Feature 2: Global Reach */}
          <div className="bg-blue-500 border-2 border-black neo-shadow p-8 rounded-2xl text-white relative overflow-hidden group hover:-translate-y-1 transition-transform">
            <div className="relative z-10">
              <Globe className="w-10 h-10 mb-4" />
              <h3 className="text-2xl font-display font-bold mb-2">Global Reach</h3>
              <p className="text-blue-100">Access 500+ verified suppliers across the UK and Europe.</p>
            </div>
            <div className="absolute -bottom-10 -right-10 text-9xl text-white opacity-20 rotate-12">
              <Globe className="w-32 h-32" />
            </div>
          </div>

          {/* Feature 3: Brand Control */}
          <div className="bg-white border-2 border-black neo-shadow p-8 rounded-2xl flex flex-col justify-between group hover:-translate-y-1 transition-transform">
            <div>
              <div className="w-12 h-12 bg-cyan border-2 border-black text-black rounded-lg flex items-center justify-center mb-4">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-display font-bold mb-2">Brand Control</h3>
              <p className="text-gray-600">Manage your enquiries, quotes, and production timelines in one place.</p>
            </div>
            <div className="flex -space-x-2 mt-4">
              <div className="w-8 h-8 rounded-full border-2 border-black bg-gray-200"></div>
              <div className="w-8 h-8 rounded-full border-2 border-black bg-gray-300"></div>
              <div className="w-8 h-8 rounded-full border-2 border-black bg-gray-400 flex items-center justify-center text-[10px] font-bold text-white">+3</div>
            </div>
          </div>

          {/* Feature 4: AI Recommendations */}
          <div className="md:col-span-2 bg-black text-white border-2 border-black neo-shadow p-8 rounded-2xl relative overflow-hidden group hover:-translate-y-1 transition-transform">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550989460-0adf9ea622e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')] opacity-30 bg-cover bg-center mix-blend-overlay"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 h-full">
              <div className="flex-1">
                <div className="inline-block px-3 py-1 bg-coral text-white border border-white rounded-full text-xs font-bold mb-4 uppercase tracking-wider">Personalized</div>
                <h3 className="text-2xl font-display font-bold mb-2">Smart Recommendations</h3>
                <p className="text-gray-300 mb-6">&ldquo;Based on your interest in Low-ABV spirits, here are 3 trending botanical suppliers.&rdquo;</p>
                <Link href="/search">
                  <Button className="px-6 py-2 bg-white text-black font-bold uppercase text-sm border-2 border-white hover:bg-cyan hover:border-cyan transition-colors">
                    View Matches
                  </Button>
                </Link>
              </div>
              <div className="w-full md:w-1/2 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl">
                <div className="flex items-center gap-3 mb-3 border-b border-white/10 pb-3">
                  <div className="w-10 h-10 bg-white rounded-full"></div>
                  <div>
                    <div className="text-sm font-bold">Botanical Extracts Ltd</div>
                    <div className="text-xs text-gray-400">Recommended for you</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full"></div>
                  <div>
                    <div className="text-sm font-bold">Pure Glass Co.</div>
                    <div className="text-xs text-gray-400">High match rate</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Suppliers Showcase */}
      <section className="py-20 bg-gray-50 border-y-2 border-black">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-5xl md:text-6xl font-bold mb-6 uppercase tracking-tight">Featured Partners</h2>
            <p className="text-xl text-gray-600 font-medium max-w-2xl mx-auto">Discover suppliers powering the next generation of drink brands.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredSuppliers.map((supplier) => (
              <Link
                key={supplier.slug}
                href={`/explore/${supplier.slug}`}
                className="group block bg-white border-2 border-black rounded-xl overflow-hidden neo-shadow hover:translate-y-[-4px] hover:shadow-[6px_6px_0px_0px_#000] transition-all duration-200"
              >
                <div className="h-48 overflow-hidden border-b-2 border-black relative bg-white flex items-center justify-center p-6">
                  {supplier.logoUrl ? (
                    <img
                      src={supplier.logoUrl}
                      alt={supplier.companyName}
                      className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="text-2xl font-display font-bold text-gray-300 uppercase">{supplier.companyName}</div>
                  )}
                  <div className="absolute top-3 right-3 bg-black text-white text-xs font-bold px-2 py-1 uppercase">{supplier.category}</div>
                </div>
                <div className="p-6">
                  <h3 className="font-display text-xl font-bold mb-1">{supplier.companyName}</h3>
                  <p className="text-sm text-gray-500 font-medium mb-4">{supplier.location || supplier.country || 'Global'}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(supplier.services as string[] || []).slice(0, 2).map((service: string) => (
                      <span key={service} className="px-2 py-1 bg-gray-100 border border-black rounded-md text-[10px] font-bold uppercase">{service}</span>
                    ))}
                  </div>
                  <div className="w-full py-2 border-2 border-black text-center font-bold text-sm uppercase group-hover:bg-lime transition-colors">
                    View Profile
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Link href="/explore">
              <Button className="inline-block px-8 py-3 bg-coral text-white font-bold uppercase tracking-wide border-2 border-black neo-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                Explore Marketplace
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA / Footer Transition */}
      <section className="py-24 px-6 bg-black text-white relative overflow-hidden">
        {/* Abstract shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan rounded-full blur-[100px] opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-coral rounded-full blur-[100px] opacity-20"></div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h2 className="font-display text-5xl md:text-7xl font-bold mb-8 uppercase tracking-tighter">
            Ready to disrupt the <br/><span className="text-cyan">industry?</span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-2xl mx-auto">
            Join the fastest growing network of independent drinks brands and suppliers.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link href="/signup?role=brand">
              <Button className="px-8 py-4 bg-cyan text-black text-lg font-bold uppercase border-2 border-white hover:bg-white hover:text-black transition-all neo-shadow shadow-white/20">
                Join as a Brand
              </Button>
            </Link>
            <Link href="/signup?role=supplier">
              <Button className="px-8 py-4 bg-transparent text-white text-lg font-bold uppercase border-2 border-white hover:bg-white hover:text-black transition-all">
                Become a Supplier
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
