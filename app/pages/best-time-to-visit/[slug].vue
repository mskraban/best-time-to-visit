<script setup>
import { MONTHS, MONTHS_SHORT, PROFILES, describe, monthLabel, verdict, toF, mmToIn } from '#shared/utils/climate.js'
const route = useRoute()
const slug = route.params.slug
const { data, error } = await useAsyncData('city-' + slug, () => $fetch('/api/city/' + slug))
if (error.value || !data.value) throw createError({ statusCode: 404, statusMessage: 'Destination not found', fatal: true })
const place = data.value.place
const c = data.value.climate
const d = describe(c, place.display, { ski: place.ski })
const profiles = ['city', 'warm', 'outdoors'].concat(place.ski ? ['ski'] : [])
const profile = ref('city')
const scores = computed(() => d.scores[profile.value])
const best = computed(() => d.best[profile.value])
const gmin = Math.min(...c.n), gmax = Math.max(...c.x)

const C = (v) => `${Math.round(v)}°C (${toF(v)}°F)`
const mo = (i) => d.months[i]
const name = place.display
const where = `${name}, ${place.country}`
const sunnySummer = d.scores.warm
const warmBest = d.best.warm
const warmMax = Math.max(...d.scores.warm)

function whyBad(m) {
  if (m.feels >= 33) return 'very hot'
  if (m.feels >= 28) return 'hot'
  if (m.feels < 6) return 'cold'
  if (m.feels < 14) return 'cool'
  if (m.rain >= 150) return 'very wet'
  if (m.rain >= 90) return 'wet'
  return 'less comfortable'
}
const worstText = d.worst.city.map((i) => `${mo(i).name} (${whyBad(mo(i))})`).join(', ')

const faq = [
  { q: `When is the best time to visit ${name}?`, a: d.lead + ` Months with the best weather balance for sightseeing: ${monthLabel(d.best.city)}.` },
  { q: `What is the hottest month in ${name}?`, a: `${mo(d.hottest).name} is the hottest month, with average daytime highs of ${C(mo(d.hottest).high)} and lows of ${C(mo(d.hottest).low)}.` },
  { q: `What is the coldest month in ${name}?`, a: `${mo(d.coldest).name} is the coldest month, with average highs of ${C(mo(d.coldest).high)} and lows of ${C(mo(d.coldest).low)}.` },
  { q: `When does it rain the most in ${name}?`, a: `${mo(d.wettest).name} is the wettest month, with about ${mo(d.wettest).rain} mm (${mmToIn(mo(d.wettest).rain)} in) of rain. ${mo(d.driest).name} is the driest, with about ${mo(d.driest).rain} mm (${mmToIn(mo(d.driest).rain)} in).` },
  { q: `When should I avoid visiting ${name}?`, a: `For weather alone, the least comfortable months are ${worstText}. They can still work if you plan around the weather.` },
  { q: `Is ${name} good for a beach or sun holiday?`, a: warmMax >= 65 ? `Yes, if you go in ${monthLabel(warmBest)}. Those months combine warm days with low rainfall and plenty of sun.` : `Not especially. Even in the warmest months (${monthLabel(warmBest)}) the weather is only moderately warm or not reliably dry.` },
]
if (place.ski) faq.push({ q: `When is the best time to ski near ${name}?`, a: `Based on temperature and precipitation, ${monthLabel(d.best.ski)} give the best chance of reliable snow. Check the resort's own snow report before you book.` })

const site = useSiteUrl()
const url = `${site}/best-time-to-visit/${slug}`
const title = `Best Time to Visit ${name}: Weather by Month & Best Months`
const description = `${d.lead} Month-by-month temperature, rainfall and sunshine for ${where}, plus the months to avoid.`.slice(0, 300)
useSeoMeta({ title, description, ogTitle: title, ogDescription: description, ogType: 'article', ogUrl: url, ogImage: site + '/og.png', twitterCard: 'summary_large_image' })
useHead({
  link: [{ rel: 'canonical', href: url }],
  script: [
    { type: 'application/ld+json', innerHTML: JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }) },
    { type: 'application/ld+json', innerHTML: JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Best Time to Visit', item: site + '/' }, { '@type': 'ListItem', position: 2, name: place.country, item: `${site}/countries/${place.countrySlug}` }, { '@type': 'ListItem', position: 3, name }] }) },
  ],
})
</script>

