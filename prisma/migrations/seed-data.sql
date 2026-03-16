-- Kindred Collective Seed Data
-- Run this AFTER schema.sql in Supabase SQL Editor

-- Helper function to generate cuid-like IDs
CREATE OR REPLACE FUNCTION generate_cuid() RETURNS TEXT AS $$
BEGIN
  RETURN 'c' || substr(md5(random()::text || clock_timestamp()::text), 1, 24);
END;
$$ LANGUAGE plpgsql;

-- Insert Suppliers
INSERT INTO "Supplier" ("id", "companyName", "slug", "tagline", "description", "category", "services", "location", "country", "serviceRegions", "websiteUrl", "linkedinUrl", "contactName", "contactEmail", "logoUrl", "isVerified", "isPublic", "claimStatus", "viewCount", "certifications", "subcategories", "createdAt", "updatedAt") VALUES
(generate_cuid(), 'SAVERGLASS', 'saverglass', 'Manufacturer and decorator of high-quality glass bottles, offering both off-the-shelf and bespoke solutions.', 'SAVERGLASS is a world-leading manufacturer of premium glass bottles for spirits, wine, and beverages. With decades of expertise, we offer both bespoke designs and an extensive catalog of ready-made options.', 'PACKAGING', ARRAY['Glass Bottles', 'Bespoke Design', 'Premium Packaging', 'Decoration', 'Screen Printing'], 'France', 'France', ARRAY['United Kingdom', 'Europe', 'North America', 'Global'], 'https://www.saverglass.com/', NULL, 'George Potter', 'gwp@saverglass.com', 'https://kindredcollective.co.uk/cdn/shop/files/SaverGlass.png', true, true, 'UNCLAIMED', 0, ARRAY[]::"Certification"[], ARRAY[]::TEXT[], NOW(), NOW()),

(generate_cuid(), 'London City Bond Ltd', 'london-city-bond-ltd', 'Bonded warehouse storage and delivery/distribution to Trade, Grocer, Amazon, D2C across the UK from any of our 16 bonded locations.', 'London City Bond provides comprehensive bonded warehouse storage and distribution services for the drinks industry. With 16 locations across the UK, we offer trade fulfillment, grocery distribution, Amazon logistics, and direct-to-consumer operations.', 'LOGISTICS', ARRAY['Bonded Warehouse', 'D2C Fulfillment', 'Trade Distribution', 'Amazon Logistics', 'Export Support'], 'London', 'United Kingdom', ARRAY['United Kingdom'], 'https://www.lcb.co.uk/', 'https://www.linkedin.com/company/london-city-bond-ltd', 'Jay Swanborough', 'jswanborough@lcb.co.uk', 'https://kindredcollective.co.uk/cdn/shop/files/Picture2.png', true, true, 'UNCLAIMED', 0, ARRAY[]::"Certification"[], ARRAY[]::TEXT[], NOW(), NOW()),

(generate_cuid(), 'Aitch Creates', 'aitch-creates', 'Strategic branding and design for ambitious drinks brands.', 'Design agency specializing in branding for beverage companies. We create distinctive brand identities that stand out on shelf and connect with consumers. Notable clients include Duppy Share, Dangerous Don, Pimentae, Fauna Brewery, and Wild Bunch.', 'DESIGN', ARRAY['Strategic Branding', 'Pack Design', 'Creative Development', 'Brand Identity'], 'United Kingdom', 'United Kingdom', ARRAY['United Kingdom', 'Europe'], 'https://aitchcreates.com/', NULL, 'Alice Fowler', 'alice@aitchcreates.com', NULL, true, true, 'UNCLAIMED', 0, ARRAY[]::"Certification"[], ARRAY[]::TEXT[], NOW(), NOW()),

(generate_cuid(), 'Graceful Monkey', 'graceful-monkey', 'Studio creating Digital Content & Experiences', 'Creative studio specializing in digital content creation and immersive brand experiences for the drinks industry.', 'PHOTOGRAPHY', ARRAY['Video Production', 'Photography', 'Digital Experiences', 'Social Content', 'Brand Films'], 'London', 'United Kingdom', ARRAY['United Kingdom', 'Europe'], NULL, NULL, NULL, NULL, NULL, true, true, 'UNCLAIMED', 0, ARRAY[]::"Certification"[], ARRAY[]::TEXT[], NOW(), NOW()),

