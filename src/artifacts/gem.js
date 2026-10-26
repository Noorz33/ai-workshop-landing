import { $, $$, fa, faNum, h, sequencer, typeInto, BASE } from '../util.js'
import { SALES } from './data.js'

const ICON = n => `${BASE}brand/gsuite-${n}.svg`
const SPARK = `${BASE}brand/gemini-sparkle.webp`
const bar = (icon, title, extra = '') => `
  <div class="win-bar"><span class="dots"><i></i><i></i><i></i></span>${icon ? `<img class="win-app vlogo" src="${icon}" alt="" />` : ''}<span class="win-title">${title}</span>${extra}</div>`
const replayBtn = `<button class="replay" type="button" aria-label="پخش دوباره"><svg class="i"><use href="#i-replay"/></svg></button>`
const gemBtn = `<span class="gem-btn"><img class="vlogo" src="${SPARK}" alt="" /><span>Gemini</span></span>`

// ── 01 · the ecosystem ────────────────────────────────────────
const APPS = [
  ['gmail', 'Gmail', 'خلاصه‌ی ایمیل‌ها و پیش‌نویس پاسخ'],
  ['docs', 'Docs', 'نوشتن، بازنویسی و خلاصه‌سازی سند'],
  ['sheets', 'Sheets', 'ساخت جدول، فرمول و تحلیل'],
  ['slides', 'Slides', 'ساخت اسلاید و تصویر'],
  ['drive', 'Drive', 'جست‌وجو و خلاصه‌ی فایل‌ها'],
]
export function g1(el) {
  el.append(h(`
    <div class="orb" data-spot="apps">
      <div class="orb-rings" aria-hidden="true"><i></i><i></i><i></i></div>
      <div class="orb-core" data-spot="core">
        <img class="vlogo" src="${SPARK}" alt="Gemini" />
        <b class="vtext">Gemini</b>
        <span class="orb-cap">روی یک اپ بایستید</span>
      </div>
      <div class="orb-spin">
        ${APPS.map(([k, n, d], i) => `<button type="button" class="orb-app" style="--a:${i * 72 - 90}deg" data-cap="${d}" aria-label="Gemini در ${n}: ${d}"><span><img class="vlogo" src="${ICON(k)}" alt="" /><em class="vtext">${n}</em></span></button>`).join('')}
      </div>
      <div class="orb-foot">
        <span class="orb-chip" data-spot="acct"><svg class="i"><use href="#i-shield"/></svg>حساب شخصی ↔ Workspace سازمانی</span>
        <span class="orb-chip orb-chip--gem" data-spot="gems"><svg class="i"><use href="#i-spark"/></svg>Gem: دستیار گزارش فروش</span>
      </div>
    </div>`))
  const cap = $('.orb-cap', el), orb = $('.orb', el)
  $$('.orb-app', el).forEach(b => {
    const on = () => { cap.textContent = b.dataset.cap; orb.classList.add('paused'); b.classList.add('on') }
    const off = () => { cap.textContent = 'روی یک اپ بایستید'; orb.classList.remove('paused'); b.classList.remove('on') }
    b.addEventListener('pointerenter', on); b.addEventListener('focus', on)
    b.addEventListener('pointerleave', off); b.addEventListener('blur', off)
  })
  return { enter() { el.classList.add('drawn') }, leave() {} }
}

