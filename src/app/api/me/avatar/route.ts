import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { uploadImage, deleteImage, validateFile, extractPathFromUrl } from '@/lib/storage/upload'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api/response'

// POST /api/me/avatar - Upload user avatar
export async function POST(request: NextRequest) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse()
  }

  const supabase = await createClient()

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return errorResponse('No file provided')
    }

    // Validate file
    const validation = validateFile(file)
    if (!validation.valid) {
      return errorResponse(validation.error || 'Invalid file')
    }

    // Get current member to check for existing avatar
    const { data: member } = await supabase
      .from('Member')
      .select('avatarUrl')
      .eq('userId', user.id)
      .single()

    // Delete old avatar if exists
    if (member?.avatarUrl) {
      const oldPath = extractPathFromUrl(member.avatarUrl, 'avatars')
      if (oldPath) {
        try {
          await deleteImage('avatars', oldPath)
        } catch (e) {
          console.error('Failed to delete old avatar:', e)
        }
      }
    }

    // Upload new avatar
    const { url } = await uploadImage(file, 'avatars', user.id)

    // Update member record
    const { data: updatedMember, error: updateError } = await supabase
      .from('Member')
      .update({
        avatarUrl: url,
        updatedAt: new Date().toISOString(),
      })
      .eq('userId', user.id)
      .select('avatarUrl')
      .single()

    if (updateError) {
      console.error('Error updating member:', updateError)
      return serverErrorResponse('Failed to update avatar')
    }

    return successResponse({
      avatarUrl: updatedMember.avatarUrl,
      message: 'Avatar uploaded successfully',
    })
  } catch (error) {
    console.error('Error uploading avatar:', error)
    return serverErrorResponse('Failed to upload avatar')
  }
}

// DELETE /api/me/avatar - Remove user avatar
export async function DELETE() {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse()
  }

  const supabase = await createClient()

  try {
    // Get current member
    const { data: member } = await supabase
      .from('Member')
      .select('avatarUrl')
      .eq('userId', user.id)
      .single()

    if (!member?.avatarUrl) {
      return errorResponse('No avatar to delete')
    }

    // Delete from storage
    const path = extractPathFromUrl(member.avatarUrl, 'avatars')
    if (path) {
      try {
        await deleteImage('avatars', path)
      } catch (e) {
        console.error('Failed to delete avatar from storage:', e)
      }
    }

    // Update member record
    const { error: updateError } = await supabase
      .from('Member')
      .update({
        avatarUrl: null,
        updatedAt: new Date().toISOString(),
      })
      .eq('userId', user.id)

    if (updateError) {
      console.error('Error updating member:', updateError)
      return serverErrorResponse('Failed to remove avatar')
    }

    return successResponse({
      deleted: true,
      message: 'Avatar removed successfully',
    })
  } catch (error) {
    console.error('Error deleting avatar:', error)
    return serverErrorResponse('Failed to delete avatar')
  }
}
