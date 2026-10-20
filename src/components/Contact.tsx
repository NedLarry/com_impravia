import { useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { brand } from '../content/brand.ts'
import { contact } from '../content/site.ts'

type Values = { name: string; email: string; organisation: string; domain: string; message: string }
type Errors = Partial<Record<'name' | 'email' | 'message', string>>

const initial: Values = { name: '', email: '', organisation: '', domain: contact.domainOptions[0], message: '' }

function validate(v: Values): Errors {
  const errors: Errors = {}
  if (!v.name.trim()) errors.name = 'Please tell us your name.'
  if (!v.email.trim()) errors.email = 'We need an email address to reply.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) errors.email = 'That email address does not look complete.'
  if (v.message.trim().length < 20) errors.message = 'A sentence or two about the problem helps us reply usefully.'
  return errors
}

/**
 * No backend yet: a valid submit opens the visitor's mail client with the
 * enquiry filled in. Replace this with a real endpoint (Formspree, a
 * serverless function, etc.) when one exists.
 */
function submitEnquiry(v: Values) {
  const subject = `Enquiry: ${v.domain} (${v.name})`
  const body = [
    `Name: ${v.name}`,
    `Email: ${v.email}`,
    `Organisation: ${v.organisation || '-'}`,
    `Domain: ${v.domain}`,
    '',
    v.message,
  ].join('\n')
  window.location.href = `mailto:${brand.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export default function Contact() {
  const [values, setValues] = useState<Values>(initial)
  const [errors, setErrors] = useState<Errors>({})
  const [submitted, setSubmitted] = useState(false)
  const [status, setStatus] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const next = { ...values, [e.target.name]: e.target.value }
    setValues(next)
    // After the first attempt, re-check as the visitor corrects fields
    if (submitted) setErrors(validate(next))
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    const found = validate(values)
    setErrors(found)
    const first = Object.keys(found)[0]
    if (first) {
      setStatus('Please check the highlighted fields.')
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus()
      return
    }
    setStatus('Opening your email app with the enquiry filled in.')
    submitEnquiry(values)
  }

  const fieldProps = (name: keyof Errors) => ({
    name,
    value: values[name],
    onChange,
    required: true,
    'aria-invalid': !!errors[name],
    'aria-describedby': errors[name] ? `err-${name}` : undefined,
  })

  const errorFor = (name: keyof Errors) =>
    errors[name] ? (
      <p className="field-error" id={`err-${name}`}>
        {errors[name]}
      </p>
    ) : null

  return (
    <section className="section contact" id="contact">
      <div className="container split">
        <div>
          <p className="eyebrow reveal">{contact.eyebrow}</p>
          <h2 className="h1 reveal">{contact.title}</h2>
          <p className="section-intro reveal">{contact.intro}</p>

          <ul className="contact-details reveal">
            <li>
              <span className="label">Email</span>
              <a href={`mailto:${brand.email}`}>{brand.email}</a>
            </li>
            <li>
              <span className="label">Office</span>
              {brand.location}
            </li>
          </ul>
        </div>

        <form ref={formRef} className="form reveal" onSubmit={onSubmit} noValidate>
          <div className={`field${errors.name ? ' has-error' : ''}`}>
            <label htmlFor="f-name">Name</label>
            <input id="f-name" type="text" autoComplete="name" {...fieldProps('name')} />
            {errorFor('name')}
          </div>
          <div className={`field${errors.email ? ' has-error' : ''}`}>
            <label htmlFor="f-email">Email</label>
            <input id="f-email" type="email" autoComplete="email" {...fieldProps('email')} />
            {errorFor('email')}
          </div>
          <div className="field">
            <label htmlFor="f-org">
              Organisation <span className="optional">(optional)</span>
            </label>
            <input
              id="f-org"
              name="organisation"
              type="text"
              autoComplete="organization"
              value={values.organisation}
              onChange={onChange}
            />
          </div>
          <div className="field">
            <label htmlFor="f-domain">Domain</label>
            <select id="f-domain" name="domain" value={values.domain} onChange={onChange}>
              {contact.domainOptions.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
          <div className={`field field-full${errors.message ? ' has-error' : ''}`}>
            <label htmlFor="f-message">The problem</label>
            <textarea id="f-message" rows={5} {...fieldProps('message')} />
            {errorFor('message')}
          </div>
          <div className="form-foot field-full">
            <button className="btn" type="submit">
              Send enquiry
            </button>
            <p className="form-status" role="status">
              {status}
            </p>
          </div>
        </form>
      </div>
    </section>
  )
}
