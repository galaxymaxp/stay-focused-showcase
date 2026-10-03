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

Clips live in `public/videos/dark/` and `public/videos/light/`, named after the
step's `clip` value:

```
public/videos/dark/02-generate.mp4
public/videos/light/02-generate.mp4
```

Until a file exists, that step shows a placeholder that names the exact file it
wants. The light set is optional: any clip missing from `light/` falls back to
the `dark/` one. Holding the phone mid-clip switches to the other recording at
the same timestamp, so record both sets with the same timing if you make them.

### The clips

The dark set is cut from one full take (`XRecorder_20261003_01.mp4`) with
`scripts/cut-clips.py`; the cut times for every clip are in that script.

| # | File | Shows | Status |
|---|------|-------|--------|
| 00 | `00-intro` | Today: clock dial, Up Next, schedule (loops) | recorded |
| 01 | `01-sync` | Generate loads Canvas courses, sync tapped | recorded |
| 02 | `02-source` | Open a course, pick a lecture PPTX, Generate Reviewer | recorded |
| 03 | `03-generate` | Generation orb to "Ready in your Library" (waiting sped up 10×) | recorded |
| 04 | `04-reviewer` | Reviewer opens, scroll to a topic with highlighted terms | recorded |
| 05 | `05-assist-summarize` | Study Assist quick assist: Summarize | recorded |
| 06 | `06-assist-keypoints` | Selecting key points, their assist chips | recorded |
| 07 | `07-assist-select` | Hold-and-drag selection → Define · Explain · Example · Test Me · Ask | recorded |
| 08 | `08-assist-example` | Example answer with its "From your material" label | recorded |
| 09 | `09-quiz-create` | New Quiz options, Create Quiz, generation | recorded |
| 10 | `10-quiz-practice` | Answering, Correct, results with ideas to revisit | recorded |
| 11 | `11-queue` | Queue | recorded |
| 12 | `12-library` | Library by course, Reviewers / Quizzes / Drafts | recorded |
| 13 | `13-tasks` | Tasks (the swipe-left page) | recorded |
| 14 | `14-today-plan` | Today: drag free time, Proposed plan, Apply plan (the swipe-right page) | recorded |
| 15 | `15-hold-theme` | Press and hold to switch light/dark | **needs a take** |
| 16 | `16-outro` | Today, calm (loops) | recorded |

**Study Assist** has four stops because it is the app's defining feature and
each way of using it (whole concept, key points, a selected phrase, grounding
labels) deserves its own scroll. One long clip would keep playing while the
visitor is reading and most of it would be missed. To change the split, add or
remove `assist-*` entries in `src/content.js`.

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
