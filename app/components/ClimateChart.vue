<script setup>
import { MONTHS_SHORT, verdict } from '#shared/utils/climate.js'
const props = defineProps({ scores: { type: Array, required: true }, best: { type: Array, default: () => [] }, title: { type: String, default: '' } })
const W = 760, H = 310, left = 14, base = 252, top = 40, step = (W - left * 2) / 12, bw = step * 0.66
const bars = computed(() =>
  props.scores.map((s, i) => {
    const h = Math.max(4, (s / 100) * (base - top))
    const isBest = props.best.includes(i)
    return { i, s, x: left + i * step + (step - bw) / 2, y: base - h, h, isBest, fill: isBest ? '#f59e0b' : `hsl(200 62% ${Math.round(84 - s * 0.5)}%)` }
  }),
)
const label = computed(() => `${props.title}. Comfort score by month: ` + props.scores.map((s, i) => `${MONTHS_SHORT[i]} ${s} (${verdict(s)})`).join(', '))
</script>

<template>
  <svg class="chart" :viewBox="`0 0 ${W} ${H}`" role="img" :aria-label="label">
    <g stroke="#d5e3ec" stroke-width="1">
      <line v-for="v in [0, 25, 50, 75, 100]" :key="v" :x1="left" :x2="W - left" :y1="base - (v / 100) * (base - top)" :y2="base - (v / 100) * (base - top)" :stroke-dasharray="v === 0 ? '' : '4 5'" />
    </g>
    <g v-for="b in bars" :key="b.i">
      <rect :x="b.x" :y="b.y" :width="bw" :height="b.h" rx="7" :fill="b.fill" />
      <text :x="b.x + bw / 2" :y="b.y - 8" text-anchor="middle" font-size="17" font-weight="800" fill="#0f2438">{{ b.s }}</text>
      <text :x="b.x + bw / 2" :y="base + 26" text-anchor="middle" font-size="16" :font-weight="b.isBest ? 800 : 600" :fill="b.isBest ? '#78350f' : '#4a6074'">{{ MONTHS_SHORT[b.i] }}</text>
    </g>
    <text :x="left" y="22" font-size="15" font-weight="700" fill="#4a6074">Comfort score, 0 to 100 (higher is better). Amber bars are the best months.</text>
  </svg>
</template>
