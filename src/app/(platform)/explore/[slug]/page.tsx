import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  MapPin,
  Globe,
  Linkedin,
  Mail,
  Phone,
  CheckCircle,
  Package,
  Clock,
  ExternalLink,
} from 'lucide-react'
import { Badge, Button, Card, CardContent } from '@/components/ui'
import { createClient } from '@/lib/supabase/server'
import { SUPPLIER_CATEGORY_LABELS, CERTIFICATION_LABELS } from '@/types/database'
import type { SupplierCategory, Certification } from '@prisma/client'

// Force dynamic rendering to always fetch fresh data from Supabase
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface SupplierProfilePageProps {
  params: Promise<{ slug: string }>
}

const categoryColors: Record<SupplierCategory, string> = {
  PACKAGING: 'bg-cyan',
  INGREDIENTS: 'bg-lime',
  LOGISTICS: 'bg-blue-500',
  CO_PACKING: 'bg-coral',
  DESIGN: 'bg-purple-500',
  MARKETING: 'bg-pink-500',
  EQUIPMENT: 'bg-orange-500',
  CONSULTING: 'bg-teal-500',
  LEGAL: 'bg-gray-500',
  FINANCE: 'bg-green-500',
  DISTRIBUTION: 'bg-indigo-500',
  RECRUITMENT: 'bg-amber-500',
  SOFTWARE: 'bg-sky-500',
  SUSTAINABILITY: 'bg-emerald-500',
  PR: 'bg-rose-500',
  PHOTOGRAPHY: 'bg-violet-500',
  WEB_DEVELOPMENT: 'bg-fuchsia-500',
  OTHER: 'bg-gray-400',
}

async function getSupplierBySlug(slug: string) {
  try {
    const supabase = await createClient()

    const { data: supplier, error } = await supabase
      .from('Supplier')
      .select('*')
      .eq('slug', slug)
      .eq('isPublic', true)
      .single()

    if (error || !supplier) {
      console.error('Error fetching supplier:', error)
      return null
    }

    return supplier
  } catch (err) {
    console.error('Failed to fetch supplier:', err)
    return null
  }
}

