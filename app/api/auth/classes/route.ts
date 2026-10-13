import { getDb } from "@/lib/mongo"

export async function GET() {
  try {
    const items = await (await getDb())
      .collection("classes")
      .find({}, { projection: { name: 1, department: 1, batch: 1, sem: 1 } })
      .sort({ name: 1 })
      .toArray()

    return Response.json({
      items: items.map((item) => ({
        id: String(item._id),
        name: item.name,
        department: item.department,
        batch: item.batch,
        semester: item.sem,
      })),
    })
  } catch (error) {
    console.error("Unable to load classes for account registration.", error)
    return Response.json({ error: "Class options are temporarily unavailable." }, { status: 503 })
  }
}
