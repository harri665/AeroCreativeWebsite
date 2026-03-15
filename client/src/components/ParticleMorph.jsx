import { useRef, useMemo, useEffect, useState, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'

const PARTICLE_COUNT = 12000

// Sample points on a mesh surface
function sampleMeshSurface(geometry, count) {
  const positions = new Float32Array(count * 3)
  const posAttr = geometry.getAttribute('position')
  const indexAttr = geometry.getIndex()

  // Compute triangle areas for weighted sampling
  const triangleCount = indexAttr
    ? indexAttr.count / 3
    : posAttr.count / 3

  const areas = new Float32Array(triangleCount)
  const va = new THREE.Vector3()
  const vb = new THREE.Vector3()
  const vc = new THREE.Vector3()
  let totalArea = 0

  for (let i = 0; i < triangleCount; i++) {
    let ia, ib, ic
    if (indexAttr) {
      ia = indexAttr.getX(i * 3)
      ib = indexAttr.getX(i * 3 + 1)
      ic = indexAttr.getX(i * 3 + 2)
    } else {
      ia = i * 3
      ib = i * 3 + 1
      ic = i * 3 + 2
    }
    va.fromBufferAttribute(posAttr, ia)
    vb.fromBufferAttribute(posAttr, ib)
    vc.fromBufferAttribute(posAttr, ic)

    const ab = new THREE.Vector3().subVectors(vb, va)
    const ac = new THREE.Vector3().subVectors(vc, va)
    const area = ab.cross(ac).length() * 0.5
    areas[i] = area
    totalArea += area
  }

  // Build CDF
  const cdf = new Float32Array(triangleCount)
  cdf[0] = areas[0] / totalArea
  for (let i = 1; i < triangleCount; i++) {
    cdf[i] = cdf[i - 1] + areas[i] / totalArea
  }

  // Sample
  for (let i = 0; i < count; i++) {
    const r = Math.random()
    let triIdx = 0
    for (let j = 0; j < triangleCount; j++) {
      if (r <= cdf[j]) { triIdx = j; break }
    }

    let ia, ib, ic
    if (indexAttr) {
      ia = indexAttr.getX(triIdx * 3)
      ib = indexAttr.getX(triIdx * 3 + 1)
      ic = indexAttr.getX(triIdx * 3 + 2)
    } else {
      ia = triIdx * 3
      ib = triIdx * 3 + 1
      ic = triIdx * 3 + 2
    }

    va.fromBufferAttribute(posAttr, ia)
    vb.fromBufferAttribute(posAttr, ib)
    vc.fromBufferAttribute(posAttr, ic)

    // Random barycentric
    let u = Math.random()
    let v = Math.random()
    if (u + v > 1) { u = 1 - u; v = 1 - v }

    positions[i * 3] = va.x + u * (vb.x - va.x) + v * (vc.x - va.x)
    positions[i * 3 + 1] = va.y + u * (vb.y - va.y) + v * (vc.y - va.y)
    positions[i * 3 + 2] = va.z + u * (vb.z - va.z) + v * (vc.z - va.z)
  }

  return positions
}

// Normalize geometry to fit within a unit sphere and center it
function normalizeGeometry(geometry) {
  geometry.computeBoundingBox()
  const box = geometry.boundingBox
  const center = new THREE.Vector3()
  box.getCenter(center)
  const size = new THREE.Vector3()
  box.getSize(size)
  const maxDim = Math.max(size.x, size.y, size.z)
  const scale = 3 / maxDim // fit in radius ~3

  const posAttr = geometry.getAttribute('position')
  for (let i = 0; i < posAttr.count; i++) {
    posAttr.setX(i, (posAttr.getX(i) - center.x) * scale)
    posAttr.setY(i, (posAttr.getY(i) - center.y) * scale)
    posAttr.setZ(i, (posAttr.getZ(i) - center.z) * scale)
  }
  posAttr.needsUpdate = true
  return geometry
}

// Generate random sphere positions for initial state
function randomSpherePositions(count, radius = 4) {
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const r = radius * Math.cbrt(Math.random())
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = r * Math.cos(phi)
  }
  return positions
}

// Vertex shader
const vertexShader = `
  attribute vec3 positionTarget;
  attribute float aRandom;
  uniform float uProgress;
  uniform float uTime;
  varying float vAlpha;
  varying float vRandom;

  void main() {
    vRandom = aRandom;

    // Ease function
    float p = uProgress;

    // Mix positions
    vec3 pos = mix(position, positionTarget, p);

    // Add turbulence during transition (strongest at p=0.5)
    float turbulence = sin(p * 3.14159) * 1.5;
    pos.x += sin(aRandom * 100.0 + uTime * 2.0) * turbulence * aRandom;
    pos.y += cos(aRandom * 150.0 + uTime * 2.5) * turbulence * aRandom;
    pos.z += sin(aRandom * 200.0 + uTime * 3.0) * turbulence * aRandom;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Size attenuation
    float size = 2.5 + aRandom * 1.5;
    gl_PointSize = size * (300.0 / -mvPosition.z);

    // Alpha based on depth and transition
    vAlpha = 0.6 + 0.4 * (1.0 - sin(p * 3.14159) * 0.5);
  }
`

