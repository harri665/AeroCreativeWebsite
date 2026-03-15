import { useState, useEffect } from 'react'
import { Link, Routes, Route, useLocation } from 'react-router-dom'
import './App.css'
import Home from './pages/Home.jsx'
import About from './pages/About.jsx'
import Project from './pages/Project.jsx'
import Setup from './pages/Setup.jsx'

function App() {
  const location = useLocation()
  const isSetup = location.pathname === '/setup'
  const [menuOpen, setMenuOpen] = useState(false)

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
              <a href="/#projects" onClick={() => setMenuOpen(false)}>Projects</a>
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
              <a href="/#contact" onClick={() => setMenuOpen(false)}>Contact</a>
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
