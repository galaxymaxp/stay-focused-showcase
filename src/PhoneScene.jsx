import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import { BODY, Phone, SCREEN, SCREEN_ASPECT } from './Phone.jsx'
import { ScreenFeed } from './screenFeed.js'
import { poses } from './content.js'
import { story } from './story.js'

const CAM_Z = 8
const reduceMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const FIELDS = ['x', 'y', 'z', 'rx', 'ry', 'rz', 'focus']

function resolvePose(p) {
  const base = typeof p === 'string' ? poses[p] : { ...poses[p?.preset], ...p }
  return { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, focus: 0, ...base }
}

const ease = (t) => t * t * (3 - 2 * t)

// Moves the phone between the poses of the two steps around the current
// scroll position, so it travels with the scroll while the clip on its
// screen plays at its own speed.
function PhoneRig({ steps, feed, theme }) {
  const group = useRef()
  const glow = useRef()
  const targets = useMemo(() => steps.map((s) => resolvePose(s.pose)), [steps])
  const viewport = useThree((s) => s.viewport)
  const width = useThree((s) => s.size.width)
  const split = width >= 900
  const screenMaterial = useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false }), [])
  const glowTexture = useMemo(radialTexture, [])
  const p = useMemo(() => ({}), [])

  // Fit the phone to the viewport: centred and a little high on phones
  // (room for the step label), on the right half on wide screens.
  const vw = viewport.width
  const vh = viewport.height
  const scale = split
    ? Math.min(1.05, (vh * 0.74) / BODY.h)
    : Math.min(1, (vw * 0.66) / BODY.w, (vh * 0.7) / BODY.h)
  const ax = split ? Math.min(vw * 0.2, vw / 2 - BODY.w * scale * 0.5 - 0.6) : 0
  const ay = split ? 0 : vh * 0.04
  const spread = split ? 1 : 0.3 // sideways moves are smaller on narrow screens
  const depth = split ? 1 : 0.6

  useFrame((state, dt) => {
    const g = group.current
    if (!g) return
    const tex = feed.frame(performance.now())
    if (screenMaterial.map !== tex) {
      screenMaterial.map = tex
      screenMaterial.needsUpdate = true
    }

    const n = targets.length
    const pos = THREE.MathUtils.clamp(story.pos, 0, n - 1)
    const i = Math.floor(pos)
    const f = ease(pos - i)
    const a = targets[i]
    const b = targets[Math.min(i + 1, n - 1)]
    for (const k of FIELDS) p[k] = a[k] + (b[k] - a[k]) * f

    // Keep the phone over the same spot on screen as it moves toward the
    // camera, then shift it so the focused part of the screen is centred.
    const z = p.z * depth
    const persp = (CAM_Z - z) / CAM_Z
    const t = state.clock.elapsedTime
    const idle = reduceMotion ? 0 : 1
    const tx = (ax + p.x * spread) * persp
    const ty = (ay + p.y) * persp - p.focus * (SCREEN.h / 2) * scale + Math.sin(t * 0.9) * 0.04 * idle
    const px = split && !reduceMotion ? state.pointer.x : 0
    const py = split && !reduceMotion ? state.pointer.y : 0
    const rx = p.rx - py * 0.08 + Math.sin(t * 0.7) * 0.015 * idle
    const ry = p.ry + px * 0.14 + story.kick + Math.sin(t * 0.5) * 0.03 * idle
    const rz = p.rz

    const lambda = reduceMotion ? 30 : 5
    const d = THREE.MathUtils.damp
    g.position.set(d(g.position.x, tx, lambda, dt), d(g.position.y, ty, lambda, dt), d(g.position.z, z, lambda, dt))
    g.rotation.set(d(g.rotation.x, rx, lambda, dt), d(g.rotation.y, ry, lambda, dt), d(g.rotation.z, rz, lambda, dt))
    g.scale.setScalar(scale * (1 + story.pulse * 0.06))

    story.kick = d(story.kick, 0, 3.5, dt)
    story.pulse = d(story.pulse, 0, 5, dt)

    if (glow.current) glow.current.position.set(g.position.x, g.position.y, -1.5)
  })

  const dark = theme === 'dark'
  return (
    <>
      <mesh ref={glow} scale={7 * scale}>
        <planeGeometry />
        <meshBasicMaterial
          map={glowTexture}
          color="#7c8cff"
          transparent
          opacity={dark ? 0.55 : 0.35}
          depthWrite={false}
          toneMapped={false}
          blending={dark ? THREE.AdditiveBlending : THREE.NormalBlending}
        />
      </mesh>
      <group ref={group}>
        <Phone screenMaterial={screenMaterial} frameColor={dark ? '#2c2d33' : '#bdb8ae'} />
      </group>
    </>
  )
}

function radialTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const ctx = c.getContext('2d')
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
  g.addColorStop(0, 'rgba(255,255,255,0.9)')
  g.addColorStop(0.35, 'rgba(255,255,255,0.25)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 256, 256)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

function Lights({ theme }) {
  return (
    <>
      <ambientLight intensity={theme === 'dark' ? 0.2 : 0.6} />
      <directionalLight position={[3, 5, 6]} intensity={1} />
      {/* Studio-style reflections built from shapes, so no HDR file is downloaded. */}
      <Environment resolution={256}>
        <group rotation={[-Math.PI / 4, 0, 0]}>
          <Lightformer form="rect" intensity={4} position={[0, 5, -6]} scale={[12, 3, 1]} />
          <Lightformer form="rect" intensity={2} position={[-6, 1, 2]} scale={[3, 8, 1]} color="#aab4ff" />
          <Lightformer form="rect" intensity={2.5} position={[6, 0, 2]} scale={[3, 8, 1]} />
          <Lightformer form="ring" intensity={3} position={[0, -3, 4]} scale={4} color="#7c8cff" />
        </group>
      </Environment>
    </>
  )
}

export default function PhoneScene({ steps, active, theme }) {
  const [feed] = useState(
    () => new ScreenFeed({ steps, base: import.meta.env.BASE_URL, aspect: SCREEN_ASPECT }),
  )
  useEffect(() => () => feed.dispose(), [feed])
  useEffect(() => feed.activate(active, theme), [feed, active, theme])

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, CAM_Z], fov: 35, near: 0.1, far: 40 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
    >
      <Lights theme={theme} />
      <PhoneRig steps={steps} feed={feed} theme={theme} />
    </Canvas>
  )
}