(generate_cuid(), 'Buddy Creative', 'buddy-creative', 'Brand and packaging design agency specialising in food & drink', 'Award-winning brand and packaging design agency with deep expertise in the food and drink sector.', 'DESIGN', ARRAY['Brand Identity', 'Packaging Design', 'Label Design', 'Brand Strategy'], 'Manchester', 'United Kingdom', ARRAY['United Kingdom', 'Europe', 'North America'], NULL, NULL, NULL, NULL, NULL, true, true, 'UNCLAIMED', 0, ARRAY[]::"Certification"[], ARRAY[]::TEXT[], NOW(), NOW()),

(generate_cuid(), 'Bien Venue Ltd', 'bien-venue', 'Free service sourcing standout venues for drinks brands', 'Specialist venue sourcing service helping drinks brands find the perfect locations for launches, tastings, and events.', 'OTHER', ARRAY['Venue Sourcing', 'Event Planning', 'Launch Events', 'Brand Activations'], 'London', 'United Kingdom', ARRAY['United Kingdom'], NULL, NULL, NULL, NULL, NULL, true, true, 'UNCLAIMED', 0, ARRAY[]::"Certification"[], ARRAY[]::TEXT[], NOW(), NOW()),

(generate_cuid(), 'AM Distilling LTD', 'am-distilling', 'Contract Bottlers/Contract Blenders/Bulk Spirits', 'Full-service contract distilling, blending, and bottling facility.', 'CO_PACKING', ARRAY['Contract Distilling', 'Contract Bottling', 'Blending', 'Bulk Spirits'], 'Scotland', 'United Kingdom', ARRAY['United Kingdom', 'Europe'], NULL, NULL, NULL, NULL, NULL, true, true, 'UNCLAIMED', 0, ARRAY[]::"Certification"[], ARRAY[]::TEXT[], NOW(), NOW()),

(generate_cuid(), 'BB Comms', 'bb-comms', 'Spirits specialist PR, events and marketing consultancy', 'Award-winning PR, events and marketing consultancy specializing in spirits and premium drinks brands.', 'PR', ARRAY['Public Relations', 'Events', 'Marketing Strategy', 'Media Relations', 'Influencer Campaigns'], 'London', 'United Kingdom', ARRAY['United Kingdom', 'Europe', 'North America'], NULL, NULL, NULL, NULL, NULL, true, true, 'UNCLAIMED', 0, ARRAY[]::"Certification"[], ARRAY[]::TEXT[], NOW(), NOW()),

(generate_cuid(), 'Label Apeel Ltd', 'label-apeel', 'UK label manufacturer', 'Leading UK manufacturer of high-quality labels for the drinks industry.', 'PACKAGING', ARRAY['Label Printing', 'Custom Labels', 'Premium Finishes', 'Short Runs'], 'United Kingdom', 'United Kingdom', ARRAY['United Kingdom'], NULL, NULL, NULL, NULL, NULL, true, true, 'UNCLAIMED', 0, ARRAY[]::"Certification"[], ARRAY[]::TEXT[], NOW(), NOW()),

(generate_cuid(), 'Scale Drinks', 'scale-drinks', 'Export agency for global expansion', 'Export agency helping drinks brands expand globally with distributor introductions and market entry support.', 'DISTRIBUTION', ARRAY['Export Strategy', 'Distributor Network', 'Market Entry', 'International Sales'], 'London', 'United Kingdom', ARRAY['Europe', 'Asia', 'North America', 'Global'], NULL, NULL, NULL, NULL, NULL, true, true, 'UNCLAIMED', 0, ARRAY[]::"Certification"[], ARRAY[]::TEXT[], NOW(), NOW()),

