import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth/session'

// GET /api/onboarding/search-companies?q=search - Search all companies (brands + suppliers)
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''

    if (!query || query.length < 2) {
      return NextResponse.json({ success: true, companies: [] })
    }

    const adminSupabase = createAdminClient()

    // Search brands
    const { data: brands, error: brandsError } = await adminSupabase
      .from('Brand')
      .select('id, name, slug, category, description, logoUrl')
      .eq('isPublic', true)
      .ilike('name', `%${query}%`)
      .order('name', { ascending: true })
      .limit(10)

    if (brandsError) {
      console.error('Error searching brands:', brandsError)
    }

    // Search suppliers
    const { data: suppliers, error: suppliersError } = await adminSupabase
      .from('Supplier')
      .select('id, companyName, slug, category, description, logoUrl, claimStatus')
      .eq('isPublic', true)
      .ilike('companyName', `%${query}%`)
      .order('companyName', { ascending: true })
      .limit(10)

    if (suppliersError) {
      console.error('Error searching suppliers:', suppliersError)
    }

    // Collect all company IDs to check for existing organisations & owners
    const brandIds = (brands || []).map(b => b.id)
    const supplierIds = (suppliers || []).map(s => s.id)

    // Look up organisations for these companies
    const ownedCompanyIds = new Set<string>()

    if (brandIds.length > 0) {
      const { data: brandOrgs } = await adminSupabase
        .from('Organisation')
        .select('brandId, members:OrganisationMember(role)')
        .in('brandId', brandIds)

      for (const org of brandOrgs || []) {
        const members = org.members as Array<{ role: string }> | null
        if (members?.some(m => m.role === 'OWNER')) {
          ownedCompanyIds.add(org.brandId)
        }
      }
    }

    if (supplierIds.length > 0) {
      const { data: supplierOrgs } = await adminSupabase
        .from('Organisation')
        .select('supplierId, members:OrganisationMember(role)')
        .in('supplierId', supplierIds)

      for (const org of supplierOrgs || []) {
        const members = org.members as Array<{ role: string }> | null
        if (members?.some(m => m.role === 'OWNER')) {
          ownedCompanyIds.add(org.supplierId)
        }
      }
    }

    // Normalise into a unified result set
    const companies = [
      ...(brands || []).map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        category: b.category,
        description: b.description,
        logoUrl: b.logoUrl,
        type: 'BRAND' as const,
        hasOwner: ownedCompanyIds.has(b.id),
      })),
      ...(suppliers || []).map((s) => ({
        id: s.id,
        name: s.companyName,
        slug: s.slug,
        category: s.category,
        description: s.description,
        logoUrl: s.logoUrl,
        type: 'SUPPLIER' as const,
        hasOwner: ownedCompanyIds.has(s.id),
      })),
    ].sort((a, b) => a.name.localeCompare(b.name))

    return NextResponse.json({
      success: true,
      companies,
    })
  } catch (error) {
    console.error('Error in GET /api/onboarding/search-companies:', error)
    return NextResponse.json(
      { error: 'Unauthorized or invalid request' },
      { status: 401 }
    )
  }
}
