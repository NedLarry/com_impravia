import { useEffect, useRef, useState } from 'react'
import Logo from './Logo.tsx'
import { hero } from '../content/site.ts'

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const fieldRef = useRef<HTMLDivElement>(null)
  const artRef = useRef<HTMLDivElement>(null)
  const [pointer, setPointer] = useState(false)

  // Pointer-following grid highlight and slight parallax on the hero art.
  // Writes CSS variables directly to avoid re-rendering on every move.
  useEffect(() => {
    const section = sectionRef.current
    const field = fieldRef.current
    const art = artRef.current
    if (!section || !field) return
    const fine = window.matchMedia('(pointer: fine)').matches
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!fine || reduce) return

    let frame = 0
    const onMove = (e: PointerEvent) => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const r = section.getBoundingClientRect()
        const x = e.clientX - r.left
        const y = e.clientY - r.top
        field.style.setProperty('--mx', `${x}px`)
        field.style.setProperty('--my', `${y}px`)
        if (art) {
          art.style.setProperty('--px', `${((x / r.width - 0.5) * -14).toFixed(1)}px`)
          art.style.setProperty('--py', `${((y / r.height - 0.5) * -14).toFixed(1)}px`)
        }
      })
    }
    const onEnter = () => setPointer(true)
    const onLeave = () => {
      setPointer(false)
      art?.style.setProperty('--px', '0px')
      art?.style.setProperty('--py', '0px')
    }

    section.addEventListener('pointermove', onMove)
    section.addEventListener('pointerenter', onEnter)
    section.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(frame)
      section.removeEventListener('pointermove', onMove)
      section.removeEventListener('pointerenter', onEnter)
      section.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return (
    <section ref={sectionRef} className={`hero${pointer ? ' is-pointer' : ''}`} id="top">
      <div ref={fieldRef} className="grid-field" aria-hidden="true" />

      <div className="container hero-inner">
        <div className="hero-copy">
          <p className="eyebrow reveal">{hero.eyebrow}</p>
          <h1 className="display reveal">
            {hero.titleLead} <span className="accent">{hero.titleAccent}</span>
          </h1>
          <p className="lead reveal">{hero.lead}</p>
          <div className="hero-actions reveal">
            <a className="btn" href="#contact">
              {hero.primaryCta}
            </a>
            <a className="btn btn-ghost" href="#method">
              {hero.secondaryCta}
            </a>
          </div>
        </div>

        {/* Uses the mark file directly, so a new logo drops straight in */}
        <div ref={artRef} className="hero-art reveal" aria-hidden="true">
          <Logo variant="mark" decorative />
        </div>
      </div>

      <a className="scroll-cue" href="#approach" aria-label="Scroll to approach">
        <span />
      </a>
    </section>
  )
}
