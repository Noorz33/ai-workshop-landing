// public/ files resolve against the deploy base (works at a domain root or a GitHub Pages subpath)
export const BASE = import.meta.env.BASE_URL

const FA = '۰۱۲۳۴۵۶۷۸۹'
export const fa = v => String(v).replace(/\d/g, d => FA[+d]).replace(/\./g, '٫')
export const faNum = (n, d = 0) => fa(Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })).replace(/,/g, '٬')
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
export const lerp = (a, b, t) => a + (b - a) * t
export const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t) }
export const $ = (s, r = document) => r.querySelector(s)
export const $$ = (s, r = document) => [...r.querySelectorAll(s)]
export const wait = ms => new Promise(r => setTimeout(r, ms))
export const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches

// html helper: builds an element from a template string
export const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild }

// a cancellable sequence for artifact demos: run(async step => { await step(300); ... })
export function sequencer() {
  let gen = 0
  return {
    run(fn) {
      const id = ++gen
      const step = ms => new Promise((res, rej) => setTimeout(() => (id === gen ? res() : rej(new Error('cancelled'))), reduced() ? 0 : ms))
      return fn(step, () => id === gen).catch(() => {})
    },
    stop() { gen++ },
  }
}

// type text into an element, char by char (cancellable through step)
export async function typeInto(el, text, step, cps = 38) {
  el.textContent = ''
  const chars = [...text]
  for (let i = 0; i < chars.length; i += 2) {
    el.textContent += chars[i] + (chars[i + 1] ?? '')
    await step(1000 / cps * 2)
  }
}
