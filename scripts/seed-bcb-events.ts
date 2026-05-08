import { createClient } from '@supabase/supabase-js'

// Run with:
//   set -a && source .env.local && set +a
//   npx tsx scripts/seed-bcb-events.ts
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
//
// Source: BCB London 2026 fringe events spreadsheet
// https://docs.google.com/spreadsheets/d/13ckGw4JWgo8S8Iq5KSXzIRHmB0hllKK40Fkqrn55nhI
//
// Idempotent: upserts on the unique slug column, so re-running updates rather
// than duplicating. May 2026 is BST, hence the +01:00 offsets.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('\n❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local\n')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

type EventSeed = {
  title: string
  slug: string
  description: string
  type:
    | 'TRADE_SHOW'
    | 'MEETUP'
    | 'WORKSHOP'
    | 'WEBINAR'
    | 'NETWORKING'
    | 'LAUNCH'
    | 'PARTY'
    | 'OTHER'
  startDate: string
  endDate: string
  venueName: string
  address: string
  city: string
  country: string
  registrationUrl?: string | null
}

const events: EventSeed[] = [
  {
    title: 'Official BCB London Opening Party',
    slug: 'bcb-london-opening-party-2026',
    description:
      'Join us for the BCB London opening party on Sunday, 10 May from 5 to 7 pm at Eagle Bar at The Chancery Rosewood. Start the week in style with an unforgettable cocktail hour at one of London’s newest hospitality destinations, surrounded by leading voices from the global bar industry. Spaces are limited — sign up in advance.',
    type: 'PARTY',
    startDate: '2026-05-10T17:00:00+01:00',
    endDate: '2026-05-10T19:00:00+01:00',
    venueName: 'Eagle Bar at The Chancery Rosewood',
    address: '30 Grosvenor Square',
    city: 'London',
    country: 'United Kingdom',
    registrationUrl: 'https://www.barconvent.com/london/en-gb/forms/opening-party.html',
  },
  {
    title: 'Ba Nomu takes over Bar Lotus',
    slug: 'ba-nomu-bar-lotus-bcb-2026',
    description:
      'Founder of Ba Nomu, Hamburg, takes over Bar Lotus with Heaven Hill’s Elijah Craig and Tequila Ocho. Come get a taste before we sell out. Sponsored by Elijah Craig, Tequila Ocho and Heaven Hill Brands.',
    type: 'PARTY',
    startDate: '2026-05-10T18:00:00+01:00',
    endDate: '2026-05-10T23:00:00+01:00',
    venueName: 'Bar Lotus',
    address: '480 Kingsland Road',
    city: 'London',
    country: 'United Kingdom',
    registrationUrl: null,
  },
  {
    title: 'Mo Bar, Monkey Mash & Red Frog Takeover at Amaro Bar',
    slug: 'mo-bar-monkey-mash-red-frog-amaro-bcb-2026',
    description:
      'Welcoming MO Bar (Shenzhen), Monkey Mash and Red Frog (Portugal) — three globally celebrated bars, each bringing their own unique style, from refined precision to bold, boundary-pushing creativity. Three bars, one night. Expect a limited-edition cocktail menu and an electric atmosphere as all teams take over together. From 8pm. Very limited seating; reservations highly recommended.',
    type: 'PARTY',
    startDate: '2026-05-10T20:00:00+01:00',
    endDate: '2026-05-10T23:00:00+01:00',
    venueName: 'Amaro Bar',
    address: '15 Kensington High Street',
    city: 'London',
    country: 'United Kingdom',
    registrationUrl: null,
  },
  {
    title: 'The Terrace at Il Bacino',
    slug: 'bristol-syrup-the-terrace-bcb-2026',
    description:
      'Once you’re finished at BCB London — or if you’re looking to rest your feet before heading back in — swing across the road to Il Bacino for delicious cocktails and cold beer. Hosted by Bristol Syrup Company.',
    type: 'NETWORKING',
    startDate: '2026-05-11T14:00:00+01:00',
    endDate: '2026-05-11T19:00:00+01:00',
    venueName: 'Il Bacino',
    address: '21 Wapping Lane',
    city: 'London',
    country: 'United Kingdom',
    registrationUrl: 'https://www.bristolsyrupcompany.com/theterrace',
  },
  {
    title: 'Planteray Tropical Week Launch Party',
    slug: 'planteray-tropical-week-launch-party-2026',
    description:
      'Welcome Daiquiris with Paul McFadyen, followed by a takeover from Fitz’s Bar from 7pm. Sponsored by Planteray Rum.',
    type: 'LAUNCH',
    startDate: '2026-05-11T17:00:00+01:00',
    endDate: '2026-05-11T23:00:00+01:00',
    venueName: 'Savage Garden London',
    address: '7 Pepys Street',
    city: 'London',
    country: 'United Kingdom',
    registrationUrl: 'https://partiful.com/e/X5YJHdS54CfCrVkqGitZ',
  },
  {
    title: 'Future: Social',
    slug: 'future-social-bcb-2026',
    description:
      'First in a series of talks exploring the future of socialising, with Claire Warner and guests. Sponsors include Ocho Tequila, Botivo, Three Cents and Better Sundays.',
    type: 'WORKSHOP',
    startDate: '2026-05-11T18:00:00+01:00',
    endDate: '2026-05-11T19:00:00+01:00',
    venueName: 'Shoreditch Arts Club',
    address: '6 Redchurch Street, Shoreditch, E2 7DD',
    city: 'London',
    country: 'United Kingdom',
    registrationUrl:
      'https://www.eventbrite.co.uk/e/future-social-tickets-1988271261867?aff=ebdsshios',
  },
  {
    title: 'Paloma After Party',
    slug: 'paloma-after-party-bcb-2026',
    description:
      'Tequila Ocho and Three Cents Artisanal Beverages join forces for an epic BCB Paloma After Party on Monday 11 May. Join us at the Backyard Paloma Cantina at The Light Bar in Shoreditch from 6pm–10pm with bar takeovers from UK Paloma Month venues including Absent Ear (Glasgow), Dos Dedos (Bath) and Voya (Brighton). The first 50 guests are welcomed with a free Tostada and a Tequila Ocho & Three Cents Pink Grapefruit Paloma, with discounted drinks all night.',
    type: 'PARTY',
    startDate: '2026-05-11T18:00:00+01:00',
    endDate: '2026-05-11T22:00:00+01:00',
    venueName: 'Backyard Paloma Cantina at The Light Bar',
    address: '233 Shoreditch High Street',
    city: 'London',
    country: 'United Kingdom',
    registrationUrl: null,
  },
  {
    title: 'The Alliance at CATO',
    slug: 'the-alliance-cato-bcb-2026',
    description:
      'Featuring Locale Firenze, Sins of Sal Amsterdam and Elysian Budapest, each bar takes its place with a dedicated station, showcasing ingredients and serves inspired by their home city. Part of an ongoing series connecting four bars across Europe — brought together for a single night. Sponsored by The Lost Explorer Tequila/Mezcal and Renais Gin.',
    type: 'PARTY',
    startDate: '2026-05-11T18:00:00+01:00',
    endDate: '2026-05-11T23:00:00+01:00',
    venueName: 'CATO',
    address: '17 Mercer Street',
    city: 'London',
    country: 'United Kingdom',
    registrationUrl: null,
  },
  {
    title: 'Iichiko Takeover by 4 Japanese Bartenders at Kwãnt',
    slug: 'iichiko-takeover-kwant-bcb-2026',
    description:
      'On 11 May, Kwãnt welcomes iichiko for a special evening of guest shifts — bringing Japan to London with bartenders from Bar Sebek, Bar Yakoboku (Kumamoto), The Bellwood and Bar Trench. Each will present their own take on iichiko, offering a chance to experience different styles and approaches all through one spirit. An open, walk-in event with no bookings — just drop in. From 6:30pm. A curated menu of iichiko cocktails will be served, hosted by the brand.',
    type: 'PARTY',
    startDate: '2026-05-11T18:30:00+01:00',
    endDate: '2026-05-11T22:30:00+01:00',
    venueName: 'Kwãnt Mayfair',
    address: '52 Stratton Street',
    city: 'London',
    country: 'United Kingdom',
    registrationUrl: null,
  },
  {
    title: 'Beyond The Agave: An Evening with Deano Moncrieffe & The Tequila Collective',
    slug: 'beyond-agave-deano-moncrieffe-bcb-2026',
    description:
      'Join the UK’s leading tequila trailblazer Deano Moncrieffe and the US’s foremost tequila authority, The Tequila Collective, for a rare conversation about shaping the future of tequila. Sponsored by Cazcabel Tequila.',
    type: 'WORKSHOP',
    startDate: '2026-05-11T18:30:00+01:00',
    endDate: '2026-05-11T23:00:00+01:00',
    venueName: 'Hacha Dalston',
    address: '378 Kingsland Road',
    city: 'London',
    country: 'United Kingdom',
    registrationUrl:
      'https://www.eventbrite.com/e/explore-tequila-with-deano-montcreiffe-the-tequila-collective-tickets-1988821832639?aff=ebdssbdestsearch',
  },
  {
    title: 'The Court Rome Takeover at K Bar',
    slug: 'the-court-rome-k-bar-takeover-bcb-2026',
    description:
      'For one night only, Matteo Zed from The Court in Rome will be making cocktails at The K Bar at Kensington Hotel. Sponsored by Altamura Distilleries Vodka.',
    type: 'PARTY',
    startDate: '2026-05-11T19:00:00+01:00',
    endDate: '2026-05-11T22:00:00+01:00',
    venueName: 'K Bar at The Kensington Hotel',
    address: '109–113 Queen’s Gate, South Kensington',
    city: 'London',
    country: 'United Kingdom',
    registrationUrl: null,
  },
  {
    title: 'Ramsbury Martini Masters Winners Takeover',
    slug: 'ramsbury-martini-masters-takeover-bcb-2026',
    description:
      'Three bartenders, three cities, three Disco Martinis. Join Tina, Ali and Leia as they mix up their winning Disco Martinis for one night at All My Gods. Toronto, Berlin and Stockholm in the house. Sponsored by Ramsbury.',
    type: 'PARTY',
    startDate: '2026-05-11T19:00:00+01:00',
    endDate: '2026-05-12T00:00:00+01:00',
    venueName: 'All My Gods',
    address: '253 Paradise Row',
    city: 'London',
    country: 'United Kingdom',
    registrationUrl: null,
  },
  {
    title: 'BCB Afterparty with KAY Sake at Shochu Lounge / Roka',
    slug: 'kay-sake-roka-afterparty-bcb-2026',
    description:
      'Join us at Shochu Lounge, beneath Roka Charlotte Street, for an after-hours pour with KAY Sake. DJ all night and drinks from Laurie Howells (Archive & Myth), Elliot Osborne (Soma) and Denise Elisei (Vesper Bar), supported by the Shochu Lounge team — with bar bites all night from the Roka kitchen.',
    type: 'PARTY',
    startDate: '2026-05-11T19:00:00+01:00',
    endDate: '2026-05-11T23:30:00+01:00',
    venueName: 'Shochu Lounge / Roka',
    address: '37 Charlotte Street',
    city: 'London',
    country: 'United Kingdom',
    registrationUrl: null,
  },
  {
    title: 'New Menu Launch at The Spy Bar at Raffles London',
    slug: 'spy-bar-raffles-menu-launch-bcb-2026',
    description:
      'The Spy Bar at Raffles London at The OWO requests the pleasure of your company to celebrate the launch of their exciting new menu. Inspired by espionage, secrets and spies. The evening will include the presence of the British Secret Service sharing insights on the history of espionage.',
    type: 'LAUNCH',
    startDate: '2026-05-12T17:00:00+01:00',
    endDate: '2026-05-12T20:00:00+01:00',
    venueName: 'The Spy Bar at Raffles London at The OWO',
    address: '57 Whitehall',
    city: 'London',
    country: 'United Kingdom',
    registrationUrl: 'mailto:Sotirios.konomi@raffles.com',
  },
  {
    title: 'Stravinskij Bar & La Minerva Takeover at GŏNG Bar at The Shard',
    slug: 'gong-bar-shard-rome-takeover-bcb-2026',
    description:
      'Mattia Capezzuoli from Stravinskij Bar and Matteo Fatica from La Minerva Orient Express take over the GŏNG Bar at Shangri-La The Shard — a Boutique Brands afterparty. Featuring Altamura Distilleries Vodka, Ruta Maya Rum, Portofino Dry Gin, Lazzaroni Liquori and Tottori Whisky.',
    type: 'PARTY',
    startDate: '2026-05-12T18:00:00+01:00',
    endDate: '2026-05-12T22:00:00+01:00',
    venueName: 'GŏNG Bar at Shangri-La The Shard',
    address: 'Level 52, Shangri-La The Shard, 31 St Thomas Street',
    city: 'London',
    country: 'United Kingdom',
    registrationUrl: null,
  },
  {
    title: 'The Listening Room x ASASE',
    slug: 'listening-room-asase-bcb-2026',
    description:
      'On Tuesday 12 May, ASASE celebrates their new opening with a takeover of The Listening Room. Behind the bar: Emanuele “Lele” Mensah, 2025 World Class GB Bartender of the Year, and Marco “Branca” Trapani, multidisciplinary artist with 15+ years across hospitality and entertainment. Together they are the co-founders of Liquid Nation and the minds behind ASASE, coming to Shoreditch this summer. Expect bold West African flavours, hip-hop tunes and limited collab drinks for the night only. From 6pm. Sponsored by Diageo.',
    type: 'PARTY',
    startDate: '2026-05-12T18:00:00+01:00',
    endDate: '2026-05-13T02:00:00+01:00',
    venueName: 'The Listening Room',
    address: '86 Wardour Street',
    city: 'London',
    country: 'United Kingdom',
    registrationUrl: null,
  },
  {
    title: 'Teeling Whiskey Afterparty at Flipdog',
    slug: 'teeling-flipdog-afterparty-bcb-2026',
    description:
      'Celebrate the close of BCB London with Teeling Irish Whiskey. Join us at Flipdog — show your wristband for a complimentary Teeling welcome drink, with snacks throughout the night and a full Teeling menu on offer.',
    type: 'PARTY',
    startDate: '2026-05-12T18:00:00+01:00',
    endDate: '2026-05-12T22:00:00+01:00',
    venueName: 'Flipdog',
    address: '104–122 City Road',
    city: 'London',
    country: 'United Kingdom',
    registrationUrl: null,
  },
  {
    title: 'Craft Spirits Takeover by Helmsman Imports',
    slug: 'helmsman-craft-spirits-takeover-bcb-2026',
    description:
      'FREE party for up to 100 guests — drinks, food and karaoke on us. Join Helmsman Imports as we take over The Star by Liverpool Street for an unforgettable industry evening of exceptional serves and pours, epic karaoke, exclusive prizes and the best people in the drinks business all under one roof. Hosted by Beetle Juice, Casa Malka Tequila, Avua Cachaca, Paladar Tequila and Tarsier Gin, with The Spirits Business and Artisan Drinks.',
    type: 'PARTY',
    startDate: '2026-05-12T18:30:00+01:00',
    endDate: '2026-05-12T22:30:00+01:00',
    venueName: 'The Star by Liverpool Street',
    address: '94 Middlesex Street',
    city: 'London',
    country: 'United Kingdom',
    registrationUrl:
      'https://www.eventbrite.com/e/helmsman-imports-presents-craft-spirits-takeover-at-bcb-london-tickets-1988481277028',
  },
  {
    title: 'BCB Un-Official After Party at Cocktail Trading Co',
    slug: 'cocktail-trading-co-bcb-afterparty-2026',
    description:
      'Heaven Hill presenting Dos Dedos and The Hideout, hosted by The Cocktail Trading Co.',
    type: 'PARTY',
    startDate: '2026-05-12T19:00:00+01:00',
    endDate: '2026-05-13T00:00:00+01:00',
    venueName: 'Cocktail Trading Co',
    address: '68 Bethnal Green Road',
    city: 'London',
    country: 'United Kingdom',
    registrationUrl: null,
  },
  {
    title: 'Three Sixty Vodka & Jägermeister at Laki Kane',
    slug: 'three-sixty-jager-laki-kane-bcb-2026',
    description: 'Three Sixty Vodka and Jägermeister take over Laki Kane Oxford Street.',
    type: 'PARTY',
    startDate: '2026-05-12T19:00:00+01:00',
    endDate: '2026-05-12T23:00:00+01:00',
    venueName: 'Laki Kane Oxford Street',
    address: '31 Duke Street',
    city: 'London',
    country: 'United Kingdom',
    registrationUrl: null,
  },
  {
    title: 'Over and Above Takeover at Murder Inc',
    slug: 'over-above-murder-inc-bcb-2026',
    description: 'Over and Above takes over Murder Inc. Sponsored by Alma Finca.',
    type: 'PARTY',
    startDate: '2026-05-12T19:00:00+01:00',
    endDate: '2026-05-13T00:00:00+01:00',
    venueName: 'Murder Inc',
    address: '36 Hanway Street, W1T 1UP',
    city: 'London',
    country: 'United Kingdom',
    registrationUrl: null,
  },
  {
    title: 'Club Negroni: Double Down & Renae, Manchester',
    slug: 'club-negroni-hidden-grooves-bcb-2026',
    description:
      'Two of Manchester’s most exciting bars descend on East London for a night celebrating everyone’s favourite gin cocktail. Think classics, riffs and down-right original Negronis from two of the best bars in the North-West, soundtracked by DJs spinning vinyls the Count would be proud of. First 50 through the door get a free House Negroni. Sponsored by Martin Miller’s Gin and Paragon Cordial.',
    type: 'PARTY',
    startDate: '2026-05-12T20:00:00+01:00',
    endDate: '2026-05-12T23:00:00+01:00',
    venueName: 'Hidden Grooves',
    address: '45 Curtain Road',
    city: 'London',
    country: 'United Kingdom',
    registrationUrl: null,
  },
  {
    title: 'Viajante x Amber Beverage UK BCB London After Party',
    slug: 'viajante-amber-beverage-bcb-afterparty-2026',
    description:
      'Special guests: Guillermo Erickson, Andrew Moran, Dean Moncrieffe, Carlos Londono, Davide Segat, Ramon “el Tigre” Ramos, Maura Milia, Liana Oster, Pietro Collina and Alex Lawrence. Featuring BOZAL, Arette, Fortaleza, Don Fulano, Derrumbes and Amber Beverage.',
    type: 'PARTY',
    startDate: '2026-05-12T21:00:00+01:00',
    endDate: '2026-05-13T03:00:00+01:00',
    venueName: 'Viajante87',
    address: '87 Notting Hill Gate, W11 3JZ',
    city: 'London',
    country: 'United Kingdom',
    registrationUrl: 'mailto:events.uk@amberbev.com',
  },
  {
    title: 'Brooklands Bar x Paradiso Barcelona',
    slug: 'brooklands-paradiso-barcelona-bcb-2026',
    description:
      'For one night only, Maestro from Paradiso Barcelona takes over Brooklands Bar at The Peninsula Hotel. Featuring London No. 3 Gin, Hine Cognac and Mancino Vermouth.',
    type: 'PARTY',
    startDate: '2026-05-13T19:00:00+01:00',
    endDate: '2026-05-13T23:00:00+01:00',
    venueName: 'Brooklands Bar at The Peninsula Hotel',
    address: '1 Grosvenor Place, SW1X 7HJ',
    city: 'London',
    country: 'United Kingdom',
    registrationUrl: null,
  },
  {
    title: 'The Japanese Bitter & The Japanese Liquor x Aqua Kyoto',
    slug: 'japanese-bitter-aqua-kyoto-bcb-2026',
    description:
      'A one-night-only takeover with The Japanese Bitter & The Japanese Liquor. Exclusive cocktails and Japanese flavours from 7pm.',
    type: 'PARTY',
    startDate: '2026-05-13T19:00:00+01:00',
    endDate: '2026-05-13T22:00:00+01:00',
    venueName: 'Aqua Kyoto',
    address: '30 Argyll Street',
    city: 'London',
    country: 'United Kingdom',
    registrationUrl: null,
  },
  {
    title: 'Chef’s Table — Fortaleza x Corrochio’s x Nine Lives',
    slug: 'fortaleza-corrochios-chefs-table-bcb-2026',
    description: 'A Chef’s Table collaboration between Tequila Fortaleza, Corrochio’s and Nine Lives.',
    type: 'OTHER',
    startDate: '2026-05-13T19:00:00+01:00',
    endDate: '2026-05-13T22:00:00+01:00',
    venueName: 'Corrochio’s',
    address: '76 Stoke Newington Road, N16 7XB',
    city: 'London',
    country: 'United Kingdom',
    registrationUrl: 'https://www.sevenrooms.com/experiences/corrochiosrestaurant',
  },
]

