export interface RssSource {
  name: string
  feedUrl: string
  siteUrl: string
  defaultCategory: string
}

export const RSS_SOURCES: RssSource[] = [
  {
    name: 'The Drinks Business',
    feedUrl: 'https://www.thedrinksbusiness.com/feed/',
    siteUrl: 'https://www.thedrinksbusiness.com',
    defaultCategory: 'INDUSTRY',
  },
  {
    name: 'The Spirits Business',
    feedUrl: 'https://www.thespiritsbusiness.com/feed/',
    siteUrl: 'https://www.thespiritsbusiness.com',
    defaultCategory: 'SPIRITS',
  },
  {
    name: 'Harpers Wine & Spirit',
    feedUrl: 'https://harpers.co.uk/feed/',
    siteUrl: 'https://harpers.co.uk',
    defaultCategory: 'WINE',
  },
  {
    name: 'The Buyer',
    feedUrl: 'https://www.the-buyer.net/feed/',
    siteUrl: 'https://www.the-buyer.net',
    defaultCategory: 'WINE',
  },
  {
    name: 'Imbibe',
    feedUrl: 'https://imbibe.com/news/feed/',
    siteUrl: 'https://imbibe.com',
    defaultCategory: 'INDUSTRY',
  },
  {
    name: 'The Morning Advertiser',
    feedUrl: 'https://www.morningadvertiser.co.uk/rss/',
    siteUrl: 'https://www.morningadvertiser.co.uk',
    defaultCategory: 'BEER',
  },
  {
    name: 'CAMRA',
    feedUrl: 'https://www.camra.org.uk/feed/',
    siteUrl: 'https://www.camra.org.uk',
    defaultCategory: 'BEER',
  },
  {
    name: 'Just Drinks',
    feedUrl: 'https://www.just-drinks.com/feed/',
    siteUrl: 'https://www.just-drinks.com',
    defaultCategory: 'INDUSTRY',
  },
  {
    name: 'Off Licence News',
    feedUrl: 'https://www.offlicencenews.co.uk/rss',
    siteUrl: 'https://www.offlicencenews.co.uk',
    defaultCategory: 'INDUSTRY',
  },
]
