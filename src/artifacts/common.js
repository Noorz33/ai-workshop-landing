import { $, $$, fa, h } from '../util.js'

// ── session timeline donut (hub stations) ─────────────────────
export function donut(el, { items, logo, logoClass = '', name }) {
  const total = items.reduce((s, i) => s + i.min, 0)
  const teach = items.filter(i => !i.rest).reduce((s, i) => s + i.min, 0)
  const R = 78, GAP = 1.6
  let acc = 0
  const segs = items.map((it, i) => {
    const start = acc; acc += it.min
    const len = Math.max(0.5, it.min - GAP)
    const seg = `<circle class="dn-seg" cx="100" cy="100" r="${R}" pathLength="${total}" style="--c:${it.color};--len:${len};--tot:${total};--d:${i * 70}ms" stroke-dashoffset="${-start}" />`
    return it.to ? `<a href="#${it.to}" data-i="${i}" aria-label="${it.label}، ${fa(it.min)} دقیقه">${seg}</a>` : `<g data-i="${i}">${seg}</g>`
  }).join('')
  el.append(h(`
    <div class="dn glass-ui">
      <div class="dn-chart">
        <svg viewBox="0 0 200 200" aria-hidden="false">
          <circle class="dn-track" cx="100" cy="100" r="${R}" />
          <g transform="rotate(-90 100 100)">${segs}</g>
          <circle class="dn-tick" cx="100" cy="100" r="92" pathLength="360" />
        </svg>
        <div class="dn-center">
          <img class="dn-logo vlogo ${logoClass}" src="${logo}" alt="" />
          <span class="dn-name vtext">${name}</span>
          <b class="dn-v">${fa(total)}</b><span class="dn-u">دقیقه</span>
        </div>
      </div>
      <ul class="dn-stats">
        <li><b>${fa(items.filter(i => i.to).length)}</b><span>ایستگاه</span></li>
        <li><b>${fa(teach)}′</b><span>آموزش و تمرین</span></li>
        <li><b>${fa(total - teach)}′</b><span>استراحت</span></li>
      </ul>
    </div>`))
  const center = $('.dn-center', el), v = $('.dn-v', el), u = $('.dn-u', el)
  let hoverCb = null
  const show = i => {
    const it = items[i]
    center.classList.add('is-item')
    v.textContent = `${fa(it.min)}′`
    u.textContent = it.label
    el.querySelectorAll('[data-i]').forEach(s => s.classList.toggle('dim', +s.dataset.i !== i))
    if (it.to) hoverCb?.(it.to, true)
  }
  const reset = () => {
    center.classList.remove('is-item')
    v.textContent = fa(total); u.textContent = 'دقیقه'
    el.querySelectorAll('[data-i]').forEach(s => s.classList.remove('dim'))
    items.forEach(it => it.to && hoverCb?.(it.to, false))
  }
  el.querySelectorAll('[data-i]').forEach(s => {
    s.addEventListener('pointerenter', () => show(+s.dataset.i))
    s.addEventListener('focus', () => show(+s.dataset.i))
    s.addEventListener('pointerleave', reset)
    s.addEventListener('blur', reset)
  })
  // the agenda list in the panel drives the same readout
  const panelList = el.closest('[data-stop]')?.querySelectorAll('[data-agenda] [data-to]')
  panelList?.forEach(li => {
    const i = items.findIndex(it => it.to === li.dataset.to)
    li.addEventListener('pointerenter', () => show(i))
    li.addEventListener('pointerleave', reset)
  })
  return {
    enter() { el.classList.add('drawn') },
    leave() {},
    bindHover(cb) { hoverCb = cb },
  }
}

// ── outcome cards (end of session 1) ──────────────────────────
const OUT_ICONS = {
  user: '<svg viewBox="0 0 48 48"><circle cx="24" cy="17" r="8"/><path d="M9 40c1.5-8 7.5-12 15-12s13.5 4 15 12"/><circle cx="37" cy="33" r="5" class="ac"/><path d="M37 30v1.5M37 34.5V36M34 33h1.5M38.5 33H40" class="ac"/></svg>',
  folder: '<svg viewBox="0 0 48 48"><path d="M6 14a3 3 0 0 1 3-3h9l4 4h17a3 3 0 0 1 3 3v18a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3Z"/><path d="M14 26h20M14 32h12" class="ac"/></svg>',
  chart: '<svg viewBox="0 0 48 48"><path d="M8 40h32"/><rect x="11" y="24" width="6" height="12" rx="1.5"/><rect x="21" y="16" width="6" height="20" rx="1.5"/><rect x="31" y="20" width="6" height="16" rx="1.5"/><path d="M10 18l10-7 8 5 10-8" class="ac"/></svg>',
  doc: '<svg viewBox="0 0 48 48"><path d="M12 6h17l9 9v25a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"/><path d="M29 6v9h9"/><path d="M16 24h16M16 30h16M16 36h10" class="ac"/></svg>',
}
export function outcomes(el, { items }) {
  el.append(h(`
    <div class="oc">
      ${items.map((it, i) => `
        <div class="oc-card glass-ui" style="--d:${i * 140}ms">
          <span class="oc-ico">${OUT_ICONS[it.icon]}</span>
          <b>${it.title}</b><span>${it.sub}</span>
          <i class="oc-ok"><svg class="i"><use href="#i-check"/></svg></i>
        </div>`).join('')}
      <div class="oc-break"><span class="steam"><i></i><i></i><i></i></span><svg class="i"><use href="#i-cup"/></svg>استراحت ۱۰ دقیقه، بعد جلسه‌ی دوم</div>
    </div>`))
  return { enter() { el.classList.add('drawn') }, leave() {} }
}

// ── account-prep checklist (markup lives in the page) ─────────
export function checklist(el) {
  const boxes = $$('input[type=checkbox]', el)
  const ring = $('.ck-ring-v', el), count = $('.ck-count', el)
  const KEY = 'aiw-prep'
  try { (JSON.parse(localStorage.getItem(KEY)) || []).forEach((v, i) => { if (boxes[i]) boxes[i].checked = !!v }) } catch {}
  const sync = () => {
    const n = boxes.filter(b => b.checked).length
    ring.style.strokeDashoffset = String(113.1 * (1 - n / boxes.length))
    count.textContent = n === boxes.length ? 'همه‌چیز آماده است ✓' : `${fa(n)} از ${fa(boxes.length)} انجام شد`
    el.classList.toggle('all-done', n === boxes.length)
    try { localStorage.setItem(KEY, JSON.stringify(boxes.map(b => b.checked))) } catch {}
  }
  boxes.forEach(b => b.addEventListener('change', sync))
  sync()
  return {
    enter() { el.classList.add('drawn', 'hint'); setTimeout(() => el.classList.remove('hint'), 2400) },
    leave() {},
  }
}
