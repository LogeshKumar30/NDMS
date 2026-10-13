"use client"

import useSWR from "swr"
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChatAssistant } from "@/components/chat-assistant"
import { DashboardHeader } from "@/components/dashboard-header"
import { Input } from "@/components/ui/input"
import { BookOpen, CalendarClock, CheckCircle2, Clock3, Download, FileCheck2, GraduationCap, Upload } from "lucide-react"
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
  if (!response.ok) throw new Error(result.error || "Unable to load student dashboard.")
  return result
}

export default function StudentDashboard() {
  const { data, error: loadError, mutate } = useSWR("/api/student/overview", fetcher, { refreshInterval: 5000 })
  const {
    data: assignmentData,
    error: assignmentLoadError,
    mutate: mutateAssignments,
  } = useSWR("/api/assignments", fetcher, { refreshInterval: 15000 })
  const [actionError, setActionError] = useState("")
  const [actionNotice, setActionNotice] = useState("")
  const [uploadError, setUploadError] = useState("")
  const [uploadNotice, setUploadNotice] = useState("")
  const [uploadingId, setUploadingId] = useState("")

  async function submitAssignment(event: FormEvent<HTMLFormElement>, assignmentId: string) {
    event.preventDefault()
    setUploadingId(assignmentId)
    setUploadError("")
    setUploadNotice("")
    try {
      const form = event.currentTarget
      const response = await fetch(`/api/assignments/${assignmentId}/submission`, {
        method: "POST",
        body: new FormData(form),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Unable to submit the assignment.")
      form.reset()
      setUploadNotice("Your assignment was submitted successfully.")
      await mutateAssignments()
    } catch (cause) {
      setUploadError(cause instanceof Error ? cause.message : "Unable to submit the assignment.")
    } finally {
      setUploadingId("")
    }
  }

  async function requestApproval(path: string, label: string) {
    setActionError("")
    setActionNotice("")
    try {
      const response = await fetch(path, { method: "POST" })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || `Unable to request ${label}.`)
      setActionNotice(`${label} request submitted.`)
      await mutate()
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : `Unable to request ${label}.`)
    }
  }

  return (
    <main className="dashboard-page mx-auto grid min-h-svh max-w-7xl content-start gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <DashboardHeader title="Student dashboard" role="student" />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="Total subjects" value={data?.totalSubjects ?? 0} icon={BookOpen} tone="pink" />
        <Metric title="Completed" value={data?.completed ?? 0} icon={CheckCircle2} tone="green" />
        <Metric title="Pending" value={data?.pending ?? 0} icon={Clock3} tone="orange" />
        <Metric title="Final status" value={data?.finalStatus ?? "Pending"} icon={GraduationCap} tone="violet" />
      </section>

      {loadError || assignmentLoadError || actionError || uploadError ? <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{loadError?.message || assignmentLoadError?.message || actionError || uploadError}</p> : null}
      {actionNotice ? <p role="status" className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">{actionNotice}</p> : null}
      {uploadNotice ? <p role="status" className="rounded-xl border border-emerald-600/20 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{uploadNotice}</p> : null}

      <Card className="dashboard-progress overflow-hidden rounded-2xl py-0 shadow-sm">
        <div className="flex items-center justify-between gap-3 px-5 pt-5 sm:px-6">
          <p className="text-sm font-medium">Overall progress</p>
          <p className="text-sm font-semibold text-primary">
            {data?.totalSubjects ? Math.round((data.completed / data.totalSubjects) * 100) : 0}%
          </p>
        </div>
        <div
          className="mx-5 mt-3 h-2.5 overflow-hidden rounded-full bg-muted sm:mx-6"
          role="progressbar"
          aria-label="Approved subjects"
          aria-valuemin={0}
          aria-valuemax={data?.totalSubjects ?? 0}
          aria-valuenow={data?.completed ?? 0}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 transition-[width] duration-500"
            style={{
              width: `${data?.totalSubjects ? Math.round((data.completed / data.totalSubjects) * 100) : 0}%`,
            }}
          />
        </div>
        <p className="px-5 pb-4 pt-2 text-center text-xs text-muted-foreground sm:px-6">
          {data?.completed ?? 0} of {data?.totalSubjects ?? 0} subjects approved
        </p>
      </Card>

      <Card className="overflow-hidden rounded-2xl py-0 shadow-sm">
        <CardHeader className="border-b bg-card px-5 py-5 sm:px-6">
          <CardTitle className="text-lg tracking-tight">My academic progress</CardTitle>
          <CardDescription>Track your subject performance and approval status.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
                <tr className="text-left">
                  <th className="whitespace-nowrap px-5 py-3 font-medium sm:px-6">Code</th>
                  <th className="whitespace-nowrap px-5 py-3 font-medium">Subject</th>
                  <th className="whitespace-nowrap px-5 py-3 font-medium">Marks</th>
                  <th className="whitespace-nowrap px-5 py-3 font-medium">Attendance</th>
                  <th className="whitespace-nowrap px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {(data?.subjects ?? []).map((s: any) => (
                  <tr key={s.subjectId} className="border-t transition-colors hover:bg-muted/30">
                    <td className="whitespace-nowrap px-5 py-4 font-medium sm:px-6">{s.code}</td>
                    <td className="whitespace-nowrap px-5 py-4">{s.name}</td>
                    <td className="whitespace-nowrap px-5 py-4">{s.marks ?? "—"}<span className="text-muted-foreground">/100</span></td>
                    <td className="whitespace-nowrap px-5 py-4">{s.attendance ?? "—"}{s.attendance != null ? "%" : ""}</td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${s.status === "approved" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                        {s.status || "Pending"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data && data.subjects?.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-muted-foreground">
                {data.classConfigured
                  ? "No subjects have been assigned to your class yet."
                  : "Your semester class has not been configured yet. You can still access your account; ask your department to set up the class and subjects."}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 border-t bg-muted/20 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
            <div className="mr-auto grid gap-2 text-xs sm:min-w-56">
              <p className="flex items-center gap-2 text-muted-foreground">
                <span className="font-medium text-foreground">Pre-approval</span>
                <span className="rounded-full bg-background px-2 py-1 capitalize">{data?.preStatus === "not-requested" ? "Not requested" : data?.preStatus ?? "Loading"}</span>
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <span className="font-medium text-foreground">Final approval</span>
                <span className="rounded-full bg-background px-2 py-1 capitalize">{data?.finalStatus === "not-requested" ? "Not requested" : data?.finalStatus ?? "Loading"}</span>
              </p>
              {data && !data.canRequestPre && data.preStatus !== "pending" && data.preStatus !== "approved" ? (
                <p>{data.classConfigured && data.totalSubjects > 0
                  ? "Staff must approve all subjects before you can request pre-approval."
                  : "Pre-approval becomes available after your class subjects are set up and approved by staff."}</p>
              ) : null}
            </div>
            <Button className="rounded-xl" onClick={() => void requestApproval("/api/student/request-pre-approval", "Pre-approval")} disabled={!data?.canRequestPre}>
              {data?.preStatus === "pending" ? "Pre-approval pending" : data?.preStatus === "approved" ? "Pre-approved" : data?.preStatus === "rejected" ? "Resubmit pre-approval" : "Request pre-approval"}
            </Button>
            <Button className="rounded-xl" onClick={() => void requestApproval("/api/student/request-final-approval", "Final approval")} variant="secondary" disabled={!data?.canRequestFinal}>
              {data?.finalStatus === "pending" ? "Final approval pending" : data?.finalStatus === "approved" ? "Finally approved" : data?.finalStatus === "rejected" ? "Resubmit final approval" : "Request final approval"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-2xl py-0 shadow-sm">
        <CardHeader className="border-b px-5 py-5 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-lg tracking-tight">
            <FileCheck2 aria-hidden="true" className="size-5 text-pink-600" />
            My assignments
          </CardTitle>
          <CardDescription>Review the instructions and due dates, then submit your work as a file.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 p-5 sm:p-6">
          {(assignmentData?.items ?? []).map((assignment: {
            id: string
            title: string
            description: string
            dueDate: string
            subject: { code: string; name: string } | null
            submission: { fileName: string; submittedAt: string; isLate: boolean } | null
          }) => (
            <article key={assignment.id} className="rounded-xl border bg-card p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold tracking-tight">{assignment.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {assignment.subject ? `${assignment.subject.code} · ${assignment.subject.name}` : "Subject"}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${assignment.submission ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>
                  {assignment.submission ? "Submitted" : "Not submitted"}
                </span>
              </div>
              {assignment.description ? <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{assignment.description}</p> : null}
              <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarClock aria-hidden="true" className="size-4" />
                Due {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(assignment.dueDate))}
              </p>
              {assignment.submission ? (
                <div className="mt-3 flex flex-wrap items-center gap-3 border-t pt-3 text-sm">
                  <span className="text-muted-foreground">
                    Sent {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(assignment.submission.submittedAt))}
                    {assignment.submission.isLate ? " · Late" : ""}
                  </span>
                  <a
                    href={`/api/assignments/${assignment.id}/submission`}
                    className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                  >
                    <Download aria-hidden="true" className="size-4" />
                    Download your file
                  </a>
                </div>
              ) : null}
              <form onSubmit={(event) => void submitAssignment(event, assignment.id)} className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-end">
                <div className="grid min-w-0 flex-1 gap-1.5">
                  <label htmlFor={`assignment-file-${assignment.id}`} className="text-sm font-medium">
                    {assignment.submission ? "Replace submission" : "Choose a file"}
                  </label>
                  <Input
                    id={`assignment-file-${assignment.id}`}
                    name="file"
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
                    required
                    className="h-auto min-h-10 cursor-pointer py-1.5 text-sm"
                  />
                  <p className="text-xs text-muted-foreground">PDF, Office, text, JPG or PNG · maximum 5 MB</p>
                </div>
                <Button type="submit" className="shrink-0 rounded-xl" disabled={uploadingId === assignment.id}>
                  <Upload aria-hidden="true" />
                  {uploadingId === assignment.id ? "Submitting…" : assignment.submission ? "Replace file" : "Submit assignment"}
                </Button>
              </form>
            </article>
          ))}
          {assignmentData && assignmentData.items.length === 0 ? (
            <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
              No assignments are available for your class yet.
            </p>
          ) : null}
        </CardContent>
      </Card>
      <ChatAssistant role="student" />
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
  value: number | string
  icon: LucideIcon
  tone: "pink" | "green" | "orange" | "violet"
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
