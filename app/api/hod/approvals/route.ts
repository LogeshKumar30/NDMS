import { getSession, requireRole } from "@/lib/auth"
import { getDb } from "@/lib/mongo"

export async function GET() {
  const session = await getSession()
  const unauthorized = requireRole(session, ["hod"])
  if (unauthorized) return unauthorized
  const db = await getDb()
  const pendingStaff = await db.collection("marks").countDocuments({ status: "pending" })
  const finalApprovals = await db.collection("approvals").countDocuments({ type: "final", status: "pending" })
  const preApprovals = await db.collection("approvals").countDocuments({ type: "pre", status: "pending" })
  const pendingRequests = await db
    .collection("approvals")
    .aggregate([
      { $match: { type: { $in: ["pre", "final"] }, status: "pending" } },
      { $lookup: { from: "users", localField: "studentId", foreignField: "_id", as: "student" } },
      { $unwind: { path: "$student", preserveNullAndEmptyArrays: true } },
      { $project: { studentId: 1, type: 1, studentName: "$student.name", email: "$student.email", createdAt: 1 } },
    ])
    .toArray()
  const leaves = await db
    .collection("leaves")
    .aggregate([
      { $match: { status: "advisor-approved" } },
      { $lookup: { from: "users", localField: "studentId", foreignField: "_id", as: "stu" } },
      { $unwind: "$stu" },
      { $project: { studentName: "$stu.name", reason: 1, startDate: 1, endDate: 1 } },
    ])
    .toArray()
  const pendingHods = await db.collection("users")
    .find({ role: "hod", accountStatus: "pending" })
    .project({ name: 1, email: 1 })
    .toArray()
  return Response.json({
    pendingStaff,
    preApprovals,
    finalApprovals,
    approvalRequests: pendingRequests,
    leaveRequests: leaves.length,
    leaves,
    pendingHods,
  })
}
