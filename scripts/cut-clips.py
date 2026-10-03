# Cuts the showcase clips out of one full screen recording.
#
#   python3 scripts/cut-clips.py take-dark.mp4 public/videos/dark
#   python3 scripts/cut-clips.py take-dark.mp4 public/videos/dark 03-generate   # just one clip
#
# Each clip is a list of (start, end, speed) segments from the take, joined in
# order; a speed above 1 fast-forwards a stretch where the app is only loading.
# The times below match the October 3 dark-mode take (XRecorder_20261003_01);
# a new take needs new times. Requires ffmpeg.
import subprocess, sys, os
SRC = sys.argv[1]; OUT = sys.argv[2]
def t(s):
    if isinstance(s, (int, float)): return float(s)
    m, sec = s.split(':'); return int(m) * 60 + float(sec)
CLIPS = {
  '00-intro':            [('0:01.6', '0:09.6', 1)],   # starts after the app-switcher zoom
  '01-course':           [('1:09', '1:12.5', 1), ('1:16.5', '1:18.5', 1), ('1:28.5', '1:33.5', 2), ('1:33.5', '1:36.5', 1)],
  '02-generate':         [('1:36.5', '1:40', 1), ('1:40', '2:22', 10), ('2:22', '2:27.5', 1)],
  '03-reviewer':         [('2:28.5', '2:39', 1)],
  '04-assist-summarize': [('2:39', '2:42.5', 1), ('2:42.5', '2:53.5', 4), ('2:53.5', '2:59', 1)],
  '05-assist-keypoints': [('2:59.5', '3:08.5', 1)],
  '06-assist-select':    [('3:08.5', '3:18.1', 1)],
  '07-assist-example':   [('3:18.1', '3:29.5', 3), ('3:29.5', '3:36', 1)],
  '08-quiz-create':      [('3:50.5', '4:01', 1.5), ('4:01', '4:27', 8), ('4:27', '4:30', 1)],
  '09-quiz-practice':    [('5:02', '5:20', 1.5)],
  '11-tasks':            [('0:48.1', '0:51.5', 1)],   # half a second of loading, then the list
  '12-today-plan':       [('6:27', '6:41.5', 1.25)],
  '14-outro':            [('5:48', '5:54', 1)],
}
only = sys.argv[3:]
for name, segs in CLIPS.items():
    if only and name not in only: continue
    parts, labels = [], []
    for i, (a, b, sp) in enumerate(segs):
        parts.append(f"[0:v]trim=start={t(a)}:end={t(b)},setpts=(PTS-STARTPTS)/{sp},fps=30[v{i}]")
        labels.append(f"[v{i}]")
    fc = ';'.join(parts) + ';' + ''.join(labels) + f"concat=n={len(segs)}:v=1:a=0[o]"
    out = os.path.join(OUT, name + '.mp4')
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', SRC, '-filter_complex', fc, '-map', '[o]', '-an',
                    '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-crf', '26', '-preset', 'slow',
                    '-movflags', '+faststart', out], check=True)
    d = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration,size', '-of', 'csv=p=0', out], capture_output=True, text=True).stdout.strip()
    print(name, d)
