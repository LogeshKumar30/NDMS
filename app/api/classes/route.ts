import { getSession, requireRole } from "@/lib/auth"
import { getDb } from "@/lib/mongo"

export async function GET() {
  const session = await getSession()
  const unauthorized = requireRole(session, ["hod"])
  if (unauthorized) return unauthorized
  const db = await getDb()
  const items = await db.collection("classes").find().sort({ name: 1 }).toArray()
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
    return Response.json({ error: "Send valid class details." }, { status: 400 })
  }
  if (typeof body !== "object" || body === null) {
    return Response.json({ error: "Send valid class details." }, { status: 400 })
  }
  const name = "name" in body && typeof body.name === "string" ? body.name.trim() : ""
  const department = "department" in body && typeof body.department === "string" ? body.department.trim() : ""
  const batch = "batch" in body && typeof body.batch === "string" ? body.batch.trim() : ""
  const year = "year" in body && typeof body.year === "number" ? body.year : NaN
  const sem = "sem" in body && typeof body.sem === "number" ? body.sem : NaN
  if (!name || !department || !batch || name.length > 100 || department.length > 100 || batch.length > 30 ||
    !Number.isInteger(year) || year < 1 || year > 4 || !Number.isInteger(sem) || sem < 1 || sem > 8) {
    return Response.json({ error: "Enter a name, department, batch, year (1–4), and semester (1–8)." }, { status: 400 })
  }
  const db = await getDb()
  const doc = { name, department, batch, year, sem, stats: { students: 0, cleared: 0, pending: 0 } }
  const { insertedId } = await db.collection("classes").insertOne(doc)
  return Response.json({ _id: insertedId })
}
