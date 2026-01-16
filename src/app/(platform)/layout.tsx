import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { getSession } from '@/lib/auth/session'

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  const user = session.user
    ? {
        email: session.user.email,
        role: session.user.role,
      }
    : null

  return (
    <div className="flex min-h-screen flex-col">
      <Header user={user} />
      <main className="flex-1 bg-gray-50 pt-20">{children}</main>
      <Footer />
    </div>
  )
}
