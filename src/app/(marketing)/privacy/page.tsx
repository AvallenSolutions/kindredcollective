export const metadata = {
  title: 'Privacy Policy | Kindred Collective',
  description: 'How Kindred Collective handles your personal data.',
}

export default function PrivacyPage() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-display text-5xl font-bold mb-8 uppercase tracking-tighter">
          Privacy <span className="text-cyan">Policy</span>
        </h1>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          <div className="bg-white border-3 border-black neo-shadow p-8">
            <p className="text-sm text-gray-500 mb-6">Last updated: March 2026</p>

            <h2 className="font-display text-2xl font-bold mb-4 uppercase">1. Introduction</h2>
            <p className="mb-4">
              Kindred Collective (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your personal data when you use our platform.
            </p>

            <h2 className="font-display text-2xl font-bold mb-4 mt-8 uppercase">2. Data We Collect</h2>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Account information (name, email, password)</li>
              <li>Profile details (company, job title, bio, LinkedIn URL)</li>
              <li>Brand and supplier affiliations</li>
              <li>Usage data and platform interactions</li>
            </ul>

            <h2 className="font-display text-2xl font-bold mb-4 mt-8 uppercase">3. How We Use Your Data</h2>
            <p className="mb-4">
              We use your data to operate the Kindred Collective platform, connect you with other members, and improve our services. We never sell your personal data to third parties.
            </p>

            <h2 className="font-display text-2xl font-bold mb-4 mt-8 uppercase">4. Data Storage</h2>
            <p className="mb-4">
              Your data is stored securely using industry-standard encryption. We use Supabase for authentication and database services, with data hosted in secure cloud infrastructure.
            </p>

            <h2 className="font-display text-2xl font-bold mb-4 mt-8 uppercase">5. Your Rights</h2>
            <p className="mb-4">
              You have the right to access, update, or delete your personal data at any time through your account settings. You may also contact us to request a copy of your data or to exercise any other data protection rights.
            </p>

            <h2 className="font-display text-2xl font-bold mb-4 mt-8 uppercase">6. Contact</h2>
            <p>
              For privacy-related enquiries, please contact us at{' '}
              <a href="mailto:hello@kindredcollective.co.uk" className="text-cyan hover:underline font-bold">
                hello@kindredcollective.co.uk
              </a>.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
