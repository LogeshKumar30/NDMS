"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowRight, CheckCircle2, GraduationCap, ShieldCheck } from "lucide-react"
import { isFourDigitPassword, isValidRoleEmail, roleForEmail, ROLE_EMAIL_DOMAINS, type UserRole } from "@/lib/credentials"

export default function LoginPage() {
  const [role, setRole] = useState<UserRole>("student")
  const [signingUp, setSigningUp] = useState(false)
  const [name, setName] = useState("")
  const [department, setDepartment] = useState("")
  const [rollNumber, setRollNumber] = useState("")
  const [classId, setClassId] = useState("")
  const [classes, setClasses] = useState<Array<{ id: string; name: string; department: string; semester: number }>>([])
  const [loadingClasses, setLoadingClasses] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const router = useRouter()

  const departments = Array.from(new Set(classes.map((item) => item.department.trim()).filter(Boolean)))
  const departmentClasses = classes.filter(
    (item) => item.department.trim().toLowerCase() === department.trim().toLowerCase(),
  )

  useEffect(() => {
    if (!signingUp || role !== "student") return

    const controller = new AbortController()
    setLoadingClasses(true)
    fetch("/api/auth/classes", { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || "Could not load HOD class options.")
        setClasses(result.items ?? [])
      })
      .catch((cause) => {
        if (!controller.signal.aborted) {
          setError(cause instanceof Error ? cause.message : "Could not load HOD class options.")
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingClasses(false)
      })

    return () => controller.abort()
  }, [signingUp, role])

  async function onSignIn(e: React.FormEvent) {
    e.preventDefault()
    const accountRole = roleForEmail(email)
    if (!accountRole || !isValidRoleEmail(email, accountRole)) {
      setError("Use your campus email address with the correct student, staff, or HOD domain.")
      return
    }
    if (!isFourDigitPassword(password)) {
      setError("Password must contain exactly 4 digits.")
      return
    }

    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role: accountRole }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      if (data.user?.role === "hod") router.push("/hod")
      else if (data.user?.role === "staff") router.push("/staff")
      else router.push("/student")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setLoading(false)
    }
  }

  async function onSignUp(event: React.FormEvent) {
    event.preventDefault()
    if (!isValidRoleEmail(email, role)) {
      setError(`Use a valid ${role} email ending in @${ROLE_EMAIL_DOMAINS[role]}.`)
      return
    }
    if (!isFourDigitPassword(password)) {
      setError("Password must contain exactly 4 digits.")
      return
    }
    if (role === "student" && (!rollNumber.trim() || !classId)) {
      setError(!rollNumber.trim() ? "Enter your student roll number." : "Select a class listed by your HOD.")
      return
    }

    setLoading(true)
    setError("")
    setNotice("")
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role, department, rollNumber, classId: role === "student" ? classId : undefined }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Unable to create account.")

      setPassword("")
      setNotice("Your account was created. Sign in with your new email and 4-digit password.")
      setSigningUp(false)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create account.")
    } finally {
      setLoading(false)
    }
  }

  function chooseRole(nextRole: UserRole) {
    setRole(nextRole)
    setError("")
    setDepartment("")
    setClassId("")
    if (nextRole !== "student") {
      setClasses([])
    }
  }

  return (
    <main className="login-shell min-h-svh p-4 sm:p-8">
      <div className="login-frame mx-auto grid min-h-[calc(100svh-4rem)] max-w-7xl overflow-hidden rounded-[2rem] border bg-card shadow-2xl shadow-slate-950/10 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="login-hero relative hidden flex-col justify-between overflow-hidden p-10 text-primary-foreground lg:flex xl:p-14">
          <div className="login-orb login-orb--top absolute -right-28 -top-28 size-96 rounded-full" />
          <div className="login-orb login-orb--bottom absolute -bottom-40 -left-20 size-96 rounded-full" />
          <div className="relative flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-2xl border border-white/15 bg-white/10">
              <GraduationCap aria-hidden="true" className="size-6" />
            </div>
            <div>
              <p className="font-semibold tracking-wide">Campus Suite</p>
              <p className="text-xs text-white/65">Student clearance portal</p>
            </div>
          </div>

          <div className="relative max-w-lg">
            <p className="mb-4 inline-flex rounded-full border border-amber-200/25 bg-amber-200/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-amber-100">No Due Management</p>
            <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight xl:text-6xl">
              Every clearance.<br />One campus.
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-white/70">
              Follow your academic progress, see what needs attention, and move through approvals with confidence.
            </p>
            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4">
                <CheckCircle2 aria-hidden="true" className="mb-3 size-5 text-amber-200" />
                <p className="text-sm font-medium">Progress, made clear</p>
                <p className="mt-1 text-xs leading-5 text-white/60">See marks and approvals as they update.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4">
                <ShieldCheck aria-hidden="true" className="mb-3 size-5 text-amber-200" />
                <p className="text-sm font-medium">The right access</p>
                <p className="mt-1 text-xs leading-5 text-white/60">Purpose-built views for every campus role.</p>
              </div>
            </div>
          </div>

          <p className="relative text-xs text-white/50">A simpler way to stay on top of every approval.</p>
        </section>

        <section className="flex items-center justify-center px-5 py-8 sm:px-10 lg:px-12 xl:px-16">
          <div className="w-full max-w-[27rem]">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <GraduationCap aria-hidden="true" className="size-6" />
              </div>
              <div>
                <p className="font-semibold tracking-wide">Campus Suite</p>
                <p className="text-xs text-muted-foreground">No Due Management</p>
              </div>
            </div>

            <Card className="border-0 bg-transparent shadow-none">
              <CardHeader className="px-0 pb-7">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{signingUp ? "Join your campus" : "Campus access"}</p>
                <CardTitle className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                {signingUp ? "Create your account" : "Sign in to continue"}
                </CardTitle>
                <CardDescription className="mt-1 max-w-sm text-sm leading-6">
                {signingUp
                  ? "Register with your campus email format and create a 4-digit password."
                  : "Sign in with an account created by you or your administrator."}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                <div role="tablist" aria-label="Account type" className="grid h-12 w-full grid-cols-3 rounded-2xl border bg-muted/70 p-1">
                  {(["student", "staff", "hod"] as const).map((item) => (
                    <button
                      key={item}
                      type="button"
                      role="tab"
                      aria-selected={role === item}
                      onClick={() => chooseRole(item)}
                      className={`rounded-xl text-sm font-semibold capitalize transition-all ${role === item ? "bg-card text-primary shadow-sm ring-1 ring-black/5" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      {item === "hod" ? "HOD" : item}
                    </button>
                  ))}
                </div>

                <form onSubmit={signingUp ? onSignUp : onSignIn} className="mt-6 grid gap-4">
                      {error ? <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}
                      {notice ? <p role="status" className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary">{notice}</p> : null}
                      {signingUp ? (
                        <div className="grid gap-2">
                          <Label htmlFor="signup-name">Full name</Label>
                          <Input id="signup-name" value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={80} required />
                        </div>
                      ) : null}
                      <div className="grid gap-2">
                        <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder={role === "student" ? "name@stuedu24.com" : `name@${ROLE_EMAIL_DOMAINS[role]}`}
                          value={email}
                          onChange={(e) => {
                            const nextEmail = e.target.value
                            setEmail(nextEmail)
                            const detectedRole = roleForEmail(nextEmail)
                            if (detectedRole && detectedRole !== role) chooseRole(detectedRole)
                          }}
                          className="h-11 rounded-xl px-3"
                          autoComplete="username"
                          aria-describedby="email-hint"
                          required
                        />
                        <p id="email-hint" className="text-xs text-muted-foreground">
                          {role === "student"
                            ? "Student email must include a 2-digit year, e.g. name@stuedu24.com."
                            : `Use your ${role} email ending in @${ROLE_EMAIL_DOMAINS[role]}.`}
                        </p>
                      </div>
                      {signingUp && role === "student" ? (
                        <>
                          <div className="grid gap-2">
                            <Label htmlFor="signup-roll-number">Student roll number</Label>
                            <Input id="signup-roll-number" value={rollNumber} onChange={(event) => setRollNumber(event.target.value)} maxLength={40} required />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="signup-department">Department</Label>
                            <select
                              id="signup-department"
                              value={department}
                              onChange={(event) => {
                                setDepartment(event.target.value)
                                setClassId("")
                              }}
                              className="h-11 rounded-xl border bg-background px-3 text-sm shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              required
                              disabled={loadingClasses || departments.length === 0}
                            >
                              <option value="">{loadingClasses ? "Loading departments..." : "Select your department"}</option>
                              {departments.map((item) => <option key={item} value={item}>{item}</option>)}
                            </select>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="signup-class">Class</Label>
                            <select
                              id="signup-class"
                              value={classId}
                              onChange={(event) => setClassId(event.target.value)}
                              className="h-11 rounded-xl border bg-background px-3 text-sm shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              required
                              disabled={loadingClasses || !department}
                            >
                              <option value="">{department ? "Select your class" : "Choose a department first"}</option>
                              {departmentClasses.map((item) => (
                                <option key={item.id} value={item.id}>{item.name} · Semester {item.semester}</option>
                              ))}
                            </select>
                            {departments.length === 0 && !loadingClasses ? (
                              <p className="text-xs text-muted-foreground">No classes are configured yet. Ask your HOD to create classes first.</p>
                            ) : null}
                          </div>
                        </>
                      ) : null}
                      {signingUp && role !== "student" ? (
                        <div className="grid gap-2">
                          <Label htmlFor="signup-department">Department</Label>
                          <Input id="signup-department" value={department} onChange={(event) => setDepartment(event.target.value)} maxLength={100} placeholder="Information Technology" />
                        </div>
                      ) : null}
                      <div className="grid gap-2">
                        <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="4-digit password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value.replace(/\D/g, "").slice(0, 4))}
                          className="h-11 rounded-xl px-3"
                          inputMode="numeric"
                          pattern="[0-9]{4}"
                          minLength={4}
                          maxLength={4}
                          autoComplete={signingUp ? "new-password" : "current-password"}
                          aria-describedby="password-hint"
                          required
                        />
                        <p id="password-hint" className="text-xs text-muted-foreground">
                          Enter exactly 4 digits.
                        </p>
                      </div>
                      <Button type="submit" disabled={loading} className="mt-2 h-12 w-full rounded-xl text-sm font-semibold shadow-lg shadow-primary/15">
                        {loading ? "Please wait..." : <>{signingUp ? "Create account" : "Sign in"} <ArrowRight aria-hidden="true" className="ml-2 size-4" /></>}
                      </Button>
                </form>

                <div className="mt-6 text-center text-sm">
                  <span className="text-muted-foreground">{signingUp ? "Already registered? " : "New to the portal? "}</span>
                  <button type="button" className="font-semibold text-primary underline-offset-4 hover:underline" onClick={() => { setSigningUp((current) => !current); setError(""); setNotice("") }}>
                    {signingUp ? "Sign in" : "Create an account"}
                  </button>
                </div>

                {!signingUp ? (
                  <div className="mt-7 flex items-start gap-3 rounded-2xl border border-primary/10 bg-primary/[0.035] p-4">
                    <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
                    <p className="text-xs leading-5 text-muted-foreground">Your campus account is protected. Dashboard access is based on your assigned role.</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
            <p className="mt-6 text-center text-xs text-muted-foreground">Secure access for your campus community</p>
          </div>
        </section>
      </div>
    </main>
  )
}