<template>
  <main class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb"><NuxtLink to="/">Home</NuxtLink> › <NuxtLink :to="'/countries/' + place.countrySlug">{{ place.country }}</NuxtLink> › {{ name }}</nav>
    <h1>Best time to visit {{ name }}</h1>
    <p class="lead">{{ d.lead }}</p>
    <div class="pills">
      <span v-for="i in d.best.city" :key="i" class="pill">★ {{ MONTHS[i] }}</span>
    </div>
    <p class="note">Based on 10 years of weather averages for {{ where }}. The comfort score combines temperature, rain, sunshine and wind.</p>

    <h2>Weather by month in {{ name }}</h2>
    <div class="tabs" role="group" aria-label="Trip type">
      <button v-for="k in profiles" :key="k" type="button" class="tab" :aria-pressed="profile === k" @click="profile = k">{{ PROFILES[k].short }}</button>
    </div>
    <div class="panel">
      <p style="margin-bottom: 8px"><b>{{ PROFILES[profile].label }}:</b> best in {{ monthLabel(best) }}. <span class="muted">This score favours months that are {{ PROFILES[profile].blurb }}.</span></p>
      <ClimateChart :scores="scores" :best="best" :title="`${PROFILES[profile].label} in ${name}`" />
    </div>

    <div class="months" style="margin-top: 18px">
      <MonthCard v-for="m in d.months" :key="m.i" :m="m" :score="scores[m.i]" :best="best.includes(m.i)" :min="gmin" :max="gmax" />
    </div>

    <h2>Climate at a glance</h2>
    <div class="panel">
      <ul class="facts">
        <li><span>Hottest month</span><b>{{ mo(d.hottest).name }} ({{ C(mo(d.hottest).high) }})</b></li>
        <li><span>Coldest month</span><b>{{ mo(d.coldest).name }} ({{ C(mo(d.coldest).low) }} at night)</b></li>
        <li><span>Wettest month</span><b>{{ mo(d.wettest).name }} ({{ mo(d.wettest).rain }} mm)</b></li>
        <li><span>Driest month</span><b>{{ mo(d.driest).name }} ({{ mo(d.driest).rain }} mm)</b></li>
        <li><span>Rain in a typical year</span><b>about {{ d.annualRain }} mm ({{ mmToIn(d.annualRain) }} in)</b></li>
      </ul>
    </div>

    <h2>Best time to visit {{ name }} by trip type</h2>
    <div v-for="k in profiles" :key="k" style="margin-bottom: 14px">
      <h3>{{ PROFILES[k].label }}</h3>
      <p v-if="Math.max(...d.scores[k]) >= 60">The best months for {{ PROFILES[k].short.toLowerCase() }} in {{ name }} are <b>{{ monthLabel(d.best[k]) }}</b>, which are {{ PROFILES[k].blurb }}. Weakest: {{ monthLabel(d.worst[k].slice(0, 2)) }}.</p>
      <p v-else>{{ name }} does not have a month that suits {{ PROFILES[k].short.toLowerCase() }} well. {{ monthLabel(d.best[k]) }} come closest.</p>
    </div>

    <h2>Questions about visiting {{ name }}</h2>
    <details v-for="(f, i) in faq" :key="f.q" class="faq" :open="i === 0"><summary>{{ f.q }}</summary><p>{{ f.a }}</p></details>

    <template v-if="data.nearby.length">
      <h2>Destinations near {{ name }}</h2>
      <div class="chips">
        <NuxtLink v-for="n in data.nearby" :key="n.slug" class="chip" :to="'/best-time-to-visit/' + n.slug"><b>{{ n.display }}</b><span>{{ n.km }} km away · best {{ n.best }}</span></NuxtLink>
      </div>
    </template>
    <template v-if="data.sameCountry.length">
      <h2>More in {{ place.country }}</h2>
      <div class="chips">
        <NuxtLink v-for="n in data.sameCountry" :key="n.slug" class="chip" :to="'/best-time-to-visit/' + n.slug"><b>{{ n.display }}</b><span>Best: {{ n.best }}</span></NuxtLink>
      </div>
    </template>
    <p style="margin-top: 26px"><NuxtLink to="/">Search another destination</NuxtLink></p>
  </main>
</template>
