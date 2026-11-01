import { toF, kmToMph, mmToIn } from '#shared/utils/climate.js'

// Temperature, wind and rain in the unit the visitor picked. Server render is metric; the browser switches after load.
export function useUnits() {
  const units = useState('units', () => 'c')
  const imperial = computed(() => units.value === 'f')
  return {
    imperial,
    temp: (c) => (imperial.value ? toF(c) : Math.round(c)),
    tempUnit: computed(() => (imperial.value ? '°F' : '°C')),
    wind: (kmh) => (imperial.value ? kmToMph(kmh) + ' mph' : Math.round(kmh) + ' km/h'),
    rain: (mm) => (imperial.value ? mmToIn(mm) + ' in' : Math.round(mm) + ' mm'),
  }
}

export function useSiteUrl() {
  return (useRuntimeConfig().public.siteUrl || '').replace(/\/$/, '')
}
