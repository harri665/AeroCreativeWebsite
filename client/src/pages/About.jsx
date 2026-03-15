export default function About() {
  return (
    <section className="section" style={{ paddingTop: '8rem' }}>
      <div className="section-label">About</div>
      <h2 className="section-title">The Story</h2>
      <div className="about-content">
        <div className="about-text">
          <p>
            AeroCreative is the creative outlet of Andrew Widner — a Product Designer
            and 3D Generalist based in Boulder, Colorado.
          </p>
          <p>
            With four years of fabrication experience at CU Boulder's ATLAS Institute,
            Andrew bridges the gap between digital design and physical making. From
            precision CAD work in Fusion 360 to organic sculpting in Blender, every
            project balances technical rigor with creative expression.
          </p>
          <p>
            As founder and president of CU3D, Andrew leads a community of makers
            passionate about CAD and 3D printing. At BendingLight Studio, he designs
            kinetic polarization light art that pushes the boundaries of what's possible
            with modern fabrication tools.
          </p>
        </div>
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
          <div className="skill-item">
            <div className="skill-name">Video Production</div>
            <div className="skill-detail">After Effects, Premiere</div>
          </div>
        </div>
      </div>
    </section>
  )
}
