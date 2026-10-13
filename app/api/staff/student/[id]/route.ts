import { getSession, requireRole } from "@/lib/auth"
import { getDb } from "@/lib/mongo"
import { ObjectId } from "mongodb"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  const unauthorized = requireRole(session, ["staff"])
  if (unauthorized) return unauthorized
  if (!session) return new Response("Unauthorized", { status: 401 })

  const { id } = await params
  if (!ObjectId.isValid(id)) return Response.json({ error: "Invalid student ID." }, { status: 400 })

  const db = await getDb()
  const studentId = new ObjectId(id)
  const student = await db.collection("users").findOne(
    { _id: studentId, role: "student" },
    { projection: { passwordHash: 0 } },
  )
  if (!student) return Response.json({ error: "Student not found." }, { status: 404 })

  const subjects = await db.collection("subjects")
    .find({ staffId: new ObjectId(session.userId), classId: student.classId })
    .project({ code: 1, name: 1 })
    .toArray()
  const records = await db.collection("marks")
    .find({ studentId, subjectId: { $in: subjects.map((subject) => subject._id) } })
    .toArray()
  const marksBySubject = new Map(records.map((record) => [String(record.subjectId), record]))

  return Response.json({
    student: {
      id: String(student._id),
      name: student.name,
      email: student.email,
      rollNumber: student.rollNumber,
      department: student.department,
    },
    subjects: subjects.map((subject) => {
      const record = marksBySubject.get(String(subject._id))
      return {
        subjectId: String(subject._id),
        code: subject.code,
        name: subject.name,
        testAvg: record?.testAvg ?? 0,
        assignments: record?.assignments ?? 0,
        attendance: record?.attendance ?? 0,
        status: record?.status ?? "pending",
      }
    }),
  })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  const unauthorized = requireRole(session, ["staff"])
  if (unauthorized) return unauthorized
  if (!session) return new Response("Unauthorized", { status: 401 })

  const { id } = await params
  if (!ObjectId.isValid(id)) return Response.json({ error: "Invalid student ID." }, { status: 400 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Send valid marks and attendance." }, { status: 400 })
  }
  if (typeof body !== "object" || body === null) {
    return Response.json({ error: "Send valid marks and attendance." }, { status: 400 })
  }

  const subjectId = "subjectId" in body && typeof body.subjectId === "string" ? body.subjectId : ""
  const testAvg = "testAvg" in body && typeof body.testAvg === "number" ? body.testAvg : NaN
  const assignments = "assignments" in body && typeof body.assignments === "number" ? body.assignments : NaN
  const attendance = "attendance" in body && typeof body.attendance === "number" ? body.attendance : NaN
  if (!ObjectId.isValid(subjectId) || !Number.isFinite(testAvg) || testAvg < 0 || testAvg > 60 ||
    !Number.isFinite(assignments) || assignments < 0 || assignments > 40 ||
    !Number.isFinite(attendance) || attendance < 0 || attendance > 100) {
    return Response.json({ error: "Test marks must be 0–60, assignment marks 0–40, and attendance 0–100." }, { status: 400 })
  }

  const db = await getDb()
  const studentId = new ObjectId(id)
  const subjectObjectId = new ObjectId(subjectId)
  const student = await db.collection("users").findOne({ _id: studentId, role: "student" })
  const subject = student && await db.collection("subjects").findOne({
    _id: subjectObjectId,
    staffId: new ObjectId(session.userId),
    classId: student.classId,
  })
  if (!subject) return Response.json({ error: "This subject is not assigned to you for this student." }, { status: 403 })

  await db.collection("marks").updateOne(
    { studentId, subjectId: subjectObjectId },
    {
      $set: {
        testAvg,
        assignments,
        total: testAvg + assignments,
        attendance,
        status: "pending",
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true },
  )
  return Response.json({ ok: true })
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  const unauthorized = requireRole(session, ["staff"])
  if (unauthorized) return unauthorized
  if (!session) return new Response("Unauthorized", { status: 401 })

  const { id } = await params
  if (!ObjectId.isValid(id)) return Response.json({ error: "Invalid student ID." }, { status: 400 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Invalid approval request." }, { status: 400 })
  }
  if (typeof body !== "object" || body === null ||
    !("subjectId" in body) || typeof body.subjectId !== "string" || !ObjectId.isValid(body.subjectId)) {
    return Response.json({ error: "Choose a valid subject." }, { status: 400 })
  }

  const db = await getDb()
  const studentId = new ObjectId(id)
  const subjectId = new ObjectId(body.subjectId)
  const student = await db.collection("users").findOne({ _id: studentId, role: "student" })
  const subject = student && await db.collection("subjects").findOne({
    _id: subjectId,
    staffId: new ObjectId(session.userId),
    classId: student.classId,
  })
  if (!subject) return Response.json({ error: "This subject is not assigned to you for this student." }, { status: 403 })

  const result = await db.collection("marks").updateOne(
    { studentId, subjectId },
    { $set: { status: "approved", approvedAt: new Date(), approvedBy: new ObjectId(session.userId) } },
  )
  if (!result.matchedCount) return Response.json({ error: "Save marks before approving the record." }, { status: 404 })
  return Response.json({ ok: true })
}
