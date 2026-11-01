import { places, countries, MONTH_SLUGS } from '../utils/data.js'

export default defineEventHandler((event) => {
  const site = (process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? 'https://' + process.env.VERCEL_PROJECT_PRODUCTION_URL : 'http://localhost:3000')).replace(/\/$/, '')
  const urls = ['/', ...MONTH_SLUGS.map((m) => '/where-to-go/' + m), ...countries().map((c) => '/countries/' + c.slug), ...places.map((p) => '/best-time-to-visit/' + p.slug)]
  setHeader(event, 'content-type', 'application/xml')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${site}${u}</loc></url>`).join('\n')}\n</urlset>\n`
})
