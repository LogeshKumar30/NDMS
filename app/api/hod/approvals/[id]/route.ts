import { getSession, requireRole } from "@/lib/auth"
import { getDb } from "@/lib/mongo"
import { ObjectId } from "mongodb"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  const unauthorized = requireRole(session, ["hod"])
  if (unauthorized) return unauthorized
  if (!session) return new Response("Unauthorized", { status: 401 })
  const { id } = await params
  if (!ObjectId.isValid(id)) {
    return Response.json({ error: "Invalid approval ID." }, { status: 400 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: "Invalid approval action." }, { status: 400 })
  }
  if (typeof body !== "object" || body === null || !("action" in body)) {
    return Response.json({ error: "Invalid approval action." }, { status: 400 })
  }
  const action = body.action
  const type = "type" in body ? body.type : null
  if (type !== "pre" && type !== "final" && type !== "leave") {
    return Response.json({ error: "Choose a valid approval type." }, { status: 400 })
  }
  if (action !== "approve" && action !== "reject") {
    return Response.json({ error: "Action must be approve or reject." }, { status: 400 })
  }

  const db = await getDb()
  if (type === "final" && action === "approve") {
    const finalRequest = await db.collection("approvals").findOne({
      _id: new ObjectId(id),
      type: "final",
      status: "pending",
    })
    if (!finalRequest) {
      return Response.json({ error: "Final approval request not found." }, { status: 404 })
    }
    const preApproval = await db.collection("approvals").findOne({
      studentId: finalRequest.studentId,
      type: "pre",
      status: "approved",
    })
    if (!preApproval) {
      return Response.json({ error: "Pre-approval must be approved before final approval." }, { status: 400 })
    }
  }
  const result = await db
    .collection(type === "leave" ? "leaves" : "approvals")
    .updateOne(
      type === "leave" ? { _id: new ObjectId(id) } : { _id: new ObjectId(id), type, status: "pending" },
      {
        $set: {
          status: action === "approve" ? (type === "leave" ? "hod-approved" : "approved") : "rejected",
          reviewedAt: new Date(),
          reviewedBy: new ObjectId(session.userId),
        },
      },
    )
  if (result.matchedCount === 0) {
    return Response.json({ error: "Approval request not found." }, { status: 404 })
  }
  return Response.json({ ok: true })
}
