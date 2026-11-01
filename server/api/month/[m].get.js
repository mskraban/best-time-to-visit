import { places, climateOf, MONTH_SLUGS } from '../../utils/data.js'
import { scoreAll, monthAt, MONTHS } from '#shared/utils/climate.js'

export default defineEventHandler((event) => {
  const i = MONTH_SLUGS.indexOf(getRouterParam(event, 'm'))
  if (i < 0) throw createError({ statusCode: 404, statusMessage: 'Unknown month' })
  const rows = places.map((p) => {
    const c = climateOf(p.slug)
    const mo = monthAt(c, i)
    return { slug: p.slug, display: p.display, country: p.country, cc: p.cc, city: scoreAll(c, 'city')[i], warm: scoreAll(c, 'warm')[i], high: Math.round(mo.high), low: Math.round(mo.low), rain: mo.rain, pop: p.pop, tourist: p.pop === 0 || p.tags.length > 0 }
  })
  const top = (key, n, filter) => rows.filter(filter || (() => true)).sort((a, b) => b[key] - a[key] || b.pop - a.pop).slice(0, n)
  return { month: MONTHS[i], index: i, city: top('city', 36), warm: top('warm', 24) }
})
