import { donut, outcomes, checklist } from './common.js'
import * as gpt from './gpt.js'
import * as gem from './gem.js'
import { $$, BASE } from '../util.js'

const GPT_RAMP = ['#ffffff', '#e4e4e7', '#c9c9cf', '#adadb5', '#93939b', '#7a7a82', '#63636b']
const GEM_RAMP = ['#4796e3', '#5f8fdc', '#7786d3', '#9177c7', '#a873ad', '#bb6c90', '#ca6673']
const COPPER = '#c4703a'

const S1 = [
  ['m1', 'محیط ChatGPT و نسخه‌ی دسکتاپ', 25], ['m2', 'شخصی‌سازی و تنظیمات', 15], ['m3', 'ساخت پروژه و مدیریت اطلاعات', 30],
  ['m4', 'اصول درخواست‌نویسی مؤثر', 20], ['m5', 'تحلیل داده و کار با فایل‌ها', 40], ['m6', 'تولید فایل و کارهای چندمرحله‌ای', 25],
  ['m7', 'تسک‌ها و جمع‌بندی', 15],
]
const S2 = [
  ['g1', 'آشنایی با Gemini و اکوسیستم', 20], ['g2', 'تحقیق و Deep Research', 35], ['g3', 'اسناد در Google Docs', 25],
  ['g4', 'جدول و فرمول در Sheets', 40], ['g5', 'ارائه با Google Slides', 25], ['g6', 'تولید و اصلاح تصویر', 15],
  ['g7', 'تمرین نهایی و جمع‌بندی', 10],
]
const items = (list, ramp) => [
  ...list.map(([to, label, min], i) => ({ to, label, min, color: ramp[i] })),
  { label: 'استراحت', min: 10, color: COPPER, rest: true },
]

const FACTORIES = {
  s1: el => donut(el, { items: items(S1, GPT_RAMP), logo: `${BASE}brand/openai-blossom-white.svg`, logoClass: 'blossom', name: 'ChatGPT' }),
  s2: el => donut(el, { items: items(S2, GEM_RAMP), logo: `${BASE}brand/gemini-sparkle.webp`, name: 'Gemini' }),
  ...gpt,
  out1: el => outcomes(el, {
    items: [
      { icon: 'user', title: 'حساب شخصی‌سازی‌شده', sub: 'دستورالعمل، حافظه و نقش شغلی' },
      { icon: 'folder', title: 'یک پروژه‌ی کاری', sub: 'با فایل‌های مرجع واحد خودتان' },
      { icon: 'chart', title: 'تحلیل یک فایل داده', sub: 'جدول، شاخص و نمودار' },
      { icon: 'doc', title: 'یک گزارش قابل استفاده', sub: 'آماده‌ی ارائه به مدیر' },
    ],
  }),
  ...gem,
  prep: el => checklist(el),
}

export function initArtifacts() {
  const map = new Map()
  $$('[data-art]').forEach(el => {
    const make = FACTORIES[el.dataset.art]
    if (!make) return
    try { map.set(el.closest('[data-stop]').id, make(el)) } catch (e) { console.error('artifact', el.dataset.art, e) }
  })
  return map
}
