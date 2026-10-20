/** `npm run content:check` — validate every product and subsidiary without building. */
import { validateAll } from './content-store.ts'

const problems = await validateAll()
if (problems.length) {
  console.error(`\x1b[31mContent problems:\x1b[39m\n  ${problems.join('\n  ')}`)
  process.exitCode = 1
} else {
  console.log('\x1b[32m✓\x1b[39m All products and subsidiaries are valid.')
}
