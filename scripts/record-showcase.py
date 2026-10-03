#!/usr/bin/env python3
"""Record the Stay Focused showcase straight from the attached Android device.

Run one pass at a time so an interrupted AI request is easy to resume:

    python scripts/record-showcase.py dark
    python scripts/record-showcase.py light

The script uses text from `uiautomator dump` before tapping whenever the app
exposes it.  The few coordinate-only operations are documented inline: the
clock dial and the two swipe demonstrations do not expose a tappable text
target.  No AI state is waited for with a fixed delay; `wait_for` polls the
device until its expected text appears or fails with a useful timeout.
"""

from __future__ import annotations

import argparse
import os
import re
import signal
import shutil
import subprocess
import sys
import time
import xml.etree.ElementTree as ET
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ADB = shutil.which("adb") or "adb"
FFMPEG = os.environ.get("FFMPEG") or shutil.which("ffmpeg")
if not FFMPEG:
    candidate = ROOT / "node_modules" / "ffmpeg-static" / "ffmpeg.exe"
    if candidate.exists():
        FFMPEG = str(candidate)
SCRCPY = os.environ.get("SCRCPY") or shutil.which("scrcpy")
if not SCRCPY and os.environ.get("LOCALAPPDATA"):
    installed = list((Path(os.environ["LOCALAPPDATA"]) / "Microsoft" / "WinGet" / "Packages").glob("Genymobile.scrcpy_*/*/scrcpy.exe"))
    if installed:
        SCRCPY = str(installed[0])

PACKAGE = "com.galaxymaxp.stayfocusedv2"
COURSE = "Mobile Application Design and Development"
LECTURE = "Module 1 - Introduction to the Android Platform.pptx"
PPTX = "PPTX · ready"
SCALE = "720x1608"
BITRATE = "6000000"
PACE_BEFORE = 0.8
PACE_AFTER = 1.5


def run(*args: str, check: bool = True, capture: bool = False) -> str:
    result = subprocess.run(args, check=check, text=True, capture_output=capture)
    return result.stdout if capture else ""


def adb(*args: str, capture: bool = False, check: bool = True) -> str:
    return run(ADB, *args, check=check, capture=capture)


def assert_device() -> None:
    devices = adb("devices", capture=True).splitlines()[1:]
    state = next((line.split()[1] for line in devices if line.split() and line.split()[0]), None)
    if state != "device":
        raise RuntimeError(f"Android device is not ready (adb state: {state or 'missing'}).")


def dump() -> ET.Element:
    remote = "/sdcard/stay-focused-window.xml"
    for _ in range(4):
        adb("shell", "uiautomator", "dump", remote, capture=True, check=False)
        raw = adb("exec-out", "cat", remote, capture=True, check=False)
        if raw:
            try:
                return ET.fromstring(raw)
            except ET.ParseError:
                pass
        time.sleep(0.35)
    raise RuntimeError("uiautomator dump returned no parseable hierarchy")


def text_nodes() -> list[ET.Element]:
    return [node for node in dump().iter("node") if node.get("text") or node.get("content-desc")]


def visible_text() -> str:
    return "\n".join(
        value for node in text_nodes() for value in (node.get("text", ""), node.get("content-desc", "")) if value
    )


def wait_for(pattern: str, timeout: float = 150) -> str:
    deadline = time.monotonic() + timeout
    regex = re.compile(pattern, re.I)
    last = ""
    while time.monotonic() < deadline:
        last = visible_text()
        if regex.search(last):
            return last
        time.sleep(0.7)
    raise TimeoutError(f"Timed out waiting for /{pattern}/. Last UI text:\n{last[:1600]}")


