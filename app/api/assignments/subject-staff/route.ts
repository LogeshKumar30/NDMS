import { getSession, requireRole } from "@/lib/auth"
import { getDb } from "@/lib/mongo"
import { ObjectId } from "mongodb"

export async function POST(req: Request) {
  const session = await getSession()
  const unauthorized = requireRole(session, ["hod"])
  if (unauthorized) return unauthorized

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: "Choose a subject and staff member." }, { status: 400 })
  }
  if (typeof body !== "object" || body === null ||
    !("subjectId" in body) || typeof body.subjectId !== "string" || !ObjectId.isValid(body.subjectId) ||
    !("staffId" in body) || typeof body.staffId !== "string" || !ObjectId.isValid(body.staffId)) {
    return Response.json({ error: "Choose a valid subject and staff member." }, { status: 400 })
  }

  const db = await getDb()
  const staff = await db.collection("users").findOne({
    _id: new ObjectId(body.staffId),
    role: "staff",
    $or: [{ accountStatus: "active" }, { accountStatus: { $exists: false } }],
  })
  if (!staff) return Response.json({ error: "The selected staff account was not found." }, { status: 404 })
  const result = await db.collection("subjects").updateOne(
    { _id: new ObjectId(body.subjectId) },
    { $set: { staffId: new ObjectId(body.staffId) } },
  )
  if (!result.matchedCount) return Response.json({ error: "The selected subject was not found." }, { status: 404 })
  return Response.json({ ok: true })
}
