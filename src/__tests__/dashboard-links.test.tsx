import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// ── Mocks ────────────────────────────────────────────────────────────
vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href} data-testid="link">
      {children}
    </a>
  ),
}))

vi.mock('@/components/ui', () => ({
  Badge: ({ children, ...props }: { children: React.ReactNode }) => <span {...props}>{children}</span>,
  Button: ({ children, ...props }: { children: React.ReactNode }) => <button {...props}>{children}</button>,
  Card: ({ children, ...props }: { children: React.ReactNode }) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: { children: React.ReactNode }) => <div {...props}>{children}</div>,
}))

vi.mock('@/components/suppliers', () => ({
  SupplierCard: () => <div data-testid="supplier-card" />,
}))

vi.mock('lucide-react', async () => {
  const Icon = ({ children }: { children?: React.ReactNode }) => <svg>{children}</svg>
  return {
    User: Icon,
    Building2: Icon,
    Wine: Icon,
    Heart: Icon,
    Calendar: Icon,
    Tag: Icon,
    ArrowRight: Icon,
    Settings: Icon,
    Plus: Icon,
    Shield: Icon,
    Store: Icon,
    Pencil: Icon,
    Zap: Icon,
  }
})

vi.mock('@prisma/client', () => ({
  SupplierCategory: {},
}))

// ── Import ───────────────────────────────────────────────────────────
import { DashboardContent } from '@/app/(platform)/dashboard/dashboard-content'

const baseProps = {
  user: {
    id: 'u1',
    email: 'test@test.com',
    role: 'MEMBER',
    firstName: 'Test',
    lastName: 'User',
    isAdmin: false,
  },
  stats: { savedSuppliers: 0, eventsAttending: 0, offersClaimed: 0 },
  savedSuppliers: [],
  upcomingEvents: [],
  recentOfferClaims: [],
  brands: [],
  suppliers: [],
  myRfps: [],
  opportunityRfps: [],
}

// ── Tests ────────────────────────────────────────────────────────────

describe('Dashboard links to onboarding', () => {
  it('renders "Add Brand" and "Add Supplier" links to /onboarding?step=company when no organisations', () => {
    render(
      <DashboardContent
        {...baseProps}
        organisations={[]}
      />
    )

    // Find links with "Add Brand" and "Add Supplier"
    const addBrandBtn = screen.getByText('Add Brand')
    const addSupplierBtn = screen.getByText('Add Supplier')

    // Check their parent <a> links point to the right URL
    const brandLink = addBrandBtn.closest('a')
    const supplierLink = addSupplierBtn.closest('a')

    expect(brandLink?.getAttribute('href')).toBe('/onboarding?step=company')
    expect(supplierLink?.getAttribute('href')).toBe('/onboarding?step=company')
  })

  it('renders "Add Organisation" link to /onboarding?step=company when user has organisations', () => {
    render(
      <DashboardContent
        {...baseProps}
        organisations={[
          {
            organisationId: 'org-1',
            organisationName: 'Test Org',
            organisationType: 'BRAND',
            memberRole: 'OWNER',
            brandId: 'b1',
            brandName: 'My Brand',
          },
        ]}
      />
    )

    const addOrgBtn = screen.getByText('Add Organisation')
    const link = addOrgBtn.closest('a')

    expect(link?.getAttribute('href')).toBe('/onboarding?step=company')
  })
})
