export type UserRole = "student" | "staff" | "hod"

export const ROLE_EMAIL_DOMAINS: Record<UserRole, string> = {
  staff: "staffedu.com",
  student: "stueduNN.com",
  hod: "hodedu.com",
}

export function isValidRoleEmail(email: string, role: UserRole) {
  const normalizedEmail = email.trim().toLowerCase()
  if (role === "student") {
    return /^[a-z0-9._%+-]+@stuedu\d{2}\.com$/.test(normalizedEmail)
  }
  return new RegExp(`^[a-z0-9._%+-]+@${ROLE_EMAIL_DOMAINS[role].replace(".", "\\.")}$`).test(
    normalizedEmail,
  )
}

export function isFourDigitPassword(password: string) {
  return /^\d{4}$/.test(password)
}

export function roleForEmail(email: string): UserRole | null {
  const normalizedEmail = email.trim().toLowerCase()
  if (normalizedEmail.endsWith("@staffedu.com")) return "staff"
  if (normalizedEmail.endsWith("@hodedu.com")) return "hod"
  if (/^[a-z0-9._%+-]+@stuedu\d{2}\.com$/.test(normalizedEmail)) return "student"
  return null
}
