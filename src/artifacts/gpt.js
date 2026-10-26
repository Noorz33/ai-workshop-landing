import { $, $$, fa, faNum, h, sequencer, typeInto, BASE } from '../util.js'
import { SALES } from './data.js'

const bar = (title, extra = '') => `
  <div class="win-bar"><span class="dots"><i></i><i></i><i></i></span><span class="win-title">${title}</span>${extra}</div>`
const replayBtn = `<button class="replay" type="button" aria-label="پخش دوباره"><svg class="i"><use href="#i-replay"/></svg></button>`
const blossom = `<img class="gw-logo vlogo blossom" src="${BASE}brand/openai-blossom-white.svg" alt="" />`

// stream text word-by-word into el
async function stream(el, text, step, ms = 55) {
  el.textContent = ''
  for (const w of text.split(/(\s+)/)) { el.textContent += w; if (w.trim()) await step(ms) }
}

// ── 01 · desktop app, quick launcher, files ───────────────────
export function m1(el) {
  el.append(h(`
    <div class="win gptwin" data-spot="desk ui">
      ${bar('ChatGPT', `<div class="seg" data-spot="mode" role="tablist" aria-label="حالت کار"><button type="button" role="tab" aria-selected="true" class="on" data-mode="chat">Chat</button><button type="button" role="tab" aria-selected="false" data-mode="work">Work</button></div>`)}
      <div class="gw-body">
        <aside class="gw-side" data-spot="ui">
          <span class="gw-s-new"><svg class="i"><use href="#i-plus"/></svg>گفت‌وگوی جدید</span>
          <span><svg class="i"><use href="#i-search"/></svg>جست‌وجو</span>
          <span><svg class="i"><use href="#i-folder"/></svg>پروژه‌ها</span>
          <em>اخیر</em>
          <span class="gw-s-chat">گزارش فروش شهریور</span>
          <span class="gw-s-chat">ایمیل به تأمین‌کننده</span>
          <span class="gw-s-chat">خلاصه‌ی جلسه‌ی تولید</span>
        </aside>
        <div class="gw-main">
          <div class="gw-thread">
            <div class="gw-hello">${blossom}<b>امروز روی چه کاری کار می‌کنیم؟</b></div>
          </div>
          <div class="gw-composer" data-spot="files">
            <div class="gw-att"></div>
            <div class="gw-row">
              <button type="button" class="gw-ic" aria-label="پیوست"><svg class="i"><use href="#i-clip"/></svg></button>
              <span class="gw-ph">هر چیزی بپرس</span>
              <span class="gw-send"><svg class="i"><use href="#i-send"/></svg></span>
            </div>
          </div>
        </div>
      </div>
      <div class="launcher" data-spot="launch"><span class="kbd-row"><kbd>⌥</kbd><kbd>Space</kbd></span><span class="launch-in">${blossom}از ChatGPT بپرس…</span></div>
      <div class="plans" data-spot="plans">
        <span tabindex="0" data-tip="امکانات پایه، با محدودیت استفاده">رایگان</span>
        <span tabindex="0" data-tip="سقف استفاده‌ی بالاتر و قابلیت‌های پیشرفته">اشتراک فردی</span>
        <span tabindex="0" data-tip="مدیریت متمرکز و حفاظت از داده‌های سازمان">اشتراک سازمانی</span>
      </div>
      ${replayBtn}
    </div>`))
  const win = $('.gptwin', el), thread = $('.gw-thread', el), att = $('.gw-att', el), ph = $('.gw-ph', el)
  const launcher = $('.launcher', el)
  $$('.seg button', el).forEach(b => b.addEventListener('click', () => {
    $$('.seg button', el).forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', x === b) })
    const work = b.dataset.mode === 'work'
    win.classList.toggle('is-work', work)
    ph.textContent = work ? 'یک کار چندمرحله‌ای تعریف کن…' : 'هر چیزی بپرس'
  }))
  const seq = sequencer()
  const play = () => seq.run(async step => {
    thread.querySelectorAll('.msg').forEach(m => m.remove())
    $('.gw-hello', el).hidden = false
    att.innerHTML = ''; ph.hidden = false
    win.classList.remove('done')
    launcher.classList.remove('on', 'press')
    await step(500)
    launcher.classList.add('on'); await step(450)
    launcher.classList.add('press'); await step(900)
    launcher.classList.remove('on', 'press'); await step(350)
    att.append(h(`<span class="chip-file chip-shot"><i class="shot"><b></b><b></b><b></b></i><span>اسکرین‌شات</span></span>`)); await step(420)
    att.append(h(`<span class="chip-file"><i class="ext ext--xls">XLS</i><span>فروش_شهریور.xlsx</span></span>`)); await step(500)
    ph.hidden = true
    const q = h(`<div class="msg msg--u"><p></p></div>`)
    $('.gw-hello', el).hidden = true
    thread.append(q)
    await typeInto($('p', q), 'این اسکرین‌شات و فایل فروش رو بررسی کن و یک تحلیل اولیه بده.', step, 60)
    att.innerHTML = ''; ph.hidden = false
    await step(300)
    const a = h(`<div class="msg msg--a"><span class="think"><i></i><i></i><i></i></span><b class="a-h"></b><ul><li></li><li></li><li></li></ul></div>`)
    thread.append(a); await step(1000)
    $('.think', a).remove()
    await stream($('.a-h', a), 'تحلیل اولیه:', step)
    const lis = $$('li', a)
    await stream(lis[0], 'فروش شهریور ۲٪ بیشتر از مرداد است.', step)
    await stream(lis[1], 'دو ردیف تکراری در فایل پیدا شد.', step)
    await stream(lis[2], 'پیشنهاد: ستون تاریخ یکدست شود.', step)
    win.classList.add('done')
  })
  $('.replay', el).addEventListener('click', play)
  return { enter: play, leave: () => seq.stop() }
}

