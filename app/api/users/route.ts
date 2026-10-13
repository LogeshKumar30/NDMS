import { getSession, hashPassword, requireRole } from "@/lib/auth"
import { getDb } from "@/lib/mongo"
import { isFourDigitPassword, isValidRoleEmail, type UserRole } from "@/lib/credentials"
import { ObjectId } from "mongodb"

export async function GET(req: Request) {
  const session = await getSession()
  const unauthorized = requireRole(session, ["hod"])
  if (unauthorized) return unauthorized
  const { searchParams } = new URL(req.url)
  const role = searchParams.get("role")
  const db = await getDb()
  const query = role === "staff"
    ? { role, $or: [{ accountStatus: "active" }, { accountStatus: { $exists: false } }] }
    : role ? { role } : {}
  const items = await db
    .collection("users")
    .find(query)
    .project({ passwordHash: 0 })
    .toArray()
  return Response.json({ items })
}

export async function POST(req: Request) {
  const session = await getSession()
  const unauthorized = requireRole(session, ["hod"])
  if (unauthorized) return unauthorized

  let body: unknown
  try {
    body = await req.json()
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
  const department =
    "department" in body && typeof body.department === "string"
      ? body.department.trim()
      : ""
  const classId = "classId" in body && typeof body.classId === "string" ? body.classId : ""
  const rollNumber = "rollNumber" in body && typeof body.rollNumber === "string" ? body.rollNumber.trim() : ""

  if (name.length < 2 || name.length > 80) {
    return Response.json({ error: "Name must be between 2 and 80 characters." }, { status: 400 })
  }
  if (role !== "student" && role !== "staff" && role !== "hod") {
    return Response.json({ error: "Choose a valid account role." }, { status: 400 })
  }
  if (!isValidRoleEmail(email, role as UserRole)) {
    const format = role === "student" ? "name@stuedu24.com (use your two-digit year)" : `name@${role === "staff" ? "staffedu.com" : "hodedu.com"}`
    return Response.json({ error: `Use a valid ${role} email, such as ${format}.` }, { status: 400 })
  }
  if (!isFourDigitPassword(password)) {
    return Response.json({ error: "Password must contain exactly 4 digits." }, { status: 400 })
  }
  if (department.length > 100) {
    return Response.json({ error: "Department must be 100 characters or fewer." }, { status: 400 })
  }
  if (rollNumber.length > 40 || (role === "student" && !rollNumber)) {
    return Response.json({ error: "Enter a student roll number of 40 characters or fewer." }, { status: 400 })
  }
  if (role === "student" && !classId) {
    return Response.json({ error: "Select a class for the student account." }, { status: 400 })
  }
  if (classId && !ObjectId.isValid(classId)) {
    return Response.json({ error: "Choose a valid class." }, { status: 400 })
  }

  try {
    const db = await getDb()
    const users = db.collection("users")
    if (await users.findOne({ email })) {
      return Response.json({ error: "An account with this email already exists." }, { status: 409 })
    }
    if (classId && !(await db.collection("classes").findOne({ _id: new ObjectId(classId) }))) {
      return Response.json({ error: "The selected class was not found." }, { status: 400 })
    }

    const result = await users.insertOne({
      name,
      email,
      passwordHash: await hashPassword(password),
      role,
      department: department || "Information Technology",
      ...(role === "student" ? { rollNumber } : {}),
      ...(classId && role === "student" ? { classId: new ObjectId(classId) } : {}),
      accountStatus: "active",
    })

    return Response.json(
      { user: { id: String(result.insertedId), name, email, role, department: department || "Information Technology" } },
      { status: 201 },
    )
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
      return Response.json({ error: "An account with this email already exists." }, { status: 409 })
    }
    console.error("Unable to create managed user account.")
    return Response.json({ error: "Unable to create the account right now. Please try again." }, { status: 503 })
  }
}
