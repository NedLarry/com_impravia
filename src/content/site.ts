/**
 * Site copy. Edit text here rather than in the components.
 * Voice (brand guidelines p.11): precise, calm, evidence first.
 */

export const nav = [
  { id: 'approach', label: 'Approach' },
  { id: 'domains', label: 'Domains' },
  { id: 'subsidiaries', label: 'Subsidiaries' },
  { id: 'products', label: 'Products' },
  { id: 'method', label: 'Method' },
  { id: 'principles', label: 'Principles' },
] as const

export const hero = {
  eyebrow: 'Impravia Limited · Lagos, Nigeria',
  titleLead: 'Making the impossible',
  titleAccent: 'plausible',
  lead:
    'We take on requests that look impossible as a whole, in technology, personal defence and nuclear energy, and resolve them one rigorous face at a time until the whole holds together.',
  primaryCta: 'Bring us a problem',
  secondaryCta: 'See how we work',
}

/** Explains the current mark. Rewrite or remove if the logo changes. */
export const approach = {
  eyebrow: 'Our approach',
  title: 'A shape that should not exist',
  paragraphs: [
    'Our mark is a Penrose tribar: three beams meeting at right angles to form a closed triangle. It can be drawn, but it can never be built. Look at any one corner and it is perfectly sound. Only the whole is impossible.',
    'That is how Impravia works. A hard request is rarely impossible in every part. We find the faces that are sound, work out the ones that are not, and keep going until the whole thing stands up.',
  ],
}

export const domains = {
  eyebrow: 'Domains',
  title: 'Where we work',
  intro: 'Three fields where the stakes are high and there is little room for error. The method is the same in each.',
  items: [
    {
      title: 'Technology',
      body: 'Systems that have to work the first time they are needed. We design, prototype and test hardware and software against the conditions they will actually meet.',
      tags: ['Prototyping', 'Systems engineering', 'Field testing'],
    },
    {
      title: 'Personal defence',
      body: 'Protection for people, built from evidence. We develop and evaluate protective equipment and systems, and say plainly what they will and will not stop.',
      tags: ['Protective systems', 'Evaluation', 'Standards'],
    },
    {
      title: 'Nuclear energy',
      body: 'Research and engineering support where safety is not negotiable. We work on reactor safety, instrumentation and the analysis that stands behind every decision.',
      tags: ['Reactor safety', 'Instrumentation', 'Analysis'],
    },
  ],
}

export const method = {
  eyebrow: 'Method',
  title: 'One face at a time',
  intro: 'Every engagement follows the same line of work. Select a stage to see what it involves.',
  steps: [
    {
      title: 'Frame the whole',
      body: 'We start with the whole request, exactly as it was put to us, and write down why it looks impossible. Constraints, stakes, deadlines and what failure would cost.',
      output: 'A one-page problem statement both sides sign off.',
    },
    {
      title: 'Break it into faces',
      body: 'We split the problem into faces that can each be reasoned about on their own: physics, materials, software, regulation, people. Most faces turn out to be sound.',
      output: 'A map of every face, marked known, unknown or contested.',
    },
    {
      title: 'Resolve each face',
      body: 'We work the unknown faces one at a time, with analysis, simulation and physical tests. Every result is recorded, including the ones that go against us.',
      output: 'Test data and a clear line of reasoning for each face.',
    },
    {
      title: 'Prove the whole holds',
      body: 'We put the faces back together and test the whole under real conditions. If it does not hold, we say so, and we say where.',
      output: 'A verified result, its limits, and the evidence behind it.',
    },
  ],
}

export const principles = {
  eyebrow: 'Principles',
  title: 'How we work, and how we sound',
  items: [
    { title: 'Precise', body: 'We name the problem, the method and the limit. No hype, no vague promises.' },
    {
      title: 'Calm',
      body: 'Our work touches defence and nuclear energy. We write and work with the steadiness people expect from that responsibility.',
    },
    {
      title: 'Evidence first',
      body: 'Claims come with data, tests or a clear line of reasoning. If we do not know yet, we say so.',
    },
  ],
}

export const contact = {
  eyebrow: 'Contact',
  title: 'Bring us a problem',
  intro: 'Tell us what you are trying to do and what makes it look impossible. We will tell you honestly whether we can help.',
  domainOptions: ['Technology', 'Personal defence', 'Nuclear energy', 'Not sure yet'],
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
