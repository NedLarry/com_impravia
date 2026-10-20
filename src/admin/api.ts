/** Client for the dev-only admin API in scripts/vite-content-plugin.ts */
import type { ContentType } from '../content/schema.ts'

const API = '/__admin/api'

export type Entry = {
  slug: string
  data: Record<string, unknown>
  screenshot?: string
  screenshotUrl: string | null
  problems?: string[]
}

export type ScreenshotChange = { kind: 'keep' } | { kind: 'remove' } | { kind: 'set'; dataUrl: string }

export class ApiError extends Error {
  fields: Record<string, string>
  constructor(message: string, fields: Record<string, string> = {}) {
    super(message)
    this.fields = fields
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(API + path, {
      ...init,
      headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    })
  } catch {
    throw new ApiError('Cannot reach the dev server. Is `npm run dev` still running?')
  }
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(body.error ?? `Request failed (${res.status})`, body.fields)
  return body as T
}

export const api = {
  list: (type: ContentType) => request<{ entries: Entry[] }>(`/${type}`).then((r) => r.entries),

  save: (type: ContentType, data: Record<string, unknown>, originalSlug: string | undefined, screenshot: ScreenshotChange) =>
    request<{ entry: Entry }>(`/${type}`, {
      method: 'POST',
      body: JSON.stringify({ data, originalSlug, screenshot }),
    }),

  remove: (type: ContentType, slug: string) => request(`/${type}/${slug}`, { method: 'DELETE' }),

  reorder: (type: ContentType, slugs: string[]) =>
    request(`/${type}/reorder`, { method: 'POST', body: JSON.stringify({ slugs }) }),

  capture: (url: string) =>
    request<{ dataUrl: string }>('/capture', { method: 'POST', body: JSON.stringify({ url }) }).then((r) => r.dataUrl),
}
