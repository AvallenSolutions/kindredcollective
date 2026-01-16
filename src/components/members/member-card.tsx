import { MapPin, Linkedin, Mail } from 'lucide-react'
import { Badge, Card, CardContent } from '@/components/ui'
import { getInitials } from '@/lib/utils'

interface MemberCardProps {
  member: {
    id: string
    firstName: string
    lastName: string
    jobTitle: string | null
    company: string
    companyType: 'BRAND' | 'SUPPLIER'
    bio: string | null
    location: string | null
    avatarUrl?: string | null
  }
}

export function MemberCard({ member }: MemberCardProps) {
  const initials = getInitials(`${member.firstName} ${member.lastName}`)
  const fullName = `${member.firstName} ${member.lastName}`

  return (
    <Card className="h-full">
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
            <h3 className="font-display font-bold truncate">{fullName}</h3>
            {member.jobTitle && (
              <p className="text-sm text-gray-600 truncate">{member.jobTitle}</p>
            )}
            <p className="text-sm font-medium text-black truncate">{member.company}</p>
          </div>

          {/* Type Badge */}
          <Badge
            variant={member.companyType === 'BRAND' ? 'cyan' : 'coral'}
            className="flex-shrink-0 text-[10px]"
          >
            {member.companyType}
          </Badge>
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
          <div className="flex gap-2">
            <button className="w-8 h-8 bg-gray-100 border border-gray-200 flex items-center justify-center hover:bg-cyan hover:border-black transition-colors">
              <Linkedin className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 bg-gray-100 border border-gray-200 flex items-center justify-center hover:bg-cyan hover:border-black transition-colors">
              <Mail className="w-4 h-4" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
