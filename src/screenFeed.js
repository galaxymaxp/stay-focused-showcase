import * as THREE from 'three'

const IMAGE = /\.(png|jpe?g|webp|avif)$/i

// Each clip has a poster: its first frame as a small still, at
// posters/<theme>/<name>.webp next to videos/<theme>/<name>.mp4.
const posterOf = (path) => (IMAGE.test(path) ? path : path.replace(/^videos\//, 'posters/').replace(/\.mp4$/, '.webp'))

// Supplies the texture shown on the phone screen.
//
// Each step names its screen media per theme: a short clip or a still image.
// Activating a step restarts its clip and plays it at its own frame rate, so
// scroll speed never affects playback. Until the clip has a frame to show, the
// screen shows the step's poster (the clip's first frame), so a slow download
// never leaves the previous step on screen. All posters and stills are loaded
// up front because they are small. A theme with no media of its own uses the
// dark one; if nothing loads, a drawn placeholder names the file it expects.
export class ScreenFeed {
  constructor({ steps, base, aspect }) {
    this.steps = steps
    this.base = base
    this.aspect = aspect
    this.media = new Map()
    this.index = -1
    this.theme = 'dark'
    this.want = null
    this.startedAt = 0
    this.preloaded = new Set()

    this.canvas = document.createElement('canvas')
    this.canvas.width = 540
    this.canvas.height = Math.round(540 / aspect)
    this.ctx = this.canvas.getContext('2d')
    this.placeholder = new THREE.CanvasTexture(this.canvas)
    this.placeholder.colorSpace = THREE.SRGBColorSpace
    this.shown = this.placeholder

    // Low-power modes can block muted autoplay; the first touch retries it.
    this.retry = () => {
      const v = this.want?.video
      if (v?.paused && !v.ended) v.play().catch(() => {})
    }
    window.addEventListener('pointerdown', this.retry)
  }

  path(i, theme) {
    const m = this.steps[i]?.media
    return m?.[theme] ?? m?.dark ?? ''
  }

  entry(path) {
    let e = this.media.get(path)
    if (e) return e
    e = { path, video: null, texture: null, state: 'loading' }
    this.media.set(path, e)
    const fail = () => {
      e.state = 'failed'
      this.select(false)
    }
    if (IMAGE.test(path)) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        e.texture = new THREE.Texture(img)
        e.texture.colorSpace = THREE.SRGBColorSpace
        e.texture.anisotropy = 8
        e.texture.needsUpdate = true
        coverFit(e.texture, img.naturalWidth / img.naturalHeight, this.aspect)
        e.state = 'ready'
      }
      img.onerror = fail
      img.src = this.base + path
      return e
    }
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.setAttribute('playsinline', '')
    video.preload = 'auto'
    video.crossOrigin = 'anonymous'
    e.video = video
    video.addEventListener('loadeddata', () => {
      e.state = 'ready'
      if (!e.texture) {
        e.texture = new THREE.VideoTexture(video)
        e.texture.colorSpace = THREE.SRGBColorSpace
        coverFit(e.texture, video.videoWidth / video.videoHeight, this.aspect)
      }
    })
    // While a restarted clip seeks back to 0 it still shows its last frame.
    video.addEventListener('seeked', () => (e.seeking = false))
    video.addEventListener('error', fail)
    video.src = this.base + path
    return e
  }

  // The media for a step in the current theme, falling back to the dark
  // media, then to null (placeholder).
  resolve(i) {
    if (!this.steps[i]) return null
    let e = this.entry(this.path(i, this.theme))
    if (e.state === 'failed' && this.theme !== 'dark') e = this.entry(this.path(i, 'dark'))
    return e.state === 'failed' ? null : e
  }

  activate(index, theme) {
    const changed = index !== this.index || theme !== this.theme
    // A theme switch mid-clip continues from the same moment in the other recording.
    this.carry = index === this.index && theme !== this.theme ? this.want?.video?.currentTime ?? 0 : 0
    if (index !== this.index) this.startedAt = performance.now()
    this.index = index
    this.theme = theme
    this.select(changed)
    if (!this.preloaded.has(theme)) {
      this.preloaded.add(theme)
      this.steps.forEach((_, i) => this.still(i))
    }
    // Start downloading the neighbours so the next step plays immediately.
    this.resolve(index + 1)
    this.resolve(index - 1)
  }

  select(restart) {
    const next = this.resolve(this.index)
    for (const e of this.media.values()) if (e !== next) e.video?.pause()
    if (next !== this.want) restart = true
    this.want = next
    const v = next?.video
    if (!v) return
    v.loop = Boolean(this.steps[this.index]?.loop)
    if (restart) {
      next.seeking = v.readyState > 0 // with no data yet there is no seek to wait for
      v.currentTime = this.carry ?? 0
    }
    v.play().catch(() => {})
  }

  // The step's still (an image step's own image, or a clip's poster) once it
  // has loaded, trying the current theme first and then dark.
  still(i) {
    for (const theme of [this.theme, 'dark']) {
      const path = this.path(i, theme)
      if (!path) continue
      const s = this.entry(posterOf(path))
      if (s.texture) return s.texture
    }
    return null
  }

  // Called every frame; returns the texture to put on the screen: the live
  // media if it has a frame, else the step's still, else the placeholder.
  frame(now) {
    const e = this.want
    const live = e?.texture && (!e.video || (e.video.readyState >= 2 && !e.seeking))
    this.shown = (live ? e.texture : this.still(this.index)) ?? this.placeholder
    if (this.shown === this.placeholder) {
      drawPlaceholder(this.ctx, this.steps[this.index], this.index, this.theme, (now - this.startedAt) / 1000, this.path(this.index, this.theme))
      this.placeholder.needsUpdate = true
    }
    return this.shown
  }

  dispose() {
    window.removeEventListener('pointerdown', this.retry)
    for (const e of this.media.values()) {
      if (e.video) {
        e.video.pause()
        e.video.removeAttribute('src')
        e.video.load()
      }
      e.texture?.dispose()
    }
    this.media.clear()
    this.placeholder.dispose()
  }
}

