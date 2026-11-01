<script setup>
const q = ref('')
const open = ref(false)
const active = ref(0)
let list = null
const results = ref([])
async function ensure() {
  if (!list) {
    const [c, names] = await Promise.all([import('~~/data/cities.json'), Promise.resolve(new Intl.DisplayNames(['en'], { type: 'region' }))])
    list = (c.default || c).map((x) => ({ slug: x.slug, name: x.display, country: names.of(x.cc) || x.cc, key: (x.display + ' ' + (names.of(x.cc) || '')).toLowerCase(), pop: x.pop }))
  }
}
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
watch(q, async (v) => {
  await ensure()
  const t = norm(v.trim())
  if (!t) { results.value = []; return }
  const hits = list.filter((x) => norm(x.key).includes(t))
  hits.sort((a, b) => (norm(a.name).startsWith(t) ? 0 : 1) - (norm(b.name).startsWith(t) ? 0 : 1) || b.pop - a.pop)
  results.value = hits.slice(0, 8)
  active.value = 0
  open.value = true
})
function go(r) { if (r) { open.value = false; navigateTo('/best-time-to-visit/' + r.slug) } }
function onBlur() { setTimeout(() => { open.value = false }, 150) }
function key(e) {
  if (e.key === 'ArrowDown') { active.value = Math.min(active.value + 1, results.value.length - 1); e.preventDefault() }
  else if (e.key === 'ArrowUp') { active.value = Math.max(active.value - 1, 0); e.preventDefault() }
  else if (e.key === 'Enter') { go(results.value[active.value]); e.preventDefault() }
  else if (e.key === 'Escape') open.value = false
}
</script>

<template>
  <div class="search" role="search">
    <input v-model="q" type="search" role="combobox" aria-label="Search a city or destination" placeholder="Search a city or destination, for example Lisbon" autocomplete="off" :aria-expanded="open && results.length > 0" aria-controls="sb-list" @focus="ensure" @keydown="key" @blur="onBlur" />
    <ul v-if="open && results.length" id="sb-list" role="listbox">
      <li v-for="(r, i) in results" :key="r.slug" role="option" :aria-selected="i === active" @mousedown.prevent="go(r)">{{ r.name }} <span>{{ r.country }}</span></li>
    </ul>
  </div>
</template>
