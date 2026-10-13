import { getDb } from "@/lib/mongo"

export async function GET() {
  try {
    await (await getDb()).command({ ping: 1 })
    return Response.json({ ok: true, time: new Date().toISOString() })
  } catch {
    return Response.json(
      { ok: false, error: "MongoDB connection failed" },
      { status: 503 },
    )
  }
}