// ── 02 · custom instructions, memory, role ────────────────────
const ROLE_PREVIEW = {
  exec: 'خلاصه: فروش شهریور ۲٪ بالاتر از مرداد است. ریسک اصلی: نوسان قیمت جهانی. اقدام: بازبینی قراردادهای سه‌ماهه.',
  fin: 'درآمد شهریور ۱۴٫۰ میلیون دلار؛ ۴٪ بیشتر از مرداد. نرخ میانگین فروش: ۹٬۸۶۰ دلار در هر تن.',
  ops: 'تولید کاتد در شهریور ۱٬۴۴۸ تن بود؛ بالاترین رقم شش ماه اخیر. فاصله‌ی تولید و فروش: ۲۸ تن.',
}
export function m2(el) {
  el.append(h(`
    <div class="win gptwin pz">
      ${bar('تنظیمات<i class="sep" aria-hidden="true"></i>شخصی‌سازی')}
      <div class="pz-body">
        <label class="pz-l">دستورالعمل‌های شخصی</label>
        <div class="pz-ta" data-spot="ci"><span class="pz-typed"></span><i class="caret"></i></div>
        <div class="pz-tg" data-spot="mem">
          <label class="sw"><input type="checkbox" checked /><i></i><span>حافظه<small>ChatGPT ترجیحات شما را به خاطر می‌سپارد</small></span></label>
          <label class="sw"><input type="checkbox" /><i></i><span>بهبود مدل با گفت‌وگوهای من<small>در حساب سازمانی به‌صورت پیش‌فرض خاموش است</small></span></label>
        </div>
        <label class="pz-l">نقش شغلی</label>
        <div class="pz-roles" data-spot="role" role="radiogroup" aria-label="نقش شغلی">
          <button type="button" role="radio" aria-checked="true" class="on" data-r="exec">مدیر ارشد</button>
          <button type="button" role="radio" aria-checked="false" data-r="fin">کارشناس مالی</button>
          <button type="button" role="radio" aria-checked="false" data-r="ops">برنامه‌ریزی تولید</button>
        </div>
        <div class="pz-prev" data-spot="role">
          <span class="pz-q">«وضعیت فروش این ماه چطور است؟»</span>
          <p class="pz-a">${ROLE_PREVIEW.exec}</p>
          <em class="sample">نمونه</em>
        </div>
      </div>
    </div>`))
  const prev = $('.pz-a', el)
  $$('.pz-roles button', el).forEach(b => b.addEventListener('click', () => {
    $$('.pz-roles button', el).forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b) })
    prev.classList.remove('swap'); void prev.offsetWidth; prev.classList.add('swap')
    prev.textContent = ROLE_PREVIEW[b.dataset.r]
  }))
  const seq = sequencer()
  return {
    enter: () => seq.run(async step => {
      await step(400)
      await typeInto($('.pz-typed', el), 'من کارشناس برنامه‌ریزی فروش در دنیای مس هستم. پاسخ‌ها کوتاه، به فارسی و در صورت امکان با جدول باشد.', step, 46)
    }),
    leave: () => seq.stop(),
  }
}

