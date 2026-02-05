import { NextRequest, NextResponse } from 'next/server'
import { uploadImage, validateFile, StorageBucket } from '@/lib/storage/upload'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file
    const validation = validateFile(file)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Get bucket and folder from query params
    const { searchParams } = new URL(req.url)
    const bucket = searchParams.get('bucket') as StorageBucket || 'supplier-images'
    const folder = searchParams.get('folder') || 'uploads'

    // Upload to storage
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
