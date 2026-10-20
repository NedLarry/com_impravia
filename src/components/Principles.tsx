import { principles } from '../content/site.ts'

export default function Principles() {
  return (
    <section className="section principles theme-light" id="principles">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow reveal">{principles.eyebrow}</p>
          <h2 className="h1 reveal">{principles.title}</h2>
        </div>

        <dl className="principle-list">
          {principles.items.map((p) => (
            <div className="principle reveal" key={p.title}>
              <dt className="h2">{p.title}</dt>
              <dd>{p.body}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