// ── 03 · projects ─────────────────────────────────────────────
export function m3(el) {
  el.append(h(`
    <div class="pj">
      <svg class="pj-wires" viewBox="0 0 520 380" preserveAspectRatio="none" aria-hidden="true">
        <path d="M150 112 C 200 112, 210 70, 262 70"/><path d="M150 186 C 200 186, 210 120, 262 110"/>
        <path d="M262 150 C 300 210, 320 220, 360 236"/><path d="M262 150 C 300 270, 320 280, 360 288"/><path d="M262 150 C 300 330, 320 340, 360 340"/>
      </svg>
      <div class="pj-card glass-ui" data-spot="goal">
        <span class="pj-ico"><svg class="i"><use href="#i-folder"/></svg></span>
        <b>گزارش‌های ماهانه‌ی فروش</b>
        <span class="pj-goal">هدف: تهیه‌ی گزارش ماهانه با قالب ثابت واحد فروش</span>
        <span class="pj-ins" data-spot="refs">دستورالعمل: «همیشه با جدول خلاصه شروع کن؛ واحدها تن و دلار.»</span>
      </div>
      <div class="pj-files" data-spot="refs">
        <span class="chip-file"><i class="ext ext--doc">DOC</i><span>قالب_گزارش.docx</span></span>
        <span class="chip-file"><i class="ext ext--xls">XLS</i><span>نرخ‌ها_۱۴۰۵.xlsx</span></span>
        <span class="chip-file"><i class="ext ext--pdf">PDF</i><span>آیین‌نامه‌ی فروش.pdf</span></span>
        <button type="button" class="pj-add"><svg class="i"><use href="#i-plus"/></svg>افزودن فایل</button>
      </div>
      <div class="pj-chats" data-spot="chats">
        <span class="pj-chat"><svg class="i"><use href="#i-chat"/></svg>گزارش فروردین</span>
        <span class="pj-chat"><svg class="i"><use href="#i-chat"/></svg>گزارش اردیبهشت</span>
        <span class="pj-chat pj-chat--new" data-spot="reuse"><svg class="i"><use href="#i-chat"/></svg>گزارش تیر<em>از دانسته‌های پروژه استفاده شد</em></span>
      </div>
    </div>`))
  const add = $('.pj-add', el)
  const extra = ['بودجه_۱۴۰۵.xlsx', 'قرارداد_نمونه.pdf']
  add.addEventListener('click', () => {
    const name = extra.shift()
    if (!name) return
    add.before(h(`<span class="chip-file is-new"><i class="ext ext--${name.endsWith('pdf') ? 'pdf' : 'xls'}">${name.endsWith('pdf') ? 'PDF' : 'XLS'}</i><span>${name}</span></span>`))
    if (!extra.length) add.disabled = true
  })
  return { enter() { el.classList.add('drawn') }, leave() {} }
}

