import Header from './components/Header.tsx'
import Hero from './components/Hero.tsx'
import Subsidiaries from './components/Subsidiaries.tsx'
import Products from './components/Products.tsx'
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
        <Subsidiaries />
        <Products />
      </main>
      <Footer />
    </>
  )
}
