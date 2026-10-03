import { useEffect, useRef } from 'react'

// Horizontal swipe and press-and-hold on an element, without blocking the
// browser's own vertical scrolling (the element should have
// `touch-action: pan-y`). A vertical drag hands the pointer to the browser,
// which fires pointercancel and so cancels any pending hold.
export function useGestures(ref, handlers) {
  const h = useRef(handlers)
  h.current = handlers

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let start = null
    let timer = 0

    const stopHold = () => {
      if (timer) clearTimeout(timer)
      timer = 0
      h.current.onHoldEnd?.()
    }
    const down = (e) => {
      if (e.button > 0) return
      start = { x: e.clientX, y: e.clientY, id: e.pointerId }
      h.current.onHoldStart?.(e.clientX, e.clientY)
      timer = setTimeout(() => {
        timer = 0
        start = null
        h.current.onHoldEnd?.()
        h.current.onHold?.()
      }, h.current.holdMs)
    }
    const move = (e) => {
      if (!start || e.pointerId !== start.id || !timer) return
      if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 10) stopHold()
    }
    const up = (e) => {
      if (!start || e.pointerId !== start.id) return
      const dx = e.clientX - start.x
      const dy = e.clientY - start.y
      start = null
      stopHold()
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) h.current.onSwipe?.(dx < 0 ? 'left' : 'right')
    }
    const cancel = () => {
      start = null
      stopHold()
    }
    // A long press on a touch screen would open the context menu; keep the
    // mouse's right-click menu.
    const coarse = window.matchMedia('(pointer: coarse)').matches
    const noMenu = (e) => coarse && e.preventDefault()

    el.addEventListener('pointerdown', down)
    el.addEventListener('contextmenu', noMenu)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', cancel)
    return () => {
      clearTimeout(timer)
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('contextmenu', noMenu)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', cancel)
    }
  }, [ref])
}
