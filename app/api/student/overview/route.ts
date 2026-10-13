import { getSession, requireRole } from "@/lib/auth"
import { getDb } from "@/lib/mongo"
import { resolveStudentClass } from "@/lib/student-class"
import { ObjectId } from "mongodb"

export async function GET() {
  const session = await getSession()
  const unauthorized = requireRole(session, ["student"])
  if (unauthorized) return unauthorized
  const db = await getDb()

  const studentId = new ObjectId((session as any).userId)
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
  const subjectMatch = classId ? { classId } : { _id: { $exists: false } }
  const subs = await db
    .collection("subjects")
    .aggregate([
      { $match: subjectMatch },
      {
        $lookup: {
          from: "marks",
          let: { sid: "$_id" },
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ["$subjectId", "$$sid"] }, { $eq: ["$studentId", studentId] }] } } },
          ],
          as: "m",
        },
      },
      { $addFields: { m: { $first: "$m" } } },
      {
        $project: {
          code: 1,
          name: 1,
          marks: "$m.total",
          attendance: "$m.attendance",
          status: "$m.status",
          subjectId: "$_id",
        },
      },
    ])
    .toArray()

  const totalSubjects = subs.length
  const completed = subs.filter((s: any) => s.status === "approved").length
  const pending = totalSubjects - completed
  const pre = await db.collection("approvals").findOne({ studentId, type: "pre" })
  const canRequestPre = completed === totalSubjects && totalSubjects > 0 &&
    pre?.status !== "pending" && pre?.status !== "approved"
  const final = await db.collection("approvals").findOne({ studentId, type: "final" })
  const canRequestFinal = pre?.status === "approved" && final?.status !== "pending" && final?.status !== "approved"
  const preStatus = pre?.status || "not-requested"
  const finalStatus = final?.status || "not-requested"

  return Response.json({
    totalSubjects,
    completed,
    pending,
    subjects: subs,
    classConfigured: Boolean(classId),
    canRequestPre,
    canRequestFinal,
    preStatus,
    finalStatus,
  })
}
