---
name: ux-demo-video
description: >
  Produce polished, dynamic announcement/demo videos of real product UI (especially Microsoft
  Copilot features) in an established style: real browser recording via CDP screencast,
  composited on an animated canvas with camera moves, frosted captions, gradient callouts, an
  original synthesized soundtrack, and ffmpeg encoding. Use when asked to make a demo video,
  launch/announcement video, feature walkthrough, or "sizzle" clip of a web UX. NOT for slide
  decks, static screenshots, or videos built from mocked/fabricated UI.
---

# UX demo video (Copilot-gradient style)

Reference build: the "Launch Desk" Skills-in-Copilot announcement (v5). `templates/` contains its
working pipeline; treat it as an example to adapt, not a library with a stable API. Read
[references/style-and-schema.md](references/style-and-schema.md) before editing, and
`references/example-edit-manifest.json` for the manifest shape.

## The user's preferences (non-negotiable unless they say otherwise)

1. **Dynamic, not flat UX; "absolutely pro" polish.** Camera moves, staged reveals, eased motion,
   a real title and end card. A screen recording with text on top is not enough.
2. **Real interface in context, with easy-to-read text over it.** Keep the app window large;
   overlay copy is short, high-contrast, frosted-card backed.
4. **No fabricated interactions.** Every click/typing/result is actually recorded. Annotations,
   blur, zoom, speed-ups and cuts are fine; faking UI state is not.
6. **Official, current logos only.** Use the current **2D (flat) Microsoft Copilot icon**,
   unmodified, drawn via `drawImage`. Never draw a look-alike, and never use the older 3D ribbon
   icon (still served at `copilot.microsoft.com/static/cmc/favicon.svg`) or third-party traces
   (seeklogo/Wikimedia). Bundled copy: `assets/microsoft-copilot.svg`, from
   `https://www.microsoft.com/content/dam/microsoft/bade/images/icons/en-us/m365-app-icons-fy26/Copilot-icon-filled-gradient-rgb.svg`
   (sha256 `f16fdf8123d9dc4597561bfc62cebf5bc43262a1301d9acd470c4914e6dd1e1f`, Nov 2026). Before each
   project, re-download it; if the hash changed, view it and compare with the favicon in the live
   product. Record the source URL + sha256 in the edit manifest.
7. **Copilot-icon gradient palette**: cyan `#2BC4E3`, blue `#2D6BF0`, violet `#7B5CF5`,
   magenta `#D94FB0`, coral `#F2665B`, amber `#FFB547`.
8. **Naming:** the product is **"Microsoft Copilot"**.
9. **End on success** (e.g., the agent is Created). Don't show failures or flaky behavior; if a
   step doesn't work reliably, cut before it and tell the user rather than faking it.
10. **Sound:** subtle original music, typing ticks, chimes on key reveals, one final hit.
11. **Use the user's demo accounts.** The user signs in; never type, store, or ask for passwords.
12. Propose the scenario/setup first and get a go-ahead before recording. Deliver with
    `publish_chat_update` (video + announcement copy + poster).

## Models

Use Opus-class models (e.g., `claude-opus-5.5`) for this work: both the main session (scenario,
EDL, motion/typography judgment) and the critic sub-agent. Lighter models may run mechanical
steps (renders, ffprobe checks) via `task` agents.

## Workflow

1. **Propose** — scenario with a believable business story (e.g., Contoso marketing agent),
   beat sheet of 4–6 chapters, exact prompts, target length (45–75 s), and account. Wait for OK.
2. **Isolated browser** — `templates/recording-browser.js`: Edge with
   `--user-data-dir=<work>/edge-profile --remote-debugging-port=9333`, run detached. Ask the user
   to sign in to the demo account in that window; confirm the signed-in display name.
3. **Rehearse** — drive the flow once via Playwright `connectOverCDP`; capture stills of every
   control you will click and confirm selectors (prefer role/aria names).
4. **Record takes** — `templates/record-take.js`: `Page.startScreencast` (JPEG) → `frames/` +
   `frames.json` timestamps, injected SVG cursor and violet click ripple, `mark()` events log,
   typing at ~28 ms/key, human pauses. Re-record short **pickups** (see
   `record-create-pickup.js`) instead of redoing the whole take.
