import { getSession, requireRole } from "@/lib/auth"
import { getDb } from "@/lib/mongo"
import { ObjectId } from "mongodb"

export async function GET() {
  const session = await getSession()
  const unauthorized = requireRole(session, ["staff"])
  if (unauthorized) return unauthorized
  if (!session) return new Response("Unauthorized", { status: 401 })

  const db = await getDb()
  const staffId = new ObjectId(session.userId)
  const assignedSubjects = await db.collection("subjects")
    .find({ staffId })
    .project({ code: 1, name: 1, classId: 1 })
    .toArray()
  const subjectIds = assignedSubjects.map((subject) => subject._id)
  const classIds = assignedSubjects
    .map((subject) => subject.classId)
    .filter((classId): classId is ObjectId => classId instanceof ObjectId)
  const students = classIds.length
    ? await db.collection("users").find({ role: "student", classId: { $in: classIds } }).toArray()
    : []
  const marks = subjectIds.length
    ? await db.collection("marks").find({ subjectId: { $in: subjectIds } }).toArray()
    : []
  const marksByPair = new Map(marks.map((mark) => [`${mark.studentId}:${mark.subjectId}`, mark]))
  const rows = assignedSubjects.flatMap((subject) =>
    students.map((student) => {
      const mark = marksByPair.get(`${student._id}:${subject._id}`)
      const testAvg = mark?.testAvg ?? 0
      const assignment = mark?.assignments ?? 0
      return {
        _id: mark ? String(mark._id) : `${student._id}-${subject._id}`,
        studentId: String(student._id),
        subjectId: String(subject._id),
        subjectCode: subject.code,
        subjectName: subject.name,
        rollNumber: student.rollNumber ?? "—",
        name: student.name,
        testAvg,
        assignment,
        total: mark?.total ?? testAvg + assignment,
        attendance: mark?.attendance ?? 0,
        status: mark?.status ?? "pending",
      }
    }),
  )

  return Response.json({
    subjects: assignedSubjects.length,
    students: new Set(rows.map((row) => row.studentId)).size,
    pending: rows.filter((r: any) => r.status === "pending").length,
    cleared: rows.filter((r: any) => r.status === "approved").length,
    rows,
  })
}
