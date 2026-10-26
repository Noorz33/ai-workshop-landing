import {
  WebGLRenderer, Scene, PerspectiveCamera, Color, Vector2, Vector3, Vector4, Quaternion,
  PlaneGeometry, CylinderGeometry, BufferGeometry, BufferAttribute, InstancedBufferGeometry,
  InstancedBufferAttribute, ShaderMaterial, Mesh, Points, Group, CatmullRomCurve3, TubeGeometry,
  CanvasTexture, AdditiveBlending, DoubleSide, MathUtils,
} from 'three'
import { STOPS, ROUTE_PTS, TERR } from '../stops.js'
import * as S from './shaders.js'

const BG = new Color('#050507')
const COPPER = new Color('#c4703a')
const HOT = new Color('#ffb985')
const GPT_COL = new Color(TERR.gpt.color[0], TERR.gpt.color[1], TERR.gpt.color[2])
const GEM_STOPS = [new Color('#4796e3'), new Color('#9177c7'), new Color('#ca6673')]
const UP = new Vector3(0, 1, 0)

const gemColorAt = x => {
  const t = MathUtils.clamp((x - 18) / 44, 0, 1)
  return t < 0.5 ? GEM_STOPS[0].clone().lerp(GEM_STOPS[1], t * 2) : GEM_STOPS[1].clone().lerp(GEM_STOPS[2], t * 2 - 1)
}
const terrColor = (terr, x) => terr === 'gem' ? gemColorAt(x) : terr === 'mix' ? new Color('#ffb985') : GPT_COL.clone()

const GPT_TOKENS = ['▁تحلیل', '▁گزارش', 'prompt', '▁داده', 'Project', '.xlsx', '▁خلاصه', '{ json }', '▁جدول', 'Tasks', '▁نمودار', '۴۰٪', '▁زمینه', 'CSV', '▁خروجی', 'Work']
const GEM_TOKENS = ['=QUERY()', 'Docs', '=VLOOKUP()', '▁تحقیق', 'Sheets', '=AI()', 'Slides', '▁منبع', 'Deep Research', '=SPARKLINE()', '▁سند', 'Gems', '▁ارائه', 'Drive', '▁تصویر', '=ARRAYFORMULA()']

function tokenAtlas() {
  const cols = 4, rows = 8, cw = 256, ch = 64
  const c = document.createElement('canvas')
  c.width = cols * cw; c.height = rows * ch
  const g = c.getContext('2d')
  const all = [...GPT_TOKENS, ...GEM_TOKENS]
  g.textAlign = 'center'; g.textBaseline = 'middle'
  all.forEach((t, i) => {
    const x = (i % cols) * cw, y = Math.floor(i / cols) * ch
    const latin = /^[\x20-\x7e]+$/.test(t)
    g.font = latin ? '500 30px "JetBrains Mono Variable", monospace' : '600 32px "Vazirmatn Variable", sans-serif'
    g.direction = latin ? 'ltr' : 'rtl'
    const w = Math.min(cw - 16, g.measureText(t).width + 28)
    g.fillStyle = 'rgba(255,255,255,.10)'
    g.beginPath(); g.roundRect(x + (cw - w) / 2, y + 10, w, ch - 20, 22); g.fill()
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2; g.stroke()
    g.fillStyle = '#fff'
    g.fillText(t, x + cw / 2, y + ch / 2 + 1, cw - 32)
  })
  const tex = new CanvasTexture(c)
  tex.anisotropy = 4
  return { tex, cols, rows }
}

