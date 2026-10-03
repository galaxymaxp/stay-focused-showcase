// Edit this file — every step of the showcase comes from here.
//
// Each step is one scroll stop. When a stop snaps into view its clip plays
// from the start at normal speed (scroll position never scrubs the video).
// Clips are loaded from public/videos/<theme>/<clip>.mp4; a missing file
// shows a labelled placeholder on the phone instead. See README.md.

export const app = {
  name: 'Stay Focused',
  tagline: 'Reviewers from your own course material, with Study Assist built in.',
  cta: { label: 'Get the app', href: '#' },
  portfolio: 'https://galaxymaxp.github.io/portfolio/',
}

// Horizontal swipes on the phone jump to a chapter, as they do in the app:
// Today sits to the left of Generate and Tasks to the right.
// "swipeLeft" means the finger moves left (the page on the right slides in).
export const gestures = {
  swipeLeft: 'tasks',
  swipeRight: 'today',
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
    title: 'Reviewers from your own course material.',
    body: 'Stay Focused turns lecture files into study reviewers, then helps you work through them with Study Assist. Scroll to watch it run.',
    hint: 'Scroll ↓ · swipe ← → · hold',
    pose: 'hero',
    loop: true,
  },
  {
    id: 'sync',
    clip: '01-sync',
    chapter: 'Sync',
    title: 'Your Canvas courses, in one place.',
    body: 'Connect Canvas once and your current courses appear in Generate. One tap syncs them again.',
    pose: 'left',
  },
  {
    id: 'source',
    clip: '02-source',
    chapter: 'Choose a source',
    title: 'Pick the lecture you need to study.',
    body: 'Open a course, choose a lecture file and request a reviewer. Without Canvas, use text, the camera or a local PDF instead.',
    pose: 'right',
  },
  {
    id: 'generate',
    clip: '03-generate',
    chapter: 'Generate',
    title: 'A reviewer, written from that file.',
    body: 'Generation runs in the background, so you can leave the screen. Queue tracks it and Library keeps the result.',
    pose: { preset: 'closeup', focus: 0.2 },
  },
  {
    id: 'reviewer',
    clip: '04-reviewer',
    chapter: 'Reviewer',
    title: 'Read it, search it, jump between topics.',
    body: 'Each reviewer is organised into topics with key points and highlighted terms taken from the selected material.',
    pose: 'center',
  },
  // Study Assist is the defining feature, so it gets one stop per way of using it.
  {
    id: 'assist-summarize',
    clip: '05-assist-summarize',
    chapter: 'Study Assist',
    part: '1 / 4',
    title: 'Quick assists for the whole concept.',
    body: 'Summarize the topic you are reading, explain it simply, or ask for an analogy or an example.',
    pose: 'tilt',
  },
  {
    id: 'assist-keypoints',
    clip: '06-assist-keypoints',
    chapter: 'Study Assist',
    part: '2 / 4',
    title: 'Or only the key points you pick.',
    body: 'Select one or several key points and run the same assists on just those.',
    pose: { preset: 'closeup', focus: -0.2 },
  },
  {
    id: 'assist-select',
    clip: '07-assist-select',
    chapter: 'Study Assist',
    part: '3 / 4',
    title: 'Hold any word to select exactly what you mean.',
    body: 'Drag the handles over a phrase, then choose Define, Explain, Example, Test Me or Ask.',
    pose: 'left',
  },
  {
    id: 'assist-example',
    clip: '08-assist-example',
    chapter: 'Study Assist',
    part: '4 / 4',
    title: 'Every answer says where it came from.',
    body: 'Responses are labelled From your material, Source + general knowledge, or General knowledge, so you know what to check against the source.',
    pose: { preset: 'closeup', focus: 0.25 },
  },
  {
    id: 'quiz-create',
    clip: '09-quiz-create',
    chapter: 'Practice quiz',
    title: 'Turn the reviewer into a quiz.',
    body: 'Choose the number of questions, the difficulty and the question formats. The quiz is built from the reviewer’s topics.',
    pose: 'right',
  },
  {
    id: 'quiz-practice',
    clip: '10-quiz-practice',
    chapter: 'Practice quiz',
    title: 'Answer, check, and see what to revisit.',
    body: 'Results list the ideas you missed, so the next session knows where to start.',
    pose: 'center',
  },
  {
    id: 'queue',
    clip: '11-queue',
    chapter: 'Queue',
    title: 'Everything in progress, in one list.',
    body: 'Queue shows each generation job: not started, finished, or in need of attention.',
    pose: 'left',
  },
  {
    id: 'library',
    clip: '12-library',
    chapter: 'Library',
    title: 'Saved by course, ready to reopen.',
    body: 'Reviewers, quizzes and drafts are kept per course. Saved reviewers reopen even offline.',
    pose: 'right',
  },
  {
    id: 'tasks',
    clip: '13-tasks',
    chapter: 'Tasks',
    title: 'Swipe one way for your coursework.',
    body: 'Assignments from Canvas land in Tasks with their due, missing and completed counts per course.',
    hint: 'Swipe ← on the phone',
    pose: 'swingLeft',
  },
  {
    id: 'today',
    clip: '14-today-plan',
    chapter: 'Today',
    title: 'Swipe the other way to plan your day.',
    body: 'Drag the dial over your free time and Today proposes a study plan you can apply in one tap.',
    hint: 'Swipe → on the phone',
    pose: 'swingRight',
  },
  {
    id: 'theme',
    clip: '15-hold-theme',
    chapter: 'Light & dark',
    title: 'Hold to switch the lights.',
    body: 'Press and hold to flip between light and dark mode.',
    hint: 'Hold the phone',
    pose: { preset: 'closeup', focus: 0 },
    duration: 4,
  },
  {
    id: 'outro',
    clip: '16-outro',
    chapter: 'Stay Focused',
    title: 'Source. Reviewer. Study Assist. Reuse.',
    body: 'Everything you just scrolled through, built for CTE students and CTE Board Examiners.',
    pose: 'hero',
    loop: true,
    cta: true,
  },
]
