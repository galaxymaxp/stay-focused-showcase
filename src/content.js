// Edit this file — every step of the showcase comes from here.
//
// Each step is one scroll stop. When a stop snaps into view its clip plays
// from the start at normal speed (scroll position never scrubs the video).
// `media` names what the phone screen shows in each theme: a clip (.mp4) or a
// still (.png/.jpg/.webp), relative to public/. A theme without its own media
// uses the dark one; a missing file shows a labelled placeholder. See README.md.

export const app = {
  name: 'Stay Focused',
  tagline: 'Reviewers from your own course material, with Study Assist built in.',
  // Direct download of the release APK in Google Drive (Stay Focused Release /
  // StayFocused.bver1.apk). To ship a new build, use Drive's "Manage versions →
  // Upload new version" on that same file: the ID, and so this link, stay the
  // same and always serve the latest APK. The file must be shared as
  // "Anyone with the link" or visitors get a sign-in page.
  cta: {
    label: 'Download for Android',
    href: 'https://drive.usercontent.google.com/download?id=1Q7LZazCsf5MMFd7YVF_jmQiyta8ihE1N&export=download',
  },
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
    media: { dark: 'videos/dark/00-intro.mp4', light: 'videos/light/00-intro.mp4' },
    chapter: 'Stay Focused',
    title: 'Reviewers from your own course material.',
    body: 'Stay Focused turns lecture files into study reviewers, then helps you work through them with Study Assist. Scroll to watch it run.',
    hint: 'Scroll ↓ · swipe ← → · hold',
    pose: 'hero',
    loop: true,
  },
  {
    id: 'course',
    media: { dark: 'videos/dark/01-course.mp4', light: 'videos/light/01-course.mp4' },
    chapter: 'Choose a course',
    title: 'Pick a course, then the lecture.',
    body: 'Your Canvas courses are listed in Generate. Open one, choose a lecture file and request a reviewer.',
    pose: 'left',
  },
  {
    id: 'generate',
    media: { dark: 'videos/dark/02-generate.mp4', light: 'videos/light/02-generate.mp4' },
    chapter: 'Generate',
    title: 'A reviewer, written from that file.',
    body: 'Generation runs in the background, so you can leave the screen. Queue tracks it and Library keeps the result.',
    pose: { preset: 'closeup', focus: 0.2 },
  },
  {
    id: 'reviewer',
    media: { dark: 'videos/dark/03-reviewer.mp4', light: 'images/light/updated-reviewer.webp' },
    chapter: 'Reviewer',
    title: 'Read it, search it, jump between topics.',
    body: 'Each reviewer is organised into topics with key points and highlighted terms taken from the selected material.',
    pose: 'right',
  },
  // Study Assist is the defining feature, so it gets one stop per way of using it.
  {
    id: 'assist-summarize',
    media: { dark: 'videos/dark/04-assist-summarize.mp4', light: 'images/light/study-assist.webp' },
    chapter: 'Study Assist',
    part: '1 / 4',
    title: 'Quick assists for the whole concept.',
    body: 'Summarize the topic you are reading, explain it simply, or ask for an analogy or an example.',
    pose: 'tilt',
  },
  {
    id: 'assist-keypoints',
    media: { dark: 'videos/dark/05-assist-keypoints.mp4', light: 'images/light/study-assist.webp' },
    chapter: 'Study Assist',
    part: '2 / 4',
    title: 'Or only the key points you pick.',
    body: 'Select one or several key points and run the same assists on just those.',
    pose: { preset: 'closeup', focus: -0.2 },
  },
  {
    id: 'assist-select',
    media: { dark: 'videos/dark/06-assist-select.mp4', light: 'images/light/study-assist.webp' },
    chapter: 'Study Assist',
    part: '3 / 4',
    title: 'Hold any word to select exactly what you mean.',
    body: 'Drag the handles over a phrase, then choose Define, Explain, Example, Test Me or Ask.',
    pose: 'left',
  },
  {
    id: 'assist-example',
    media: { dark: 'videos/dark/07-assist-example.mp4', light: 'images/light/study-assist.webp' },
    chapter: 'Study Assist',
    part: '4 / 4',
    title: 'Every answer says where it came from.',
    body: 'Responses are labelled From your material, Source + general knowledge, or General knowledge, so you know what to check against the source.',
    pose: { preset: 'closeup', focus: 0.25 },
  },
  {
    id: 'quiz-create',
    media: { dark: 'videos/dark/08-quiz-create.mp4', light: 'images/light/04-library.webp' },
    chapter: 'Practice quiz',
    title: 'Turn the reviewer into a quiz.',
    body: 'Choose the number of questions, the difficulty and the question formats. The quiz is built from the reviewer’s topics.',
    pose: 'right',
  },
  {
    id: 'quiz-practice',
    media: { dark: 'videos/dark/09-quiz-practice.mp4', light: 'images/light/04-library.webp' },
    chapter: 'Practice quiz',
    title: 'Answer, check, and see what to revisit.',
    body: 'Results list the ideas you missed, so the next session knows where to start.',
    pose: 'center',
  },
  {
    id: 'library',
    media: { dark: 'images/dark/06-library-course.webp', light: 'images/light/06-library-course.webp' },
    chapter: 'Library',
    title: 'Saved by course, ready to reopen.',
    body: 'Reviewers, quizzes and drafts are kept per course. Saved reviewers reopen even offline.',
    pose: 'left',
  },
  {
    id: 'tasks',
    media: { dark: 'videos/dark/11-tasks.mp4', light: 'images/light/03-tasks.webp' },
    chapter: 'Tasks',
    title: 'Swipe one way for your coursework.',
    body: 'Assignments from Canvas land in Tasks with their due, missing and completed counts per course.',
    hint: 'Swipe ← on the phone',
    pose: 'swingLeft',
  },
  {
    id: 'today',
    media: { dark: 'videos/dark/12-today-plan.mp4', light: 'images/light/02-today.webp' },
    chapter: 'Today',
    title: 'Swipe the other way to plan your day.',
    body: 'Drag the dial over your free time and Today proposes a study plan you can apply in one tap.',
    hint: 'Swipe → on the phone',
    pose: 'swingRight',
  },
  {
    id: 'theme',
    media: { dark: 'images/dark/01-generate.webp', light: 'images/light/01-generate.webp' },
    chapter: 'Light & dark',
    title: 'Hold to switch the lights.',
    body: 'Press and hold to flip between light and dark mode. Try it on the phone.',
    hint: 'Hold the phone',
    pose: { preset: 'closeup', focus: 0 },
  },
  {
    id: 'outro',
    media: { dark: 'videos/dark/14-outro.mp4', light: 'images/light/04-library.webp' },
    chapter: 'Stay Focused',
    title: 'Course. Reviewer. Study Assist. Reuse.',
    body: 'Everything you just scrolled through, built for CTE students and CTE Board Examiners.',
    pose: 'hero',
    loop: true,
    cta: true,
  },
]
