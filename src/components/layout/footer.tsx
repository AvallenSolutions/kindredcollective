import Link from 'next/link'
import Image from 'next/image'

const footerNavigation = {
  community: [
    { name: 'About', href: '/about' },
    { name: 'Join', href: '/join' },
    { name: 'Login', href: '/login' },
  ],
  members: [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Explore Suppliers', href: '/explore' },
    { name: 'Events', href: '/events' },
    { name: 'Offers', href: '/offers' },
  ],
}

export function Footer() {
  return (
    <footer className="bg-white border-t-2 border-black pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 flex items-center justify-center">
                <Image src="/Kindred Spirits Awards_Logos-11 (edited).png" alt="Kindred Collective logo" width={32} height={32} className="w-8 h-8" />
              </div>
              <span className="text-xl font-display font-bold uppercase">Kindred Collective</span>
            </div>
            <p className="text-sm font-medium text-gray-600">
              The private community for independent drinks brands and their suppliers.
            </p>
          </div>

          {/* Community Links */}
          <div>
            <h4 className="font-bold uppercase tracking-wide mb-6 border-b-2 border-black inline-block pb-1">Community</h4>
            <ul className="space-y-3 text-sm font-medium text-gray-600">
              {footerNavigation.community.map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="hover:text-black hover:underline">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Members Links */}
          <div>
            <h4 className="font-bold uppercase tracking-wide mb-6 border-b-2 border-black inline-block pb-1">Members</h4>
            <ul className="space-y-3 text-sm font-medium text-gray-600">
              {footerNavigation.members.map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="hover:text-black hover:underline">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t-2 border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold uppercase text-gray-400">
          <p>&copy; {new Date().getFullYear()} Kindred Collective Inc.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-black">Privacy</Link>
            <Link href="/terms" className="hover:text-black">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
