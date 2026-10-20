import { useCallback, useEffect, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import { products } from '../content/site.ts'
import { productList } from '../content/collections.ts'
import type { Product } from '../content/collections.ts'

const HASH_PREFIX = '#products/'

function StatusBadge({ status }: { status?: Product['status'] }) {
  if (!status) return null
  const tone = status === 'Live' ? 'is-live' : status === 'In development' ? 'is-dev' : 'is-beta'
  return <span className={`status ${tone}`}>{status}</span>
}

/** Screenshot if one is set, otherwise the monogram on the engineering grid. */
function ProductVisual({ product, large = false }: { product: Product; large?: boolean }) {
  return (
    <div className={`product-visual${large ? ' is-large' : ''}`} aria-hidden="true">
      {product.image ? <img src={product.image} alt="" loading="lazy" width={1440} height={900} /> : <span className="product-monogram">{product.monogram}</span>}
    </div>
  )
}

export default function Products() {
  const [openSlug, setOpenSlug] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const leavingRef = useRef(false) // true when a link inside the dialog navigates elsewhere
  const current = productList.find((p) => p.slug === openSlug) ?? null

  const open = useCallback((slug: string, opener?: HTMLElement) => {
    openerRef.current = opener ?? null
    setOpenSlug(slug)
    history.replaceState(null, '', `${HASH_PREFIX}${slug}`)
  }, [])

  const close = useCallback(() => {
    dialogRef.current?.close()
  }, [])

  // Open directly from a shared link such as /#products/e-loans
  useEffect(() => {
    const fromHash = () => {
      const { hash } = window.location
      if (!hash.startsWith(HASH_PREFIX)) return
      const slug = hash.slice(HASH_PREFIX.length)
      if (productList.some((p) => p.slug === slug)) {
        document.getElementById('products')?.scrollIntoView()
        setOpenSlug(slug)
      }
    }
    fromHash()
    window.addEventListener('hashchange', fromHash)
    return () => window.removeEventListener('hashchange', fromHash)
  }, [])

  // Keep the native dialog in sync with state
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (current && !dialog.open) dialog.showModal()
  }, [current])

  const onDialogClose = () => {
    setOpenSlug(null)
    if (leavingRef.current) {
      leavingRef.current = false
      return
    }
    history.replaceState(null, '', '#products')
    openerRef.current?.focus({ preventScroll: true })
  }

  const leaveTo = () => {
    leavingRef.current = true
    close()
  }

  // Click on the dimmed backdrop (outside the panel) closes the dialog
  const onDialogClick = (e: MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) close()
  }

  return (
    <section className="section products band" id="products">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow reveal">{products.eyebrow}</p>
          <h2 className="h1 reveal">{products.title}</h2>
          <p className="section-intro reveal">{products.intro}</p>
        </div>

        <ul className="product-grid">
          {productList.map((p) => (
            <li className="product-card reveal" key={p.slug}>
              <ProductVisual product={p} />
              <div className="product-card-body">
                <div className="product-card-meta">
                  <span className="product-category">{p.category}</span>
                  <StatusBadge status={p.status} />
                </div>
                <h3 className="h2">{p.name}</h3>
                <p>{p.summary}</p>
                {/* The ::after of this button stretches over the whole card */}
                <button
                  type="button"
                  className="product-open"
                  onClick={(e) => open(p.slug, e.currentTarget)}
                  aria-haspopup="dialog"
                >
                  View details<span className="visually-hidden"> for {p.name}</span>
                  <span aria-hidden="true"> →</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <dialog
        ref={dialogRef}
        className="product-dialog"
        aria-labelledby="product-dialog-title"
        onClose={onDialogClose}
        onClick={onDialogClick}
      >
        {current && (
          <div className={`product-dialog-panel${current.image ? ' has-image' : ''}`}>
            <button type="button" className="dialog-close" onClick={close}>
              <span className="visually-hidden">Close</span>
              <span aria-hidden="true">×</span>
            </button>

            <ProductVisual product={current} large />

            <div className="product-dialog-body">
              <div className="product-card-meta">
                <span className="product-category">{current.category}</span>
                <StatusBadge status={current.status} />
              </div>
              <h3 className="h1" id="product-dialog-title">
                {current.name}
              </h3>
              <p className="lead">{current.summary}</p>

              {current.details?.map((d) => (
                <p className="product-detail" key={d}>
                  {d}
                </p>
              ))}

              {current.features && current.features.length > 0 && (
                <>
                  <h4 className="product-subhead">Key features</h4>
                  <ul className="feature-list">
                    {current.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </>
              )}

              <div className="product-dialog-actions">
                {current.url && (
                  <a className="btn" href={current.url} target="_blank" rel="noopener noreferrer">
                    Visit {current.name}
                    <span aria-hidden="true">↗</span>
                  </a>
                )}
                <a className="btn btn-ghost" href="#contact" onClick={leaveTo}>
                  Ask about {current.name}
                </a>
              </div>
            </div>
          </div>
        )}
      </dialog>
    </section>
  )
}
