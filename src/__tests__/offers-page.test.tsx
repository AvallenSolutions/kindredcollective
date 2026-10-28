import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

vi.mock('@/components/offers', () => ({
  OfferCard: ({ offer }: { offer: { title: string; ownerName: string; ownerHref?: string } }) => (
    <div data-testid="offer-card" data-href={offer.ownerHref}>
      {offer.title} from {offer.ownerName}
    </div>
  ),
}))

import OffersPage from '@/app/(platform)/offers/page'

const baseOffer = {
  title: 'Launch deal',
  description: null,
  type: 'PERCENTAGE_DISCOUNT',
  discountValue: 10,
  code: null,
  endDate: null,
  forBrandsOnly: false,
}

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            data: {
              offers: [
                {
                  ...baseOffer,
                  id: 'o1',
                  supplier: { id: 's1', companyName: 'Acme Glass', slug: 'acme-glass', logoUrl: null, category: 'PACKAGING', isVerified: true },
                  brand: null,
                },
                {
                  ...baseOffer,
                  id: 'o2',
                  supplier: null,
                  brand: { id: 'b1', name: 'Test Gin', slug: 'test-gin', logoUrl: null },
                },
              ],
            },
          }),
      })
    )
  )
})

describe('Offers page', () => {
  it('sends the Create an Offer button to the offers management page', async () => {
    render(<OffersPage />)

    const button = await screen.findByRole('button', { name: 'Create an Offer' })

    expect(button.closest('a')?.getAttribute('href')).toBe('/settings/offers')
  })

  it('shows supplier and brand offers with the right owner link', async () => {
    render(<OffersPage />)

    await waitFor(() => expect(screen.getAllByTestId('offer-card')).toHaveLength(2))
    const [supplierCard, brandCard] = screen.getAllByTestId('offer-card')

    expect(supplierCard.textContent).toContain('Acme Glass')
    expect(supplierCard.getAttribute('data-href')).toBe('/explore/acme-glass')
    expect(brandCard.textContent).toContain('Test Gin')
    expect(brandCard.getAttribute('data-href')).toBe('/community/brands/test-gin')
  })
})