(generate_cuid(), 'Addition', 'addition', 'Accounting and CFO platform for FMCG/e-commerce', 'Modern accounting and CFO services platform designed for FMCG and e-commerce brands.', 'FINANCE', ARRAY['Accounting', 'CFO Services', 'Financial Reporting', 'Tax Planning'], 'London', 'United Kingdom', ARRAY['United Kingdom'], NULL, NULL, NULL, NULL, NULL, true, true, 'UNCLAIMED', 0, ARRAY[]::"Certification"[], ARRAY[]::TEXT[], NOW(), NOW()),

(generate_cuid(), 'The Custom Spirit Co', 'custom-spirit-co', 'Contract distilling, blending, fermentation, bottling', 'Full-service contract manufacturing facility offering distilling, blending, fermentation, and bottling services.', 'CO_PACKING', ARRAY['Contract Distilling', 'Blending', 'Fermentation', 'Bottling', 'NPD Support'], 'United Kingdom', 'United Kingdom', ARRAY['United Kingdom'], NULL, NULL, NULL, NULL, NULL, true, true, 'UNCLAIMED', 0, ARRAY[]::"Certification"[], ARRAY[]::TEXT[], NOW(), NOW()),

(generate_cuid(), 'Berlin Packaging', 'berlin-packaging', 'Global packaging in glass, plastic, metal', 'Global packaging supplier offering a vast range of bottles, jars, and containers with full decoration services.', 'PACKAGING', ARRAY['Glass Packaging', 'Plastic Containers', 'Metal Packaging', 'Decoration', 'Design Services'], 'Europe', 'Germany', ARRAY['United Kingdom', 'Europe', 'Global'], NULL, NULL, NULL, NULL, NULL, true, true, 'UNCLAIMED', 0, ARRAY[]::"Certification"[], ARRAY[]::TEXT[], NOW(), NOW()),

(generate_cuid(), 'Verallia', 'verallia', 'UK-made glass bottles, bespoke and stock', 'Major glass manufacturer with UK production facilities, offering both stock and bespoke glass bottle solutions.', 'PACKAGING', ARRAY['Glass Bottles', 'Bespoke Manufacturing', 'Stock Solutions', 'Sustainable Glass'], 'United Kingdom', 'United Kingdom', ARRAY['United Kingdom', 'Europe'], NULL, NULL, NULL, NULL, NULL, true, true, 'UNCLAIMED', 0, ARRAY[]::"Certification"[], ARRAY[]::TEXT[], NOW(), NOW()),

(generate_cuid(), 'Hensol Castle Distillery', 'hensol-castle-distillery', 'Contract bottling, distilling, NPD', 'Welsh contract distillery offering distilling, bottling, and new product development services.', 'CO_PACKING', ARRAY['Contract Distilling', 'Contract Bottling', 'NPD', 'Recipe Development'], 'Wales', 'United Kingdom', ARRAY['United Kingdom'], NULL, NULL, NULL, NULL, NULL, true, true, 'UNCLAIMED', 0, ARRAY[]::"Certification"[], ARRAY[]::TEXT[], NOW(), NOW()),

(generate_cuid(), 'Cooper Parry', 'cooper-parry', 'Accountancy services for drinks businesses', 'Award-winning accountancy firm with a dedicated drinks and hospitality team.', 'FINANCE', ARRAY['Audit', 'Tax Advisory', 'Corporate Finance', 'Business Advisory'], 'Birmingham', 'United Kingdom', ARRAY['United Kingdom'], NULL, NULL, NULL, NULL, NULL, true, true, 'UNCLAIMED', 0, ARRAY[]::"Certification"[], ARRAY[]::TEXT[], NOW(), NOW()),

(generate_cuid(), 'Avallen Solutions', 'avallen-solutions', 'Sustainability strategy and support', 'Sustainability consultancy helping drinks brands develop and implement environmental strategies, from carbon footprinting to B Corp certification.', 'SUSTAINABILITY', ARRAY['Sustainability Strategy', 'Carbon Footprinting', 'B Corp Support', 'ESG Reporting'], 'United Kingdom', 'United Kingdom', ARRAY['United Kingdom', 'Europe'], NULL, NULL, NULL, NULL, NULL, true, true, 'UNCLAIMED', 0, ARRAY['B_CORP']::"Certification"[], ARRAY[]::TEXT[], NOW(), NOW()),

