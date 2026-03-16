-- Seed Real-World 2026 Drinks Industry Events
-- Run in Supabase SQL Editor to replace placeholder events with verified real events

-- Helper function to generate cuid-like IDs
CREATE OR REPLACE FUNCTION generate_cuid() RETURNS TEXT AS $$
BEGIN
  RETURN 'c' || substr(md5(random()::text || clock_timestamp()::text), 1, 24);
END;
$$ LANGUAGE plpgsql;

-- Remove old placeholder events
DELETE FROM "EventRsvp" WHERE "eventId" IN (SELECT "id" FROM "Event");
DELETE FROM "Event";

-- ── Real-world drinks industry events ─────────────────────────────────────

INSERT INTO "Event" ("id", "title", "slug", "description", "type", "status", "startDate", "endDate", "isVirtual", "venueName", "address", "city", "country", "capacity", "isFree", "price", "registrationUrl", "showAttendees", "isFeatured", "createdAt", "updatedAt") VALUES

-- Whisky Live & Fine Spirits London
(generate_cuid(), 'Whisky Live & Fine Spirits London 2026', 'whisky-live-london-2026',
 'The industry-renowned whisky tasting event returns to Woolwich Works. Sample an eclectic range of whiskies including limited-edition and rare releases, attend exclusive masterclasses, and enjoy a blending workshop where you can bottle your own personalised whisky blend to take home.',
 'TRADE_SHOW', 'PUBLISHED', '2026-03-27 11:00:00', '2026-03-28 18:00:00',
 false, 'Fireworks Factory at Woolwich Works', 'Royal Arsenal, No.1 Street', 'London', 'United Kingdom',
 2000, false, 55, 'https://www.whiskylive.com/', true, true, NOW(), NOW()),

-- London Wine Fair
(generate_cuid(), 'London Wine Fair 2026', 'london-wine-fair-2026',
 'The UK''s biggest and most loved wine trade fair returns for its 45th edition. Over 10,000 drinks industry professionals are expected at this year''s fair, which launches the inaugural Host Nation programme spotlighting British drinks — from English sparkling wines to Scottish spirits. Plus, for the first time, BREW//LDN brings a dedicated craft beer and cider space.',
 'TRADE_SHOW', 'PUBLISHED', '2026-05-18 10:00:00', '2026-05-20 17:00:00',
 false, 'Olympia London', 'Hammersmith Road, Kensington', 'London', 'United Kingdom',
 10000, false, 30, 'https://londonwinefair.com/', true, true, NOW(), NOW()),

-- BCB Brooklyn
(generate_cuid(), 'BCB Brooklyn 2026', 'bcb-brooklyn-2026',
 'Bar Convent Brooklyn returns to Industry City with expanded category representation, a strengthened education platform, and enhanced badge experiences. New for 2026, the Workshop Stage introduces a skill-driven environment focused on practical application and deeper exploration of technique and operations. Trade-only event for qualified bar and beverage industry professionals.',
 'TRADE_SHOW', 'PUBLISHED', '2026-06-09 11:00:00', '2026-06-10 19:00:00',
 false, 'Industry City', '2nd Ave between 33rd & 34th St, Sunset Park', 'Brooklyn, NY', 'United States',
 5000, false, 75, 'https://www.barconventbrooklyn.com/', true, true, NOW(), NOW()),

-- Trade Drinks Expo
(generate_cuid(), 'Trade Drinks Expo 2026', 'trade-drinks-expo-2026',
 'The UK''s leading drinks trade exhibition at ExCeL London. Essential for brand owners, distributors, bar groups, independent retailers, and hospitality operators. Discover the latest in production and packaging technologies, pre-mixed cocktails, low-and-no innovations, and premium imports from around 200 exhibitors.',
 'TRADE_SHOW', 'PUBLISHED', '2026-09-29 10:00:00', '2026-09-30 17:00:00',
 false, 'ExCeL London', 'Royal Victoria Dock, 1 Western Gateway', 'London', 'United Kingdom',
 3000, false, 25, 'https://tradedrinksshow.co.uk/', true, false, NOW(), NOW()),

-- The Whisky Exchange Whisky Show
(generate_cuid(), 'The Whisky Exchange Whisky Show 2026', 'whisky-exchange-whisky-show-2026',
 'The UK''s premier whisky festival returns for its 18th year at Old Billingsgate. A three-day celebration bringing together more than 250 distillers, blenders, and bottlers from around the world with over 1,000 fine whiskies to sample. Includes masterclasses, Q&As, food pairings, cocktails, and the legendary Old & Rare rooms.',
 'TRADE_SHOW', 'PUBLISHED', '2026-10-02 16:00:00', '2026-10-04 18:00:00',
 false, 'Old Billingsgate', '1 Old Billingsgate Walk', 'London', 'United Kingdom',
 3000, false, 85, 'https://whiskyshow.com/', true, true, NOW(), NOW()),

-- BCB London
(generate_cuid(), 'BCB London 2026', 'bcb-london-2026',
 'Bar Convent London — formerly Imbibe Live — returns to Tobacco Dock for its second edition. The UK and Ireland''s essential gathering for the bar and beverage community, featuring over 140 exhibitors, an industry-leading education programme led by director Elliot Ball, and the expanded Local Heroes showcase celebrating homegrown talent.',
 'TRADE_SHOW', 'PUBLISHED', '2026-10-07 10:00:00', '2026-10-08 17:00:00',
 false, 'Tobacco Dock', 'Tobacco Quay, Wapping Lane', 'London', 'United Kingdom',
 5000, false, 25, 'https://www.barconventlondon.com/', true, true, NOW(), NOW()),

