// Run via v0 Scripts UI
import { MongoClient, type ObjectId } from "mongodb"
import bcrypt from "bcryptjs"

async function main() {
  const uri = process.env.MONGODB_URI!
  const client = new MongoClient(uri)
  await client.connect()
  const db = client.db(process.env.MONGODB_DB || "no_due_db")

  await db.dropDatabase()

  const passHash = await bcrypt.hash("1234", 10)

  const users = await db.collection("users").insertMany([
    {
      name: "Dr. Admin",
      email: "admin@hodedu.com",
      passwordHash: passHash,
      role: "hod",
      department: "Information Technology",
    },
    {
      name: "Dr. Rajesh Kumar",
      email: "rajesh@staffedu.com",
      passwordHash: passHash,
      role: "staff",
      department: "Information Technology",
    },
    {
      name: "Aarav Mehta",
      email: "aarav@stuedu24.com",
      passwordHash: passHash,
      role: "student",
      department: "Information Technology",
      rollNumber: "IT22001",
      semester: 5,
    },
  ])

  const hodId = users.insertedIds["0"]
  const staffId = users.insertedIds["1"]
  const studentId = users.insertedIds["2"]

  const classDoc = await db.collection("classes").insertOne({
    name: "IT-A",
    department: "Information Technology",
    batch: "2022-2026",
    year: 3,
    sem: 5,
    advisorId: staffId,
    stats: { students: 1, cleared: 0, pending: 1 },
  })

  await db.collection("users").updateOne({ _id: studentId }, { $set: { classId: classDoc.insertedId } })
  await db.collection("enrollments").insertOne({ studentId, classId: classDoc.insertedId, status: "approved" })

  const subjects = await db.collection("subjects").insertMany([
    { code: "IT501", name: "Data Structures", classId: classDoc.insertedId, staffId },
    { code: "IT502", name: "Operating Systems", classId: classDoc.insertedId, staffId },
    { code: "IT503", name: "Database Management", classId: classDoc.insertedId, staffId },
    { code: "IT504", name: "Computer Networks", classId: classDoc.insertedId, staffId },
  ])

  // demo marks: compute total = (test1+test2)/2 -> /100 * 60 + assignments/10 * 40
  const calc = (t1: number, t2: number, asg: number) => Math.round(((t1 + t2) / 2 / 100) * 60 + (asg / 10) * 40)

  const insertMarks = Object.values(subjects.insertedIds).map((sid, idx) => ({
    studentId,
    subjectId: sid as ObjectId,
    test1: 90 - idx * 5,
    test2: 92 - idx * 3,
    assignments: 9 - idx,
    attendance: 85 + idx,
    total: calc(90 - idx * 5, 92 - idx * 3, 9 - idx),
    status: "approved",
  }))
  await db.collection("marks").insertMany(insertMarks)

  console.log("Seed complete")
  await client.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
