// Shared state read by the 3D scene every frame (no React re-renders).
// pos: scroll position in steps (2.5 = halfway between step 2 and 3).
// kick: sideways spin added by a swipe; pulse: scale bump added by a hold.
export const story = { pos: 0, kick: 0, pulse: 0 }
