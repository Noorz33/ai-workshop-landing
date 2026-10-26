// The journey: every scroll "station" on the map, in reading order.
// The copper route is an infinity sign (lemniscate): ChatGPT is the west loop, Gemini the east loop,
// and both loops meet at the centre crossing (the bridge). One full trip starts and ends at the centre.
// node: [x, z] on the map floor · u: arc-length position on the route (0 → 1)
// cam: dist / elev (deg above the floor) / az (deg) around the target
// ax, ay: where the target sits on screen (0..1) on desktop; mobile uses max/may
// maz: azimuth on portrait screens — wide shots turn 90° so the ∞ stands upright
// light: ambient, ChatGPT territory, Gemini territory, roaming searchlights

// ── the infinity sign ─────────────────────────────────────
const A = 62, ZS = 1.38
const lemni = t => { const s = Math.sin(t), c = Math.cos(t), d = 1 + s * s; return [A * c / d, ZS * A * s * c / d] }
const SAMPLES = 1600
// t from π/2 (centre) → 3π/2 (centre, west loop done) → 5π/2 (centre, east loop done)
export const ROUTE_PTS = Array.from({ length: SAMPLES + 1 }, (_, i) => lemni(Math.PI / 2 + (i / SAMPLES) * Math.PI * 2))
const cum = [0]
for (let i = 1; i <= SAMPLES; i++) cum[i] = cum[i - 1] + Math.hypot(ROUTE_PTS[i][0] - ROUTE_PTS[i - 1][0], ROUTE_PTS[i][1] - ROUTE_PTS[i - 1][1])
const LEN = cum[SAMPLES]
const at = u => {
  const L = u * LEN
  let lo = 0, hi = SAMPLES
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] <= L) lo = m; else hi = m }
  const f = (L - cum[lo]) / Math.max(1e-6, cum[hi] - cum[lo])
  return [ROUTE_PTS[lo][0] + (ROUTE_PTS[hi][0] - ROUTE_PTS[lo][0]) * f, ROUTE_PTS[lo][1] + (ROUTE_PTS[hi][1] - ROUTE_PTS[lo][1]) * f]
}
// eight stations per loop, spread evenly and kept clear of the crossing
const loopU = (loop, i) => loop * 0.5 + 0.5 * (0.1 + (0.8 * i) / 7)

export const TERR = {
  gpt: { center: [-33, 0], color: [0.92, 0.95, 1.0] },
  gem: { center: [33, 0], color: [0.55, 0.6, 1.0] },
}

const WIDE = { ax: 0.5, ay: 0.5, max: 0.5, may: 0.5 }
const SIDE = { ax: 0.3, ay: 0.76, max: 0.5, may: 0.47 }

// route: how strongly the ∞ itself glows (wide shots show it off)
const L = {
  dark: { amb: 0, gpt: 0, gem: 0, sweep: 1, route: 0.65 },
  gptHub: { amb: 0.12, gpt: 1, gem: 0, sweep: 0.25, route: 0 },
  gpt: { amb: 0.12, gpt: 1, gem: 0.04, sweep: 0, route: 0 },
  reveal: { amb: 0.42, gpt: 0.85, gem: 0.95, sweep: 0.55, route: 0.7 },
  gemHub: { amb: 0.14, gpt: 0.22, gem: 1, sweep: 0.15, route: 0 },
  gem: { amb: 0.12, gpt: 0.18, gem: 1, sweep: 0, route: 0 },
  prep: { amb: 0.24, gpt: 0.55, gem: 0.75, sweep: 0, route: 0 },
  all: { amb: 0.42, gpt: 1, gem: 1, sweep: 0.75, route: 1 },
}

// a station on the route; the camera sits on the outer side of the loop, looking in toward the crossing
const mod = (id, terr, loop, i, extra = {}) => {
  const u = loopU(loop, i)
  const [x, z] = at(u)
  const az = Math.max(-14, Math.min(14, x * 0.22))
  return {
    id, kind: 'module', terr, node: [x, z], u,
    cam: { dist: 25, elev: 44, az, fov: 38, ...SIDE },
    light: terr === 'gpt' ? L.gpt : terr === 'gem' ? L.gem : L.prep,
    len: 1.2,
    ...extra,
  }
}

export const STOPS = [
  { id: 'hero', kind: 'hero', target: [0, 0, 0], u: 0, cam: { dist: 150, elev: 80, az: 0, maz: 90, fov: 38, ...WIDE }, light: L.dark, len: 1.05 },
  { id: 's1', kind: 'hub', terr: 'gpt', node: TERR.gpt.center, u: 0, cam: { dist: 40, elev: 50, az: -8, fov: 38, ...SIDE }, light: L.gptHub, len: 1.25 },
  mod('m1', 'gpt', 0, 0),
  mod('m2', 'gpt', 0, 1),
  mod('m3', 'gpt', 0, 2),
  mod('m4', 'gpt', 0, 3),
  mod('m5', 'gpt', 0, 4),
  mod('m6', 'gpt', 0, 5),
  mod('m7', 'gpt', 0, 6),
  mod('out1', 'gpt', 0, 7, { kind: 'outcome', cam: { dist: 30, elev: 48, az: -4, fov: 38, ...SIDE } }),
  { id: 'bridge', kind: 'wide', target: [0, 0, 0], node: [0, 0], u: 0.5, cam: { dist: 128, elev: 76, az: 0, maz: 90, fov: 38, ...WIDE }, light: L.reveal, len: 1.45 },
  { id: 's2', kind: 'hub', terr: 'gem', node: TERR.gem.center, u: 0.5, cam: { dist: 40, elev: 50, az: 8, fov: 38, ...SIDE }, light: L.gemHub, len: 1.25 },
  mod('g1', 'gem', 1, 0),
  mod('g2', 'gem', 1, 1),
  mod('g3', 'gem', 1, 2),
  mod('g4', 'gem', 1, 3, { len: 1.35 }),
  mod('g5', 'gem', 1, 4),
  mod('g6', 'gem', 1, 5),
  mod('g7', 'gem', 1, 6, { kind: 'outcome', len: 1.3 }),
  mod('prep', 'mix', 1, 7, { kind: 'prep', cam: { dist: 30, elev: 48, az: 4, fov: 38, ...SIDE } }),
  { id: 'finale', kind: 'finale', target: [0, 0, 0], u: 1, cam: { dist: 126, elev: 82, az: 0, maz: 90, fov: 38, ...WIDE }, light: L.all, len: 1.1 },
]

export const stopIndex = id => STOPS.findIndex(s => s.id === id)
