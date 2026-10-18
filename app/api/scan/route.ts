import { enrich } from '@/lib/enricher'
import type { Component } from '@/lib/types'

export async function POST(req: Request) {
  let body: { components?: unknown }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { components } = body
  if (!Array.isArray(components) || components.length === 0) {
    return Response.json({ error: 'No components provided' }, { status: 400 })
  }
  if (components.length > 500) {
    return Response.json({ error: 'Too many components (max 500)' }, { status: 400 })
  }

  const results = await enrich(components as Component[])
  return Response.json({ results })
}
