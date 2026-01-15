-- Update Supplier Logos
-- Run this in Supabase SQL Editor to add logo URLs to suppliers

UPDATE "Supplier" SET "logoUrl" = 'https://kindredcollective.co.uk/cdn/shop/files/SaverGlass.png' WHERE "slug" = 'saverglass';

UPDATE "Supplier" SET "logoUrl" = 'https://kindredcollective.co.uk/cdn/shop/files/Picture2.png' WHERE "slug" = 'london-city-bond-ltd';

UPDATE "Supplier" SET "logoUrl" = 'https://kindredcollective.co.uk/cdn/shop/files/OkjqV1ve.png' WHERE "slug" = 'aitch-creates';

UPDATE "Supplier" SET "logoUrl" = 'https://kindredcollective.co.uk/cdn/shop/files/GracefulMonkey.jpg' WHERE "slug" = 'graceful-monkey';

UPDATE "Supplier" SET "logoUrl" = 'https://kindredcollective.co.uk/cdn/shop/files/BuddyCreative.jpg' WHERE "slug" = 'buddy-creative';

UPDATE "Supplier" SET "logoUrl" = 'https://kindredcollective.co.uk/cdn/shop/files/BienVenue.png' WHERE "slug" = 'bien-venue';

UPDATE "Supplier" SET "logoUrl" = 'https://kindredcollective.co.uk/cdn/shop/files/BlackBridgeDistillery.png' WHERE "slug" = 'am-distilling';

UPDATE "Supplier" SET "logoUrl" = 'https://kindredcollective.co.uk/cdn/shop/files/BBComms.png' WHERE "slug" = 'bb-comms';

UPDATE "Supplier" SET "logoUrl" = 'https://kindredcollective.co.uk/cdn/shop/files/Picture14.png' WHERE "slug" = 'label-apeel';

UPDATE "Supplier" SET "logoUrl" = 'https://kindredcollective.co.uk/cdn/shop/files/Picture16.png' WHERE "slug" = 'scale-drinks';

UPDATE "Supplier" SET "logoUrl" = 'https://kindredcollective.co.uk/cdn/shop/files/Picture3_5ed61f04-3cfa-41cc-a016-a1f21d4857e2.png' WHERE "slug" = 'addition';

UPDATE "Supplier" SET "logoUrl" = 'https://kindredcollective.co.uk/cdn/shop/files/Picture7.png' WHERE "slug" = 'custom-spirit-co';

UPDATE "Supplier" SET "logoUrl" = 'https://kindredcollective.co.uk/cdn/shop/files/brunierben_logo.png' WHERE "slug" = 'berlin-packaging';

UPDATE "Supplier" SET "logoUrl" = 'https://kindredcollective.co.uk/cdn/shop/files/verallia.png' WHERE "slug" = 'verallia';

UPDATE "Supplier" SET "logoUrl" = 'https://kindredcollective.co.uk/cdn/shop/files/HensolCastle.png' WHERE "slug" = 'hensol-castle-distillery';

UPDATE "Supplier" SET "logoUrl" = 'https://kindredcollective.co.uk/cdn/shop/files/download_c9b3a44c-c405-4c79-8f42-5c3de17b0b01.png' WHERE "slug" = 'cooper-parry';

UPDATE "Supplier" SET "logoUrl" = 'https://kindredcollective.co.uk/cdn/shop/files/SohoDrinks.png' WHERE "slug" = 'soho-drinks';

UPDATE "Supplier" SET "logoUrl" = 'https://kindredcollective.co.uk/cdn/shop/files/220b10b9-8c41-430f-843b-30da6f01fd93_b78dffd6-412e-4f58-a8db-e063b92e65a8.png' WHERE "slug" = 'tortuga';

UPDATE "Supplier" SET "logoUrl" = 'https://kindredcollective.co.uk/cdn/shop/files/logogreenbox_002.png' WHERE "slug" = 'greenbox-designs';

-- Verify updates
SELECT "companyName", "slug", "logoUrl" FROM "Supplier" ORDER BY "companyName";
