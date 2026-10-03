# Stay Focused — app showcase

A scroll-through of the Stay Focused workflow on a 3D phone. Each scroll stop
plays one short screen recording on the phone while the phone moves into a
new pose. On phones only the 3D phone is shown; on wide screens the text for
each step sits on the left.

```
npm install
npm run dev      # http://localhost:5173
npm run build
```

Live site: https://galaxymaxp.github.io/stay-focused-showcase/

- All text, the order of steps, which clip each step plays and the phone pose
  for each step are in `src/content.js`.
- The phone model is `src/Phone.jsx`; how it moves between poses is in
  `src/PhoneScene.jsx`.
- Gestures on the phone: **swipe** jumps to Task generation / Scheduler,
  **press and hold** switches light/dark mode. Arrow keys do the same as
  swipes on desktop.

## How the video works, and why

The obvious approach, scrubbing one long video with the scroll position, looks
laggy because the browser has to seek on every scroll event. Seeking to a
frame that is not a keyframe means decoding from the previous keyframe forward,
and the frame rate you see becomes however fast the visitor scrolls.

This site does the opposite. The page snaps to one step per scroll, and the
moment a step snaps in, its own clip starts from the beginning and plays at
its recorded frame rate. Scrolling only decides *which* clip plays and where
the phone is; it never touches playback speed. The next and previous clips are
preloaded so a step starts instantly. A clip plays once and holds its last
frame, unless the step has `loop: true`.

## Recording the clips

### Files

Each step in `src/content.js` has a `media` entry naming what the phone shows
in each theme, relative to `public/`:

```js
media: { dark: 'videos/dark/02-generate.mp4', light: 'images/light/generating.webp' },
```

A clip (`.mp4`) plays once from the start when the step snaps in (or loops,
with `loop: true`); a still (`.webp`, `.png`, `.jpg`) simply shows. A theme
without its own media uses the dark one, and a file that does not load shows a
placeholder naming the path it expects.

Every clip has a **poster**, its first frame as a small still at
`public/posters/<theme>/<name>.webp`. All posters and stills load with the page
(about 1 MB together), so a step shows its own screen the moment it snaps in;
the clip takes over from the poster as soon as it has a frame, and because the
poster *is* that first frame the hand-over is seamless. `scripts/cut-clips.py`
writes the posters along with the clips.

### What each step shows

Dark clips are cut from one full take (`XRecorder_20261003_01.mp4`, Oct 3) with
`scripts/cut-clips.py`, which holds the cut times. Stills are the Sep 30 device
screenshots from the *Stay Focused UI* folder; there is no light-mode recording
yet, so light mode uses those screenshots and falls back to the dark clip where
no light screenshot exists.

| # | Step | Dark | Light |
|---|------|------|-------|
| 00 | Intro | clip `00-intro` (Today, loops) | still `02-today` |
| 01 | Choose a course | clip `01-course` | still `01-generate` |
| 02 | Generate | clip `02-generate` (waiting sped up 10×) | still `generating` |
| 03 | Reviewer | clip `03-reviewer` | still `updated-reviewer` |
| 04 | Study Assist 1/4 · quick assists | clip `04-assist-summarize` | dark clip |
| 05 | Study Assist 2/4 · key points | clip `05-assist-keypoints` | dark clip |
| 06 | Study Assist 3/4 · selection | clip `06-assist-select` | still `study-assist` |
| 07 | Study Assist 4/4 · grounding label | clip `07-assist-example` | still `study-assist` |
| 08 | Practice quiz · create | clip `08-quiz-create` | dark clip |
| 09 | Practice quiz · answer | clip `09-quiz-practice` | dark clip |
| 10 | Library | still `06-library-course` | still `06-library-course` |
| 11 | Tasks (swipe ←) | clip `11-tasks` | still `03-tasks` |
| 12 | Today plan (swipe →) | clip `12-today-plan` | still `02-today` |
| 13 | Light & dark (hold) | still `01-generate` | still `01-generate` |
| 14 | Outro | clip `14-outro` (loops) | still `04-library` |

**Study Assist** has four stops because it is the app's defining feature and
each way of using it (whole concept, key points, a selected phrase, grounding
labels) deserves its own scroll. One long clip would keep playing while the
visitor is reading and most of it would be missed. To change the split, add or
remove `assist-*` entries in `src/content.js`.

A light-mode take of the same flow can replace the light stills: cut it with
`scripts/cut-clips.py` into `public/videos/light/` (new times needed) and point
each step's `light` entry at its clip.

### How to record

1. **Make the phone look clean.** Turn on Do Not Disturb, charge to full,
   and use demo data with real-looking content (no "test test" notes).
   - iOS Simulator: `xcrun simctl status_bar booted override --time 9:41 --batteryLevel 100 --cellularBars 4`
   - Android: enable *Demo mode* in Developer options to freeze the status bar.
2. **Record the whole flow in one take**, then cut it into clips. One take
   gives continuity: each clip ends on the exact screen the next one starts on,
   so the steps play like one continuous video interrupted only by the scroll.
   - iPhone: Control Center → Screen Recording. Simulator: `xcrun simctl io booted recordVideo flow.mov`.
   - Android: Quick Settings → Screen record, or `adb shell screenrecord /sdcard/flow.mp4`.
3. **Move slower than feels natural.** Pause about half a second before each
   tap and after each result appears. The clip has to read at a glance while
   the phone is also moving.
4. **For the gesture clips (08–10), turn touch indicators on** so visitors see
   the swipe and the hold. Android: Developer options → *Show taps*. iOS has no
   tap display on a real device, so record these three in the Simulator after
   `defaults write com.apple.iphonesimulator ShowSingleTouches 1`. Leave the
   indicators off for the other clips.
5. **End each clip on a settled frame.** Clips hold their last frame, so the
   last frame is what people look at while they read the text.
6. **Record a light set only if you want the hold gesture to switch the
   recordings too.** Use the same take timing as the dark set.

### Cutting and compressing

`scripts/cut-clips.py` does this for every clip from a cut list. To cut one
by hand: the 3D screen is 20 : 9 like the recording phone (other phones fit too;
the edges are cropped slightly like `object-fit: cover`), and 720 px wide is
plenty:

```
# cut 02-generate from 0:12.5 to 0:19.0 of the full take
ffmpeg -ss 12.5 -to 19.0 -i flow.mov \
  -vf "scale=720:-2,fps=30" -an \
  -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 26 -preset slow \
  -movflags +faststart \
  public/videos/dark/02-generate.mp4
```

- `-an` drops audio (the clips play muted anyway, and this keeps files small).
- `-movflags +faststart` lets playback start before the whole file arrives.
- `-crf 26` usually gives 0.5–2 MB per clip. If UI text looks soft, try 22.
- H.264 MP4 plays in every current browser, including iOS Safari.

Check a clip with `npm run dev` and scroll to its step.

## Deploying

`.github/workflows/deploy.yml` builds the site and pushes it to the `gh-pages`
branch on every push to `main` (or to the branch named in that workflow).
GitHub Pages serves `gh-pages`: **Settings → Pages → Deploy from a branch →
`gh-pages` / root**.
