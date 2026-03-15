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
  const scale = 3.2 / maxDim

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

export default function HeroModel({ models, onModelChange }) {
  const groupRef = useRef()
  const meshRef = useRef()
  const wireRef = useRef()
  const [geometries, setGeometries] = useState([])
  const currentIndex = useRef(0)
  const holdTimer = useRef(0)
  const phase = useRef('visible') // 'visible' | 'fadeOut' | 'fadeIn'
  const fadeProgress = useRef(1)
  const holdDuration = 6

  // Load all STLs
  useEffect(() => {
    if (!models || models.length === 0) return
    const loader = new STLLoader()
    Promise.all(
      models.map(
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
    ).then((geos) => {
      const valid = geos.filter(Boolean)
      setGeometries(valid)
      if (onModelChange && valid.length > 0) onModelChange(0)
    })
  }, [models, onModelChange])

  // Apply first geometry once loaded
  useEffect(() => {
    if (geometries.length === 0) return
    if (meshRef.current) meshRef.current.geometry = geometries[0]
    if (wireRef.current) wireRef.current.geometry = geometries[0]
  }, [geometries])

  useFrame((state, delta) => {
    if (!groupRef.current || geometries.length === 0) return

    // Slow rotation
    groupRef.current.rotation.y += delta * 0.3

    // Gentle floating bob
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.15

    if (!meshRef.current || !wireRef.current) return

    // Handle transitions
    if (phase.current === 'visible') {
      holdTimer.current += delta
      if (holdTimer.current >= holdDuration && geometries.length > 1) {
        phase.current = 'fadeOut'
        holdTimer.current = 0
        fadeProgress.current = 1
      }
    } else if (phase.current === 'fadeOut') {
      fadeProgress.current -= delta * 1.5 // ~0.65s fade
      if (fadeProgress.current <= 0) {
        fadeProgress.current = 0
        // Swap model
        currentIndex.current = (currentIndex.current + 1) % geometries.length
        const nextGeo = geometries[currentIndex.current]
        meshRef.current.geometry = nextGeo
        wireRef.current.geometry = nextGeo
        if (onModelChange) onModelChange(currentIndex.current)
        phase.current = 'fadeIn'
      }
    } else if (phase.current === 'fadeIn') {
      fadeProgress.current += delta * 1.5
      if (fadeProgress.current >= 1) {
        fadeProgress.current = 1
        phase.current = 'visible'
      }
    }

    // Apply fade to materials
    const opacity = fadeProgress.current
    meshRef.current.material.opacity = opacity * 0.85
    wireRef.current.material.opacity = opacity * 0.2

    // Scale punch on fade in
    const scaleEase = phase.current === 'fadeIn'
      ? 0.9 + 0.1 * easeOutBack(fadeProgress.current)
      : 0.9 + 0.1 * fadeProgress.current
    groupRef.current.scale.setScalar(scaleEase)
  })

  if (geometries.length === 0) return null

  return (
    <group ref={groupRef} rotation={[-0.3, 0, 0]}>
      {/* Solid model */}
      <mesh ref={meshRef}>
        <meshStandardMaterial
          color="#1a1a1a"
          metalness={0.7}
          roughness={0.25}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Wireframe overlay */}
      <mesh ref={wireRef}>
        <meshBasicMaterial
          color="#FF6B00"
          wireframe
          transparent
          opacity={0.2}
        />
      </mesh>
    </group>
  )
}

function easeOutBack(x) {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2)
}
