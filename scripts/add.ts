/**
 * Add a product or subsidiary from the terminal.
 *
 *   npm run add                 asks which type
 *   npm run add product
 *   npm run add subsidiary
 *
 * Asks for each field, validates against src/content/schema.ts, captures a
 * screenshot from the website (or takes an image file), and writes
 * content/<type>/<slug>/.
 */
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { stdin as input, stdout as output } from 'node:process'
import { createInterface } from 'node:readline/promises'
import { fields, isLocalUrl } from '../src/content/fields.ts'
import type { Field } from '../src/content/fields.ts'
import { contentTypes, issuesByField, slugify } from '../src/content/schema.ts'
import type { ContentType } from '../src/content/schema.ts'
import { captureScreenshot, listEntries, saveEntry, ValidationError } from './content-store.ts'
import type { ScreenshotChange } from './content-store.ts'

const rl = createInterface({ input, output })

const c = {
  bold: (s: string) => `\x1b[1m${s}\x1b[22m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[22m`,
  blue: (s: string) => `\x1b[38;2;134;197;235m${s}\x1b[39m`,
  red: (s: string) => `\x1b[31m${s}\x1b[39m`,
  green: (s: string) => `\x1b[32m${s}\x1b[39m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[39m`,
}

async function ask(question: string, fallback = ''): Promise<string> {
  const hint = fallback ? c.dim(` (${fallback})`) : ''
  const answer = (await rl.question(`${c.blue('?')} ${question}${hint}: `)).trim()
  return answer || fallback
}

async function askField(f: Field, current: unknown): Promise<unknown> {
  const req = f.required ? c.dim(' required') : ''
  if (f.help) console.log(c.dim(`  ${f.help}`))

  if (f.kind === 'list') {
    const existing = Array.isArray(current) ? current : []
    console.log(`${c.blue('?')} ${f.label}${c.dim(` (one per line, up to ${f.maxItems}; empty line to finish)`)}`)
    if (existing.length) console.log(c.dim(`  Current: ${existing.join(' | ')}. Press enter to keep.`))
    const items: string[] = []
    while (items.length < (f.maxItems ?? 10)) {
      const line = (await rl.question(c.dim(`  ${items.length + 1}. `))).trim()
      if (!line) break
      items.push(line)
    }
    return items.length ? items : existing
  }

  if (f.kind === 'select') {
    const options = f.options ?? []
    options.forEach((o, i) => console.log(c.dim(`  ${i + 1}. ${o}`)))
    const answer = await ask(`${f.label}${req} ${c.dim('number, or enter for none')}`, current ? String(current) : '')
    const n = Number(answer)
    return Number.isInteger(n) && n >= 1 && n <= options.length ? options[n - 1] : answer || undefined
  }

  const answer = await ask(`${f.label}${req}`, current ? String(current) : '')
  return answer || undefined
}

async function chooseType(arg?: string): Promise<ContentType> {
  const a = arg?.toLowerCase()
  if (a?.startsWith('prod')) return 'products'
  if (a?.startsWith('sub')) return 'subsidiaries'
  console.log(c.dim('  1. Product\n  2. Subsidiary'))
  const answer = await ask('What are you adding?', '1')
  return answer === '2' || answer.toLowerCase().startsWith('s') ? 'subsidiaries' : 'products'
}

async function askScreenshot(url: string | undefined): Promise<ScreenshotChange> {
  console.log(`\n${c.bold('Screenshot')} ${c.dim('(shown on the card; 1440 × 900 works best)')}`)
  const options = url ? '1. Capture from the website  2. Use an image file  3. None' : '1. Use an image file  2. None'
  console.log(c.dim(`  ${options}`))
  const choice = await ask('Choose', '1')

  if (url && choice === '1') {
    process.stdout.write(c.dim('  Capturing, this can take 10–20 seconds… '))
    try {
      const data = await captureScreenshot(url)
      console.log(c.green('done'))
      return { kind: 'set', ext: 'jpg', data }
    } catch (e) {
      console.log(c.red('failed'))
      console.log(c.red(`  ${(e as Error).message}`))
      return askScreenshot(undefined)
    }
  }

  if ((url && choice === '2') || (!url && choice === '1')) {
    const file = (await ask('Path to a JPG, PNG or WebP file')).replace(/^['"]|['"]$/g, '')
    const ext = path.extname(file).slice(1).toLowerCase()
    if (!existsSync(file) || !['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
      console.log(c.red('  That file was not found or is not a JPG, PNG or WebP image.'))
      return askScreenshot(url)
    }
    return { kind: 'set', ext, data: await readFile(file) }
  }

  return { kind: 'keep' }
}

async function main() {
  console.log(`\n${c.bold('Impravia content')} ${c.dim('· add an entry. Press Ctrl+C to cancel at any time.')}\n`)
  const type = await chooseType(process.argv[2])
  const { label, schema } = contentTypes[type]
  const existing = await listEntries(type)

  console.log(`\n${c.bold(`New ${label.toLowerCase()}`)}`)
  const data: Record<string, unknown> = { order: (existing.length + 1) * 10 }
  for (const f of fields[type]) {
    data[f.name] = await askField(f, undefined)
    if (f.name === 'name') {
      const suggested = slugify(String(data.name ?? ''))
      data.slug = await ask(`Link name ${c.dim('lowercase-with-hyphens')}`, suggested)
    }
    if (f.kind === 'url' && isLocalUrl(data[f.name])) {
      console.log(c.yellow('  Note: this address only works on this computer. Replace it before the site goes live.'))
    }
  }

  // Re-ask only the fields that fail validation
  for (;;) {
    const parsed = schema.safeParse(data)
    const problems = parsed.success ? {} : issuesByField(parsed.error)
    if (existing.some((e) => e.slug === data.slug)) problems.slug = `An entry called "${data.slug}" already exists`
    const keys = Object.keys(problems)
    if (!keys.length) break

    console.log(`\n${c.red('Some answers need fixing:')}`)
    for (const key of keys) {
      console.log(c.red(`  ${key}: ${problems[key]}`))
      const f = fields[type].find((x) => x.name === key)
      data[key] = f ? await askField(f, data[key]) : await ask('Link name', slugify(String(data.name ?? '')))
    }
  }

  const screenshot = await askScreenshot(typeof data.url === 'string' ? data.url : undefined)

  try {
    const saved = await saveEntry(type, data, { screenshot })
    console.log(`\n${c.green('✓')} Saved ${c.bold(String(data.name))} to ${c.dim(`content/${type}/${saved.slug}/`)}`)
    console.log(c.dim('  Run `npm run dev` to see it, or edit it later at /admin.\n'))
  } catch (e) {
    if (e instanceof ValidationError) {
      console.log(c.red(`\n${e.message}`))
      for (const [k, v] of Object.entries(e.fields)) console.log(c.red(`  ${k}: ${v}`))
    } else console.log(c.red(`\n${(e as Error).message}`))
    process.exitCode = 1
  }
}

main()
  .catch((e) => {
    const code = (e as { code?: string }).code
    // Ctrl+C / Ctrl+D close the prompt: treat as a normal cancel
    if (code === 'ABORT_ERR' || code === 'ERR_USE_AFTER_CLOSE') console.log(c.dim('\n  Cancelled. Nothing was saved.'))
    else console.error(e)
    process.exitCode = 1
  })
  .finally(() => rl.close())
