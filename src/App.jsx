import { useCallback, useEffect, useRef, useState } from 'react'
import PhoneScene from './PhoneScene.jsx'
import { app, gestures, steps } from './content.js'
import { story } from './story.js'
import { useGestures } from './gestures.js'

const reduceMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

function initialTheme() {
  try {
    return localStorage.getItem('sf-theme') === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

const pad = (i) => String(i).padStart(2, '0')

export default function App() {
  const [theme, setTheme] = useState(initialTheme)
  const [active, setActive] = useState(0)
  const [hold, setHold] = useState(null)
  const scroller = useRef()
  const sections = useRef([])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#000000' : '#f4f4f6')
    try {
      localStorage.setItem('sf-theme', theme)
    } catch {}
  }, [theme])

  // Turns the scroll offset into a position in steps. The scene reads the
  // fractional value to move the phone; the rounded value picks the clip.
  // The steps scroll inside a fixed full-screen container rather than the
  // page itself, so mobile browsers never slide their address bar away: the
  // visible height stays constant and snapping never re-aligns mid-scroll.
  useEffect(() => {
    const el = scroller.current
    let tops = []
    const onScroll = () => {
      const y = el.scrollTop
      let i = 0
      while (i < tops.length - 1 && y >= tops[i + 1]) i++
      const span = (tops[i + 1] ?? tops[i] + 1) - tops[i]
      const pos = Math.min(tops.length - 1, i + Math.max(0, (y - tops[i]) / span))
      story.pos = pos
      setActive(Math.round(pos))
    }
    const measure = () => {
      tops = sections.current.map((el) => el.offsetTop)
      onScroll()
    }
    measure()
    el.focus({ preventScroll: true }) // so arrow / page keys scroll the steps
    el.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', measure)
    return () => {
      el.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', measure)
    }
  }, [])

  const goTo = useCallback((i) => {
    sections.current[i]?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' })
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
    story.pulse = 1
  }, [])

  // A swipe spins the phone the way the finger moved and jumps to the
  // chapter that gesture opens in the app.
  const swipe = useCallback(
    (dir) => {
      story.kick = dir === 'left' ? -0.5 : 0.5
      goTo(steps.findIndex((s) => s.id === (dir === 'left' ? gestures.swipeLeft : gestures.swipeRight)))
    },
    [goTo],
  )

  useGestures(scroller, {
    holdMs: gestures.holdMs,
    onSwipe: swipe,
    onHold: toggleTheme,
    onHoldStart: (x, y) => setHold({ x, y, key: performance.now() }),
    onHoldEnd: () => setHold(null),
  })

  // Arrow keys stand in for swipes: → opens the page on the right (a left swipe).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') swipe('left')
      if (e.key === 'ArrowLeft') swipe('right')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [swipe])

  const step = steps[active]

  return (
    <>
      <div className="canvas">
        <PhoneScene steps={steps} active={active} theme={theme} />
      </div>

      <header className="nav">
        <a className="nav-link" href={app.portfolio}>
          ← Portfolio
        </a>
        <button
          className="icon-btn"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun /> : <Moon />}
        </button>
      </header>

      <main className="steps" ref={scroller} tabIndex={-1}>
        {steps.map((s, i) => {
          const Heading = i === 0 ? 'h1' : 'h2'
          return (
            <section
              key={s.id}
              id={`step-${s.id}`}
              ref={(el) => (sections.current[i] = el)}
              className={`step${i === active ? ' is-active' : ''}`}
            >
              <div className="copy">
                <p className="label">
                  {pad(i)} / {s.chapter}
                  {s.part && <span className="part"> · {s.part}</span>}
                </p>
                <Heading>{s.title}</Heading>
                <p className="body">{s.body}</p>
                {s.hint && <p className="hint">{s.hint}</p>}
                {s.cta && <Cta />}
              </div>
            </section>
          )
        })}
      </main>

      {/* Phones see only the phone: one line of context, or the buttons on the last step. */}
      <div className="hud" aria-hidden={step.cta ? undefined : 'true'}>
        {step.cta ? (
          <Cta />
        ) : (
          <>
            <p className="hud-label">
              {pad(active)} · {step.chapter}
              {step.part && ` ${step.part}`}
            </p>
            {step.hint && <p className="hud-hint">{step.hint}</p>}
          </>
        )}
      </div>

      <nav className="rail" aria-label="Steps">
        {steps.map((s, i) => (
          <button
            key={s.id}
            className={i === active ? 'on' : ''}
            aria-label={`${pad(i)} ${s.chapter}${s.part ? ` ${s.part}` : ''}`}
            aria-current={i === active ? 'step' : undefined}
            onClick={() => goTo(i)}
          />
        ))}
      </nav>

      {hold && (
        <svg
          key={hold.key}
          className="hold"
          style={{ left: hold.x, top: hold.y, '--ms': `${gestures.holdMs}ms` }}
          viewBox="0 0 60 60"
          aria-hidden="true"
        >
          <circle cx="30" cy="30" r="24" />
          <circle className="fill" cx="30" cy="30" r="24" />
        </svg>
      )}
    </>
  )
}

function Cta() {
  return (
    <div className="row">
      <a className="pill solid" href={app.cta.href}>
        {app.cta.label}
      </a>
      <a className="pill" href={app.portfolio}>
        Portfolio
      </a>
    </div>
  )
}

function Sun() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  )
}

function Moon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
    </svg>
  )
}
