import { ObjectId, type Db } from "mongodb"

function normalizeDepartment(department: string) {
  const normalized = department.trim().toLowerCase().replace(/[^a-z0-9]/g, "")
  if (["it", "informationtechnology"].includes(normalized)) return "it"
  if (["cse", "cs", "computerscience", "computerscienceengineering"].includes(normalized)) return "cse"
  if (["ece", "electronicsandcommunication"].includes(normalized)) return "ece"
  if (["eee", "electricalandelectronics"].includes(normalized)) return "eee"
  return normalized
}

export async function resolveStudentClass(
  db: Db,
  semester: number,
  department: string,
): Promise<{ _id: ObjectId } | null> {
  if (!Number.isInteger(semester) || semester < 1 || semester > 8) return null

  const classes = await db.collection("classes")
    .find({ sem: semester })
    .project({ _id: 1, department: 1 })
    .toArray()
  const targetDepartment = normalizeDepartment(department)
  const matchingClasses = classes.filter(
    (classRecord) => typeof classRecord.department === "string" &&
      normalizeDepartment(classRecord.department) === targetDepartment,
  )

  if (matchingClasses.length === 1) return { _id: matchingClasses[0]._id }
  if (matchingClasses.length > 1) return null
  return classes.length === 1 ? { _id: classes[0]._id } : null
}
