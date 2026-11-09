// v5 edit decision list. Source times refer to each scene's take; camera keyframes use local output seconds.
// Camera scale is output pixels per source pixel inside the app window (WS = whole screen visible).
(function (root) {
  const WIN = { x: 152, y: 52, w: 1616, h: 909, r: 22 };
  const WS = WIN.w / 1920;
  const FULL = [960, 540, WS];
  const CHAPTERS = ['Describe', 'Write a skill', 'Review', 'Add another', 'Create'];
  const TITLE_UI_START = 3.4;
  const END_HOLD = 4.4;
  const DISSOLVE = 0.6;

  const SCENES = [
    {
      id: 'describe', chapter: 0, join: 'cut', segs: [[3.0, 15.2, 2.0]], typing: [[3.74, 14.41]],
      cam: [[0, ...FULL], [0.9, ...FULL], [2.5, 1088, 478, 1.42], ['end', 1088, 482, 1.48]],
      caption: { id: 'c-describe', lines: ['Start with', 'your agent.'], body: 'Tell Copilot what it’s for, in plain words.', anchor: 'bl' },
    },
    {
      id: 'drafting', chapter: 0, join: 'cut', segs: [[15.2, 31.65, 9], [32.8, 34.7, 9], [34.7, 37.3, 1.3]],
      cam: [[0, 1088, 482, 1.48], [0.9, 1000, 260, 1.6], [2.55, 980, 260, 1.6], [3.25, ...FULL], ['end', ...FULL]],
      caption: { id: 'c-describe' },
    },
    {
      id: 'drafted', chapter: 0, join: 'cut', segs: [[37.3, 40.7, 1]],
      cam: [[0, ...FULL], [0.4, ...FULL], ['end', 1000, 520, 0.92]],
      caption: { id: 'c-drafted', lines: ['Launch Desk,', 'drafted.'], body: 'Instructions and prompts, ready to go.', anchor: 'bl' },
      callouts: [
        { u0: 0.25, u1: 1.85, rect: [903, 104, 806, 104] },
        { u0: 1.7, u1: 3.4, rect: [928, 628, 782, 152], label: 'No skills yet', side: 'bottom', dim: true },
      ],
    },
    {
      id: 'ask-1', chapter: 1, join: 'cut', segs: [[40.75, 49.2, 1.4]], typing: [[40.784, 48.436]],
      cam: [[0, 1000, 520, 0.92], [1.1, 377, 900, 1.45], ['end', 377, 910, 1.52]],
      caption: { id: 'c-ask-1', lines: ['Ask for', 'a skill.'], body: 'Just describe the job you need done.', anchor: 'tl' },
    },
    {
      id: 'writing-1', chapter: 1, join: 'cut', segs: [[49.2, 86.75, 14]],
      cam: [[0, 377, 910, 1.52], [1.3, ...FULL], ['end', ...FULL]],
      caption: { id: 'c-writing-1', lines: ['Copilot', 'writes it.'], body: 'A name, a description and clear steps.', anchor: 'bl' },
    },
    {
      id: 'skill-added', chapter: 1, join: 'cut', segs: [[86.75, 92.6, 1]],
      cam: [[0, ...FULL], [0.25, ...FULL], [1.6, 905, 505, 1.0], ['end', 930, 520, 1.05]],
      caption: { id: 'c-writing-1' },
      callouts: [
        { u0: 0.45, u1: 2.0, rect: [100, 236, 560, 184], label: 'What Copilot built', side: 'top' },
        { u0: 2.05, u1: 5.85, rect: [930, 676, 754, 78], label: 'Skill added', side: 'bottom', dim: true, chime: true },
      ],
    },
    {
      id: 'review', chapter: 2, join: 'cut', segs: [[92.6, 93.7, 1], [93.7, 97.6, 4], [97.6, 102.9, 1.15]],
      soften: { rect: [0, 0, 712, 1080], u0: 0.7, u1: 1.6, blur: 3, wash: 'rgba(250,249,253,.5)' },
      cam: [[0, 930, 520, 1.05], [1.3, 1180, 440, 1.22], ['end', 1180, 458, 1.24]],
      caption: { id: 'c-review', lines: ['Open it.', 'Make it yours.'], body: 'Plain, editable instructions.', anchor: { x: 180, y: 548, w: 440 } },
      callouts: [
        { u0: 1.45, u1: 3.3, rect: [912, 102, 770, 92], label: 'When to use it', side: 'bottom' },
        { u0: 3.2, u1: 5.35, rect: [945, 292, 734, 354], label: 'What to do, step by step', side: 'bottom' },
        { u0: 5.25, u1: 6.685, rect: [1545, 240, 38, 34], label: 'Edit anytime', side: 'topR' },
      ],
    },
    {
      id: 'ask-2', chapter: 3, join: 'dissolve', segs: [[106.95, 115.25, 1.4]], typing: [[106.915, 114.477]],
      cam: [[0, 377, 900, 1.42], ['end', 377, 910, 1.52]],
      caption: { id: 'c-ask-2', lines: ['Need another?', 'Keep talking.'], body: 'Add skills one request at a time.', anchor: 'tl' },
    },
    {
      id: 'writing-2', chapter: 3, join: 'cut', segs: [[115.25, 151.5, 14]],
      cam: [[0, 377, 910, 1.52], [1.3, ...FULL], ['end', ...FULL]],
      caption: { id: 'c-writing-2', lines: ['Skill two,', 'written for you.'], body: 'Each skill stays focused on one job.', anchor: 'bl' },
    },
    {
      id: 'two-skills', chapter: 3, join: 'cut', segs: [[151.5, 156.6, 1]],
      cam: [[0, ...FULL], [0.25, ...FULL], [1.5, 905, 505, 1.0], ['end', 930, 525, 1.05]],
      caption: { id: 'c-two', lines: ['One agent.', 'Two skills.'], body: 'Launch kits and brand-voice reviews.', anchor: 'bl' },
      callouts: [
        { u0: 0.4, u1: 1.6, rect: [100, 236, 560, 156], label: 'What Copilot built', side: 'top' },
        { u0: 1.15, u1: 5.1, rect: [930, 676, 754, 156], label: 'Second skill added', side: 'bottom', dim: true, chime: true },
      ],
    },
    {
      id: 'create', chapter: 4, source: 'pickup-create', join: 'dissolve', segs: [[1.7, 5.0, 1]],
      soften: { rect: [0, 72, 1920, 1008], u0: -1, u1: 0, blur: 4, wash: 'rgba(250,249,253,.4)' },
      cam: [[0, 1450, 320, 1.3], [1.1, 1510, 275, 1.5], ['end', 1510, 275, 1.5]],
      caption: { id: 'c-create', lines: ['Ready?', 'Create.'], body: 'Launch Desk ships with its skills.', anchor: 'br' },
      callouts: [{ u0: 0.35, u1: 2.8, rect: [1750, 14, 63, 33], pulse: true }],
    },
    {
      id: 'creating', chapter: 4, source: 'pickup-create', join: 'cut', segs: [[5.0, 7.35, 1]],
      hidePreview: true, focus: [658.75, 414.42, 602.51, 251.16],
      cam: [[0, 1510, 275, 1.5], [1.0, 960, 540, 1.3], ['end', 960, 540, 1.34]],
      caption: { id: 'c-create' },
    },
    {
      id: 'created', chapter: 4, source: 'pickup-create', join: 'dissolve', segs: [[13.85, 17.2, 1]],
      hidePreview: true, focus: [658.75, 460.63, 602.51, 158.74],
      cam: [[0, 960, 540, 1.34], ['end', 960, 535, 1.4]],
      caption: { id: 'c-created', lines: ['Launch Desk.', 'Created.'], body: 'Built entirely by conversation.', anchor: 'br' },
      callouts: [{ u0: 0.25, u1: 3.35, rect: [658.75, 460.63, 602.51, 158.74], chime: true }],
    },
  ];

  let t = TITLE_UI_START;
  let captionDefs = {};
  for (const s of SCENES) {
    s.dur = s.segs.reduce((sum, [a, b, speed]) => sum + (b - a) / speed, 0);
    s.start = t;
    t += s.dur;
    s.cam = s.cam.map(k => (k[0] === 'end' ? [s.dur, k[1], k[2], k[3]] : k));
    if (s.caption.lines) captionDefs[s.caption.id] = s.caption;
    s.caption = { ...captionDefs[s.caption.id], id: s.caption.id };
    s.caption.eyebrow = CHAPTERS[s.chapter];
    s.caption.number = String(s.chapter + 1).padStart(2, '0');
  }
  const UI_END = t;
  const TOTAL = UI_END + END_HOLD;

  function srcToLocal(scene, src) {
    let u = 0;
    for (const [a, b, speed] of scene.segs) {
      if (src <= b) return u + Math.max(0, src - a) / speed;
      u += (b - a) / speed;
    }
    return u;
  }
  function localToSrc(scene, local) {
    let u = 0;
    for (const [a, b, speed] of scene.segs) {
      const d = (b - a) / speed;
      if (local <= u + d) return { src: a + Math.max(0, local - u) * speed, speed };
      u += d;
    }
    const last = scene.segs[scene.segs.length - 1];
    return { src: last[1], speed: last[2] };
  }

  function fastRuns(scene) {
    const runs = [];
    let u = 0;
    for (const [a, b, speed] of scene.segs) {
      const d = (b - a) / speed;
      const prev = runs[runs.length - 1];
      if (speed >= 6) {
        if (prev && prev.speed === speed && Math.abs(prev.u1 - u) < 1e-9) prev.u1 = u + d;
        else runs.push({ u0: u, u1: u + d, speed });
      }
      u += d;
    }
    return runs;
  }

  const PLAN = SCENES.map(s => ({
    id: s.id, start: +s.start.toFixed(3), dur: +s.dur.toFixed(3), chapter: CHAPTERS[s.chapter], join: s.join,
    source: s.source || 'take3', segs: s.segs, caption: s.caption.lines.join(' '),
  }));
  const CUES = [];
  CUES.push({ t: TITLE_UI_START - 0.35, type: 'whoosh' });
  for (const s of SCENES) {
    for (const [a, b] of s.typing || []) CUES.push({ t: s.start + srcToLocal(s, a), end: s.start + srcToLocal(s, b), type: 'typing' });
    for (const c of s.callouts || []) if (c.chime) CUES.push({ t: s.start + c.u0, type: 'chime' });
  }
  CUES.push({ t: UI_END - 0.6, type: 'whoosh' });
  CUES.push({ t: UI_END, type: 'final' });

  const api = { WIN, WS, CHAPTERS, SCENES, PLAN, CUES, TOTAL, UI_START: TITLE_UI_START, UI_END, DISSOLVE, srcToLocal, localToSrc, fastRuns };
  if (typeof module !== 'undefined') module.exports = api; else root.TL = api;
})(this);
