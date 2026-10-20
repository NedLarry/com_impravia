import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent, ReactNode } from 'react'
import { brand } from '../content/brand.ts'
import { fields, isLocalUrl } from '../content/fields.ts'
import type { Field } from '../content/fields.ts'
import { contentTypes, initials, issuesByField, slugify } from '../content/schema.ts'
import type { ContentType } from '../content/schema.ts'
import { api, ApiError } from './api.ts'
import type { Entry, ScreenshotChange } from './api.ts'

type Values = Record<string, string | string[]>
type Selection = { mode: 'new' } | { mode: 'edit'; slug: string } | null

const TYPES: ContentType[] = ['products', 'subsidiaries']
const TYPE_TITLES: Record<ContentType, string> = { products: 'Products', subsidiaries: 'Subsidiaries' }

/* ---------- helpers ---------- */

function emptyValues(type: ContentType): Values {
  return Object.fromEntries(fields[type].map((f) => [f.name, f.kind === 'list' ? [] : '']))
}

function valuesFrom(type: ContentType, data: Record<string, unknown>): Values {
  const v = emptyValues(type)
  for (const f of fields[type]) {
    const raw = data[f.name]
    if (f.kind === 'list') v[f.name] = Array.isArray(raw) ? raw.map(String) : []
    else v[f.name] = raw == null ? '' : String(raw)
  }
  return v
}

/** Form values -> object for the schema. Empty strings become undefined. */
function toData(values: Values, slug: string, order: number | undefined): Record<string, unknown> {
  const out: Record<string, unknown> = { slug, order }
  for (const [k, v] of Object.entries(values)) {
    if (Array.isArray(v)) out[k] = v.map((s) => s.trim()).filter(Boolean)
    else out[k] = v.trim() === '' ? undefined : v
  }
  return out
}

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(r.error)
    r.readAsDataURL(file)
  })

/* ---------- app ---------- */

