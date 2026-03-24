export const metadata = {
  title: 'Terms of Service | Kindred Collective',
  description: 'Terms and conditions for using the Kindred Collective platform.',
}

export default function TermsPage() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-display text-5xl font-bold mb-8 uppercase tracking-tighter">
          Terms of <span className="text-cyan">Service</span>
        </h1>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          <div className="bg-white border-3 border-black neo-shadow p-8">
            <p className="text-sm text-gray-500 mb-6">Last updated: March 2026</p>

            <h2 className="font-display text-2xl font-bold mb-4 uppercase">1. Acceptance of Terms</h2>
            <p className="mb-4">
              By accessing and using Kindred Collective, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform.
            </p>

            <h2 className="font-display text-2xl font-bold mb-4 mt-8 uppercase">2. Membership</h2>
            <p className="mb-4">
              Kindred Collective is a private, invite-only community for the independent drinks industry. Membership is granted at our discretion and may be revoked if these terms are violated.
            </p>

            <h2 className="font-display text-2xl font-bold mb-4 mt-8 uppercase">3. Acceptable Use</h2>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Use the platform in good faith and for its intended purpose</li>
              <li>Provide accurate information in your profile and listings</li>
              <li>Respect other members and their intellectual property</li>
              <li>Do not share invite links publicly or with non-industry contacts</li>
              <li>Do not use the platform for spam, harassment, or illegal activity</li>
            </ul>

            <h2 className="font-display text-2xl font-bold mb-4 mt-8 uppercase">4. Content</h2>
            <p className="mb-4">
              You retain ownership of content you post on Kindred Collective. By posting, you grant us a licence to display and distribute that content within the platform to other members.
            </p>

            <h2 className="font-display text-2xl font-bold mb-4 mt-8 uppercase">5. Limitation of Liability</h2>
            <p className="mb-4">
              Kindred Collective is provided &ldquo;as is&rdquo;. We are not liable for any business decisions, partnerships, or outcomes arising from connections made on the platform.
            </p>

            <h2 className="font-display text-2xl font-bold mb-4 mt-8 uppercase">6. Changes to Terms</h2>
            <p className="mb-4">
              We may update these terms from time to time. Continued use of the platform after changes constitutes acceptance of the updated terms.
            </p>

            <h2 className="font-display text-2xl font-bold mb-4 mt-8 uppercase">7. Contact</h2>
            <p>
              For questions about these terms, please contact us at{' '}
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
