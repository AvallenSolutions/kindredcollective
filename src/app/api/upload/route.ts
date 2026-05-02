import { NextRequest, NextResponse } from 'next/server'
import {
  uploadImage,
  uploadDocument,
  validateFile,
  validateDocument,
  StorageBucket,
} from '@/lib/storage/upload'
import { requireAuth } from '@/lib/auth/session'

export async function POST(req: NextRequest) {
  try {
    await requireAuth()
  } catch {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Get bucket and folder from query params
    const { searchParams } = new URL(req.url)
    const bucket = searchParams.get('bucket') as StorageBucket || 'supplier-images'
    const folder = searchParams.get('folder') || 'uploads'

    if (bucket === 'resource-files') {
      const validation = validateDocument(file)
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 })
      }

      const result = await uploadDocument(file, folder)
      return NextResponse.json({
        success: true,
        url: result.url,
        path: result.path,
        name: file.name,
        size: file.size,
        mime: file.type,
      })
    }

    const validation = validateFile(file)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const result = await uploadImage(file, bucket, folder)

    return NextResponse.json({
      success: true,
      url: result.url,
      path: result.path,
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    )
  }
}
