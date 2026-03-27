-- Update existing events with relevant image URLs
-- Run in Supabase SQL Editor to add images to all seeded events

UPDATE "Event" SET "imageUrl" = 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=1200&h=630&fit=crop&q=80'
WHERE "slug" = 'whisky-live-london-2026' AND "imageUrl" IS NULL;

UPDATE "Event" SET "imageUrl" = 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200&h=630&fit=crop&q=80'
WHERE "slug" = 'london-wine-fair-2026' AND "imageUrl" IS NULL;

UPDATE "Event" SET "imageUrl" = 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1200&h=630&fit=crop&q=80'
WHERE "slug" = 'bcb-brooklyn-2026' AND "imageUrl" IS NULL;

UPDATE "Event" SET "imageUrl" = 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200&h=630&fit=crop&q=80'
WHERE "slug" = 'trade-drinks-expo-2026' AND "imageUrl" IS NULL;

UPDATE "Event" SET "imageUrl" = 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=1200&h=630&fit=crop&q=80'
WHERE "slug" = 'whisky-exchange-whisky-show-2026' AND "imageUrl" IS NULL;

UPDATE "Event" SET "imageUrl" = 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=1200&h=630&fit=crop&q=80'
WHERE "slug" = 'bcb-london-2026' AND "imageUrl" IS NULL;

UPDATE "Event" SET "imageUrl" = 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=1200&h=630&fit=crop&q=80'
WHERE "slug" = 'bcb-berlin-2026' AND "imageUrl" IS NULL;

UPDATE "Event" SET "imageUrl" = 'https://images.unsplash.com/photo-1574096079513-d8259312b785?w=1200&h=630&fit=crop&q=80'
WHERE "slug" = 'athens-bar-show-2026' AND "imageUrl" IS NULL;

UPDATE "Event" SET "imageUrl" = 'https://images.unsplash.com/photo-1602081115068-ddce26ac18e1?w=1200&h=630&fit=crop&q=80'
WHERE "slug" = 'glasgows-whisky-festival-2026' AND "imageUrl" IS NULL;

UPDATE "Event" SET "imageUrl" = 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=1200&h=630&fit=crop&q=80'
WHERE "slug" = 'kindred-summer-party-2026' AND "imageUrl" IS NULL;

UPDATE "Event" SET "imageUrl" = 'https://images.unsplash.com/photo-1575444758702-4a6b9222c016?w=1200&h=630&fit=crop&q=80'
WHERE "slug" = 'kindred-manchester-meetup-feb-2026' AND "imageUrl" IS NULL;

UPDATE "Event" SET "imageUrl" = 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&h=630&fit=crop&q=80'
WHERE "slug" = 'export-masterclass-europe-2026' AND "imageUrl" IS NULL;

UPDATE "Event" SET "imageUrl" = 'https://images.unsplash.com/photo-1436076863939-06870fe779c2?w=1200&h=630&fit=crop&q=80'
WHERE "slug" = 'kindred-bristol-meetup-mar-2026' AND "imageUrl" IS NULL;

UPDATE "Event" SET "imageUrl" = 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=630&fit=crop&q=80'
WHERE "slug" = 'brand-launch-bootcamp-2026' AND "imageUrl" IS NULL;

UPDATE "Event" SET "imageUrl" = 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=1200&h=630&fit=crop&q=80'
WHERE "slug" = 'sustainable-spirits-summit-2026' AND "imageUrl" IS NULL;