// ── 02 · deep research ────────────────────────────────────────
const SOURCES = ['lme.com', 'icsg.org', 'worldbank.org', 'imf.org', 'reuters.com', 'spglobal.com', 'iea.org', 'usgs.gov', 'oecd.org', 'mining.com', 'ft.com', 'bloomberg.com']
export function g2(el) {
  el.append(h(`
    <div class="win gemwin dr">
      ${bar('', 'Deep Research', `<span class="win-badge win-badge--gem">Gemini</span>`)}
      <div class="dr-q" data-spot="q"><img class="vlogo" src="${SPARK}" alt="" /><span class="dr-qt"></span></div>
      <div class="dr-grid">
        <div class="dr-plan" data-spot="plan">
          <b>برنامه‌ی پژوهش</b>
          <ol>
            <li>روند قیمت مس در بورس فلزات لندن</li>
            <li>عوامل اصلی عرضه و تقاضا</li>
            <li>سیاست‌های تجاری و تعرفه‌ها</li>
            <li>پیامد برای قراردادهای فروش</li>
          </ol>
        </div>
        <div class="dr-src" data-spot="src">
          <div class="dr-src-h"><span class="dr-spin"></span><b class="dr-n">۰</b><span>وب‌سایت بررسی شد</span></div>
          <div class="dr-chips"></div>
        </div>
      </div>
      <div class="dr-rep" data-spot="rep">
        <div class="dr-rep-h"><b>گزارش: اثر نوسان قیمت جهانی مس بر فروش</b><span class="dr-docs"><img class="vlogo" src="${ICON('docs')}" alt="" />خروجی به Docs</span></div>
        <ul><li>۱. روند قیمت و نوسان<sup>[۱][۴]</sup></li><li>۲. عوامل عرضه و تقاضا<sup>[۲][۷]</sup></li><li>۳. پیشنهاد برای قراردادها<sup>[۳]</sup></li></ul>
      </div>
      ${replayBtn}
    </div>`))
  const qt = $('.dr-qt', el), plan = $$('.dr-plan li', el), chips = $('.dr-chips', el), n = $('.dr-n', el), win = $('.dr', el)
  const seq = sequencer()
  const play = () => seq.run(async step => {
    win.className = 'win gemwin dr'
    plan.forEach(l => l.classList.remove('on'))
    chips.innerHTML = ''; n.textContent = fa(0)
    await step(300)
    await typeInto(qt, 'اثر نوسان قیمت جهانی مس بر برنامه‌ی فروش داخلی', step, 50)
    win.classList.add('s-plan')
    for (const l of plan) { await step(260); l.classList.add('on') }
    await step(500)
    win.classList.add('s-src')
    let count = 0
    for (let i = 0; i < 26; i++) {
      count += 1 + (i % 3)
      n.textContent = fa(count)
      if (i < SOURCES.length) chips.append(h(`<span class="src"><i style="--h:${(i * 47) % 360}"></i>${SOURCES[i]}</span>`))
      await step(i < SOURCES.length ? 170 : 60)
    }
    win.classList.add('s-rep')
  })
  $('.replay', el).addEventListener('click', play)
  return { enter: play, leave: () => seq.stop() }
}