def center(bounds: str) -> tuple[int, int]:
    values = [int(value) for value in re.findall(r"\d+", bounds)]
    return ((values[0] + values[2]) // 2, (values[1] + values[3]) // 2)


def tap_text(label: str, timeout: float = 20, exact: bool = True) -> None:
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        for node in text_nodes():
            haystack = " ".join((node.get("text", ""), node.get("content-desc", ""))).strip()
            match = haystack == label if exact else label.lower() in haystack.lower()
            if match and node.get("bounds"):
                left, top, right, bottom = [int(value) for value in re.findall(r"\d+", node.get("bounds", ""))]
                if right <= left or bottom <= top:
                    continue
                time.sleep(PACE_BEFORE)
                x, y = (left + right) // 2, (top + bottom) // 2
                adb("shell", "input", "tap", str(x), str(y))
                time.sleep(PACE_AFTER)
                return
        time.sleep(0.5)
    raise TimeoutError(f"Could not find tappable text: {label}. Last UI text:\n{visible_text()[:1600]}")


def tap(x: int, y: int, comment: str) -> None:
    """Tap a documented coordinate fallback after the showcase pacing pause."""
    print(f"coordinate tap ({x}, {y}): {comment}")
    time.sleep(PACE_BEFORE)
    adb("shell", "input", "tap", str(x), str(y))
    time.sleep(PACE_AFTER)


def swipe(x1: int, y1: int, x2: int, y2: int, duration_ms: int, comment: str) -> None:
    print(f"coordinate swipe: {comment}")
    time.sleep(PACE_BEFORE)
    adb("shell", "input", "swipe", str(x1), str(y1), str(x2), str(y2), str(duration_ms))
    time.sleep(PACE_AFTER)


def open_study_assist_from_topic() -> None:
    """Open Study Assist through the live bounds of the reviewer concept body."""
    for node in text_nodes():
        body = node.get("text", "")
        if len(body) > 180 and "Android" in body and node.get("bounds"):
            x, y = center(node.get("bounds", ""))
            tap(x, y, "open Study Assist from the current topic body")
            return
    raise RuntimeError("Could not locate the visible reviewer concept body.")


def select_key_points(count: int = 2) -> None:
    """Select visible key-point cards by their current UI dump bounds."""
    candidates: list[tuple[int, int, int, int, str]] = []
    for node in text_nodes():
        label = node.get("text", "").strip()
        values = [int(value) for value in re.findall(r"\d+", node.get("bounds", ""))]
        if len(values) != 4 or len(label) < 16:
            continue
        left, top, right, bottom = values
        if top < 900 or right <= left or bottom <= top:
            continue
        if any(skip in label.upper() for skip in ("KEY POINTS", "TOPIC ", "TAP A KEY POINT")):
            continue
        candidates.append((top, left, right, bottom, label))
    candidates.sort()
    if len(candidates) < count:
        raise RuntimeError(f"Expected {count} visible key points, found {len(candidates)}.")
    for top, left, right, bottom, label in candidates[:count]:
        tap((left + right) // 2, (top + bottom) // 2, f"select key point: {label[:60]}")


def close_study_assist() -> None:
    for attempt in range(3):
        current = visible_text()
        if "Study Assist" not in current:
            wait_for("Search this Reviewer", 10)
            return
        if attempt:
            # Android's native selection popup can cover Done while being
            # omitted from the UI dump. Back dismisses that popup first.
            adb("shell", "input", "keyevent", "4")
            time.sleep(0.5)
            if "Study Assist" not in visible_text():
                wait_for("Search this Reviewer", 10)
                return
        tap_text("Done")
    if "Study Assist" in visible_text():
        raise RuntimeError("Study Assist did not close after clearing the selection popup.")
    wait_for("Search this Reviewer", 10)


def long_press_concept_text() -> None:
    for node in text_nodes():
        label = node.get("text", "")
        values = [int(value) for value in re.findall(r"\d+", node.get("bounds", ""))]
        if len(label) > 120 and len(values) == 4 and values[2] > values[0] and values[3] > values[1]:
            x = (values[0] + values[2]) // 2
            y = max(values[1] + 40, min(values[3] - 40, (values[1] + values[3]) // 2))
            swipe(x, y, x, y, 800, "long-press a word in the live concept text")
            return
    raise RuntimeError("Could not locate the Study Assist concept text.")


def launch_root() -> None:
    adb("shell", "am", "force-stop", PACKAGE)
    adb("shell", "monkey", "-p", PACKAGE, "1", capture=True)
    # The persistent bottom-tab label "Today" exists on every root tab, so it is
    # not a readiness signal. Wait for the Today page's own greeting/schedule.
    wait_for(r"Good (morning|afternoon|evening),|Free time block|Up Next", 30)


def open_generate() -> None:
    tap_text("Generate")
    wait_for("Canvas material or your own notes", 30)


def open_material() -> None:
    open_generate()
    # The course list may be collapsed after app start; Sync Canvas is a text-backed action.
    if COURSE not in visible_text():
        tap_text("Sync Canvas now")
        wait_for(re.escape(COURSE), 90)
    tap_text(COURSE)
    wait_for(re.escape(LECTURE), 60)
    tap_text(LECTURE)
    wait_for("Generate Reviewer", 40)


def open_finished_reviewer() -> None:
    launch_root()
    tap_text("Library")
    wait_for(re.escape(COURSE), 45)
    tap_text(COURSE)
    wait_for("Reviewers", 40)
    tap_text("Reviewers")
    wait_for("Reviewer", 40)
    # The first visible Reviewer card is the fresh one for the selected lecture.
    tap_text("Reviewer", exact=False)
    wait_for("Search this Reviewer", 45)


def record(name: str, theme: str, action) -> None:
    out_dir = ROOT / "public" / "videos" / theme
    raw_dir = ROOT / ".recordings" / theme
    out_dir.mkdir(parents=True, exist_ok=True)
    raw_dir.mkdir(parents=True, exist_ok=True)
    remote = f"/sdcard/{name}-{theme}.mp4"
    local_raw = raw_dir / f"{name}.mp4"
    output = out_dir / f"{name}.mp4"
    poster = ROOT / "public" / "posters" / theme / f"{name}.webp"
    poster.parent.mkdir(parents=True, exist_ok=True)
    print(f"\nRecording {theme}/{name}")
    if SCRCPY:
        # This device does not expose /system/bin/screenrecord to the adb shell.
        # scrcpy records the same USB-debugging stream without opening a playback window.
        proc = subprocess.Popen(
            [SCRCPY, "--no-playback", "--no-audio", "--video-codec=h264", "--max-size=720",
             "--record", str(local_raw)],
            # Ctrl+Break lets scrcpy close the MP4 cleanly; terminate() truncates its moov atom.
            creationflags=getattr(subprocess, "CREATE_NEW_PROCESS_GROUP", 0),
        )
    else:
        proc = subprocess.Popen([ADB, "shell", "screenrecord", "--size", SCALE, "--bit-rate", BITRATE, remote])
    try:
        # Allow the USB capture session to attach; this is capture setup, not an AI wait.
        time.sleep(2.5)
        action()
        time.sleep(PACE_AFTER)
    finally:
        try:
            if SCRCPY:
                proc.send_signal(signal.CTRL_BREAK_EVENT)
            else:
                proc.terminate()
            proc.wait(timeout=10)
        except subprocess.TimeoutExpired:
            proc.kill()
    if not SCRCPY:
        adb("pull", remote, str(local_raw))
        adb("shell", "rm", "-f", remote)
    if not FFMPEG:
        raise RuntimeError("ffmpeg is required. Install it or run npm i --no-save ffmpeg-static.")
    run(FFMPEG, "-y", "-i", str(local_raw), "-vf", "scale=720:-2,fps=30", "-an", "-c:v", "libx264",
        "-profile:v", "high", "-pix_fmt", "yuv420p", "-crf", "26", "-preset", "slow", "-movflags", "+faststart", str(output))
    run(FFMPEG, "-y", "-i", str(output), "-frames:v", "1", "-c:v", "libwebp", "-quality", "75", str(poster))


def clip_intro() -> None:
    # set_demo has already returned the app to this settled Today screen.
    time.sleep(6)


def clip_course() -> None:
    open_material()
    tap_text("Generate Reviewer")
    wait_for("Starting your request|Bringing the important ideas together", 30)


def clip_generate() -> None:
    # Starts only after the page-change bounce, as specified in the brief.
    wait_for("Starting your request|Bringing the important ideas together", 30)
    wait_for("Ready in your Library", 180)


def clip_reviewer() -> None:
    # Some builds navigate straight to the saved Reviewer when a request completes;
    # others leave the explicit Open in Library button. Both are the same result.
    current = visible_text()
    if "Open in Library" in current:
        tap_text("Open in Library")
    elif "Search this Reviewer" not in current:
        open_finished_reviewer()
    wait_for("Search this Reviewer", 45)
    swipe(540, 2050, 540, 1150, 500, "scroll to a readable topic and its highlighted key points")


def clip_assist_summarize() -> None:
    open_study_assist_from_topic()
    wait_for("QUICK ASSISTS", 30)
    tap_text("Summarize")
    wait_for("Ready", 150)
    tap_text("Summarize")  # expand the completed result card into view
    swipe(540, 2100, 540, 1050, 500, "reveal the completed summary card")
    wait_for("AI summary", 30)


def clip_assist_keypoints() -> None:
    close_study_assist()
    swipe(540, 2050, 540, 1150, 500, "reveal key points")
    select_key_points()
    wait_for("2 selected", 30)


def select_phrase() -> None:
    close_study_assist()
    if "Cancel selection" in visible_text():
        tap_text("Cancel selection")
        wait_for("Search this Reviewer", 30)
    open_study_assist_from_topic()
    wait_for("Hold any word", 30)
    long_press_concept_text()
    wait_for("Define", 30)


def clip_assist_select() -> None:
    select_phrase()


def clip_assist_example() -> None:
    tap_text("Example")
    wait_for(r"From your material|Source \+ general knowledge|General knowledge", 150)


def clip_quiz_create() -> None:
    tap_text("Done")
    wait_for("Search this Reviewer", 30)
    swipe(540, 700, 540, 2100, 500, "return reviewer header to view")
    tap_text("Generate Quiz")
    wait_for("New Quiz", 30)
    tap_text("10")
    tap_text("Easy")
    tap_text("Multiple Choice")
    tap_text("Create Quiz")
    wait_for("Practice quiz", 180)


def clip_quiz_practice() -> None:
    tap_text("Practice quiz")
    wait_for("Check answer", 60)
    # Correct choice then check; the second question makes the clip read as practice, not a still.
    tap(540, 888, "choose the first answer")
    tap_text("Check answer")
    wait_for("Correct|Incorrect", 30)
    swipe(540, 2100, 540, 1400, 400, "reveal question navigation")
    tap(948, 2022, "next-question arrow has no text")
    wait_for("Question 2 of 10", 30)
    tap(160, 840, "choose a second answer")
    tap_text("Check answer")
    wait_for("Correct|Incorrect", 30)
    tap_text("Finish quiz")
    wait_for("Keep building on these ideas", 60)


def clip_library() -> None:
    launch_root()
    tap_text("Library")
    wait_for(re.escape(COURSE), 45)
    tap_text(COURSE)
    wait_for("Reviewers", 30)
    tap_text("Reviewers")
    tap_text("Quizzes")
    tap_text("Drafts")


def clip_tasks() -> None:
    launch_root()
    open_generate()
    # React Native's course cards intercept a content swipe, so this demonstrates the requested
    # leftward finger gesture then uses the labelled tab fallback to arrive at Tasks.
    swipe(820, 300, 160, 300, 650, "requested left swipe; content has no tab gesture handler")
    tap_text("Tasks")
    wait_for("Tasks|Assignments", 45)


def clip_today_plan() -> None:
    launch_root()
    tap_text("Generate")
    swipe(160, 300, 820, 300, 650, "requested right swipe; content has no tab gesture handler")
    tap_text("Today")
    wait_for("Free time block|Up Next", 45)
    # The clock dial is a custom SVG without text-backed controls.
    swipe(205, 640, 470, 520, 650, "drag availability dial across free time")
    wait_for("Proposed plan|Apply plan", 45)
    if "Apply plan" in visible_text():
        tap_text("Apply plan")


def clip_outro() -> None:
    # The main loop prepares this settled Today screen before recording.
    time.sleep(6)


CLIPS = [
    ("00-intro", clip_intro), ("01-course", clip_course), ("02-generate", clip_generate),
    ("03-reviewer", clip_reviewer), ("04-assist-summarize", clip_assist_summarize),
    ("05-assist-keypoints", clip_assist_keypoints), ("06-assist-select", clip_assist_select),
    ("07-assist-example", clip_assist_example), ("08-quiz-create", clip_quiz_create),
    ("09-quiz-practice", clip_quiz_practice), ("10-library", clip_library), ("11-tasks", clip_tasks),
    ("12-today-plan", clip_today_plan), ("14-outro", clip_outro),
]


def set_demo(theme: str) -> None:
    night = "yes" if theme == "dark" else "no"
    # This realme blocks demo-mode and Show taps writes from an adb shell. Those
    # controls are intentionally left exactly as the person recording set them.
    adb("shell", "cmd", "uimode", "night", night, check=False)
    launch_root()
    # This opens settings only before recording. Their text locations are intentionally not dumped.
    tap(948, 266, "open Profile sheet before recording")
    tap(540, 2220, "open Settings before recording")
    tap(830 if theme == "dark" else 540, 1363, f"select {theme} appearance")
    tap(320, 1578, "select Stay Focused color theme")
    adb("shell", "input", "keyevent", "4")
    launch_root()


def restore(original_night: str, original_touches: str) -> None:
    if original_night in {"1", "2"}:
        adb("shell", "cmd", "uimode", "night", "yes" if original_night == "2" else "no", check=False)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("theme", choices=("dark", "light"))
    parser.add_argument("--only", action="append", default=[])
    parser.add_argument("--resume", action="store_true", help="continue from the currently visible app state")
    args = parser.parse_args()
    assert_device()
    if not FFMPEG:
        print("ffmpeg missing: run npm i --no-save ffmpeg-static first.", file=sys.stderr)
        return 2
    if not SCRCPY:
        print("scrcpy missing: this device also has no accessible adb screenrecord binary.", file=sys.stderr)
        return 2
    original_night = adb("shell", "settings", "get", "secure", "ui_night_mode", capture=True).strip()
    original_touches = adb("shell", "settings", "get", "system", "show_touches", capture=True).strip()
    try:
        if not args.resume:
            set_demo(args.theme)
        for name, action in CLIPS:
            if args.only and name not in args.only:
                continue
            if name == "14-outro":
                launch_root()
            record(name, args.theme, action)
    finally:
        restore(original_night, original_touches)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
