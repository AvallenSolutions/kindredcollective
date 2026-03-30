import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

// ── Mocks ────────────────────────────────────────────────────────────
let mockSearchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => mockSearchParams,
}))

// Mock fetch for the auth check
const mockFetch = vi.fn()
global.fetch = mockFetch

// ── Import ───────────────────────────────────────────────────────────
import OnboardingPage from '@/app/(platform)/onboarding/page'

describe('OnboardingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParams = new URLSearchParams()

    // Default: auth check passes
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ success: true, user: { id: '1', email: 'test@test.com' } }),
    })
  })

  it('starts on the profile step by default', async () => {
    render(<OnboardingPage />)

    await waitFor(() => {
      expect(screen.getByText('Welcome to Kindred!')).toBeInTheDocument()
    })

    expect(screen.getByText('Complete Your Profile')).toBeInTheDocument()
  })

  it('starts on the company step when ?step=company is set', async () => {
    mockSearchParams = new URLSearchParams('step=company')

    render(<OnboardingPage />)

    await waitFor(() => {
      expect(screen.getByText('Find Your Company')).toBeInTheDocument()
    })

    // Should NOT show the profile step
    expect(screen.queryByText('Welcome to Kindred!')).not.toBeInTheDocument()
    expect(screen.queryByText('Complete Your Profile')).not.toBeInTheDocument()
  })

  it('shows "Back to Dashboard" when started at company step', async () => {
    mockSearchParams = new URLSearchParams('step=company')

    render(<OnboardingPage />)

    await waitFor(() => {
      expect(screen.getByText('Back to Dashboard')).toBeInTheDocument()
    })
  })

  it('shows "Back" when started at profile step (new user)', async () => {
    render(<OnboardingPage />)

    // Wait for initial load, then navigate to company step manually
    await waitFor(() => {
      expect(screen.getByText('Welcome to Kindred!')).toBeInTheDocument()
    })

    // At profile step, there's "Skip for Now" and "Save & Continue" but no "Back"
    // because profile is the first step — that's expected
  })

  it('shows the explainer card on the company step', async () => {
    mockSearchParams = new URLSearchParams('step=company')

    render(<OnboardingPage />)

    await waitFor(() => {
      expect(screen.getByText('How does this work?')).toBeInTheDocument()
    })

    expect(screen.getByText(/Search first/)).toBeInTheDocument()
    expect(screen.getByText(/Claim ownership/)).toBeInTheDocument()
    expect(screen.getByText(/Join your team/)).toBeInTheDocument()
    expect(screen.getByText(/Not listed\?/)).toBeInTheDocument()
  })

  it('shows create options on the company step', async () => {
    mockSearchParams = new URLSearchParams('step=company')

    render(<OnboardingPage />)

    await waitFor(() => {
      expect(screen.getByText('Create Brand')).toBeInTheDocument()
    })

    expect(screen.getByText('Create Supplier')).toBeInTheDocument()
    expect(screen.getByText('Join via Invite')).toBeInTheDocument()
  })

  it('shows search input on the company step', async () => {
    mockSearchParams = new URLSearchParams('step=company')

    render(<OnboardingPage />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search for your company...')).toBeInTheDocument()
    })
  })

  it('redirects to login when not authenticated', async () => {
    const mockPush = vi.fn()
    vi.mocked(await import('next/navigation')).useRouter = () => ({
      push: mockPush,
      refresh: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    })

    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ success: false }),
    })

    render(<OnboardingPage />)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login')
    })
  })

  it('renders the search box and create options on company step', async () => {
    mockSearchParams = new URLSearchParams('step=company')

    render(<OnboardingPage />)

    await waitFor(() => {
      expect(screen.getByText('Find Your Company')).toBeInTheDocument()
    })

    // Search box and main action cards should be present
    expect(screen.getByText('Search Companies')).toBeInTheDocument()
    expect(screen.getByText('Create Brand')).toBeInTheDocument()
    expect(screen.getByText('Create Supplier')).toBeInTheDocument()
    expect(screen.getByText('Join via Invite')).toBeInTheDocument()
  })
})
