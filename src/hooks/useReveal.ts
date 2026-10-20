import { useEffect } from 'react'

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Fades in every `.reveal` element as it scrolls into view, staggering
 * siblings slightly. Runs once after the page mounts.
 */
export function useReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('.reveal'))

    if (reduceMotion() || !('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-visible'))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        })
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
    )

    els.forEach((el) => {
      const siblings = Array.from(el.parentElement?.children ?? []).filter((c) => c.classList.contains('reveal'))
      el.style.setProperty('--delay', `${Math.min(siblings.indexOf(el), 5) * 0.08}s`)
      observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])
}

/** Returns the id of the section currently in the middle of the viewport. */
export function useActiveSection(ids: readonly string[], onChange: (id: string) => void) {
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) onChange(entry.target.id)
        })
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [ids, onChange])
}
