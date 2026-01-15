import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// All suppliers from kindredcollective.co.uk with full details
const suppliers = [
  {
    companyName: 'SAVERGLASS',
    slug: 'saverglass',
    tagline: 'Manufacturer and decorator of high-quality glass bottles, offering both off-the-shelf and bespoke solutions.',
    description: 'SAVERGLASS is a world-leading manufacturer of premium glass bottles for spirits, wine, and beverages. With decades of expertise, we offer both bespoke designs and an extensive catalog of ready-made options. Our decoration capabilities include screen printing, coating, and engraving.',
    category: 'PACKAGING',
    services: ['Glass Bottles', 'Bespoke Design', 'Premium Packaging', 'Decoration', 'Screen Printing'],
    location: 'France',
    country: 'France',
    serviceRegions: ['United Kingdom', 'Europe', 'North America', 'Global'],
    websiteUrl: 'https://www.saverglass.com/',
    contactName: 'George Potter',
    contactEmail: 'gwp@saverglass.com',
    logoUrl: 'https://kindredcollective.co.uk/cdn/shop/files/SaverGlass.png',
    isVerified: true,
  },
  {
    companyName: 'London City Bond Ltd',
    slug: 'london-city-bond-ltd',
    tagline: 'Bonded warehouse storage and delivery/distribution to Trade, Grocer, Amazon, D2C across the UK from any of our 16 bonded locations.',
    description: 'London City Bond provides comprehensive bonded warehouse storage and distribution services for the drinks industry. With 16 locations across the UK, we offer trade fulfillment, grocery distribution, Amazon logistics, and direct-to-consumer operations.',
    category: 'LOGISTICS',
    services: ['Bonded Warehouse', 'D2C Fulfillment', 'Trade Distribution', 'Amazon Logistics', 'Export Support'],
    location: 'London',
    country: 'United Kingdom',
    serviceRegions: ['United Kingdom'],
    websiteUrl: 'https://www.lcb.co.uk/',
    linkedinUrl: 'https://www.linkedin.com/company/london-city-bond-ltd',
    contactName: 'Jay Swanborough',
    contactEmail: 'jswanborough@lcb.co.uk',
    logoUrl: 'https://kindredcollective.co.uk/cdn/shop/files/Picture2.png',
    isVerified: true,
    reviews: [
      { reviewerName: 'Fabrizio', reviewerCompany: 'The Heart Cut', rating: 5, content: 'Great from a DTC + Trade perspective. Made our brand launch operations smooth and easy.', wouldRecommend: true },
      { reviewerName: 'Sophie', reviewerCompany: 'Silent Pool Gin', rating: 5, content: 'Huge support, worth the money. 10-year client highlighting flexibility, reliability, and export market support.', wouldRecommend: true },
    ],
  },
  {
    companyName: 'Aitch Creates',
    slug: 'aitch-creates',
    tagline: 'Strategic branding and design for ambitious drinks brands.',
    description: 'Design agency specializing in branding for beverage companies. We create distinctive brand identities that stand out on shelf and connect with consumers. Notable clients include Duppy Share, Dangerous Don, Pimentae, Fauna Brewery, and Wild Bunch.',
    category: 'DESIGN',
    services: ['Strategic Branding', 'Pack Design', 'Creative Development', 'Brand Identity'],
    location: 'United Kingdom',
    country: 'United Kingdom',
    serviceRegions: ['United Kingdom', 'Europe'],
    websiteUrl: 'https://aitchcreates.com/',
    instagramUrl: 'https://www.instagram.com/aitch_creates/',
    portfolioUrl: 'https://my.corebook.io/BfoKRuIVYQ9aLEV2ixL4ctUuXGcgni9X',
    contactName: 'Alice Fowler',
    contactEmail: 'alice@aitchcreates.com',
    isVerified: true,
    reviews: [
      { reviewerName: 'Jack Orr-Ewing', reviewerCompany: 'Duppy Share', rating: 5, content: "Agency level of output at a reasonable fee. Harry's vision of how a brand shows up in every touchpoint is second to none.", wouldRecommend: true, serviceRating: 5, valueRating: 5 },
      { reviewerName: 'Alice', reviewerCompany: 'Pimentae', rating: 5, content: 'Instinctively understand our vision and always deliver designs that hit the brief perfectly, often exceeding expectations.', wouldRecommend: true, serviceRating: 5, valueRating: 5 },
    ],
  },
  {
    companyName: 'Graceful Monkey',
    slug: 'graceful-monkey',
    tagline: 'Studio creating Digital Content & Experiences',
    description: 'Creative studio specializing in digital content creation and immersive brand experiences for the drinks industry. We help brands tell their stories through compelling visual content, video production, and digital experiences.',
    category: 'PHOTOGRAPHY',
    services: ['Video Production', 'Photography', 'Digital Experiences', 'Social Content', 'Brand Films'],
    location: 'London',
    country: 'United Kingdom',
    serviceRegions: ['United Kingdom', 'Europe'],
    isVerified: true,
  },
  {
    companyName: 'Buddy Creative',
    slug: 'buddy-creative',
    tagline: 'Brand and packaging design agency specialising in food & drink',
    description: 'Award-winning brand and packaging design agency with deep expertise in the food and drink sector. We create distinctive brand identities that stand out on shelf and connect with consumers.',
    category: 'DESIGN',
    services: ['Brand Identity', 'Packaging Design', 'Label Design', 'Brand Strategy'],
    location: 'Manchester',
    country: 'United Kingdom',
    serviceRegions: ['United Kingdom', 'Europe', 'North America'],
    isVerified: true,
  },
  {
    companyName: 'Bien Venue Ltd',
    slug: 'bien-venue',
    tagline: 'Free service sourcing standout venues for drinks brands',
    description: 'Specialist venue sourcing service helping drinks brands find the perfect locations for launches, tastings, and events. Our service is completely free for brands.',
    category: 'OTHER',
    services: ['Venue Sourcing', 'Event Planning', 'Launch Events', 'Brand Activations'],
    location: 'London',
    country: 'United Kingdom',
    serviceRegions: ['United Kingdom'],
    isVerified: true,
  },
  {
    companyName: 'AM Distilling LTD',
    slug: 'am-distilling',
    tagline: 'Contract Bottlers/Contract Blenders/Bulk Spirits',
    description: 'Full-service contract distilling, blending, and bottling facility. We work with brands of all sizes to bring their spirits to market with quality and consistency.',
    category: 'CO_PACKING',
    services: ['Contract Distilling', 'Contract Bottling', 'Blending', 'Bulk Spirits'],
    location: 'Scotland',
    country: 'United Kingdom',
    serviceRegions: ['United Kingdom', 'Europe'],
    moqMin: 500,
    isVerified: true,
  },
  {
    companyName: 'Eventism Ltd',
    slug: 'eventism',
    tagline: 'Events consultancy specialising in shows for the drinks industry',
    description: 'Expert events consultancy helping drinks brands maximize their presence at trade shows and consumer events.',
    category: 'MARKETING',
    services: ['Trade Show Management', 'Event Consultancy', 'Stand Design', 'Staffing'],
    location: 'London',
    country: 'United Kingdom',
    serviceRegions: ['United Kingdom', 'Europe'],
    isVerified: true,
  },
  {
    companyName: 'Astute Beverages',
    slug: 'astute-beverages',
    tagline: 'Non-Alcoholic Beverage Export Market Specialist',
    description: 'Specialist export agency focused on non-alcoholic and low-alcohol beverages. We help brands expand into international markets.',
    category: 'DISTRIBUTION',
    services: ['Export Services', 'Market Entry', 'Buyer Introductions', 'Trade Support'],
    location: 'London',
    country: 'United Kingdom',
    serviceRegions: ['Europe', 'Middle East', 'Asia', 'North America'],
    isVerified: true,
  },
  {
    companyName: 'BB Comms',
    slug: 'bb-comms',
    tagline: 'Spirits specialist PR, events and marketing consultancy',
    description: 'Award-winning PR, events and marketing consultancy specializing in spirits and premium drinks brands.',
    category: 'PR',
    services: ['Public Relations', 'Events', 'Marketing Strategy', 'Media Relations', 'Influencer Campaigns'],
    location: 'London',
    country: 'United Kingdom',
    serviceRegions: ['United Kingdom', 'Europe', 'North America'],
    isVerified: true,
  },
  {
    companyName: 'Label Apeel Ltd',
    slug: 'label-apeel',
    tagline: 'UK label manufacturer',
    description: 'Leading UK manufacturer of high-quality labels for the drinks industry.',
    category: 'PACKAGING',
    services: ['Label Printing', 'Custom Labels', 'Premium Finishes', 'Short Runs'],
    location: 'United Kingdom',
    country: 'United Kingdom',
    serviceRegions: ['United Kingdom'],
    moqMin: 1000,
    isVerified: true,
    reviews: [
      { reviewerName: 'Production Manager', reviewerCompany: 'Craft Brewery', rating: 5, content: 'Great quality labels with fast turnaround. Very competitive pricing for short runs.', wouldRecommend: true },
    ],
  },
  {
    companyName: 'Scale Drinks',
    slug: 'scale-drinks',
    tagline: 'Export agency for global expansion',
    description: 'Export agency helping drinks brands expand globally with distributor introductions and market entry support.',
    category: 'DISTRIBUTION',
    services: ['Export Strategy', 'Distributor Network', 'Market Entry', 'International Sales'],
    location: 'London',
    country: 'United Kingdom',
    serviceRegions: ['Europe', 'Asia', 'North America', 'Global'],
    isVerified: true,
    reviews: [
      { reviewerName: 'Export Manager', reviewerCompany: 'Premium Vodka Brand', rating: 5, content: 'Excellent network of international distributors. Helped us enter 5 new markets in our first year.', wouldRecommend: true },
    ],
  },
  {
    companyName: 'Addition',
    slug: 'addition',
    tagline: 'Accounting and CFO platform for FMCG/e-commerce',
    description: 'Modern accounting and CFO services platform designed for FMCG and e-commerce brands.',
    category: 'FINANCE',
    services: ['Accounting', 'CFO Services', 'Financial Reporting', 'Tax Planning'],
    location: 'London',
    country: 'United Kingdom',
    serviceRegions: ['United Kingdom'],
    isVerified: true,
  },
  {
    companyName: 'The Custom Spirit Co',
    slug: 'custom-spirit-co',
    tagline: 'Contract distilling, blending, fermentation, bottling',
    description: 'Full-service contract manufacturing facility offering distilling, blending, fermentation, and bottling services.',
    category: 'CO_PACKING',
    services: ['Contract Distilling', 'Blending', 'Fermentation', 'Bottling', 'NPD Support'],
    location: 'United Kingdom',
    country: 'United Kingdom',
    serviceRegions: ['United Kingdom'],
    moqMin: 200,
    isVerified: true,
  },
  {
    companyName: 'Berlin Packaging',
    slug: 'berlin-packaging',
    tagline: 'Global packaging in glass, plastic, metal',
    description: 'Global packaging supplier offering a vast range of bottles, jars, and containers with full decoration services.',
    category: 'PACKAGING',
    services: ['Glass Packaging', 'Plastic Containers', 'Metal Packaging', 'Decoration', 'Design Services'],
    location: 'Europe',
    country: 'Germany',
    serviceRegions: ['United Kingdom', 'Europe', 'Global'],
    isVerified: true,
    reviews: [
      { reviewerName: 'Buyer', reviewerCompany: 'Beverage Company', rating: 5, content: 'Huge range of options and very competitive pricing. Great customer service.', wouldRecommend: true },
    ],
  },
  {
    companyName: 'Verallia',
    slug: 'verallia',
    tagline: 'UK-made glass bottles, bespoke and stock',
    description: 'Major glass manufacturer with UK production facilities, offering both stock and bespoke glass bottle solutions.',
    category: 'PACKAGING',
    services: ['Glass Bottles', 'Bespoke Manufacturing', 'Stock Solutions', 'Sustainable Glass'],
    location: 'United Kingdom',
    country: 'United Kingdom',
    serviceRegions: ['United Kingdom', 'Europe'],
    moqMin: 10000,
    isVerified: true,
    reviews: [
      { reviewerName: 'Supply Chain Manager', reviewerCompany: 'Major Distillery', rating: 5, content: 'Reliable supply and consistent quality. Great partnership.', wouldRecommend: true },
      { reviewerName: 'Procurement', reviewerCompany: 'Wine Producer', rating: 5, content: 'UK manufacturing means better lead times and lower carbon footprint.', wouldRecommend: true },
    ],
  },
  {
    companyName: 'Hensol Castle Distillery',
    slug: 'hensol-castle-distillery',
    tagline: 'Contract bottling, distilling, NPD',
    description: 'Welsh contract distillery offering distilling, bottling, and new product development services.',
    category: 'CO_PACKING',
    services: ['Contract Distilling', 'Contract Bottling', 'NPD', 'Recipe Development'],
    location: 'Wales',
    country: 'United Kingdom',
    serviceRegions: ['United Kingdom'],
    moqMin: 100,
    isVerified: true,
    reviews: [
      { reviewerName: 'Brand Owner', reviewerCompany: 'Welsh Gin Brand', rating: 5, content: 'Amazing facility and team. Very flexible on MOQs for smaller brands.', wouldRecommend: true },
    ],
  },
  {
    companyName: 'Cooper Parry',
    slug: 'cooper-parry',
    tagline: 'Accountancy services for drinks businesses',
    description: 'Award-winning accountancy firm with a dedicated drinks and hospitality team.',
    category: 'FINANCE',
    services: ['Audit', 'Tax Advisory', 'Corporate Finance', 'Business Advisory'],
    location: 'Birmingham',
    country: 'United Kingdom',
    serviceRegions: ['United Kingdom'],
    isVerified: true,
    reviews: [
      { reviewerName: 'CEO', reviewerCompany: 'Brewery Group', rating: 5, content: 'Outstanding team with real drinks industry expertise. Helped us through acquisition.', wouldRecommend: true },
    ],
  },
  {
    companyName: 'Avallen Solutions',
    slug: 'avallen-solutions',
    tagline: 'Sustainability strategy and support',
    description: 'Sustainability consultancy helping drinks brands develop and implement environmental strategies, from carbon footprinting to B Corp certification.',
    category: 'SUSTAINABILITY',
    services: ['Sustainability Strategy', 'Carbon Footprinting', 'B Corp Support', 'ESG Reporting'],
    location: 'United Kingdom',
    country: 'United Kingdom',
    serviceRegions: ['United Kingdom', 'Europe'],
    certifications: ['B_CORP'],
    isVerified: true,
    reviews: [
      { reviewerName: 'CEO', reviewerCompany: 'Calvados Brand', rating: 5, content: 'Helped us become genuinely sustainable, not just greenwashing.', wouldRecommend: true },
      { reviewerName: 'Founder', reviewerCompany: 'Eco Spirits', rating: 5, content: 'Invaluable guidance on our B Corp journey. Highly knowledgeable team.', wouldRecommend: true },
    ],
  },
  {
    companyName: 'Bowimi',
    slug: 'bowimi',
    tagline: 'CRM/sales platform for drinks brands',
    description: 'Sales and CRM platform designed specifically for drinks brands to manage trade relationships and orders.',
    category: 'SOFTWARE',
    services: ['CRM', 'Sales Management', 'Order Processing', 'Trade Relationships'],
    location: 'United Kingdom',
    country: 'United Kingdom',
    serviceRegions: ['United Kingdom'],
    isVerified: true,
    reviews: [
      { reviewerName: 'Sales Manager', reviewerCompany: 'Spirits Portfolio', rating: 5, content: 'Finally a CRM that understands how drinks sales work. Game changer.', wouldRecommend: true },
    ],
  },
  {
    companyName: 'Midday Studio',
    slug: 'midday-studio',
    tagline: 'Award-winning design studio',
    description: 'Award-winning design studio creating distinctive brand identities and packaging for drinks brands.',
    category: 'DESIGN',
    services: ['Brand Identity', 'Packaging Design', 'Visual Identity', 'Creative Direction'],
    location: 'United Kingdom',
    country: 'United Kingdom',
    serviceRegions: ['United Kingdom'],
    isVerified: true,
    reviews: [
      { reviewerName: 'Founder', reviewerCompany: 'New Spirits Brand', rating: 5, content: 'Exceptional creative work. Our packaging stands out on every shelf.', wouldRecommend: true },
    ],
  },
  {
    companyName: 'Soho Drinks Ltd',
    slug: 'soho-drinks',
    tagline: 'PR services for drinks and lifestyle',
    description: 'PR agency specializing in drinks and lifestyle brands, with strong media relationships.',
    category: 'PR',
    services: ['Public Relations', 'Media Relations', 'Event PR', 'Brand Launches'],
    location: 'London',
    country: 'United Kingdom',
    serviceRegions: ['United Kingdom'],
    isVerified: true,
    reviews: [
      { reviewerName: 'Brand Director', reviewerCompany: 'Premium Tequila', rating: 5, content: 'Great connections in the drinks media. Secured us brilliant coverage.', wouldRecommend: true },
    ],
  },
  {
    companyName: 'Tortuga',
    slug: 'tortuga',
    tagline: 'UK distribution and back-office logistics',
    description: 'Full-service distribution and logistics partner for drinks brands in the UK market.',
    category: 'DISTRIBUTION',
    services: ['UK Distribution', 'Logistics', 'Back-Office Support', 'Order Fulfillment'],
    location: 'United Kingdom',
    country: 'United Kingdom',
    serviceRegions: ['United Kingdom'],
    isVerified: true,
    reviews: [
      { reviewerName: 'Sales Director', reviewerCompany: 'Imported Spirits', rating: 5, content: 'Reliable partner for UK distribution. Great communication.', wouldRecommend: true },
    ],
  },
  {
    companyName: 'Greenbox Designs',
    slug: 'greenbox-designs',
    tagline: 'Website development services',
    description: 'Web design and development agency creating beautiful, functional websites for drinks brands.',
    category: 'WEB_DEVELOPMENT',
    services: ['Website Design', 'Web Development', 'E-Commerce Sites', 'Digital Strategy'],
    location: 'United Kingdom',
    country: 'United Kingdom',
    serviceRegions: ['United Kingdom'],
    isVerified: true,
    reviews: [
      { reviewerName: 'Brand Owner', reviewerCompany: 'Premium Spirits', rating: 5, content: 'Built us a beautiful website that converts. Great ongoing support.', wouldRecommend: true },
    ],
  },
  {
    companyName: 'Frederick Wilkinson',
    slug: 'frederick-wilkinson',
    tagline: 'Photography and videography',
    description: 'Professional photographer and videographer specializing in drinks and food content.',
    category: 'PHOTOGRAPHY',
    services: ['Photography', 'Videography', 'Product Shots', 'Lifestyle Content'],
    location: 'United Kingdom',
    country: 'United Kingdom',
    serviceRegions: ['United Kingdom'],
    isVerified: true,
    reviews: [
      { reviewerName: 'Marketing Manager', reviewerCompany: 'Gin Brand', rating: 5, content: 'Stunning images that really captured our brand essence. Very professional.', wouldRecommend: true },
    ],
  },
]

