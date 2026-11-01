import test from 'node:test'
import assert from 'node:assert/strict'
import * as C from '../shared/utils/climate.js'

// Monthly means for Lisbon from NASA POWER (2015-2024), the real values the page showed during development.
const LISBON = { x: [17.2, 17.8, 19.3, 21.1, 24.6, 25.7, 26.5, 27.2, 26.6, 24.6, 20.6, 18.3], n: [7.3, 8.4, 9.1, 11.1, 12.8, 15.1, 16.4, 16.7, 15.8, 14.0, 10.9, 9.0], m: [13.1, 13.3, 13.9, 15.4, 17.2, 18.8, 19.9, 20.2, 19.8, 18.7, 16.1, 14.4], r: [50, 40, 59, 57, 28, 12, 3, 3, 24, 71, 72, 65], c: [62, 58, 61, 57, 52, 49, 45, 41, 48, 58, 60, 62], h: [81, 80, 80, 80, 79, 80, 81, 81, 81, 81, 80, 82], w: [21, 22, 21, 20, 20, 20, 22, 20, 17, 18, 21, 22], s: [2.3, 3.3, 4.5, 5.8, 6.9, 7.3, 7.3, 6.7, 5.3, 3.7, 2.5, 2.1] }
const BANGKOK = { x: Array(12).fill(33), n: Array(12).fill(25), m: Array(12).fill(29), r: [20, 40, 70, 90, 220, 150, 160, 190, 330, 240, 60, 10], c: [30, 35, 40, 50, 70, 75, 75, 78, 80, 70, 45, 30], h: Array(12).fill(75), w: Array(12).fill(10), s: Array(12).fill(5) }

const KEYS = ['T2M', 'PRECTOTCORR', 'RH2M', 'WS10M', 'CLOUD_AMT', 'ALLSKY_SFC_SW_DWN']
function fake(vals, years = [2020, 2021]) {
  const param = {}
  KEYS.forEach((k) => (param[k] = {}))
  for (const y of years) for (let m = 1; m <= 12; m++) {
    const ym = '' + y + String(m).padStart(2, '0')
    KEYS.forEach((k) => (param[k][ym] = vals[k]))
  }
  return param
}

test('aggregate averages each calendar month over years and ignores fill values', () => {
  const param = fake({ T2M: 15, PRECTOTCORR: 2, RH2M: 70, WS10M: 5, CLOUD_AMT: 50, ALLSKY_SFC_SW_DWN: 4 }, [2020, 2021, 2022])
  param.T2M['202001'] = 10
  param.T2M['202101'] = 20
  param.T2M['202201'] = -999
  const a = C.aggregate(param, 40)
  assert.equal(a.m[0], 15) // (10 + 20) / 2, the -999 fill value is ignored
  assert.equal(a.m[1], 15)
})

test('aggregate converts units and rebuilds highs and lows around the mean', () => {
  const a = C.aggregate(fake({ T2M: 15, PRECTOTCORR: 2, RH2M: 70, WS10M: 5, CLOUD_AMT: 50, ALLSKY_SFC_SW_DWN: 4 }), 40)
  assert.equal(a.w[0], 18) // 5 m/s = 18 km/h
  assert.equal(a.r[0], 62) // 2 mm/day * 31 days
  assert.ok(a.x[6] > a.m[6] && a.n[6] < a.m[6])
  assert.ok(Math.abs((a.x[6] + a.n[6]) / 2 - a.m[6]) < 0.2)
})

test('estimateRange: sunny summers swing more than dull winters, and it stays within sane limits', () => {
  const lisbonJul = C.estimateRange(7.2, 38.7, 6)
  const londonJan = C.estimateRange(0.7, 51.5, 0)
  assert.ok(lisbonJul > 8 && lisbonJul < 14, 'Lisbon July ' + lisbonJul)
  assert.ok(londonJan >= 3 && londonJan < 7, 'London January ' + londonJan)
  assert.ok(C.estimateRange(30, 10, 3) <= 15)
  assert.ok(C.estimateRange(0, 10, 3) >= 3)
  assert.ok(C.extraRadiation(0, 2) > 30 && C.extraRadiation(0, 2) < 40)
  assert.ok(Number.isFinite(C.extraRadiation(89, 11)) && Number.isFinite(C.extraRadiation(-89, 5)))
})

test('aggregate returns null when a month has no data', () => {
  assert.equal(C.aggregate({ T2M: {} }), null)
})

test('Lisbon: spring and early autumn beat winter for sightseeing', () => {
  const s = C.scoreAll(LISBON, 'city')
  const best = C.bestMonths(s)
  assert.ok(best.includes(4) || best.includes(5), 'May or June is among the best: ' + best)
  assert.ok(s[4] > s[0] + 15 && s[9] > s[11] + 5)
  assert.ok(s.every((x) => x >= 0 && x <= 100))
})

test('Lisbon: the warm profile prefers July-September to May', () => {
  const s = C.scoreAll(LISBON, 'warm')
  assert.ok(Math.max(s[6], s[7], s[8]) >= s[4])
  assert.ok(s[0] < 45)
})

test('Bangkok: the wet season scores below the dry season', () => {
  const s = C.scoreAll(BANGKOK, 'city')
  assert.ok(s[0] > s[8])
})

test('ski: cold snowy months score high, warm months zero', () => {
  const alps = { x: [0, 2, 6, 10, 15, 19, 22, 21, 17, 11, 5, 1], n: [-8, -7, -3, 1, 5, 9, 11, 10, 7, 2, -3, -7], m: [-4, -3, 1, 5, 10, 14, 16, 15, 11, 6, 1, -3], r: [90, 80, 85, 90, 110, 130, 140, 130, 100, 90, 95, 100], c: Array(12).fill(55), h: Array(12).fill(75), w: Array(12).fill(12), s: Array(12).fill(3.5) }
  const s = C.scoreAll(alps, 'ski')
  assert.ok(s[0] > 60 && s[1] > 60)
  assert.equal(s[6], 0)
  assert.deepEqual(C.bestMonths(s).filter((i) => i >= 5 && i <= 9), [])
})

test('runs and labels handle gaps and the year wrap', () => {
  assert.deepEqual(C.runs([4, 5, 8, 9]), [[4, 5], [8, 9]])
  assert.equal(C.monthLabel([4, 5, 8, 9]), 'May to June and September to October')
  assert.equal(C.monthLabel([6]), 'July')
  assert.equal(C.monthLabel([11, 0, 1]), 'December to February')
  assert.equal(C.monthLabel([2, 3, 4]), 'March to May')
})

test('describe writes a sensible lead sentence', () => {
  const d = C.describe(LISBON, 'Lisbon')
  assert.match(d.lead, /^The best time to visit Lisbon is/)
  assert.match(d.lead, /°C \(\d+/)
  assert.equal(C.MONTHS[d.hottest], 'August')
  assert.equal(C.MONTHS[d.driest], 'July')
})

test('feelsLike is warmer when humid and cooler in wind', () => {
  assert.ok(C.feelsLike(32, 85, 5) > C.feelsLike(32, 30, 5))
  assert.ok(C.feelsLike(20, 60, 30) < C.feelsLike(20, 60, 5))
})
