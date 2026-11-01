// Builds data/climate.json: 12 monthly climate averages per destination, from NASA POWER (no API key needed).
// - Reads data/cities.json, writes data/climate.json.
// - Reuses anything already in data/climate.json or the build cache, so reruns only fetch what is missing.
// - MOCK_CLIMATE=1 makes up plausible numbers from the latitude (for offline development and tests only).
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { aggregate } from '../shared/utils/climate.js'

const root = new URL('../', import.meta.url)
const cities = JSON.parse(readFileSync(new URL('data/cities.json', root), 'utf8'))
const outFile = new URL('data/climate.json', root)
const cacheDir = new URL('node_modules/.cache/besttime/', root)
const cacheFile = new URL('climate.json', cacheDir)
const MOCK = process.env.MOCK_CLIMATE === '1'

const load = (u) => { try { return existsSync(u) ? JSON.parse(readFileSync(u, 'utf8')) : {} } catch { return {} } }
const store = { ...load(cacheFile), ...load(outFile) }

const lastYear = new Date().getFullYear() - 1
const PARAMS = 'T2M,PRECTOTCORR,RH2M,WS10M,CLOUD_AMT,ALLSKY_SFC_SW_DWN'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function mock(c) {
  const lat = Math.abs(c.lat), north = c.lat >= 0
  const out = { x: [], n: [], m: [], r: [], c: [], h: [], w: [], s: [] }
  for (let i = 0; i < 12; i++) {
    const phase = Math.cos(((i - (north ? 6.5 : 0.5)) / 12) * 2 * Math.PI) // 1 in local summer
    const base = 29 - lat * 0.45, amp = Math.min(14, lat * 0.28)
    const mean = base + amp * phase
    out.m.push(+mean.toFixed(1)); out.x.push(+(mean + 4).toFixed(1)); out.n.push(+(mean - 4).toFixed(1))
    out.r.push(Math.round(Math.max(5, 90 + 70 * Math.sin(i * 0.9 + lat) - lat * 0.4)))
    out.c.push(Math.round(50 + 20 * Math.sin(i * 0.7 + lat))); out.h.push(70); out.w.push(14); out.s.push(+(4 + 2 * phase).toFixed(1))
  }
  return out
}

async function fetchOne(c) {
  if (MOCK) return mock(c)
  const url = `https://power.larc.nasa.gov/api/temporal/monthly/point?parameters=${PARAMS}&community=RE&longitude=${c.lon}&latitude=${c.lat}&start=${lastYear - 9}&end=${lastYear}&format=JSON`
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(40000), headers: { 'user-agent': 'best-time-to-visit (build)' } })
      if (res.status === 429 || res.status >= 500) { await sleep(2000 * (attempt + 1)); continue }
      if (!res.ok) return null
      const json = await res.json()
      return aggregate(json.properties.parameter, c.lat)
    } catch {
      await sleep(1500 * (attempt + 1))
    }
  }
  return null
}

const todo = cities.filter((c) => !store[c.slug])
console.log(`climate: ${cities.length - todo.length} cached, ${todo.length} to fetch${MOCK ? ' (MOCK DATA)' : ''}`)
let done = 0, failed = 0
const queue = [...todo]
async function worker() {
  while (queue.length) {
    const c = queue.shift()
    const data = await fetchOne(c)
    if (data) store[c.slug] = data; else failed++
    if (++done % 50 === 0) console.log(`  ${done}/${todo.length} (${failed} failed)`)
    if (!MOCK) await sleep(150)
  }
}
await Promise.all(Array.from({ length: MOCK ? 8 : 3 }, worker))

const have = cities.filter((c) => store[c.slug]).length
const out = {}
for (const c of cities) if (store[c.slug]) out[c.slug] = store[c.slug]
writeFileSync(outFile, JSON.stringify(out))
mkdirSync(cacheDir, { recursive: true })
writeFileSync(cacheFile, JSON.stringify(out))
console.log(`climate: ${have}/${cities.length} destinations have data (${failed} failed)`)
if (have < Math.min(200, cities.length * 0.5)) {
  console.error('Too few destinations have climate data. Refusing to build an empty site.')
  process.exit(1)
}
