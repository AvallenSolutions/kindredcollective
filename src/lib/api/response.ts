import { NextResponse } from 'next/server'

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export function successResponse<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status })
}

export function errorResponse(error: string, status = 400): NextResponse<ApiResponse> {
  return NextResponse.json({ success: false, error }, { status })
}

export function unauthorizedResponse(message = 'Unauthorized'): NextResponse<ApiResponse> {
  return NextResponse.json({ success: false, error: message }, { status: 401 })
}

export function forbiddenResponse(message = 'Forbidden'): NextResponse<ApiResponse> {
  return NextResponse.json({ success: false, error: message }, { status: 403 })
}

export function notFoundResponse(message = 'Not found'): NextResponse<ApiResponse> {
  return NextResponse.json({ success: false, error: message }, { status: 404 })
}

export function serverErrorResponse(message = 'Internal server error'): NextResponse<ApiResponse> {
  return NextResponse.json({ success: false, error: message }, { status: 500 })
}

export function validationErrorResponse(errors: Record<string, string>): NextResponse<ApiResponse> {
  return NextResponse.json(
    { success: false, error: 'Validation failed', data: errors },
    { status: 422 }
  )
}
