/**
 * Content schema for products and subsidiaries.
 *
 * The single source of truth for what an entry must contain. It is used by:
 *  - the site (src/content/collections.ts) to load entries,
 *  - the build check (content plugin in vite.config.ts), which stops the
 *    build with a clear message if any entry is invalid,
 *  - the admin page (/admin, dev only) and `npm run add`, to validate input.
 *
 * Each entry lives in its own folder: content/<type>/<slug>/<type>.json
 * with an optional screenshot.(jpg|png|webp) beside it.
 */
import { z } from 'zod'

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const text = (label: string, max: number) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be ${max} characters or fewer`)

const optionalText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer`)
    .optional()
    .transform((v) => (v ? v : undefined))

const textList = (label: string, maxItems: number, maxLength: number) =>
  z
    .array(z.string().trim().max(maxLength, `Each ${label} must be ${maxLength} characters or fewer`))
    .max(maxItems, `No more than ${maxItems} ${label}s`)
    .default([])
    .transform((items) => items.filter(Boolean))

const url = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined))
  .pipe(z.url({ error: 'Must be a full address starting with http:// or https://' }).optional())

const common = {
  slug: z
    .string({ error: 'Link name is required' })
    .regex(SLUG_PATTERN, 'Link name may only use lowercase letters, numbers and single hyphens (e.g. e-loans)'),
  name: text('Name', 60),
  /** Lower numbers show first */
  order: z.number().int().min(0).default(100),
  url,
}

export const PRODUCT_STATUSES = ['Live', 'Beta', 'Demo', 'In development'] as const

export const productSchema = z.object({
  ...common,
  category: text('Category', 40),
  status: z.enum(PRODUCT_STATUSES, { error: `Status must be one of: ${PRODUCT_STATUSES.join(', ')}` }).optional(),
  summary: text('Summary', 200),
  details: textList('paragraph', 5, 600),
  features: textList('feature', 8, 90),
  /** Two letters shown when there is no screenshot. Defaults to the name's initials. */
  monogram: optionalText('Monogram', 3),
})

export const subsidiarySchema = z.object({
  ...common,
  sector: text('Sector', 40),
  tagline: optionalText('Tagline', 80),
  description: text('Description', 500),
  services: textList('service', 8, 120),
  relationship: optionalText('Relationship', 80),
  founded: optionalText('Founded', 20),
  location: optionalText('Location', 60),
})

export type ProductData = z.output<typeof productSchema>
export type SubsidiaryData = z.output<typeof subsidiarySchema>
export type ProductInput = z.input<typeof productSchema>
export type SubsidiaryInput = z.input<typeof subsidiarySchema>

/** Registry of content types, so tooling can treat both the same way. */
export const contentTypes = {
  products: { label: 'Product', file: 'product.json', schema: productSchema },
  subsidiaries: { label: 'Subsidiary', file: 'subsidiary.json', schema: subsidiarySchema },
} as const

export type ContentType = keyof typeof contentTypes

export const isContentType = (v: string): v is ContentType => v in contentTypes

export const SCREENSHOT_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'] as const

export { initials, slugify } from './helpers.ts'

/** Human-readable list of problems, one per line, prefixed with the field name. */
export function formatIssues(error: z.ZodError): string[] {
  return error.issues.map((i) => (i.path.length ? `${i.path.join('.')}: ${i.message}` : i.message))
}

/** Field -> first message, for showing errors next to form inputs. */
export function issuesByField(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const i of error.issues) {
    const key = String(i.path[0] ?? '_')
    out[key] ??= i.message
  }
  return out
}
