import { getSession, requireRole } from "@/lib/auth"
import { getDb } from "@/lib/mongo"
import { ObjectId } from "mongodb"

export async function GET() {
  const session = await getSession()
  const unauthorized = requireRole(session, ["hod", "staff"])
  if (unauthorized) return unauthorized
  const db = await getDb()
  const subjects = await db
    .collection("subjects")
    .aggregate([
      { $lookup: { from: "classes", localField: "classId", foreignField: "_id", as: "class" } },
      { $unwind: { path: "$class", preserveNullAndEmptyArrays: true } },
      { $lookup: { from: "users", localField: "staffId", foreignField: "_id", as: "staff" } },
      { $unwind: { path: "$staff", preserveNullAndEmptyArrays: true } },
      { $addFields: { className: "$class.name", staffName: "$staff.name" } },
      { $project: { class: 0, staff: 0 } },
    ])
    .toArray()
  return Response.json({ items: subjects })
}

export async function POST(req: Request) {
  const session = await getSession()
  const unauthorized = requireRole(session, ["hod"])
  if (unauthorized) return unauthorized
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: "Send valid subject details." }, { status: 400 })
  }
  if (typeof body !== "object" || body === null) {
    return Response.json({ error: "Send valid subject details." }, { status: 400 })
  }
  const code = "code" in body && typeof body.code === "string" ? body.code.trim() : ""
  const name = "name" in body && typeof body.name === "string" ? body.name.trim() : ""
  const classId = "classId" in body && typeof body.classId === "string" ? body.classId : ""
  if (!code || code.length > 30 || !name || name.length > 100 || !ObjectId.isValid(classId)) {
    return Response.json({ error: "Enter a subject code and name, and select a valid class." }, { status: 400 })
  }
  const db = await getDb()
  if (!(await db.collection("classes").findOne({ _id: new ObjectId(classId) }))) {
    return Response.json({ error: "The selected class was not found." }, { status: 404 })
  }
  const doc = { code, name, classId: new ObjectId(classId) }
  const { insertedId } = await db.collection("subjects").insertOne(doc)
  return Response.json({ _id: insertedId })
}
