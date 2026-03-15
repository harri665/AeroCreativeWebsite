import { Link } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Suspense, useEffect, useState } from 'react'
import * as THREE from 'three'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'

function STLModel({ url }) {
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
      const scale = 2.5 / maxDim

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
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]}>
      <meshStandardMaterial
        color="#FF6B00"
        metalness={0.3}
        roughness={0.4}
        emissive="#441800"
        emissiveIntensity={0.3}
      />
    </mesh>
  )
}

export default function ModelCard({ model }) {
  const hasStl = !!model.url
  const hasCover = !!model.coverImage
  const hasImages = model.images && model.images.length > 0
  const primaryImage = hasImages ? model.images[0] : null
  // For custom projects, use coverImage; for printables, use STL or first image
  const displayImage = hasCover ? model.coverImage : (primaryImage?.url || null)

  return (
    <Link
      to={`/project/${model.id}`}
      className="project-card"
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <div className="project-card-viewer">
        {hasStl ? (
          <Canvas
            camera={{ position: [0, 0, 5], fov: 45 }}
            style={{ background: 'transparent' }}
          >
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 5, 5]} intensity={1} />
            <directionalLight position={[-3, -3, 2]} intensity={0.3} color="#CC2200" />
            <Suspense fallback={null}>
              <STLModel url={model.stlUrl || model.url} />
            </Suspense>
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              autoRotate
              autoRotateSpeed={2}
            />
          </Canvas>
        ) : displayImage ? (
          <img
            src={displayImage}
            alt={model.name}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '100%', color: 'var(--text-muted)', fontSize: '0.8rem',
          }}>
            No preview
          </div>
        )}
      </div>
      <div className="project-card-info">
        <div className="project-card-title">{model.name}</div>
        <div className="project-card-meta">
          {model.summary || model.category || ''}
          {model.likesCount != null && ` \u2022 ${model.likesCount} likes`}
          {model.downloadCount != null && ` \u2022 ${model.downloadCount} downloads`}
        </div>
      </div>
    </Link>
  )
}
