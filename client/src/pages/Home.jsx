import { useEffect, useState, useCallback } from 'react'
import HeroScene from '../components/HeroScene'
import ModelCard from '../components/ModelCard'
import MountainDivider from '../components/MountainDivider'

export default function Home() {
  const [models, setModels] = useState([])
  const [currentModelIndex, setCurrentModelIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/models')
      .then((r) => r.json())
      .then((data) => {
        setModels(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleModelChange = useCallback((index) => {
    setCurrentModelIndex(index)
  }, [])

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <HeroScene models={models} onModelChange={handleModelChange} />

        <div className="hero-overlay">
          <h1 className="hero-title">
            <span className="slashes">//</span>AEROCREATIVE<span className="brand-dot">.</span>
          </h1>
          <p className="hero-subtitle">
            3D Design &bull; Product Development &bull; Digital Fabrication
          </p>
        </div>

        {models.length > 0 && (
          <div className="hero-model-name">
            {models[currentModelIndex]?.name || ''}
          </div>
        )}

        <MountainDivider />

        <div className="hero-scroll-hint">
          <span>Scroll</span>
          <div className="scroll-line" />
        </div>
      </section>

      {/* Projects */}
      <section className="section" id="projects">
        <div className="section-label">Portfolio</div>
        <h2 className="section-title">3D Models</h2>
        <p className="section-desc">
          Each model can be explored interactively. Drop STL files into the models folder to add more.
        </p>

        {loading ? (
          <div className="loader">
            <div className="loader-spinner" />
            <span>Loading models...</span>
          </div>
        ) : models.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>
            No models found. Add .stl files to server/public/models/ to get started.
          </p>
        ) : (
          <div className="projects-grid">
            {models.map((model) => (
              <ModelCard key={model.name} model={model} />
            ))}
          </div>
        )}
      </section>

      {/* About */}
      <section className="section" id="about">
        <div className="section-label">About</div>
        <h2 className="section-title">Andrew Widner</h2>
        <div className="about-content">
          <div className="about-text">
            <p>
              Product Designer and 3D Generalist studying Creative Technology &amp; Design
              at CU Boulder. Founder of CU3D and Chief Designer at BendingLight Studio.
            </p>
            <p>
              Specializing in bridging digital design with physical fabrication — from CAD
              modeling and 3D printing to woodworking and electronics integration.
            </p>
          </div>
          <div className="skills-grid">
            <div className="skill-item">
              <div className="skill-name">Blender</div>
              <div className="skill-detail">3D Modeling &amp; Animation</div>
            </div>
            <div className="skill-item">
              <div className="skill-name">Fusion 360</div>
              <div className="skill-detail">CAD &amp; Engineering</div>
            </div>
            <div className="skill-item">
              <div className="skill-name">3D Printing</div>
              <div className="skill-detail">FDM &amp; Resin</div>
            </div>
            <div className="skill-item">
              <div className="skill-name">VFX</div>
              <div className="skill-detail">Motion &amp; Compositing</div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="section" id="contact">
        <div className="contact-content">
          <div className="section-label">Get in Touch</div>
          <h2 className="section-title">Let's Build Something</h2>
          <p className="section-desc" style={{ textAlign: 'center' }}>
            Open to collaborations, commissions, and creative projects.
          </p>
          <div className="contact-links">
            <a
              href="https://www.youtube.com/@aerocreative"
              target="_blank"
              rel="noopener noreferrer"
              className="contact-link"
            >
              YouTube
            </a>
            <a
              href="https://linktr.ee/andrewwidner"
              target="_blank"
              rel="noopener noreferrer"
              className="contact-link"
            >
              Linktree
            </a>
            <a
              href="https://www.linkedin.com/in/andrew-widner-831544222/"
              target="_blank"
              rel="noopener noreferrer"
              className="contact-link"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
