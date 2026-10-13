import { getSession, requireRole } from "@/lib/auth"

type Role = "student" | "staff" | "hod"

type GeminiInteraction = {
  output_text?: string
  steps?: Array<{
    type?: string
    content?: Array<{ type?: string; text?: string }>
  }>
}

const roleInstructions: Record<Role, string> = {
  student:
    "The user is a student. Help with subjects, marks, attendance, pre-approval, final approval, and no-due status.",
  staff:
    "The user is a staff member. Help with student records, marks, attendance, subject approvals, and clearance.",
  hod:
    "The user is an HOD. Help with classes, subjects, staff/advisor assignments, approval requests, and clearance.",
}

const systemInstruction = `You are the No Due Management System help assistant.
Be concise, helpful, and use plain language. Answer questions about this application using these features: students can view subject marks, attendance, and statuses and request pre-approval once all subjects are approved; final approval is available after pre-approval is approved; staff can review student records; HODs manage classes, subjects, assignments, and approvals. You can also generate requested text such as emails, announcements, study plans, and summaries. Do not claim to see a user's account, database, or live approval status. Never claim to perform an action in the app.`

function getOfflineGuidance(role: Role, question: string) {
  const text = question.toLowerCase()
  const has = (...terms: string[]) => terms.some((term) => text.includes(term))

  if (has("pre-approval", "pre approval", "preapproval")) {
    return role === "student"
      ? "Once all your subjects are approved, use “Request Pre-Approval” on your Student Dashboard. The button becomes available when every subject is complete."
      : "Students can request pre-approval after all their subjects are approved. Review requests in the Approvals area."
  }
  if (has("final approval", "final status")) {
    return role === "student"
      ? "After your pre-approval is approved, use “Request Final Approval” on your Student Dashboard. Your final status appears in the dashboard summary."
      : "Final approval follows approved pre-approval. Review the request in the Approvals area."
  }
  if (has("mark", "score", "attendance", "subject")) {
    return role === "student"
      ? "Your Student Dashboard lists your subject marks, attendance, and approval status. Contact the assigned staff member if information is missing or incorrect."
      : role === "staff"
        ? "Use the student list on your Staff Dashboard to review progress. Open a student's Edit link to update their subject record."
        : "Review subject progress from the Classes and Approvals areas. Staff manage marks and attendance for their assigned subjects."
  }
  if (has("class", "batch", "semester", "department")) {
    return role === "hod"
      ? "Use the Classes tab to create and review classes. Enter the class name, department, batch, year, and semester."
      : "Class and batch setup is managed by the HOD. Contact your HOD if your class information is missing."
  }
  if (has("assignment", "assign staff", "advisor")) {
    return role === "hod"
      ? "Open the Assignments tab to assign staff to subjects and designate class advisors."
      : "Staff and class-advisor assignments are managed by the HOD."
  }
  if (has("approval", "pending", "approve", "clear", "no due", "status")) {
    return role === "student"
      ? "Your Student Dashboard shows completed and pending subjects plus your final status. Complete pending subject approvals before requesting pre-approval and final approval."
      : role === "staff"
        ? "The Staff Dashboard shows pending approvals and cleared students. Review each student's record to check subject status."
        : "Use the Approvals tab to review student requests. The HOD Dashboard also shows class and clearance information."
  }
  return "I can help with subjects, marks, attendance, approvals, classes, assignments, and no-due status. Try asking about one of those topics."
}

export async function POST(request: Request) {
  const session = await getSession()
  const unauthorized = requireRole(session, ["student", "staff", "hod"])
  if (unauthorized) return unauthorized

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Send a valid JSON message." }, { status: 400 })
  }

  if (typeof body !== "object" || body === null || !("message" in body)) {
    return Response.json({ error: "A message is required." }, { status: 400 })
  }

  const message = body.message
  if (typeof message !== "string" || !message.trim()) {
    return Response.json({ error: "A message is required." }, { status: 400 })
  }
  if (message.length > 500) {
    return Response.json({ error: "Messages must be 500 characters or fewer." }, { status: 400 })
  }

  const role = session?.role
  if (role !== "student" && role !== "staff" && role !== "hod") {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return Response.json({
      reply: getOfflineGuidance(role, message.trim()),
      notice: "AI responses are not configured. Showing built-in No Due guidance.",
      source: "offline",
    })
  }

  try {
    const geminiResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        model: "gemini-3.8-flash",
        input: message.trim(),
        system_instruction: `${systemInstruction}\n${roleInstructions[role]}`,
        generation_config: { thinking_level: "low" },
        store: false,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    })

    if (!geminiResponse.ok) {
      const status = geminiResponse.status
      const providerError = await geminiResponse.text()
      console.error(
        `Gemini Interactions API returned HTTP ${status}: ${providerError.replaceAll(apiKey, "[REDACTED]").slice(0, 500)}`,
      )

      if (status === 401 || status === 403) {
        return Response.json(
          { error: "Gemini rejected the API key. Check that GEMINI_API_KEY is a valid key from Google AI Studio, then restart the server." },
          { status: 502 },
        )
      }
      if (status === 400 || status === 404) {
        return Response.json(
          { error: "Gemini rejected the request. Check your API access and that the Gemini 3.8 Flash model is available to your key." },
          { status: 502 },
        )
      }
      if (status === 429 || status === 502 || status === 503 || status === 504) {
        return Response.json({
          reply: getOfflineGuidance(role, message.trim()),
          notice: status === 429
            ? "Gemini quota is temporarily unavailable. Showing built-in guidance."
            : "Gemini is temporarily unavailable. Showing built-in guidance.",
          source: "offline",
        })
      }
      return Response.json(
        { error: `Gemini could not answer the request (HTTP ${status}). Please check the server logs.` },
        { status: 502 },
      )
    }

    const result = (await geminiResponse.json()) as GeminiInteraction
    const stepText = result.steps
      ?.filter((step) => step.type === "model_output")
      .flatMap((step) => step.content ?? [])
      .filter((item) => item.type === "text" && typeof item.text === "string")
      .map((item) => item.text)
      .join("")
      .trim()
    const reply = result.output_text?.trim() || stepText

    if (!reply) {
      console.error("Gemini API returned no text for a chat request.")
      return Response.json(
        { error: "The chatbot did not return a text response. Please try a different question." },
        { status: 502 },
      )
    }

    return Response.json({ reply })
  } catch (cause) {
    const timedOut = cause instanceof Error && cause.name === "TimeoutError"
    console.error(timedOut ? "Gemini API request timed out." : "Unable to connect to the Gemini API.")
    return Response.json({
      reply: getOfflineGuidance(role, message.trim()),
      notice: timedOut
        ? "Gemini took too long to respond. Showing built-in guidance."
        : "The app could not reach Gemini. Check your network connection. Showing built-in guidance.",
      source: "offline",
    })
  }
}
