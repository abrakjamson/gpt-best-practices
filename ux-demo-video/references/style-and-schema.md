# Style spec and EDL schema

## Templates (from the Launch Desk v5 build)

| File | Role |
|---|---|
| `recording-browser.js` | Launches isolated Edge (own profile, CDP 9333). Run detached. |
| `record-take.js` | Full take: screencast frames, cursor/ripple injection, typing, `events.json`. Writes `take3/` by default — rename per project. |
| `record-create-pickup.js` | Short pickup take for re-recording one moment (e.g., the Create click). |
| `timeline.js` | EDL: `SCENES`, `CHAPTERS`, `CUES` (audio), `fastRuns` (speed chips). |
| `compose.html` | Canvas compositor; `window.init(framesBySource)`, `drawFrame(t)`. Default source is `'take3'` — replace with your take name. Loads frames from `../<source>/frames/NNNNNN.jpg`. |
| `soundtrack.js` | Original synthesized music + SFX (96 BPM, D–Bm–G–A pads, kick, hats, bass, plucks; typing ticks, bell chimes, final hit, ≤2 whooshes). |
| `render.js` | Stills and full render; pipes frames to ffmpeg-static; muxes audio. |

Expected work layout: `<work>/<take>/frames`, `<work>/edit/{compose.html,timeline.js,...}`,
`<work>/edit/assets/microsoft-copilot.svg`, `<work>/out/`.

Logo: copy the skill's `assets/microsoft-copilot.svg` (current 2D icon, 512×512 viewBox) to
`edit/assets/microsoft-copilot.svg`, or re-download it from
`https://www.microsoft.com/content/dam/microsoft/bade/images/icons/en-us/m365-app-icons-fy26/Copilot-icon-filled-gradient-rgb.svg`.
Use it unmodified; log its sha256. (`example-edit-manifest.json` predates the refresh and shows
the old 3D favicon source; don't reuse that URL.)

## Layout and look

- Canvas 1920×1080. App window `WIN = {x:152, y:52, w:1616, h:909, r:22}` with soft shadow over a
  pastel aurora background with film grain.
- Title and end cards: vivid gradient (blue → violet → magenta) with drifting cyan/amber/coral
  blobs; official logo + "Microsoft Copilot" wordmark text; headline in Segoe UI Variable Display.
- Fonts: Segoe UI Variable Display (headlines), Segoe UI Variable Text (body/labels).
- Caption card: backdrop blur 22 px, white ~0.8 tint, gradient left bar, eyebrow
  `NN — CHAPTER`, 52 px headline revealed word-by-word, line 2 filled with the brand gradient,
  22 px body. Anchors: `'bl'`, `'tl'`, or `{x,y,w}`. Keep to ≤ 2 short lines + 1 body line.
- Callouts: rounded gradient ring around `rect` (source px), optional dark label pill
  (`side: top|bottom|topR`), `dim` darkens outside, `pulse`, `chime` adds a bell cue.
- Speed chip (e.g., "14×") shown automatically for segments ≥ 6× (merged runs via `fastRuns`).
- Footer: chapter progress dots + labels, small official logo, "Real product UI · Edited for time".
- Privacy: blur masks over sidebars/recent files; `hidePreview`; `soften` (blur + wash a region
  while the viewer should focus elsewhere); `focus` rounded cutouts.
- Joins: `cut` within flowing action, `dissolve` (0.6 s) between chapters/sources.

## EDL scene fields (`timeline.js`)

```js
{
  id: 'ask-1', chapter: 1,            // index into CHAPTERS
  source: 'pickup-create',            // optional; default main take
  join: 'cut' | 'dissolve',
  segs: [[srcStart, srcEnd, speed], ...],  // source seconds; speed 1 = realtime
  typing: [[srcStart, srcEnd]],       // emits typing-tick audio
  cam: [[u, cx, cy, scale], ..., ['end', cx, cy, scale]], // u = local output seconds
  caption: { id, lines: ['Line one', 'Gradient line'], body, anchor } | { id },  // reuse id to persist
  callouts: [{ u0, u1, rect: [x, y, w, h], label, side, dim, chime }],
  soften: { rect, u0, u1, blur, wash }, focus: {...}, hidePreview: true,
}
```

Camera: `cx, cy` are source-pixel centers; `scale` is output px per source px inside the window
(`WS = 1616/1920` shows the whole screen). Interpolation uses inOutCubic on center and log-width.
Zoom ≈ 1.4–1.6 on the composer when typing; return to full view for results.

## Pacing defaults

- Title ~3.4 s → chapters of 6–15 s → end card ~4.4 s; total 45–75 s.
- Speed up model "thinking/drafting" 9–14× with a speed chip; keep typing at 1.3–2×; keep reveals
  at 1×.
- One idea per caption; captions change at chapter boundaries, not every scene.
