import cities from '../../data/cities.json'
import climate from '../../data/climate.json'
import { scoreAll, bestMonths, monthLabel } from '#shared/utils/climate.js'

export const slugify = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })
export const countryName = (cc) => {
  try { return regionNames.of(cc) || cc } catch { return cc }
}

// only destinations that have climate data get pages
export const places = cities.filter((c) => climate[c.slug]).map((c) => ({ ...c, country: countryName(c.cc), countrySlug: slugify(countryName(c.cc)) }))
export const bySlug = new Map(places.map((p) => [p.slug, p]))
export const climateOf = (slug) => climate[slug]

export function countries() {
  const map = new Map()
  for (const p of places) {
    if (!map.has(p.countrySlug)) map.set(p.countrySlug, { slug: p.countrySlug, name: p.country, cc: p.cc, count: 0, pop: 0 })
    const c = map.get(p.countrySlug)
    c.count++; c.pop += p.pop
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
}

export function distanceKm(a, b) {
  const r = Math.PI / 180, dLat = (b.lat - a.lat) * r, dLon = (b.lon - a.lon) * r
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLon / 2) ** 2
  return 12742 * Math.asin(Math.sqrt(h))
}

export function summaryOf(p) {
  const s = scoreAll(climateOf(p.slug), 'city')
  return { slug: p.slug, display: p.display, country: p.country, cc: p.cc, best: monthLabel(bestMonths(s)), top: Math.max(...s) }
}

export const MONTH_SLUGS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']

