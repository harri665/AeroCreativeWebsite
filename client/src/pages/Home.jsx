import { useEffect, useState, useCallback } from 'react'
import { API_URL, imgUrl } from '../api'
import HeroScene from '../components/HeroScene'
import ModelCard from '../components/ModelCard'
import MountainDivider from '../components/MountainDivider'

export default function Home() {
  const [models, setModels] = useState([])
  const [currentModelIndex, setCurrentModelIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_URL}/api/models`)
      .then((r) => r.json())
      .then((data) => {
        // Normalize and prefix relative URLs with API_URL for production
        const normalized = data.map(m => {
          const model = { ...m, url: m.stlUrl || m.url }
          if (API_URL) {
            if (model.url) model.url = API_URL + model.url
            if (model.stlUrl) model.stlUrl = API_URL + model.stlUrl
            if (model.coverImage) model.coverImage = API_URL + model.coverImage
            if (model.images) {
              model.images = model.images.map(img => ({
                ...img,
                url: img.url ? API_URL + img.url : img.url,
              }))
            }
          }
          return model
        })
        setModels(normalized)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Only models with an STL can appear in the 3D hero
  const stlModels = models.filter(m => m.url)

  const handleModelChange = useCallback((index) => {
    setCurrentModelIndex(index)
  }, [])

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <HeroScene models={stlModels} onModelChange={handleModelChange} />

        <div className="hero-overlay">
          <h1 className="hero-title">
            <span className="slashes">//</span>AEROCREATIVE<span className="brand-dot">.</span>
          </h1>
          <p className="hero-subtitle">
            3D Design &bull; Product Development &bull; Digital Fabrication
          </p>
        </div>

        {stlModels.length > 0 && (
          <div className="hero-model-name">
            {stlModels[currentModelIndex]?.name || ''}
          </div>
        )}

        <MountainDivider />

        <div className="hero-scroll-hint">
          <span>Scroll</span>
          <div className="scroll-line" />
        </div>
      </section>
      {/* About */}
      <section className="section" id="about">
        <div className="section-label">About</div>
        <h2 className="section-title">Andrew Widner</h2>
        <div className="about-content">
          <div className="about-portrait">
            <img
              src={imgUrl('local:///uploads/andrew-professional.jpg', 'rs:fill:560:0/q:85')}
              alt="Andrew Widner"
              className="about-photo"
            />
          </div>
          <div className="about-right">
            <div className="about-text"> {/* FINDME Artist Statement*/}
              <p>
                Product Designer and 3D Generalist studying Creative Technology &amp; Design
                at CU Boulder. Founder of CU3D and Chief Designer at BendingLight Studio.
              </p>
              <p>
                Specializing in bridging digital design with physical fabrication — from CAD
                modeling and 3D printing to woodworking and electronics integration.
              </p>
            </div>
            <div className="skills-grid"> {/* FINDME Skills List */}
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
        </div>
      </section>


      {/* Projects  */}
      {/* please dont touch this for the most part it will break i promise */}
      <section className="section" id="projects">
        <div className="section-label">Portfolio</div>
        <h2 className="section-title">Projects</h2>

        {loading ? (
          <div className="loader">
            <div className="loader-spinner" />
            <span>Loading models...</span>
          </div>
        ) : models.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>
            No models found. this could mean the backend is unreachable :( 
          </p>
        ) : (
          <div className="projects-grid">
            {models.map((model) => (
              <ModelCard key={model.name} model={model} />
            ))}
          </div>
        )}
      </section>



      {/* Contact */}
      <section className="section" id="contact">
        <div className="contact-content">
          <div className="section-label">Get in Touch</div>
          <h2 className="section-title">Let's Build Something</h2>
          <p className="section-desc" style={{ textAlign: 'center' }}>
            Open to collaborations, commissions, and creative projects.
          </p>
          <div className="contact-links"> {/* FINDME Contact Links */}
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
