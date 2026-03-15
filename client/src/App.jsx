import { useState, useEffect } from 'react'
import { Link, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import './App.css'
import Home from './pages/Home.jsx'
import About from './pages/About.jsx'
import Project from './pages/Project.jsx'
import Setup from './pages/Setup.jsx'

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const isSetup = location.pathname === '/setup'
  const [menuOpen, setMenuOpen] = useState(false)

  const goToSection = (hash) => {
    setMenuOpen(false)
    if (location.pathname === '/') {
      // Already on home — just scroll
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' })
    } else {
      // Navigate home, then scroll after render
      navigate('/')
      setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  return (
    <div className="app">
      {!isSetup && (
        <nav className={`navbar ${menuOpen ? 'menu-open' : ''}`}>
          <Link to="/" className="navbar-logo">
            <span className="slashes">//</span>
            <span className="brand-name">AEROCREATIVE</span>
            <span className="dot">.</span>
          </Link>
          <button
            className={`navbar-toggle ${menuOpen ? 'active' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span />
            <span />
            <span />
          </button>
          <ul className={`navbar-links ${menuOpen ? 'open' : ''}`}>
            <li>
              <a href="#projects" onClick={(e) => { e.preventDefault(); goToSection('projects') }}>Projects</a>
            </li>
            <li>
              <Link
                to="/about"
                className={location.pathname === '/about' ? 'active' : ''}
                onClick={() => setMenuOpen(false)}
              >
                About
              </Link>
            </li>
            <li>
              <a href="#contact" onClick={(e) => { e.preventDefault(); goToSection('contact') }}>Contact</a>
            </li>
            <li>
              <a
                href="https://www.youtube.com/@aerocreative"
                target="_blank"
                rel="noopener noreferrer"
              >
                YouTube
              </a>
            </li>
          </ul>
        </nav>
      )}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/project/:id" element={<Project />} />
        <Route path="/about" element={<About />} />
        <Route path="/setup" element={<Setup />} />
      </Routes>

      {!isSetup && (
        <footer className="footer">
          <span className="slashes">//</span> AEROCREATIVE &copy; {new Date().getFullYear()}
        </footer>
      )}
    </div>
  )
}

export default App
