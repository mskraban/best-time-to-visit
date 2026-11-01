<script setup>
import { MONTHS } from '#shared/utils/climate.js'
const slug = useRoute().params.month
const { data, error } = await useAsyncData('month-' + slug, () => $fetch('/api/month/' + slug))
if (error.value || !data.value) throw createError({ statusCode: 404, statusMessage: 'Month not found', fatal: true })
const m = data.value.month
const site = useSiteUrl()
const u = useUnits()
const title = `Best Places to Travel in ${m}: Destinations with the Best Weather`
const desc = `Where to go in ${m}? These destinations have the best weather in ${m}: ${data.value.city.slice(0, 5).map((p) => p.display).join(', ')} and more, with temperature and rainfall for each.`
useSeoMeta({ title, description: desc, ogTitle: title, ogDescription: desc, ogImage: site + '/og.png', twitterCard: 'summary_large_image' })
useHead({ link: [{ rel: 'canonical', href: `${site}/where-to-go/${slug}` }] })
</script>

<template>
  <main class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb"><NuxtLink to="/">Home</NuxtLink> › Where to go in {{ m }}</nav>
    <h1>Best places to travel in {{ m }}</h1>
    <p class="lead">Destinations where {{ m }} brings the most comfortable weather for sightseeing, ranked by temperature, rain, sunshine and wind.</p>
    <nav class="monthnav" aria-label="Months"><NuxtLink v-for="x in MONTHS" :key="x" :to="'/where-to-go/' + x.toLowerCase()">{{ x }}</NuxtLink></nav>

    <h2>Best for sightseeing in {{ m }}</h2>
    <ol class="rank">
      <li v-for="p in data.city" :key="p.slug"><span><NuxtLink :to="'/best-time-to-visit/' + p.slug">{{ p.display }}</NuxtLink><span class="sub">{{ p.country }} · {{ u.temp(p.high) }}{{ u.tempUnit.value }} / {{ u.temp(p.low) }}{{ u.tempUnit.value }} · {{ u.rain(p.rain) }} rain</span></span><span class="score">{{ p.city }}</span></li>
    </ol>

    <h2>Best for sun and beach weather in {{ m }}</h2>
    <ol class="rank">
      <li v-for="p in data.warm" :key="p.slug"><span><NuxtLink :to="'/best-time-to-visit/' + p.slug">{{ p.display }}</NuxtLink><span class="sub">{{ p.country }} · {{ u.temp(p.high) }}{{ u.tempUnit.value }} / {{ u.temp(p.low) }}{{ u.tempUnit.value }} · {{ u.rain(p.rain) }} rain</span></span><span class="score">{{ p.warm }}</span></li>
    </ol>
    <p class="note" style="margin-top: 18px">Scores run from 0 to 100 and only describe weather. They do not account for crowds, prices or events.</p>
  </main>
</template>
