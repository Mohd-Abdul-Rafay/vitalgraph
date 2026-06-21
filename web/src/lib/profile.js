// Profile calculations — ported verbatim from nutrition-dashboard.html.
// All functions are pure (no React, no localStorage, no side effects).
import { ACTIVITY } from '../data/foodData.js';

// ── BMR (Mifflin–St Jeor) ────────────────────────────────────────────────────
export function calcBMR(p) {
  // men: +5, women: −161
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age;
  return Math.round(p.sex === 'male' ? base + 5 : base - 161);
}

// ── TDEE + goal-adjusted calorie target + science macros ─────────────────────
export function calcTargets(p) {
  const act = ACTIVITY.find(a => a.id === p.activityLevel) || ACTIVITY[2];
  const bmr = calcBMR(p);
  const tdee = Math.round(bmr * act.mult);
  const floor = p.sex === 'male' ? 1500 : 1200;

  let goalKcal;
  if (p.goal === 'fat_loss') {
    const def = Math.min(p.deficitPct ?? 20, 25);
    goalKcal = Math.max(Math.round(tdee * (1 - def / 100)), floor);
  } else if (p.goal === 'muscle_gain') {
    const sur = Math.min(p.surplusPct ?? 10, 20);
    goalKcal = Math.round(tdee * (1 + sur / 100));
  } else {
    goalKcal = tdee; // recomp: eat at maintenance
  }

  // Sports-nutrition macro guidelines (per current bodyweight)
  const lbs     = p.weightKg * 2.2046;
  const protein  = Math.round(lbs * 1.0);                                // 1 g/lb
  const fatFloor = Math.round(lbs * 0.3);                                // 0.3 g/lb essential minimum
  const fat      = Math.max(Math.round(goalKcal * 0.25 / 9), fatFloor); // 25% of kcal, min floor
  const carb     = Math.max(0, Math.round((goalKcal - protein * 4 - fat * 9) / 4));
  const fiber    = Math.max(20, Math.round(goalKcal / 1000 * 14));       // 14 g / 1,000 kcal (DRI)

  return {
    kcal: goalKcal, protein, carb, fat, fiber,
    _meta: {
      bmr, tdee,
      act: act.label, actMult: act.mult,
      goal: p.goal,
      deficitPct: p.deficitPct ?? 20,
      surplusPct: p.surplusPct ?? 10,
      floor,
    },
  };
}

// ── Resolve the active targets for a profile ─────────────────────────────────
// Returns science targets normally; merges manualTargets when set.
// Fiber always stays at the science value (manualTargets never includes it).
export function resolveTargets(profile) {
  if (!profile) return { kcal: 2000, protein: 200, carb: 180, fat: 60, fiber: 30, _meta: null };
  const science = calcTargets(profile);
  if (profile.manualTargets) {
    return { ...science, ...profile.manualTargets, _meta: science._meta, _manual: true };
  }
  return science;
}

// ── Calorie safety floor ─────────────────────────────────────────────────────
export function safeFloor(sex) {
  return sex === 'male' ? 1500 : 1200;
}

// ── Live auto-balancing macro editor ─────────────────────────────────────────
// Pure version of the Onboarding applyBalance engine.
// Protein is the anchor; carbs flex when protein/fat change; fat flexes when
// carbs change. Calorie total is always locked.
//
// field:   'manualKcal' | 'manualProtein' | 'manualFat' | 'manualCarb'
// val:     new raw value for the edited field (string or number)
// context: { weightKg, currentKcal, currentProtein, currentFat }
//
// Returns: { <updated numeric fields>, warn } or null if val is not yet valid.
export function applyBalance(field, val, { weightKg, currentKcal, currentProtein, currentFat }) {
  const num = parseFloat(val);
  if (isNaN(num) || num < 0) return null;

  const lbs      = weightKg * 2.2046;
  const fatFloor = Math.round(lbs * 0.3);
  const kcal     = field === 'manualKcal'    ? num : (currentKcal    || 0);
  const protein  = field === 'manualProtein' ? num : (currentProtein || 0);
  const fat      = field === 'manualFat'     ? num : (currentFat     || 0);

  if (field === 'manualKcal') {
    // Calorie change → rebuild all three macros from science defaults
    const newP = Math.round(lbs * 1.0);
    const newF = Math.max(Math.round(kcal * 0.25 / 9), fatFloor);
    const newC = Math.max(0, Math.round((kcal - newP * 4 - newF * 9) / 4));
    const minKcal = newP * 4 + fatFloor * 9;
    const warn = kcal > 0 && kcal < minKcal
      ? `At ${Math.round(kcal).toLocaleString()} kcal, science protein (${newP} g) + minimum fat (${fatFloor} g) already exceeds target — lower protein or raise calories.`
      : '';
    return { protein: newP, fat: newF, carb: newC, warn };
  }

  if (field === 'manualProtein' || field === 'manualFat') {
    // Protein/fat change → carbs flex
    const newP    = field === 'manualProtein' ? num : protein;
    const newF    = field === 'manualFat'     ? num : fat;
    const carbCal = kcal - newP * 4 - newF * 9;
    const newC    = Math.max(0, Math.round(carbCal / 4));
    const warn    = carbCal < -4
      ? `At ${Math.round(kcal).toLocaleString()} kcal, ${Math.round(newP)} g protein + ${Math.round(newF)} g fat already exceeds the target — raise calories or lower protein/fat.`
      : '';
    return { carb: newC, warn };
  }

  if (field === 'manualCarb') {
    // Carb change → fat flexes; enforce fat floor
    const fatCal = kcal - protein * 4 - num * 4;
    let newF = Math.round(fatCal / 9);

    if (newF < fatFloor) {
      // Fat floor hit: cap fat and walk carbs back to maintain total
      newF = fatFloor;
      const newC = Math.max(0, Math.round((kcal - protein * 4 - newF * 9) / 4));
      return {
        fat: newF, carb: newC,
        warn: `Fat can't go below ${fatFloor} g (0.3 g/lb minimum). Carbs adjusted to ${newC} g to keep the total.`,
      };
    }
    if (newF < 0) {
      // Carbs + protein exceed budget: cap fat at 0, walk carbs back
      const newC = Math.max(0, Math.round((kcal - protein * 4) / 4));
      return {
        fat: 0, carb: newC,
        warn: `Carbs + protein exceeded the ${Math.round(kcal).toLocaleString()} kcal target. Carbs adjusted to ${newC} g.`,
      };
    }
    return { fat: newF, warn: '' };
  }

  return null;
}
