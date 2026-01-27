import { redirect } from 'next/navigation'
import { getSession, getUserMember, getUserBrand } from '@/lib/auth/session'
import { SettingsContent } from './settings-content'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const session = await getSession()

  if (!session.isAuthenticated || !session.user) {
    redirect('/login')
  }

  const member = await getUserMember(session.user.id)
  const brand = session.isBrand ? await getUserBrand(session.user.id) : null

  return (
    <SettingsContent
      user={{
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
        isBrand: session.isBrand,
      }}
      member={member}
      brand={brand}
    />
  )
}
