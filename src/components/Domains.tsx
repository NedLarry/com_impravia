import { domains } from '../content/site.ts'

export default function Domains() {
  return (
    <section className="section domains band" id="domains">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow reveal">{domains.eyebrow}</p>
          <h2 className="h1 reveal">{domains.title}</h2>
          <p className="section-intro reveal">{domains.intro}</p>
        </div>

        <div className="cards">
          {domains.items.map((item, i) => (
            <article className="card reveal" tabIndex={0} key={item.title}>
              <span className="card-index">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="h2">{item.title}</h3>
              <p>{item.body}</p>
              <ul className="tags">
                {item.tags.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
