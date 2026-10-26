// Procedural "generated image": copper cathode plates in a tank house.
// Deterministic (seeded) so every regeneration differs only by the chosen edits.

const rng = seed => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646

export function drawCopper(g, W, H, { cool = false, wide = false, dark = false } = {}) {
  const r = rng(7)
  g.save()
  g.clearRect(0, 0, W, H)
  // backdrop
  const bg = g.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, dark ? '#050303' : cool ? '#0b1218' : '#160c07')
  bg.addColorStop(0.55, dark ? '#0d0806' : cool ? '#16222b' : '#2a170c')
  bg.addColorStop(1, dark ? '#060404' : cool ? '#0a1014' : '#120a06')
  g.fillStyle = bg; g.fillRect(0, 0, W, H)

  const zoom = wide ? 0.72 : 1
  g.translate(W / 2, H * 0.52); g.scale(zoom, zoom); g.translate(-W / 2, -H * 0.52)

  // light shafts
  g.globalCompositeOperation = 'lighter'
  for (let i = 0; i < 4; i++) {
    const x = W * (0.15 + i * 0.22)
    const sh = g.createLinearGradient(x, 0, x + W * 0.18, H)
    const a = (dark ? 0.04 : 0.09) * (1 - i * 0.15)
    sh.addColorStop(0, cool ? `rgba(160,210,255,${a})` : `rgba(255,190,120,${a})`)
    sh.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = sh
    g.beginPath(); g.moveTo(x - 20, -40); g.lineTo(x + 30, -40); g.lineTo(x + W * 0.22, H + 40); g.lineTo(x + W * 0.08, H + 40); g.fill()
  }
  g.globalCompositeOperation = 'source-over'

  // receding rows of plates (back to front)
  const rows = 7
  for (let row = rows - 1; row >= 0; row--) {
    const depth = row / (rows - 1)             // 1 far … 0 near
    const s = 0.28 + (1 - depth) * 0.95
    const y0 = H * (0.3 + (1 - depth) * 0.12)
    const plateW = 70 * s, plateH = 120 * s, gap = 16 * s
    const count = Math.ceil(W / (plateW + gap)) + 4
    const offset = (row % 2) * (plateW / 2) - plateW
    // hanger bar
    g.fillStyle = `rgba(${cool ? '120,140,150' : '140,110,90'},${0.25 + (1 - depth) * 0.5})`
    g.fillRect(0, y0 - 8 * s, W, 4 * s)
    for (let k = 0; k < count; k++) {
      const x = offset + k * (plateW + gap) + (r() - 0.5) * 4 * s
      const tilt = (r() - 0.5) * 0.04
      g.save()
      g.translate(x + plateW / 2, y0); g.rotate(tilt); g.translate(-plateW / 2, 0)
      const pg = g.createLinearGradient(0, 0, plateW, plateH)
      const fade = 0.35 + (1 - depth) * 0.65
      if (cool) {
        pg.addColorStop(0, `rgba(110,70,50,${fade})`); pg.addColorStop(0.45, `rgba(215,150,120,${fade})`); pg.addColorStop(0.55, `rgba(190,215,230,${fade * 0.9})`); pg.addColorStop(1, `rgba(90,55,40,${fade})`)
      } else {
        pg.addColorStop(0, `rgba(122,52,20,${fade})`); pg.addColorStop(0.42, `rgba(226,128,70,${fade})`); pg.addColorStop(0.52, `rgba(255,196,140,${fade})`); pg.addColorStop(1, `rgba(140,62,26,${fade})`)
      }
      g.fillStyle = pg
      g.beginPath(); g.roundRect(0, 0, plateW, plateH, 3 * s); g.fill()
      // crystalline texture
      g.globalAlpha = 0.18 * fade
      for (let t = 0; t < 14; t++) {
        g.fillStyle = r() > 0.5 ? '#fff3e0' : '#3a1405'
        g.fillRect(r() * plateW, r() * plateH, 1 + r() * 3 * s, 1 + r() * 2 * s)
      }
      g.globalAlpha = 1
      // lug at the top
      g.fillStyle = `rgba(80,60,50,${fade})`
      g.fillRect(plateW * 0.1, -6 * s, plateW * 0.8, 6 * s)
      g.restore()
    }
    // floor reflection band
    const fl = g.createLinearGradient(0, y0 + plateH, 0, y0 + plateH + 40 * s)
    fl.addColorStop(0, cool ? 'rgba(120,170,200,.10)' : 'rgba(255,150,80,.10)'); fl.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = fl; g.fillRect(0, y0 + plateH, W, 40 * s)
  }

  // bokeh + sparks
  g.globalCompositeOperation = 'lighter'
  for (let i = 0; i < 46; i++) {
    const x = r() * W, y = r() * H * 0.9, rad = 2 + r() * 14
    const b = g.createRadialGradient(x, y, 0, x, y, rad)
    const a = (dark ? 0.12 : 0.22) * r()
    b.addColorStop(0, cool ? `rgba(170,215,255,${a})` : `rgba(255,190,120,${a})`); b.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = b; g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill()
  }
  g.globalCompositeOperation = 'source-over'
  g.restore()

  // vignette
  const v = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.75)
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(0,0,0,${dark ? 0.8 : 0.6})`)
  g.fillStyle = v; g.fillRect(0, 0, W, H)
}