// ── 04 · prompt builder + token stream ────────────────────────
const SLOTS = [
  ['مسئله', 'علت افت فروش تیر را پیدا کن'],
  ['زمینه', 'فروش ۶ ماه و گزارش انبار پیوست است'],
  ['خروجی', 'جدول ۳ علت اصلی + یک پیشنهاد'],
]
const ANSWERS = [
  'بر اساس داده‌ها سه علت اصلی دیده می‌شود: تأخیر در ارسال، کمبود موجودی دو محصول پرفروش و کاهش سفارش یک مشتری بزرگ. پیشنهاد: برنامه‌ی ارسال هفتگی بازبینی شود.',
  'تأخیر ارسال (۴۰٪)، کمبود موجودی (۳۵٪)، کاهش سفارش (۲۵٪). اقدام: ارسال هفتگی.',
]
const tokenize = text => text.split(/(\s+)/).filter(Boolean).flatMap(w => /\s/.test(w) ? [] : w.length > 5 ? [w.slice(0, Math.ceil(w.length / 2)), w.slice(Math.ceil(w.length / 2))] : [w])
export function m4(el) {
  el.append(h(`
    <div class="win gptwin pb">
      ${bar('درخواست مؤثر')}
      <div class="pb-body">
        <div class="pb-slots" data-spot="slots">
          ${SLOTS.map(([k]) => `<div class="pb-slot"><em>${k}</em><span></span></div>`).join('')}
        </div>
        <div class="pb-out">
          <div class="pb-meta"><span class="pb-turn">پاسخ</span><span class="pb-count" dir="rtl"></span></div>
          <div class="pb-tokens" aria-live="off"></div>
        </div>
        <div class="pb-foot">
          <button type="button" class="pb-refine" data-spot="refine">«کوتاه‌تر و فقط با درصد»</button>
          <ul class="pb-verify" data-spot="verify">
            <li>منبع اعداد مشخص است</li><li>با فایل اصلی تطبیق دارد</li><li>نتیجه‌گیری منطقی است</li>
          </ul>
        </div>
      </div>
      ${replayBtn}
    </div>`))
  const slots = $$('.pb-slot span', el), tokens = $('.pb-tokens', el), count = $('.pb-count', el), turn = $('.pb-turn', el)
  const refine = $('.pb-refine', el), verify = $('.pb-verify', el)
  const seq = sequencer()
  const streamTokens = async (text, step) => {
    tokens.innerHTML = ''
    const parts = tokenize(text)
    for (let i = 0; i < parts.length; i++) {
      tokens.append(h(`<span class="tk tk--${i % 5}">${parts[i]}</span>`))
      count.textContent = `${fa(i + 1)} توکن`
      await step(42)
    }
  }
  const play = () => seq.run(async step => {
    slots.forEach(s => { s.textContent = ''; s.parentElement.classList.remove('full') })
    tokens.innerHTML = ''; count.textContent = ''; turn.textContent = 'پاسخ'
    refine.disabled = true; refine.classList.remove('used'); verify.classList.remove('on')
    await step(400)
    for (let i = 0; i < 3; i++) {
      slots[i].parentElement.classList.add('full')
      await typeInto(slots[i], SLOTS[i][1], step, 70)
      await step(200)
    }
    await streamTokens(ANSWERS[0], step)
    refine.disabled = false
    await step(900)
    verify.classList.add('on')
  })
  refine.addEventListener('click', () => seq.run(async step => {
    refine.disabled = true; refine.classList.add('used')
    turn.innerHTML = 'پاسخ اصلاح‌شده<i class="sep" aria-hidden="true"></i>مرحله‌ی ۲'
    await streamTokens(ANSWERS[1], step)
  }))
  $('.replay', el).addEventListener('click', play)
  return { enter: play, leave: () => seq.stop() }
}

