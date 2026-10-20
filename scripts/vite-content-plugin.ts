/**
 * Vite plugin for the content folders.
 *
 *  - Provides `virtual:impravia-content`: every valid entry, with defaults
 *    applied and screenshots imported, so the public site ships plain data
 *    and no validation code.
 *  - `npm run build`: validates every entry and stops the build with a clear
 *    list of problems if anything is wrong.
 *  - `npm run dev`: serves the admin page at /admin and its API at
 *    /__admin/api/*, and shows an error overlay when a content file is
 *    edited into an invalid state. None of this exists in the built site.
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin, ViteDevServer } from 'vite'
import { isContentType } from '../src/content/schema.ts'
import {
  captureScreenshot,
  CONTENT_DIR,
  deleteEntry,
  listEntries,
  readScreenshot,
  reorder,
  saveEntry,
  validateAll,
  ValidationError,
} from './content-store.ts'
import type { ScreenshotChange } from './content-store.ts'

const API = '/__admin/api'
const VIRTUAL_ID = 'virtual:impravia-content'
const RESOLVED_ID = '\0' + VIRTUAL_ID
const MAX_BODY = 20 * 1024 * 1024

const MIME: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    req.on('data', (c: Buffer) => {
      size += c.length
      if (size > MAX_BODY) {
        reject(new Error('Upload is too large (20 MB max)'))
        req.destroy()
      } else chunks.push(c)
    })
    req.on('end', () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {})
      } catch {
        reject(new Error('Request body is not valid JSON'))
      }
    })
    req.on('error', reject)
  })
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

/** "data:image/png;base64,…" -> { ext: 'png', data: Buffer } */
function fromDataUrl(dataUrl: string): { ext: string; data: Buffer } {
  const m = /^data:image\/(jpe?g|png|webp);base64,(.+)$/.exec(dataUrl)
  if (!m) throw new ValidationError({ screenshot: 'Screenshot must be a JPG, PNG or WebP image' })
  return { ext: m[1] === 'jpeg' ? 'jpg' : m[1], data: Buffer.from(m[2], 'base64') }
}

async function handleApi(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? '/', 'http://localhost')
  const parts = url.pathname.slice(API.length).split('/').filter(Boolean)
  const method = req.method ?? 'GET'

  // POST /capture  { url } -> { dataUrl }
  if (parts[0] === 'capture' && method === 'POST') {
    const { url: target } = (await readBody(req)) as { url?: string }
    if (!target || !/^https?:\/\//.test(target)) {
      return send(res, 400, { error: 'Enter a full address starting with http:// or https://' })
    }
    const jpg = await captureScreenshot(target)
    return send(res, 200, { dataUrl: `data:image/jpeg;base64,${jpg.toString('base64')}` })
  }

  const [type, slug, sub] = parts
  if (!type || !isContentType(type)) return send(res, 404, { error: 'Unknown content type' })

  // GET /:type -> entries
  if (!slug && method === 'GET') {
    const entries = await listEntries(type)
    return send(res, 200, {
      entries: entries.map((e) => ({
        ...e,
        screenshotUrl: e.screenshot ? `${API}/${type}/${e.slug}/screenshot?v=${Date.now()}` : null,
      })),
    })
  }

  // POST /:type -> create or update
  if (!slug && method === 'POST') {
    const body = (await readBody(req)) as {
      data: Record<string, unknown>
      originalSlug?: string
      screenshot?: { kind: 'keep' } | { kind: 'remove' } | { kind: 'set'; dataUrl: string }
    }
    let screenshot: ScreenshotChange = { kind: 'keep' }
    if (body.screenshot?.kind === 'remove') screenshot = { kind: 'remove' }
    if (body.screenshot?.kind === 'set') screenshot = { kind: 'set', ...fromDataUrl(body.screenshot.dataUrl) }
    const saved = await saveEntry(type, body.data, { originalSlug: body.originalSlug, screenshot })
    return send(res, 200, { entry: saved })
  }

  // POST /:type/reorder  { slugs: [] }
  if (slug === 'reorder' && method === 'POST') {
    const { slugs } = (await readBody(req)) as { slugs: string[] }
    await reorder(type, slugs)
    return send(res, 200, { ok: true })
  }

  // GET /:type/:slug/screenshot
  if (slug && sub === 'screenshot' && method === 'GET') {
    const shot = await readScreenshot(type, slug)
    if (!shot) return send(res, 404, { error: 'No screenshot' })
    res.setHeader('Content-Type', MIME[shot.ext] ?? 'application/octet-stream')
    res.setHeader('Cache-Control', 'no-store')
    return res.end(shot.data)
  }

  // DELETE /:type/:slug
  if (slug && !sub && method === 'DELETE') {
    await deleteEntry(type, slug)
    return send(res, 200, { ok: true })
  }

  return send(res, 404, { error: 'Not found' })
}