(generate_cuid(), 'Bowimi', 'bowimi', 'CRM/sales platform for drinks brands', 'Sales and CRM platform designed specifically for drinks brands to manage trade relationships and orders.', 'SOFTWARE', ARRAY['CRM', 'Sales Management', 'Order Processing', 'Trade Relationships'], 'United Kingdom', 'United Kingdom', ARRAY['United Kingdom'], NULL, NULL, NULL, NULL, NULL, true, true, 'UNCLAIMED', 0, ARRAY[]::"Certification"[], ARRAY[]::TEXT[], NOW(), NOW()),

(generate_cuid(), 'Midday Studio', 'midday-studio', 'Award-winning design studio', 'Award-winning design studio creating distinctive brand identities and packaging for drinks brands.', 'DESIGN', ARRAY['Brand Identity', 'Packaging Design', 'Visual Identity', 'Creative Direction'], 'United Kingdom', 'United Kingdom', ARRAY['United Kingdom'], NULL, NULL, NULL, NULL, NULL, true, true, 'UNCLAIMED', 0, ARRAY[]::"Certification"[], ARRAY[]::TEXT[], NOW(), NOW()),

(generate_cuid(), 'Soho Drinks Ltd', 'soho-drinks', 'PR services for drinks and lifestyle', 'PR agency specializing in drinks and lifestyle brands, with strong media relationships.', 'PR', ARRAY['Public Relations', 'Media Relations', 'Event PR', 'Brand Launches'], 'London', 'United Kingdom', ARRAY['United Kingdom'], NULL, NULL, NULL, NULL, NULL, true, true, 'UNCLAIMED', 0, ARRAY[]::"Certification"[], ARRAY[]::TEXT[], NOW(), NOW()),

(generate_cuid(), 'Tortuga', 'tortuga', 'UK distribution and back-office logistics', 'Full-service distribution and logistics partner for drinks brands in the UK market.', 'DISTRIBUTION', ARRAY['UK Distribution', 'Logistics', 'Back-Office Support', 'Order Fulfillment'], 'United Kingdom', 'United Kingdom', ARRAY['United Kingdom'], NULL, NULL, NULL, NULL, NULL, true, true, 'UNCLAIMED', 0, ARRAY[]::"Certification"[], ARRAY[]::TEXT[], NOW(), NOW()),

(generate_cuid(), 'Greenbox Designs', 'greenbox-designs', 'Website development services', 'Web design and development agency creating beautiful, functional websites for drinks brands.', 'WEB_DEVELOPMENT', ARRAY['Website Design', 'Web Development', 'E-Commerce Sites', 'Digital Strategy'], 'United Kingdom', 'United Kingdom', ARRAY['United Kingdom'], NULL, NULL, NULL, NULL, NULL, true, true, 'UNCLAIMED', 0, ARRAY[]::"Certification"[], ARRAY[]::TEXT[], NOW(), NOW()),

(generate_cuid(), 'Frederick Wilkinson', 'frederick-wilkinson', 'Photography and videography', 'Professional photographer and videographer specializing in drinks and food content.', 'PHOTOGRAPHY', ARRAY['Photography', 'Videography', 'Product Shots', 'Lifestyle Content'], 'United Kingdom', 'United Kingdom', ARRAY['United Kingdom'], NULL, NULL, NULL, NULL, NULL, true, true, 'UNCLAIMED', 0, ARRAY[]::"Certification"[], ARRAY[]::TEXT[], NOW(), NOW());

-- Insert some reviews for suppliers with reviews
INSERT INTO "SupplierReview" ("id", "supplierId", "reviewerName", "reviewerCompany", "rating", "content", "wouldRecommend", "isVerified", "isPublic", "createdAt", "updatedAt")
SELECT generate_cuid(), s.id, 'Fabrizio', 'The Heart Cut', 5, 'Great from a DTC + Trade perspective. Made our brand launch operations smooth and easy.', true, false, true, NOW(), NOW()
FROM "Supplier" s WHERE s.slug = 'london-city-bond-ltd';

