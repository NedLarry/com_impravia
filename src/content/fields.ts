/**
 * Form fields for each content type, shared by the admin page and
 * `npm run add`. Limits mirror src/content/schema.ts, which remains the
 * authority: anything entered is validated against the schema on save.
 */
import { PRODUCT_STATUSES } from './schema.ts'
import type { ContentType } from './schema.ts'

export type Field = {
  name: string
  label: string
  kind: 'text' | 'textarea' | 'select' | 'list' | 'url'
  required?: boolean
  max?: number
  /** For lists: how many items and whether each is a paragraph */
  maxItems?: number
  itemKind?: 'text' | 'textarea'
  options?: readonly string[]
  help?: string
  placeholder?: string
}

export const fields: Record<ContentType, Field[]> = {
  products: [
    { name: 'name', label: 'Name', kind: 'text', required: true, max: 60, placeholder: 'e.g. eLoans' },
    {
      name: 'category',
      label: 'Category',
      kind: 'text',
      required: true,
      max: 40,
      placeholder: 'e.g. Digital lending',
      help: 'Short label shown above the name.',
    },
    {
      name: 'status',
      label: 'Status',
      kind: 'select',
      options: PRODUCT_STATUSES,
      help: 'Leave blank to hide the status badge.',
    },
    {
      name: 'summary',
      label: 'Summary',
      kind: 'textarea',
      required: true,
      max: 200,
      help: 'One or two sentences. Shown on the card.',
    },
    {
      name: 'details',
      label: 'Description paragraphs',
      kind: 'list',
      itemKind: 'textarea',
      maxItems: 5,
      max: 600,
      help: 'Shown in the detail panel under the summary.',
    },
    {
      name: 'features',
      label: 'Key features',
      kind: 'list',
      itemKind: 'text',
      maxItems: 8,
      max: 90,
      help: 'Short phrases, 3 to 5 works best.',
    },
    { name: 'url', label: 'Website', kind: 'url', placeholder: 'https://…', help: 'Used for the "Visit" button and screenshot capture.' },
    {
      name: 'monogram',
      label: 'Monogram',
      kind: 'text',
      max: 3,
      help: 'Letters shown when there is no screenshot. Defaults to the initials of the name.',
    },
  ],

  subsidiaries: [
    { name: 'name', label: 'Company name', kind: 'text', required: true, max: 60, placeholder: 'e.g. Diadem Consults' },
    { name: 'sector', label: 'Sector', kind: 'text', required: true, max: 40, placeholder: 'e.g. Technology consulting' },
    { name: 'tagline', label: 'Tagline', kind: 'text', max: 80, help: "The company's own strapline, if it has one." },
    { name: 'description', label: 'Description', kind: 'textarea', required: true, max: 500 },
    {
      name: 'services',
      label: 'Services',
      kind: 'list',
      itemKind: 'text',
      maxItems: 8,
      max: 120,
      help: 'What the company offers, one per line.',
    },
    { name: 'relationship', label: 'Relationship', kind: 'text', max: 80, placeholder: 'e.g. Subsidiary of Impravia Limited' },
    { name: 'founded', label: 'Founded', kind: 'text', max: 20, placeholder: 'e.g. 2024' },
    { name: 'location', label: 'Based in', kind: 'text', max: 60, placeholder: 'e.g. Lagos, Nigeria' },
    { name: 'url', label: 'Website', kind: 'url', placeholder: 'https://…' },
  ],
}

/** True when a link would only work on the machine running the dev server */
export const isLocalUrl = (url: unknown) => typeof url === 'string' && /\/\/(localhost|127\.0\.0\.1)/.test(url)
