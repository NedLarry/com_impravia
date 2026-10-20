import { useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { method } from '../content/site.ts'

export default function Method() {
  const [active, setActive] = useState(0)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  const count = method.steps.length
  const step = method.steps[active]

  const select = (i: number, focus = false) => {
    setActive(i)
    if (focus) tabs.current[i]?.focus()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const keys: Record<string, number> = {
      ArrowDown: (i + 1) % count,
      ArrowRight: (i + 1) % count,
      ArrowUp: (i - 1 + count) % count,
      ArrowLeft: (i - 1 + count) % count,
      Home: 0,
      End: count - 1,
    }
    if (e.key in keys) {
      e.preventDefault()
      select(keys[e.key], true)
    }
  }

  return (
    <section className="section method" id="method">
      <div className="container split method-layout">
        <div className="method-intro">
          <p className="eyebrow reveal">{method.eyebrow}</p>
          <h2 className="h1 reveal">{method.title}</h2>
          <p className="section-intro reveal">{method.intro}</p>
          <div className="method-progress" aria-hidden="true">
            <span className="method-progress-bar" style={{ width: `${((active + 1) / count) * 100}%` }} />
          </div>
        </div>

        <ol className="steps" role="tablist" aria-label="Method stages">
          {method.steps.map((s, i) => (
            <li key={s.title}>
              <button
                ref={(el) => {
                  tabs.current[i] = el
                }}
                id={`step-tab-${i}`}
                className={`step${i === active ? ' is-active' : ''}`}
                role="tab"
                aria-selected={i === active}
                aria-controls="step-panel"
                tabIndex={i === active ? 0 : -1}
                onClick={() => select(i)}
                onKeyDown={(e) => onKeyDown(e, i)}
              >
                <span className="step-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="step-title">{s.title}</span>
              </button>
            </li>
          ))}
        </ol>

        {/* key forces a remount so the entry animation replays on each change */}
        <div
          key={active}
          className="step-panel is-changing"
          id="step-panel"
          role="tabpanel"
          aria-labelledby={`step-tab-${active}`}
        >
          <p>{step.body}</p>
          <p className="panel-output">
            <strong>Output: </strong>
            {step.output}
          </p>
        </div>
      </div>
    </section>
  )
}
