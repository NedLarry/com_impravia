import { approach } from '../content/site.ts'

/** Explains the current mark. If the logo changes, rewrite the copy or drop this section from App. */
export default function Approach() {
  return (
    <section className="section approach" id="approach">
      <div className="container split">
        <div>
          <p className="eyebrow reveal">{approach.eyebrow}</p>
          <h2 className="h1 reveal">{approach.title}</h2>
        </div>
        <div className="prose">
          {approach.paragraphs.map((p) => (
            <p className="reveal" key={p}>
              {p}
            </p>
          ))}
        </div>
      </div>
    </section>
  )
}