5. **Edit (EDL)** — `templates/timeline.js`: scenes with source time segments + speed, camera
   keyframes, captions, callouts, privacy masks, joins. See `references/style-and-schema.md`.
6. **Stills review** — render key frames with `render.js` stills mode; build a contact sheet
   (ffmpeg `tile`/`xstack`); view them yourself and fix framing, legibility and privacy before the
   full render.
7. **Render** — `render.js` drives `compose.html` in Playwright, pipes JPEG q97 frames to
   ffmpeg-static (libx264 slow CRF 17, yuv420p bt709, AAC 192k,
   `loudnorm=I=-16:TP=-1.5:LRA=9`, `+faststart`). ~6 min per minute of output.
8. **Verify** — checklist below. Keep prior versions as `-vN` backups.
8a. **Critic sub-agent (required)** — see "Critic review" below. Run it after stills review
   (before the full render) and again on the final render; fix all blocking findings and re-run
   until it has none. Only then publish.
8b. **User check-in on v1 (interactive mode only)** — after the first full render passes
   verification and the first critic pass, publish the v1 MP4 with `publish_chat_update`
   (labelled as a first cut, with the critic's open findings summarized), then stop and ask for
   notes with `ask_user`. Fold the user's notes in with the critic's before polishing further.
   Skip this pause in autopilot and keep iterating to the final.
9. **Publish** — `publish_chat_update` with the MP4, poster PNG and `announcement.md`; short
   message. Write an `edit-manifest.json` (version, sources, logo provenance, audio cues).

## Verification checklist

- `ffprobe`: 1920×1080, 30 fps, h264 + aac, expected duration.
- `ebur128`: about −16 LUFS integrated, true peak ≤ −1 dBTP.
- Flicker scan: `signalstats` YAVG per frame on suspicious ranges; cut any source flashes
  (loading spinners, blank repaints).
- Contact sheet: every caption readable, no prompt duplicated in overlays, PII/other tenants'
  files blurred (sidebar, recent files), current 2D official logo present and undistorted, clicks land on
  the right control, ends on success state, whoosh count ≤ 2.

## Critic review

Launch a fresh sub-agent (`task` tool, `agent_type: rubber-duck` or `general-purpose`,
`model: claude-opus-5.5`) acting as a demanding creative director plus brand/accuracy reviewer.
It must not have authored the edit. Give it complete context:

- Absolute paths to the contact sheet(s), key stills (title, every caption, every callout, the
  success moment, end card), and for the final pass the MP4, ffprobe/ebur128 output, and
  `timeline.js`.
- The scenario/beat sheet and the full preference list above, verbatim.
- The ask: view every image and grade (a) pro polish and motion/composition, (b) legibility of
  every overlay at 1080p, (c) each preference as pass/fail with evidence, (d) brand accuracy
  (current 2D official logo, "Microsoft Copilot" naming, palette), (e) privacy (other names,
  files, tenants visible), (f) accuracy (no fabricated UI, correct control clicked, no prompt
  duplicated, ends on success), (g) audio (whoosh count, levels).
- Required output: a findings list tagged **blocking / should-fix / nit**, each with timestamp or
  still name and a concrete fix. No rewriting of files.

Apply fixes yourself, re-render the affected stills, and re-run the critic (a new agent or a
follow-up message to the same one) until there are no blocking findings. Summarize remaining
should-fix/nit items to the user when publishing.

## Gotchas

- Auth can expire mid-session ("Authentication required → Continue"); ask the user to re-auth.
- CDP viewport can be 1912×1075 — scale non-1920 sources to 1920×1080 in the compositor.
- Screencast frames are sparse when nothing changes; hold the last frame, and don't seek past
  the recording end.
- Playwright `page.waitForFunction(fn, arg, options)` — options is the **third** argument.
- Avoid Remotion (license); the canvas + Playwright + ffmpeg pipeline has no licensing concerns.
- Work folders hold thousands of frames; use PowerShell `Get-ChildItem` rather than glob.
