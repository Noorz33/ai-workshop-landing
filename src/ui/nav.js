import { STOPS, TERR, stopIndex } from '../stops.js'
import { $, clamp, fa } from '../util.js'

const titleOf = s => document.getElementById(s.id)?.querySelector('h1, h2, h3')?.textContent.trim() ?? s.id
const numOf = s => document.getElementById(s.id)?.querySelector('.p-num')?.textContent.trim() ?? ''

// ── index dialog: every station, grouped by session ──────────
export function buildIndex(go) {
  const dlg = $('#index'), cols = $('#indexCols'), btn = $('#indexBtn')
  const group = (title, ids, cls) => `
    <section class="ix-col ${cls}">
      <h3>${title}</h3>
      <ol>${ids.map(id => { const s = STOPS[stopIndex(id)]; return `<li><a href="#${id}"><span class="ix-n">${numOf(s) || '•'}</span><span>${titleOf(s)}</span></a></li>` }).join('')}</ol>
    </section>`
  cols.innerHTML =
    group('جلسه‌ی اول<i class="sep" aria-hidden="true"></i>ChatGPT', ['s1', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'out1'], 'ix-gpt') +
    group('جلسه‌ی دوم<i class="sep" aria-hidden="true"></i>Gemini', ['s2', 'g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7'], 'ix-gem') +
    group('پیش و پس از کارگاه', ['hero', 'bridge', 'prep', 'finale'], 'ix-etc')
  let lastFocus = null
  const api = {
    open: false, onOpen: null, onClose: null,
    show() {
      lastFocus = document.activeElement
      dlg.hidden = false; api.open = true
      document.body.classList.add('modal-open')
      $$siblings(dlg).forEach(el => { el.inert = true })
      api.onOpen?.()
      requestAnimationFrame(() => dlg.classList.add('in'))
      dlg.querySelector('.index-x').focus({ preventScroll: true })
    },
    close() {
      if (!api.open) return
      dlg.classList.remove('in'); api.open = false
      $$siblings(dlg).forEach(el => { el.inert = false })
      document.body.classList.remove('modal-open')
      setTimeout(() => { if (!api.open) dlg.hidden = true }, 300)
      api.onClose?.()
      lastFocus?.focus?.({ preventScroll: true })
    },
  }
  btn.addEventListener('click', () => api.show())
  dlg.addEventListener('click', e => { if (e.target.closest('[data-close]')) api.close() })
  addEventListener('keydown', e => {
    if (!api.open) return
    if (e.key === 'Escape') { e.preventDefault(); api.close() }
    if (e.key === 'Tab') {
      const f = [...dlg.querySelectorAll('a, button')]
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f.at(-1).focus() }
      else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus() }
    }
  })
  void go
  return api
}
const $$siblings = el => [...document.body.children].filter(x => x !== el && x.tagName !== 'SCRIPT')

