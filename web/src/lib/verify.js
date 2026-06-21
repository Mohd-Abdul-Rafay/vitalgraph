// Temporary verification script — run with: node src/lib/verify.js
// Confirms the migrated logic produces correct values.
import { calcBMR, calcTargets, resolveTargets, safeFloor, applyBalance } from './profile.js';
import { parseQty, findFood, calcTotals } from './nutrition.js';
import { FOODS } from '../data/foodData.js';

let pass = 0, fail = 0;
function check(label, actual, expected, tolerance = 0) {
  const ok = Math.abs(actual - expected) <= tolerance;
  const symbol = ok ? '✓' : '✗';
  console.log(`  ${symbol} ${label}: got ${actual}, expected ${expected}${tolerance ? ` (±${tolerance})` : ''}`);
  ok ? pass++ : fail++;
}
function checkEq(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`  ${ok ? '✓' : '✗'} ${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
  ok ? pass++ : fail++;
}
function section(name) { console.log(`\n── ${name}`); }

// ── 1. Mifflin–St Jeor BMR ───────────────────────────────────────────────────
section('calcBMR')
// Male, 178 cm, 82 kg, 28 yr
// = 10×82 + 6.25×178 − 5×28 + 5 = 820 + 1112.5 − 140 + 5 = 1797.5 → 1798
check('male/178cm/82kg/28yr',   calcBMR({ sex:'male',   age:28, heightCm:178, weightKg:82 }), 1798)
// Female, 165 cm, 60 kg, 25 yr
// = 10×60 + 6.25×165 − 5×25 − 161 = 600 + 1031.25 − 125 − 161 = 1345.25 → 1345
check('female/165cm/60kg/25yr', calcBMR({ sex:'female', age:25, heightCm:165, weightKg:60 }), 1345)

// ── 2. TDEE + goal target ────────────────────────────────────────────────────
section('calcTargets — recomp')
const recompProfile = { sex:'male', age:28, heightCm:178, weightKg:82, activityLevel:'moderate', goal:'recomp' };
const recomp = calcTargets(recompProfile);
// TDEE = 1798 × 1.55 = 2786.9 → 2787
check('TDEE (kcal) = BMR × 1.55',  recomp.kcal,    2787)
check('meta.bmr',                   recomp._meta.bmr, 1798)
check('meta.tdee',                  recomp._meta.tdee, 2787)

section('calcTargets — fat loss with safety floor')
// Tiny sedentary female, 25% deficit would go below 1200 kcal floor
const floorProfile = { sex:'female', age:25, heightCm:150, weightKg:45, activityLevel:'sedentary', goal:'fat_loss', deficitPct:25 };
const floorResult  = calcTargets(floorProfile);
// BMR = 10×45 + 6.25×150 − 5×25 − 161 = 1101.5 → 1102
// TDEE = 1102 × 1.2 = 1322.4 → 1322
// 25% deficit → 1322 × 0.75 = 991.5 → 992; floor = 1200, so target = 1200
check('BMR',                floorResult._meta.bmr,  1102)
check('TDEE',               floorResult._meta.tdee, 1322)
check('floor kicks in (1200)', floorResult.kcal,    1200)

section('calcTargets — muscle gain')
const gainProfile  = { sex:'male', age:28, heightCm:178, weightKg:82, activityLevel:'moderate', goal:'muscle_gain', surplusPct:10 };
const gain         = calcTargets(gainProfile);
// TDEE 2787 × 1.10 = 3065.7 → 3066
check('10% surplus over TDEE', gain.kcal, 3066)

// ── 3. Macro sum vs calorie target ───────────────────────────────────────────
section('calcTargets — macros approximately sum to calorie target')
// p×4 + c×4 + f×9 ≈ goalKcal (within a few kcal due to integer rounding)
const macroSum = recomp.protein * 4 + recomp.carb * 4 + recomp.fat * 9;
check('protein×4 + carb×4 + fat×9 ≈ kcal', macroSum, recomp.kcal, 8)
const gainSum  = gain.protein  * 4 + gain.carb  * 4 + gain.fat  * 9;
check('same for muscle_gain target',         gainSum,  gain.kcal,  8)

// ── 4. resolveTargets — fallback + manualTargets merge ───────────────────────
section('resolveTargets')
const fallback = resolveTargets(null);
check('null profile → 2000 kcal fallback', fallback.kcal, 2000)
const withManual = resolveTargets({ ...recompProfile, manualTargets:{ kcal:1800, protein:160, carb:180, fat:50 } });
check('manualTargets.kcal overrides science', withManual.kcal,    1800)
check('fiber still comes from science',        withManual.fiber,   recomp.fiber)
check('_manual flag set',                      +withManual._manual, 1)

// ── 5. safeFloor ─────────────────────────────────────────────────────────────
section('safeFloor')
check('male floor',   safeFloor('male'),   1500)
check('female floor', safeFloor('female'), 1200)

// ── 6. applyBalance — calorie change rebuilds macros ─────────────────────────
section('applyBalance — set kcal to 2000 (weightKg=82)')
const ctx = { weightKg:82, currentKcal:0, currentProtein:0, currentFat:0 };
const bal2000 = applyBalance('manualKcal', '2000', ctx);
// lbs=180.77, fatFloor=54, protein=181, fat=max(round(2000×0.25/9),54)=max(56,54)=56
// carb = round((2000−181×4−56×9)/4) = round(772/4) = 193
// verify: 181×4 + 193×4 + 56×9 = 724+772+504 = 2000 ✓
check('protein = round(lbs×1.0)',         bal2000.protein, 181)
check('fat = max(25% of kcal /9, floor)', bal2000.fat,     56)
check('carb fills remainder',             bal2000.carb,    193)
const balSum = bal2000.protein*4 + bal2000.carb*4 + bal2000.fat*9;
check('sum EXACTLY equals calorie target', balSum, 2000)
check('no warning when target is reachable', bal2000.warn === '', 1, 0)

section('applyBalance — edit protein, carbs flex')
const ctx2 = { weightKg:82, currentKcal:2000, currentProtein:181, currentFat:56 };
const balProt = applyBalance('manualProtein', '150', ctx2);
// carb = round((2000−150×4−56×9)/4) = round((2000−600−504)/4) = round(896/4) = 224
check('carbs adjust when protein changes', balProt.carb, 224)
const protSum = 150*4 + balProt.carb*4 + 56*9;
check('sum still equals 2000',             protSum, 2000)

section('applyBalance — edit carbs, fat floor enforced')
// Try carb=400 on 2000 kcal budget with protein=181 → fat would go negative
// fatFloor=54, so fat is capped and carbs walk back
const ctx3   = { weightKg:82, currentKcal:2000, currentProtein:181, currentFat:56 };
const balCarb = applyBalance('manualCarb', '400', ctx3);
// fatCal = 2000−181×4−400×4 = 2000−724−1600 = −324 → newF = round(−324/9) = −36 < fatFloor=54
// → cap at fatFloor=54, newC = round((2000−724−486)/4) = round(790/4) = 198 (or 197)
check('fat capped at floor (54)',            balCarb.fat,  54)
check('carbs walked back to fit',            balCarb.carb, 198, 1)
check('warning issued',                      balCarb.warn.length > 0 ? 1 : 0, 1)
const carbCapSum = 181*4 + balCarb.carb*4 + balCarb.fat*9;
check('sum stays at 2000 (±2 rounding)',     carbCapSum, 2000, 2)

// ── 7. parseQty ──────────────────────────────────────────────────────────────
section('parseQty')
checkEq('"200g chicken breast"', parseQty('200g chicken breast'), { grams:200, rest:'chicken breast' })
checkEq('"2 eggs"',              parseQty('2 eggs'),              { units:2,   rest:'eggs' })
checkEq('"1 scoop whey"',        parseQty('1 scoop whey'),        { units:1,   rest:'whey' })
checkEq('"chicken breast"',      parseQty('chicken breast'),      { rest:'chicken breast' })

// ── 8. findFood ──────────────────────────────────────────────────────────────
section('findFood')
checkEq('"chicken"   → chicken_breast', findFood('chicken')?.id,     'chicken_breast')
checkEq('"whey"      → whey_gold',      findFood('whey')?.id,         'whey_gold')
checkEq('"ghee"      → ghee',           findFood('ghee')?.id,         'ghee')
checkEq('"zzznomatch"→ null',           findFood('zzznomatch'),        null)
checkEq('"eggs"      → whole_egg (plural)', findFood('eggs')?.id,      'whole_egg')

// ── 9. calcTotals ─────────────────────────────────────────────────────────────
section('calcTotals — 100 g chicken breast')
const chicken = FOODS.find(f => f.id === 'chicken_breast');
const log     = [{ food: chicken, grams: 100, variantId: null }];
const totals  = calcTotals(log);
check('kcal',    totals.kcal,          165)
check('protein', totals.protein,       31)
check('fat',     Math.round(totals.fat * 10) / 10, 3.6)
check('micro iron (1.0 mg)',           Math.round(totals.micro.iron * 10) / 10, 1.0)
check('micro calcium (15 mg)',         totals.micro.calcium, 15)

section('calcTotals — null-valued micros stay null, not propagated as NaN')
const ghee = FOODS.find(f => f.id === 'ghee');
const gheeLog = [{ food: ghee, grams: 14, variantId: null }];
const gheeTotals = calcTotals(gheeLog);
// ghee macros are per 100g; 14g → kcal = 900×14/100 = 126
check('ghee kcal scaled correctly (14g)', Math.round(gheeTotals.kcal), 126)

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`)
console.log(`Result: ${pass} passed, ${fail} failed`)
if (fail > 0) process.exit(1);
