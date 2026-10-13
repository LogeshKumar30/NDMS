"use client"

import { useEffect, useState, type ReactNode } from "react"
import { CalendarDays, GraduationCap } from "lucide-react"
import { DashboardActions } from "@/components/dashboard-actions"

type DashboardRole = "student" | "staff" | "hod"

const roleLabels: Record<DashboardRole, string> = {
  student: "Student dashboard",
  staff: "Faculty & advisor",
  hod: "Head of department",
}

export function DashboardHeader({
  title,
  role,
  children,
}: {
  title: string
  role: DashboardRole
  children?: ReactNode
}) {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    const updateTime = () => setNow(new Date())
    updateTime()
    const interval = window.setInterval(updateTime, 30_000)
    return () => window.clearInterval(interval)
  }, [])

  const dateLabel = now
    ? new Intl.DateTimeFormat(undefined, { weekday: "long", month: "short", day: "numeric" }).format(now)
    : "Loading date…"
  const timeLabel = now
    ? new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(now)
    : ""

  return (
    <header className={`dashboard-header dashboard-header--${role}`}>
      <div className="flex min-w-0 items-center gap-3">
        <div className="dashboard-brand-mark">
          <GraduationCap aria-hidden="true" className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">No Due Management System</p>
          <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{roleLabels[role]}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-3">
        <div className="dashboard-date" aria-live="off">
          <CalendarDays aria-hidden="true" className="size-4 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium">{dateLabel}</p>
            <p className="text-xs text-muted-foreground">{timeLabel ? `Local time · ${timeLabel}` : "Updating local time"}</p>
          </div>
        </div>
        {children}
        <DashboardActions />
      </div>
    </header>
  )
}
