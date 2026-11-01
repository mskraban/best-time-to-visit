<script setup>
const units = useState('units', () => 'c')
onMounted(() => {
  try {
    const saved = localStorage.getItem('btv:units')
    if (saved === 'c' || saved === 'f') units.value = saved
    else if (/^en-US/i.test(navigator.language || '')) units.value = 'f'
  } catch (e) { /* ignore */ }
})
function setUnits(u) {
  units.value = u
  try { localStorage.setItem('btv:units', u) } catch (e) { /* ignore */ }
}
const config = useRuntimeConfig()
useHead({
  script: [
    { innerHTML: 'window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };' },
    { src: '/_vercel/insights/script.js', defer: true },
  ],
})
</script>

<template>
  <div>
    <header class="top">
      <NuxtLink to="/" class="brand"><img src="/favicon.svg" alt="" width="34" height="34" /> Best Time to Visit</NuxtLink>
      <nav aria-label="Main">
        <NuxtLink to="/where-to-go/january">Where to go by month</NuxtLink>
        <NuxtLink to="/#destinations">All destinations</NuxtLink>
        <span class="units" role="group" aria-label="Temperature unit">
          <button type="button" :aria-pressed="units === 'c'" @click="setUnits('c')">°C</button>
          <button type="button" :aria-pressed="units === 'f'" @click="setUnits('f')">°F</button>
        </span>
      </nav>
    </header>
    <NuxtPage />
    <footer class="foot">
      <div class="in">
        <p><b>Best Time to Visit</b> ranks the months for every destination by weather: temperature, rain, sunshine and wind. It does not know about crowds, prices, events or school holidays, so check those before you book.</p>
        <p>Climate data: <a href="https://power.larc.nasa.gov/" rel="noopener">NASA POWER</a>, monthly averages for 10 years on a grid of roughly 50 km, so mountain and coastal spots can feel different from the number. Free, no accounts, no cookies. The hosted site counts anonymous page views (Vercel Web Analytics).</p>
      </div>
    </footer>
  </div>
</template>
