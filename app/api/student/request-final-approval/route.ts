import { getSession, requireRole } from "@/lib/auth"
import { getDb } from "@/lib/mongo"
import { ObjectId } from "mongodb"

export async function POST() {
  const session = await getSession()
  const unauthorized = requireRole(session, ["student"])
  if (unauthorized) return unauthorized
  const db = await getDb()
  const studentId = new ObjectId((session as any).userId)
  const preApproval = await db.collection("approvals").findOne({ studentId, type: "pre" })
  if (preApproval?.status !== "approved") {
    return Response.json({ error: "Final approval is available after pre-approval is approved." }, { status: 400 })
  }
  const approvals = db.collection("approvals")
  const existing = await approvals.findOne({ studentId, type: "final" })
  if (existing?.status === "approved" || existing?.status === "pending") {
    return Response.json({ ok: true, status: existing.status })
  }
  if (existing) {
    await approvals.updateOne(
      { _id: existing._id },
      { $set: { status: "pending", createdAt: new Date() }, $unset: { reviewedAt: "", reviewedBy: "" } },
    )
  } else {
    await approvals.insertOne({ studentId, type: "final", status: "pending", createdAt: new Date() })
  }
  return Response.json({ ok: true, status: "pending" })
}