// Sample events
const events = [
  {
    title: 'Kindred Summer Party 2026',
    slug: 'kindred-summer-party-2026',
    description: 'Join us for the biggest Kindred gathering of the year! Network with fellow drinks makers, meet suppliers, and celebrate the independent drinks community.',
    type: 'PARTY',
    status: 'PUBLISHED',
    startDate: new Date('2026-07-15T18:00:00'),
    endDate: new Date('2026-07-15T23:00:00'),
    isVirtual: false,
    venueName: 'The Brewery',
    address: '52 Chiswell Street',
    city: 'London',
    country: 'United Kingdom',
    capacity: 300,
    isFree: false,
    price: 45,
    showAttendees: true,
    isFeatured: true,
  },
  {
    title: 'Imbibe Live 2026',
    slug: 'imbibe-live-2026',
    description: "The UK's leading on-trade drinks event returns to Olympia London.",
    type: 'TRADE_SHOW',
    status: 'PUBLISHED',
    startDate: new Date('2026-07-01T10:00:00'),
    endDate: new Date('2026-07-02T17:00:00'),
    isVirtual: false,
    venueName: 'Olympia London',
    address: 'Hammersmith Road',
    city: 'London',
    country: 'United Kingdom',
    capacity: 5000,
    isFree: false,
    price: 25,
    showAttendees: true,
    isFeatured: true,
  },
  {
    title: 'Kindred Manchester Meetup',
    slug: 'kindred-manchester-meetup-mar-2026',
    description: 'Informal networking drinks for Kindred members in the North.',
    type: 'MEETUP',
    status: 'PUBLISHED',
    startDate: new Date('2026-03-20T18:30:00'),
    endDate: new Date('2026-03-20T21:00:00'),
    isVirtual: false,
    venueName: 'The Alchemist',
    address: '1 New York Street',
    city: 'Manchester',
    country: 'United Kingdom',
    capacity: 50,
    isFree: true,
    price: null,
    showAttendees: true,
    isFeatured: false,
  },
  {
    title: 'Export Masterclass: Breaking into Europe',
    slug: 'export-masterclass-europe-2026',
    description: 'Learn the ins and outs of exporting your drinks to European markets.',
    type: 'WEBINAR',
    status: 'PUBLISHED',
    startDate: new Date('2026-02-15T14:00:00'),
    endDate: new Date('2026-02-15T15:30:00'),
    isVirtual: true,
    venueName: null,
    virtualUrl: 'https://zoom.us/j/kindred-export',
    city: 'Online',
    country: 'United Kingdom',
    capacity: 100,
    isFree: true,
    price: null,
    showAttendees: true,
    isFeatured: false,
  },
  {
    title: 'Sustainable Packaging Workshop',
    slug: 'sustainable-packaging-workshop-2026',
    description: 'Hands-on workshop exploring sustainable packaging options for drinks brands.',
    type: 'WORKSHOP',
    status: 'PUBLISHED',
    startDate: new Date('2026-04-10T10:00:00'),
    endDate: new Date('2026-04-10T16:00:00'),
    isVirtual: false,
    venueName: 'Business Design Centre',
    address: '52 Upper Street',
    city: 'London',
    country: 'United Kingdom',
    capacity: 60,
    isFree: false,
    price: 75,
    showAttendees: true,
    isFeatured: true,
  },
]

