import { places, countries, summaryOf, bySlug } from '../utils/data.js'

const FEATURED = ['lisbon', 'barcelona', 'rome', 'paris', 'london', 'amsterdam', 'prague', 'vienna', 'athens', 'santorini', 'dubrovnik', 'istanbul', 'marrakech', 'cape-town', 'dubai', 'bangkok', 'bali', 'phuket', 'tokyo', 'kyoto', 'singapore', 'sydney', 'new-york-city', 'miami', 'honolulu', 'cancun', 'rio-de-janeiro', 'reykjavik']

export default defineEventHandler(() => ({
  featured: FEATURED.map((s) => bySlug.get(s)).filter(Boolean).map(summaryOf),
  countries: countries(),
  all: places.map((p) => ({ slug: p.slug, name: p.display, cc: p.cc, country: p.country })).sort((a, b) => a.name.localeCompare(b.name)),
  total: places.length,
}))
