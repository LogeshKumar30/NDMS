"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DashboardActions() {
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)
  const [error, setError] = useState("")

  async function signOut() {
    setSigningOut(true)
    setError("")
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" })
      if (!response.ok) throw new Error("Sign out failed.")
      router.replace("/login")
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Sign out failed.")
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <div className="grid justify-items-end gap-1">
      <Button type="button" variant="outline" className="rounded-xl" onClick={() => void signOut()} disabled={signingOut}>
        <LogOut aria-hidden="true" />
        {signingOut ? "Signing out…" : "Sign out"}
      </Button>
      {error ? <span role="alert" className="text-xs text-destructive">{error}</span> : null}
    </div>
  )
}