// ── minimap: the whole map in miniature, with the camera ─────
export function buildMini(routePts, hover) {
  const nav = $('#mini')
  const VB = [-68, -34, 136, 68]
  const d = routePts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('')
  const nodes = STOPS.map((s, k) => ({ s, k })).filter(({ s }) => s.node && s.kind !== 'wide')
  nav.innerHTML = `
    <svg viewBox="${VB.join(' ')}" class="mini-svg">
      <defs>
        <radialGradient id="mgGpt"><stop offset="0" stop-color="#e9eefc" stop-opacity=".22"/><stop offset="1" stop-color="#e9eefc" stop-opacity="0"/></radialGradient>
        <linearGradient id="mgGem" x1="0" x2="1"><stop offset="0" stop-color="#4796e3"/><stop offset=".5" stop-color="#9177c7"/><stop offset="1" stop-color="#ca6673"/></linearGradient>
        <radialGradient id="mgGemR"><stop offset="0" stop-color="#9177c7" stop-opacity=".28"/><stop offset="1" stop-color="#9177c7" stop-opacity="0"/></radialGradient>
      </defs>
      <ellipse cx="${TERR.gpt.center[0]}" cy="${TERR.gpt.center[1]}" rx="30" ry="26" fill="url(#mgGpt)"/>
      <ellipse cx="${TERR.gem.center[0]}" cy="${TERR.gem.center[1]}" rx="30" ry="26" fill="url(#mgGemR)"/>
      <path class="mini-route" d="${d}"/>
      <path class="mini-route-lit" d="${d}" pathLength="1"/>
      ${nodes.map(({ s, k }) => `<a href="#${s.id}" class="mini-n mini-n--${s.terr}${s.kind === 'hub' ? ' mini-n--hub' : ''}" data-k="${k}" aria-label="${titleOf(s)}"><circle cx="${s.node[0]}" cy="${s.node[1]}" r="${s.kind === 'hub' ? 3.4 : 2.3}"/></a>`).join('')}
      <g class="mini-cam"><path d="M0 0 L-7 -13 A14 14 0 0 1 7 -13 Z"/><circle r="1.6"/></g>
    </svg>
    <div class="mini-cap"><b class="mini-label"></b><span class="mini-count"></span></div>`
  const cam = nav.querySelector('.mini-cam'), lit = nav.querySelector('.mini-route-lit')
  const label = nav.querySelector('.mini-label'), count = nav.querySelector('.mini-count')
  const dots = [...nav.querySelectorAll('.mini-n')]
  dots.forEach(a => {
    const k = +a.dataset.k
    a.addEventListener('pointerenter', () => hover(k, true))
    a.addEventListener('pointerleave', () => hover(k, false))
  })
  let lastK = -1
  return {
    update(pos, c, route) {
      cam.setAttribute('transform', `translate(${c.t[0].toFixed(2)} ${c.t[2].toFixed(2)}) rotate(${(-c.az).toFixed(1)}) scale(${clamp(c.dist / 40, 0.6, 2.4).toFixed(2)})`)
      const k = Math.round(pos)
      if (k !== lastK) {
        lastK = k
        label.textContent = titleOf(STOPS[k])
        count.textContent = `${fa(String(k).padStart(2, '0'))} / ${fa(STOPS.length - 1)}`
        dots.forEach(a => { const j = +a.dataset.k; a.classList.toggle('is-on', j === k); a.classList.toggle('is-past', j < k) })
      }
      lit.style.strokeDashoffset = String(1 - route)
    },
  }
}

// ── markers: numbered chips floating over every node ─────────
export function buildMarkers(hover) {
  const wrap = $('#markers')
  const list = STOPS.map((s, k) => ({ s, k })).filter(({ s }) => s.node && s.kind !== 'wide').map(({ s, k }) => {
    const b = document.createElement('a')
    b.href = `#${s.id}`
    b.tabIndex = -1
    b.className = `mk mk--${s.terr}${s.kind === 'hub' ? ' mk--hub' : ''}`
    const n = numOf(s)
    b.innerHTML = `<span class="mk-dot">${n || (s.kind === 'hub' ? (s.terr === 'gpt' ? '۱' : '۲') : '✓')}</span><span class="mk-t">${titleOf(s)}</span>`
    b.addEventListener('pointerenter', () => hover(k, true))
    b.addEventListener('pointerleave', () => hover(k, false))
    wrap.append(b)
    return { s, k, el: b, shown: false }
  })
  return {
    update(pos, project, light, fade = 1) {
      list.forEach(m => {
        const d = Math.abs(pos - m.k)
        const lit = m.s.terr === 'gem' ? light.gem : m.s.terr === 'gpt' ? light.gpt : Math.max(light.gpt, light.gem)
        const p = project(m.s.node[0], 0.2, m.s.node[1])
        const show = fade > 0.05 && p.vis && d > 0.45 && lit > 0.12 && p.x > -40 && p.x < innerWidth + 40 && p.y > 40 && p.y < innerHeight + 40
        if (show !== m.shown) { m.shown = show; m.el.classList.toggle('on', show) }
        if (!show) return
        m.el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0)`
        m.el.style.setProperty('--o', clamp(lit * fade * (d < 1.5 ? 1 : 0.75)).toFixed(2))
      })
    },
  }
}
