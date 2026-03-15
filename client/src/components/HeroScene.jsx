import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import HeroModel from './HeroModel'

function Lighting() {
  return (
    <>
      {/* Ambient base */}
      <ambientLight intensity={0.15} />

      {/* Key light — warm orange from upper right */}
      <directionalLight
        position={[5, 4, 3]}
        intensity={1.8}
        color="#FF8C33"
      />

      {/* Rim light — strong orange backlight for edge glow */}
      <directionalLight
        position={[-4, 2, -3]}
        intensity={2.5}
        color="#FF6B00"
      />

      {/* Fill — subtle red from below */}
      <directionalLight
        position={[0, -3, 2]}
        intensity={0.6}
        color="#CC2200"
      />

      {/* Top accent */}
      <pointLight
        position={[0, 5, 0]}
        intensity={0.8}
        color="#FF6B00"
        distance={12}
      />

      {/* Ground bounce — faint warm */}
      <pointLight
        position={[0, -4, 3]}
        intensity={0.3}
        color="#442200"
        distance={10}
      />
    </>
  )
}

function GridFloor() {
  return (
    <group position={[0, -2.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <gridHelper
        args={[20, 20, '#FF6B00', '#222222']}
        rotation={[Math.PI / 2, 0, 0]}
      />
    </group>
  )
}

export default function HeroScene({ models, onModelChange }) {
  return (
    <div className="hero-canvas">
      <Canvas
        camera={{ position: [0, 1, 7], fov: 45 }}
        style={{ background: 'transparent' }}
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true }}
      >
        <Lighting />
        <Suspense fallback={null}>
          {models.length > 0 && (
            <HeroModel
              models={models}
              onModelChange={onModelChange}
            />
          )}
        </Suspense>
        <GridFloor />
      </Canvas>
    </div>
  )
}
