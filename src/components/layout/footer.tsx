import Link from 'next/link'
import { Twitter, Instagram, Linkedin, Zap } from 'lucide-react'

const footerNavigation = {
  platform: [
    { name: 'Browse Suppliers', href: '/explore' },
    { name: 'Events', href: '/events' },
    { name: 'Offers', href: '/offers' },
  ],
  company: [
    { name: 'About Us', href: '/about' },
    { name: 'Manifesto', href: '/manifesto' },
    { name: 'Contact', href: '/contact' },
  ],
  social: [
    { name: 'Twitter', href: 'https://twitter.com/kindredcollect', icon: Twitter },
    { name: 'Instagram', href: 'https://instagram.com/kindredcollective', icon: Instagram },
    { name: 'LinkedIn', href: 'https://linkedin.com/company/kindredcollective', icon: Linkedin },
  ],
}

export function Footer() {
  return (
    <footer className="bg-white border-t-2 border-black pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-black text-white flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <span className="text-xl font-display font-bold uppercase">Kindred.</span>
            </div>
            <p className="text-sm font-medium text-gray-600 mb-6">
              Empowering independent makers to create exceptional liquids.
            </p>
            <div className="flex gap-4">
              {footerNavigation.social.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors"
                >
                  <span className="sr-only">{item.name}</span>
                  <item.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="font-bold uppercase tracking-wide mb-6 border-b-2 border-black inline-block pb-1">Platform</h4>
            <ul className="space-y-3 text-sm font-medium text-gray-600">
              {footerNavigation.platform.map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="hover:text-black hover:underline">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-bold uppercase tracking-wide mb-6 border-b-2 border-black inline-block pb-1">Company</h4>
            <ul className="space-y-3 text-sm font-medium text-gray-600">
              {footerNavigation.company.map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="hover:text-black hover:underline">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-bold uppercase tracking-wide mb-6 border-b-2 border-black inline-block pb-1">Newsletter</h4>
            <p className="text-xs font-medium text-gray-500 mb-4">No fluff. Just industry insights.</p>
            <form className="flex flex-col gap-2">
              <input
                type="email"
                placeholder="Your email"
                className="border-2 border-black p-3 font-medium focus:outline-none focus:ring-2 focus:ring-cyan text-sm"
              />
              <button
                type="submit"
                className="bg-black text-white px-4 py-3 font-bold uppercase text-sm border-2 border-black hover:bg-cyan hover:text-black transition-colors"
              >
                Subscribe
              </button>
            </form>
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
