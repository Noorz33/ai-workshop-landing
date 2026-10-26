import Lenis from 'lenis'
import '@fontsource-variable/vazirmatn'
import '@fontsource-variable/geist'
import '@fontsource-variable/jetbrains-mono'
import './styles/main.css'
import { STOPS, stopIndex } from './stops.js'
import { CONFIG } from './config.js'
import { initArtifacts } from './artifacts/index.js'
import { buildIndex, buildMini, buildMarkers } from './ui/nav.js'
import { $, $$, clamp, lerp, smooth, fa, wait } from './util.js'

const root = document.documentElement
const N = STOPS.length
const els = STOPS.map(s => document.getElementById(s.id))
const arts = initArtifacts()
if (!CONFIG.vendorLogos) root.classList.add('nv')

const loaderBar = $('#loaderBar')
const progress = v => { loaderBar.style.transform = `scaleX(${v})` }

// ── shared navigation (both modes) ───────────────────────
let goTo = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"], [data-go]')
  if (!a) return
  const id = a.dataset.go || a.getAttribute('href').slice(1)
  if (stopIndex(id) < 0) return
  e.preventDefault()
  index.close()
  goTo(id)
})
const index = buildIndex(id => goTo(id))

// topic ↔ artifact hotspot linking
document.addEventListener('pointerover', e => {
  const li = e.target.closest('[data-hot]')
  if (!li) return
  const sec = li.closest('[data-stop]')
  $$(`[data-spot~="${li.dataset.hot}"]`, sec).forEach(x => x.classList.add('spot'))
  li.classList.add('is-hot')
  li.addEventListener('pointerout', () => {
    $$('.spot', sec).forEach(x => x.classList.remove('spot'))
    li.classList.remove('is-hot')
  }, { once: true })
})

// bridge counters
function countUp(sec) {
  $$('[data-count]', sec).forEach(b => {
    const to = +b.dataset.count, t0 = performance.now()
    const tick = t => { const k = clamp((t - t0) / 1100); b.textContent = fa(Math.round(to * (1 - (1 - k) ** 3))); if (k < 1) requestAnimationFrame(tick) }
    requestAnimationFrame(tick)
  })
}

const flatMode = () => {
  root.classList.remove('spatial'); root.classList.add('flat', 'booted', 'is-ready')
  $('#loader').hidden = true
  const io = new IntersectionObserver(es => es.forEach(e => {
    const id = e.target.id
    if (e.isIntersecting) { arts.get(id)?.enter(); if (id === 'bridge') countUp(e.target) } else arts.get(id)?.leave()
  }), { threshold: 0.35 })
  els.forEach(el => io.observe(el))
}

if (!root.classList.contains('spatial')) flatMode()
else boot().catch(err => { console.error(err); flatMode() })