export default async function SupplierProfilePage({ params }: SupplierProfilePageProps) {
  const { slug } = await params
  const supplier = await getSupplierBySlug(slug)

  if (!supplier) {
    notFound()
  }

  const categoryColor = categoryColors[supplier.category] || 'bg-gray-400'

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className={`${categoryColor} border-b-4 border-black`}>
        <div className="section-container py-8">
          {/* Back Link */}
          <Link
            href="/explore"
            className="inline-flex items-center text-sm font-bold mb-6 hover:underline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Suppliers
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            {/* Logo */}
            <div className="w-24 h-24 lg:w-32 lg:h-32 bg-white border-3 border-black flex items-center justify-center flex-shrink-0">
              <span className="font-display text-4xl lg:text-5xl font-bold">
                {supplier.companyName.charAt(0)}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <Badge variant="outline" className="bg-white">
                  {SUPPLIER_CATEGORY_LABELS[supplier.category]}
                </Badge>
                {supplier.isVerified && (
                  <Badge variant="blue" className="bg-blue-500 text-white border-blue-500">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
                {supplier.certifications?.map((cert) => (
                  <Badge key={cert} variant="lime">
                    {CERTIFICATION_LABELS[cert as Certification]}
                  </Badge>
                ))}
              </div>

              <h1 className="font-display text-3xl lg:text-4xl font-bold mb-2">
                {supplier.companyName}
              </h1>

              {supplier.tagline && (
                <p className="text-lg mb-4">{supplier.tagline}</p>
              )}

              {/* Location */}
              {supplier.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {supplier.location}, {supplier.country}
                  </span>
                </div>
              )}
            </div>

            {/* Contact CTA */}
            <div className="flex flex-col gap-3 lg:text-right">
              <Button size="lg">
                <Mail className="w-4 h-4 mr-2" />
                Contact Supplier
              </Button>
              {(supplier as any).websiteUrl && (
                <a
                  href={(supplier as any).websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center text-sm hover:underline"
                >
                  <Globe className="w-4 h-4 mr-1" />
                  Visit Website
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="section-container py-8 lg:py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            <Card>
              <CardContent className="p-6">
                <h2 className="font-display text-xl font-bold mb-4">About</h2>
                <p className="text-gray-700 leading-relaxed">
                  {supplier.description}
                </p>
              </CardContent>
            </Card>

            {/* Services */}
            <Card>
              <CardContent className="p-6">
                <h2 className="font-display text-xl font-bold mb-4">Services</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {supplier.services.map((service) => (
                    <div
                      key={service}
                      className="flex items-center gap-3 p-3 bg-gray-50 border-2 border-gray-200"
                    >
                      <CheckCircle className="w-5 h-5 text-cyan flex-shrink-0" />
                      <span className="font-medium">{service}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Service Regions */}
            {supplier.serviceRegions && supplier.serviceRegions.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="font-display text-xl font-bold mb-4">
                    Service Regions
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {supplier.serviceRegions.map((region) => (
                      <Badge key={region} variant="outline">
                        {region}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-display text-lg font-bold mb-4">
                  Quick Info
                </h3>
                <div className="space-y-4">
                  {/* MOQ */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-cyan/20 border-2 border-cyan flex items-center justify-center flex-shrink-0">
                      <Package className="w-5 h-5 text-cyan" />
                    </div>
                    <div>
                      <p className="font-display text-sm font-bold uppercase tracking-wide text-gray-500">
                        Min Order Qty
                      </p>
                      <p className="font-bold">
                        {supplier.moqMin
                          ? `${supplier.moqMin.toLocaleString()} units`
                          : 'No minimum'}
                      </p>
                    </div>
                  </div>

                  {/* Lead Time */}
                  {(supplier as any).leadTimeDays && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-lime/20 border-2 border-lime flex items-center justify-center flex-shrink-0">
                        <Clock className="w-5 h-5 text-lime-700" />
                      </div>
                      <div>
                        <p className="font-display text-sm font-bold uppercase tracking-wide text-gray-500">
                          Lead Time
                        </p>
                        <p className="font-bold">{(supplier as any).leadTimeDays} days</p>
                      </div>
                    </div>
                  )}

                  {/* Location */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-coral/20 border-2 border-coral flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-coral" />
                    </div>
                    <div>
                      <p className="font-display text-sm font-bold uppercase tracking-wide text-gray-500">
                        Location
                      </p>
                      <p className="font-bold">
                        {supplier.location}, {supplier.country}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Card */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-display text-lg font-bold mb-4">
                  Get in Touch
                </h3>
                <div className="space-y-3">
                  <Button className="w-full">
                    <Mail className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                  {(supplier as any).contactEmail && (
                    <a
                      href={`mailto:${(supplier as any).contactEmail}`}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-cyan"
                    >
                      <Mail className="w-4 h-4" />
                      {(supplier as any).contactEmail}
                    </a>
                  )}
                  {(supplier as any).contactPhone && (
                    <a
                      href={`tel:${(supplier as any).contactPhone}`}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-cyan"
                    >
                      <Phone className="w-4 h-4" />
                      {(supplier as any).contactPhone}
                    </a>
                  )}
                  {(supplier as any).linkedinUrl && (
                    <a
                      href={(supplier as any).linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-cyan"
                    >
                      <Linkedin className="w-4 h-4" />
                      LinkedIn Profile
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Certifications */}
            {supplier.certifications && supplier.certifications.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-display text-lg font-bold mb-4">
                    Certifications
                  </h3>
                  <div className="space-y-2">
                    {supplier.certifications.map((cert) => (
                      <div
                        key={cert}
                        className="flex items-center gap-2 p-2 bg-lime/10 border-2 border-lime"
                      >
                        <CheckCircle className="w-4 h-4 text-lime-700" />
                        <span className="text-sm font-medium">
                          {CERTIFICATION_LABELS[cert as Certification]}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* Similar Suppliers CTA */}
      <section className="bg-gray-100 border-t-3 border-black py-12">
        <div className="section-container text-center">
          <h2 className="font-display text-2xl font-bold mb-4">
            Looking for More Options?
          </h2>
          <p className="text-gray-600 mb-6">
            Explore other suppliers in {SUPPLIER_CATEGORY_LABELS[supplier.category]}
          </p>
          <Link href={`/explore?category=${supplier.category}`}>
            <Button variant="outline" size="lg">
              View Similar Suppliers
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}

