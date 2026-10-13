import { getDb } from "@/lib/mongo"
import { verifyPassword, setSession } from "@/lib/auth"

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return new Response("Invalid login details", { status: 400 })
  }

  if (typeof body !== "object" || body === null) {
    return new Response("Invalid login details", { status: 400 })
  }
  const email = "email" in body && typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
  const password = "password" in body && typeof body.password === "string" ? body.password : ""
  const role = "role" in body && typeof body.role === "string" ? body.role.trim().toLowerCase() : ""

  if (!email || !password || !["student", "staff", "hod"].includes(role)) {
    return new Response("Invalid login details", { status: 400 })
  }

  const db = await getDb()
  const user = await db.collection("users").findOne({ email })
  if (!user) return new Response("Invalid credentials", { status: 401 })
  if (user.role !== "student" && user.role !== "staff" && user.role !== "hod") {
    console.error("Login account has an unsupported role.", { userId: String(user._id) })
    return new Response("This account cannot sign in. Contact your administrator.", { status: 403 })
  }

  const ok = typeof user.passwordHash === "string" && await verifyPassword(password, user.passwordHash)
  if (!ok) return new Response("Invalid credentials", { status: 401 })

  await setSession({ userId: String(user._id), role: user.role })
  return Response.json({ user: { id: String(user._id), name: user.name, role: user.role } })
}
