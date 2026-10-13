import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"
import bcrypt from "bcryptjs"
import type { JWTPayload } from "jose"

function getSecret() {
  const value = process.env.JWT_SECRET
  if (value) return new TextEncoder().encode(value)
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be configured in production.")
  }
  return new TextEncoder().encode("dev-secret")
}

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export async function setSession(payload: JWTPayload & { role: string; userId: string }) {
  const token = await new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setExpirationTime("7d").sign(getSecret())
  const cookieStore = await cookies()
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })
}

export async function getSession(): Promise<null | (JWTPayload & { role: string; userId: string })> {
  const cookieStore = await cookies()
  const token = cookieStore.get("session")?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as any
  } catch {
    return null
  }
}

export function requireRole(session: any, roles: string[]) {
  if (!session || !roles.includes(session.role)) {
    return new Response("Unauthorized", { status: 401 })
  }
  return null
}
