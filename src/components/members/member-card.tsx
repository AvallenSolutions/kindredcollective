'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin, Linkedin, Mail, X, Calendar, PawPrint } from 'lucide-react'
import { Badge, Card, CardContent } from '@/components/ui'
import { getInitials, formatDate } from '@/lib/utils'

interface MemberCardProps {
  member: {
    id: string
    firstName: string
    lastName: string
    jobTitle: string | null
    company: string
    companyType: 'BRAND' | 'SUPPLIER'
    companyTypes?: ('BRAND' | 'SUPPLIER')[]
    companies?: Array<{ name: string; type: 'BRAND' | 'SUPPLIER' }>
    bio: string | null
    location: string | null
    avatarUrl?: string | null
    linkedinUrl?: string | null
    email?: string | null
    pet?: { petName: string; petType: string | null; petPhotoUrl: string | null } | null
    rsvpEvents?: Array<{ title: string; slug: string; startDate: string }>
  }
}

export function MemberCard({ member }: MemberCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const initials = getInitials(`${member.firstName} ${member.lastName}`)
  const fullName = `${member.firstName} ${member.lastName}`
  const types = member.companyTypes ?? [member.companyType]
  const companies = member.companies ?? [{ name: member.company, type: member.companyType }]
  const upcomingEvents = (member.rsvpEvents ?? [])
    .filter(e => new Date(e.startDate) >= new Date())
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())

  return (
    <>
      <Card
        className="h-full cursor-pointer group"
        onClick={() => setIsOpen(true)}
      >
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-14 h-14 bg-cyan border-3 border-black flex items-center justify-center flex-shrink-0">
              {member.avatarUrl ? (
                <img
                  src={member.avatarUrl}
                  alt={fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-display text-xl font-bold">{initials}</span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-bold truncate group-hover:text-cyan transition-colors">{fullName}</h3>
              {member.jobTitle && (
                <p className="text-sm text-gray-600 truncate">{member.jobTitle}</p>
              )}
              <p className="text-sm font-medium text-black truncate">{member.company}</p>
            </div>

            {/* Type Badges */}
            <div className="flex flex-col gap-1 flex-shrink-0">
              {types.map(type => (
                <Badge
                  key={type}
                  variant={type === 'BRAND' ? 'cyan' : 'coral'}
                  className="text-[10px]"
                >
                  {type}
                </Badge>
              ))}
            </div>
          </div>

          {/* Bio */}
          {member.bio && (
            <p className="text-sm text-gray-600 mt-3 line-clamp-2">
              {member.bio}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
            {/* Location */}
            {member.location && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="w-3 h-3" />
                {member.location}
              </span>
            )}

            {/* Contact Links */}
            <div className="flex gap-2 ml-auto">
              {member.linkedinUrl && (
                <a
                  href={member.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="w-8 h-8 bg-gray-100 border border-gray-200 flex items-center justify-center hover:bg-cyan hover:border-black transition-colors"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              )}
              {member.email && (
                <a
                  href={`mailto:${member.email}`}
                  onClick={e => e.stopPropagation()}
                  className="w-8 h-8 bg-gray-100 border border-gray-200 flex items-center justify-center hover:bg-cyan hover:border-black transition-colors"
                >
                  <Mail className="w-4 h-4" />
                </a>
              )}
              {!member.linkedinUrl && !member.email && (
                <>
                  <span className="w-8 h-8 bg-gray-100 border border-gray-200 flex items-center justify-center">
                    <Linkedin className="w-4 h-4 text-gray-300" />
                  </span>
                  <span className="w-8 h-8 bg-gray-100 border border-gray-200 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-gray-300" />
                  </span>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white border-3 border-black neo-shadow max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b-3 border-black bg-gray-50">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-20 h-20 bg-cyan border-3 border-black flex items-center justify-center flex-shrink-0">
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt={fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="font-display text-2xl font-bold">{initials}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-display text-2xl font-bold uppercase">{fullName}</h2>
                    {member.jobTitle && (
                      <p className="text-gray-600 font-medium">{member.jobTitle}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {types.map(type => (
                        <Badge
                          key={type}
                          variant={type === 'BRAND' ? 'cyan' : 'coral'}
                          className="text-[10px]"
                        >
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-200 border-2 border-black flex-shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Companies */}
              {companies.length > 0 && (
                <div>
                  <h3 className="font-display text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                    {companies.length > 1 ? 'Companies' : 'Company'}
                  </h3>
                  <div className="space-y-2">
                    {companies.map((c, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Badge
                          variant={c.type === 'BRAND' ? 'cyan' : 'coral'}
                          className="text-[9px]"
                        >
                          {c.type}
                        </Badge>
                        <span className="font-bold">{c.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bio */}
              {member.bio && (
                <div>
                  <h3 className="font-display text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">About</h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">{member.bio}</p>
                </div>
              )}

              {/* Location */}
              {member.location && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{member.location}</span>
                </div>
              )}

              {/* Contact */}
              {(member.linkedinUrl || member.email) && (
                <div>
                  <h3 className="font-display text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Contact</h3>
                  <div className="flex gap-3">
                    {member.linkedinUrl && (
                      <a
                        href={member.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 border-2 border-gray-200 hover:border-black hover:bg-cyan transition-colors text-sm font-bold"
                      >
                        <Linkedin className="w-4 h-4" />
                        LinkedIn
                      </a>
                    )}
                    {member.email && (
                      <a
                        href={`mailto:${member.email}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 border-2 border-gray-200 hover:border-black hover:bg-cyan transition-colors text-sm font-bold"
                      >
                        <Mail className="w-4 h-4" />
                        Email
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* RSVP'd Events */}
              {upcomingEvents.length > 0 && (
                <div>
                  <h3 className="font-display text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                    Attending Events
                  </h3>
                  <div className="space-y-2">
                    {upcomingEvents.slice(0, 5).map((event, i) => (
                      <Link
                        key={i}
                        href={`/community/events/${event.slug}`}
                        onClick={e => e.stopPropagation()}
                        className="flex items-center gap-3 p-3 bg-gray-50 border-2 border-gray-200 hover:border-black hover:bg-cyan/10 transition-colors"
                      >
                        <Calendar className="w-4 h-4 text-cyan flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate">{event.title}</p>
                          <p className="text-xs text-gray-500">
                            {formatDate(event.startDate, { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Pet */}
              {member.pet && (
                <div>
                  <h3 className="font-display text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                    Office Pet
                  </h3>
                  <div className="flex items-center gap-3 p-3 bg-purple-50 border-2 border-purple-200">
                    {member.pet.petPhotoUrl ? (
                      <img
                        src={member.pet.petPhotoUrl}
                        alt={member.pet.petName}
                        className="w-12 h-12 object-cover border-2 border-black"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-purple-200 border-2 border-black flex items-center justify-center">
                        <PawPrint className="w-6 h-6 text-purple-500" />
                      </div>
                    )}
                    <div>
                      <p className="font-bold">{member.pet.petName}</p>
                      {member.pet.petType && (
                        <p className="text-xs text-gray-500">{member.pet.petType}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