async function main() {
  console.log(`\n🍸 Seeding ${events.length} BCB London 2026 events...\n`)

  let created = 0
  let updated = 0
  let failed = 0

  for (const event of events) {
    const { data: existing } = await supabase
      .from('Event')
      .select('id')
      .eq('slug', event.slug)
      .maybeSingle()

    const now = new Date().toISOString()

    const row = {
      id: existing?.id ?? crypto.randomUUID(),
      title: event.title,
      slug: event.slug,
      description: event.description,
      type: event.type,
      status: 'PUBLISHED',
      startDate: event.startDate,
      endDate: event.endDate,
      timezone: 'Europe/London',
      isVirtual: false,
      venueName: event.venueName,
      address: event.address,
      city: event.city,
      country: event.country,
      isFree: true,
      price: null,
      registrationUrl: event.registrationUrl ?? null,
      showAttendees: true,
      isFeatured: false,
      updatedAt: now,
      ...(existing ? {} : { createdAt: now }),
    }

    const { error } = await supabase
      .from('Event')
      .upsert(row, { onConflict: 'slug' })

    if (error) {
      failed += 1
      console.error(`  ❌ ${event.title}: ${error.message}`)
      continue
    }

    if (existing) {
      updated += 1
      console.log(`  ↻ Updated: ${event.title}`)
    } else {
      created += 1
      console.log(`  ✓ Created: ${event.title}`)
    }
  }

  console.log(
    `\n✅ Done. Created ${created}, updated ${updated}, failed ${failed}.\n`,
  )

  if (failed > 0) {
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
