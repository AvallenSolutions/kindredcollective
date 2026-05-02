import { createAdminClient } from '@/lib/supabase/admin'

export type StorageBucket = 'avatars' | 'brand-images' | 'supplier-images' | 'event-images' | 'forum-images' | 'resource-files'

export interface UploadResult {
  url: string
  path: string
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

const ALLOWED_DOC_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'text/markdown',
]
const MAX_DOC_FILE_SIZE = 25 * 1024 * 1024 // 25MB

export const ALLOWED_RESOURCE_MIME_TYPES = ALLOWED_DOC_MIME_TYPES
export const MAX_RESOURCE_FILE_SIZE = MAX_DOC_FILE_SIZE
export const RESOURCE_FILE_HINT = 'PDF, Word, Excel, PowerPoint, CSV, TXT or Markdown — max 25MB'

/**
 * Recommended image dimensions and sizes for each upload context.
 * Used to display guidance text next to upload controls.
 */
export const IMAGE_GUIDELINES = {
  avatar: { width: 400, height: 400, maxMB: 5, hint: 'Recommended: 400x400px · JPG, PNG or WebP · max 5MB' },
  petPhoto: { width: 400, height: 400, maxMB: 5, hint: 'Recommended: 400x400px · JPG, PNG or WebP · max 5MB' },
  logo: { width: 400, height: 400, maxMB: 5, hint: 'Recommended: 400x400px · JPG, PNG or WebP · max 5MB' },
  hero: { width: 1200, height: 630, maxMB: 5, hint: 'Recommended: 1200x630px · JPG, PNG or WebP · max 5MB' },
  gallery: { width: 800, height: 800, maxMB: 5, hint: 'Recommended: 800x800px · JPG, PNG or WebP · max 5MB' },
  event: { width: 1200, height: 630, maxMB: 5, hint: 'Recommended: 1200x630px · JPG, PNG or WebP · max 5MB' },
  forum: { width: 1200, height: 800, maxMB: 5, hint: 'Recommended: max 1200x800px · JPG, PNG, WebP or GIF · max 5MB' },
} as const

/**
 * Validate file type and size
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
    }
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    }
  }

  return { valid: true }
}

/**
 * Validate a document file (PDF, Office docs, plain text)
 */
export function validateDocument(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_DOC_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Unsupported file type. Allowed: PDF, Word, Excel, PowerPoint, CSV, TXT, Markdown',
    }
  }

  if (file.size > MAX_DOC_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${MAX_DOC_FILE_SIZE / 1024 / 1024}MB`,
    }
  }

  return { valid: true }
}

/**
 * Upload a document to the resource-files bucket
 */
export async function uploadDocument(
  file: File,
  folder: string
): Promise<UploadResult> {
  const supabase = createAdminClient()

  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'bin'
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  const { data, error } = await supabase.storage
    .from('resource-files')
    .upload(fileName, buffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }

  const { data: { publicUrl } } = supabase.storage
    .from('resource-files')
    .getPublicUrl(data.path)

  return {
    url: publicUrl,
    path: data.path,
  }
}

/**
 * Upload an image to Supabase Storage
 */
export async function uploadImage(
  file: File,
  bucket: StorageBucket,
  folder: string
): Promise<UploadResult> {
  const supabase = createAdminClient()

  // Generate unique filename
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

  // Convert File to ArrayBuffer for upload
  const arrayBuffer = await file.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, buffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path)

  return {
    url: publicUrl,
    path: data.path,
  }
}

/**
 * Delete an image from Supabase Storage
 */
export async function deleteImage(
  bucket: StorageBucket,
  path: string
): Promise<void> {
  const supabase = createAdminClient()

  const { error } = await supabase.storage
    .from(bucket)
    .remove([path])

  if (error) {
    throw new Error(`Delete failed: ${error.message}`)
  }
}

/**
 * Extract path from Supabase Storage URL
 */
export function extractPathFromUrl(url: string, bucket: StorageBucket): string | null {
  try {
    const urlObj = new URL(url)
    const pathMatch = urlObj.pathname.match(new RegExp(`/storage/v1/object/public/${bucket}/(.+)`))
    return pathMatch ? pathMatch[1] : null
  } catch {
    return null
  }
}
