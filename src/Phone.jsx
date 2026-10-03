import { useMemo } from 'react'
import * as THREE from 'three'

// Proportions follow a current 6.1" phone (about 71.5 × 147 mm).
export const BODY = { w: 1.6, h: 3.3, d: 0.16, r: 0.27 }
export const SCREEN = { w: 1.47, h: 3.17, r: 0.21 }
export const SCREEN_ASPECT = SCREEN.w / SCREEN.h

function roundedRect(w, h, r) {
  const s = new THREE.Shape()
  const x = -w / 2
  const y = -h / 2
  s.moveTo(x + r, y)
  s.lineTo(x + w - r, y)
  s.quadraticCurveTo(x + w, y, x + w, y + r)
  s.lineTo(x + w, y + h - r)
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  s.lineTo(x + r, y + h)
  s.quadraticCurveTo(x, y + h, x, y + h - r)
  s.lineTo(x, y + r)
  s.quadraticCurveTo(x, y, x + r, y)
  return s
}

// ShapeGeometry's UVs are raw shape coordinates; rescale them to 0..1 so a
// texture spans the whole rounded rectangle.
function flatPanel(w, h, r) {
  const g = new THREE.ShapeGeometry(roundedRect(w, h, r), 24)
  const uv = g.attributes.uv
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / w + 0.5, uv.getY(i) / h + 0.5)
  return g
}

function useGeometries() {
  return useMemo(() => {
    const bevel = 0.035
    const body = new THREE.ExtrudeGeometry(roundedRect(BODY.w - bevel * 2, BODY.h - bevel * 2, BODY.r - bevel), {
      depth: BODY.d - bevel * 2,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 6,
      curveSegments: 32,
    })
    body.center()
    const bump = new THREE.ExtrudeGeometry(roundedRect(0.66, 0.66, 0.16), {
      depth: 0.02,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.01,
      bevelSegments: 3,
      curveSegments: 16,
    })
    bump.center()
    return {
      body,
      bump,
      glass: flatPanel(BODY.w - 0.03, BODY.h - 0.03, BODY.r - 0.015),
      screen: flatPanel(SCREEN.w, SCREEN.h, SCREEN.r),
      island: flatPanel(0.42, 0.12, 0.06),
    }
  }, [])
}

// The phone itself. `screenMaterial` is created by the scene so it can swap
// the video texture every frame without re-rendering this component.
export function Phone({ screenMaterial, frameColor = '#2c2d33' }) {
  const g = useGeometries()
  const front = BODY.d / 2
  return (
    <group>
      <mesh geometry={g.body}>
        <meshPhysicalMaterial color={frameColor} metalness={1} roughness={0.28} clearcoat={0.6} envMapIntensity={1.3} />
      </mesh>

      {/* Front: black glass, then the screen, then the camera island on top. */}
      <mesh geometry={g.glass} position={[0, 0, front + 0.002]}>
        <meshPhysicalMaterial color="#030304" roughness={0.08} metalness={0} clearcoat={1} envMapIntensity={1.4} />
      </mesh>
      <mesh geometry={g.screen} position={[0, 0, front + 0.004]} material={screenMaterial} />
      <mesh geometry={g.island} position={[0, SCREEN.h / 2 - 0.13, front + 0.006]}>
        <meshBasicMaterial color="#000" />
      </mesh>

      {/* Side buttons. */}
      {[
        [-1, 1.0, 0.16],
        [-1, 0.66, 0.26],
        [-1, 0.3, 0.26],
        [1, 0.6, 0.42],
      ].map(([side, y, len], i) => (
        <mesh key={i} position={[side * (BODY.w / 2 + 0.008), y, 0]}>
          <boxGeometry args={[0.025, len, 0.06]} />
          <meshStandardMaterial color={frameColor} metalness={1} roughness={0.3} />
        </mesh>
      ))}

      {/* Back: camera bump with three lenses. */}
      <group position={[-BODY.w / 2 + 0.44, BODY.h / 2 - 0.44, -front - 0.02]}>
        <mesh geometry={g.bump}>
          <meshPhysicalMaterial color={frameColor} metalness={0.6} roughness={0.2} clearcoat={1} />
        </mesh>
        {[
          [-0.14, 0.14],
          [-0.14, -0.14],
          [0.15, 0],
        ].map(([x, y], i) => (
          <mesh key={i} position={[x, y, -0.03]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.04, 32]} />
            <meshPhysicalMaterial color="#0b0b0e" metalness={0.4} roughness={0.05} clearcoat={1} />
          </mesh>
        ))}
      </group>
    </group>
  )
}
