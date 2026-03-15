import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { Environment } from '@react-three/drei'
import TurntableModel from './TurntableModel'

export default function HeroScene({ models, onModelChange }) {
  return (
    <div className="hero-canvas">
      <Canvas
        camera={{ position: [0, 0.5, 7], fov: 45 }}
        style={{ background: 'transparent' }}
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true, toneMapping: 3 }}
        shadows
      >
        <Suspense fallback={null}>
          {models.length > 0 && (
            <TurntableModel
              models={models}
              onModelChange={onModelChange}
            />
          )}
          <Environment preset="city" environmentIntensity={0.3} />
        </Suspense>
      </Canvas>
    </div>
  )
}
