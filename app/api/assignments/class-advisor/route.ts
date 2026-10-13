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
    return Response.json({ error: "Choose a class and advisor." }, { status: 400 })
  }
  if (typeof body !== "object" || body === null ||
    !("classId" in body) || typeof body.classId !== "string" || !ObjectId.isValid(body.classId) ||
    !("advisorId" in body) || typeof body.advisorId !== "string" || !ObjectId.isValid(body.advisorId)) {
    return Response.json({ error: "Choose a valid class and advisor." }, { status: 400 })
  }

  const db = await getDb()
  const staff = await db.collection("users").findOne({
    _id: new ObjectId(body.advisorId),
    role: "staff",
    $or: [{ accountStatus: "active" }, { accountStatus: { $exists: false } }],
  })
  if (!staff) return Response.json({ error: "The selected staff account was not found." }, { status: 404 })
  const result = await db.collection("classes").updateOne(
    { _id: new ObjectId(body.classId) },
    { $set: { advisorId: new ObjectId(body.advisorId) } },
  )
  if (!result.matchedCount) return Response.json({ error: "The selected class was not found." }, { status: 404 })
  return Response.json({ ok: true })
}
