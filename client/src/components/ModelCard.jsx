import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Suspense, useEffect, useState } from 'react'
import * as THREE from 'three'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'

function STLModel({ url }) {
  const [geometry, setGeometry] = useState(null)

  useEffect(() => {
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
  return (
    <div className="project-card">
      <div className="project-card-viewer">
        <Canvas
          camera={{ position: [0, 0, 5], fov: 45 }}
          style={{ background: 'transparent' }}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <directionalLight position={[-3, -3, 2]} intensity={0.3} color="#CC2200" />
          <Suspense fallback={null}>
            <STLModel url={model.url} />
          </Suspense>
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate
            autoRotateSpeed={2}
          />
        </Canvas>
      </div>
      <div className="project-card-info">
        <div className="project-card-title">{model.name}</div>
        <div className="project-card-meta">
          {model.size && `${(model.size / 1024 / 1024).toFixed(1)} MB`}
        </div>
      </div>
    </div>
  )
}
