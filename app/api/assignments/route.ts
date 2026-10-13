import { getSession, requireRole } from "@/lib/auth"
import { getDb } from "@/lib/mongo"
import { resolveStudentClass } from "@/lib/student-class"
import { ObjectId } from "mongodb"

export async function GET() {
  const session = await getSession()
  const unauthorized = requireRole(session, ["staff", "student"])
  if (unauthorized) return unauthorized
  if (!session) return new Response("Unauthorized", { status: 401 })

  const db = await getDb()
  const userId = new ObjectId(session.userId)
  let subjects

  if (session.role === "staff") {
    subjects = await db.collection("subjects")
      .find({ staffId: userId })
      .project({ code: 1, name: 1, classId: 1 })
      .toArray()
  } else {
    const student = await db.collection("users").findOne(
      { _id: userId, role: "student" },
      { projection: { classId: 1, semester: 1, department: 1 } },
    )
    let classId = student?.classId
    if (!classId && student && typeof student.semester === "number") {
      const classRecord = await resolveStudentClass(db, student.semester, student.department || "")
      if (classRecord) {
        classId = classRecord._id
        await db.collection("users").updateOne(
          { _id: userId, classId: { $exists: false } },
          { $set: { classId } },
        )
      }
    }
    subjects = classId
      ? await db.collection("subjects").find({ classId }).project({ code: 1, name: 1, classId: 1 }).toArray()
      : []
  }

  const subjectIds = subjects.map((subject) => subject._id)
  if (!subjectIds.length) return Response.json({ subjects: [], items: [] })

  const items = await db.collection("assignments")
    .find({ subjectId: { $in: subjectIds } })
    .sort({ dueDate: 1, createdAt: -1 })
    .toArray()
  const assignmentIds = items.map((item) => item._id)
  const submissions = assignmentIds.length
    ? await db.collection("assignmentSubmissions")
      .find(session.role === "student"
        ? { assignmentId: { $in: assignmentIds }, studentId: userId }
        : { assignmentId: { $in: assignmentIds } })
      .project({ assignmentId: 1, studentId: 1, fileName: 1, submittedAt: 1 })
      .toArray()
    : []
  const studentIds = session.role === "staff"
    ? Array.from(new Map(submissions.map((submission) => [String(submission.studentId), submission.studentId])).values())
    : []
  const students = studentIds.length
    ? await db.collection("users")
      .find({ _id: { $in: studentIds } })
      .project({ name: 1, rollNumber: 1 })
      .toArray()
    : []
  const studentsById = new Map(students.map((student) => [String(student._id), student]))
  const subjectsById = new Map(subjects.map((subject) => [String(subject._id), subject]))
  const submissionsByAssignment = new Map<string, typeof submissions>()
  for (const submission of submissions) {
    const key = String(submission.assignmentId)
    const existing = submissionsByAssignment.get(key) ?? []
    existing.push(submission)
    submissionsByAssignment.set(key, existing)
  }

  return Response.json({
    subjects: subjects.map((subject) => ({
      id: String(subject._id),
      code: subject.code,
      name: subject.name,
    })),
    items: items.map((item) => {
      const assignmentSubmissions = submissionsByAssignment.get(String(item._id)) ?? []
      const submission = session.role === "student" ? assignmentSubmissions[0] : undefined
      const subject = subjectsById.get(String(item.subjectId))
      return {
        id: String(item._id),
        title: item.title,
        description: item.description,
        dueDate: item.dueDate,
        createdAt: item.createdAt,
        subject: subject
          ? {
              code: subject.code,
              name: subject.name,
            }
          : null,
        submission: submission
          ? {
              fileName: submission.fileName,
              submittedAt: submission.submittedAt,
              isLate: new Date(submission.submittedAt) > new Date(item.dueDate),
            }
          : null,
        submissionCount: session.role === "staff" ? assignmentSubmissions.length : undefined,
        submissions: session.role === "staff"
          ? assignmentSubmissions.map((entry) => {
              const student = studentsById.get(String(entry.studentId))
              return {
                studentId: String(entry.studentId),
                name: student?.name ?? "Student",
                rollNumber: student?.rollNumber ?? "—",
                fileName: entry.fileName,
                submittedAt: entry.submittedAt,
              }
            })
          : undefined,
      }
    }),
  })
}

export async function POST(req: Request) {
  const session = await getSession()
  const unauthorized = requireRole(session, ["staff"])
  if (unauthorized) return unauthorized
  if (!session) return new Response("Unauthorized", { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: "Enter the assignment details." }, { status: 400 })
  }

  if (typeof body !== "object" || body === null) {
    return Response.json({ error: "Enter the assignment details." }, { status: 400 })
  }
  const subjectId = "subjectId" in body && typeof body.subjectId === "string" ? body.subjectId : ""
  const title = "title" in body && typeof body.title === "string" ? body.title.trim() : ""
  const description = "description" in body && typeof body.description === "string" ? body.description.trim() : ""
  const dueDateValue = "dueDate" in body && typeof body.dueDate === "string" ? body.dueDate : ""
  const dueDate = new Date(dueDateValue)

  if (!ObjectId.isValid(subjectId) || title.length < 2 || title.length > 120 ||
    description.length > 2000 || !dueDateValue || Number.isNaN(dueDate.getTime())) {
    return Response.json({ error: "Provide a subject, a 2–120 character title, valid due date, and description up to 2,000 characters." }, { status: 400 })
  }

  const db = await getDb()
  const subject = await db.collection("subjects").findOne({
    _id: new ObjectId(subjectId),
    staffId: new ObjectId(session.userId),
  })
  if (!subject) return Response.json({ error: "You can only create assignments for your assigned subjects." }, { status: 403 })

  const createdAt = new Date()
  const result = await db.collection("assignments").insertOne({
    subjectId: subject._id,
    staffId: new ObjectId(session.userId),
    title,
    description,
    dueDate,
    createdAt,
  })
  return Response.json({ id: String(result.insertedId) }, { status: 201 })
}