export default function AdminApp() {
  const [type, setType] = useState<ContentType>(() => {
    const t = new URLSearchParams(location.search).get('type')
    return t === 'subsidiaries' ? 'subsidiaries' : 'products'
  })
  const [entries, setEntries] = useState<Entry[]>([])
  const [counts, setCounts] = useState<Record<ContentType, number>>({ products: 0, subsidiaries: 0 })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [selection, setSelection] = useState<Selection>(null)
  const [dirty, setDirty] = useState(false)
  const [toast, setToast] = useState('')

  // Fetch this type's entries plus the other type's count for the tabs
  const load = useCallback(
    (t: ContentType) =>
      Promise.all([api.list(t), api.list(t === 'products' ? 'subsidiaries' : 'products')]).then(
        ([current, other]) => {
          setLoadError('')
          setEntries(current)
          setCounts(
            t === 'products'
              ? { products: current.length, subsidiaries: other.length }
              : { products: other.length, subsidiaries: current.length },
          )
        },
        (e: Error) => setLoadError(e.message),
      ),
    [],
  )

  const refresh = useCallback((t: ContentType) => load(t).finally(() => setLoading(false)), [load])

  useEffect(() => {
    history.replaceState(null, '', `?type=${type}`)
    let active = true
    load(type).finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [type, load])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 3500)
    return () => clearTimeout(t)
  }, [toast])

  // Warn before leaving with unsaved changes
  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  const guard = (fn: () => void) => {
    if (dirty && !confirm('You have unsaved changes. Discard them?')) return
    setDirty(false)
    fn()
  }

  const switchType = (t: ContentType) => guard(() => {
    setSelection(null)
    setLoading(true)
    setType(t)
  })

  const move = async (index: number, delta: number) => {
    const next = [...entries]
    const [item] = next.splice(index, 1)
    next.splice(index + delta, 0, item)
    setEntries(next)
    try {
      await api.reorder(type, next.map((e) => e.slug))
      await refresh(type)
      setToast('Order saved')
    } catch (e) {
      setToast((e as Error).message)
      refresh(type)
    }
  }

  const remove = async (entry: Entry) => {
    const name = String(entry.data.name ?? entry.slug)
    if (!confirm(`Delete "${name}"? This removes its folder and screenshot and cannot be undone.`)) return
    try {
      await api.remove(type, entry.slug)
      if (selection?.mode === 'edit' && selection.slug === entry.slug) setSelection(null)
      setDirty(false)
      await refresh(type)
      setToast(`Deleted ${name}`)
    } catch (e) {
      setToast((e as Error).message)
    }
  }

  const selected = selection?.mode === 'edit' ? entries.find((e) => e.slug === selection.slug) : undefined
  const label = contentTypes[type].label

  return (
    <div className="admin">
      <header className="admin-top">
        <div className="admin-top-inner">
          <img src={brand.logo.horizontalDark} alt={brand.name} className="admin-logo" />
          <span className="admin-title">Content admin</span>
          <span className="admin-badge" title="This page only exists while `npm run dev` is running">Local only</span>
          <a className="admin-link" href="/" target="_blank" rel="noreferrer">
            View site ↗
          </a>
        </div>
      </header>

      <div className="admin-body">
        <aside className="admin-side">
          <div className="admin-tabs" role="tablist" aria-label="Content type">
            {TYPES.map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={t === type}
                className={`admin-tab${t === type ? ' is-active' : ''}`}
                onClick={() => t !== type && switchType(t)}
              >
                {TYPE_TITLES[t]} <span className="admin-count">{counts[t]}</span>
              </button>
            ))}
          </div>

          <button className="btn admin-new" onClick={() => guard(() => setSelection({ mode: 'new' }))}>
            + New {label.toLowerCase()}
          </button>

          {loadError && <p className="admin-error">{loadError}</p>}
          {loading ? (
            <p className="admin-muted">Loading…</p>
          ) : entries.length === 0 ? (
            <p className="admin-muted">No {TYPE_TITLES[type].toLowerCase()} yet. Add the first one.</p>
          ) : (
            <ol className="entry-list">
              {entries.map((e, i) => {
                const active = selection?.mode === 'edit' && selection.slug === e.slug
                const name = String(e.data.name ?? e.slug)
                return (
                  <li key={e.slug} className={`entry${active ? ' is-active' : ''}${e.problems ? ' has-problems' : ''}`}>
                    <button className="entry-main" onClick={() => guard(() => setSelection({ mode: 'edit', slug: e.slug }))}>
                      <span className="entry-thumb">
                        {e.screenshotUrl ? <img src={e.screenshotUrl} alt="" /> : <span>{initials(name)}</span>}
                      </span>
                      <span className="entry-text">
                        <span className="entry-name">{name}</span>
                        <span className="entry-sub">
                          {e.problems
                            ? `${e.problems.length} problem${e.problems.length > 1 ? 's' : ''} to fix`
                            : String(e.data.category ?? e.data.sector ?? '')}
                          {typeof e.data.status === 'string' && !e.problems ? ` · ${e.data.status}` : ''}
                        </span>
                      </span>
                    </button>
                    <span className="entry-actions">
                      <button aria-label={`Move ${name} up`} disabled={i === 0} onClick={() => move(i, -1)}>
                        ↑
                      </button>
                      <button aria-label={`Move ${name} down`} disabled={i === entries.length - 1} onClick={() => move(i, 1)}>
                        ↓
                      </button>
                      <button aria-label={`Delete ${name}`} className="danger" onClick={() => remove(e)}>
                        ×
                      </button>
                    </span>
                  </li>
                )
              })}
            </ol>
          )}
          <p className="admin-hint">
            Order here is the order on the site. Entries are saved to <code>content/{type}/</code>.
          </p>
        </aside>

        <main className="admin-main">
          {selection ? (
            <Editor
              key={`${type}:${selection.mode === 'edit' ? selection.slug : 'new'}`}
              type={type}
              entry={selected}
              existingSlugs={entries.map((e) => e.slug)}
              nextOrder={(entries.length + 1) * 10}
              onDirty={setDirty}
              onCancel={() => guard(() => setSelection(null))}
              onSaved={async (slug, name) => {
                setDirty(false)
                await refresh(type)
                setSelection({ mode: 'edit', slug })
                setToast(`Saved ${name}. The site has updated.`)
              }}
            />
          ) : (
            <div className="admin-empty">
              <h1 className="h1">{TYPE_TITLES[type]}</h1>
              <p>Select an entry to edit it, or add a new one.</p>
              <ol className="admin-steps">
                <li>Fill in the details. Required fields are marked.</li>
                <li>Capture a screenshot from the website address, or upload one.</li>
                <li>Save. The site updates straight away, and the entry is checked again at build time.</li>
              </ol>
            </div>
          )}
        </main>
      </div>

      <div className={`admin-toast${toast ? ' is-visible' : ''}`} role="status" aria-live="polite">
        {toast}
      </div>
    </div>
  )
}

