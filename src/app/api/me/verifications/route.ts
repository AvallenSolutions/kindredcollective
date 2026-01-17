import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { getSession } from '@/lib/auth/session'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/response'

// GET /api/me/verifications - List user's work relationships/verifications
export async function GET() {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse()
  }

  const session = await getSession()
  const supabase = await createClient()

  let relationships: unknown[] = []

  if (session.isBrand) {
    // Get brand's work relationships
    const { data: brand } = await supabase
      .from('Brand')
      .select('id')
      .eq('userId', user.id)
      .single()

    if (brand) {
      const { data } = await supabase
        .from('WorkRelationship')
        .select(`
          id,
          brandVerified,
          supplierVerified,
          projectDate,
          projectDescription,
          createdAt,
          updatedAt,
          supplier:Supplier(id, companyName, slug, logoUrl, category, isVerified)
        `)
        .eq('brandId', brand.id)
        .order('createdAt', { ascending: false })

      relationships = (data || []).map(r => ({
        ...r,
        myVerification: r.brandVerified,
        theirVerification: r.supplierVerified,
        isFullyVerified: r.brandVerified && r.supplierVerified,
        partner: r.supplier,
        partnerType: 'supplier',
      }))
    }
  } else if (session.isSupplier) {
    // Get supplier's work relationships
    const { data: supplier } = await supabase
      .from('Supplier')
      .select('id')
      .eq('userId', user.id)
      .single()

    if (supplier) {
      const { data } = await supabase
        .from('WorkRelationship')
        .select(`
          id,
          brandVerified,
          supplierVerified,
          projectDate,
          projectDescription,
          createdAt,
          updatedAt,
          brand:Brand(id, name, slug, logoUrl, category, isVerified)
        `)
        .eq('supplierId', supplier.id)
        .order('createdAt', { ascending: false })

      relationships = (data || []).map(r => ({
        ...r,
        myVerification: r.supplierVerified,
        theirVerification: r.brandVerified,
        isFullyVerified: r.brandVerified && r.supplierVerified,
        partner: r.brand,
        partnerType: 'brand',
      }))
    }
  }

  const stats = {
    total: relationships.length,
    fullyVerified: relationships.filter((r: { isFullyVerified: boolean }) => r.isFullyVerified).length,
    pendingMyVerification: relationships.filter((r: { myVerification: boolean }) => !r.myVerification).length,
    pendingTheirVerification: relationships.filter((r: { myVerification: boolean; theirVerification: boolean }) => r.myVerification && !r.theirVerification).length,
  }

  return successResponse({
    relationships,
    stats,
  })
}

// POST /api/me/verifications - Request a verification (create work relationship)
export async function POST(request: NextRequest) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse()
  }

  const session = await getSession()
  const supabase = await createClient()
  const body = await request.json()

  const { partnerId, projectDate, projectDescription } = body

  if (!partnerId) {
    return errorResponse('Partner ID is required')
  }

  let brandId: string | null = null
  let supplierId: string | null = null
  let myVerification = false

  if (session.isBrand) {
    // Brand is requesting verification with a supplier
    const { data: brand } = await supabase
      .from('Brand')
      .select('id')
      .eq('userId', user.id)
      .single()

    if (!brand) {
      return notFoundResponse('Brand profile not found')
    }

    // Verify supplier exists
    const { data: supplier } = await supabase
      .from('Supplier')
      .select('id, isPublic')
      .eq('id', partnerId)
      .single()

    if (!supplier) {
      return notFoundResponse('Supplier not found')
    }

    brandId = brand.id
    supplierId = partnerId
    myVerification = true // Brand is verifying they worked with this supplier
  } else if (session.isSupplier) {
    // Supplier is requesting verification with a brand
    const { data: supplier } = await supabase
      .from('Supplier')
      .select('id')
      .eq('userId', user.id)
      .single()

    if (!supplier) {
      return notFoundResponse('Supplier profile not found')
    }

    // Verify brand exists
    const { data: brand } = await supabase
      .from('Brand')
      .select('id, isPublic')
      .eq('id', partnerId)
      .single()

    if (!brand) {
      return notFoundResponse('Brand not found')
    }

    brandId = partnerId
    supplierId = supplier.id
    myVerification = true // Supplier is verifying they worked with this brand
  } else {
    return errorResponse('Only brand or supplier users can create verifications', 403)
  }

  // Check if relationship already exists
  const { data: existing } = await supabase
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

    if (session.isBrand) {
      updates.brandVerified = true
    } else {
      updates.supplierVerified = true
    }

    if (projectDate) updates.projectDate = projectDate
    if (projectDescription) updates.projectDescription = projectDescription

    const { data: relationship, error } = await supabase
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
  const { data: relationship, error } = await supabase
    .from('WorkRelationship')
    .insert({
      brandId,
      supplierId,
      brandVerified: session.isBrand,
      supplierVerified: session.isSupplier,
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
