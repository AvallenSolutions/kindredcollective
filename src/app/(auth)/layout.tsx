import Link from 'next/link'

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
            <div className="w-10 h-10 bg-cyan border-3 border-black flex items-center justify-center">
              <span className="font-display font-bold text-xl">K</span>
            </div>
            <span className="font-display font-bold text-xl tracking-tight">
              Kindred
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
