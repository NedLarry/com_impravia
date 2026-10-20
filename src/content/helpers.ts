/** Small text helpers with no dependencies, safe to use in the public site. */

/** "Social Games" -> "social-games" */
export function slugify(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** "Social Games" -> "SG", "eLoans" -> "EL" */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length > 1) return (words[0][0] + words[1][0]).toUpperCase()
  const w = words[0] ?? ''
  const capital = w.slice(1).match(/[A-Z]/)
  return (w[0] + (capital ? capital[0] : (w[1] ?? ''))).toUpperCase()
}
