import { brand } from '../content/brand.ts'
import { subsidiaries } from '../content/site.ts'
import { subsidiaryList } from '../content/collections.ts'
import type { Subsidiary } from '../content/collections.ts'

const hostOf = (url: string) => {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}

/** Screenshot in a minimal browser-window frame, linked to the site if there is one. */
function SitePreview({ s }: { s: Subsidiary }) {
  if (!s.image) return null
  const frame = (
    <figure className="site-preview">
      <div className="site-preview-bar" aria-hidden="true">
        <span className="site-preview-dots">
          <i />
          <i />
          <i />
        </span>
        {s.url && <span className="site-preview-url">{hostOf(s.url)}</span>}
      </div>
      <img src={s.image} alt={`${s.name} website`} loading="lazy" width={1440} height={900} />
    </figure>
  )
  return s.url ? (
    <a className="site-preview-link" href={s.url} target="_blank" rel="noopener noreferrer" tabIndex={-1} aria-hidden="true">
      {frame}
    </a>
  ) : (
    frame
  )
}

/**
 * Group structure: the parent company at the top, a trunk line down the
 * left, and one branch per subsidiary. Works for one company or many.
 */
export default function Subsidiaries() {
  const count = subsidiaryList.length

  return (
    <section className="section subsidiaries" id="subsidiaries">
      <div className="container">
        <div className="section-head split section-head-split">
          <div>
            <p className="eyebrow reveal">{subsidiaries.eyebrow}</p>
            <h2 className="h1 reveal">{subsidiaries.title}</h2>
          </div>
          <p className="section-intro reveal">{subsidiaries.intro}</p>
        </div>

        <div className="group-tree">
          <div className="group-parent reveal">
            <span className="group-parent-label">Parent company</span>
            <span className="group-parent-name">{brand.legalName}</span>
            <span className="group-parent-count">
              {count} {count === 1 ? 'subsidiary' : 'subsidiaries'}
            </span>
          </div>

          <ul className="group-branches">
            {subsidiaryList.map((s, i) => (
              <li className="group-branch reveal" key={s.slug}>
                <article className={`subsidiary${s.image ? ' has-preview' : ''}`}>
                  <div className="subsidiary-main">
                    <header className="subsidiary-head">
                      <span className="subsidiary-index">{String(i + 1).padStart(2, '0')}</span>
                      <h3 className="h2">{s.name}</h3>
                      <span className="tag">{s.sector}</span>
                    </header>

                    {s.tagline && <p className="subsidiary-tagline">{s.tagline}</p>}
                    <p className="subsidiary-body">{s.description}</p>

                    {s.services && s.services.length > 0 && (
                      <ul className="feature-list">
                        {s.services.map((sv) => (
                          <li key={sv}>{sv}</li>
                        ))}
                      </ul>
                    )}

                    {(s.relationship || s.founded || s.location) && (
                      <dl className="subsidiary-meta">
                        {s.relationship && (
                          <div>
                            <dt>Relationship</dt>
                            <dd>{s.relationship}</dd>
                          </div>
                        )}
                        {s.founded && (
                          <div>
                            <dt>Founded</dt>
                            <dd>{s.founded}</dd>
                          </div>
                        )}
                        {s.location && (
                          <div>
                            <dt>Based in</dt>
                            <dd>{s.location}</dd>
                          </div>
                        )}
                      </dl>
                    )}

                    {s.url && (
                      <a className="text-link" href={s.url} target="_blank" rel="noopener noreferrer">
                        Visit {s.name}
                        <span aria-hidden="true"> ↗</span>
                      </a>
                    )}
                  </div>

                  <SitePreview s={s} />
                </article>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
