import { API_URL } from '../api'
import MountainDivider from '../components/MountainDivider'

export default function About() {
  return (
    <>
      {/* Hero Banner */}
      <section className="about-hero">
        <div className="about-hero-overlay">
          <div className="about-hero-layout">
            <div className="about-portrait">
              <img
                src={`${API_URL}/api/img/insecure/rs:fill:560:0/q:85/plain/local:///uploads/andrew-professional.jpg`}
                alt="Andrew Widner"
                className="about-photo"
              />
            </div>
            <div className="about-hero-text">
              <div className="section-label">About</div>
              <h1 className="about-hero-title">
                <span className="slashes">//</span>Andrew Widner
              </h1>
              <p className="about-hero-role">
                Product Designer &bull; 3D Generalist &bull; Maker
              </p>
            </div>
          </div>
        </div>
        {/* <MountainDivider /> i dont really like the mountians here */}
      </section>

      {/* Bio */}
      <section className="about-section">
        <div className="about-bio">
          <div className="about-bio-accent" />
          <div className="about-bio-text">
            <p className="about-lead"> {/* FINDME Artist Statement */}
              AeroCreative is the creative outlet of Andrew Widner — bridging
              digital design with physical fabrication from Boulder, Colorado.
            </p>
            <p>
              With four years of fabrication experience at CU Boulder's ATLAS Institute,
              Andrew balances technical rigor with creative expression. From precision
              CAD work in Fusion 360 to organic sculpting in Blender, every project
              pushes the boundary between the digital and the tangible.
            </p>
          </div>
        </div>
      </section>

      {/* FINDME Experience */}
      <section className="about-section">
        <div className="section-label">Experience</div>
        <h2 className="section-title">What I Do</h2>
        <div className="about-timeline">
          {/*start item 1*/}
          <div className="timeline-item">
            <div className="timeline-marker" />
            <div className="timeline-content">
              <h3 className="timeline-title">CU3D — Founder & President</h3>
              <p className="timeline-desc">
                Leading a community of makers passionate about CAD and 3D printing
                at CU Boulder. Organizing workshops, build sessions, and collaborative
                design projects.
              </p>
            </div>
          </div>
          {/*end item 1 */}
          {/*start item 2*/}
          <div className="timeline-item">
            <div className="timeline-marker" />
            <div className="timeline-content">
              <h3 className="timeline-title">BendingLight Studio — Chief Designer</h3>
              <p className="timeline-desc">
                Designing kinetic polarization light art that pushes the boundaries
                of what's possible with modern fabrication tools. Combining optics,
                electronics, and precision engineering.
              </p>
            </div>
          </div>
          {/*end item 2 */} 
            {/*start item 3*/}
          <div className="timeline-item">
            <div className="timeline-marker" />
            <div className="timeline-content">
              <h3 className="timeline-title">ATLAS Institute — Fabrication</h3>
              <p className="timeline-desc">
                Four years of hands-on experience across CNC machining, laser cutting,
                3D printing, woodworking, and electronics prototyping.
              </p>
            </div>
          </div>
          {/*end item 3 */}

          {/* FINDME TIMELINE END add more timeline items here (idk what jobs you want) */}
        </div>
      </section>

      {/* Skills */}
      {/* FINDME Skills List */}
      <section className="about-section">
        <div className="section-label">Toolkit</div>
        <h2 className="section-title">Skills & Tools</h2>
        <div className="about-skills-categories">
          {/* THIS IS THE DIGITIAL SKILLS  */}
          <div className="skill-category">
            <h3 className="skill-category-title">Digital</h3>
            <div className="skills-grid">
              <div className="skill-item">
                <div className="skill-name">Blender</div>
                <div className="skill-detail">Modeling, Animation, VFX</div>
              </div>
              <div className="skill-item">
                <div className="skill-name">Fusion 360</div>
                <div className="skill-detail">Parametric CAD, CAM</div>
              </div>
              <div className="skill-item">
                <div className="skill-name">Video Production</div>
                <div className="skill-detail">After Effects, Premiere</div>
              </div>
            </div>
          </div>
            {/* THIS IS THE PHYSICAL SKILLS  */}
          <div className="skill-category">
            <h3 className="skill-category-title">Physical</h3>
            <div className="skills-grid">
              <div className="skill-item">
                <div className="skill-name">3D Printing</div>
                <div className="skill-detail">FDM, Resin, Multi-material</div>
              </div>
              <div className="skill-item">
                <div className="skill-name">Woodworking</div>
                <div className="skill-detail">CNC, Joinery, Finishing</div>
              </div>
              <div className="skill-item">
                <div className="skill-name">Electronics</div>
                <div className="skill-detail">Arduino, LED, Sensors</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