// ── 05 · data analysis: table → chart → findings ──────────────
export function m5(el) {
  const rows = SALES.map(r => ({ ...r, gap: r.orders - r.sales }))
  const flagged = rows.filter(r => r.gap > 15)
  const fill = rows.reduce((s, r) => s + r.sales, 0) / rows.reduce((s, r) => s + r.orders, 0)
  const worst = rows.reduce((a, b) => (b.gap > a.gap ? b : a))
  const max = Math.max(...rows.map(r => r.orders))
  el.append(h(`
    <div class="win gptwin da">
      ${bar('تحلیل فایل', '<span class="win-badge">تحلیل داده</span>')}
      <div class="da-files" data-spot="up">
        <span class="chip-file"><i class="ext ext--xls">XLS</i><span>فروش_۱۴۰۵.xlsx</span></span>
        <span class="chip-file"><i class="ext ext--csv">CSV</i><span>سفارش‌ها.csv</span></span>
        <span class="chip-file"><i class="ext ext--pdf">PDF</i><span>گزارش_انبار.pdf</span></span>
      </div>
      <div class="tabs" role="tablist">
        <button type="button" role="tab" data-t="0" class="on" aria-selected="true">جدول</button>
        <button type="button" role="tab" data-t="1" aria-selected="false">نمودار</button>
        <button type="button" role="tab" data-t="2" aria-selected="false">یافته‌ها</button>
      </div>
      <div class="da-views">
        <div class="da-v da-table on" data-spot="diff chart">
          <table>
            <thead><tr><th>ماه</th><th>سفارش (تن)</th><th>ارسال (تن)</th><th>مغایرت</th></tr></thead>
            <tbody>${rows.map(r => `<tr class="${r.gap > 15 ? 'flag' : ''}"><td>${r.m}</td><td>${faNum(r.orders)}</td><td>${faNum(r.sales)}</td><td>${fa(r.gap)}</td></tr>`).join('')}</tbody>
          </table>
        </div>
        <div class="da-v da-chart" data-spot="chart">
          <div class="bars">${rows.map(r => `<div class="bar-g"><i class="b1" style="--h:${(r.orders / max) * 100}%"></i><i class="b2" style="--h:${(r.sales / max) * 100}%"></i><span>${r.m}</span></div>`).join('')}</div>
          <div class="legend"><span><i class="b1"></i>سفارش</span><span><i class="b2"></i>ارسال</span></div>
        </div>
        <div class="da-v da-ins" data-spot="insight">
          <div class="kpi"><b>${fa((fill * 100).toFixed(1))}٪</b><span>نرخ تحقق سفارش</span></div>
          <div class="kpi kpi--warn"><b>${fa(flagged.length)}</b><span>ماه با مغایرت بیش از ۱۵ تن</span></div>
          <p class="ins"><svg class="i"><use href="#i-spark"/></svg>بیشترین مغایرت در <b>${worst.m}</b> (${fa(worst.gap)} تن) است؛ ریشه‌یابی ارسال‌های این ماه پیشنهاد می‌شود.</p>
        </div>
      </div>
    </div>`))
  const tabs = $$('.tabs button', el), views = $$('.da-v', el)
  const show = i => {
    tabs.forEach((t, j) => { t.classList.toggle('on', i === j); t.setAttribute('aria-selected', i === j) })
    views.forEach((v, j) => v.classList.toggle('on', i === j))
  }
  const seq = sequencer()
  tabs.forEach((t, i) => t.addEventListener('click', () => { seq.stop(); show(i) }))
  return {
    enter: () => seq.run(async step => { show(0); await step(2400); show(1); await step(2600); show(2) }),
    leave: () => seq.stop(),
  }
}

// ── 06 · multi-step work run ──────────────────────────────────
const STEPS = [
  ['خواندن فایل‌ها و تحلیل مرحله‌ی قبل', ''],
  ['ساخت شیت خلاصه', 'deck'],
  ['نوشتن گزارش مدیریتی', 'report'],
  ['ساخت ارائه‌ی ۴ اسلایدی', 'deck'],
  ['بازبینی نهایی و تحویل', ''],
]
export function m6(el) {
  el.append(h(`
    <div class="win gptwin wk" data-spot="work">
      ${bar('ChatGPT', '<span class="win-badge win-badge--work">Work</span>')}
      <div class="wk-task"><svg class="i"><use href="#i-spark"/></svg>از تحلیل فروش، یک گزارش مدیریتی، شیت خلاصه و ارائه‌ی کوتاه بساز.</div>
      <ol class="wk-steps">${STEPS.map(([t, s]) => `<li data-spot="${s}"><i class="st"></i><span>${t}</span><time></time></li>`).join('')}</ol>
      <div class="wk-out">
        <span class="out-file" data-spot="report"><i class="ext ext--doc">DOC</i>گزارش_مدیریتی.docx</span>
        <span class="out-file" data-spot="deck"><i class="ext ext--xls">XLS</i>خلاصه_فروش.xlsx</span>
        <span class="out-file" data-spot="deck"><i class="ext ext--ppt">PPT</i>ارائه_فروش.pptx</span>
      </div>
      ${replayBtn}
    </div>`))
  const lis = $$('.wk-steps li', el), outs = $$('.out-file', el)
  const seq = sequencer()
  const play = () => seq.run(async step => {
    lis.forEach(l => { l.className = ''; $('time', l).textContent = '' })
    outs.forEach(o => o.classList.remove('on'))
    let t = 0
    await step(400)
    for (let i = 0; i < lis.length; i++) {
      lis[i].classList.add('run')
      const dur = 700 + i * 120
      await step(dur)
      t += 4 + i * 3
      lis[i].classList.replace('run', 'ok')
      $('time', lis[i]).textContent = `${fa(0)}:${fa(String(t).padStart(2, '0'))}`
      if (i === 1) outs[1].classList.add('on')
      if (i === 2) outs[0].classList.add('on')
      if (i === 3) outs[2].classList.add('on')
    }
  })
  $('.replay', el).addEventListener('click', play)
  return { enter: play, leave: () => seq.stop() }
}

