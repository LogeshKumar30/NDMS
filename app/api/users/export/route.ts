import ExcelJS from "exceljs"
import { getSession, requireRole } from "@/lib/auth"
import { getDb } from "@/lib/mongo"
import { ObjectId } from "mongodb"

export async function GET(request: Request) {
  const session = await getSession()
  const unauthorized = requireRole(session, ["hod"])
  if (unauthorized) return unauthorized

  const role = new URL(request.url).searchParams.get("role")
  if (role !== "staff" && role !== "student") {
    return Response.json({ error: "Choose staff or student records to export." }, { status: 400 })
  }

  try {
    const db = await getDb()
    const users = await db.collection("users")
      .find({ role })
      .project({ passwordHash: 0 })
      .sort({ department: 1, name: 1 })
      .toArray()
    const classIds = role === "student"
      ? users.map((user) => user.classId).filter((id): id is ObjectId => id instanceof ObjectId)
      : []
    const classes = classIds.length
      ? await db.collection("classes").find({ _id: { $in: classIds } }).toArray()
      : []
    const classesById = new Map(classes.map((classRecord) => [String(classRecord._id), classRecord]))

    const workbook = new ExcelJS.Workbook()
    workbook.creator = "No Due Management System"
    workbook.created = new Date()
    const worksheet = workbook.addWorksheet(role === "staff" ? "Staff Records" : "Student Records")

    if (role === "staff") {
      worksheet.columns = [
        { header: "Name", key: "name", width: 28 },
        { header: "Email", key: "email", width: 34 },
        { header: "Department", key: "department", width: 28 },
        { header: "Account Status", key: "accountStatus", width: 18 },
        { header: "Created At", key: "createdAt", width: 22 },
      ]
      for (const user of users) {
        worksheet.addRow({
          name: user.name ?? "",
          email: user.email ?? "",
          department: user.department ?? "",
          accountStatus: user.accountStatus ?? "active",
          createdAt: user.createdAt instanceof Date ? user.createdAt : null,
        })
      }
    } else {
      worksheet.columns = [
        { header: "Name", key: "name", width: 28 },
        { header: "Email", key: "email", width: 34 },
        { header: "Roll Number", key: "rollNumber", width: 20 },
        { header: "Department", key: "department", width: 28 },
        { header: "Class", key: "className", width: 28 },
        { header: "Batch", key: "batch", width: 18 },
        { header: "Semester", key: "semester", width: 12 },
        { header: "Account Status", key: "accountStatus", width: 18 },
        { header: "Created At", key: "createdAt", width: 22 },
      ]
      for (const user of users) {
        const classRecord = user.classId ? classesById.get(String(user.classId)) : undefined
        worksheet.addRow({
          name: user.name ?? "",
          email: user.email ?? "",
          rollNumber: user.rollNumber ?? "",
          department: user.department ?? "",
          className: classRecord?.name ?? "",
          batch: classRecord?.batch ?? "",
          semester: user.semester ?? classRecord?.sem ?? "",
          accountStatus: user.accountStatus ?? "active",
          createdAt: user.createdAt instanceof Date ? user.createdAt : null,
        })
      }
    }

    worksheet.getRow(1).font = { bold: true }
    worksheet.views = [{ state: "frozen", ySplit: 1 }]
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: worksheet.columnCount },
    }

    const content = await workbook.xlsx.writeBuffer()
    const date = new Date().toISOString().slice(0, 10)
    return new Response(new Uint8Array(content), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${role}-records-${date}.xlsx"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error(`Unable to export ${role} records.`, error)
    return Response.json({ error: "Unable to download records right now. Please try again." }, { status: 503 })
  }
}
