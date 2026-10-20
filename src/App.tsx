import Header from './components/Header.tsx'
import Hero from './components/Hero.tsx'
import Approach from './components/Approach.tsx'
import Domains from './components/Domains.tsx'
import Subsidiaries from './components/Subsidiaries.tsx'
import Products from './components/Products.tsx'
import Method from './components/Method.tsx'
import Principles from './components/Principles.tsx'
import Contact from './components/Contact.tsx'
import Footer from './components/Footer.tsx'
import { useReveal } from './hooks/useReveal.ts'

export default function App() {
  useReveal()

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header />
      <main id="main">
        <Hero />
        <Approach />
        <Domains />
        <Subsidiaries />
        <Products />
        <Method />
        <Principles />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
