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
(generate_cuid(), 'SAVERGLASS', 'saverglass', 'Manufacturer and decorator of high-quality glass bottles, offering both off-the-shelf and bespoke solutions.', 'SAVERGLASS is a world-leading manufacturer of premium glass bottles for spirits, wine, and beverages. With decades of expertise, we offer both bespoke designs and an extensive catalog of ready-made options.', 'PACKAGING', ARRAY['Glass Bottles', 'Bespoke Design', 'Premium Packaging', 'Decoration', 'Screen Printing'], 'France', 'France', ARRAY['United Kingdom', 'Europe', 'North America', 'Global'], 'https://www.saverglass.com/', NULL, 'George Potter', 'gwp@saverglass.com', 'https://kindredcollective.co.uk/cdn/shop/files/SaverGlass.png', true, true, 'UNCLAIMED', 0, ARRAY[]::\"Certification\"[], ARRAY[]::TEXT[], NOW(), NOW()),

(generate_cuid(), 'London City Bond Ltd', 'london-city-bond-ltd', 'Bonded warehouse storage and delivery/distribution to Trade, Grocer, Amazon, D2C across the UK from any of our 16 bonded locations.', 'London City Bond provides comprehensive bonded warehouse storage and distribution services for the drinks industry. With 16 locations across the UK, we offer trade fulfillment, grocery distribution, Amazon logistics, and direct-to-consumer operations.', 'LOGISTICS', ARRAY['Bonded Warehouse', 'D2C Fulfillment', 'Trade Distribution', 'Amazon Logistics', 'Export Support'], 'London', 'United Kingdom', ARRAY['United Kingdom'], 'https://www.lcb.co.uk/', 'https://www.linkedin.com/company/london-city-bond-ltd', 'Jay Swanborough', 'jswanborough@lcb.co.uk', 'https://kindredcollective.co.uk/cdn/shop/files/Picture2.png', true, true, 'UNCLAIMED', 0, ARRAY[]::\"Certification\"[], ARRAY[]::TEXT[], NOW(), NOW()),

(generate_cuid(), 'Aitch Creates', 'aitch-creates', 'Strategic branding and design for ambitious drinks brands.', 'Design agency specializing in branding for beverage companies. We create distinctive brand identities that stand out on shelf and connect with consumers. Notable clients include Duppy Share, Dangerous Don, Pimentae, Fauna Brewery, and Wild Bunch.', 'DESIGN', ARRAY['Strategic Branding', 'Pack Design', 'Creative Development', 'Brand Identity'], 'United Kingdom', 'United Kingdom', ARRAY['United Kingdom', 'Europe'], 'https://aitchcreates.com/', NULL, 'Alice Fowler', 'alice@aitchcreates.com', NULL, true, true, 'UNCLAIMED', 0, ARRAY[]::\"Certification\"[], ARRAY[]::TEXT[], NOW(), NOW()),

(generate_cuid(), 'Graceful Monkey', 'graceful-monkey', 'Studio creating Digital Content & Experiences', 'Creative studio specializing in digital content creation and immersive brand experiences for the drinks industry.', 'PHOTOGRAPHY', ARRAY['Video Production', 'Photography', 'Digital Experiences', 'Social Content', 'Brand Films'], 'London', 'United Kingdom', ARRAY['United Kingdom', 'Europe'], NULL, NULL, NULL, NULL, NULL, true, true, 'UNCLAIMED', 0, ARRAY[]::\"Certification\"[], ARRAY[]::TEXT[], NOW(), NOW()),

(generate_cuid(), 'Buddy Creative', 'buddy-creative', 'Brand and packaging design agency specialising in food & drink', 'Award-winning brand and packaging design agency with deep expertise in the food and drink sector.', 'DESIGN', ARRAY['Brand Identity', 'Packaging Design', 'Label Design', 'Brand Strategy'], 'Manchester', 'United Kingdom', ARRAY['United Kingdom', 'Europe', 'North America'], NULL, NULL, NULL, NULL, NULL, true, true, 'UNCLAIMED', 0, ARRAY[]::\"Certification\"[], ARRAY[]::TEXT[], NOW(), NOW()),

(generate_cuid(), 'Bien Venue Ltd', 'bien-venue', 'Free service sourcing standout venues for drinks brands', 'Specialist venue sourcing service helping drinks brands find the perfect locations for launches, tastings, and events.', 'OTHER', ARRAY['Venue Sourcing', 'Event Planning', 'Launch Events', 'Brand Activations'], 'London', 'United Kingdom', ARRAY['United Kingdom'], NULL, NULL, NULL, NULL, NULL, true, true, 'UNCLAIMED', 0, ARRAY[]::\"Certification\"[], ARRAY[]::TEXT[], NOW(), NOW()),

(generate_cuid(), 'AM Distilling LTD', 'am-distilling', 'Contract Bottlers/Contract Blenders/Bulk Spirits', 'Full-service contract distilling, blending, and bottling facility.', 'CO_PACKING', ARRAY['Contract Distilling', 'Contract Bottling', 'Blending', 'Bulk Spirits'], 'Scotland', 'United Kingdom', ARRAY['United Kingdom', 'Europe'], NULL, NULL, NULL, NULL, NULL, true, true, 'UNCLAIMED', 0, ARRAY[]::\"Certification\"[], ARRAY[]::TEXT[], NOW(), NOW()),

(generate_cuid(), 'BB Comms', 'bb-comms', 'Spirits specialist PR, events and marketing consultancy', 'Award-winning PR, events and marketing consultancy specializing in spirits and premium drinks brands.', 'PR', ARRAY['Public Relations', 'Events', 'Marketing Strategy', 'Media Relations', 'Influencer Campaigns'], 'London', 'United Kingdom', ARRAY['United Kingdom', 'Europe', 'North America'], NULL, NULL, NULL, NULL, NULL, true, true, 'UNCLAIMED', 0, ARRAY[]::\"Certification\"[], ARRAY[]::TEXT[], NOW(), NOW()),

(generate_cuid(), 'Label Apeel Ltd', 'label-apeel', 'UK label manufacturer', 'Leading UK manufacturer of high-quality labels for the drinks industry.', 'PACKAGING', ARRAY['Label Printing', 'Custom Labels', 'Premium Finishes', 'Short Runs'], 'United Kingdom', 'United Kingdom', ARRAY['United Kingdom'], NULL, NULL, NULL, NULL, NULL, true, true, 'UNCLAIMED', 0, ARRAY[]::\"Certification\"[], ARRAY[]::TEXT[], NOW(), NOW()),

(generate_cuid(), 'Scale Drinks', 'scale-drinks', 'Export agency for global expansion', 'Export agency helping drinks brands expand globally with distributor introductions and market entry support.', 'DISTRIBUTION', ARRAY['Export Strategy', 'Distributor Network', 'Market Entry', 'International Sales'], 'London', 'United Kingdom', ARRAY['Europe', 'Asia', 'North America', 'Global'], NULL, NULL, NULL, NULL, NULL, true, true, 'UNCLAIMED', 0, ARRAY[]::\"Certification\"[], ARRAY[]::TEXT[], NOW(), NOW()),

(generate_cuid(), 'Addition', 'addition', 'Accounting and CFO platform for FMCG/e-commerce', 'Modern accounting and CFO services platform designed for FMCG and e-commerce brands.', 'FINANCE', ARRAY['Accounting', 'CFO Services', 'Financial Reporting', 'Tax Planning'], 'London', 'United Kingdom', ARRAY['United Kingdom'], NULL, NULL, NULL, NULL, NULL, true, true, 'UNCLAIMED', 0, ARRAY[]::\"Certification\"[], ARRAY[]::TEXT[], NOW(), NOW()),

(generate_cuid(), 'The Custom Spirit Co', 'custom-spirit-co', 'Contract distilling, blending, fermentation, bottling', 'Full-service contract manufacturing facility offering distilling, blending, fermentation, and bottling services.', 'CO_PACKING', ARRAY['Contract Distilling', 'Blending', 'Fermentation', 'Bottling', 'NPD Support'], 'United Kingdom', 'United Kingdom', ARRAY['United Kingdom'], NULL, NULL, NULL, NULL, NULL, true, true, 'UNCLAIMED', 0, ARRAY[]::\"Certification\"[], ARRAY[]::TEXT[], NOW(), NOW()),

(generate_cuid(), 'Berlin Packaging', 'berlin-packaging', 'Global packaging in glass, plastic, metal', 'Global packaging supplier offering a vast range of bottles, jars, and containers with full decoration services.', 'PACKAGING', ARRAY['Glass Packaging', 'Plastic Containers', 'Metal Packaging', 'Decoration', 'Design Services'], 'Europe', 'Germany', ARRAY['United Kingdom', 'Europe', 'Global'], NULL, NULL, NULL, NULL, NULL, true, true, 'UNCLAIMED', 0, ARRAY[]::\"Certification\"[], ARRAY[]::TEXT[], NOW(), NOW()),

(generate_cuid(), 'Verallia', 'verallia', 'UK-made glass bottles, bespoke and stock', 'Major glass manufacturer with UK production facilities, offering both stock and bespoke glass bottle solutions.', 'PACKAGING', ARRAY['Glass Bottles', 'Bespoke Manufacturing', 'Stock Solutions', 'Sustainable Glass'], 'United Kingdom', 'United Kingdom', ARRAY['United Kingdom', 'Europe'], NULL, NULL, NULL, NULL, NULL, true, true, 'UNCLAIMED', 0, ARRAY[]::\"Certification\"[], ARRAY[]::TEXT[], NOW(), NOW()),

(generate_cuid(), 'Hensol Castle Distillery', 'hensol-castle-distillery', 'Contract bottling, distilling, NPD', 'Welsh contract distillery offering distilling, bottling, and new product development services.', 'CO_PACKING', ARRAY['Contract Distilling', 'Contract Bottling', 'NPD', 'Recipe Development'], 'Wales', 'United Kingdom', ARRAY['United Kingdom'], NULL, NULL, NULL, NULL, NULL, true, true, 'UNCLAIMED', 0, ARRAY[]::\"Certification\"[], ARRAY[]::TEXT[], NOW(), NOW()),

(generate_cuid(), 'Cooper Parry', 'cooper-parry', 'Accountancy services for drinks businesses', 'Award-winning accountancy firm with a dedicated drinks and hospitality team.', 'FINANCE', ARRAY['Audit', 'Tax Advisory', 'Corporate Finance', 'Business Advisory'], 'Birmingham', 'United Kingdom', ARRAY['United Kingdom'], NULL, NULL, NULL, NULL, NULL, true, true, 'UNCLAIMED', 0, ARRAY[]::\"Certification\"[], ARRAY[]::TEXT[], NOW(), NOW()),

(generate_cuid(), 'Avallen Solutions', 'avallen-solutions', 'Sustainability strategy and support', 'Sustainability consultancy helping drinks brands develop and implement environmental strategies, from carbon footprinting to B Corp certification.', 'SUSTAINABILITY', ARRAY['Sustainability Strategy', 'Carbon Footprinting', 'B Corp Support', 'ESG Reporting'], 'United Kingdom', 'United Kingdom', ARRAY['United Kingdom', 'Europe'], NULL, NULL, NULL, NULL, NULL, true, true, 'UNCLAIMED', 0, ARRAY['B_CORP']::\"Certification\"[], ARRAY[]::TEXT[], NOW(), NOW()),

(generate_cuid(), 'Bowimi', 'bowimi', 'CRM/sales platform for drinks brands', 'Sales and CRM platform designed specifically for drinks brands to manage trade relationships and orders.', 'SOFTWARE', ARRAY['CRM', 'Sales Management', 'Order Processing', 'Trade Relationships'], 'United Kingdom', 'United Kingdom', ARRAY['United Kingdom'], NULL, NULL, NULL, NULL, NULL, true, true, 'UNCLAIMED', 0, ARRAY[]::\"Certification\"[], ARRAY[]::TEXT[], NOW(), NOW()),

(generate_cuid(), 'Midday Studio', 'midday-studio', 'Award-winning design studio', 'Award-winning design studio creating distinctive brand identities and packaging for drinks brands.', 'DESIGN', ARRAY['Brand Identity', 'Packaging Design', 'Visual Identity', 'Creative Direction'], 'United Kingdom', 'United Kingdom', ARRAY['United Kingdom'], NULL, NULL, NULL, NULL, NULL, true, true, 'UNCLAIMED', 0, ARRAY[]::\"Certification\"[], ARRAY[]::TEXT[], NOW(), NOW()),

(generate_cuid(), 'Soho Drinks Ltd', 'soho-drinks', 'PR services for drinks and lifestyle', 'PR agency specializing in drinks and lifestyle brands, with strong media relationships.', 'PR', ARRAY['Public Relations', 'Media Relations', 'Event PR', 'Brand Launches'], 'London', 'United Kingdom', ARRAY['United Kingdom'], NULL, NULL, NULL, NULL, NULL, true, true, 'UNCLAIMED', 0, ARRAY[]::\"Certification\"[], ARRAY[]::TEXT[], NOW(), NOW()),

(generate_cuid(), 'Tortuga', 'tortuga', 'UK distribution and back-office logistics', 'Full-service distribution and logistics partner for drinks brands in the UK market.', 'DISTRIBUTION', ARRAY['UK Distribution', 'Logistics', 'Back-Office Support', 'Order Fulfillment'], 'United Kingdom', 'United Kingdom', ARRAY['United Kingdom'], NULL, NULL, NULL, NULL, NULL, true, true, 'UNCLAIMED', 0, ARRAY[]::\"Certification\"[], ARRAY[]::TEXT[], NOW(), NOW()),

(generate_cuid(), 'Greenbox Designs', 'greenbox-designs', 'Website development services', 'Web design and development agency creating beautiful, functional websites for drinks brands.', 'WEB_DEVELOPMENT', ARRAY['Website Design', 'Web Development', 'E-Commerce Sites', 'Digital Strategy'], 'United Kingdom', 'United Kingdom', ARRAY['United Kingdom'], NULL, NULL, NULL, NULL, NULL, true, true, 'UNCLAIMED', 0, ARRAY[]::\"Certification\"[], ARRAY[]::TEXT[], NOW(), NOW()),

(generate_cuid(), 'Frederick Wilkinson', 'frederick-wilkinson', 'Photography and videography', 'Professional photographer and videographer specializing in drinks and food content.', 'PHOTOGRAPHY', ARRAY['Photography', 'Videography', 'Product Shots', 'Lifestyle Content'], 'United Kingdom', 'United Kingdom', ARRAY['United Kingdom'], NULL, NULL, NULL, NULL, NULL, true, true, 'UNCLAIMED', 0, ARRAY[]::\"Certification\"[], ARRAY[]::TEXT[], NOW(), NOW());

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

-- Insert Events
INSERT INTO "Event" ("id", "title", "slug", "description", "type", "status", "startDate", "endDate", "isVirtual", "venueName", "address", "city", "country", "capacity", "isFree", "price", "showAttendees", "isFeatured", "createdAt", "updatedAt") VALUES
(generate_cuid(), 'Kindred Summer Party 2026', 'kindred-summer-party-2026', 'Join us for the biggest Kindred gathering of the year! Network with fellow drinks makers, meet suppliers, and celebrate the independent drinks community.', 'PARTY', 'PUBLISHED', '2026-07-15 18:00:00', '2026-07-15 23:00:00', false, 'The Brewery', '52 Chiswell Street', 'London', 'United Kingdom', 300, false, 45, true, true, NOW(), NOW()),

(generate_cuid(), 'Imbibe Live 2026', 'imbibe-live-2026', 'The UK''s leading on-trade drinks event returns to Olympia London.', 'TRADE_SHOW', 'PUBLISHED', '2026-07-01 10:00:00', '2026-07-02 17:00:00', false, 'Olympia London', 'Hammersmith Road', 'London', 'United Kingdom', 5000, false, 25, true, true, NOW(), NOW()),

(generate_cuid(), 'Kindred Manchester Meetup', 'kindred-manchester-meetup-mar-2026', 'Informal networking drinks for Kindred members in the North.', 'MEETUP', 'PUBLISHED', '2026-03-20 18:30:00', '2026-03-20 21:00:00', false, 'The Alchemist', '1 New York Street', 'Manchester', 'United Kingdom', 50, true, NULL, true, false, NOW(), NOW()),

(generate_cuid(), 'Export Masterclass: Breaking into Europe', 'export-masterclass-europe-2026', 'Learn the ins and outs of exporting your drinks to European markets.', 'WEBINAR', 'PUBLISHED', '2026-02-15 14:00:00', '2026-02-15 15:30:00', true, NULL, NULL, 'Online', 'United Kingdom', 100, true, NULL, true, false, NOW(), NOW()),

(generate_cuid(), 'Sustainable Packaging Workshop', 'sustainable-packaging-workshop-2026', 'Hands-on workshop exploring sustainable packaging options for drinks brands.', 'WORKSHOP', 'PUBLISHED', '2026-04-10 10:00:00', '2026-04-10 16:00:00', false, 'Business Design Centre', '52 Upper Street', 'London', 'United Kingdom', 60, false, 75, true, true, NOW(), NOW());

-- Insert Sample Offer
INSERT INTO "Offer" ("id", "supplierId", "title", "description", "type", "discountValue", "code", "termsConditions", "status", "startDate", "endDate", "forBrandsOnly", "minOrderValue", "viewCount", "claimCount", "createdAt", "updatedAt")
SELECT generate_cuid(), s.id, '10% Off First Order for Kindred Members', 'Exclusive discount for Kindred Collective members on your first order of premium glass bottles. Valid for orders over 5,000 units.', 'PERCENTAGE_DISCOUNT', 10, 'KINDRED10', 'Valid for new customers only. Minimum order of 5,000 units. Cannot be combined with other offers. Valid until December 31, 2026.', 'ACTIVE', '2026-01-01', '2026-12-31', true, 5000, 0, 0, NOW(), NOW()
FROM "Supplier" s WHERE s.slug = 'saverglass';

-- Clean up helper function
DROP FUNCTION generate_cuid();