INSERT INTO "SupplierReview" ("id", "supplierId", "reviewerName", "reviewerCompany", "rating", "content", "wouldRecommend", "isVerified", "isPublic", "createdAt", "updatedAt")
SELECT generate_cuid(), s.id, 'Sophie', 'Silent Pool Gin', 5, 'Huge support, worth the money. 10-year client highlighting flexibility, reliability, and export market support.', true, false, true, NOW(), NOW()
FROM "Supplier" s WHERE s.slug = 'london-city-bond-ltd';

INSERT INTO "SupplierReview" ("id", "supplierId", "reviewerName", "reviewerCompany", "rating", "content", "wouldRecommend", "serviceRating", "valueRating", "isVerified", "isPublic", "createdAt", "updatedAt")
SELECT generate_cuid(), s.id, 'Jack Orr-Ewing', 'Duppy Share', 5, 'Agency level of output at a reasonable fee. Harry''s vision of how a brand shows up in every touchpoint is second to none.', true, 5, 5, false, true, NOW(), NOW()
FROM "Supplier" s WHERE s.slug = 'aitch-creates';

INSERT INTO "SupplierReview" ("id", "supplierId", "reviewerName", "reviewerCompany", "rating", "content", "wouldRecommend", "serviceRating", "valueRating", "isVerified", "isPublic", "createdAt", "updatedAt")
SELECT generate_cuid(), s.id, 'Alice', 'Pimentae', 5, 'Instinctively understand our vision and always deliver designs that hit the brief perfectly, often exceeding expectations.', true, 5, 5, false, true, NOW(), NOW()
FROM "Supplier" s WHERE s.slug = 'aitch-creates';

-- Insert Events (real-world 2026 drinks industry events + Kindred community events)
INSERT INTO "Event" ("id", "title", "slug", "description", "type", "status", "startDate", "endDate", "isVirtual", "venueName", "address", "city", "country", "capacity", "isFree", "price", "registrationUrl", "showAttendees", "isFeatured", "createdAt", "updatedAt") VALUES

(generate_cuid(), 'Whisky Live & Fine Spirits London 2026', 'whisky-live-london-2026',
 'The industry-renowned whisky tasting event returns to Woolwich Works. Sample an eclectic range of whiskies including limited-edition and rare releases, attend exclusive masterclasses, and enjoy a blending workshop where you can bottle your own personalised whisky blend to take home.',
 'TRADE_SHOW', 'PUBLISHED', '2026-03-27 11:00:00', '2026-03-28 18:00:00',
 false, 'Fireworks Factory at Woolwich Works', 'Royal Arsenal, No.1 Street', 'London', 'United Kingdom',
 2000, false, 55, 'https://www.whiskylive.com/', true, true, NOW(), NOW()),

(generate_cuid(), 'London Wine Fair 2026', 'london-wine-fair-2026',
 'The UK''s biggest and most loved wine trade fair returns for its 45th edition. Over 10,000 drinks industry professionals are expected at this year''s fair, which launches the inaugural Host Nation programme spotlighting British drinks — from English sparkling wines to Scottish spirits.',
 'TRADE_SHOW', 'PUBLISHED', '2026-05-18 10:00:00', '2026-05-20 17:00:00',
 false, 'Olympia London', 'Hammersmith Road, Kensington', 'London', 'United Kingdom',
 10000, false, 30, 'https://londonwinefair.com/', true, true, NOW(), NOW()),

(generate_cuid(), 'BCB Brooklyn 2026', 'bcb-brooklyn-2026',
 'Bar Convent Brooklyn returns to Industry City with expanded category representation, a strengthened education platform, and enhanced badge experiences. Trade-only event for qualified bar and beverage industry professionals.',
 'TRADE_SHOW', 'PUBLISHED', '2026-06-09 11:00:00', '2026-06-10 19:00:00',
 false, 'Industry City', '2nd Ave between 33rd & 34th St, Sunset Park', 'Brooklyn, NY', 'United States',
 5000, false, 75, 'https://www.barconventbrooklyn.com/', true, true, NOW(), NOW()),

