"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type StudentRecord = {
  student: { id: string; name: string; email: string; rollNumber?: string; department?: string }
  subjects: Array<{
    subjectId: string
    code: string
    name: string
    testAvg: number
    assignments: number
    attendance: number
    status: string
  }>
}

export default function StudentRecordPage() {
  const { id } = useParams<{ id: string }>()
  const [record, setRecord] = useState<StudentRecord | null>(null)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState("")
  const [savingSubject, setSavingSubject] = useState("")

  useEffect(() => {
    fetch(`/api/staff/student/${id}`)
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || "Unable to load student records.")
        setRecord(result)
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Unable to load student records."))
  }, [id])

  function updateSubject(subjectId: string, field: "testAvg" | "assignments" | "attendance", value: string) {
    setRecord((current) => current ? {
      ...current,
      subjects: current.subjects.map((subject) =>
        subject.subjectId === subjectId ? { ...subject, [field]: Number(value) } : subject,
      ),
    } : current)
  }

  async function saveSubject(subjectId: string) {
    const subject = record?.subjects.find((item) => item.subjectId === subjectId)
    if (!subject) return

    setSavingSubject(subjectId)
    setError("")
    setSaved("")
    try {
      const response = await fetch(`/api/staff/student/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subject),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Unable to save this subject.")
      setSaved(`${subject.code} saved successfully.`)
      setRecord((current) => current ? {
        ...current,
        subjects: current.subjects.map((item) =>
          item.subjectId === subjectId ? { ...item, status: "pending" } : item,
        ),
      } : current)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save this subject.")
    } finally {
      setSavingSubject("")
    }
  }

  async function approveSubject(subjectId: string) {
    setSavingSubject(subjectId)
    setError("")
    setSaved("")
    try {
      const response = await fetch(`/api/staff/student/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Unable to approve this subject.")
      setSaved("Subject record approved.")
      setRecord((current) => current ? {
        ...current,
        subjects: current.subjects.map((subject) =>
          subject.subjectId === subjectId ? { ...subject, status: "approved" } : subject,
        ),
      } : current)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to approve this subject.")
    } finally {
      setSavingSubject("")
    }
  }

  return (
    <main className="mx-auto grid min-h-svh max-w-5xl content-start gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <GraduationCap aria-hidden="true" className="size-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">No Due Management</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Student records</h1>
          </div>
        </div>
        <Button asChild variant="outline"><Link href="/staff"><ArrowLeft aria-hidden="true" /> Back to dashboard</Link></Button>
      </header>

      {error ? <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p> : null}
      {saved ? <p role="status" className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">{saved}</p> : null}
      {record ? (
        <>
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>{record.student.name}</CardTitle>
              <CardDescription>{record.student.rollNumber || "No roll number"} · {record.student.department || "No department"} · {record.student.email}</CardDescription>
            </CardHeader>
          </Card>
          {record.subjects.length ? record.subjects.map((subject) => (
            <Card key={subject.subjectId} className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">{subject.code} — {subject.name}</CardTitle>
                <CardDescription>Record is {subject.status}; changes return it to pending review.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-4">
                <label className="grid gap-2 text-sm font-medium">Test average (0–60)
                  <Input type="number" min={0} max={60} value={subject.testAvg} onChange={(event) => updateSubject(subject.subjectId, "testAvg", event.target.value)} />
                </label>
                <label className="grid gap-2 text-sm font-medium">Assignment (0–40)
                  <Input type="number" min={0} max={40} value={subject.assignments} onChange={(event) => updateSubject(subject.subjectId, "assignments", event.target.value)} />
                </label>
                <label className="grid gap-2 text-sm font-medium">Attendance (0–100%)
                  <Input type="number" min={0} max={100} value={subject.attendance} onChange={(event) => updateSubject(subject.subjectId, "attendance", event.target.value)} />
                </label>
                <div className="flex items-end">
                  <Button className="w-full" disabled={savingSubject === subject.subjectId} onClick={() => void saveSubject(subject.subjectId)}>
                    {savingSubject === subject.subjectId ? "Saving…" : "Save changes"}
                  </Button>
                </div>
                <div className="sm:col-span-4">
                  <Button
                    variant="secondary"
                    disabled={savingSubject === subject.subjectId || subject.status === "approved"}
                    onClick={() => void approveSubject(subject.subjectId)}
                  >
                    {subject.status === "approved" ? "Approved" : "Approve subject record"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )) : (
            <Card className="rounded-2xl">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No subjects assigned to your account for this student’s class.
              </CardContent>
            </Card>
          )}
        </>
      ) : !error ? <p role="status" className="text-sm text-muted-foreground">Loading student records…</p> : null}
    </main>
  )
}
