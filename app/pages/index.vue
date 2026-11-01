<script setup>
import { MONTHS } from '#shared/utils/climate.js'
const { data } = await useAsyncData('index', () => $fetch('/api/destinations'))
const site = useSiteUrl()
const months = MONTHS.map((m) => ({ name: m, slug: m.toLowerCase() }))
const title = 'Best Time to Visit: Weather by Month for ' + (data.value?.total || 700) + ' Destinations'
const desc = 'When is the best time to visit? Compare temperature, rainfall and sunshine month by month for cities and travel destinations around the world, and find the perfect month for your trip.'
useSeoMeta({ title, description: desc, ogTitle: title, ogDescription: desc, ogType: 'website', ogImage: site + '/og.png', twitterCard: 'summary_large_image' })
useHead({ link: [{ rel: 'canonical', href: site + '/' }] })
</script>

<template>
  <main class="wrap">
    <section class="hero">
      <h1>When is the best time to visit?</h1>
      <p class="lead">Pick a destination and see which months give you the best weather, with temperature, rain and sunshine for every month of the year.</p>
      <SearchBox />
      <p class="note">{{ data.total }} destinations. Free, no sign-up.</p>
    </section>

    <h2>Popular destinations</h2>
    <div class="chips">
      <NuxtLink v-for="f in data.featured" :key="f.slug" class="chip" :to="'/best-time-to-visit/' + f.slug"><b>{{ f.display }}</b><span>Best: {{ f.best }}</span></NuxtLink>
    </div>

    <h2>Where to go this month?</h2>
    <p class="muted">Pick the month you can travel and see the destinations with the best weather then.</p>
    <nav class="monthnav" aria-label="Months"><NuxtLink v-for="m in months" :key="m.slug" :to="'/where-to-go/' + m.slug">{{ m.name }}</NuxtLink></nav>

    <h2>Browse by country</h2>
    <ul class="cols">
      <li v-for="c in data.countries" :key="c.slug"><NuxtLink :to="'/countries/' + c.slug">{{ c.name }}</NuxtLink> <span class="muted">({{ c.count }})</span></li>
    </ul>

    <h2 id="destinations">All destinations</h2>
    <ul class="cols">
      <li v-for="d in data.all" :key="d.slug"><NuxtLink :to="'/best-time-to-visit/' + d.slug">{{ d.name }}</NuxtLink> <span class="muted">{{ d.cc }}</span></li>
    </ul>
  </main>
</template>
