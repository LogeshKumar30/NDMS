import { getSession, requireRole } from "@/lib/auth"
import { getDb } from "@/lib/mongo"
import { resolveStudentClass } from "@/lib/student-class"
import { ObjectId } from "mongodb"

const maxFileSize = 5 * 1024 * 1024
const allowedExtensions = new Set(["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt", "jpg", "jpeg", "png"])

type RouteContext = { params: Promise<{ id: string }> }

async function getAssignment(db: Awaited<ReturnType<typeof getDb>>, id: string) {
  if (!ObjectId.isValid(id)) return null
  return db.collection("assignments").findOne({ _id: new ObjectId(id) })
}

export async function POST(req: Request, context: RouteContext) {
  const session = await getSession()
  const unauthorized = requireRole(session, ["student"])
  if (unauthorized) return unauthorized
  if (!session) return new Response("Unauthorized", { status: 401 })

  const { id } = await context.params
  const db = await getDb()
  const assignment = await getAssignment(db, id)
  if (!assignment) return Response.json({ error: "Assignment not found." }, { status: 404 })

  const studentId = new ObjectId(session.userId)
  const student = await db.collection("users").findOne(
    { _id: studentId, role: "student" },
    { projection: { classId: 1, semester: 1, department: 1 } },
  )
  let classId = student?.classId
  if (!classId && student && typeof student.semester === "number") {
    const classRecord = await resolveStudentClass(db, student.semester, student.department || "")
    if (classRecord) {
      classId = classRecord._id
      await db.collection("users").updateOne(
        { _id: studentId, classId: { $exists: false } },
        { $set: { classId } },
      )
    }
  }
  const subject = await db.collection("subjects").findOne({ _id: assignment.subjectId })
  if (!subject || !classId || String(subject.classId) !== String(classId)) {
    return Response.json({ error: "This assignment is not available to your class." }, { status: 403 })
  }

  const contentLength = Number(req.headers.get("content-length") || 0)
  if (contentLength > maxFileSize + 128 * 1024) {
    return Response.json({ error: "Files must be 5 MB or smaller." }, { status: 413 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return Response.json({ error: "Choose a file to submit." }, { status: 400 })
  }
  const file = formData.get("file")
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "Choose a non-empty file to submit." }, { status: 400 })
  }
  if (file.size > maxFileSize) {
    return Response.json({ error: "Files must be 5 MB or smaller." }, { status: 413 })
  }
  const fileName = file.name.replace(/[/\\]/g, "_").trim()
  const extension = fileName.includes(".") ? fileName.split(".").pop()?.toLowerCase() : ""
  if (!extension || !allowedExtensions.has(extension)) {
    return Response.json({ error: "Upload a PDF, Office document, text file, or JPG/PNG image." }, { status: 400 })
  }

  const submittedAt = new Date()
  const fileData = Buffer.from(await file.arrayBuffer()).toString("base64")
  await db.collection("assignmentSubmissions").updateOne(
    { assignmentId: assignment._id, studentId },
    {
      $set: {
        assignmentId: assignment._id,
        studentId,
        fileName: fileName.slice(0, 180),
        contentType: file.type || "application/octet-stream",
        fileSize: file.size,
        fileData,
        submittedAt,
      },
    },
    { upsert: true },
  )

  return Response.json({ ok: true, submittedAt }, { status: 201 })
}

export async function GET(_req: Request, context: RouteContext) {
  const session = await getSession()
  const unauthorized = requireRole(session, ["staff", "student"])
  if (unauthorized) return unauthorized
  if (!session) return new Response("Unauthorized", { status: 401 })

  const { id } = await context.params
  const db = await getDb()
  const assignment = await getAssignment(db, id)
  if (!assignment) return Response.json({ error: "Assignment not found." }, { status: 404 })

  const subject = await db.collection("subjects").findOne({ _id: assignment.subjectId })
  if (!subject) return Response.json({ error: "Assignment subject not found." }, { status: 404 })
  const userId = new ObjectId(session.userId)
  const isAssignedStaff = session.role === "staff" && String(subject.staffId) === String(userId)
  let query: Record<string, ObjectId> = { assignmentId: assignment._id }
  if (session.role === "student") {
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
    if (!classId || String(subject.classId) !== String(classId)) {
      return Response.json({ error: "This assignment is not available to your class." }, { status: 403 })
    }
    query.studentId = userId
  } else if (!isAssignedStaff) {
    return new Response("Forbidden", { status: 403 })
  } else {
    const studentId = new URL(_req.url).searchParams.get("studentId")
    if (!studentId || !ObjectId.isValid(studentId)) {
      return Response.json({ error: "Choose a valid student submission." }, { status: 400 })
    }
    query.studentId = new ObjectId(studentId)
  }

  const submission = await db.collection("assignmentSubmissions").findOne(query)
  if (!submission) return Response.json({ error: "No submission found." }, { status: 404 })
  const data = Buffer.from(submission.fileData, "base64")
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": submission.contentType || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(submission.fileName)}"`,
      "Content-Length": String(data.length),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
