// Nutrition logic — ported verbatim from nutrition-dashboard.html.
// All functions are pure (no React, no localStorage, no side effects).
import { FOODS, MICRO_META, scale, getProfile } from '../data/foodData.js';

// ── Food input parsing ────────────────────────────────────────────────────────
// Accepts: "200g chicken breast" / "2 eggs" / "1 scoop whey" / "chicken breast"
// Returns: { grams?, units?, rest }
export function parseQty(text) {
  const t = text.trim().toLowerCase();
  let m = t.match(/^(\d+(?:\.\d+)?)\s*(g|gram|grams)\b\s*(.*)$/);
  if (m) return { grams: parseFloat(m[1]), rest: m[3] };
  m = t.match(/^(\d+(?:\.\d+)?)\s*(scoop|scoops|tbsp|cup|cups|oz|piece|pieces|medium|large)?\s+(.*)$/);
  if (m) return { units: parseFloat(m[1]), rest: m[3] };
  return { rest: t };
}

// ── Fuzzy food lookup ─────────────────────────────────────────────────────────
// Scores each food by what fraction of the query words match name+brand words.
// Uses bidirectional prefix matching so "eggs" finds "egg" and vice-versa.
// Returns the best match if score ≥ 0.5, else null.
export function findFood(rest) {
  if (!rest) return null;
  let best = null, bestScore = 0;
  for (const f of FOODS) {
    const hay      = (f.name + ' ' + (f.brand || '')).toLowerCase();
    const hayWords = hay.replace(/[^a-z\s]/g, '').split(/\s+/).filter(Boolean);
    const words    = rest.split(/\s+/).filter(Boolean);
    let hits = 0;
    for (const w of words) {
      for (const hw of hayWords) {
        if (hw.startsWith(w) || w.startsWith(hw)) { hits++; break; }
      }
    }
    const score = hits / Math.max(words.length, 1);
    if (score > bestScore) { bestScore = score; best = f; }
  }
  return bestScore >= 0.5 ? best : null;
}

// ── Daily totals ──────────────────────────────────────────────────────────────
// Sums macros and micros across a log array, scaling each entry by its grams.
// Returns { kcal, protein, carb, fat, fiber, micro: { <key>: number } }
export function calcTotals(log) {
  const t     = { kcal: 0, protein: 0, carb: 0, fat: 0, fiber: 0 };
  const micro = {};
  Object.keys(MICRO_META).forEach(k => { micro[k] = 0; });

  for (const entry of log) {
    const profile = getProfile(entry);
    for (const k in t)     t[k]     += scale(profile.macros[k], entry.grams) || 0;
    for (const k in micro) micro[k] += scale(profile.micros[k], entry.grams) || 0;
  }

  return { ...t, micro };
}
