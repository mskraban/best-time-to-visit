import { places, summaryOf } from '../../utils/data.js'

export default defineEventHandler((event) => {
  const slug = getRouterParam(event, 'slug')
  const list = places.filter((p) => p.countrySlug === slug)
  if (!list.length) throw createError({ statusCode: 404, statusMessage: 'Unknown country' })
  return { name: list[0].country, cc: list[0].cc, slug, places: list.sort((a, b) => b.pop - a.pop || a.display.localeCompare(b.display)).map(summaryOf) }
})
