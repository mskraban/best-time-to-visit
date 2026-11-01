import { readFileSync, existsSync } from 'node:fs'

// Routes to prerender: one page per destination that has climate data, plus country hubs and month pages.
const read = (f: string) => (existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : {})
const cities: any[] = read('./data/cities.json') || []
const climate = read('./data/climate.json')
const slugify = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const names = new Intl.DisplayNames(['en'], { type: 'region' })
const have = Array.isArray(cities) ? cities.filter((c) => climate[c.slug]) : []
const countrySlugs = [...new Set(have.map((c) => slugify(names.of(c.cc) || c.cc)))]
const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  telemetry: false,
  css: ['~/assets/main.css'],
  runtimeConfig: { public: { siteUrl: process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? 'https://' + process.env.VERCEL_PROJECT_PRODUCTION_URL : '') } },
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }, { name: 'theme-color', content: '#0b4f6c' }],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preload', href: '/fonts/sora-latin-wght-normal.woff2', as: 'font', type: 'font/woff2', crossorigin: 'anonymous' },
        { rel: 'preload', href: '/fonts/dm-sans-latin-wght-normal.woff2', as: 'font', type: 'font/woff2', crossorigin: 'anonymous' },
      ],
    },
  },
  nitro: {
    preset: 'static',
    prerender: {
      crawlLinks: false,
      failOnError: true,
      routes: ['/', '/sitemap.xml', '/robots.txt', ...months.map((m) => '/where-to-go/' + m), ...countrySlugs.map((s) => '/countries/' + s), ...have.map((c) => '/best-time-to-visit/' + c.slug)],
    },
  },
})
