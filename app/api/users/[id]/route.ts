import { getSession, requireRole } from "@/lib/auth"
import { getDb } from "@/lib/mongo"
import { ObjectId } from "mongodb"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  const unauthorized = requireRole(session, ["hod"])
  if (unauthorized) return unauthorized
  if (!session) return new Response("Unauthorized", { status: 401 })

  const { id } = await params
  if (!ObjectId.isValid(id)) {
    return Response.json({ error: "Invalid account ID." }, { status: 400 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Invalid account update." }, { status: 400 })
  }
  if (typeof body !== "object" || body === null || !("accountStatus" in body) || body.accountStatus !== "active") {
    return Response.json({ error: "Invalid account update." }, { status: 400 })
  }

  const result = await (await getDb()).collection("users").updateOne(
    { _id: new ObjectId(id), role: "hod", accountStatus: "pending" },
    { $set: { accountStatus: "active", approvedAt: new Date(), approvedBy: new ObjectId(session.userId) } },
  )
  if (!result.matchedCount) {
    return Response.json({ error: "Pending HOD account not found." }, { status: 404 })
  }
  return Response.json({ ok: true })
}
