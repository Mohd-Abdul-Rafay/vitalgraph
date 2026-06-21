// USDA FoodData Central helpers
// Pure functions — no React, no import.meta.env.
// API key is passed by callers (read from import.meta.env in the component).

const USDA_CACHE_KEY = 'nutrition-usda-foods'

// ── localStorage cache ────────────────────────────────────────────────────────
export function usdaCacheGet(id) {
  try {
    const raw = localStorage.getItem(USDA_CACHE_KEY)
    if (!raw) return null
    return JSON.parse(raw)[id] ?? null
  } catch { return null }
}

export function usdaCachePut(food) {
  try {
    const raw = localStorage.getItem(USDA_CACHE_KEY)
    const cache = raw ? JSON.parse(raw) : {}
    cache[food.id] = food
    localStorage.setItem(USDA_CACHE_KEY, JSON.stringify(cache))
  } catch {}
}

// ── Nutrient ID maps (ported verbatim from nutrition-dashboard.html) ──────────
// Amino acid USDA IDs → app keys. USDA reports g/100g; app stores mg/100g.
const USDA_AMINO_IDS = {
  histidine:    1221, isoleucine: 1212, leucine:  1213, lysine:       1214,
  methionine:   1215, phenylalanine: 1217, threonine: 1211, tryptophan: 1210,
  valine:       1219, alanine:    1222, arginine: 1220, aspartate:    1223,
  cystine:      1216, glutamate:  1224, glycine:  1225, proline:      1226,
  serine:       1227, tyrosine:   1218,
}

// ── Map a USDA /food/{fdcId} response → app food structure ───────────────────
export function mapUsdaFood(d) {
  const nu  = d.foodNutrients || []
  const get = id => {
    const n = nu.find(n => n.nutrient && n.nutrient.id === id)
    return n?.amount ?? null
  }

  // Amino acids: convert g/100g → mg/100g; null = not reported
  const aminoMap = {}
  let anyAmino = false
  for (const [key, id] of Object.entries(USDA_AMINO_IDS)) {
    const v = get(id)
    aminoMap[key] = v != null ? Math.round(v * 1000) : null
    if (v != null) anyAmino = true
  }

  return {
    id:       `usda_${d.fdcId}`,
    name:     d.description,
    category: 'usda',
    perUnit:  { label: '100g', grams: 100 },
    unit:     { type: 'gram' },
    macros: {
      kcal:    get(1008) ?? 0,
      protein: get(1003) ?? 0,
      carb:    get(1005) ?? 0,
      fat:     get(1004) ?? 0,
      fiber:   get(1079) ?? 0,
    },
    carbProfile: {
      sugars:     get(2000) ?? get(1063),
      starch:     get(1009),
      addedSugar: get(1235),
    },
    fatProfile: {
      sat:    get(1258),
      mono:   get(1292),
      poly:   get(1293),
      omega3: null,
      omega6: null,
    },
    fiberProfile: { soluble: get(1082), insoluble: get(1084) },
    amino:  anyAmino ? aminoMap : null,
    micros: {
      iron:      get(1089) ?? 0,
      calcium:   get(1087) ?? 0,
      potassium: get(1092) ?? 0,
      magnesium: get(1090) ?? 0,
      zinc:      get(1095) ?? 0,
      vitC:      get(1162) ?? 0,
      vitD:      get(1114) ?? 0,
      vitA:      get(1106) ?? 0,
      vitB12:    get(1178) ?? 0,
      folate:    get(1177) ?? 0,
      sodium:    get(1093) ?? 0,
    },
    variants: null,
  }
}
