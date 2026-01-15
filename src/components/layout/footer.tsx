import Link from 'next/link'
import { Twitter, Instagram, Linkedin } from 'lucide-react'

const footerNavigation = {
  platform: [
    { name: 'Explore Suppliers', href: '/explore' },
    { name: 'Brand Directory', href: '/community/brands' },
    { name: 'Events', href: '/community/events' },
    { name: 'Offers', href: '/offers' },
  ],
  company: [
    { name: 'About Us', href: '/about' },
    { name: 'Manifesto', href: '/manifesto' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Contact', href: '/contact' },
  ],
  legal: [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Cookie Policy', href: '/cookies' },
  ],
  social: [
    { name: 'Twitter', href: 'https://twitter.com/kindredcollect', icon: Twitter },
    { name: 'Instagram', href: 'https://instagram.com/kindredcollective', icon: Instagram },
    { name: 'LinkedIn', href: 'https://linkedin.com/company/kindredcollective', icon: Linkedin },
  ],
}

export function Footer() {
  return (
    <footer className="bg-black text-white border-t-4 border-cyan">
      <div className="section-container py-12 lg:py-16">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-cyan border-3 border-white flex items-center justify-center">
                <span className="font-display font-bold text-xl text-black">K</span>
              </div>
              <span className="font-display font-bold text-xl tracking-tight">
                Kindred
              </span>
            </Link>
            <p className="text-gray-400 text-sm mb-6">
              The UK&apos;s leading marketplace for independent drinks brands and suppliers.
            </p>
            {/* Social Links */}
            <div className="flex gap-3">
              {footerNavigation.social.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/10 border-2 border-white/20 flex items-center justify-center hover:bg-cyan hover:border-cyan hover:text-black transition-colors"
                >
                  <span className="sr-only">{item.name}</span>
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wider mb-4">
              Platform
            </h3>
            <ul className="space-y-3">
              {footerNavigation.platform.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-gray-400 hover:text-cyan transition-colors text-sm"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wider mb-4">
              Company
            </h3>
            <ul className="space-y-3">
              {footerNavigation.company.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-gray-400 hover:text-cyan transition-colors text-sm"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wider mb-4">
              Legal
            </h3>
            <ul className="space-y-3">
              {footerNavigation.legal.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-gray-400 hover:text-cyan transition-colors text-sm"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} Kindred Collective. All rights reserved.
            </p>
            <p className="text-gray-500 text-sm">
              Made with love for independent drinks makers
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
