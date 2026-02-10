import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  requireAuth,
  getUserBrandViaOrg,
  getUserSupplierViaOrg,
  getUserBrands,
  getUserSuppliers,
} from '@/lib/auth/session'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/response'

// GET /api/me/verifications - List user's work relationships/verifications across all orgs
export async function GET() {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse()
  }

  const adminClient = createAdminClient()

  // Get all user's brands and suppliers
  const [userBrands, userSuppliers] = await Promise.all([
    getUserBrands(user.id),
    getUserSuppliers(user.id),
  ])

  let relationships: unknown[] = []

  // Fetch work relationships for all user's brands
  const brandIds = userBrands.map((b: any) => b.id)
  if (brandIds.length > 0) {
    const { data } = await adminClient
      .from('WorkRelationship')
      .select(`
        id,
        brandVerified,
        supplierVerified,
        projectDate,
        projectDescription,
        createdAt,
        updatedAt,
        brandId,
        supplier:Supplier(id, companyName, slug, logoUrl, category, isVerified)
      `)
      .in('brandId', brandIds)
      .order('createdAt', { ascending: false })

    const brandRelationships = (data || []).map(r => ({
      ...r,
      myVerification: r.brandVerified,
      theirVerification: r.supplierVerified,
      isFullyVerified: r.brandVerified && r.supplierVerified,
      partner: r.supplier,
      partnerType: 'supplier',
      myRole: 'brand',
    }))

    relationships = [...relationships, ...brandRelationships]
  }

  // Fetch work relationships for all user's suppliers
  const supplierIds = userSuppliers.map((s: any) => s.id)
  if (supplierIds.length > 0) {
    const { data } = await adminClient
      .from('WorkRelationship')
      .select(`
        id,
        brandVerified,
        supplierVerified,
        projectDate,
        projectDescription,
        createdAt,
        updatedAt,
        supplierId,
        brand:Brand(id, name, slug, logoUrl, category, isVerified)
      `)
      .in('supplierId', supplierIds)
      .order('createdAt', { ascending: false })

    const supplierRelationships = (data || []).map(r => ({
      ...r,
      myVerification: r.supplierVerified,
      theirVerification: r.brandVerified,
      isFullyVerified: r.brandVerified && r.supplierVerified,
      partner: r.brand,
      partnerType: 'brand',
      myRole: 'supplier',
    }))

    relationships = [...relationships, ...supplierRelationships]
  }

  const stats = {
    total: relationships.length,
    fullyVerified: relationships.filter((r: any) => r.isFullyVerified).length,
    pendingMyVerification: relationships.filter((r: any) => !r.myVerification).length,
    pendingTheirVerification: relationships.filter((r: any) => r.myVerification && !r.theirVerification).length,
  }

  return successResponse({
    relationships,
    stats,
  })
}

// POST /api/me/verifications?orgId=xxx&type=brand|supplier - Request a verification (create work relationship)
export async function POST(request: NextRequest) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse()
  }

  const orgId = request.nextUrl.searchParams.get('orgId')
  if (!orgId) {
    return errorResponse('orgId query parameter is required')
  }

  const type = request.nextUrl.searchParams.get('type')
  if (!type || (type !== 'brand' && type !== 'supplier')) {
    return errorResponse('type query parameter is required (brand or supplier)')
  }

  const adminClient = createAdminClient()
  const body = await request.json()

  const { partnerId, projectDate, projectDescription } = body

  if (!partnerId) {
    return errorResponse('Partner ID is required')
  }

  let brandId: string | null = null
  let supplierId: string | null = null
  let isBrandSide = false

  if (type === 'brand') {
    // User is acting as a brand, requesting verification with a supplier
    const brand = await getUserBrandViaOrg(user.id, orgId)
    if (!brand) {
      return notFoundResponse('Brand not found or access denied')
    }

    // Verify supplier exists
    const { data: supplier } = await adminClient
      .from('Supplier')
      .select('id, isPublic')
      .eq('id', partnerId)
      .single()

    if (!supplier) {
      return notFoundResponse('Supplier not found')
    }

    brandId = brand.id
    supplierId = partnerId
    isBrandSide = true
  } else {
    // User is acting as a supplier, requesting verification with a brand
    const supplier = await getUserSupplierViaOrg(user.id, orgId)
    if (!supplier) {
      return notFoundResponse('Supplier not found or access denied')
    }

    // Verify brand exists
    const { data: brand } = await adminClient
      .from('Brand')
      .select('id, isPublic')
      .eq('id', partnerId)
      .single()

    if (!brand) {
      return notFoundResponse('Brand not found')
    }

    brandId = partnerId
    supplierId = supplier.id
    isBrandSide = false
  }

  // Check if relationship already exists
  const { data: existing } = await adminClient
    .from('WorkRelationship')
    .select('id, brandVerified, supplierVerified')
    .eq('brandId', brandId)
    .eq('supplierId', supplierId)
    .single()

  if (existing) {
    // Update existing relationship
    const updates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    }

    if (isBrandSide) {
      updates.brandVerified = true
    } else {
      updates.supplierVerified = true
    }

    if (projectDate) updates.projectDate = projectDate
    if (projectDescription) updates.projectDescription = projectDescription

    const { data: relationship, error } = await adminClient
      .from('WorkRelationship')
      .update(updates)
      .eq('id', existing.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating relationship:', error)
      return serverErrorResponse('Failed to update verification')
    }

    return successResponse({
      relationship,
      isNew: false,
      message: 'Verification updated successfully',
    })
  }

  // Create new relationship
  const { data: relationship, error } = await adminClient
    .from('WorkRelationship')
    .insert({
      brandId,
      supplierId,
      brandVerified: isBrandSide,
      supplierVerified: !isBrandSide,
      projectDate: projectDate || null,
      projectDescription: projectDescription || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating relationship:', error)
    return serverErrorResponse('Failed to create verification')
  }

  return successResponse({
    relationship,
    isNew: true,
    message: 'Verification request created. The other party will need to confirm.',
  }, 201)
}
