import { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'

function normalizeGeometry(geometry) {
  geometry.computeBoundingBox()
  const box = geometry.boundingBox
  const center = new THREE.Vector3()
  box.getCenter(center)
  const size = new THREE.Vector3()
  box.getSize(size)
  const maxDim = Math.max(size.x, size.y, size.z)
  const scale = 3.5 / maxDim

  const posAttr = geometry.getAttribute('position')
  for (let i = 0; i < posAttr.count; i++) {
    posAttr.setX(i, (posAttr.getX(i) - center.x) * scale)
    posAttr.setY(i, (posAttr.getY(i) - center.y) * scale)
    posAttr.setZ(i, (posAttr.getZ(i) - center.z) * scale)
  }
  posAttr.needsUpdate = true
  geometry.computeVertexNormals()
  return geometry
}

export default function TurntableModel({ models, onModelChange }) {
  const groupRef = useRef()
  const meshRef = useRef()
  const materialRef = useRef()
  const [geometries, setGeometries] = useState([])
  const currentIndex = useRef(0)
  const holdTimer = useRef(0)
  const holdDuration = 6
  const fadeState = useRef('visible') // 'visible' | 'fading-out' | 'fading-in'
  const fadeProgress = useRef(1)
  const fadeDuration = 0.6

  // Load all STLs
  useEffect(() => {
    if (!models || models.length === 0) return
    const loader = new STLLoader()
    const promises = models.map(
      (model) =>
        new Promise((resolve) => {
          loader.load(
            model.url,
            (geo) => resolve(normalizeGeometry(geo)),
            undefined,
            () => resolve(null)
          )
        })
    )
    Promise.all(promises).then((geos) => {
      const valid = geos.filter(Boolean)
      setGeometries(valid)
      if (onModelChange && valid.length > 0) onModelChange(0)
    })
  }, [models, onModelChange])

  // Set initial geometry
  useEffect(() => {
    if (geometries.length > 0 && meshRef.current) {
      meshRef.current.geometry = geometries[0]
    }
  }, [geometries])

  useFrame((state, delta) => {
    if (!groupRef.current || geometries.length === 0) return

    // Slow rotation
    groupRef.current.rotation.y += delta * 0.3

    // Gentle hover bob
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.15

    // Handle transitions
    if (fadeState.current === 'visible') {
      holdTimer.current += delta
      if (holdTimer.current >= holdDuration && geometries.length > 1) {
        fadeState.current = 'fading-out'
        fadeProgress.current = 1
        holdTimer.current = 0
      }
    } else if (fadeState.current === 'fading-out') {
      fadeProgress.current -= delta / fadeDuration
      if (fadeProgress.current <= 0) {
        fadeProgress.current = 0
        // Swap model
        currentIndex.current = (currentIndex.current + 1) % geometries.length
        if (meshRef.current) {
          meshRef.current.geometry = geometries[currentIndex.current]
        }
        if (onModelChange) onModelChange(currentIndex.current)
        fadeState.current = 'fading-in'
      }
    } else if (fadeState.current === 'fading-in') {
      fadeProgress.current += delta / fadeDuration
      if (fadeProgress.current >= 1) {
        fadeProgress.current = 1
        fadeState.current = 'visible'
      }
    }

    // Apply opacity + scale from fade
    if (materialRef.current) {
      materialRef.current.opacity = fadeProgress.current
    }
    if (groupRef.current) {
      const s = 0.85 + 0.15 * fadeProgress.current
      groupRef.current.scale.setScalar(s)
    }
  })

  if (geometries.length === 0) return null

  return (
    <>
      {/* Lighting rig */}
      <ambientLight intensity={0.15} />

      {/* Key light — warm, from upper right */}
      <directionalLight
        position={[5, 4, 3]}
        intensity={1.8}
        color="#ffffff"
      />

      {/* Orange rim light — left side */}
      <pointLight
        position={[-5, 2, -2]}
        intensity={40}
        color="#FF6B00"
        distance={15}
        decay={2}
      />

      {/* Red rim light — right-back */}
      <pointLight
        position={[4, -1, -4]}
        intensity={25}
        color="#CC2200"
        distance={12}
        decay={2}
      />

      {/* Cool fill from below */}
      <pointLight
        position={[0, -4, 2]}
        intensity={8}
        color="#334455"
        distance={10}
        decay={2}
      />

      {/* Ground reflection */}
      <pointLight
        position={[0, -3, 0]}
        intensity={5}
        color="#FF6B00"
        distance={8}
        decay={2}
      />

      <group ref={groupRef} rotation={[-0.15, 0, 0]}>
        <mesh ref={meshRef} geometry={geometries[0]}>
          <meshPhysicalMaterial
            ref={materialRef}
            color="#e8e8e8"
            metalness={0.6}
            roughness={0.25}
            clearcoat={0.3}
            clearcoatRoughness={0.2}
            envMapIntensity={1}
            transparent
            opacity={1}
          />
        </mesh>

        {/* Wireframe overlay for tech feel */}
        <mesh geometry={geometries.length > 0 ? geometries[currentIndex.current] : undefined}>
          <meshBasicMaterial
            color="#FF6B00"
            wireframe
            transparent
            opacity={0.04}
          />
        </mesh>
      </group>
    </>
  )
}
