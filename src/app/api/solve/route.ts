export async function POST(req: Request) {
  const config = await req.json()

  const solverUrl = process.env.SOLVER_URL
  if (!solverUrl) {
    return Response.json({ ok: false, error: "SOLVER_URL no configurada" }, { status: 500 })
  }

  const res = await fetch(`${solverUrl}/solve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ config }),
  })

  const data = await res.json()
  return Response.json(data, { status: res.status })
}