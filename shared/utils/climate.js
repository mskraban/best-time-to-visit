// Climate maths for Best Time to Visit. Pure functions, no DOM, no network.
// Used by the build script, the Nuxt pages and the tests.

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
export const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS = [31, 28.25, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

const clamp01 = (x) => Math.max(0, Math.min(1, x))
const r1 = (x) => Math.round(x * 10) / 10

/**
 * Extraterrestrial radiation (MJ/m2/day) at a latitude, mid-month. FAO-56 equations.
 */
export function extraRadiation(latDeg, monthIdx) {
  const doy = Math.round(15 + monthIdx * 30.4)
  const phi = (latDeg * Math.PI) / 180
  const dr = 1 + 0.033 * Math.cos((2 * Math.PI * doy) / 365)
  const delta = 0.409 * Math.sin((2 * Math.PI * doy) / 365 - 1.39)
  const x = Math.max(-1, Math.min(1, -Math.tan(phi) * Math.tan(delta)))
  const ws = Math.acos(x)
  return ((24 * 60) / Math.PI) * 0.082 * dr * (ws * Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.sin(ws))
}

/**
 * Typical gap between the daily high and low (C), estimated from sunshine with the Hargreaves-Samani relation.
 * Gridded weather models are unreliable for daily highs and lows, but their monthly mean temperature and sunshine are good,
 * so highs and lows are rebuilt as mean +/- half this range. rsKwh is surface solar radiation in kWh/m2/day.
 */
export function estimateRange(rsKwh, latDeg, monthIdx) {
  const ra = extraRadiation(latDeg, monthIdx)
  if (!(ra > 1)) return 4
  const k = 0.18
  const dtr = Math.pow((rsKwh * 3.6) / (k * ra), 2)
  return Math.max(3, Math.min(15, dtr))
}

/**
 * Turns the NASA POWER "monthly" response (properties.parameter) into 12 month averages across all years.
 * Input keys: T2M, PRECTOTCORR (mm/day), RH2M (%), WS10M (m/s), CLOUD_AMT (%), ALLSKY_SFC_SW_DWN (kWh/m2/day). lat in degrees.
 * Output: compact arrays of 12 numbers: x = typical daily high C, n = typical daily low C, m = mean C, r = rainfall mm/month,
 * c = cloud cover %, h = relative humidity %, w = wind km/h, s = solar kWh/m2/day.
 */
export function aggregate(param, lat = 40) {
  const get = (key) => {
    const sums = new Array(12).fill(0)
    const counts = new Array(12).fill(0)
    const series = param[key] || {}
    for (const ym of Object.keys(series)) {
      const v = series[ym]
      if (typeof v !== 'number' || v <= -900) continue
      const m = parseInt(ym.slice(4, 6), 10) - 1
      if (!(m >= 0 && m < 12)) continue
      sums[m] += v
      counts[m]++
    }
    return sums.map((s, i) => (counts[i] >= 2 ? s / counts[i] : null))
  }
  const m = get('T2M'), p = get('PRECTOTCORR'), c = get('CLOUD_AMT'), h = get('RH2M'), w = get('WS10M'), s = get('ALLSKY_SFC_SW_DWN')
  if ([m, p, c, h, w, s].some((arr) => arr.some((v) => v == null))) return null
  const dtr = s.map((rs, i) => estimateRange(rs, lat, i))
  return {
    x: m.map((v, i) => r1(v + dtr[i] / 2)),
    n: m.map((v, i) => r1(v - dtr[i] / 2)),
    m: m.map(r1),
    r: p.map((v, i) => Math.round(v * DAYS[i])),
    c: c.map(Math.round),
    h: h.map(Math.round),
    w: w.map((v) => Math.round(v * 3.6)),
    s: s.map(r1),
  }
}

/** Apparent ("feels like") daytime temperature in C. Steadman formula; daytime humidity is lower than the daily mean. */
export function feelsLike(tmax, rh, windKmh) {
  const e = (rh * 0.8 / 100) * 6.105 * Math.exp((17.27 * tmax) / (237.7 + tmax))
  return tmax + 0.33 * e - 0.7 * (windKmh / 3.6) - 4
}

/** One month as an object, from the compact arrays. */
export function monthAt(c, i) {
  return {
    i, name: MONTHS[i], short: MONTHS_SHORT[i],
    high: c.x[i], low: c.n[i], mean: c.m[i], rain: c.r[i], cloud: c.c[i], humidity: c.h[i], wind: c.w[i], sun: c.s[i],
    feels: feelsLike(c.x[i], c.h[i], c.w[i]),
  }
}

export const PROFILES = {
  city: { key: 'city', label: 'Sightseeing', short: 'City breaks', blurb: 'comfortable for walking around: mild, not too wet, some sun', lo: 15, hi: 24, tol: 8, rainCap: 220, adapt: true, w: [0.5, 0.3, 0.2] },
  warm: { key: 'warm', label: 'Sun and warmth', short: 'Beach and sun', blurb: 'hot, dry and sunny, for beaches and pools', lo: 26, hi: 32, tol: 10, rainCap: 180, w: [0.45, 0.25, 0.3] },
  outdoors: { key: 'outdoors', label: 'Hiking and outdoors', short: 'Hiking', blurb: 'cool to mild and dry, good for long days on foot', lo: 12, hi: 21, tol: 8, rainCap: 180, adapt: true, w: [0.45, 0.35, 0.2] },
  ski: { key: 'ski', label: 'Skiing', short: 'Skiing', blurb: 'cold enough for reliable snow, with enough precipitation', w: [0, 0, 0] },
}

/** Comfort score 0-100 for one month and trip type. */
export function scoreMonth(mo, profileKey, shift = 0) {
  const p = PROFILES[profileKey]
  const sun = clamp01((100 - mo.cloud) / 60)
  if (profileKey === 'ski') {
    const cold = clamp01(1 - (mo.mean + 2) / 10)
    const snowy = clamp01(mo.rain / 60)
    return Math.round(100 * cold * (0.35 + 0.45 * snowy + 0.2 * sun))
  }
  const lo = p.lo + shift, hi = p.hi + shift
  const dist = mo.feels < lo ? lo - mo.feels : mo.feels > hi ? mo.feels - hi : 0
  const temp = clamp01(1 - dist / p.tol)
  const dry = clamp01(1 - mo.rain / p.rainCap)
  const windFactor = 1 - clamp01((mo.wind - 25) / 40) * 0.25
  // Dry and sunny cannot rescue a month that is too hot or too cold, so temperature also gates the total.
  return Math.round(100 * (p.w[0] * temp + p.w[1] * dry + p.w[2] * sun) * (0.35 + 0.65 * temp) * windFactor)
}

/**
 * People who live in or expect a warm climate are comfortable at warmer temperatures, so the comfortable range for city and
 * outdoor trips moves with the place's yearly mean temperature (up to 8 C warmer, up to 3 C cooler than the default).
 */
export function comfortShift(c) {
  const mean = c.m.reduce((a, b) => a + b, 0) / 12
  return Math.max(-3, Math.min(8, 0.6 * (mean - 16)))
}

export function scoreAll(c, profileKey) {
  const shift = PROFILES[profileKey] && PROFILES[profileKey].adapt ? comfortShift(c) : 0
  return MONTHS.map((_, i) => scoreMonth(monthAt(c, i), profileKey, shift))
}

export function verdict(score) {
  return score >= 80 ? 'Excellent' : score >= 65 ? 'Good' : score >= 50 ? 'Fair' : 'Poor'
}

/** Months worth recommending: close to the best one, at most 4, in calendar order. */
export function bestMonths(scores) {
  const max = Math.max(...scores)
  const order = scores.map((s, i) => [s, i]).sort((a, b) => b[0] - a[0] || a[1] - b[1])
  const picked = order.filter(([s]) => s >= max - 12 && s >= 60).slice(0, 4).map(([, i]) => i)
  const out = picked.length ? picked : order.slice(0, 2).map(([, i]) => i)
  return out.sort((a, b) => a - b)
}

export function worstMonths(scores, n = 3) {
  return scores.map((s, i) => [s, i]).sort((a, b) => a[0] - b[0] || a[1] - b[1]).slice(0, n).map(([, i]) => i).sort((a, b) => a - b)
}

/** Groups month indexes into runs: [4,5,8,9] -> [[4,5],[8,9]]. December and January join up. */
export function runs(list) {
  const set = new Set(list)
  if (!set.size) return []
  const out = []
  for (let i = 0; i < 12; i++) {
    if (set.has(i) && !(set.has((i + 11) % 12) && set.size < 12)) {
      let j = i
      while (set.has((j + 1) % 12) && (j + 1) % 12 !== i && out.length < 12) j = j + 1
      out.push([i, j])
      if (set.size === 12) break
    }
  }
  return out
}

/** "May to June and September to October" */
export function monthLabel(list) {
  const rs = runs(list)
  const names = rs.map(([a, b]) => (a === b ? MONTHS[a] : MONTHS[a] + ' to ' + MONTHS[b % 12]))
  if (names.length <= 1) return names[0] || ''
  return names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1]
}