(generate_cuid(), 'Trade Drinks Expo 2026', 'trade-drinks-expo-2026',
 'The UK''s leading drinks trade exhibition at ExCeL London. Essential for brand owners, distributors, bar groups, independent retailers, and hospitality operators.',
 'TRADE_SHOW', 'PUBLISHED', '2026-09-29 10:00:00', '2026-09-30 17:00:00',
 false, 'ExCeL London', 'Royal Victoria Dock, 1 Western Gateway', 'London', 'United Kingdom',
 3000, false, 25, 'https://tradedrinksshow.co.uk/', true, false, NOW(), NOW()),

(generate_cuid(), 'The Whisky Exchange Whisky Show 2026', 'whisky-exchange-whisky-show-2026',
 'The UK''s premier whisky festival returns for its 18th year at Old Billingsgate. A three-day celebration bringing together more than 250 distillers, blenders, and bottlers from around the world with over 1,000 fine whiskies to sample.',
 'TRADE_SHOW', 'PUBLISHED', '2026-10-02 16:00:00', '2026-10-04 18:00:00',
 false, 'Old Billingsgate', '1 Old Billingsgate Walk', 'London', 'United Kingdom',
 3000, false, 85, 'https://whiskyshow.com/', true, true, NOW(), NOW()),

(generate_cuid(), 'BCB London 2026', 'bcb-london-2026',
 'Bar Convent London — formerly Imbibe Live — returns to Tobacco Dock for its second edition. The UK and Ireland''s essential gathering for the bar and beverage community, featuring over 140 exhibitors and an industry-leading education programme.',
 'TRADE_SHOW', 'PUBLISHED', '2026-10-07 10:00:00', '2026-10-08 17:00:00',
 false, 'Tobacco Dock', 'Tobacco Quay, Wapping Lane', 'London', 'United Kingdom',
 5000, false, 25, 'https://www.barconventlondon.com/', true, true, NOW(), NOW()),

(generate_cuid(), 'BCB Berlin 2026', 'bcb-berlin-2026',
 'Bar Convent Berlin celebrates its 20th anniversary as the world''s largest trade fair for the bar and beverage industry. Over 500 exhibitors from almost 90 countries showcase new spirits, mixers, and bar technologies.',
 'TRADE_SHOW', 'PUBLISHED', '2026-10-12 10:00:00', '2026-10-14 18:00:00',
 false, 'Messe Berlin', 'Messedamm 22', 'Berlin', 'Germany',
 15000, false, 60, 'https://www.barconvent.com/', true, true, NOW(), NOW()),

(generate_cuid(), 'Athens Bar Show 2026', 'athens-bar-show-2026',
 'One of Europe''s leading educational exhibitions for bartenders and catering professionals, set within the stunning Technopolis complex. Part of Athens Bar Week (1–5 November).',
 'TRADE_SHOW', 'PUBLISHED', '2026-11-03 11:00:00', '2026-11-04 19:00:00',
 false, 'Technopolis City of Athens', 'Pireos 100, Gazi', 'Athens', 'Greece',
 15000, false, 15, 'https://www.athensbarshow.gr/', true, false, NOW(), NOW()),

(generate_cuid(), 'Glasgow''s Whisky Festival 2026', 'glasgows-whisky-festival-2026',
 'Bringing Scotland''s national drink to Scotland''s national stadium. Sample hundreds of whiskies from distilleries across Scotland and beyond at Hampden Park.',
 'TRADE_SHOW', 'PUBLISHED', '2026-11-07 12:00:00', '2026-11-07 20:00:00',
 false, 'Hampden Park', 'Letherby Drive', 'Glasgow', 'United Kingdom',
 3000, false, 35, 'https://glasgowswhiskyfestival.com/', true, false, NOW(), NOW()),