/** Generate the virtual module: validated entries plus screenshot imports. */
async function generateContentModule(): Promise<string> {
  const imports: string[] = []
  const lists: string[] = []
  for (const type of ['products', 'subsidiaries'] as const) {
    const items: string[] = []
    for (const entry of await listEntries(type)) {
      if (entry.problems) continue // reported separately; the build is stopped
      let image = 'undefined'
      if (entry.screenshot) {
        const name = `img${imports.length}`
        imports.push(`import ${name} from ${JSON.stringify(`/content/${type}/${entry.slug}/${entry.screenshot}`)}`)
        image = name
      }
      items.push(`{ ...${JSON.stringify(entry.data)}, image: ${image} }`)
    }
    lists.push(`export const ${type} = [\n  ${items.join(',\n  ')}\n]`)
  }
  return [...imports, '', ...lists].join('\n')
}

/** Warnings that should not stop the build but need attention. */
async function contentWarnings(): Promise<string[]> {
  const warnings: string[] = []
  for (const type of ['products', 'subsidiaries'] as const) {
    for (const e of await listEntries(type)) {
      const url = typeof e.data.url === 'string' ? e.data.url : ''
      if (/\/\/(localhost|127\.0\.0\.1)/.test(url)) {
        warnings.push(`content/${type}/${e.slug}: link points to ${url}, which only works on this computer`)
      }
    }
  }
  return warnings
}

function reportProblems(server: ViteDevServer, problems: string[]) {
  if (!problems.length) return
  server.config.logger.error(`\nContent problems:\n  ${problems.join('\n  ')}\n`)
  server.ws.send({
    type: 'error',
    err: {
      message: `Content problems (fix the file, or edit the entry at /admin):\n\n${problems.join('\n')}`,
      stack: '',
      plugin: 'impravia-content',
    },
  })
}

export default function contentPlugin(): Plugin {
  let isBuild = false

  return {
    name: 'impravia-content',

    configResolved(config) {
      isBuild = config.command === 'build'
    },

    async buildStart() {
      if (!isBuild) return
      const problems = await validateAll()
      if (problems.length) {
        this.error(`Content problems (the build was stopped):\n  ${problems.join('\n  ')}`)
      }
      for (const w of await contentWarnings()) this.warn(w)
    },

    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID
    },

    async load(id) {
      if (id !== RESOLVED_ID) return
      return generateContentModule()
    },

    configureServer(server) {
      // /admin -> /admin/ so the admin page's relative paths resolve
      server.middlewares.use((req, res, next) => {
        if (req.url === '/admin') {
          res.statusCode = 302
          res.setHeader('Location', '/admin/')
          return res.end()
        }
        next()
      })

      server.middlewares.use(API, (req, res) => {
        // Connect strips the mount path; restore it for the router
        req.url = API + (req.url ?? '')
        handleApi(req, res).catch((e: unknown) => {
          if (e instanceof ValidationError) return send(res, 422, { error: e.message, fields: e.fields })
          send(res, 500, { error: (e as Error).message })
        })
      })

      // Flag content that has been edited into an invalid state by hand
      server.watcher.add(CONTENT_DIR)
      const check = async (file: string) => {
        if (!file.startsWith(CONTENT_DIR)) return
        // Regenerate the content module and hot-update the pages that use it
        // (the public site). The admin page does not import it, so it keeps
        // its state.
        const problems = await validateAll()
        if (problems.length) return reportProblems(server, problems)
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID)
        if (mod) await server.reloadModule(mod)
      }
      server.watcher.on('change', check)
      server.watcher.on('add', check)
      server.watcher.on('unlink', check)
      server.watcher.on('unlinkDir', check)
      server.httpServer?.once('listening', async () => {
        reportProblems(server, await validateAll())
        const base = server.resolvedUrls?.local[0]
        if (base) server.config.logger.info(`  ➜  Admin:   ${base}admin/  (add or edit products and subsidiaries)`)
      })
    },
  }
}
