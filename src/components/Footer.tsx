import Logo from './Logo.tsx'
import { brand } from '../content/brand.ts'

const year = new Date().getFullYear()

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <Logo className="footer-logo" />
        <p className="footer-motto">{brand.motto}</p>
        <div className="footer-meta">
          <span>{brand.legalName}</span>
          <span>{brand.registration}</span>
          <span>{brand.location}</span>
          <span>© {year}</span>
        </div>
      </div>
    </footer>
  )
}
