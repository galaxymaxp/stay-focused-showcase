// Edit this file — every step of the showcase comes from here.
//
// Each step is one scroll stop. When a stop snaps into view its clip plays
// from the start at normal speed (scroll position never scrubs the video).
// Clips are loaded from public/videos/<theme>/<clip>.mp4; a missing file
// shows a labelled placeholder on the phone instead. See SHOWCASE.md.

export const app = {
  name: 'Stay Focused',
  tagline: 'Your notes, synced and turned into a study plan you actually follow.',
  cta: { label: 'Get the app', href: '#' },
  portfolio: 'https://galaxymaxp.github.io/portfolio/',
}

// Horizontal swipes on the phone jump to a chapter, as they do in the app.
// "swipeLeft" means the finger moves left (the page on the right slides in).
// Swap the two ids if the app works the other way round.
export const gestures = {
  swipeLeft: 'tasks',
  swipeRight: 'scheduler',
  holdMs: 550, // press-and-hold this long to switch light/dark
}

// Phone poses. x/y/z move the phone (world units, z toward the camera),
// rx/ry/rz rotate it (radians), focus picks which part of the screen a
// close-up centres on (1 = top edge, 0 = middle, -1 = bottom edge).
// A step can use a preset name or an object such as { preset: 'closeup', focus: 0.4 }.
export const poses = {
  hero: { x: 0, y: 0, z: 0, rx: 0.08, ry: -0.42, rz: 0.04 },
  center: { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 },
  left: { x: -0.7, y: 0, z: 0, rx: 0.02, ry: 0.38, rz: 0 },
  right: { x: 0.5, y: 0, z: 0, rx: 0.02, ry: -0.38, rz: 0 },
  closeup: { x: 0, y: 0, z: 3.2, rx: 0, ry: 0, rz: 0, focus: 0 },
  swingLeft: { x: -0.9, y: 0, z: 0.4, rx: 0, ry: 0.62, rz: 0.05 },
  swingRight: { x: 0.7, y: 0, z: 0.4, rx: 0, ry: -0.62, rz: -0.05 },
  tilt: { x: 0, y: 0.1, z: 0.8, rx: -0.32, ry: 0.15, rz: 0 },
}

export const steps = [
  {
    id: 'intro',
    clip: '00-intro',
    chapter: 'Stay Focused',
    title: 'From notes to a plan, in four moves.',
    body: 'Scroll to watch the workflow run on the phone. Swipe it sideways or hold it down to try the gestures.',
    hint: 'Scroll ↓ · swipe ← → · hold',
    pose: 'hero',
    loop: true,
    duration: 6,
  },
  {
    id: 'sync',
    clip: '01-sync',
    chapter: 'Sync',
    title: 'Bring everything in.',
    body: 'Connect your class materials once. Stay Focused pulls in new notes, slides and deadlines as they appear.',
    pose: 'left',
    duration: 5,
  },
  {
    id: 'generate',
    clip: '02-generate',
    chapter: 'Generate',
    title: 'Study material, generated.',
    body: 'Each synced source becomes summaries, questions and tasks while you watch.',
    pose: { preset: 'closeup', focus: 0.15 },
    duration: 6,
  },
  {
    id: 'review',
    clip: '03-review',
    chapter: 'Review',
    title: 'Check it before you trust it.',
    body: 'Skim what was generated, keep what is right, edit what is not.',
    pose: 'right',
    duration: 5,
  },
  // Study assist gets one stop per feature so each one is seen on its own.
  {
    id: 'assist-ask',
    clip: '04-assist-ask',
    chapter: 'Study assist',
    part: '1 / 4',
    title: 'Ask about anything you synced.',
    body: 'Answers come from your own material, with the source one tap away.',
    pose: 'center',
    duration: 6,
  },
  {
    id: 'assist-explain',
    clip: '05-assist-explain',
    chapter: 'Study assist',
    part: '2 / 4',
    title: 'Explained at your level.',
    body: 'Ask for a simpler version, an example, or the step you missed.',
    pose: { preset: 'closeup', focus: -0.25 },
    duration: 6,
  },
  {
    id: 'assist-practice',
    clip: '06-assist-practice',
    chapter: 'Study assist',
    part: '3 / 4',
    title: 'Practice until it sticks.',
    body: 'Quizzes and flashcards built from the same notes, focused on what you get wrong.',
    pose: 'tilt',
    duration: 6,
  },
  {
    id: 'assist-progress',
    clip: '07-assist-progress',
    chapter: 'Study assist',
    part: '4 / 4',
    title: 'See what is left.',
    body: 'Progress per topic, so you know where the next session should go.',
    pose: 'left',
    duration: 5,
  },
  {
    id: 'tasks',
    clip: '08-swipe-tasks',
    chapter: 'Task generation',
    title: 'Swipe for your tasks.',
    body: 'One swipe opens the task list generated from everything above.',
    hint: 'Swipe ← on the phone',
    pose: 'swingLeft',
    duration: 5,
  },
  {
    id: 'scheduler',
    clip: '09-swipe-scheduler',
    chapter: 'Scheduler',
    title: 'Swipe the other way for your week.',
    body: 'Tasks land in a schedule that works around your classes and deadlines.',
    hint: 'Swipe → on the phone',
    pose: 'swingRight',
    duration: 5,
  },
  {
    id: 'theme',
    clip: '10-hold-theme',
    chapter: 'Light & dark',
    title: 'Hold to switch the lights.',
    body: 'Press and hold anywhere to flip between light and dark mode.',
    hint: 'Hold the phone',
    pose: { preset: 'closeup', focus: 0 },
    duration: 4,
  },
  {
    id: 'outro',
    clip: '11-outro',
    chapter: 'Stay Focused',
    title: 'Sync. Generate. Review. Study.',
    body: 'Everything you just scrolled through, in your pocket.',
    pose: 'hero',
    loop: true,
    duration: 6,
    cta: true,
  },
]