/* ---------- editor ---------- */

type EditorProps = {
  type: ContentType
  entry?: Entry
  existingSlugs: string[]
  nextOrder: number
  onDirty: (dirty: boolean) => void
  onCancel: () => void
  onSaved: (slug: string, name: string) => void
}

function Editor({ type, entry, existingSlugs, nextOrder, onDirty, onCancel, onSaved }: EditorProps) {
  const isNew = !entry
  const [values, setValues] = useState<Values>(() => (entry ? valuesFrom(type, entry.data) : emptyValues(type)))
  const [slug, setSlug] = useState(entry?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(!isNew)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [shot, setShot] = useState<ScreenshotChange>({ kind: 'keep' })
  const [capturing, setCapturing] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const label = contentTypes[type].label

  const markDirty = () => onDirty(true)

  const clearError = (name: string) =>
    setErrors((prev) => {
      if (!(name in prev)) return prev
      const next = { ...prev }
      delete next[name]
      return next
    })

  const setValue = (name: string, v: string | string[]) => {
    setValues((prev) => ({ ...prev, [name]: v }))
    const autoSlug = name === 'name' && !slugTouched
    if (autoSlug) setSlug(slugify(String(v)))
    clearError(name)
    if (autoSlug) clearError('slug')
    markDirty()
  }

  const previewSrc =
    shot.kind === 'set' ? shot.dataUrl : shot.kind === 'remove' ? null : (entry?.screenshotUrl ?? null)

  const capture = async () => {
    const url = String(values.url ?? '').trim()
    if (!url) {
      setErrors((e) => ({ ...e, url: 'Enter the website address first, then capture.' }))
      return
    }
    setCapturing(true)
    setFormError('')
    try {
      setShot({ kind: 'set', dataUrl: await api.capture(url) })
      markDirty()
    } catch (e) {
      setFormError((e as Error).message)
    } finally {
      setCapturing(false)
    }
  }

  const upload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setFormError('Screenshots must be JPG, PNG or WebP.')
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setFormError('That image is over 8 MB. Please use a smaller one.')
      return
    }
    setShot({ kind: 'set', dataUrl: await readAsDataUrl(file) })
    markDirty()
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError('')
    const order = typeof entry?.data.order === 'number' ? entry.data.order : nextOrder
    const data = toData(values, slug, order)

    // Validate here first for instant feedback; the server validates again
    const parsed = contentTypes[type].schema.safeParse(data)
    const found = parsed.success ? {} : issuesByField(parsed.error)
    if (slug !== entry?.slug && existingSlugs.includes(slug)) found.slug = `An entry called "${slug}" already exists`
    if (Object.keys(found).length) {
      setErrors(found)
      setFormError('Please fix the highlighted fields.')
      document.querySelector<HTMLElement>(`[data-field="${Object.keys(found)[0]}"] :is(input, textarea, select)`)?.focus()
      return
    }

    setSaving(true)
    try {
      const { entry: saved } = await api.save(type, data, entry?.slug, shot)
      onSaved(saved.slug, String(values.name))
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fields)
        setFormError(err.message)
      } else setFormError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const monogram = String(values.monogram || '') || initials(String(values.name || '?'))
  const siteHash = type === 'products' ? `#products/${slug}` : '#subsidiaries'

  return (
    <form className="editor" onSubmit={submit} noValidate>
      <div className="editor-head">
        <div>
          <p className="eyebrow">{isNew ? `New ${label.toLowerCase()}` : `Edit ${label.toLowerCase()}`}</p>
          <h1 className="h1">{String(values.name) || `Untitled ${label.toLowerCase()}`}</h1>
        </div>
        {!isNew && (
          <a className="admin-link" href={`/${siteHash}`} target="_blank" rel="noreferrer">
            View on site ↗
          </a>
        )}
      </div>

      {entry?.problems && (
        <div className="admin-alert">
          <strong>This entry's file has problems, so it is hidden from the site:</strong>
          <ul>
            {entry.problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          Fix them below and save.
        </div>
      )}

      <div className="editor-grid">
        <div className="editor-fields">
          {fields[type].map((f) => (
            <FieldInput key={f.name} field={f} value={values[f.name]} error={errors[f.name]} onChange={(v) => setValue(f.name, v)}>
              {f.name === 'name' && (
                <div className="field" data-field="slug">
                  <label htmlFor="f-slug">
                    Link name <span className="req">required</span>
                  </label>
                  <div className="slug-row">
                    <span className="slug-prefix">{type === 'products' ? '#products/' : `content/${type}/`}</span>
                    <input
                      id="f-slug"
                      value={slug}
                      onChange={(e) => {
                        setSlug(e.target.value)
                        setSlugTouched(true)
                        clearError('slug')
                        markDirty()
                      }}
                      aria-invalid={!!errors.slug}
                    />
                  </div>
                  <p className="help">Filled in from the name. Lowercase letters, numbers and hyphens.</p>
                  {errors.slug && <p className="field-error">{errors.slug}</p>}
                </div>
              )}
            </FieldInput>
          ))}
        </div>

        <div className="editor-shot">
          <p className="shot-label">Screenshot</p>
          <div className="shot-preview">
            {capturing ? (
              <span className="shot-status">Capturing… this can take 10–20 seconds</span>
            ) : previewSrc ? (
              <img src={previewSrc} alt="Screenshot preview" />
            ) : (
              <span className="shot-monogram">{monogram}</span>
            )}
          </div>
          <p className="help">
            {previewSrc
              ? shot.kind === 'set'
                ? 'New screenshot. It will be saved with the entry.'
                : 'Current screenshot.'
              : 'No screenshot: the site shows the monogram instead.'}{' '}
            1440 × 900 works best.
          </p>
          <div className="shot-actions">
            <button type="button" className="btn btn-small" onClick={capture} disabled={capturing}>
              Capture from website
            </button>
            <button type="button" className="btn btn-small btn-ghost" onClick={() => fileRef.current?.click()} disabled={capturing}>
              Upload image
            </button>
            {previewSrc && (
              <button
                type="button"
                className="btn btn-small btn-ghost"
                onClick={() => {
                  setShot(entry?.screenshotUrl && shot.kind === 'set' ? { kind: 'keep' } : { kind: 'remove' })
                  markDirty()
                }}
              >
                {entry?.screenshotUrl && shot.kind === 'set' ? 'Undo' : 'Remove'}
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={upload} />
          </div>
          {errors.screenshot && <p className="field-error">{errors.screenshot}</p>}
        </div>
      </div>

      <div className="editor-foot">
        {formError && (
          <p className="admin-error" role="alert">
            {formError}
          </p>
        )}
        <div className="editor-buttons">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn" disabled={saving || capturing}>
            {saving ? 'Saving…' : isNew ? `Add ${label.toLowerCase()}` : 'Save changes'}
          </button>
        </div>
      </div>
    </form>
  )
}

/* ---------- fields ---------- */

function FieldInput({
  field,
  value,
  error,
  onChange,
  children,
}: {
  field: Field
  value: string | string[]
  error?: string
  onChange: (v: string | string[]) => void
  children?: ReactNode
}) {
  const id = `f-${field.name}`
  const count = typeof value === 'string' && field.max ? `${value.length}/${field.max}` : null
  const over = typeof value === 'string' && field.max ? value.length > field.max : false

  const labelEl = (
    <label htmlFor={field.kind === 'list' ? undefined : id}>
      {field.label} {field.required && <span className="req">required</span>}
      {count && <span className={`count${over ? ' is-over' : ''}`}>{count}</span>}
    </label>
  )

  let control: ReactNode
  if (field.kind === 'list') {
    control = <ListInput field={field} items={value as string[]} onChange={onChange} />
  } else if (field.kind === 'textarea') {
    control = (
      <textarea id={id} rows={3} value={value as string} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error} />
    )
  } else if (field.kind === 'select') {
    control = (
      <select id={id} value={value as string} onChange={(e) => onChange(e.target.value)}>
        <option value="">None</option>
        {field.options?.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    )
  } else {
    control = (
      <input
        id={id}
        type={field.kind === 'url' ? 'url' : 'text'}
        value={value as string}
        placeholder={field.placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
      />
    )
  }

  return (
    <>
      <div className={`field${error ? ' has-error' : ''}`} data-field={field.name}>
        {labelEl}
        {control}
        {field.help && <p className="help">{field.help}</p>}
        {field.kind === 'url' && isLocalUrl(value) && (
          <p className="field-warn">This address only works on this computer. Replace it before the site goes live.</p>
        )}
        {error && <p className="field-error">{error}</p>}
      </div>
      {children}
    </>
  )
}

function ListInput({ field, items, onChange }: { field: Field; items: string[]; onChange: (v: string[]) => void }) {
  const list = useMemo(() => items, [items])
  const update = (i: number, v: string) => onChange(list.map((x, j) => (j === i ? v : x)))
  const removeAt = (i: number) => onChange(list.filter((_, j) => j !== i))
  const swap = (i: number, j: number) => {
    const next = [...list]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }
  const full = field.maxItems !== undefined && list.length >= field.maxItems

  return (
    <div className="list-input">
      {list.map((item, i) => (
        <div className="list-row" key={i}>
          {field.itemKind === 'textarea' ? (
            <textarea rows={3} value={item} onChange={(e) => update(i, e.target.value)} aria-label={`${field.label} ${i + 1}`} />
          ) : (
            <input value={item} onChange={(e) => update(i, e.target.value)} aria-label={`${field.label} ${i + 1}`} />
          )}
          <span className="list-actions">
            <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => swap(i, i - 1)}>
              ↑
            </button>
            <button type="button" aria-label="Move down" disabled={i === list.length - 1} onClick={() => swap(i, i + 1)}>
              ↓
            </button>
            <button type="button" aria-label="Remove" className="danger" onClick={() => removeAt(i)}>
              ×
            </button>
          </span>
          {field.max && item.length > field.max && (
            <p className="field-error list-row-error">
              {item.length}/{field.max} characters
            </p>
          )}
        </div>
      ))}
      <button type="button" className="list-add" disabled={full} onClick={() => onChange([...list, ''])}>
        + Add {field.itemKind === 'textarea' ? 'paragraph' : 'item'}
        {field.maxItems ? ` (${list.length}/${field.maxItems})` : ''}
      </button>
    </div>
  )
}
