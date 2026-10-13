"use client"

import type React from "react"

import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { ChatAssistant } from "@/components/chat-assistant"
import { DashboardHeader } from "@/components/dashboard-header"
import { BookOpen, CheckCircle2, Clock3, Download, Users } from "lucide-react"
import type { LucideIcon } from "lucide-react"

const fetcher = async (url: string) => {
  const response = await fetch(url)
  const result = await response.json()
  if (!response.ok) throw new Error(result.error || "Unable to load dashboard data.")
  return result
}
const dashboardSections = ["classes", "subjects", "assignments", "approvals", "accounts"] as const
type DashboardSection = (typeof dashboardSections)[number]

export default function HODDashboard() {
  const { data: classes, error: classesError, mutate: refreshClasses } = useSWR("/api/classes", fetcher)
  const { data: subjects, error: subjectsError, mutate: refreshSubjects } = useSWR("/api/subjects", fetcher)
  const { data: stats, error: statsError } = useSWR("/api/hod/stats", fetcher, { refreshInterval: 5000 })
  const [section, setSection] = useState<DashboardSection>("classes")
  const [actionError, setActionError] = useState("")
  const [actionNotice, setActionNotice] = useState("")

  const [creatingClass, setCreatingClass] = useState({ name: "", department: "", batch: "", year: 1, sem: 1 })
  const [creatingSubject, setCreatingSubject] = useState({ code: "", name: "", classId: "" })

  async function createClass(e: React.FormEvent) {
    e.preventDefault()
    setActionError("")
    setActionNotice("")
    try {
      const response = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(creatingClass),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Unable to create class.")
      setCreatingClass({ name: "", department: "", batch: "", year: 1, sem: 1 })
      setActionNotice("Class created.")
      await refreshClasses()
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Unable to create class.")
    }
  }

  async function createSubject(e: React.FormEvent) {
    e.preventDefault()
    setActionError("")
    setActionNotice("")
    try {
      const response = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(creatingSubject),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Unable to create subject.")
      setCreatingSubject({ code: "", name: "", classId: "" })
      setActionNotice("Subject created.")
      await refreshSubjects()
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Unable to create subject.")
    }
  }

  return (
    <main className="dashboard-page mx-auto grid min-h-svh max-w-7xl content-start gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <DashboardHeader title="HOD dashboard" role="hod" />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Department overview">
        <Metric title="Active classes" value={stats?.activeClasses ?? 0} icon={BookOpen} tone="violet" />
        <Metric title="Enrolled students" value={stats?.students ?? 0} icon={Users} tone="blue" />
        <Metric title="Students cleared" value={stats?.clearedStudents ?? 0} icon={CheckCircle2} tone="green" />
        <Metric title="Pending approvals" value={stats?.pendingApprovals ?? 0} icon={Clock3} tone="orange" />
      </section>

      <nav role="tablist" aria-label="HOD dashboard sections" className="grid grid-cols-2 gap-2 rounded-2xl border bg-card p-2 shadow-sm sm:grid-cols-3 xl:grid-cols-5">
        {dashboardSections.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={section === item}
            onClick={() => setSection(item)}
            className={`min-h-10 rounded-xl px-4 py-2.5 text-sm font-medium capitalize transition-colors ${section === item ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
          >
            {item}
          </button>
        ))}
      </nav>

      {actionError || classesError || subjectsError || statsError ? (
        <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {actionError || classesError?.message || subjectsError?.message || statsError?.message}
        </p>
      ) : null}
      {actionNotice ? <p role="status" className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">{actionNotice}</p> : null}

      <div role="tabpanel" className="mt-5">
        {section === "classes" ? <section className="grid gap-5">
          <Card className="rounded-2xl py-0 shadow-sm">
            <CardHeader className="border-b px-5 py-5 sm:px-6">
              <CardTitle className="text-lg tracking-tight">Create class</CardTitle>
              <CardDescription>Create a class with year/sem details</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <form onSubmit={createClass} className="grid gap-4 p-5 sm:p-6 md:grid-cols-5">
                <div className="grid gap-1">
                  <Label>Name</Label>
                  <Input
                    value={creatingClass.name}
                    onChange={(e) => setCreatingClass((v) => ({ ...v, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="grid gap-1">
                  <Label>Department</Label>
                  <Input
                    value={creatingClass.department}
                    onChange={(e) => setCreatingClass((v) => ({ ...v, department: e.target.value }))}
                    required
                  />
                </div>
                <div className="grid gap-1">
                  <Label>Batch</Label>
                  <Input
                    placeholder="2022-2026"
                    value={creatingClass.batch}
                    onChange={(e) => setCreatingClass((v) => ({ ...v, batch: e.target.value }))}
                    required
                  />
                </div>
                <div className="grid gap-1">
                  <Label>Year</Label>
                  <Input
                    type="number"
                    min={1}
                    max={4}
                    value={creatingClass.year}
                    onChange={(e) => setCreatingClass((v) => ({ ...v, year: Number(e.target.value) }))}
                    required
                  />
                </div>
                <div className="grid gap-1">
                  <Label>Semester</Label>
                  <select
                    className="h-10 rounded-md border bg-background px-3 text-sm"
                    value={creatingClass.sem}
                    onChange={(e) => setCreatingClass((v) => ({ ...v, sem: Number(e.target.value) }))}
                    required
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((semester) => (
                      <option key={semester} value={semester}>Semester {semester}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-5">
                  <Button type="submit">Create</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(classes?.items ?? []).map((c: any) => (
              <Card key={c._id} className="rounded-2xl py-0 shadow-sm transition-shadow hover:shadow-md">
                <CardHeader className="p-5">
                  <CardTitle className="text-lg">{c.name}</CardTitle>
                  <CardDescription>
                    {c.department} • Batch: {c.batch} • Sem: {c.sem}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm">
                  <div className="flex items-center justify-between">
                    <div>Students: {c.stats?.students ?? 0}</div>
                    <div className="text-green-600">Cleared: {c.stats?.cleared ?? 0}</div>
                    <div className="text-orange-600">Pending: {c.stats?.pending ?? 0}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>
        </section> : null}

        {section === "subjects" ? <section className="grid gap-5">
          <Card className="rounded-2xl py-0 shadow-sm">
            <CardHeader className="border-b px-5 py-5 sm:px-6">
              <CardTitle className="text-lg tracking-tight">Create subject</CardTitle>
              <CardDescription>Create a subject for a class</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <form onSubmit={createSubject} className="grid gap-4 p-5 sm:p-6 md:grid-cols-4">
                <div className="grid gap-1">
                  <Label>Code</Label>
                  <Input
                    value={creatingSubject.code}
                    onChange={(e) => setCreatingSubject((v) => ({ ...v, code: e.target.value }))}
                    required
                  />
                </div>
                <div className="grid gap-1">
                  <Label>Name</Label>
                  <Input
                    value={creatingSubject.name}
                    onChange={(e) => setCreatingSubject((v) => ({ ...v, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="grid gap-1 md:col-span-2">
                  <Label>Class</Label>
                  <select
                    className="border rounded-md h-9 px-2"
                    value={creatingSubject.classId}
                    onChange={(e) => setCreatingSubject((v) => ({ ...v, classId: e.target.value }))}
                    required
                  >
                    <option value="">Select class</option>
                    {(classes?.items ?? []).map((c: any) => (
                      <option key={c._id} value={c._id}>
                        {c.name} • {c.sem}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-4">
                  <Button type="submit">Create</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(subjects?.items ?? []).map((s: any) => (
              <Card key={s._id} className="rounded-2xl py-0 shadow-sm transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle className="text-base">
                    {s.code} — {s.name}
                  </CardTitle>
                  <CardDescription>Class: {s.className}</CardDescription>
                </CardHeader>
                <CardContent className="text-sm">
                  <div>Staff: {s.staffName ?? "Unassigned"}</div>
                  <div>
                    Completed: {s.stats?.completed ?? 0} • Pending: {s.stats?.pending ?? 0}
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>
        </section> : null}

        {section === "assignments" ? (
          <Card className="rounded-2xl py-0 shadow-sm">
            <CardHeader className="px-5 py-5 sm:px-6">
              <CardTitle className="text-lg tracking-tight">Assignments management</CardTitle>
              <CardDescription>Assign staff to subjects and designate class advisors</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <AssignStaffCard />
              <AssignAdvisorCard />
            </CardContent>
          </Card>
        ) : null}

        {section === "approvals" ? <HODApprovals /> : null}

        {section === "accounts" ? <AccountManagement /> : null}
      </div>
      <ChatAssistant role="hod" />
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
  tone: "violet" | "blue" | "green" | "orange"
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

function AccountManagement() {
  const { data, mutate } = useSWR("/api/users", fetcher)
  const { data: classes } = useSWR("/api/classes", fetcher)
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student" as "student" | "staff" | "hod",
    department: "",
    classId: "",
    rollNumber: "",
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [saving, setSaving] = useState(false)
  const [activatingId, setActivatingId] = useState("")
  const [exportingRole, setExportingRole] = useState<"student" | "staff" | "">("")

  async function createAccount(event: React.FormEvent) {
    event.preventDefault()
    setError("")
    setSuccess("")
    setSaving(true)
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || "Unable to create account.")
      }
      setForm({ name: "", email: "", password: "", role: form.role, department: "", classId: "", rollNumber: "" })
      setSuccess("Account created successfully.")
      await mutate()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create account.")
    } finally {
      setSaving(false)
    }
  }

  async function approveHod(id: string) {
    setError("")
    setSuccess("")
    setActivatingId(id)
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountStatus: "active" }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Unable to approve account.")
      setSuccess("HOD account approved.")
      await mutate()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to approve account.")
    } finally {
      setActivatingId("")
    }
  }

  async function downloadAccounts(role: "student" | "staff") {
    setError("")
    setSuccess("")
    setExportingRole(role)
    try {
      const response = await fetch(`/api/users/export?role=${role}`)
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || `Unable to download ${role} records.`)
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${role}-records-${new Date().toISOString().slice(0, 10)}.xlsx`
      document.body.append(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : `Unable to download ${role} records.`)
    } finally {
      setExportingRole("")
    }
  }

  return (
    <section className="grid gap-5">
      <Card className="rounded-2xl py-0 shadow-sm">
        <CardHeader className="border-b px-5 py-5 sm:px-6">
          <CardTitle className="text-lg tracking-tight">Create managed account</CardTitle>
          <CardDescription>Create campus accounts with valid role emails and 4-digit passwords.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <form onSubmit={createAccount} className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
            {error ? <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive sm:col-span-2">{error}</p> : null}
            {success ? <p role="status" className="rounded-xl border border-emerald-600/20 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 sm:col-span-2">{success}</p> : null}
            <div className="grid gap-2">
              <Label htmlFor="account-name">Full name</Label>
              <Input id="account-name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} minLength={2} maxLength={80} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="account-role">Account role</Label>
              <select
                id="account-role"
                className="h-10 rounded-md border bg-background px-3 text-sm"
                value={form.role}
                onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as typeof current.role }))}
              >
                <option value="student">Student</option>
                <option value="staff">Staff</option>
                <option value="hod">HOD</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="account-email">Email address</Label>
              <Input
                id="account-email"
                type="email"
                placeholder={form.role === "student" ? "name@stuedu24.com" : form.role === "staff" ? "name@staffedu.com" : "name@hodedu.com"}
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                required
              />
              <p className="text-xs text-muted-foreground">
                {form.role === "student" ? "Student email must include a 2-digit year, e.g. stuedu24.com." : `Email must end in @${form.role === "staff" ? "staffedu.com" : "hodedu.com"}.`}
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="account-password">Temporary 4-digit password</Label>
              <Input
                id="account-password"
                type="password"
                inputMode="numeric"
                pattern="[0-9]{4}"
                minLength={4}
                maxLength={4}
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value.replace(/\D/g, "").slice(0, 4) }))}
                required
              />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="account-department">Department</Label>
              <Input id="account-department" value={form.department} onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))} maxLength={100} placeholder="Information Technology" />
            </div>
            {form.role === "student" ? (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="account-roll-number">Student roll number</Label>
                  <Input id="account-roll-number" value={form.rollNumber} onChange={(event) => setForm((current) => ({ ...current, rollNumber: event.target.value }))} maxLength={40} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="account-class">Student class</Label>
                  <select
                    id="account-class"
                    className="h-10 rounded-md border bg-background px-3 text-sm"
                    value={form.classId}
                    onChange={(event) => setForm((current) => ({ ...current, classId: event.target.value }))}
                    required
                  >
                    <option value="">Select a class</option>
                    {(classes?.items ?? []).map((item: any) => (
                      <option key={item._id} value={item._id}>{item.name} · Semester {item.sem}</option>
                    ))}
                  </select>
                </div>
              </>
            ) : null}
            <div className="sm:col-span-2">
              <Button type="submit" className="rounded-xl" disabled={saving}>
                {saving ? "Creating account..." : "Create account"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-2xl py-0 shadow-sm">
        <CardHeader className="flex flex-col gap-4 border-b px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <CardTitle className="text-lg tracking-tight">Managed accounts</CardTitle>
            <CardDescription>Accounts currently registered in the system.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => void downloadAccounts("staff")} disabled={exportingRole !== ""}>
              <Download aria-hidden="true" className="mr-2 size-4" />
              {exportingRole === "staff" ? "Downloading..." : "Download staff Excel"}
            </Button>
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => void downloadAccounts("student")} disabled={exportingRole !== ""}>
              <Download aria-hidden="true" className="mr-2 size-4" />
              {exportingRole === "student" ? "Downloading..." : "Download student Excel"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium sm:px-6">Name</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Department</th>
                  <th className="px-5 py-3 font-medium">Account status</th>
                  <th className="px-5 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {(data?.items ?? []).map((user: any) => (
                  <tr key={user._id} className="border-t">
                    <td className="whitespace-nowrap px-5 py-3 font-medium sm:px-6">{user.name}</td>
                    <td className="whitespace-nowrap px-5 py-3">{user.email}</td>
                    <td className="whitespace-nowrap px-5 py-3 capitalize">{user.role}</td>
                    <td className="whitespace-nowrap px-5 py-3">{user.department || "—"}</td>
                    <td className="whitespace-nowrap px-5 py-3 capitalize">{user.accountStatus || "active"}</td>
                    <td className="whitespace-nowrap px-5 py-3">
                      {user.role === "hod" && user.accountStatus === "pending" ? (
                        <Button size="sm" disabled={activatingId === user._id} onClick={() => void approveHod(user._id)}>
                          {activatingId === user._id ? "Approving…" : "Approve HOD"}
                        </Button>
                      ) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data && data.items?.length === 0 ? <p className="px-6 py-8 text-center text-sm text-muted-foreground">No accounts found.</p> : null}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

function AssignStaffCard() {
  const { data: subjects, error: subjectsError, mutate } = useSWR("/api/subjects", fetcher)
  const { data: staff, error: staffError } = useSWR("/api/users?role=staff", fetcher)
  const [sel, setSel] = useState({ subjectId: "", staffId: "" })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [saving, setSaving] = useState(false)

  async function assign() {
    setError("")
    setSuccess("")
    setSaving(true)
    try {
      const response = await fetch("/api/assignments/subject-staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sel),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Unable to assign staff.")
      setSel({ subjectId: "", staffId: "" })
      setSuccess("Staff assigned to the subject.")
      await mutate()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to assign staff.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assign Staff to Subject</CardTitle>
        <CardDescription>Link faculty to specific subjects</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        {error || subjectsError || staffError ? <p role="alert" className="text-sm text-destructive">{error || subjectsError?.message || staffError?.message}</p> : null}
        {success ? <p role="status" className="text-sm text-primary">{success}</p> : null}
        <Label>Subject</Label>
        <select
          className="border rounded-md h-9 px-2"
          value={sel.subjectId}
          onChange={(e) => setSel((v) => ({ ...v, subjectId: e.target.value }))}
        >
          <option value="">Select subject</option>
          {(subjects?.items ?? []).map((s: any) => (
            <option key={s._id} value={s._id}>
              {s.code} — {s.name}
            </option>
          ))}
        </select>
        <Label>Staff</Label>
        <select
          className="border rounded-md h-9 px-2"
          value={sel.staffId}
          onChange={(e) => setSel((v) => ({ ...v, staffId: e.target.value }))}
        >
          <option value="">Select staff</option>
          {(staff?.items ?? []).map((u: any) => (
            <option key={u._id} value={u._id}>
              {u.name} ({u.email})
            </option>
          ))}
        </select>
        <Button onClick={() => void assign()} disabled={saving || !sel.subjectId || !sel.staffId}>
          {saving ? "Assigning…" : "Create Assignment"}
        </Button>
      </CardContent>
    </Card>
  )
}

function AssignAdvisorCard() {
  const { data: classes, error: classesError, mutate } = useSWR("/api/classes", fetcher)
  const { data: staff, error: staffError } = useSWR("/api/users?role=staff", fetcher)
  const [sel, setSel] = useState({ classId: "", advisorId: "" })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [saving, setSaving] = useState(false)

  async function assign() {
    setError("")
    setSuccess("")
    setSaving(true)
    try {
      const response = await fetch("/api/assignments/class-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sel),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Unable to assign advisor.")
      setSel({ classId: "", advisorId: "" })
      setSuccess("Class advisor assigned.")
      await mutate()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to assign advisor.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assign Class Advisor</CardTitle>
        <CardDescription>Designate faculty as class advisors</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        {error || classesError || staffError ? <p role="alert" className="text-sm text-destructive">{error || classesError?.message || staffError?.message}</p> : null}
        {success ? <p role="status" className="text-sm text-primary">{success}</p> : null}
        <Label>Class</Label>
        <select
          className="border rounded-md h-9 px-2"
          value={sel.classId}
          onChange={(e) => setSel((v) => ({ ...v, classId: e.target.value }))}
        >
          <option value="">Select class</option>
          {(classes?.items ?? []).map((c: any) => (
            <option key={c._id} value={c._id}>
              {c.name} • Sem {c.sem}
            </option>
          ))}
        </select>
        <Label>Advisor</Label>
        <select
          className="border rounded-md h-9 px-2"
          value={sel.advisorId}
          onChange={(e) => setSel((v) => ({ ...v, advisorId: e.target.value }))}
        >
          <option value="">Select staff</option>
          {(staff?.items ?? []).map((u: any) => (
            <option key={u._id} value={u._id}>
              {u.name} ({u.email})
            </option>
          ))}
        </select>
        <Button onClick={() => void assign()} disabled={saving || !sel.classId || !sel.advisorId}>
          {saving ? "Assigning…" : "Assign Advisor"}
        </Button>
      </CardContent>
    </Card>
  )
}

function HODApprovals() {
  const { data, error: loadError, mutate } = useSWR("/api/hod/approvals", fetcher, { refreshInterval: 5000 })
  const [error, setError] = useState("")
  const [workingId, setWorkingId] = useState("")
  async function act(type: "approve" | "reject", id: string, requestType: "pre" | "final" | "leave" = "leave") {
    setError("")
    setWorkingId(id)
    try {
      const response = await fetch(`/api/hod/approvals/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: type, type: requestType }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Unable to update request.")
      await mutate()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update request.")
    } finally {
      setWorkingId("")
    }
  }
  return (
    <section className="grid gap-4">
      {error || loadError ? <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error || loadError?.message}</p> : null}
      <Card>
        <CardHeader>
          <CardTitle>Approvals Management</CardTitle>
          <CardDescription>Review pending final approvals and leave requests</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat title="Pending subject records" value={data?.pendingStaff ?? 0} />
            <Stat title="Pre-Approvals" value={data?.preApprovals ?? 0} />
            <Stat title="Final Approvals" value={data?.finalApprovals ?? 0} />
            <Stat title="Leave Requests" value={data?.leaveRequests ?? 0} />
          </div>
          <div className="grid gap-2">
            <h3 className="font-medium">Final approval requests</h3>
            <div className="divide-y rounded-md border">
              {(data?.approvalRequests ?? []).map((request: any) => (
                <div key={request._id} className="flex flex-wrap items-center justify-between gap-3 p-3 text-sm">
                  <div>
                    <div className="font-medium">{request.studentName || "Student"}</div>
                    <div className="text-muted-foreground">{request.type === "pre" ? "Pre-approval" : "Final approval"} · {request.email || "Student account"} · {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : "Date not available"}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button disabled={workingId === request._id} variant="secondary" onClick={() => void act("approve", request._id, request.type)}>Approve</Button>
                    <Button disabled={workingId === request._id} variant="destructive" onClick={() => void act("reject", request._id, request.type)}>Reject</Button>
                  </div>
                </div>
              ))}
              {data && data.approvalRequests?.length === 0 ? <p className="p-4 text-sm text-muted-foreground">No approval requests are waiting.</p> : null}
            </div>
          </div>
          <div className="grid gap-2">
            <h3 className="font-medium">Leave Requests</h3>
            <div className="rounded-md border divide-y">
              {(data?.leaves ?? []).map((l: any) => (
                <div key={l._id} className="flex items-center justify-between p-3 text-sm">
                  <div>
                    <div className="font-medium">{l.studentName}</div>
                    <div className="text-muted-foreground">
                      {l.reason} • {l.startDate?.slice(0, 10)} to {l.endDate?.slice(0, 10)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button disabled={workingId === l._id} variant="secondary" onClick={() => void act("approve", l._id)}>
                      Approve
                    </Button>
                    <Button disabled={workingId === l._id} variant="destructive" onClick={() => void act("reject", l._id)}>
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  )
}
