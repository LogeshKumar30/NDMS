import { getSession, requireRole } from "@/lib/auth"
import { getDb } from "@/lib/mongo"

export async function GET() {
  const session = await getSession()
  const unauthorized = requireRole(session, ["hod"])
  if (unauthorized) return unauthorized

  const db = await getDb()
  const [activeClasses, students, clearedStudents, pendingApprovals] = await Promise.all([
    db.collection("classes").countDocuments(),
    db.collection("users").countDocuments({ role: "student" }),
    db.collection("enrollments").countDocuments({ status: "approved" }),
    db.collection("approvals").countDocuments({ status: "pending" }),
  ])
  return Response.json({ activeClasses, students, clearedStudents, pendingApprovals })
}
