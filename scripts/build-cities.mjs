// One-off: builds data/cities.json from GeoNames (via the all-the-cities npm package) plus a hand-picked list of
// travel destinations. Run with:  npm i --no-save all-the-cities && node scripts/build-cities.mjs
import { createRequire } from 'node:module'
import { writeFileSync } from 'node:fs'
const require = createRequire(import.meta.url)
const all = require('all-the-cities')

const MIN_POP = 700000

// Travel destinations that are small or not a "city" in GeoNames terms. [name, country code, lat, lon, tags]
// tags: ski = winter sports resort, island = island or resort region
const EXTRA = [
  ['Santorini', 'GR', 36.3932, 25.4615, ['island']], ['Mykonos', 'GR', 37.4467, 25.3289, ['island']], ['Crete (Heraklion)', 'GR', 35.3387, 25.1442, ['island']],
  ['Rhodes', 'GR', 36.4349, 28.2176, ['island']], ['Corfu', 'GR', 39.6243, 19.9217, ['island']],
  ['Dubrovnik', 'HR', 42.6507, 18.0944, []], ['Split', 'HR', 43.5081, 16.4402, []], ['Hvar', 'HR', 43.1729, 16.4413, ['island']], ['Zadar', 'HR', 44.1194, 15.2314, []],
  ['Ljubljana', 'SI', 46.0569, 14.5058, []], ['Bled', 'SI', 46.3683, 14.1146, []], ['Piran', 'SI', 45.5283, 13.5683, []],
  ['Venice', 'IT', 45.4408, 12.3155, []], ['Florence', 'IT', 43.7696, 11.2558, []], ['Amalfi', 'IT', 40.6340, 14.6027, []], ['Verona', 'IT', 45.4384, 10.9916, []],
  ['Bologna', 'IT', 44.4949, 11.3426, []], ['Pisa', 'IT', 43.7228, 10.4017, []], ['Palermo', 'IT', 38.1157, 13.3615, []], ['Cagliari', 'IT', 39.2238, 9.1217, []],
  ['Lake Como', 'IT', 45.9937, 9.2570, []], ['Cortina d\'Ampezzo', 'IT', 46.5405, 12.1357, ['ski']],
  ['Zermatt', 'CH', 46.0207, 7.7491, ['ski']], ['Interlaken', 'CH', 46.6863, 7.8632, []], ['Lucerne', 'CH', 47.0502, 8.3093, []], ['Davos', 'CH', 46.8027, 9.8360, ['ski']],
  ['St. Moritz', 'CH', 46.4908, 9.8355, ['ski']], ['Chamonix', 'FR', 45.9237, 6.8694, ['ski']], ['Nice', 'FR', 43.7102, 7.2620, []], ['Cannes', 'FR', 43.5528, 7.0174, []],
  ['Bordeaux', 'FR', 44.8378, -0.5792, []], ['Strasbourg', 'FR', 48.5734, 7.7521, []], ['Innsbruck', 'AT', 47.2692, 11.4041, ['ski']], ['Salzburg', 'AT', 47.8095, 13.0550, []],
  ['Kitzbuhel', 'AT', 47.4464, 12.3924, ['ski']], ['St. Anton am Arlberg', 'AT', 47.1296, 10.2680, ['ski']], ['Hallstatt', 'AT', 47.5622, 13.6493, []],
  ['Munich', 'DE', 48.1351, 11.5820, []], ['Cologne', 'DE', 50.9375, 6.9603, []], ['Dresden', 'DE', 51.0504, 13.7373, []], ['Heidelberg', 'DE', 49.3988, 8.6724, []],
  ['Bruges', 'BE', 51.2093, 3.2247, []], ['Brussels', 'BE', 50.8503, 4.3517, []], ['Porto', 'PT', 41.1579, -8.6291, []], ['Algarve (Faro)', 'PT', 37.0194, -7.9304, []],
  ['Madeira (Funchal)', 'PT', 32.6669, -16.9241, ['island']], ['Azores (Ponta Delgada)', 'PT', 37.7412, -25.6756, ['island']],
  ['Malaga', 'ES', 36.7213, -4.4214, []], ['Seville', 'ES', 37.3891, -5.9845, []], ['Granada', 'ES', 37.1773, -3.5986, []], ['San Sebastian', 'ES', 43.3183, -1.9812, []],
  ['Palma de Mallorca', 'ES', 39.5696, 2.6502, ['island']], ['Ibiza', 'ES', 38.9067, 1.4206, ['island']], ['Tenerife', 'ES', 28.2916, -16.6291, ['island']],
  ['Gran Canaria (Las Palmas)', 'ES', 28.1235, -15.4363, ['island']], ['Lanzarote', 'ES', 28.9630, -13.5477, ['island']], ['Menorca (Mahon)', 'ES', 39.8885, 4.2658, ['island']],
  ['Malta (Valletta)', 'MT', 35.8989, 14.5146, ['island']], ['Cyprus (Paphos)', 'CY', 34.7754, 32.4245, ['island']], ['Edinburgh', 'GB', 55.9533, -3.1883, []],
  ['Oxford', 'GB', 51.7520, -1.2577, []], ['Cambridge', 'GB', 52.2053, 0.1218, []], ['Bath', 'GB', 51.3811, -2.3590, []], ['York', 'GB', 53.9600, -1.0873, []],
  ['Cork', 'IE', 51.8985, -8.4756, []], ['Galway', 'IE', 53.2707, -9.0568, []], ['Reykjavik', 'IS', 64.1466, -21.9426, []], ['Tromso', 'NO', 69.6492, 18.9553, []],
  ['Bergen', 'NO', 60.3913, 5.3221, []], ['Rovaniemi', 'FI', 66.5039, 25.7294, []], ['Tallinn', 'EE', 59.4370, 24.7536, []], ['Riga', 'LV', 56.9496, 24.1052, []],
  ['Vilnius', 'LT', 54.6872, 25.2797, []], ['Krakow', 'PL', 50.0647, 19.9450, []], ['Gdansk', 'PL', 54.3520, 18.6466, []], ['Zakopane', 'PL', 49.2992, 19.9496, ['ski']],
  ['Bratislava', 'SK', 48.1486, 17.1077, []], ['Sofia', 'BG', 42.6977, 23.3219, []], ['Bansko', 'BG', 41.8386, 23.4886, ['ski']], ['Kotor', 'ME', 42.4247, 18.7712, []],
  ['Tirana', 'AL', 41.3275, 19.8187, []], ['Sarajevo', 'BA', 43.8563, 18.4131, []], ['Mostar', 'BA', 43.3438, 17.8078, []], ['Tbilisi', 'GE', 41.7151, 44.8271, []],
  ['Yerevan', 'AM', 40.1792, 44.4991, []], ['Antalya', 'TR', 36.8969, 30.7133, []], ['Cappadocia (Goreme)', 'TR', 38.6431, 34.8289, []], ['Bodrum', 'TR', 37.0344, 27.4305, []],
  ['Marrakech', 'MA', 31.6295, -7.9811, []], ['Fes', 'MA', 34.0181, -5.0078, []], ['Essaouira', 'MA', 31.5085, -9.7595, []], ['Tunis', 'TN', 36.8065, 10.1815, []],
  ['Luxor', 'EG', 25.6872, 32.6396, []], ['Sharm El Sheikh', 'EG', 27.9158, 34.3300, []], ['Hurghada', 'EG', 27.2579, 33.8116, []], ['Aswan', 'EG', 24.0889, 32.8998, []],
  ['Zanzibar', 'TZ', -6.1659, 39.2026, ['island']], ['Arusha (Serengeti safaris)', 'TZ', -3.3869, 36.6830, []], ['Mombasa', 'KE', -4.0435, 39.6682, []],
  ['Victoria Falls', 'ZW', -17.9243, 25.8572, []], ['Cape Town', 'ZA', -33.9249, 18.4241, []], ['Mauritius (Port Louis)', 'MU', -20.1609, 57.5012, ['island']],
  ['Seychelles (Victoria)', 'SC', -4.6191, 55.4513, ['island']], ['Petra (Wadi Musa)', 'JO', 30.3285, 35.4444, []], ['Muscat', 'OM', 23.5880, 58.3829, []], ['Abu Dhabi', 'AE', 24.4539, 54.3773, []],
  ['Doha', 'QA', 25.2854, 51.5310, []], ['Jerusalem', 'IL', 31.7683, 35.2137, []], ['Eilat', 'IL', 29.5577, 34.9519, []],
  ['Goa (Panaji)', 'IN', 15.4909, 73.8278, []], ['Jaipur', 'IN', 26.9124, 75.7873, []], ['Agra', 'IN', 27.1767, 78.0081, []], ['Varanasi', 'IN', 25.3176, 82.9739, []],
  ['Udaipur', 'IN', 24.5854, 73.7125, []], ['Kerala (Kochi)', 'IN', 9.9312, 76.2673, []], ['Leh', 'IN', 34.1526, 77.5771, []], ['Kathmandu', 'NP', 27.7172, 85.3240, []],
  ['Pokhara', 'NP', 28.2096, 83.9856, []], ['Colombo', 'LK', 6.9271, 79.8612, []], ['Kandy', 'LK', 7.2906, 80.6337, []], ['Male (Maldives)', 'MV', 4.1755, 73.5093, ['island']],
  ['Thimphu', 'BT', 27.4728, 89.6390, []], ['Phuket', 'TH', 7.8804, 98.3923, ['island']], ['Chiang Mai', 'TH', 18.7883, 98.9853, []], ['Koh Samui', 'TH', 9.5120, 100.0136, ['island']],
  ['Krabi', 'TH', 8.0863, 98.9063, []], ['Pattaya', 'TH', 12.9236, 100.8825, []], ['Siem Reap', 'KH', 13.3671, 103.8448, []], ['Luang Prabang', 'LA', 19.8856, 102.1347, []],
  ['Hanoi', 'VN', 21.0285, 105.8542, []], ['Da Nang', 'VN', 16.0544, 108.2022, []], ['Hoi An', 'VN', 15.8801, 108.3380, []], ['Ha Long Bay', 'VN', 20.9101, 107.1839, []],
  ['Sapa', 'VN', 22.3364, 103.8438, []], ['Phu Quoc', 'VN', 10.2899, 103.9840, ['island']], ['Bali (Denpasar)', 'ID', -8.6705, 115.2126, ['island']], ['Ubud', 'ID', -8.5069, 115.2625, []],
  ['Yogyakarta', 'ID', -7.7956, 110.3695, []], ['Lombok (Mataram)', 'ID', -8.5833, 116.1167, ['island']], ['Langkawi', 'MY', 6.3500, 99.8000, ['island']], ['Penang (George Town)', 'MY', 5.4141, 100.3288, ['island']],
  ['Kota Kinabalu', 'MY', 5.9804, 116.0735, []], ['Boracay', 'PH', 11.9674, 121.9248, ['island']], ['Cebu', 'PH', 10.3157, 123.8854, []], ['Palawan (El Nido)', 'PH', 11.1784, 119.3938, ['island']],
  ['Kyoto', 'JP', 35.0116, 135.7681, []], ['Osaka', 'JP', 34.6937, 135.5023, []], ['Nara', 'JP', 34.6851, 135.8048, []], ['Hiroshima', 'JP', 34.3853, 132.4553, []],
  ['Sapporo', 'JP', 43.0618, 141.3545, ['ski']], ['Niseko', 'JP', 42.8048, 140.6874, ['ski']], ['Okinawa (Naha)', 'JP', 26.2124, 127.6809, ['island']], ['Hakone', 'JP', 35.2324, 139.1069, []],
  ['Jeju', 'KR', 33.4996, 126.5312, ['island']], ['Busan', 'KR', 35.1796, 129.0756, []], ['Macau', 'MO', 22.1987, 113.5439, []], ['Taipei', 'TW', 25.0330, 121.5654, []],
  ['Lijiang', 'CN', 26.8721, 100.2299, []], ['Guilin', 'CN', 25.2736, 110.2907, []], ['Ulaanbaatar', 'MN', 47.8864, 106.9057, []],
  ['Sydney', 'AU', -33.8688, 151.2093, []], ['Cairns', 'AU', -16.9186, 145.7781, []], ['Gold Coast', 'AU', -28.0167, 153.4000, []], ['Uluru (Ayers Rock)', 'AU', -25.3444, 131.0369, []],
  ['Hobart', 'AU', -42.8821, 147.3272, []], ['Queenstown', 'NZ', -45.0312, 168.6626, ['ski']], ['Rotorua', 'NZ', -38.1368, 176.2497, []], ['Wellington', 'NZ', -41.2865, 174.7762, []],
  ['Fiji (Nadi)', 'FJ', -17.8000, 177.4167, ['island']], ['Tahiti (Papeete)', 'PF', -17.5516, -149.5585, ['island']], ['Honolulu', 'US', 21.3069, -157.8583, ['island']], ['Maui (Kahului)', 'US', 20.8893, -156.4729, ['island']],
  ['Kauai (Lihue)', 'US', 21.9811, -159.3711, ['island']], ['Las Vegas', 'US', 36.1699, -115.1398, []], ['Orlando', 'US', 28.5383, -81.3792, []], ['Miami', 'US', 25.7617, -80.1918, []],
  ['Key West', 'US', 24.5551, -81.7800, []], ['New Orleans', 'US', 29.9511, -90.0715, []], ['San Diego', 'US', 32.7157, -117.1611, []], ['Seattle', 'US', 47.6062, -122.3321, []],
  ['Portland', 'US', 45.5152, -122.6784, []], ['Boston', 'US', 42.3601, -71.0589, []], ['Washington DC', 'US', 38.9072, -77.0369, []], ['Nashville', 'US', 36.1627, -86.7816, []],
  ['Savannah', 'US', 32.0809, -81.0912, []], ['Charleston', 'US', 32.7765, -79.9311, []], ['Santa Fe', 'US', 35.6870, -105.9378, []], ['Sedona', 'US', 34.8697, -111.7610, []],
  ['Anchorage', 'US', 61.2181, -149.9003, []], ['Yellowstone (West Yellowstone)', 'US', 44.6621, -111.1041, []], ['Grand Canyon Village', 'US', 36.0544, -112.1401, []], ['Aspen', 'US', 39.1911, -106.8175, ['ski']],
  ['Park City', 'US', 40.6461, -111.4980, ['ski']], ['Lake Tahoe (South Lake Tahoe)', 'US', 38.9399, -119.9772, ['ski']], ['Vail', 'US', 39.6403, -106.3742, ['ski']], ['Jackson Hole', 'US', 43.4799, -110.7624, ['ski']],
  ['Banff', 'CA', 51.1784, -115.5708, ['ski']], ['Whistler', 'CA', 50.1163, -122.9574, ['ski']], ['Vancouver', 'CA', 49.2827, -123.1207, []], ['Quebec City', 'CA', 46.8139, -71.2080, []],
  ['Niagara Falls', 'CA', 43.0896, -79.0849, []], ['Cancun', 'MX', 21.1619, -86.8515, []], ['Tulum', 'MX', 20.2114, -87.4654, []], ['Playa del Carmen', 'MX', 20.6296, -87.0739, []],
  ['Los Cabos (Cabo San Lucas)', 'MX', 22.8905, -109.9167, []], ['Puerto Vallarta', 'MX', 20.6534, -105.2253, []], ['Oaxaca', 'MX', 17.0732, -96.7266, []], ['Havana', 'CU', 23.1136, -82.3666, []],
  ['Punta Cana', 'DO', 18.5601, -68.3725, []], ['Montego Bay', 'JM', 18.4762, -77.8939, []], ['Nassau', 'BS', 25.0478, -77.3554, ['island']], ['Aruba (Oranjestad)', 'AW', 12.5211, -70.0270, ['island']],
  ['Barbados (Bridgetown)', 'BB', 13.0969, -59.6145, ['island']], ['San Juan', 'PR', 18.4655, -66.1057, []], ['Costa Rica (San Jose)', 'CR', 9.9281, -84.0907, []], ['Panama City', 'PA', 8.9824, -79.5199, []],
  ['Cartagena', 'CO', 10.3910, -75.4794, []], ['Quito', 'EC', -0.1807, -78.4678, []], ['Galapagos (Puerto Ayora)', 'EC', -0.7393, -90.3131, ['island']], ['Cusco', 'PE', -13.5319, -71.9675, []],
  ['La Paz', 'BO', -16.4897, -68.1193, []], ['Uyuni', 'BO', -20.4637, -66.8260, []], ['Rio de Janeiro', 'BR', -22.9068, -43.1729, []], ['Florianopolis', 'BR', -27.5954, -48.5480, []],
  ['Foz do Iguacu', 'BR', -25.5163, -54.5854, []], ['Salvador', 'BR', -12.9777, -38.5016, []], ['Buenos Aires', 'AR', -34.6037, -58.3816, []], ['Mendoza', 'AR', -32.8895, -68.8458, []],
  ['Ushuaia', 'AR', -54.8019, -68.3030, []], ['Bariloche', 'AR', -41.1335, -71.3103, ['ski']], ['El Calafate', 'AR', -50.3379, -72.2648, []], ['Santiago', 'CL', -33.4489, -70.6693, []],
  ['Torres del Paine (Puerto Natales)', 'CL', -51.7236, -72.4975, []], ['Easter Island (Hanga Roa)', 'CL', -27.1127, -109.3497, ['island']], ['Montevideo', 'UY', -34.9011, -56.1645, []],
]

