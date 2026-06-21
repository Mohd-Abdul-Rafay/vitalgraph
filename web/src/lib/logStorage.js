// Per-day nutrition log persistence.
// Storage key: "nutrition-log" — distinct from "nutrition-profile" and "nutrition-usda-foods".
// Format: { "YYYY-MM-DD": [ { foodId, grams, variantId } ] }
// USDA foods are re-linked on load via the USDA localStorage cache.

import { FOOD_BY_ID } from '../data/foodData.js'
import { usdaCacheGet } from './usda.js'

const LOG_KEY = 'nutrition-log'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

// Reconstruct a human-readable quantity label from stored grams.
// Mirrors the displayQty logic used at log-time so restored entries look the same.
function deriveDisplayQty(food, grams) {
  if (!food.unit || food.unit.type === 'gram') return `${grams}g`
  const count   = grams / food.unit.gramsEach
  const rounded = Math.round(count * 10) / 10
  return `${rounded} ${food.unit.label}${rounded !== 1 ? 's' : ''}`
}

// Load today's log from localStorage, re-hydrating full food objects.
// Returns [] on any error or if nothing is stored for today.
export function loadTodayLog() {
  try {
    const raw = localStorage.getItem(LOG_KEY)
    if (!raw) return []
    const all = JSON.parse(raw)
    return (all[todayStr()] || []).map(e => {
      // Local foods: FOOD_BY_ID returns undefined → falls through to USDA cache
      const food = FOOD_BY_ID(e.foodId) ?? usdaCacheGet(e.foodId)
      if (!food) return null   // entry references a food we no longer know about
      return {
        uid:        crypto.randomUUID(),
        food,
        grams:      e.grams,
        variantId:  e.variantId ?? null,
        displayQty: deriveDisplayQty(food, e.grams),
      }
    }).filter(Boolean)
  } catch { return [] }
}

// Persist today's log. Stores only the minimal data needed to restore entries.
// Other dates in the store are left untouched.
export function saveTodayLog(log) {
  try {
    const raw = localStorage.getItem(LOG_KEY)
    const all = raw ? JSON.parse(raw) : {}
    all[todayStr()] = log.map(e => ({
      foodId:    e.food.id,
      grams:     e.grams,
      variantId: e.variantId ?? null,
    }))
    localStorage.setItem(LOG_KEY, JSON.stringify(all))
  } catch {}
}
