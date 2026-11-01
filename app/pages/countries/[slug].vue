<script setup>
const slug = useRoute().params.slug
const { data, error } = await useAsyncData('country-' + slug, () => $fetch('/api/country/' + slug))
if (error.value || !data.value) throw createError({ statusCode: 404, statusMessage: 'Country not found', fatal: true })
const site = useSiteUrl()
const n = data.value.name
const title = `Best Time to Visit ${n}: Weather by Month for ${data.value.places.length} Destinations`
const desc = `Find the best time to visit ${n}. Best months and weather by month for ${data.value.places.slice(0, 4).map((p) => p.display).join(', ')} and more.`
useSeoMeta({ title, description: desc, ogTitle: title, ogDescription: desc, ogImage: site + '/og.png', twitterCard: 'summary_large_image' })
useHead({ link: [{ rel: 'canonical', href: `${site}/countries/${slug}` }] })
</script>

<template>
  <main class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb"><NuxtLink to="/">Home</NuxtLink> › {{ n }}</nav>
    <h1>Best time to visit {{ n }}</h1>
    <p class="lead">The best months for {{ data.places.length }} destinations in {{ n }}, ranked by size. Each page has the weather for every month.</p>
    <ul class="rank">
      <li v-for="p in data.places" :key="p.slug"><NuxtLink :to="'/best-time-to-visit/' + p.slug">{{ p.display }}<span class="sub">Best: {{ p.best }}</span></NuxtLink></li>
    </ul>
  </main>
</template>
