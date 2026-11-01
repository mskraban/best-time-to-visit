import { bySlug, places, climateOf, distanceKm, summaryOf } from '../../utils/data.js'

export default defineEventHandler((event) => {
  const slug = getRouterParam(event, 'slug')
  const p = bySlug.get(slug)
  if (!p) throw createError({ statusCode: 404, statusMessage: 'Unknown destination' })
  const sameCountry = places.filter((x) => x.countrySlug === p.countrySlug && x.slug !== p.slug).sort((a, b) => b.pop - a.pop).slice(0, 8).map(summaryOf)
  const nearby = places
    .filter((x) => x.slug !== p.slug)
    .map((x) => ({ x, d: distanceKm(p, x) }))
    .filter((o) => o.d < 700)
    .sort((a, b) => a.d - b.d)
    .slice(0, 6)
    .map((o) => ({ ...summaryOf(o.x), km: Math.round(o.d / 10) * 10 }))
  return { place: { slug: p.slug, display: p.display, cc: p.cc, country: p.country, countrySlug: p.countrySlug, lat: p.lat, lon: p.lon, ski: p.tags.includes('ski'), island: p.tags.includes('island') }, climate: climateOf(slug), sameCountry, nearby }
})