// Fragment shader
const fragmentShader = `
  varying float vAlpha;
  varying float vRandom;
  uniform vec3 uColor1;
  uniform vec3 uColor2;

  void main() {
    // Circular point
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);
    if (dist > 0.5) discard;

    // Soft edge
    float alpha = smoothstep(0.5, 0.2, dist) * vAlpha;

    // Color mix based on random
    vec3 color = mix(uColor1, uColor2, vRandom);

    gl_FragColor = vec4(color, alpha);
  }
`

export default function ParticleMorph({ models, onModelChange }) {
  const pointsRef = useRef()
  const materialRef = useRef()
  const { camera } = useThree()

  const [geometries, setGeometries] = useState([])
  const [sampledPositions, setSampledPositions] = useState([])
  const currentIndex = useRef(0)
  const nextIndex = useRef(1)
  const progress = useRef(0)
  const isTransitioning = useRef(false)
  const holdTimer = useRef(0)
  const holdDuration = 5 // seconds to hold each model

  // Load STL files
  useEffect(() => {
    if (!models || models.length === 0) return
    const loader = new STLLoader()
    const loadPromises = models.map(
      (model) =>
        new Promise((resolve) => {
          loader.load(
            model.url,
            (geometry) => {
              normalizeGeometry(geometry)
              resolve(geometry)
            },
            undefined,
            () => resolve(null)
          )
        })
    )

    Promise.all(loadPromises).then((geos) => {
      const valid = geos.filter(Boolean)
      setGeometries(valid)
      if (valid.length > 0) {
        const sampled = valid.map((g) => sampleMeshSurface(g, PARTICLE_COUNT))
        setSampledPositions(sampled)
      }
    })
  }, [models])

  // Random values per particle
  const randoms = useMemo(() => {
    const arr = new Float32Array(PARTICLE_COUNT)
    for (let i = 0; i < PARTICLE_COUNT; i++) arr[i] = Math.random()
    return arr
  }, [])

  // Initial positions (random sphere)
  const initialPositions = useMemo(() => randomSpherePositions(PARTICLE_COUNT), [])

  // Set camera position
  useEffect(() => {
    camera.position.set(0, 0, 8)
    camera.lookAt(0, 0, 0)
  }, [camera])

  // Animation loop
  useFrame((state, delta) => {
    if (!materialRef.current || sampledPositions.length === 0) return
    if (!pointsRef.current) return

    const geo = pointsRef.current.geometry
    const posAttr = geo.getAttribute('position')
    const targetAttr = geo.getAttribute('positionTarget')

    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime

    if (!isTransitioning.current) {
      // Holding on current model
      holdTimer.current += delta
      if (holdTimer.current >= holdDuration && sampledPositions.length > 1) {
        // Start transition
        isTransitioning.current = true
        holdTimer.current = 0
        progress.current = 0

        nextIndex.current = (currentIndex.current + 1) % sampledPositions.length

        // Set target positions
        const target = sampledPositions[nextIndex.current]
        for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
          targetAttr.array[i] = target[i]
        }
        targetAttr.needsUpdate = true
      }
    } else {
      // Transitioning
      progress.current += delta * 0.5 // ~2 second transition
      if (progress.current >= 1) {
        progress.current = 1
        isTransitioning.current = false

        // Copy target to position
        const target = sampledPositions[nextIndex.current]
        for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
          posAttr.array[i] = target[i]
        }
        posAttr.needsUpdate = true

        currentIndex.current = nextIndex.current
        progress.current = 0
        materialRef.current.uniforms.uProgress.value = 0

        if (onModelChange) {
          onModelChange(currentIndex.current)
        }
        return
      }

      // Smooth easing
      const eased = progress.current < 0.5
        ? 4 * progress.current * progress.current * progress.current
        : 1 - Math.pow(-2 * progress.current + 2, 3) / 2

      materialRef.current.uniforms.uProgress.value = eased
    }
  })

  // Initialize geometry when sampled positions are ready
  useEffect(() => {
    if (sampledPositions.length === 0 || !pointsRef.current) return

    const geo = pointsRef.current.geometry
    const firstPos = sampledPositions[0]

    // Set initial positions — start from random sphere, transition to first model
    const posAttr = geo.getAttribute('position')
    const targetAttr = geo.getAttribute('positionTarget')

    for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
      targetAttr.array[i] = firstPos[i]
    }
    targetAttr.needsUpdate = true

    // Trigger initial morph from sphere to first model
    isTransitioning.current = true
    progress.current = 0
    currentIndex.current = 0
    nextIndex.current = 0

    if (onModelChange) onModelChange(0)
  }, [sampledPositions, onModelChange])

  return (
    <points ref={pointsRef} rotation={[0, 0, 0]}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={initialPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-positionTarget"
          count={PARTICLE_COUNT}
          array={new Float32Array(PARTICLE_COUNT * 3)}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aRandom"
          count={PARTICLE_COUNT}
          array={randoms}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{
          uProgress: { value: 0 },
          uTime: { value: 0 },
          uColor1: { value: new THREE.Color('#FF6B00') },
          uColor2: { value: new THREE.Color('#CC2200') },
        }}
      />
    </points>
  )
}
