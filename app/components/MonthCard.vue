<script setup>
import { verdict } from '#shared/utils/climate.js'
const props = defineProps({ m: { type: Object, required: true }, score: { type: Number, required: true }, best: Boolean, min: Number, max: Number })
const u = useUnits()
const v = computed(() => verdict(props.score))
const ringColor = computed(() => (props.score >= 80 ? '#16a34a' : props.score >= 65 ? '#65a30d' : props.score >= 50 ? '#d97706' : '#dc2626'))
const color = computed(() => `hsl(200 62% ${Math.round(84 - props.score * 0.5)}%)`)
const span = computed(() => Math.max(1, props.max - props.min))
const barStyle = computed(() => ({ left: ((props.m.low - props.min) / span.value) * 100 + '%', width: Math.max(4, ((props.m.high - props.m.low) / span.value) * 100) + '%' }))
</script>

<template>
  <article class="mcard" :class="{ best }" :style="{ '--c': color }">
    <header>
      <div>
        <h3>{{ m.name }}</h3>
        <div class="verdict" :class="v">{{ v }}<span v-if="best" class="star">★ Best</span></div>
      </div>
      <div class="ring" :style="{ '--p': score, '--rc': ringColor }" :aria-label="`Comfort score ${score} out of 100`"><span>{{ score }}</span></div>
    </header>
    <div class="temp">{{ u.temp(m.high) }}{{ u.tempUnit.value }} <small>/ {{ u.temp(m.low) }}{{ u.tempUnit.value }}</small></div>
    <div class="bar" aria-hidden="true"><i :style="barStyle" /></div>
    <ul class="facts">
      <li><span>Rainfall</span><b>{{ u.rain(m.rain) }}</b></li>
      <li><span>Cloud cover</span><b>{{ m.cloud }}%</b></li>
      <li><span>Wind</span><b>{{ u.wind(m.wind) }}</b></li>
      <li><span>Feels like (afternoon)</span><b>{{ u.temp(m.feels) }}{{ u.tempUnit.value }}</b></li>
    </ul>
  </article>
</template>
