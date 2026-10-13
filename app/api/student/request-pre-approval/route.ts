import { getSession, requireRole } from "@/lib/auth"
import { getDb } from "@/lib/mongo"
import { ObjectId } from "mongodb"

export async function POST() {
  const session = await getSession()
  const unauthorized = requireRole(session, ["student"])
  if (unauthorized) return unauthorized
  const db = await getDb()
  const studentId = new ObjectId((session as any).userId)
  const student = await db.collection("users").findOne({ _id: studentId, role: "student" })
  const subjects = await db.collection("subjects")
    .find(student?.classId ? { classId: student.classId } : { _id: { $exists: false } })
    .project({ _id: 1 })
    .toArray()
  if (!student?.classId) {
    return Response.json({ error: "Your class is not configured yet. Contact your HOD." }, { status: 400 })
  }
  if (!subjects.length) {
    return Response.json({ error: "You need subjects assigned to your class before requesting pre-approval." }, { status: 400 })
  }
  const approvedMarks = await db.collection("marks").find({
    studentId,
    subjectId: { $in: subjects.map((subject) => subject._id) },
    status: "approved",
  }).project({ subjectId: 1 }).toArray()
  const approvedSubjectIds = new Set(approvedMarks.map((mark) => String(mark.subjectId)))
  if (!subjects.every((subject) => approvedSubjectIds.has(String(subject._id)))) {
    return Response.json({ error: "All your subjects must be approved before requesting pre-approval." }, { status: 400 })
  }

  const approvals = db.collection("approvals")
  const existing = await approvals.findOne({ studentId, type: "pre" })
  if (existing?.status === "approved" || existing?.status === "pending") {
    return Response.json({ ok: true, status: existing.status })
  }
  if (existing) {
    await approvals.updateOne(
      { _id: existing._id },
      { $set: { status: "pending", createdAt: new Date() }, $unset: { reviewedAt: "", reviewedBy: "" } },
    )
  } else {
    await approvals.insertOne({ studentId, type: "pre", status: "pending", createdAt: new Date() })
  }
  return Response.json({ ok: true, status: "pending" })
}