async function main() {
  console.log('🌱 Starting database seed...\n')

  // Clear existing data
  console.log('🗑️  Clearing existing data...')
  await prisma.supplierReview.deleteMany()
  await prisma.supplierClaim.deleteMany()
  await prisma.offerClaim.deleteMany()
  await prisma.offer.deleteMany()
  await prisma.eventRsvp.deleteMany()
  await prisma.event.deleteMany()
  await prisma.supplier.deleteMany()
  console.log('✅ Cleared existing data\n')

  // Seed suppliers
  console.log('📦 Seeding suppliers...')
  for (const supplierData of suppliers) {
    const { reviews, ...supplierFields } = supplierData as any

    const supplier = await prisma.supplier.create({
      data: {
        ...supplierFields,
        category: supplierFields.category as any,
        certifications: supplierFields.certifications || [],
        subcategories: [],
        serviceRegions: supplierFields.serviceRegions || [],
        claimStatus: 'UNCLAIMED',
      },
    })

    // Create reviews if they exist
    if (reviews && reviews.length > 0) {
      for (const review of reviews) {
        await prisma.supplierReview.create({
          data: {
            supplierId: supplier.id,
            reviewerName: review.reviewerName,
            reviewerCompany: review.reviewerCompany || null,
            rating: review.rating,
            content: review.content,
            wouldRecommend: review.wouldRecommend ?? true,
            serviceRating: review.serviceRating || null,
            valueRating: review.valueRating || null,
            isVerified: false,
            isPublic: true,
          },
        })
      }
    }

    console.log(`  ✓ ${supplier.companyName}${reviews ? ` (${reviews.length} reviews)` : ''}`)
  }
  console.log(`✅ Seeded ${suppliers.length} suppliers\n`)

  // Seed events
  console.log('📅 Seeding events...')
  for (const eventData of events) {
    const event = await prisma.event.create({
      data: {
        ...eventData,
        type: eventData.type as any,
        status: eventData.status as any,
        price: eventData.price ? eventData.price : null,
      },
    })
    console.log(`  ✓ ${event.title}`)
  }
  console.log(`✅ Seeded ${events.length} events\n`)

  // Create sample offer
  console.log('🎁 Seeding sample offer...')
  const saverglassSupplier = await prisma.supplier.findUnique({
    where: { slug: 'saverglass' },
  })

  if (saverglassSupplier) {
    await prisma.offer.create({
      data: {
        supplierId: saverglassSupplier.id,
        title: '10% Off First Order for Kindred Members',
        description: 'Exclusive discount for Kindred Collective members on your first order of premium glass bottles. Valid for orders over 5,000 units.',
        type: 'PERCENTAGE_DISCOUNT',
        discountValue: 10,
        code: 'KINDRED10',
        termsConditions: 'Valid for new customers only. Minimum order of 5,000 units. Cannot be combined with other offers. Valid until December 31, 2026.',
        status: 'ACTIVE',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        forBrandsOnly: true,
        minOrderValue: 5000,
      },
    })
    console.log('  ✓ SAVERGLASS: 10% Off First Order')
  }
  console.log('✅ Seeded sample offer\n')

  // Summary
  const supplierCount = await prisma.supplier.count()
  const reviewCount = await prisma.supplierReview.count()
  const eventCount = await prisma.event.count()
  const offerCount = await prisma.offer.count()

  console.log('🎉 Seed complete!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`  Suppliers: ${supplierCount}`)
  console.log(`  Reviews:   ${reviewCount}`)
  console.log(`  Events:    ${eventCount}`)
  console.log(`  Offers:    ${offerCount}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
