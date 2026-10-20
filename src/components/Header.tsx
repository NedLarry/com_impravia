import { useCallback, useEffect, useRef, useState } from 'react'
import Logo from './Logo.tsx'
import { nav, hero } from '../content/site.ts'
import { useActiveSection } from '../hooks/useReveal.ts'

const sectionIds = nav.map((n) => n.id)

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<string>('')
  const toggleRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        toggleRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  useActiveSection(sectionIds, useCallback((id: string) => setActive(id), []))

  const close = () => setOpen(false)

  return (
    <header className={`site-header${scrolled ? ' is-scrolled' : ''}${open ? ' is-menu-open' : ''}`}>
      <div className="container header-inner">
        <a className="brand" href="#top" aria-label="Impravia home" onClick={close}>
          <Logo className="brand-logo" />
        </a>

        <button
          ref={toggleRef}
          className="nav-toggle"
          type="button"
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="visually-hidden">Menu</span>
          <span className="nav-toggle-bar" />
          <span className="nav-toggle-bar" />
        </button>

        <nav className={`site-nav${open ? ' is-open' : ''}`} id="site-nav">
          <ul>
            {nav.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`} className={active === item.id ? 'is-current' : undefined} onClick={close}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <a className="btn btn-small" href="#contact" onClick={close}>
            {hero.primaryCta}
          </a>
        </nav>
      </div>
    </header>
  )
}