// ── 03 · docs: help me write + tone ───────────────────────────
const VARIANTS = {
  base: 'این گزارش، یافته‌های تحقیق درباره‌ی اثر نوسان قیمت جهانی مس بر برنامه‌ی فروش را خلاصه می‌کند: روند قیمت، عوامل اصلی عرضه و تقاضا و پیامدهای آن برای قراردادها. در پایان، سه اقدام پیشنهادی برای واحد فروش آمده است.',
  short: 'خلاصه‌ی اثر نوسان قیمت مس بر فروش، به‌همراه سه اقدام پیشنهادی برای واحد فروش.',
  formal: 'در این گزارش، نتایج پژوهش پیرامون تأثیر نوسانات قیمت جهانی مس بر برنامه‌ی فروش شرکت ارائه می‌گردد و سه اقدام پیشنهادی جهت بهبود مدیریت قراردادها تشریح می‌شود.',
  list: '• روند قیمت جهانی مس\n• عوامل اصلی عرضه و تقاضا\n• پیامد برای قراردادهای فروش\n• سه اقدام پیشنهادی',
}
export function g3(el) {
  el.append(h(`
    <div class="win docwin" data-spot="doc">
      ${bar(ICON('docs'), 'گزارش مدیریتی — بازار مس', '<span class="doc-share">اشتراک</span>')}
      <div class="doc-tools" aria-hidden="true"><i></i><i></i><i></i><b></b><i></i><i></i><b></b><i></i></div>
      <div class="doc-page">
        <h4>خلاصه‌ی مدیریتی</h4>
        <p class="doc-p"></p>
        <p class="doc-ghost"><i></i><i></i><i></i></p>
      </div>
      <div class="hmw" data-spot="write">
        <span class="hmw-h"><img class="vlogo" src="${SPARK}" alt="" />کمک به نوشتن</span>
        <span class="hmw-q">یک خلاصه‌ی مدیریتی کوتاه از یافته‌های تحقیق بنویس</span>
      </div>
      <div class="doc-tone" data-spot="tone" role="radiogroup" aria-label="لحن متن">
        <button type="button" role="radio" aria-checked="true" class="on" data-v="base">اصلی</button>
        <button type="button" role="radio" aria-checked="false" data-v="short">کوتاه‌تر</button>
        <button type="button" role="radio" aria-checked="false" data-v="formal">رسمی‌تر</button>
        <button type="button" role="radio" aria-checked="false" data-v="list">فهرست‌وار</button>
      </div>
    </div>`))
  const p = $('.doc-p', el), hmw = $('.hmw', el)
  const seq = sequencer()
  const write = v => seq.run(async step => {
    $$('.doc-tone button', el).forEach(b => { b.classList.toggle('on', b.dataset.v === v); b.setAttribute('aria-checked', b.dataset.v === v) })
    p.classList.add('writing')
    await typeInto(p, VARIANTS[v], step, 90)
    p.classList.remove('writing')
  })
  $$('.doc-tone button', el).forEach(b => b.addEventListener('click', () => write(b.dataset.v)))
  return {
    enter: () => seq.run(async step => {
      p.textContent = ''; hmw.classList.remove('on')
      await step(300); hmw.classList.add('on'); await step(1300)
      hmw.classList.remove('on')
      await step(200)
      write('base')
    }),
    leave: () => seq.stop(),
  }
}