(generate_cuid(), 'Kindred Summer Party 2026', 'kindred-summer-party-2026',
 'Join us for the biggest Kindred gathering of the year! Network with fellow drinks makers, meet suppliers, and celebrate the independent drinks community. Live music, tastings, and plenty of opportunities to connect.',
 'PARTY', 'PUBLISHED', '2026-07-15 18:00:00', '2026-07-15 23:00:00',
 false, 'The Brewery', '52 Chiswell Street', 'London', 'United Kingdom',
 300, false, 45, NULL, true, true, NOW(), NOW()),

(generate_cuid(), 'Kindred Manchester Meetup', 'kindred-manchester-meetup-feb-2026',
 'Informal networking drinks for Kindred members in the North. Meet local brands and suppliers, share experiences, and build connections in a relaxed setting.',
 'MEETUP', 'PUBLISHED', '2026-02-20 18:30:00', '2026-02-20 21:00:00',
 false, 'The Alchemist', '1 New York Street', 'Manchester', 'United Kingdom',
 50, true, NULL, NULL, true, false, NOW(), NOW()),

(generate_cuid(), 'Export Masterclass: Breaking into Europe', 'export-masterclass-europe-2026',
 'Learn the ins and outs of exporting your drinks to European markets. Covering regulations, logistics, finding distributors, and marketing strategies for international success.',
 'WEBINAR', 'PUBLISHED', '2026-02-05 14:00:00', '2026-02-05 15:30:00',
 true, NULL, NULL, 'Online', 'United Kingdom',
 100, true, NULL, NULL, true, false, NOW(), NOW()),

(generate_cuid(), 'Kindred Bristol Meetup', 'kindred-bristol-meetup-mar-2026',
 'Connect with Kindred members in the South West. Casual networking drinks at one of Bristol''s best craft beer venues.',
 'MEETUP', 'PUBLISHED', '2026-03-12 18:00:00', '2026-03-12 21:00:00',
 false, 'Left Handed Giant Brewpub', '1 Wadham Street', 'Bristol', 'United Kingdom',
 40, true, NULL, NULL, true, false, NOW(), NOW()),

(generate_cuid(), 'Brand Launch Bootcamp', 'brand-launch-bootcamp-2026',
 'Intensive two-day workshop for drinks entrepreneurs preparing to launch. Covering branding, production, compliance, distribution, and marketing fundamentals.',
 'WORKSHOP', 'PUBLISHED', '2026-04-05 09:00:00', '2026-04-06 17:00:00',
 false, 'The Trampery', '239 Old Street', 'London', 'United Kingdom',
 30, false, 350, NULL, true, false, NOW(), NOW()),

(generate_cuid(), 'Sustainable Spirits Summit', 'sustainable-spirits-summit-2026',
 'Exploring sustainability across the spirits supply chain. From ingredients to packaging to carbon footprint, learn how leading brands are building a greener future.',
 'WORKSHOP', 'PUBLISHED', '2026-09-15 10:00:00', '2026-09-15 17:00:00',
 false, 'Here East', 'Queen Elizabeth Olympic Park', 'London', 'United Kingdom',
 180, false, 95, NULL, true, false, NOW(), NOW());

-- Insert Sample Offer
INSERT INTO "Offer" ("id", "supplierId", "title", "description", "type", "discountValue", "code", "termsConditions", "status", "startDate", "endDate", "forBrandsOnly", "minOrderValue", "viewCount", "claimCount", "createdAt", "updatedAt")
SELECT generate_cuid(), s.id, '10% Off First Order for Kindred Members', 'Exclusive discount for Kindred Collective members on your first order of premium glass bottles. Valid for orders over 5,000 units.', 'PERCENTAGE_DISCOUNT', 10, 'KINDRED10', 'Valid for new customers only. Minimum order of 5,000 units. Cannot be combined with other offers. Valid until December 31, 2026.', 'ACTIVE', '2026-01-01', '2026-12-31', true, 5000, 0, 0, NOW(), NOW()
FROM "Supplier" s WHERE s.slug = 'saverglass';

-- Clean up helper function
DROP FUNCTION generate_cuid();