export const toF = (c) => Math.round(c * 9 / 5 + 32)
export const kmToMph = (k) => Math.round(k * 0.621371)
export const mmToIn = (mm) => Math.round(mm / 25.4 * 10) / 10

const range = (arr) => [Math.min(...arr), Math.max(...arr)]

/** Plain facts and sentences for one place; used for the page text, meta description and FAQ. */
export function describe(c, name, { ski = false } = {}) {
  const months = MONTHS.map((_, i) => monthAt(c, i))
  const profiles = ['city', 'warm', 'outdoors'].concat(ski ? ['ski'] : [])
  const scores = {}
  const best = {}
  const worst = {}
  for (const k of profiles) {
    scores[k] = months.map((mo) => scoreMonth(mo, k))
    best[k] = bestMonths(scores[k])
    worst[k] = worstMonths(scores[k])
  }
  const idx = (fn) => months.reduce((bi, mo, i, a) => (fn(mo) > fn(a[bi]) ? i : bi), 0)
  const hottest = idx((m) => m.high), coldest = idx((m) => -m.low), wettest = idx((m) => m.rain), driest = idx((m) => -m.rain)
  const bm = best.city
  const sel = bm.map((i) => months[i])
  const [hLo, hHi] = range(sel.map((m) => m.high))
  const rainAvg = Math.round(sel.reduce((s, m) => s + m.rain, 0) / sel.length)
  const maxScore = Math.max(...scores.city)
  const annualRain = months.reduce((s, m) => s + m.rain, 0)
  const hi = Math.round(hHi), lo = Math.round(hLo)
  const temps = lo === hi ? `${lo}°C (${toF(lo)}°F)` : `${lo}–${hi}°C (${toF(lo)}–${toF(hi)}°F)`
  const lead =
    maxScore >= 50
      ? `The best time to visit ${name} is ${monthLabel(bm)}, when daytime highs are around ${temps} and rainfall is ${rainAvg < 40 ? 'low' : rainAvg < 100 ? 'moderate' : 'high'}.`
      : `${name} has no ideal season for sightseeing. ${monthLabel(bm)} ${bm.length === 1 ? 'comes' : 'come'} closest, with daytime highs around ${temps}.`
  return { months, scores, best, worst, hottest, coldest, wettest, driest, lead, annualRain: Math.round(annualRain), maxScore }
}
