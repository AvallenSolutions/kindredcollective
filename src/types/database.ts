import type {
  User,
  Brand,
  Supplier,
  Member,
  Event,
  Offer,
  UserRole,
  DrinkCategory,
  SupplierCategory,
  Certification,
  EventType,
  OfferType,
} from '@prisma/client'

// Re-export Prisma types
export type {
  User,
  Brand,
  Supplier,
  Member,
  Event,
  Offer,
  UserRole,
  DrinkCategory,
  SupplierCategory,
  Certification,
  EventType,
  OfferType,
}

// Extended types with relations
export type BrandWithImages = Brand & {
  images: { id: string; url: string; alt: string | null; order: number }[]
}

export type SupplierWithOffers = Supplier & {
  offers: Offer[]
  portfolioImages: { id: string; url: string; alt: string | null; order: number }[]
}

export type EventWithRsvps = Event & {
  rsvps: { userId: string; status: string }[]
  _count: { rsvps: number }
}

export type UserWithProfile = User & {
  member: Member | null
  brand: Brand | null
  supplier: Supplier | null
}

// Display labels for enums
export const DRINK_CATEGORY_LABELS: Record<DrinkCategory, string> = {
  SPIRITS: 'Spirits',
  BEER: 'Beer',
  WINE: 'Wine',
  RTD: 'Ready to Drink',
  NO_LO: 'No/Lo Alcohol',
  CIDER: 'Cider',
  OTHER: 'Other',
}

export const SUPPLIER_CATEGORY_LABELS: Record<SupplierCategory, string> = {
  PACKAGING: 'Packaging',
  INGREDIENTS: 'Ingredients',
  LOGISTICS: 'Logistics',
  CO_PACKING: 'Co-Packing',
  DESIGN: 'Design & Creative',
  MARKETING: 'Marketing',
  EQUIPMENT: 'Equipment',
  CONSULTING: 'Consulting',
  LEGAL: 'Legal',
  FINANCE: 'Finance',
  DISTRIBUTION: 'Distribution',
  RECRUITMENT: 'Recruitment',
  SOFTWARE: 'Software & Tech',
  SUSTAINABILITY: 'Sustainability',
  PR: 'PR & Communications',
  PHOTOGRAPHY: 'Photography & Video',
  WEB_DEVELOPMENT: 'Web Development',
  OTHER: 'Other',
}

export const CERTIFICATION_LABELS: Record<Certification, string> = {
  ORGANIC: 'Organic',
  B_CORP: 'B-Corp',
  FAIRTRADE: 'Fairtrade',
  VEGAN: 'Vegan',
  GLUTEN_FREE: 'Gluten Free',
  PLASTIC_FREE: 'Plastic Free',
  CARBON_NEUTRAL: 'Carbon Neutral',
  OTHER: 'Other',
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  TRADE_SHOW: 'Trade Show',
  MEETUP: 'Meetup',
  WORKSHOP: 'Workshop',
  WEBINAR: 'Webinar',
  NETWORKING: 'Networking',
  LAUNCH: 'Product Launch',
  PARTY: 'Party',
  OTHER: 'Other',
}

export const OFFER_TYPE_LABELS: Record<OfferType, string> = {
  PERCENTAGE_DISCOUNT: 'Percentage Off',
  FIXED_DISCOUNT: 'Fixed Amount Off',
  FREE_TRIAL: 'Free Trial',
  BUNDLE: 'Bundle Deal',
  OTHER: 'Other',
}
