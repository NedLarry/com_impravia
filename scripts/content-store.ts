/**
 * Reads and writes content entries on disk. Shared by the admin API (dev
 * server, see vite.config.ts) and the `npm run add` command.
 *
 * Layout:  content/<type>/<slug>/<type>.json  (+ optional screenshot.jpg|png|webp)
 * The slug is the folder name and is not stored inside the JSON.
 */
import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  contentTypes,
  formatIssues,
  issuesByField,
  SCREENSHOT_EXTENSIONS,
  SLUG_PATTERN,
} from '../src/content/schema.ts'
import type { ContentType } from '../src/content/schema.ts'

export const ROOT = fileURLToPath(new URL('..', import.meta.url))
export const CONTENT_DIR = path.join(ROOT, 'content')

export type StoredEntry = {
  slug: string
  data: Record<string, unknown>
  /** File name of the screenshot inside the entry folder, if any */
  screenshot?: string
  /** Validation problems, if the file on disk is invalid */
  problems?: string[]
}

export type ScreenshotChange =
  | { kind: 'keep' }
  | { kind: 'remove' }
  | { kind: 'set'; ext: string; data: Buffer }

export class ValidationError extends Error {
  fields: Record<string, string>
  constructor(fields: Record<string, string>, message = 'Please fix the highlighted fields.') {
    super(message)
    this.fields = fields
  }
}

const typeDir = (type: ContentType) => path.join(CONTENT_DIR, type)
const entryDir = (type: ContentType, slug: string) => {
  // Guard against path traversal: slugs are validated, but check again here
  if (!SLUG_PATTERN.test(slug)) throw new ValidationError({ slug: 'Invalid slug' })
  return path.join(typeDir(type), slug)
}

async function findScreenshot(dir: string): Promise<string | undefined> {
  if (!existsSync(dir)) return undefined
  const files = await readdir(dir)
  return files.find((f) => {
    const [base, ext] = f.split('.')
    return base === 'screenshot' && (SCREENSHOT_EXTENSIONS as readonly string[]).includes(ext?.toLowerCase())
  })
}

export async function listEntries(type: ContentType): Promise<StoredEntry[]> {
  const dir = typeDir(type)
  if (!existsSync(dir)) return []
  const { file, schema } = contentTypes[type]
  const folders = (await readdir(dir, { withFileTypes: true })).filter((d) => d.isDirectory())

  const entries = await Promise.all(
    folders.map(async (f): Promise<StoredEntry> => {
      const folder = path.join(dir, f.name)
      const screenshot = await findScreenshot(folder)
      const jsonPath = path.join(folder, file)
      if (!existsSync(jsonPath)) {
        return { slug: f.name, data: {}, screenshot, problems: [`Missing ${file}`] }
      }
      let raw: Record<string, unknown>
      try {
        raw = JSON.parse(await readFile(jsonPath, 'utf8'))
      } catch (e) {
        return { slug: f.name, data: {}, screenshot, problems: [`${file} is not valid JSON: ${(e as Error).message}`] }
      }
      const parsed = schema.safeParse({ ...raw, slug: f.name })
      return {
        slug: f.name,
        data: parsed.success ? (parsed.data as Record<string, unknown>) : raw,
        screenshot,
        problems: parsed.success ? undefined : formatIssues(parsed.error),
      }
    }),
  )

  return entries.sort(
    (a, b) => Number(a.data.order ?? 100) - Number(b.data.order ?? 100) || a.slug.localeCompare(b.slug),
  )
}

/** Every problem across all content, as "content/products/x/product.json: field: message". */
export async function validateAll(): Promise<string[]> {
  const problems: string[] = []
  for (const type of Object.keys(contentTypes) as ContentType[]) {
    for (const entry of await listEntries(type)) {
      for (const p of entry.problems ?? []) {
        problems.push(`content/${type}/${entry.slug}/${contentTypes[type].file}: ${p}`)
      }
    }
  }
  return problems
}

/**
 * Validate and write an entry. `originalSlug` is set when editing, so a
 * changed slug renames the folder rather than creating a duplicate.
 */
