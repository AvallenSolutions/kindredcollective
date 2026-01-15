'use client'

import { useState, useMemo } from 'react'
import { Newspaper, ExternalLink, Clock, Bookmark, Filter } from 'lucide-react'
import { Badge, Button, Card, CardContent } from '@/components/ui'
import { newsArticles } from '../../../../prisma/seed-news'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

// Get unique categories
const categories = Array.from(new Set(newsArticles.map((a) => a.category)))

export default function NewsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [savedArticles, setSavedArticles] = useState<string[]>([])

  const filteredArticles = useMemo(() => {
    if (!selectedCategory) return newsArticles
    return newsArticles.filter((a) => a.category === selectedCategory)
  }, [selectedCategory])

  const toggleSave = (url: string) => {
    setSavedArticles((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    )
  }

  const featuredArticle = newsArticles[0]

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-blue-500 text-white py-12 border-b-4 border-black">
        <div className="section-container">
          <Badge className="mb-4 bg-white text-blue-500 border-white">
            <Newspaper className="w-3 h-3 mr-1" />
            Industry News
          </Badge>
          <h1 className="font-display text-display-sm lg:text-display-md mb-4">
            News & Insights
          </h1>
          <p className="text-lg text-white/80 max-w-2xl">
            Stay up to date with the latest news, trends, and insights from the
            drinks industry.
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <section className="bg-white border-b-3 border-black sticky top-16 lg:top-20 z-40">
        <div className="section-container py-4">
          <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide">
            <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                'px-4 py-2 text-sm font-bold border-2 transition-colors whitespace-nowrap',
                !selectedCategory
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-black border-gray-200 hover:border-black'
              )}
            >
              All News
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'px-4 py-2 text-sm font-bold border-2 transition-colors whitespace-nowrap',
                  selectedCategory === cat
                    ? 'bg-blue-500 text-white border-black'
                    : 'bg-white text-black border-gray-200 hover:border-black'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Article */}
      {!selectedCategory && (
        <section className="section-container py-8">
          <Card className="overflow-hidden">
            <div className="grid lg:grid-cols-2">
              <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-8 lg:p-12 flex items-center">
                <div>
                  <Badge className="mb-4 bg-white/20 text-white border-white/30">
                    Featured
                  </Badge>
                  <h2 className="font-display text-2xl lg:text-3xl font-bold text-white mb-4">
                    {featuredArticle.title}
                  </h2>
                  <p className="text-white/80 mb-6">
                    {featuredArticle.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-white/60">
                    <span>{featuredArticle.source}</span>
                    <span>•</span>
                    <span>{formatDate(featuredArticle.publishedAt)}</span>
                  </div>
                </div>
              </div>
              <CardContent className="p-8 lg:p-12 flex flex-col justify-center">
                <Badge variant="outline" className="w-fit mb-4">
                  {featuredArticle.category}
                </Badge>
                <p className="text-gray-600 mb-6">{featuredArticle.description}</p>
                <div className="flex gap-3">
                  <a
                    href={featuredArticle.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button>
                      Read Article
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </a>
                  <Button
                    variant="outline"
                    onClick={() => toggleSave(featuredArticle.url)}
                  >
                    <Bookmark
                      className={cn(
                        'w-4 h-4',
                        savedArticles.includes(featuredArticle.url) && 'fill-current'
                      )}
                    />
                  </Button>
                </div>
              </CardContent>
            </div>
          </Card>
        </section>
      )}

      {/* Articles Grid */}
      <section className="section-container py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-600">
            Showing <span className="font-bold text-black">{filteredArticles.length}</span> articles
            {selectedCategory && <span> in {selectedCategory}</span>}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article, index) => (
            <Card key={article.url} className={cn(index === 0 && !selectedCategory && 'hidden')}>
              <CardContent className="p-0">
                {/* Category Color Bar */}
                <div className="h-2 bg-blue-500" />

                <div className="p-5">
                  {/* Meta */}
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="outline" className="text-xs">
                      {article.category}
                    </Badge>
                    <button
                      onClick={() => toggleSave(article.url)}
                      className="text-gray-400 hover:text-cyan"
                    >
                      <Bookmark
                        className={cn(
                          'w-4 h-4',
                          savedArticles.includes(article.url) && 'fill-cyan text-cyan'
                        )}
                      />
                    </button>
                  </div>

                  {/* Title */}
                  <h3 className="font-display font-bold mb-2 line-clamp-2">
                    {article.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {article.description}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{article.source}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(article.publishedAt)}
                      </span>
                    </div>
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan hover:underline"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="bg-black text-white py-12">
        <div className="section-container text-center">
          <h2 className="font-display text-2xl lg:text-3xl font-bold mb-4">
            Get Industry News in Your Inbox
          </h2>
          <p className="text-gray-400 mb-6 max-w-xl mx-auto">
            Subscribe to our weekly newsletter for curated industry news, trends, and exclusive insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 h-12 px-4 bg-white text-black border-3 border-cyan placeholder:text-gray-500 focus:outline-none"
            />
            <Button size="lg">Subscribe</Button>
          </div>
        </div>
      </section>
    </div>
  )
}
