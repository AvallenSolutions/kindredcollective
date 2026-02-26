import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const FROM_EMAIL = 'Kindred Collective <noreply@kindredcollective.co.uk>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

function sanitizeSubject(str: string): string {
  return str.replace(/[\r\n\0]/g, '')
}

interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

async function sendEmail({ to, subject, html }: SendEmailOptions) {
  if (!resend) {
    console.log(`[Email Service] No RESEND_API_KEY configured. Would send to: ${to}`)
    console.log(`[Email Service] Subject: ${subject}`)
    return { success: true, simulated: true }
  }

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html,
  })

  if (error) {
    console.error('[Email Service] Failed to send:', error)
    throw new Error(`Failed to send email: ${error.message}`)
  }

  return { success: true, id: data?.id }
}

// ── Invite Link Email ───────────────────────────────────────────────

export async function sendInviteEmail(
  to: string,
  inviteToken: string,
  opts?: { notes?: string }
) {
  const signupUrl = `${APP_URL}/signup?invite=${inviteToken}`

  return sendEmail({
    to,
    subject: "You're invited to join Kindred Collective",
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #00D9FF; padding: 24px; border: 3px solid #000;">
          <h1 style="font-family: 'Space Grotesk', Arial, sans-serif; margin: 0; font-size: 24px;">
            Kindred Collective
          </h1>
        </div>
        <div style="padding: 32px 24px; border: 3px solid #000; border-top: 0;">
          <h2 style="margin-top: 0;">You&rsquo;re Invited!</h2>
          <p>You&rsquo;ve been invited to join Kindred Collective &ndash; the private community for the independent drinks industry.</p>
          ${opts?.notes ? `<p style="color: #666; font-style: italic;">&ldquo;${escapeHtml(opts.notes)}&rdquo;</p>` : ''}
          <a href="${signupUrl}" style="display: inline-block; background: #00D9FF; color: #000; font-weight: bold; text-transform: uppercase; padding: 12px 32px; border: 3px solid #000; text-decoration: none; margin: 16px 0;">
            Accept Invitation
          </a>
          <p style="color: #666; font-size: 14px; margin-top: 24px;">
            Or copy this link: <a href="${signupUrl}">${signupUrl}</a>
          </p>
        </div>
      </div>
    `,
  })
}

// ── Organisation Invite Email ───────────────────────────────────────

export async function sendOrgInviteEmail(
  to: string,
  inviteToken: string,
  orgName: string,
  inviterName: string,
  role: string
) {
  const acceptUrl = `${APP_URL}/invite/${inviteToken}`

  return sendEmail({
    to,
    subject: sanitizeSubject(`Join ${orgName} on Kindred Collective`),
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #00D9FF; padding: 24px; border: 3px solid #000;">
          <h1 style="font-family: 'Space Grotesk', Arial, sans-serif; margin: 0; font-size: 24px;">
            Kindred Collective
          </h1>
        </div>
        <div style="padding: 32px 24px; border: 3px solid #000; border-top: 0;">
          <h2 style="margin-top: 0;">Team Invitation</h2>
          <p><strong>${escapeHtml(inviterName)}</strong> has invited you to join <strong>${escapeHtml(orgName)}</strong> as a <strong>${escapeHtml(role.toLowerCase())}</strong> on Kindred Collective.</p>
          <a href="${acceptUrl}" style="display: inline-block; background: #00D9FF; color: #000; font-weight: bold; text-transform: uppercase; padding: 12px 32px; border: 3px solid #000; text-decoration: none; margin: 16px 0;">
            Accept Invitation
          </a>
          <p style="color: #666; font-size: 14px; margin-top: 24px;">
            This invitation expires in 7 days.
          </p>
          <p style="color: #666; font-size: 14px;">
            Or copy this link: <a href="${acceptUrl}">${acceptUrl}</a>
          </p>
        </div>
      </div>
    `,
  })
}

// ── Supplier Claim Verification Email ───────────────────────────────

export async function sendClaimVerificationEmail(
  to: string,
  verificationCode: string,
  supplierName: string
) {
  return sendEmail({
    to,
    subject: sanitizeSubject(`Verify your claim for ${supplierName} on Kindred Collective`),
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #00D9FF; padding: 24px; border: 3px solid #000;">
          <h1 style="font-family: 'Space Grotesk', Arial, sans-serif; margin: 0; font-size: 24px;">
            Kindred Collective
          </h1>
        </div>
        <div style="padding: 32px 24px; border: 3px solid #000; border-top: 0;">
          <h2 style="margin-top: 0;">Verify Your Supplier Claim</h2>
          <p>You&rsquo;re claiming the profile for <strong>${escapeHtml(supplierName)}</strong> on Kindred Collective.</p>
          <p>Your verification code is:</p>
          <div style="background: #f5f5f5; border: 3px solid #000; padding: 16px; text-align: center; margin: 16px 0;">
            <span style="font-family: monospace; font-size: 32px; letter-spacing: 8px; font-weight: bold;">
              ${verificationCode}
            </span>
          </div>
          <p style="color: #666; font-size: 14px;">
            Enter this code on the verification page to complete your claim. If you didn&rsquo;t request this, you can safely ignore this email.
          </p>
        </div>
      </div>
    `,
  })
}
