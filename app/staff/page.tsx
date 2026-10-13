"use client"

import useSWR from "swr"
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChatAssistant } from "@/components/chat-assistant"
import { DashboardHeader } from "@/components/dashboard-header"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { BookOpen, CalendarClock, CheckCircle2, Clock3, Download, FilePlus2, Users } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useState, type FormEvent } from "react"

const fetcher = async (u: string) => {
  const response = await fetch(u)
  const text = await response.text()
  const result = (() => {
    try {
      return text ? JSON.parse(text) : {}
    } catch {
      return { error: text }
    }
  })()
  if (!response.ok) throw new Error(result.error || "Unable to load staff dashboard.")
  return result
}

export default function StaffDashboard() {
  const { data, error } = useSWR("/api/staff/overview", fetcher, { refreshInterval: 5000 })
  const {
    data: assignmentData,
    error: assignmentError,
    mutate: refreshAssignments,
  } = useSWR("/api/assignments", fetcher, { refreshInterval: 15000 })
  const [assignmentForm, setAssignmentForm] = useState({ subjectId: "", title: "", description: "", dueDate: "" })
  const [savingAssignment, setSavingAssignment] = useState(false)
  const [assignmentMessage, setAssignmentMessage] = useState("")
  const [assignmentErrorMessage, setAssignmentErrorMessage] = useState("")

  async function createAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSavingAssignment(true)
    setAssignmentMessage("")
    setAssignmentErrorMessage("")
    try {
      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...assignmentForm,
          dueDate: new Date(assignmentForm.dueDate).toISOString(),
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Unable to create the assignment.")
      setAssignmentForm({ subjectId: "", title: "", description: "", dueDate: "" })
      setAssignmentMessage("Assignment published to students in the selected subject.")
      await refreshAssignments()
    } catch (cause) {
      setAssignmentErrorMessage(cause instanceof Error ? cause.message : "Unable to create the assignment.")
    } finally {
      setSavingAssignment(false)
    }
  }

  return (
    <main className="dashboard-page mx-auto grid min-h-svh max-w-7xl content-start gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <DashboardHeader title="Staff dashboard" role="staff" />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="My subjects" value={data?.subjects ?? 0} icon={BookOpen} tone="green" />
        <Metric title="My students" value={data?.students ?? 0} icon={Users} tone="teal" />
        <Metric title="Pending approvals" value={data?.pending ?? 0} icon={Clock3} tone="orange" />
        <Metric title="Cleared students" value={data?.cleared ?? 0} icon={CheckCircle2} tone="blue" />
      </section>

      {error || assignmentError ? <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error?.message || assignmentError?.message}</p> : null}

      <section className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]" aria-label="Assignment management">
        <Card className="overflow-hidden rounded-2xl py-0 shadow-sm">
          <CardHeader className="border-b px-5 py-5 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-lg tracking-tight">
              <FilePlus2 aria-hidden="true" className="size-5 text-emerald-600" />
              Create an assignment
            </CardTitle>
            <CardDescription>Publish instructions and a due date for a subject you teach.</CardDescription>
          </CardHeader>
          <CardContent className="p-5 sm:p-6">
            <form onSubmit={createAssignment} className="grid gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="assignment-subject">Subject</Label>
                <select
                  id="assignment-subject"
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={assignmentForm.subjectId}
                  onChange={(event) => setAssignmentForm((value) => ({ ...value, subjectId: event.target.value }))}
                  required
                >
                  <option value="">Select a subject</option>
                  {(assignmentData?.subjects ?? []).map((subject: { id: string; code: string; name: string }) => (
                    <option key={subject.id} value={subject.id}>{subject.code} — {subject.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="assignment-title">Assignment title</Label>
                <Input
                  id="assignment-title"
                  maxLength={120}
                  placeholder="e.g. Database normalization"
                  value={assignmentForm.title}
                  onChange={(event) => setAssignmentForm((value) => ({ ...value, title: event.target.value }))}
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="assignment-description">Instructions</Label>
                <Textarea
                  id="assignment-description"
                  maxLength={2000}
                  placeholder="Describe the work students need to complete."
                  value={assignmentForm.description}
                  onChange={(event) => setAssignmentForm((value) => ({ ...value, description: event.target.value }))}
                  rows={3}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="assignment-due-date">Due date and time</Label>
                <Input
                  id="assignment-due-date"
                  type="datetime-local"
                  value={assignmentForm.dueDate}
                  onChange={(event) => setAssignmentForm((value) => ({ ...value, dueDate: event.target.value }))}
                  required
                />
              </div>
              {assignmentErrorMessage ? <p role="alert" className="text-sm text-destructive">{assignmentErrorMessage}</p> : null}
              {assignmentMessage ? <p role="status" className="text-sm text-emerald-700">{assignmentMessage}</p> : null}
              <Button type="submit" className="rounded-xl" disabled={savingAssignment || !assignmentData?.subjects?.length}>
                {savingAssignment ? "Publishing…" : "Publish assignment"}
              </Button>
              {!assignmentData?.subjects?.length && !assignmentError ? (
                <p className="text-xs text-muted-foreground">The HOD must assign you to a subject before you can publish assignments.</p>
              ) : null}
            </form>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-2xl py-0 shadow-sm">
          <CardHeader className="border-b px-5 py-5 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-lg tracking-tight">
              <CalendarClock aria-hidden="true" className="size-5 text-emerald-600" />
              Published assignments
            </CardTitle>
            <CardDescription>Track due dates and download student submissions.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 p-5 sm:p-6">
            {(assignmentData?.items ?? []).map((assignment: {
              id: string
              title: string
              description: string
              dueDate: string
              subject: { code: string; name: string } | null
              submissionCount: number
              submissions: { studentId: string; name: string; rollNumber: string; fileName: string }[]
            }) => (
              <article key={assignment.id} className="rounded-xl border bg-card p-4 transition-shadow hover:shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold tracking-tight">{assignment.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {assignment.subject ? `${assignment.subject.code} · ${assignment.subject.name}` : "Subject"}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    {assignment.submissionCount} submitted
                  </span>
                </div>
                {assignment.description ? <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{assignment.description}</p> : null}
                <p className="mt-3 text-xs text-muted-foreground">
                  Due {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(assignment.dueDate))}
                </p>
                {assignment.submissions?.length ? (
                  <ul className="mt-3 grid gap-2 border-t pt-3">
                    {assignment.submissions.map((submission) => (
                      <li key={submission.studentId} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <span className="min-w-0 truncate">{submission.name} <span className="text-muted-foreground">· {submission.rollNumber}</span></span>
                        <a
                          href={`/api/assignments/${assignment.id}/submission?studentId=${encodeURIComponent(submission.studentId)}`}
                          className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                        >
                          <Download aria-hidden="true" className="size-4" />
                          {submission.fileName}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : <p className="mt-3 text-xs text-muted-foreground">No student submissions yet.</p>}
              </article>
            ))}
            {assignmentData && assignmentData.items.length === 0 ? (
              <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                Your published assignments will appear here.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <Card className="overflow-hidden rounded-2xl py-0 shadow-sm">
        <CardHeader className="border-b px-5 py-5 sm:px-6">
          <CardTitle className="text-lg tracking-tight">Student list & marks entry</CardTitle>
          <CardDescription>Review student progress and manage subject records.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
                <tr className="text-left">
                  <th className="whitespace-nowrap px-5 py-3 font-medium sm:px-6">Roll number</th>
                  <th className="whitespace-nowrap px-5 py-3 font-medium">Student name</th>
                  <th className="whitespace-nowrap px-5 py-3 font-medium">Subject</th>
                  <th className="whitespace-nowrap px-5 py-3 font-medium">Test avg (60)</th>
                  <th className="whitespace-nowrap px-5 py-3 font-medium">Assignment (40)</th>
                  <th className="whitespace-nowrap px-5 py-3 font-medium">Total</th>
                  <th className="whitespace-nowrap px-5 py-3 font-medium">Attendance</th>
                  <th className="whitespace-nowrap px-5 py-3 font-medium">Status</th>
                  <th className="whitespace-nowrap px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(data?.rows ?? []).map((row: any) => (
                  <tr key={row._id} className="border-t transition-colors hover:bg-muted/30">
                    <td className="whitespace-nowrap px-5 py-4 font-medium sm:px-6">{row.rollNumber}</td>
                    <td className="whitespace-nowrap px-5 py-4">{row.name}</td>
                    <td className="whitespace-nowrap px-5 py-4">{row.subjectCode} — {row.subjectName}</td>
                    <td className="whitespace-nowrap px-5 py-4">{row.testAvg}</td>
                    <td className="whitespace-nowrap px-5 py-4">{row.assignment}</td>
                    <td className="whitespace-nowrap px-5 py-4 font-semibold">{row.total}</td>
                    <td className="whitespace-nowrap px-5 py-4">{row.attendance}%</td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${row.status === "approved" || row.status === "cleared" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <Link href={`/staff/student/${row.studentId}`} className="font-medium text-primary hover:underline">
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data && data.rows?.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-muted-foreground">No students are assigned to your subjects yet.</p>
            ) : null}
          </div>
        </CardContent>
      </Card>
      <ChatAssistant role="staff" />
    </main>
  )
}

function Metric({
  title,
  value,
  icon: Icon,
  tone,
}: {
  title: string
  value: number
  icon: LucideIcon
  tone: "green" | "teal" | "orange" | "blue"
}) {
  return (
    <Card className={`dashboard-metric dashboard-metric--${tone} rounded-2xl py-0`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5">
        <div className="grid gap-2">
          <CardDescription className="text-xs font-medium">{title}</CardDescription>
          <CardTitle className="text-2xl font-semibold tracking-tight">{value}</CardTitle>
        </div>
        <div className="dashboard-metric-icon">
          <Icon aria-hidden="true" className="size-5" />
        </div>
      </CardHeader>
    </Card>
  )
}
