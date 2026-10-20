/**
 * Products and subsidiaries for the public site.
 *
 * The data comes from the content/ folders via `virtual:impravia-content`
 * (see scripts/vite-content-plugin.ts), which has already validated every
 * entry, applied defaults and bundled the screenshots. Adding a folder is
 * all it takes to add an entry.
 */
import { products, subsidiaries } from 'virtual:impravia-content'
import { initials } from './helpers.ts'
import type { ProductData, SubsidiaryData } from './schema.ts'

export type Product = ProductData & { monogram: string; image?: string }
export type Subsidiary = SubsidiaryData & { image?: string }

export const productList: Product[] = products.map((p) => ({ ...p, monogram: p.monogram ?? initials(p.name) }))

export const subsidiaryList: Subsidiary[] = subsidiaries