// ═════════════════════ spatial mode ═════════════════════
async function boot() {
  progress(0.1)
  const fonts = Promise.race([
    Promise.allSettled([
      document.fonts.load('400 16px "Vazirmatn Variable"', 'آزمون'),
      document.fonts.load('700 16px "Vazirmatn Variable"', 'آزمون'),
      document.fonts.load('500 16px "JetBrains Mono Variable"', '=QUERY'),
      document.fonts.load('600 16px "Geist Variable"', 'Gemini'),
    ]),
    wait(2500),
  ])
  const sceneMod = import('./scene/world.js')
  await fonts
  progress(0.45)
  const { createWorld } = await sceneMod
  progress(0.7)

  const coarse = matchMedia('(pointer: coarse)').matches
  const low = coarse || innerWidth < 760
  const world = createWorld($('#world'), { low })
  const track = $('#track')

  // ── layout: scroll track, camera rests, artifact fit ──
  let W = innerWidth, H = innerHeight, mobile = false
  const centers = new Array(N).fill(0), dwell = new Array(N).fill(0)
  const cams = []
  const stopState = STOPS.map((s, k) => ({
    k, s, el: els[k], panel: els[k].querySelector('.panel, .hero-in, .wide-in, .fin-in'),
    art: els[k].querySelector('.art'), cue: els[k].querySelector('.cue'), off: false, live: false, entered: false, fit: 1, aw: 0, ah: 0,
  }))
  function layout() {
    W = innerWidth; H = innerHeight
    mobile = W < 760 || W / H < 0.8
    root.classList.toggle('m', mobile)
    const aspect = W / H
    cams.length = 0
    STOPS.forEach(s => {
      const wide = !s.node || s.kind === 'wide'
      const t = s.target ?? [s.node[0], s.kind === 'hub' ? 2 : 1.2, s.node[1]]
      const upright = mobile && s.cam.maz != null
      const mul = mobile ? (upright ? 1.55 : wide ? clamp(Math.sqrt(1.7 / aspect), 1, 1.9) : 1.2) : (aspect < 1.35 ? 1.12 : 1)
      cams.push({
        t, wide, dist: s.cam.dist * mul, elev: s.cam.elev, az: upright ? s.cam.maz : s.cam.az, fov: s.cam.fov,
        ax: mobile ? s.cam.max : s.cam.ax, ay: mobile ? s.cam.may : s.cam.ay,
      })
    })
    let c = 0
    STOPS.forEach((s, k) => {
      if (k) c += H * ((STOPS[k - 1].len ?? 1.15) + (s.len ?? 1.15)) / 2
      centers[k] = c
      dwell[k] = H * (s.len ?? 1.15) * 0.2
    })
    track.style.height = `${c + H}px`
    const panelW = mobile ? W : Math.min(460, W * 0.34) + 56
    stopState.forEach(st => {
      if (!st.art) return
      st.aw = st.art.offsetWidth; st.ah = st.art.offsetHeight
      const cam = cams[st.k]
      const gap = 34
      if (mobile) {
        const availH = cam.ay * H - gap - 74, availW = W - 24
        st.fit = Math.min(1, availW / st.aw, availH / st.ah)
      } else {
        const nx = cam.ax * W, ny = cam.ay * H
        const availH = ny - gap - 96, availW = 2 * Math.min(nx - 28, W - panelW - 28 - nx)
        st.fit = Math.min(1.12, availW / st.aw, availH / st.ah)
      }
    })
    world.resize()
  }
  layout()

  // ── scroll → journey position ──
  const ease = t => lerp(t, t * t * (3 - 2 * t), 0.75)
  function posFrom(sy) {
    if (sy <= centers[0] + dwell[0]) return 0
    for (let k = 0; k < N - 1; k++) {
      if (sy < centers[k + 1]) {
        const a = centers[k] + dwell[k], b = centers[k + 1] - dwell[k + 1]
        return k + ease(clamp((sy - a) / Math.max(1, b - a)))
      }
    }
    return N - 1
  }

  // ── camera & light at a fractional position ──
  const cam = { t: [0, 0, 0], dist: 100, elev: 60, az: 0, fov: 38, ax: 0.5, ay: 0.5 }
  const light = { amb: 0, gpt: 0, gem: 0, sweep: 0, route: 0 }
  const par = { x: 0, y: 0, tx: 0, ty: 0 }
  function rig(pos, time) {
    const i = Math.min(N - 2, Math.floor(pos)), f = pos - i
    const a = cams[i], b = cams[i + 1]
    const jump = Math.hypot(b.t[0] - a.t[0], b.t[2] - a.t[2])
    const hop = Math.min(48, jump * 0.6) * Math.sin(Math.PI * f) * (a.wide || b.wide ? 0.2 : 1)
    for (let j = 0; j < 3; j++) cam.t[j] = lerp(a.t[j], b.t[j], f)
    cam.dist = Math.exp(lerp(Math.log(a.dist), Math.log(b.dist), f)) + hop
    cam.elev = lerp(a.elev, b.elev, f) + Math.min(10, hop * 0.25) + par.y * 1.6
    cam.az = lerp(a.az, b.az, f) + par.x * 2.6 + Math.sin(time * 0.11) * 0.6
    cam.fov = lerp(a.fov, b.fov, f)
    cam.ax = lerp(a.ax, b.ax, f); cam.ay = lerp(a.ay, b.ay, f)
    const la = STOPS[i].light, lb = STOPS[i + 1].light
    for (const key in light) light[key] = lerp(la[key], lb[key], f)
    return cam
  }
  const routeAt = k => STOPS[k].u ?? 0

  // ── smooth scroll ──
  const lenis = new Lenis({ duration: 1.25, easing: t => 1 - (1 - t) ** 4, wheelMultiplier: 0.9, touchMultiplier: 1.35, autoRaf: false, anchors: false })
  window.scrollTo(0, 0)
  goTo = id => {
    const k = stopIndex(id)
    if (k < 0) return
    const d = Math.abs(k - pos)
    lenis.scrollTo(centers[k], { duration: clamp(1.1 + d * 0.32, 1.1, 4.2), easing: t => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2) })
  }
  index.onOpen = () => lenis.stop()
  index.onClose = () => lenis.start()

  // gentle snap to the nearest station once scrolling settles
  let snapT = 0, snapping = false
  lenis.on('scroll', () => {
    clearTimeout(snapT)
    if (snapping) return
    snapT = setTimeout(() => {
      const k = Math.round(pos)
      if (Math.abs(pos - k) < 0.02 || index.open) return
      const y = pos < k ? centers[k] - dwell[k] * 0.9 : centers[k] + dwell[k] * 0.9
      snapping = true
      lenis.scrollTo(y, { duration: 0.9, onComplete: () => { snapping = false } })
      setTimeout(() => { snapping = false }, 1100)
    }, 220)
  })

  // keyboard focus inside a station flies the camera there
  document.addEventListener('focusin', e => {
    const sec = e.target.closest('[data-stop]')
    if (!sec || index.open) return
    const k = stopIndex(sec.id)
    if (Math.abs(pos - k) > 0.3) lenis.scrollTo(centers[k], { duration: 1.4 })
  })
  addEventListener('keydown', e => {
    if (index.open || e.target.closest('input, textarea, button, a, label, [contenteditable]')) return
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) { e.preventDefault(); goTo(STOPS[Math.min(N - 1, Math.floor(pos + 0.02) + 1)].id) }
    if (e.key === 'ArrowUp' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) { e.preventDefault(); goTo(STOPS[Math.max(0, Math.ceil(pos - 0.02) - 1)].id) }
  })

  // pointer: camera parallax + floor flashlight
  let pointer = { x: 0, y: 0, on: false }
  if (!coarse) {
    addEventListener('pointermove', e => {
      par.tx = (e.clientX / W) * 2 - 1; par.ty = (e.clientY / H) * 2 - 1
      pointer = { x: par.tx, y: -par.ty, on: !e.target.closest('.panel, .art, .hdr, .mini, .index') }
    }, { passive: true })
    document.addEventListener('pointerleave', () => { pointer.on = false })
  }

  // ── map UI ──
  const mini = buildMini(world.routePoints(), (k, on) => world.setHover(k, on))
  const markers = buildMarkers((k, on) => world.setHover(k, on))
  $$('[data-agenda] [data-to]').forEach(li => {
    const k = stopIndex(li.dataset.to)
    li.addEventListener('pointerenter', () => world.setHover(k, true))
    li.addEventListener('pointerleave', () => world.setHover(k, false))
  })
  arts.forEach(a => a.bindHover?.((id, on) => world.setHover(stopIndex(id), on)))

  const navLinks = $$('.nav a')
  const progBar = $('#progBar')
  const navOf = p => p < 0.5 ? '' : p < 9.5 ? 's1' : p < 10.5 ? '' : p < 18.5 ? 's2' : p < 19.5 ? 'prep' : ''
  let navOn = null

  // ── per-frame DOM ──
  const pt = { x: 0, y: 0, vis: false }
  function paint(pos, c, route) {
    const restOf = k => cams[k].dist
    let wideV = 0
    stopState.forEach(st => {
      const d = pos - st.k, ad = Math.abs(d)
      if (ad > 1.02) { if (!st.off) { st.el.classList.add('off'); st.el.classList.remove('live'); st.off = true; st.live = false } return }
      if (st.off) { st.el.classList.remove('off'); st.off = false }
      const v = 1 - smooth(0.1, 0.55, ad)
      const live = v > 0.85
      if (live !== st.live) { st.live = live; st.el.classList.toggle('live', live) }
      const kind = st.s.kind
      if (kind === 'hero' || kind === 'wide' || kind === 'finale') wideV = Math.max(wideV, v)
      if (st.panel) {
        if (kind === 'hero' || kind === 'wide' || kind === 'finale') {
          const sc = 1 + clamp(d, -1, 1) * (d > 0 ? 0.22 : 0.12)
          st.panel.style.opacity = v
          st.panel.style.transform = `translate3d(0, ${-d * 30}px, 0) scale(${sc})`
          if (st.cue) st.cue.style.opacity = 1 - smooth(0.02, 0.25, ad)
        } else {
          st.panel.style.opacity = v
          st.panel.style.transform = `translate3d(0, ${clamp(-d, -1, 1) * 70 * (1 - v)}px, 0) scale(${0.97 + 0.03 * v})`
        }
      }
      if (st.art && st.s.node) {
        world.project(st.s.node[0], st.s.kind === 'hub' ? 0.6 : 0.3, st.s.node[1], pt)
        if (!pt.vis) { st.art.style.opacity = 0; return }
        const zoom = clamp((restOf(st.k) / c.dist) ** 0.85, 0.45, 1.3)
        const s = st.fit * zoom
        const gap = 34 * s
        st.art.style.setProperty('--gap', `${gap / s}px`)
        st.art.style.opacity = v
        st.art.style.transform = `translate3d(${pt.x - st.aw / 2}px, ${pt.y - gap - st.ah}px, 0) scale(${s})`
      }
      // artifact lifecycle
      const ctrl = arts.get(st.s.id)
      if (ad < 0.3 && !st.entered) { st.entered = true; ctrl?.enter(); if (st.s.id === 'bridge') countUp(st.el) }
      else if (ad > 0.85 && st.entered) { st.entered = false; ctrl?.leave() }
    })
    markers.update(pos, (x, y, z) => world.project(x, y, z, pt), light, 1 - wideV)
    mini.update(pos, c, route)
    progBar.style.transform = `scaleX(${pos / (N - 1)})`
    const nv = navOf(pos)
    if (nv !== navOn) { navOn = nv; navLinks.forEach(a => a.classList.toggle('is-on', a.dataset.nav === nv)) }
    root.classList.toggle('past-hero', pos > 0.35)
  }

  // ── loop ──
  let pos = 0, last = performance.now(), slow = 0, fast = 0, ema = 16
  const frame = now => {
    requestAnimationFrame(frame)
    const dt = Math.min(0.1, (now - last) / 1000)
    last = now
    lenis.raf(now)
    pos = posFrom(lenis.scroll)
    par.x += (par.tx - par.x) * Math.min(1, dt * 3)
    par.y += (par.ty - par.y) * Math.min(1, dt * 3)
    const c = rig(pos, now / 1000)
    world.pointer(pointer.x, pointer.y, pointer.on)
    const k = Math.round(pos)
    const route = lerp(routeAt(Math.floor(pos)), routeAt(Math.min(N - 1, Math.floor(pos) + 1)), pos - Math.floor(pos))
    world.update({
      pos, cam: c, light, route,
      activeNode: world.hasNode(k) ? k : null,
      focus: clamp(1 - Math.abs(pos - k) * 2.6),
    }, dt)
    paint(pos, c, route)
    // adaptive resolution: hold ~60fps
    ema += (dt * 1000 - ema) * 0.05
    if (ema > 20) { slow++; fast = 0 } else if (ema < 13) { fast++; slow = 0 } else { slow = fast = 0 }
    if (slow > 90 && world.dprScale > 0.6) { world.setDprScale(Math.max(0.6, world.dprScale - 0.15)); slow = 0 }
    if (fast > 400 && world.dprScale < 1) { world.setDprScale(Math.min(1, world.dprScale + 0.1)); fast = 0 }
  }

  let rt = 0
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { const k = pos; layout(); lenis.resize(); lenis.scrollTo(centers[Math.round(k)], { immediate: true }) }, 120) })

  // warm shaders on the first frame, then reveal
  world.update({ pos: 0, cam: rig(0, 0), light, route: 0, activeNode: null, focus: 0 }, 0.016)
  progress(0.9)
  await new Promise(requestAnimationFrame)
  requestAnimationFrame(frame)
  progress(1)
  await wait(250)
  root.classList.add('booted')
  $('#loader').classList.add('done')
  await wait(80)
  root.classList.add('is-ready')
  window.__map = { lenis, world, goTo, get pos() { return pos }, centers }
}