export async function saveEntry(
  type: ContentType,
  input: Record<string, unknown>,
  options: { originalSlug?: string; screenshot?: ScreenshotChange } = {},
): Promise<StoredEntry> {
  const { schema, file } = contentTypes[type]
  const parsed = schema.safeParse(input)
  if (!parsed.success) throw new ValidationError(issuesByField(parsed.error))

  const { slug, ...data } = parsed.data as Record<string, unknown> & { slug: string }
  const target = entryDir(type, slug)
  const original = options.originalSlug ? entryDir(type, options.originalSlug) : undefined

  if (slug !== options.originalSlug && existsSync(target)) {
    throw new ValidationError({ slug: `An entry called "${slug}" already exists` })
  }

  if (original && original !== target && existsSync(original)) {
    await rename(original, target)
  }
  await mkdir(target, { recursive: true })

  // Drop empty optional values and empty lists so the JSON stays tidy
  const tidy = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined && !(Array.isArray(v) && v.length === 0)),
  )
  await writeFile(path.join(target, file), JSON.stringify(tidy, null, 2) + '\n')

  const change = options.screenshot ?? { kind: 'keep' }
  if (change.kind !== 'keep') {
    const existing = await findScreenshot(target)
    if (existing) await rm(path.join(target, existing))
    if (change.kind === 'set') {
      const ext = change.ext === 'jpeg' ? 'jpg' : change.ext
      if (!(SCREENSHOT_EXTENSIONS as readonly string[]).includes(ext)) {
        throw new ValidationError({ screenshot: 'Screenshot must be a JPG, PNG or WebP image' })
      }
      await writeFile(path.join(target, `screenshot.${ext}`), change.data)
    }
  }

  return { slug, data: tidy, screenshot: await findScreenshot(target) }
}

export async function deleteEntry(type: ContentType, slug: string): Promise<void> {
  const dir = entryDir(type, slug)
  if (!existsSync(dir)) throw new ValidationError({ slug: `No entry called "${slug}"` })
  await rm(dir, { recursive: true })
}

/** Rewrite `order` so entries appear in the given sequence (10, 20, 30…). */
export async function reorder(type: ContentType, slugs: string[]): Promise<void> {
  const { file } = contentTypes[type]
  await Promise.all(
    slugs.map(async (slug, i) => {
      const jsonPath = path.join(entryDir(type, slug), file)
      const data = JSON.parse(await readFile(jsonPath, 'utf8'))
      data.order = (i + 1) * 10
      await writeFile(jsonPath, JSON.stringify(data, null, 2) + '\n')
    }),
  )
}

export async function readScreenshot(type: ContentType, slug: string): Promise<{ data: Buffer; ext: string } | null> {
  const dir = entryDir(type, slug)
  const name = await findScreenshot(dir)
  if (!name) return null
  return { data: await readFile(path.join(dir, name)), ext: name.split('.').pop()!.toLowerCase() }
}

/**
 * Open a URL in headless Chromium and return a 1440×900 JPEG.
 * Needs the Playwright browser: `npx playwright install chromium`.
 */
export async function captureScreenshot(url: string): Promise<Buffer> {
  let chromium
  try {
    ;({ chromium } = await import('playwright'))
  } catch {
    throw new Error('Screenshot capture needs Playwright. Run: npm install')
  }
  let browser
  try {
    browser = await chromium.launch()
  } catch {
    throw new Error('Screenshot capture needs a browser. Run: npx playwright install chromium')
  }
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45_000 })
    await page.waitForTimeout(1200) // let entry animations settle
    return await page.screenshot({ type: 'jpeg', quality: 82 })
  } catch (e) {
    const msg = (e as Error).message
    if (/ERR_CONNECTION_REFUSED/.test(msg)) throw new Error(`Could not reach ${url}. Is that site running?`)
    if (/ERR_NAME_NOT_RESOLVED/.test(msg)) throw new Error(`${url} does not exist. Check the address.`)
    if (/Timeout/i.test(msg)) throw new Error(`${url} took too long to load. Try again, or upload a screenshot instead.`)
    throw new Error(`Could not capture ${url}: ${msg.split('\n')[0]}`)
  } finally {
    await browser.close()
  }
}
