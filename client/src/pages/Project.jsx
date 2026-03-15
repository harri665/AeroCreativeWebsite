import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { API_URL, prefixApiUrl } from '../api'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Suspense } from 'react'
import * as THREE from 'three'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'

function STLViewer({ url }) {
  const [geometry, setGeometry] = useState(null)

  useEffect(() => {
    if (!url) return
    const loader = new STLLoader()
    loader.load(url, (geo) => {
      geo.computeBoundingBox()
      const box = geo.boundingBox
      const center = new THREE.Vector3()
      box.getCenter(center)
      const size = new THREE.Vector3()
      box.getSize(size)
      const maxDim = Math.max(size.x, size.y, size.z)
      const scale = 3 / maxDim

      const posAttr = geo.getAttribute('position')
      for (let i = 0; i < posAttr.count; i++) {
        posAttr.setX(i, (posAttr.getX(i) - center.x) * scale)
        posAttr.setY(i, (posAttr.getY(i) - center.y) * scale)
        posAttr.setZ(i, (posAttr.getZ(i) - center.z) * scale)
      }
      posAttr.needsUpdate = true
      geo.computeVertexNormals()
      setGeometry(geo)
    })
  }, [url])

  if (!geometry) return null

  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color="#1a1a1a"
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color="#FF6B00"
          wireframe
          transparent
          opacity={0.15}
        />
      </mesh>
    </group>
  )
}

export default function Project() {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])

  useEffect(() => {
    fetch(`${API_URL}/api/models/${id}`)
      .then(r => {
        if (!r.ok) throw new Error('Not found')
        return r.json()
      })
      .then(data => {
        // Prefix relative URLs with API_URL for production (absolute URLs are left as-is)
        data.stlUrl = prefixApiUrl(data.stlUrl)
        data.coverImage = prefixApiUrl(data.coverImage)
        if (data.images) {
          data.images = data.images.map(img => ({
            ...img,
            url: prefixApiUrl(img.url),
            originalUrl: prefixApiUrl(img.originalUrl),
          }))
        }
        setProject(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="project-detail-page">
        <div className="project-detail-container">
          <div className="loader">
            <div className="loader-spinner" />
            <span>Loading project...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="project-detail-page">
        <div className="project-detail-container">
          <Link to="/" className="project-back">&larr; Back to Projects</Link>
          <h2 className="section-title">Project Not Found</h2>
        </div>
      </div>
    )
  }

  // Strip HTML tags for plain text description
  const plainDescription = project.description
    ? project.description.replace(/<[^>]*>/g, '').trim()
    : ''

  const publishDate = project.datePublished
    ? new Date(project.datePublished).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      })
    : null

  return (
    <div className="project-detail-page">
      <div className="project-detail-container">
        <Link to="/" className="project-back">
          <span className="slashes"><span>/</span>/</span> Back to Projects
        </Link>

        {/* 3D Viewer or Cover Image */}
        {project.stlUrl ? (
          <div className="project-detail-viewer">
            <Canvas camera={{ position: [0, 0, 5.5], fov: 45 }}>
              <ambientLight intensity={0.4} />
              <directionalLight position={[5, 5, 5]} intensity={1.2} color="#ffffff" />
              <directionalLight position={[-4, 2, -3]} intensity={0.6} color="#FF6B00" />
              <directionalLight position={[0, -3, 0]} intensity={0.3} color="#CC2200" />
              <Suspense fallback={null}>
                <STLViewer url={project.stlUrl} />
              </Suspense>
              <OrbitControls
                enablePan={false}
                autoRotate
                autoRotateSpeed={1.5}
                minDistance={3}
                maxDistance={10}
              />
            </Canvas>
          </div>
        ) : project.coverImage ? (
          <div className="project-detail-viewer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}>
            <img
              src={project.coverImage}
              alt={project.name}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
          </div>
        ) : null}

        {/* Title & Meta */}
        <div className="project-detail-header">
          <h1 className="project-detail-title">{project.name}</h1>
          <div className="project-detail-meta">
            {publishDate && <span>{publishDate}</span>}
          </div>
        </div>

        {/* Description */}
        {(project.summary || plainDescription) && (
          <div className="project-detail-description">
            <div className="section-label">Description</div>
            {project.summary && (
              <p className="project-detail-summary">{project.summary}</p>
            )}
            {plainDescription && plainDescription !== project.summary && (
              <p className="project-detail-body">{plainDescription}</p>
            )}
          </div>
        )}

        {/* Image Gallery */}
        {project.images && project.images.length > 0 && (
          <div className="project-detail-gallery-section">
            <div className="section-label">Gallery</div>
            <div className="project-detail-gallery">
              {project.images.map(img => (
                <img
                  key={img.id}
                  src={img.url}
                  alt={project.name}
                  className="project-gallery-img"
                  loading="lazy"
                  onClick={() => setSelectedImage(img.originalUrl || img.url)}
                />
              ))}
            </div>
          </div>
        )}


      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div className="project-lightbox" onClick={() => setSelectedImage(null)}>
          <img src={selectedImage} alt="" />
        </div>
      )}
    </div>
  )
}