// ── 07 · tasks & schedules ────────────────────────────────────
const DAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']
export function m7(el) {
  el.append(h(`
    <div class="tk">
      <div class="tk-card glass-ui" data-spot="tasks">
        <span class="tk-ico"><svg class="i"><use href="#i-bell"/></svg></span>
        <div><b>خلاصه‌ی بازار مس</b><span class="tk-when">هر شنبه<i class="sep" aria-hidden="true"></i>ساعت ۸:۰۰</span></div>
        <div class="seg seg--sm" data-spot="freq" role="radiogroup" aria-label="تکرار">
          <button type="button" role="radio" aria-checked="false" data-f="d">روزانه</button>
          <button type="button" role="radio" aria-checked="true" class="on" data-f="w">هفتگی</button>
          <button type="button" role="radio" aria-checked="false" data-f="m">ماهانه</button>
        </div>
      </div>
      <div class="cal glass-ui" data-spot="tasks">
        <div class="cal-h">${DAYS.map(d => `<span>${d}</span>`).join('')}</div>
        <div class="cal-g">${Array.from({ length: 28 }, (_, i) => `<span data-d="${i}"><em>${fa(i + 1)}</em><i></i></span>`).join('')}</div>
      </div>
      <div class="toast" data-spot="toast" role="status">
        <img class="vlogo blossom" src="${BASE}brand/openai-blossom-white.svg" alt="" />
        <div><b>خلاصه‌ی هفتگی آماده است</b><span>۳ نکته‌ی مهم بازار مس در این هفته…</span></div>
        <time>اکنون</time>
      </div>
    </div>`))
  const when = $('.tk-when', el), cells = $$('.cal-g span', el), toast = $('.toast', el)
  const LABEL = { d: 'هر روز (به‌جز جمعه)<i class="sep" aria-hidden="true"></i>ساعت ۸:۰۰', w: 'هر شنبه<i class="sep" aria-hidden="true"></i>ساعت ۸:۰۰', m: 'اولین شنبه‌ی هر ماه<i class="sep" aria-hidden="true"></i>ساعت ۸:۰۰' }
  const setF = f => {
    $$('[data-f]', el).forEach(b => { b.classList.toggle('on', b.dataset.f === f); b.setAttribute('aria-checked', b.dataset.f === f) })
    when.innerHTML = LABEL[f]
    cells.forEach((c, i) => {
      const dow = i % 7
      const on = f === 'd' ? dow !== 6 : f === 'w' ? dow === 0 : i === 0
      c.classList.toggle('on', on)
      c.style.setProperty('--d', `${i * 18}ms`)
    })
  }
  $$('[data-f]', el).forEach(b => b.addEventListener('click', () => setF(b.dataset.f)))
  setF('w')
  const seq = sequencer()
  return {
    enter: () => seq.run(async step => { toast.classList.remove('on'); await step(1400); toast.classList.add('on') }),
    leave: () => { seq.stop() },
  }
}
