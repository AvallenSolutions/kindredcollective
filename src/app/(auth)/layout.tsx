import Link from 'next/link'
import Image from 'next/image'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Simple Header */}
      <header className="border-b-3 border-black">
        <div className="section-container py-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/kindred-logo.png" alt="Kindred Collective logo" width={40} height={40} className="w-10 h-10" />
            <span className="font-display font-bold text-xl tracking-tight uppercase">
              Kindred Collective
            </span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center py-12">
        {children}
      </main>

      {/* Simple Footer */}
      <footer className="border-t-3 border-black py-4">
        <div className="section-container text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Kindred Collective
        </div>
      </footer>
    </div>
  )
}