-- BCB Berlin
(generate_cuid(), 'BCB Berlin 2026', 'bcb-berlin-2026',
 'Bar Convent Berlin celebrates its 20th anniversary as the world''s largest trade fair for the bar and beverage industry. Over 500 exhibitors from almost 90 countries showcase new spirits, mixers, and bar technologies. Attend live masterclasses, mixology workshops, and tastings led by industry legends across three packed days.',
 'TRADE_SHOW', 'PUBLISHED', '2026-10-12 10:00:00', '2026-10-14 18:00:00',
 false, 'Messe Berlin', 'Messedamm 22', 'Berlin', 'Germany',
 15000, false, 60, 'https://www.barconvent.com/', true, true, NOW(), NOW()),

-- Athens Bar Show
(generate_cuid(), 'Athens Bar Show 2026', 'athens-bar-show-2026',
 'One of Europe''s leading educational exhibitions for bartenders and catering professionals, set within the stunning Technopolis complex. Part of Athens Bar Week (1–5 November), the two-day show attracts around 15,000 visitors and transforms the city with non-stop energy, unique experiences, and celebrations across every neighbourhood.',
 'TRADE_SHOW', 'PUBLISHED', '2026-11-03 11:00:00', '2026-11-04 19:00:00',
 false, 'Technopolis City of Athens', 'Pireos 100, Gazi', 'Athens', 'Greece',
 15000, false, 15, 'https://www.athensbarshow.gr/', true, false, NOW(), NOW()),

-- Glasgow's Whisky Festival
(generate_cuid(), 'Glasgow''s Whisky Festival 2026', 'glasgows-whisky-festival-2026',
 'Bringing Scotland''s national drink to Scotland''s national stadium. Sample hundreds of whiskies from distilleries across Scotland and beyond at Hampden Park. A celebration of whisky culture with tastings, masterclasses, and the chance to meet distillers and brand ambassadors.',
 'TRADE_SHOW', 'PUBLISHED', '2026-11-07 12:00:00', '2026-11-07 20:00:00',
 false, 'Hampden Park', 'Letherby Drive', 'Glasgow', 'United Kingdom',
 3000, false, 35, 'https://glasgowswhiskyfestival.com/', true, false, NOW(), NOW()),

-- ── Kindred Collective community events ───────────────────────────────────

-- Kindred Summer Party
(generate_cuid(), 'Kindred Summer Party 2026', 'kindred-summer-party-2026',
 'Join us for the biggest Kindred gathering of the year! Network with fellow drinks makers, meet suppliers, and celebrate the independent drinks community. Live music, tastings, and plenty of opportunities to connect.',
 'PARTY', 'PUBLISHED', '2026-07-15 18:00:00', '2026-07-15 23:00:00',
 false, 'The Brewery', '52 Chiswell Street', 'London', 'United Kingdom',
 300, false, 45, NULL, true, true, NOW(), NOW()),

-- Kindred Manchester Meetup
(generate_cuid(), 'Kindred Manchester Meetup', 'kindred-manchester-meetup-feb-2026',
 'Informal networking drinks for Kindred members in the North. Meet local brands and suppliers, share experiences, and build connections in a relaxed setting.',
 'MEETUP', 'PUBLISHED', '2026-02-20 18:30:00', '2026-02-20 21:00:00',
 false, 'The Alchemist', '1 New York Street', 'Manchester', 'United Kingdom',
 50, true, NULL, NULL, true, false, NOW(), NOW()),

-- Export Masterclass
(generate_cuid(), 'Export Masterclass: Breaking into Europe', 'export-masterclass-europe-2026',
 'Learn the ins and outs of exporting your drinks to European markets. Covering regulations, logistics, finding distributors, and marketing strategies for international success.',
 'WEBINAR', 'PUBLISHED', '2026-02-05 14:00:00', '2026-02-05 15:30:00',
 true, NULL, NULL, 'Online', 'United Kingdom',
 100, true, NULL, NULL, true, false, NOW(), NOW()),

-- Kindred Bristol Meetup
(generate_cuid(), 'Kindred Bristol Meetup', 'kindred-bristol-meetup-mar-2026',
 'Connect with Kindred members in the South West. Casual networking drinks at one of Bristol''s best craft beer venues.',
 'MEETUP', 'PUBLISHED', '2026-03-12 18:00:00', '2026-03-12 21:00:00',
 false, 'Left Handed Giant Brewpub', '1 Wadham Street', 'Bristol', 'United Kingdom',
 40, true, NULL, NULL, true, false, NOW(), NOW()),

-- Brand Launch Bootcamp
(generate_cuid(), 'Brand Launch Bootcamp', 'brand-launch-bootcamp-2026',
 'Intensive two-day workshop for drinks entrepreneurs preparing to launch. Covering branding, production, compliance, distribution, and marketing fundamentals.',
 'WORKSHOP', 'PUBLISHED', '2026-04-05 09:00:00', '2026-04-06 17:00:00',
 false, 'The Trampery', '239 Old Street', 'London', 'United Kingdom',
 30, false, 350, NULL, true, false, NOW(), NOW()),

-- Sustainable Spirits Summit
(generate_cuid(), 'Sustainable Spirits Summit', 'sustainable-spirits-summit-2026',
 'Exploring sustainability across the spirits supply chain. From ingredients to packaging to carbon footprint, learn how leading brands are building a greener future.',
 'WORKSHOP', 'PUBLISHED', '2026-09-15 10:00:00', '2026-09-15 17:00:00',
 false, 'Here East', 'Queen Elizabeth Olympic Park', 'London', 'United Kingdom',
 180, false, 95, NULL, true, false, NOW(), NOW());

-- Clean up helper function
DROP FUNCTION generate_cuid();
