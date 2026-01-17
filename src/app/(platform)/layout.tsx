import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { getSession, getUserMember } from '@/lib/auth/session'

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  let user = null
  if (session.user) {
    const member = await getUserMember(session.user.id)
    user = {
      email: session.user.email,
      role: session.user.role,
      firstName: member?.firstName || null,
      lastName: member?.lastName || null,
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header user={user} />
      <main className="flex-1 bg-gray-50 pt-20">{children}</main>
      <Footer />
    </div>
  )
}
