/** Domains that bounce auth mail (confirm / reset). Add known school filters here. */
const BLOCKED_SIGNUP_DOMAINS = ['mypisd.net'] as const

export function emailDomain(email: string): string | null {
  const at = email.trim().lastIndexOf('@')
  if (at < 0) return null
  const domain = email
    .trim()
    .slice(at + 1)
    .toLowerCase()
  return domain || null
}

export function isBlockedSignupDomain(email: string): boolean {
  const domain = emailDomain(email)
  if (!domain) return false
  return (BLOCKED_SIGNUP_DOMAINS as readonly string[]).includes(domain)
}

export function blockedSignupDomainMessage(email: string): string | null {
  const domain = emailDomain(email)
  if (!domain || !isBlockedSignupDomain(email)) return null
  return (
    `We know emails to @${domain} bounce, so confirmation and password-reset links ` +
    `will not arrive. Please use a different email (personal Gmail works well), ` +
    `or Continue with Google.`
  )
}
