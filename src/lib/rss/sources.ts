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
    name: 'Just Drinks',
    feedUrl: 'https://www.just-drinks.com/feed/',
    siteUrl: 'https://www.just-drinks.com',
    defaultCategory: 'INDUSTRY',
  },
  {
    name: 'The Buyer',
    feedUrl: 'https://www.the-buyer.net/feed/',
    siteUrl: 'https://www.the-buyer.net',
    defaultCategory: 'WINE',
  },
  {
    name: 'Decanter',
    feedUrl: 'https://www.decanter.com/feed/',
    siteUrl: 'https://www.decanter.com',
    defaultCategory: 'WINE',
  },
  {
    name: 'Global Drinks Intel',
    feedUrl: 'https://www.globaldrinks.com/feed/',
    siteUrl: 'https://www.globaldrinks.com',
    defaultCategory: 'INDUSTRY',
  },
  {
    name: 'Brewers Journal',
    feedUrl: 'https://www.brewersjournal.info/feed/',
    siteUrl: 'https://www.brewersjournal.info',
    defaultCategory: 'BEER',
  },
]
