import { Link, Routes, Route, useLocation } from 'react-router-dom'
import './App.css'
import Home from './pages/Home.jsx'
import About from './pages/About.jsx'

function App() {
  const location = useLocation()

  return (
    <div className="app">
      <nav className="navbar">
        <Link to="/" className="navbar-logo">
          <span className="slashes">//</span>
          <span className="brand-name">AEROCREATIVE</span>
          <span className="dot">.</span>
        </Link>
        <ul className="navbar-links">
          <li>
            <a href="/#projects">Projects</a>
          </li>
          <li>
            <Link to="/about" className={location.pathname === '/about' ? 'active' : ''}>
              About
            </Link>
          </li>
          <li>
            <a href="/#contact">Contact</a>
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

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>

      <footer className="footer">
        <span className="slashes">//</span> AEROCREATIVE &copy; {new Date().getFullYear()}
      </footer>
    </div>
  )
}

export default App
