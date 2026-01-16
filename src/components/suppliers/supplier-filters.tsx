'use client'

import { useState } from 'react'
import { Search, X, SlidersHorizontal } from 'lucide-react'
import { Button, Input, Badge } from '@/components/ui'
import { cn } from '@/lib/utils'
import { SUPPLIER_CATEGORY_LABELS, CERTIFICATION_LABELS } from '@/types/database'
import type { SupplierCategory, Certification } from '@prisma/client'

interface SupplierFiltersProps {
  onFilterChange: (filters: FilterState) => void
  initialFilters?: FilterState
}

export interface FilterState {
  search: string
  categories: SupplierCategory[]
  certifications: Certification[]
  location: string
  hasNoMoq: boolean
}

const defaultFilters: FilterState = {
  search: '',
  categories: [],
  certifications: [],
  location: '',
  hasNoMoq: false,
}

const categories = Object.entries(SUPPLIER_CATEGORY_LABELS) as [SupplierCategory, string][]
const certifications = Object.entries(CERTIFICATION_LABELS) as [Certification, string][]

const locations = [
  'London',
  'Scotland',
  'Wales',
  'England',
  'Manchester',
  'Birmingham',
  'Yorkshire',
  'Midlands',
  'Ireland',
  'Europe',
]

export function SupplierFilters({ onFilterChange, initialFilters = defaultFilters }: SupplierFiltersProps) {
  const [filters, setFilters] = useState<FilterState>(initialFilters)
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  const updateFilters = (updates: Partial<FilterState>) => {
    const newFilters = { ...filters, ...updates }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const toggleCategory = (category: SupplierCategory) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category]
    updateFilters({ categories: newCategories })
  }

  const toggleCertification = (cert: Certification) => {
    const newCerts = filters.certifications.includes(cert)
      ? filters.certifications.filter((c) => c !== cert)
      : [...filters.certifications, cert]
    updateFilters({ certifications: newCerts })
  }

  const clearFilters = () => {
    setFilters(defaultFilters)
    onFilterChange(defaultFilters)
  }

  const activeFilterCount =
    filters.categories.length +
    filters.certifications.length +
    (filters.location ? 1 : 0) +
    (filters.hasNoMoq ? 1 : 0)

  const FilterContent = () => (
    <>
      {/* Categories */}
      <div className="mb-6">
        <h3 className="font-display text-sm font-bold uppercase tracking-wide mb-3">
          Category
        </h3>
        <div className="space-y-2">
          {categories.map(([value, label]) => (
            <button
              key={value}
              onClick={() => toggleCategory(value)}
              className={cn(
                'w-full text-left px-3 py-2 text-sm border-2 transition-colors',
                filters.categories.includes(value)
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-black border-gray-200 hover:border-black'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Location */}
      <div className="mb-6">
        <h3 className="font-display text-sm font-bold uppercase tracking-wide mb-3">
          Location
        </h3>
        <select
          value={filters.location}
          onChange={(e) => updateFilters({ location: e.target.value })}
          className="w-full px-3 py-2 text-sm border-2 border-gray-200 bg-white focus:border-black focus:outline-none"
        >
          <option value="">All Locations</option>
          {locations.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>
      </div>

      {/* Certifications */}
      <div className="mb-6">
        <h3 className="font-display text-sm font-bold uppercase tracking-wide mb-3">
          Certifications
        </h3>
        <div className="flex flex-wrap gap-2">
          {certifications.map(([value, label]) => (
            <button
              key={value}
              onClick={() => toggleCertification(value)}
              className={cn(
                'px-3 py-1 text-xs font-bold uppercase border-2 transition-colors',
                filters.certifications.includes(value)
                  ? 'bg-lime text-black border-black'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-black'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* No MOQ Filter */}
      <div className="mb-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.hasNoMoq}
            onChange={(e) => updateFilters({ hasNoMoq: e.target.checked })}
            className="w-5 h-5 border-2 border-black accent-cyan"
          />
          <span className="text-sm">No minimum order</span>
        </label>
      </div>

      {/* Clear Filters */}
      {activeFilterCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={clearFilters}
        >
          Clear All Filters ({activeFilterCount})
        </Button>
      )}
    </>
  )

  return (
    <>
      {/* Search Bar - Always Visible */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search suppliers..."
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="pl-10"
          />
          {filters.search && (
            <button
              onClick={() => updateFilters({ search: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-black" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Filter Toggle */}
      <div className="lg:hidden mb-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowMobileFilters(!showMobileFilters)}
        >
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="cyan" className="ml-2">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Mobile Filters Panel */}
      <div
        className={cn(
          'lg:hidden overflow-hidden transition-all duration-300',
          showMobileFilters ? 'max-h-[1000px] mb-6' : 'max-h-0'
        )}
      >
        <div className="p-4 border-3 border-black bg-white">
          <FilterContent />
        </div>
      </div>

      {/* Desktop Filters Sidebar */}
      <div className="hidden lg:block">
        <FilterContent />
      </div>
    </>
  )
}
