/**
 * Site copy. Edit text here rather than in the components.
 * Voice (brand guidelines p.11): precise, calm, evidence first.
 */

export const nav = [
  { id: 'subsidiaries', label: 'Subsidiaries' },
  { id: 'products', label: 'Products' },
] as const

export const hero = {
  eyebrow: 'Impravia Limited · Lagos, Nigeria',
  titleLead: 'Making the impossible',
  titleAccent: 'plausible',
  lead:
    'At Impravia, we tackle impossible societal wide problems using innovative approaches, while not loosing human touch, we provide innovative and sustainable solutions.',
  primaryCta: 'See our products',
  secondaryCta: 'Meet the group',
}

/* --------------------------------------------------------------------------
   Subsidiaries and products
   Only the section headings live here. The entries themselves are in
   content/subsidiaries/ and content/products/, one folder each. Add or edit
   them at /admin while `npm run dev` is running, or with `npm run add`.
   -------------------------------------------------------------------------- */

export const subsidiaries = {
  eyebrow: 'Subsidiaries',
  title: 'The Impravia group',
  intro:
    'Companies we have founded or brought into the group. Each runs on its own, and each shares the same standard of work.',
}

export const products = {
  eyebrow: 'Products',
  title: 'What we have built',
  intro: 'Products designed and built by Impravia. Select one for details, or open it and try it.',
}