export function createWorld(canvas, { low = false } = {}) {
  const renderer = new WebGLRenderer({ canvas, antialias: !low, alpha: false, powerPreference: 'high-performance' })
  renderer.setClearColor(BG, 1)
  const scene = new Scene()
  const camera = new PerspectiveCamera(38, 1, 0.5, 700)
  const time = { value: 0 }
  const fog = { value: 0.0042 }

  // ── floor ──────────────────────────────────────────────
  const lights = Array.from({ length: S.MAX_LIGHTS }, () => new Vector4())
  const lightCols = Array.from({ length: S.MAX_LIGHTS }, () => new Color())
  const floorU = {
    uTime: time, uFog: fog, uBg: { value: BG }, uAmb: { value: 0 }, uGpt: { value: 0 }, uGem: { value: 0 }, uReveal: { value: 0 },
    uCount: { value: 0 }, uL: { value: lights }, uLC: { value: lightCols }, uRip: { value: new Vector4() },
    uGptC: { value: new Vector2(...TERR.gpt.center) }, uGemC: { value: new Vector2(...TERR.gem.center) },
  }
  const floor = new Mesh(new PlaneGeometry(420, 300), new ShaderMaterial({ uniforms: floorU, vertexShader: S.floorVert, fragmentShader: S.floorFrag }))
  floor.rotation.x = -Math.PI / 2
  scene.add(floor)

  // ── nodes: pedestals + light beams ─────────────────────
  const nodes = []
  const beamGeo = new CylinderGeometry(0.32, 2.4, 17, 40, 1, true)
  beamGeo.translate(0, 8.5, 0)
  const hubBeamGeo = new CylinderGeometry(0.5, 4.6, 24, 48, 1, true)
  hubBeamGeo.translate(0, 12, 0)
  const padGeo = new PlaneGeometry(1, 1)
  padGeo.rotateX(-Math.PI / 2)
  STOPS.forEach((s, i) => {
    if (!s.node || s.kind === 'wide') return
    const [x, z] = s.node
    const hub = s.kind === 'hub'
    const color = terrColor(s.terr, x)
    const padU = { uColor: { value: color }, uA: { value: 0 }, uTime: time, uHover: { value: 0 }, uKind: { value: hub ? 1 : 0 }, uFog: fog, uI: { value: 0 } }
    const pad = new Mesh(padGeo, new ShaderMaterial({
      uniforms: padU, vertexShader: S.padVert, fragmentShader: S.padFrag,
      transparent: true, depthWrite: false, blending: AdditiveBlending,
    }))
    pad.scale.setScalar(hub ? 15 : 4.4)
    pad.position.set(x, 0.04 + i * 0.002, z)
    const beamU = { uColor: { value: color }, uI: { value: 0 }, uTime: time, uSeed: { value: Math.random() }, uFog: fog }
    const beam = new Mesh(hub ? hubBeamGeo : beamGeo, new ShaderMaterial({
      uniforms: beamU, vertexShader: S.beamVert, fragmentShader: S.beamFrag,
      transparent: true, depthWrite: false, blending: AdditiveBlending, side: DoubleSide,
    }))
    beam.position.set(x, 0, z)
    scene.add(pad, beam)
    nodes.push({ i, s, x, z, hub, color, padU, beamU, hover: 0, hoverT: 0 })
  })
  const nodeByStop = new Map(nodes.map(n => [n.i, n]))

  // ── searchlights ──────────────────────────────────────
  const searchGeo = new CylinderGeometry(0.35, 6, 1, 40, 1, true)
  const searches = [
    { apex: new Vector3(-95, 48, -70), ph: 0.0, col: new Color('#e9eefc') },
    { apex: new Vector3(95, 52, -72), ph: 1.7, col: new Color('#8f8cff') },
    { apex: new Vector3(-70, 44, 70), ph: 3.1, col: new Color('#ffcaa3') },
    { apex: new Vector3(80, 46, 68), ph: 4.4, col: new Color('#7fb2ff') },
  ].map(o => {
    const u = { uColor: { value: o.col }, uI: { value: 0 }, uTime: time, uSeed: { value: o.ph }, uFog: { value: 0.0022 } }
    const m = new Mesh(searchGeo, new ShaderMaterial({
      uniforms: u, vertexShader: S.beamVert, fragmentShader: S.beamFrag,
      transparent: true, depthWrite: false, blending: AdditiveBlending, side: DoubleSide,
    }))
    scene.add(m)
    return { ...o, mesh: m, u, target: new Vector3() }
  })

  // ── copper route: the infinity sign ───────────────────
  const curve = new CatmullRomCurve3(ROUTE_PTS.filter((_, i) => i % 4 === 0).map(([x, z]) => new Vector3(x, 0.08, z)), false, 'centripetal', 0.5)
  const routeU = {
    uProg: { value: 0 }, uTime: time, uFog: fog, uGlow: { value: 0 }, uReveal: { value: 0 }, uBoost: { value: 0 },
    uCopper: { value: COPPER }, uHot: { value: HOT },
  }
  const routeMat = new ShaderMaterial({ uniforms: routeU, vertexShader: S.routeVert, fragmentShader: S.routeFrag, transparent: true, depthWrite: false, blending: AdditiveBlending })
  scene.add(new Mesh(new TubeGeometry(curve, 1600, 0.06, 6, false), routeMat))
  // soft glow ribbon lying on the floor
  {
    const N = 1600, w = 1.4, pos = new Float32Array((N + 1) * 6), uv = new Float32Array((N + 1) * 4), idx = []
    const p = new Vector3(), t = new Vector3(), n = new Vector3()
    for (let k = 0; k <= N; k++) {
      const u = k / N
      curve.getPointAt(u, p); curve.getTangentAt(u, t)
      n.set(-t.z, 0, t.x).normalize()
      pos.set([p.x + n.x * w, 0.05, p.z + n.z * w, p.x - n.x * w, 0.05, p.z - n.z * w], k * 6)
      uv.set([u, 0, u, 1], k * 4)
      if (k < N) { const a = k * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2) }
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(pos, 3))
    g.setAttribute('uv', new BufferAttribute(uv, 2))
    g.setIndex(idx)
    const glowU = { ...routeU, uGlow: { value: 1 } }
    scene.add(new Mesh(g, new ShaderMaterial({ uniforms: glowU, vertexShader: S.routeVert, fragmentShader: S.routeFrag, transparent: true, depthWrite: false, blending: AdditiveBlending, side: DoubleSide })))
  }

  // ── dust + glints ─────────────────────────────────────
  const px = { value: 1 }
  const dustCount = low ? 900 : 2200
  {
    const pos = new Float32Array(dustCount * 3), seed = new Float32Array(dustCount)
    for (let k = 0; k < dustCount; k++) {
      pos.set([(Math.random() - 0.5) * 170, Math.random() ** 1.6 * 26 + 0.3, (Math.random() - 0.5) * 110], k * 3)
      seed[k] = Math.random()
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(pos, 3))
    g.setAttribute('aSeed', new BufferAttribute(seed, 1))
    const dustU = { uTime: time, uPx: px, uGpt: floorU.uGpt, uGem: floorU.uGem, uAmb: floorU.uAmb }
    const pts = new Points(g, new ShaderMaterial({ uniforms: dustU, vertexShader: S.dustVert, fragmentShader: S.dustFrag, transparent: true, depthWrite: false, blending: AdditiveBlending }))
    pts.frustumCulled = false
    scene.add(pts)
  }
  {
    const n = low ? 60 : 130, pos = new Float32Array(n * 3), seed = new Float32Array(n)
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 34
      pos.set([TERR.gem.center[0] + Math.cos(a) * r * 1.1, 1 + Math.random() * 12, TERR.gem.center[1] + Math.sin(a) * r * 0.8], k * 3)
      seed[k] = Math.random()
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(pos, 3))
    g.setAttribute('aSeed', new BufferAttribute(seed, 1))
    const glints = new Points(g, new ShaderMaterial({ uniforms: { uTime: time, uPx: px, uGem: floorU.uGem }, vertexShader: S.glintVert, fragmentShader: S.glintFrag, transparent: true, depthWrite: false, blending: AdditiveBlending }))
    glints.frustumCulled = false
    scene.add(glints)
  }

  // ── token stream ──────────────────────────────────────
  const atlas = tokenAtlas()
  const tokU = {
    uTime: time, uCols: { value: atlas.cols }, uRows: { value: atlas.rows }, uSet: { value: 0 },
    uOrigin: { value: new Vector3() }, uAtlas: { value: atlas.tex }, uI: { value: 0 }, uTint: { value: new Color('#ffffff') },
  }
  {
    const n = low ? 14 : 22
    const base = new PlaneGeometry(1, 1)
    const g = new InstancedBufferGeometry()
    g.index = base.index
    g.setAttribute('position', base.attributes.position)
    g.setAttribute('uv', base.attributes.uv)
    const data = new Float32Array(n * 4)
    for (let k = 0; k < n; k++) data.set([k % 16, k / n + Math.random() * 0.02, (k / n) * Math.PI * 2 * 2.618, 0.8 + Math.random() * 0.5], k * 4)
    g.setAttribute('aData', new InstancedBufferAttribute(data, 4))
    g.instanceCount = n
    const m = new Mesh(g, new ShaderMaterial({ uniforms: tokU, vertexShader: S.tokenVert, fragmentShader: S.tokenFrag, transparent: true, depthWrite: false, blending: AdditiveBlending }))
    m.frustumCulled = false
    scene.add(m)
  }

  // ── sizing ────────────────────────────────────────────
  let W = 1, H = 1, dpr = 1, dprCap = low ? 1.25 : 1.75, dprScale = 1
  const resize = () => {
    W = innerWidth; H = innerHeight
    dpr = Math.min(devicePixelRatio || 1, dprCap) * dprScale
    renderer.setPixelRatio(dpr)
    renderer.setSize(W, H, false)
    camera.aspect = W / H
    px.value = dpr * Math.min(1.4, H / 900)
  }
  resize()

  // ── per-frame ─────────────────────────────────────────
  const tgt = new Vector3(), tmp = new Vector3(), q = new Quaternion()
  const cursor = { x: 0, z: 0, on: 0, k: 0 }
  const ray = new Vector3()

  function setCamera(c) {
    const el = MathUtils.degToRad(c.elev), az = MathUtils.degToRad(c.az)
    tgt.set(c.t[0], c.t[1], c.t[2])
    camera.position.set(
      tgt.x + Math.sin(az) * Math.cos(el) * c.dist,
      tgt.y + Math.sin(el) * c.dist,
      tgt.z + Math.cos(az) * Math.cos(el) * c.dist,
    )
    camera.fov = c.fov
    camera.lookAt(tgt)
    camera.setViewOffset(W, H, (0.5 - c.ax) * W, (0.5 - c.ay) * H, W, H)
    camera.updateProjectionMatrix()
  }

  // pointer → floor point (for the cursor flashlight)
  function pointer(nx, ny, active) {
    cursor.on = active ? 1 : 0
    if (!active) return
    ray.set(nx, ny, 0.5).unproject(camera).sub(camera.position).normalize()
    if (ray.y >= -0.01) { cursor.on = 0; return }
    const t = -camera.position.y / ray.y
    cursor.x = camera.position.x + ray.x * t
    cursor.z = camera.position.z + ray.z * t
  }

  function project(x, y, z, out) {
    tmp.set(x, y, z).project(camera)
    out.x = (tmp.x * 0.5 + 0.5) * W
    out.y = (-tmp.y * 0.5 + 0.5) * H
    out.vis = tmp.z < 1 && tmp.z > -1
    return out
  }

  function update(st, dt) {
    time.value += dt
    const t = time.value
    setCamera(st.cam)
    const Lt = st.light
    floorU.uAmb.value = Lt.amb; floorU.uGpt.value = Lt.gpt; floorU.uGem.value = Lt.gem
    floorU.uReveal.value = Math.min(1, Lt.amb * 2.5 + Math.max(Lt.gpt, Lt.gem) * 0.6)

    let n = 0
    const push = (x, z, r, i, col) => { if (n >= S.MAX_LIGHTS || i < 0.003) return; lights[n].set(x, z, r, i); lightCols[n].copy(col); n++ }

    // nodes
    nodes.forEach(nd => {
      const d = Math.abs(st.pos - nd.i)
      const act = Math.max(0, 1 - d * 1.15)
      const terrLit = nd.s.terr === 'gem' ? Lt.gem : nd.s.terr === 'gpt' ? Lt.gpt : Math.max(Lt.gpt, Lt.gem, 0.5)
      nd.hover += (nd.hoverT - nd.hover) * Math.min(1, dt * 10)
      const base = terrLit * (0.3 + 0.7 * act) + nd.hover * 0.4
      nd.padU.uA.value = act
      nd.padU.uHover.value = nd.hover
      nd.padU.uI.value = Math.min(1.2, terrLit * 1.1 + nd.hover)
      nd.beamU.uI.value = base * (nd.hub ? 0.32 : 0.42)
      push(nd.x, nd.z, nd.hub ? 13 : 6.5, base * (nd.hub ? 0.42 : 0.58), nd.color)
    })

    // searchlights
    searches.forEach((s, k) => {
      const ph = t * 0.13 + s.ph
      s.target.set(Math.sin(ph * 1.3) * 62 + Math.sin(ph * 0.7 + k) * 12, 0, Math.cos(ph * 0.9 + k * 0.5) * 34)
      tmp.copy(s.apex).sub(s.target)
      const len = tmp.length()
      s.mesh.position.copy(s.target).addScaledVector(tmp, 0.5)
      q.setFromUnitVectors(UP, tmp.normalize())
      s.mesh.quaternion.copy(q)
      s.mesh.scale.set(1, len, 1)
      s.u.uI.value = Lt.sweep * 0.2
      push(s.target.x, s.target.z, 9, Lt.sweep * 0.32, s.col)
    })

    // cursor flashlight
    cursor.k += ((cursor.on ? 1 : 0) - cursor.k) * Math.min(1, dt * 4)
    push(cursor.x, cursor.z, 9, cursor.k * (0.16 + (1 - Lt.amb) * 0.12), HOT)
    floorU.uCount.value = n

    // active ripple + token stream
    const act = st.activeNode != null ? nodeByStop.get(st.activeNode) : null
    if (act) {
      floorU.uRip.value.set(act.x, act.z, st.focus, 0)
      tokU.uOrigin.value.set(act.x, 0, act.z)
      tokU.uSet.value = act.s.terr === 'gem' ? 1 : 0
      tokU.uTint.value.copy(act.s.terr === 'gem' ? act.color : GPT_COL).lerp(new Color(1, 1, 1), 0.35)
    }
    floorU.uRip.value.z = act ? st.focus : 0
    tokU.uI.value = act && !act.hub ? st.focus * 0.7 : 0

    routeU.uProg.value = st.route
    // the dashed ∞ is always faintly visible, even in the dark opening shot
    routeU.uReveal.value = Math.max(0.4, floorU.uReveal.value)
    routeU.uBoost.value = Lt.route ?? 0

    renderer.render(scene, camera)
  }

  return {
    renderer, camera, update, resize, pointer, project,
    routeAt: i => STOPS[i]?.u ?? 0,
    routePoints: (n = 240) => Array.from({ length: n + 1 }, (_, k) => { const p = curve.getPointAt(k / n); return [p.x, p.z] }),
    hasNode: i => nodeByStop.has(i),
    setHover(i, on) { const nd = nodeByStop.get(i); if (nd) nd.hoverT = on ? 1 : 0 },
    setDprScale(s) { dprScale = s; resize() },
    get dprScale() { return dprScale },
    warm() { renderer.compile(scene, camera) },
  }
}