// Crops the clip like CSS object-fit: cover, so a recording whose aspect
// ratio differs slightly from the 3D screen fills it without stretching.
function coverFit(texture, media, screen) {
  if (!media || !screen) return
  if (media > screen) {
    texture.repeat.set(screen / media, 1)
    texture.offset.set((1 - screen / media) / 2, 0)
  } else {
    texture.repeat.set(1, media / screen)
    texture.offset.set(0, (1 - media / screen) / 2)
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

function wrap(ctx, text, x, y, maxWidth, lineHeight) {
  let line = ''
  for (const word of text.split(' ')) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y)
      line = word
      y += lineHeight
    } else line = test
  }
  ctx.fillText(line, x, y)
  return y + lineHeight
}

// A stand-in screen: mock UI, a progress bar that runs for the step's
// duration, and the path of the clip that should replace it.
function drawPlaceholder(ctx, step, index, theme, t, path) {
  const { width: w, height: h } = ctx.canvas
  const dark = theme === 'dark'
  const fg = dark ? '#f2f2f5' : '#111216'
  const muted = dark ? 'rgba(242,242,245,0.5)' : 'rgba(17,18,22,0.5)'
  const card = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'
  const accent = '#7c8cff'
  const duration = step?.duration ?? 5
  const p = step?.loop ? (t % duration) / duration : Math.min(t / duration, 1)

  ctx.fillStyle = dark ? '#0b0b10' : '#f5f5f8'
  ctx.fillRect(0, 0, w, h)

  ctx.fillStyle = fg
  ctx.font = '500 26px Inter, system-ui, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('9:41', 48, 66)
  roundRect(ctx, w - 92, 46, 44, 22, 6)
  ctx.strokeStyle = fg
  ctx.lineWidth = 2
  ctx.stroke()
  roundRect(ctx, w - 89, 49, 38 * 0.9, 16, 4)
  ctx.fill()

  const pad = 48
  ctx.fillStyle = accent
  ctx.font = '500 22px "JetBrains Mono", ui-monospace, monospace'
  ctx.fillText(`${String(index).padStart(2, '0')} · ${(step?.chapter ?? '').toUpperCase()}${step?.part ? `  ${step.part}` : ''}`, pad, 190)
  ctx.fillStyle = fg
  ctx.font = '400 58px "Instrument Serif", Georgia, serif'
  const after = wrap(ctx, step?.title ?? '', pad, 260, w - pad * 2, 62)

  // Mock content blocks with a sweeping shimmer, so the placeholder reads as "playing".
  const top = after + 30
  const sweep = ((t * 0.6) % 1.6) - 0.3
  for (let i = 0; i < 4; i++) {
    const y = top + i * 150
    if (y + 120 > h - 260) break
    const grad = ctx.createLinearGradient(0, y, w, y + 120)
    const clamp = (v) => Math.min(1, Math.max(0, v))
    grad.addColorStop(clamp(sweep - 0.2), card)
    grad.addColorStop(clamp(sweep), 'rgba(124,140,255,0.17)')
    grad.addColorStop(clamp(sweep + 0.2), card)
    ctx.fillStyle = grad
    roundRect(ctx, pad, y, w - pad * 2, 120, 22)
    ctx.fill()
    ctx.fillStyle = muted
    roundRect(ctx, pad + 28, y + 34, (w - pad * 2) * (0.55 - i * 0.07), 16, 8)
    ctx.fill()
    roundRect(ctx, pad + 28, y + 68, (w - pad * 2) * 0.35, 12, 6)
    ctx.fill()
  }

  ctx.fillStyle = card
  roundRect(ctx, pad, h - 220, w - pad * 2, 8, 4)
  ctx.fill()
  ctx.fillStyle = accent
  roundRect(ctx, pad, h - 220, (w - pad * 2) * p, 8, 4)
  ctx.fill()

  ctx.fillStyle = muted
  ctx.font = '500 20px "JetBrains Mono", ui-monospace, monospace'
  ctx.textAlign = 'center'
  ctx.fillText('PLACEHOLDER — RECORD', w / 2, h - 160)
  ctx.fillStyle = fg
  ctx.fillText(path, w / 2, h - 128)
  ctx.textAlign = 'left'
}