// ── 04 · sheets: floating formula pills drive a live grid ─────
const COLS = ['A', 'B', 'C', 'D', 'E', 'F']
const rev = r => (r.sales * r.price) / 1e6
const FX = [
  { k: 'arr', f: '=ARRAYFORMULA(C2:C7*D2:D7/10^6)', cell: 'E2', tip: 'درآمد همه‌ی ماه‌ها با یک فرمول' },
  { k: 'vl', f: '=VLOOKUP("تیر", A2:E7, 5, FALSE)', cell: 'G2', tip: 'پیدا کردن درآمد یک ماه' },
  { k: 'q', f: '=QUERY(A1:E7, "select A, E order by E desc limit 3", 1)', cell: 'G4', tip: 'سه ماه پردرآمد' },
  { k: 'sp', f: '=SPARKLINE(B2:B7)', cell: 'F2', tip: 'نمودار درون سلول' },
  { k: 'ai', f: '=AI("روند تولید را در یک جمله خلاصه کن", B2:B7)', cell: 'G8', tip: 'خلاصه با هوش مصنوعی' },
]
export function g4(el) {
  const maxP = Math.max(...SALES.map(r => r.prod)), minP = Math.min(...SALES.map(r => r.prod))
  const spark = SALES.map((r, i) => `${(i / (SALES.length - 1)) * 100},${28 - ((r.prod - minP) / (maxP - minP)) * 24}`).join(' ')
  const top3 = [...SALES].sort((a, b) => rev(b) - rev(a)).slice(0, 3)
  const best = SALES.reduce((a, b) => (b.prod > a.prod ? b : a))
  const dips = SALES.filter((r, i) => i && r.prod < SALES[i - 1].prod).map(r => r.m)
  const aiText = `تولید با ${dips.length === 2 ? 'دو' : fa(dips.length)} افت کوتاه در ${dips.join(' و ')}، روندی صعودی داشته و در ${best.m} به ${faNum(best.prod)} تن رسیده است.`
  const maxRev = Math.max(...SALES.map(rev)), base = Math.min(...SALES.map(rev)) * 0.85
  el.append(h(`
    <div class="sh">
      <div class="win shwin">
        ${bar(ICON('sheets'), 'تحلیل فروش ۱۴۰۵<i class="sep" aria-hidden="true"></i>نمونه', gemBtn)}
        <div class="fxbar" data-spot="fx"><span class="fx-cell">E2</span><span class="fx-ic">fx</span><code class="fx-t" dir="ltr"></code></div>
        <div class="grid-wrap" data-spot="grid">
          <table class="grid">
            <thead><tr><th class="rh"></th>${COLS.map(c => `<th>${c}</th>`).join('')}</tr></thead>
            <tbody>
              <tr class="hd"><th class="rh">1</th><td>ماه</td><td>تولید (تن)</td><td>فروش (تن)</td><td>نرخ ($/تن)</td><td>درآمد (M$)</td><td>روند</td></tr>
              ${SALES.map((r, i) => `<tr data-r="${i}"><th class="rh">${i + 2}</th><td>${r.m}</td><td>${faNum(r.prod)}</td><td>${faNum(r.sales)}</td><td>${faNum(r.price)}</td><td class="e" data-v="${faNum(rev(r), 2)}"></td><td class="f">${i === 0 ? `<svg class="spk" viewBox="0 -2 100 32" preserveAspectRatio="none"><polyline points="${spark}"/></svg>` : ''}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
        <div class="sh-out" data-spot="viz ai">
          <div class="sh-res sh-res--vl"><em>نتیجه</em><b>${faNum(rev(SALES[3]), 2)}</b><span>میلیون دلار درآمد تیر</span></div>
          <div class="sh-res sh-res--q"><em>نتیجه‌ی QUERY</em><table>${top3.map(r => `<tr><td>${r.m}</td><td>${faNum(rev(r), 2)}</td></tr>`).join('')}</table></div>
          <div class="sh-res sh-res--ai"><em><img class="vlogo" src="${SPARK}" alt="" />=AI()</em><p></p></div>
          <div class="sh-chart" aria-hidden="true">${SALES.map(r => `<span style="--h:${((rev(r) - base) / (maxRev - base)) * 100}%"><i></i><em>${r.m.slice(0, 3)}</em></span>`).join('')}</div>
        </div>
      </div>
      <div class="pills" data-spot="fx">
        ${FX.map((x, i) => `<button type="button" class="pill" data-k="${x.k}" style="--i:${i}"><code dir="ltr">${x.f.replace(/^=(\w+)\(.*$/, '=$1()')}</code><span>${x.tip}</span></button>`).join('')}
      </div>
    </div>`))
  const root = $('.sh', el), fx = $('.fx-t', el), cell = $('.fx-cell', el), eCells = $$('td.e', el), rowsEl = $$('tr[data-r]', el)
  const aiP = $('.sh-res--ai p', el)
  let filled = false
  const seq = sequencer()
  const fillE = async step => {
    if (filled) return
    for (const c of eCells) { c.textContent = c.dataset.v; c.classList.add('flash'); await step(110) }
    filled = true
    root.classList.add('has-rev')
  }
  const run = k => seq.run(async step => {
    const x = FX.find(f => f.k === k)
    $$('.pill', el).forEach(p => p.classList.toggle('on', p.dataset.k === k))
    root.dataset.mode = k
    rowsEl.forEach(r => r.classList.remove('hit'))
    cell.textContent = x.cell
    await typeInto(fx, x.f, step, 140)
    if (k === 'arr') { eCells.forEach(c => { c.textContent = ''; c.classList.remove('flash') }); filled = false; root.classList.remove('has-rev'); await fillE(step) }
    if (k === 'vl') { await fillE(step); rowsEl[3].classList.add('hit') }
    if (k === 'q') { await fillE(step); top3.forEach(t => rowsEl[SALES.indexOf(t)].classList.add('hit')) }
    if (k === 'ai') { aiP.textContent = ''; await step(500); await typeInto(aiP, aiText, step, 60) }
  })
  $$('.pill', el).forEach(p => p.addEventListener('click', () => run(p.dataset.k)))
  return {
    enter: () => seq.run(async step => {
      await step(500)
      run('arr')
      await step(3400)
      run('q')
    }),
    leave: () => seq.stop(),
  }
}

// ── 05 · slides from doc + sheet ──────────────────────────────
export function g5(el) {
  const maxRev = Math.max(...SALES.map(rev))
  const slides = [
    `<div class="sl sl--title" data-spot="story"><em>واحد فروش<i class="sep" aria-hidden="true"></i>نمونه</em><b>فروش نیم‌سال اول ۱۴۰۵</b><span>گزارش مدیریتی</span></div>`,
    `<div class="sl sl--chart" data-spot="vis"><b>درآمد ماهانه (میلیون دلار)</b><div class="sl-bars">${SALES.map(r => `<span style="--h:${(rev(r) / maxRev) * 100}%"><i>${faNum(rev(r), 1)}</i><em>${r.m}</em></span>`).join('')}</div></div>`,
    `<div class="sl sl--list" data-spot="story"><b>سه یافته‌ی کلیدی</b><ul><li>رشد مستمر فروش در هر شش ماه</li><li>بیشترین مغایرت سفارش در خرداد</li><li>نوسان قیمت، ریسک اصلی قراردادها</li></ul></div>`,
    `<div class="sl sl--img" data-spot="vis"><canvas width="320" height="180"></canvas><b>گام بعد: بازبینی قراردادهای سه‌ماهه</b></div>`,
  ]
  el.append(h(`
    <div class="win slwin">
      ${bar(ICON('slides'), 'ارائه‌ی فروش نیم‌سال', gemBtn)}
      <div class="sl-prompt" data-spot="gen"><img class="vlogo" src="${SPARK}" alt="" /><span>از سند گزارش و شیت فروش، یک ارائه‌ی ۴ اسلایدی بساز</span></div>
      <div class="sl-body">
        <div class="sl-strip" role="tablist" aria-label="اسلایدها">${slides.map((_, i) => `<button type="button" role="tab" class="sl-th" data-i="${i}" aria-label="اسلاید ${fa(i + 1)}"><span>${fa(i + 1)}</span><div class="sl-mini">${slides[i]}</div></button>`).join('')}</div>
        <div class="sl-main">${slides.map((s, i) => `<div class="sl-frame" data-i="${i}">${s}</div>`).join('')}</div>
      </div>
    </div>`))
  // the closing slide reuses the image demo's render
  import('./copper-image.js').then(m => $$('canvas', el).forEach(c => m.drawCopper(c.getContext('2d'), c.width, c.height, {})))
  const ths = $$('.sl-th', el), frames = $$('.sl-frame', el), win = $('.slwin', el)
  let cur = 0, timer = 0
  const show = i => {
    cur = i
    ths.forEach((t, j) => { t.classList.toggle('on', i === j); t.setAttribute('aria-selected', i === j) })
    frames.forEach((f, j) => f.classList.toggle('on', i === j))
  }
  ths.forEach(t => t.addEventListener('click', () => { clearInterval(timer); show(+t.dataset.i) }))
  const seq = sequencer()
  return {
    enter: () => seq.run(async step => {
      win.classList.remove('gen'); ths.forEach(t => t.classList.remove('in')); show(0)
      await step(300); win.classList.add('gen')
      for (const t of ths) { await step(380); t.classList.add('in') }
      clearInterval(timer)
      timer = setInterval(() => show((cur + 1) % slides.length), 2200)
    }),
    leave: () => { seq.stop(); clearInterval(timer) },
  }
}

// ── 06 · image generation + edits ─────────────────────────────
export function g6(el) {
  el.append(h(`
    <div class="win gemwin ig">
      ${bar('', 'تولید تصویر', `<span class="win-badge win-badge--gem">Gemini</span>`)}
      <div class="ig-prompt" data-spot="prompt"><img class="vlogo" src="${SPARK}" alt="" /><span>تصویر واقع‌گرایانه از ورق‌های کاتد مس در سالن تولید، نور گرم، نمای نزدیک</span></div>
      <div class="ig-stage" data-spot="edit use"><canvas width="960" height="540"></canvas><span class="ig-scan"></span><em class="ig-state">در حال ساخت…</em></div>
      <div class="ig-edits" data-spot="edit">
        <button type="button" data-e="cool">نور سردتر</button>
        <button type="button" data-e="wide">نمای بازتر</button>
        <button type="button" data-e="dark">پس‌زمینه‌ی تیره‌تر</button>
        <span class="ig-use" data-spot="use"><img class="vlogo" src="${ICON('slides')}" alt="" />افزودن به اسلاید</span>
      </div>
    </div>`))
  const cv = $('canvas', el), ctx = cv.getContext('2d'), stage = $('.ig-stage', el), state = $('.ig-state', el)
  const off = document.createElement('canvas'); off.width = cv.width; off.height = cv.height
  const params = { cool: false, wide: false, dark: false }
  const seq = sequencer()
  let draw = null
  const gen = (label) => seq.run(async step => {
    draw ??= (await import('./copper-image.js')).drawCopper
    draw(off.getContext('2d'), off.width, off.height, params)
    stage.classList.add('busy'); state.textContent = label
    const tiny = document.createElement('canvas')
    for (const w of [12, 24, 48, 120, 960]) {
      tiny.width = w; tiny.height = Math.round(w * 9 / 16)
      tiny.getContext('2d').drawImage(off, 0, 0, tiny.width, tiny.height)
      ctx.imageSmoothingEnabled = w > 100
      ctx.filter = w < 960 ? `blur(${Math.max(0, 14 - w / 10)}px)` : 'none'
      ctx.drawImage(tiny, 0, 0, cv.width, cv.height)
      ctx.filter = 'none'
      await step(w < 960 ? 330 : 0)
    }
    stage.classList.remove('busy'); state.textContent = 'نسخه‌ی ' + fa(++version)
  })
  let version = 0
  $$('[data-e]', el).forEach(b => b.addEventListener('click', () => {
    params[b.dataset.e] = !params[b.dataset.e]
    b.classList.toggle('on', params[b.dataset.e])
    gen('در حال اصلاح…')
  }))
  return { enter: () => { if (!version) gen('در حال ساخت…') }, leave: () => {} }
}

// ── 07 · the continuous exercise as one pipeline ──────────────
const PIPE = [
  ['spark', 'Deep Research', 'گزارش تحقیق'],
  ['sheets', 'Sheets', 'شیت تحلیلی'],
  ['docs', 'Docs', 'سند مدیریتی'],
  ['slides', 'Slides', 'ارائه'],
  ['spark', 'تصویر', 'تصویر تولیدشده'],
]
export function g7(el) {
  const pts = [[440, 70], [330, 170], [220, 70], [110, 170], [40, 290]]
  const d = 'M' + pts.map(p => p.join(' ')).join(' L')
  el.append(h(`
    <div class="pipe">
      <svg class="pipe-svg" viewBox="0 0 520 360" aria-hidden="true">
        <defs><linearGradient id="pipeG" x1="1" x2="0"><stop offset="0" stop-color="#ffb985"/><stop offset="1" stop-color="#c4703a"/></linearGradient></defs>
        <path class="pipe-base" d="${d}"/>
        <path class="pipe-lit" d="${d}" pathLength="1"/>
        <circle class="pipe-dot" r="5"><animateMotion dur="5s" repeatCount="indefinite" path="${d}"/></circle>
      </svg>
      ${PIPE.map(([ic, t, o], i) => `
        <div class="pipe-n" style="--x:${pts[i][0]}px;--y:${pts[i][1]}px;--d:${i * 260}ms">
          <span class="pipe-ic">${ic === 'spark' ? `<img class="vlogo" src="${SPARK}" alt="" />` : `<img class="vlogo" src="${ICON(ic)}" alt="" />`}</span>
          <b>${t}</b><em>${o}</em>
        </div>`).join('')}
      <p class="pipe-cap">یک مسئله‌ی صنعت مس،<br /><b>پنج خروجی قابل ارائه</b></p>
    </div>`))
  return { enter() { el.classList.add('drawn') }, leave() {} }
}