const slugify = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const distKm = (a, b) => { const r = Math.PI / 180, dLat = (b.lat - a.lat) * r, dLon = (b.lon - a.lon) * r; const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLon / 2) ** 2; return 12742 * Math.asin(Math.sqrt(h)) }
const round = (n) => Math.round(n * 1000) / 1000

const out = []
for (const [name, cc, lat, lon, tags] of EXTRA) out.push({ name, cc, lat, lon, tags, pop: 0, curated: true })
for (const c of [...all].sort((a, b) => b.population - a.population)) {
  const okCode = ['PPL', 'PPLA', 'PPLA2', 'PPLA3', 'PPLC', 'PPLG'].includes(c.featureCode)
  if (!okCode) continue
  if (!(c.population >= MIN_POP || (c.featureCode === 'PPLC' && c.population >= 150000))) continue
  const lon = c.loc.coordinates[0], lat = c.loc.coordinates[1]
  const city = { name: c.name, cc: c.country, lat: round(lat), lon: round(lon), tags: [], pop: c.population }
  // skip if a curated destination with a similar name or within 25 km already covers it
  const dupe = out.find((o) => o.cc === city.cc && (slugify(o.name) === slugify(city.name) || slugify(o.name).startsWith(slugify(city.name)) || distKm(o, city) < 30))
  if (dupe) { dupe.pop = Math.max(dupe.pop, city.pop); continue }
  out.push(city)
}
const seen = new Map()
for (const c of out.sort((a, b) => b.pop - a.pop || a.name.localeCompare(b.name))) {
  let slug = slugify(c.name.replace(/\(.*\)/, '')) || slugify(c.name)
  if (seen.has(slug)) slug = slug + '-' + c.cc.toLowerCase()
  if (seen.has(slug)) slug = slug + '-' + seen.size
  seen.set(slug, true)
  c.slug = slug
  c.lat = round(c.lat); c.lon = round(c.lon)
}
out.forEach((c) => { c.display = c.name.replace(/\s*\(.*\)/, '').trim() })
writeFileSync(new URL('../data/cities.json', import.meta.url), JSON.stringify(out.map(({ slug, name, display, cc, lat, lon, tags, pop }) => ({ slug, name: display === name ? name : name, display, cc, lat, lon, tags, pop }))))
console.log('cities:', out.length)
