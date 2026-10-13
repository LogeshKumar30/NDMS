export type Role = "student" | "staff" | "hod"

export interface User {
  _id?: string
  name: string
  email: string
  passwordHash: string
  department?: string
  role: Role
  rollNumber?: string
  semester?: number
  classId?: string
}

export interface ClassDoc {
  _id?: string
  name: string
  department: string
  batch: string
  year: number
  sem: number
  advisorId?: string
  stats?: { students: number; cleared: number; pending: number }
}

export interface SubjectDoc {
  _id?: string
  code: string
  name: string
  classId: string
  staffId?: string
}

export interface Enrollment {
  _id?: string
  studentId: string
  classId: string
  status: "pending" | "approved"
}

export interface Marks {
  _id?: string
  studentId: string
  subjectId: string
  test1?: number
  test2?: number
  assignments?: number
  attendance?: number
  total?: number
  status: "pending" | "approved"
}

export interface Leave {
  _id?: string
  studentId: string
  reason: string
  startDate: string
  endDate: string
  fileUrl?: string
  status: "pending" | "advisor-approved" | "hod-approved" | "rejected"
  advisorId?: string
  hodId?: string
}
