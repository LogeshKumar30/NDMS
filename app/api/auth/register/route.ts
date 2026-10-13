import { hashPassword } from "@/lib/auth"
import { getDb } from "@/lib/mongo"
import { isFourDigitPassword, isValidRoleEmail, type UserRole } from "@/lib/credentials"
import { ObjectId } from "mongodb"

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Send valid account details." }, { status: 400 })
  }

  if (typeof body !== "object" || body === null) {
    return Response.json({ error: "Send valid account details." }, { status: 400 })
  }

  const name = "name" in body && typeof body.name === "string" ? body.name.trim() : ""
  const email = "email" in body && typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
  const password = "password" in body && typeof body.password === "string" ? body.password : ""
  const role = "role" in body && typeof body.role === "string" ? body.role : ""
  const department = "department" in body && typeof body.department === "string" ? body.department.trim() : ""
  const rollNumber = "rollNumber" in body && typeof body.rollNumber === "string" ? body.rollNumber.trim() : ""
  const classId = "classId" in body && typeof body.classId === "string" ? body.classId : ""

  if (name.length < 2 || name.length > 80) {
    return Response.json({ error: "Name must be between 2 and 80 characters." }, { status: 400 })
  }
  if (role !== "student" && role !== "staff" && role !== "hod") {
    return Response.json({ error: "Choose a valid account role." }, { status: 400 })
  }
  if (!isValidRoleEmail(email, role as UserRole)) {
    const format = role === "student" ? "name@stuedu24.com" : `name@${role === "staff" ? "staffedu.com" : "hodedu.com"}`
    return Response.json({ error: `Use a valid ${role} email, such as ${format}.` }, { status: 400 })
  }
  if (!isFourDigitPassword(password)) {
    return Response.json({ error: "Password must contain exactly 4 digits." }, { status: 400 })
  }
  if (department.length > 100 || rollNumber.length > 40) {
    return Response.json({ error: "Department or roll number is too long." }, { status: 400 })
  }
  if (role === "student" && !rollNumber) {
    return Response.json({ error: "Enter your student roll number." }, { status: 400 })
  }
  if (role === "student" && !ObjectId.isValid(classId)) {
    return Response.json({ error: "Select a class configured by your HOD." }, { status: 400 })
  }

  try {
    const db = await getDb()
    const users = db.collection("users")
    if (await users.findOne({ email })) {
      return Response.json({ error: "An account with this email already exists." }, { status: 409 })
    }

    const classRecord = role === "student"
      ? await db.collection("classes").findOne({ _id: new ObjectId(classId) })
      : null
    if (role === "student" && !classRecord) {
      return Response.json({ error: "The selected HOD class was not found. Refresh the class list and try again." }, { status: 400 })
    }
    if (role === "student" && typeof classRecord?.department !== "string") {
      return Response.json({ error: "The selected class is missing its department. Ask your HOD to update the class." }, { status: 400 })
    }

    const result = await users.insertOne({
      name,
      email,
      passwordHash: await hashPassword(password),
      role,
      department: role === "student" ? classRecord?.department : department || "Information Technology",
      ...(role === "student" ? { rollNumber } : {}),
      ...(role === "student" && classRecord ? { classId: classRecord._id, semester: classRecord.sem } : {}),
      accountStatus: "active",
      createdAt: new Date(),
    })

    return Response.json({
      user: { id: String(result.insertedId), name, email, role },
    }, { status: 201 })
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
      return Response.json({ error: "An account with this email already exists." }, { status: 409 })
    }
    console.error("Unable to register account.", error)
    return Response.json({ error: "Unable to create the account right now. Please try again." }, { status: 503 })
  }
}
