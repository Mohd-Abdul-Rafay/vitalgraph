import { useState, useEffect } from 'react'
import { parseQty, findFood, calcTotals } from '../lib/nutrition.js'
import { getProfile, scale } from '../data/foodData.js'
import { useProfile } from '../context/ProfileContext.jsx'
import { usdaCachePut, mapUsdaFood } from '../lib/usda.js'
import { loadTodayLog, saveTodayLog } from '../lib/logStorage.js'
import { Flame, Drumstick, Wheat, Droplet, Leaf } from 'lucide-react'

// Read once at module load — Vite replaces import.meta.env at build time.
const USDA_KEY = (import.meta.env.VITE_USDA_API_KEY ?? '').trim() || null

// ── Quick-add chips ───────────────────────────────────────────────────────────
const CHIPS = [
  '200g chicken breast', '2 eggs', '1 scoop whey', '100g white rice',
  '1 banana', '100g spinach', '28g almonds', '1 tbsp ghee',
]

// ── Macro strip config ────────────────────────────────────────────────────────
const MACROS = [
  { key: 'kcal',    label: 'Calories', unit: 'kcal', Icon: Flame,     color: 'var(--primary)', soft: 'var(--primary-soft)' },
  { key: 'protein', label: 'Protein',  unit: 'g',    Icon: Drumstick, color: 'var(--primary)', soft: 'var(--primary-soft)' },
  { key: 'carb',    label: 'Carbs',    unit: 'g',    Icon: Wheat,     color: 'var(--blue)',    soft: 'var(--blue-soft)'    },
  { key: 'fat',     label: 'Fat',      unit: 'g',    Icon: Droplet,   color: 'var(--amber)',   soft: 'var(--amber-soft)'   },
  { key: 'fiber',   label: 'Fiber',    unit: 'g',    Icon: Leaf,      color: 'var(--coral)',   soft: 'var(--coral-soft)'   },
]

// ── Category avatar colours ───────────────────────────────────────────────────
const CAT_STYLE = {
  protein:   { color: 'var(--primary)', soft: 'var(--primary-soft)' },
  carb:      { color: 'var(--blue)',    soft: 'var(--blue-soft)'    },
  fat:       { color: 'var(--amber)',   soft: 'var(--amber-soft)'   },
  fruit:     { color: 'var(--coral)',   soft: 'var(--coral-soft)'   },
  vegetable: { color: 'var(--primary)', soft: 'var(--primary-soft)' },
  usda:      { color: 'var(--violet)',  soft: 'var(--violet-soft)'  },
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function plural(word, n) {
  return n === 1 ? word : word.endsWith('s') ? word : word + 's'
}

// Parse text → find local food → resolve grams + display label
function tryResolve(text) {
  const { grams, units, rest } = parseQty(text.trim())
  const food = findFood(rest)
  if (!food) return { food: null, grams: grams ?? null, rest: rest || text.trim() }

  const resolvedGrams =
    grams  != null ? grams :
    units  != null ? units * food.perUnit.grams :
                     food.perUnit.grams

  let displayQty
  if (grams != null) {
    displayQty = `${grams}g`
  } else if (units != null) {
    const lbl = food.unit?.label
    displayQty = lbl ? `${units} ${plural(lbl, units)}` : `${resolvedGrams}g`
  } else {
    displayQty = food.perUnit.label
  }

  return { food, grams: resolvedGrams, displayQty, rest }
}

// ── Shared card shell ─────────────────────────────────────────────────────────
function Card({ children, style, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '20px 22px',
      boxShadow: 'var(--shadow-sm)', ...style,
    }}>
      {children}
    </div>
  )
}

// ── Macro stat card ───────────────────────────────────────────────────────────
function MacroStat({ macro, value, target, onClick, isOpen }) {
  const safeTarget = target || 1
  const display = macro.key === 'kcal'
    ? Math.round(value)
    : Math.round(value * 10) / 10
  const pct = Math.min((value / safeTarget) * 100, 100)

  return (
    <Card
      onClick={onClick}
      style={{
        padding: '16px 18px',
        border: isOpen ? '1.5px solid var(--primary)' : '1px solid var(--border)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color .15s',
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7,
          background: macro.soft, color: macro.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <macro.Icon size={14} strokeWidth={2.1}/>
        </div>
        <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--txt2)' }}>
          {macro.label}
        </span>
      </div>

      <div style={{ marginBottom: 10 }}>
        <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--txt)', lineHeight: 1 }}>
          {display.toLocaleString()}
        </span>
        <span style={{ fontSize: 11.5, color: 'var(--txt3)', marginLeft: 3 }}>
          /{safeTarget.toLocaleString()}{macro.unit}
        </span>
      </div>

      <div style={{ height: 4, borderRadius: 99, background: 'var(--border)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, borderRadius: 99,
          background: macro.color, transition: 'width .4s ease',
        }} />
      </div>
    </Card>
  )
}

// ── USDA search panel ─────────────────────────────────────────────────────────
// Shown below the input when the local database has no match.
function UsdaPanel({ usda, onSearch, onPick, onDismiss }) {
  const { status, term, results, error } = usda
  const busy = status === 'loading' || status === 'fetching'

  const ghostBtn = (onClick, children, disabled) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        height: 34, padding: '0 14px', fontSize: 12.5,
        border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
        background: 'none', color: disabled ? 'var(--txt3)' : 'var(--txt2)',
        cursor: disabled ? 'not-allowed' : 'pointer', flexShrink: 0,
      }}
    >
      {children}
    </button>
  )

  return (
    <div style={{ marginTop: 12 }}>

      {/* Prompt / loading row */}
      {(status === 'prompt' || status === 'loading') && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onSearch}
            disabled={busy}
            style={{
              height: 34, padding: '0 14px', fontSize: 12.5, fontWeight: 600,
              border: '1.5px solid var(--primary)', borderRadius: 'var(--radius-sm)',
              background: 'var(--primary-soft)', color: 'var(--primary)',
              cursor: busy ? 'not-allowed' : 'pointer',
              opacity: busy ? 0.7 : 1,
            }}
          >
            {status === 'loading' ? 'Searching USDA…' : `Search USDA for "${term}"`}
          </button>
          {status === 'loading' && (
            <span style={{ fontSize: 12, color: 'var(--txt3)' }}>querying food database…</span>
          )}
          {status === 'prompt' && ghostBtn(onDismiss, '×')}
        </div>
      )}

      {/* Results list */}
      {(status === 'results' || status === 'fetching') && (
        <div>
          {results.length === 0 && !error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
              <span style={{ fontSize: 13, color: 'var(--txt3)' }}>
                No USDA results for &ldquo;{term}&rdquo;.
              </span>
              {ghostBtn(onDismiss, 'Dismiss')}
            </div>
          )}

          {results.length > 0 && (
            <div style={{
              border: '1px solid var(--border)', borderRadius: 'var(--radius)',
              overflow: 'hidden', background: 'var(--surface)',
              boxShadow: 'var(--shadow-sm)', marginBottom: 8,
            }}>
              {/* Panel header */}
              <div style={{
                padding: '8px 14px 6px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: '1px solid var(--border)',
              }}>
                <span style={{ fontSize: 11.5, color: 'var(--txt3)', fontWeight: 600 }}>
                  USDA results — click to log at 100 g
                </span>
                {ghostBtn(onDismiss, 'Dismiss', busy)}
              </div>

              {/* Result rows */}
              {results.map((r, i) => (
                <div
                  key={r.fdcId}
                  onClick={() => !busy && onPick(r)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                    cursor: busy ? 'default' : 'pointer',
                    opacity: busy ? 0.55 : 1,
                    transition: 'background .1s',
                  }}
                  onMouseEnter={e => { if (!busy) e.currentTarget.style.background = 'var(--surface2)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '' }}
                >
                  <div>
                    <span style={{ fontSize: 13, color: 'var(--txt)', fontWeight: 500 }}>
                      {r.description}
                    </span>
                    <span style={{ fontSize: 11.5, color: 'var(--txt3)', marginLeft: 6 }}>
                      · {r.dataType}
                    </span>
                  </div>
                  <span style={{ fontSize: 11.5, color: 'var(--txt3)', flexShrink: 0, marginLeft: 12 }}>
                    {busy ? 'loading…' : 'per 100 g →'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          fontSize: 12.5, color: 'var(--coral)', marginTop: 6,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontWeight: 700 }}>!</span>
          {error}
          {ghostBtn(onDismiss, 'Dismiss')}
        </div>
      )}
    </div>
  )
}

// ── Configure panel — variant picker + amount input + live macro preview ──────
// Shown when a matched local food has variants. USDA and single-profile foods
// bypass this entirely and log directly.
function ConfigurePanel({ pending, setPending, onConfirm }) {
  const { food, variantId, amount } = pending
  const isGram  = !food.unit || food.unit.type === 'gram'
  const count   = Math.max(1, parseInt(amount, 10) || 1)
  const grams   = isGram ? (parseFloat(amount) || 0) : count * food.unit.gramsEach

  // Live macro preview — uses variant-aware getProfile
  const profile = getProfile({ food, variantId, grams })
  const prev = {
    kcal:    Math.round(scale(profile.macros.kcal,    grams)),
    protein: Math.round(scale(profile.macros.protein, grams) * 10) / 10,
    carb:    Math.round(scale(profile.macros.carb,    grams) * 10) / 10,
    fat:     Math.round(scale(profile.macros.fat,     grams) * 10) / 10,
    fiber:   Math.round(scale(profile.macros.fiber,   grams) * 10) / 10,
  }

  function handleConfirm() {
    const n = isGram ? parseFloat(amount) : count
    if (!n || n <= 0) return
    const finalGrams  = isGram ? n : n * food.unit.gramsEach
    const displayQty  = isGram
      ? `${n}g`
      : `${count} ${food.unit.label}${count !== 1 ? 's' : ''}`
    onConfirm(food, variantId, finalGrams, displayQty)
  }

  const stepperBtn = (label, onClick) => (
    <button
      type="button" onClick={onClick}
      style={{
        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
        border: '1.5px solid var(--border)', background: 'var(--bg)',
        fontSize: 20, lineHeight: 1, color: 'var(--txt2)',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >{label}</button>
  )

  return (
    <div style={{
      marginTop: 12, padding: '14px 16px',
      background: 'var(--surface2)', borderRadius: 'var(--radius)',
      border: '1.5px solid var(--primary-soft)',
    }}>
      {/* Food title */}
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)', marginBottom: 12 }}>
        {food.name}
        {food.brand && (
          <span style={{ fontWeight: 400, color: 'var(--txt3)', marginLeft: 6 }}>
            · {food.brand}
          </span>
        )}
      </div>

      {/* Variant picker */}
      {food.variants && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {food.variants.map(v => (
            <button
              key={v.id}
              type="button"
              onClick={() => setPending({ ...pending, variantId: v.id })}
              style={{
                height: 32, padding: '0 14px', fontSize: 12.5, fontWeight: 500,
                borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                border: variantId === v.id ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                background: variantId === v.id ? 'var(--primary-soft)' : 'var(--bg)',
                color: variantId === v.id ? 'var(--primary)' : 'var(--txt2)',
                transition: 'all .1s',
              }}
            >
              {v.label}
            </button>
          ))}
        </div>
      )}

      {/* Amount input */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        {isGram ? (
          <>
            <input
              type="number" min="1" step="any" value={amount}
              onChange={e => setPending({ ...pending, amount: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && handleConfirm()}
              style={{
                width: 88, height: 36, padding: '0 10px',
                border: '1.5px solid var(--border)', borderRadius: 8,
                background: 'var(--bg)', fontSize: 14, color: 'var(--txt)', outline: 'none',
              }}
            />
            <span style={{ fontSize: 13, color: 'var(--txt3)' }}>g</span>
          </>
        ) : (
          <>
            {stepperBtn('−', () => setPending({ ...pending, amount: String(Math.max(1, count - 1)) }))}
            <span style={{
              minWidth: 28, textAlign: 'center', fontSize: 18, fontWeight: 700, color: 'var(--txt)',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {count}
            </span>
            {stepperBtn('+', () => setPending({ ...pending, amount: String(count + 1) }))}
            <span style={{ fontSize: 13, color: 'var(--txt3)' }}>
              {food.unit.label}{count !== 1 ? 's' : ''}
            </span>
          </>
        )}
      </div>

      {/* Live macro preview */}
      {grams > 0 && (
        <div style={{
          fontSize: 12.5, color: 'var(--txt2)', marginBottom: 14,
          padding: '7px 10px', borderRadius: 7, background: 'var(--bg)',
          border: '1px solid var(--border)',
        }}>
          <span style={{ fontWeight: 700, color: 'var(--txt)' }}>{prev.kcal}</span>
          <span style={{ color: 'var(--txt3)' }}> kcal · </span>
          <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{prev.protein}g P</span>
          <span style={{ color: 'var(--txt3)' }}> · </span>
          <span style={{ color: 'var(--blue)' }}>{prev.carb}g C</span>
          <span style={{ color: 'var(--txt3)' }}> · </span>
          <span style={{ color: 'var(--amber)' }}>{prev.fat}g F</span>
          {prev.fiber > 0 && (
            <>
              <span style={{ color: 'var(--txt3)' }}> · </span>
              <span style={{ color: 'var(--coral)' }}>{prev.fiber}g fiber</span>
            </>
          )}
          <span style={{ color: 'var(--txt3)', fontSize: 11.5, marginLeft: 6 }}>
            ({grams}g)
          </span>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={grams <= 0}
          style={{
            height: 36, padding: '0 18px', fontSize: 13, fontWeight: 600,
            background: 'var(--primary)', color: '#fff',
            border: 'none', borderRadius: 'var(--radius-sm)',
            cursor: grams > 0 ? 'pointer' : 'not-allowed',
            opacity: grams > 0 ? 1 : 0.5,
          }}
        >
          Add to log
        </button>
        <button
          type="button"
          onClick={() => setPending(null)}
          style={{
            height: 36, padding: '0 14px', fontSize: 13,
            border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
            background: 'none', color: 'var(--txt2)', cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Amino acid constants ──────────────────────────────────────────────────────
const ESSENTIAL_AA = [
  'histidine', 'isoleucine', 'leucine', 'lysine', 'methionine',
  'phenylalanine', 'threonine', 'tryptophan', 'valine',
]
const NONESSENTIAL_AA = [
  'alanine', 'arginine', 'aspartate', 'cystine', 'glutamate',
  'glycine', 'proline', 'serine', 'tyrosine',
]
const AA_LABEL = {
  histidine:'Histidine', isoleucine:'Isoleucine', leucine:'Leucine',
  lysine:'Lysine', methionine:'Methionine', phenylalanine:'Phenylalanine',
  threonine:'Threonine', tryptophan:'Tryptophan', valine:'Valine',
  alanine:'Alanine', arginine:'Arginine', aspartate:'Aspartate',
  cystine:'Cystine', glutamate:'Glutamate', glycine:'Glycine',
  proline:'Proline', serine:'Serine', tyrosine:'Tyrosine',
}

// Sum a sub-profile field across today's log, tracking "not reported" coverage.
// Faithful port of the reference sumField() from nutrition-dashboard.html.
function sumField(log, field, key) {
  let sum = 0, reported = 0, total = 0
  for (const e of log) {
    const p = getProfile(e)[field]
    if (!p) { total++; continue }
    total++
    if (p[key] == null) continue
    reported++
    sum += scale(p[key], e.grams) || 0
  }
  return { sum, reported, total }
}

// ── Sub-profile breakdown (carbs / fat / fiber) ───────────────────────────────
function SubProfile({ log, field, rows }) {
  return (
    <div>
      {rows.map(([key, label]) => {
        const { sum, reported: rep, total } = sumField(log, field, key)
        const none = rep === 0
        return (
          <div key={key} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '7px 0', borderBottom: '1px solid var(--border)',
          }}>
            <span style={{ flex: '0 0 170px', fontSize: 13, color: 'var(--txt2)' }}>
              {label}
            </span>
            <span style={{
              minWidth: 68, textAlign: 'right', fontSize: 13.5, fontWeight: 600,
              fontVariantNumeric: 'tabular-nums',
              color: none ? 'var(--txt3)' : 'var(--txt)',
            }}>
              {none ? '—' : `${Math.round(sum * 10) / 10} g`}
            </span>
            <span style={{ flex: 1, fontSize: 11.5, color: 'var(--txt3)', textAlign: 'right' }}>
              {none ? 'not reported' : rep < total ? `${rep}/${total} foods reported` : ''}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── Amino acid profile panel ──────────────────────────────────────────────────
function AminoProfile({ log }) {
  const [expand, setExpand] = useState(false)

  // Aggregate amino sums (mg) across all log entries; track which aminos were reported.
  // Values in foodData.js are mg/100g; scale() converts to mg for the eaten portion.
  const sums = {}, reported = {}
  ;[...ESSENTIAL_AA, ...NONESSENTIAL_AA].forEach(a => { sums[a] = 0; reported[a] = false })
  for (const e of log) {
    const profile = getProfile(e)
    if (!profile.amino) continue
    for (const a in sums) {
      const v = profile.amino[a]
      if (v != null) { sums[a] += scale(v, e.grams) || 0; reported[a] = true }
    }
  }
  const maxEss = Math.max(...ESSENTIAL_AA.map(a => sums[a]), 1)
  const list = expand ? [...ESSENTIAL_AA, ...NONESSENTIAL_AA] : ESSENTIAL_AA

  return (
    <div>
      {!expand && (
        <div style={{ fontSize: 12, color: 'var(--txt3)', marginBottom: 12 }}>
          9 essential amino acids · leucine drives muscle protein synthesis
        </div>
      )}
      {list.map(a => {
        const isLeucine = a === 'leucine'
        const isEss = ESSENTIAL_AA.includes(a)
        const valMg = sums[a]
        const valG = valMg / 1000

        return (
          <div key={a} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: isLeucine ? '7px 8px' : '6px 0',
            borderBottom: '1px solid var(--border)',
            ...(isLeucine && {
              background: 'var(--primary-soft)', borderRadius: 7, margin: '2px -8px',
            }),
          }}>
            <span style={{
              minWidth: 130, fontSize: 13,
              fontWeight: isLeucine ? 600 : 400,
              color: isEss ? 'var(--txt)' : 'var(--txt2)',
            }}>
              {AA_LABEL[a]}
              {isLeucine && (
                <span style={{
                  display: 'inline-block', fontSize: 10, fontWeight: 700,
                  marginLeft: 7, padding: '1px 5px', borderRadius: 4,
                  color: 'var(--primary)', background: 'var(--primary-mid)',
                  letterSpacing: 0.3,
                }}>
                  MPS
                </span>
              )}
            </span>
            <div style={{ flex: 1, height: 5, borderRadius: 99, background: 'var(--border)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 99,
                width: `${Math.min((valMg / maxEss) * 100, 100)}%`,
                background: isLeucine ? 'var(--primary)' : 'rgba(19,184,138,.38)',
                transition: 'width .4s ease',
              }} />
            </div>
            <span style={{
              fontSize: 12.5, minWidth: 64, textAlign: 'right',
              fontVariantNumeric: 'tabular-nums',
              color: reported[a] ? 'var(--txt2)' : 'var(--txt3)',
            }}>
              {reported[a]
                ? (valG >= 1 ? `${Math.round(valG * 10) / 10} g` : `${Math.round(valMg)} mg`)
                : '—'}
            </span>
          </div>
        )
      })}
      <button
        type="button"
        onClick={() => setExpand(x => !x)}
        style={{
          marginTop: 12, height: 32, padding: '0 14px', fontSize: 12.5,
          border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
          background: 'none', color: 'var(--txt2)', cursor: 'pointer',
        }}
      >
        {expand ? 'Show essential only' : 'Show all 18 amino acids'}
      </button>
    </div>
  )
}

// ── Macro drill-down panel ────────────────────────────────────────────────────
const DRILL_LABEL = {
  protein: 'Amino acid profile',
  carb:    'Carbohydrate profile',
  fat:     'Fatty acid profile',
  fiber:   'Fiber profile',
}

function DrillDown({ macroKey, log }) {
  // Foods that contributed to this macro today, ranked by contribution.
  const sources = log.map(e => {
    const variantLabel = e.variantId && e.food.variants
      ? e.food.variants.find(v => v.id === e.variantId)?.label : null
    const amt = scale(getProfile(e).macros[macroKey], e.grams) || 0
    return { name: e.food.name, brand: e.food.brand, variantLabel, amt }
  }).filter(s => s.amt > 0.05).sort((a, b) => b.amt - a.amt)

  const unit = macroKey === 'kcal' ? 'kcal' : 'g'

  return (
    <Card style={{ marginBottom: 14, padding: '20px 22px', animation: 'vgSlideIn .2s ease' }}>

      {/* Sources */}
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)', marginBottom: 10 }}>
        Your sources today
      </div>
      {sources.length === 0 ? (
        <div style={{ fontSize: 13, color: 'var(--txt3)', paddingBottom: 14 }}>
          Nothing logged yet contributes to this macro.
        </div>
      ) : (
        <div style={{ marginBottom: 16 }}>
          {sources.map((s, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '6px 0', borderBottom: '1px solid var(--border)',
            }}>
              <span style={{ fontSize: 13, color: 'var(--txt)' }}>
                {s.name}
                {s.brand && <span style={{ color: 'var(--txt3)', fontSize: 12 }}> · {s.brand}</span>}
                {s.variantLabel && <span style={{ color: 'var(--txt3)', fontSize: 12 }}> · {s.variantLabel}</span>}
              </span>
              <span style={{
                fontSize: 12.5, fontVariantNumeric: 'tabular-nums',
                color: 'var(--txt2)', flexShrink: 0, marginLeft: 12,
              }}>
                {Math.round(s.amt * 10) / 10} {unit}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Sub-profile breakdown */}
      <div style={{ paddingTop: 14, borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)', marginBottom: 12 }}>
          {DRILL_LABEL[macroKey]}
        </div>
        {macroKey === 'protein' && <AminoProfile log={log} />}
        {macroKey === 'carb' && (
          <SubProfile log={log} field="carbProfile" rows={[
            ['sugars', 'Sugars'],
            ['starch', 'Starch'],
            ['addedSugar', 'Added sugar'],
          ]} />
        )}
        {macroKey === 'fat' && (
          <SubProfile log={log} field="fatProfile" rows={[
            ['sat', 'Saturated'],
            ['mono', 'Monounsaturated'],
            ['poly', 'Polyunsaturated'],
            ['omega3', 'Omega-3'],
            ['omega6', 'Omega-6'],
          ]} />
        )}
        {macroKey === 'fiber' && (
          <SubProfile log={log} field="fiberProfile" rows={[
            ['soluble', 'Soluble'],
            ['insoluble', 'Insoluble'],
          ]} />
        )}
      </div>
    </Card>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Nutrition() {
  const { targets: TARGETS } = useProfile()
  const [log, setLog]       = useState(loadTodayLog)
  const [input, setInput]   = useState('')
  const [error, setError]   = useState('')
  const [focused, setFocused] = useState(false)

  // Expanded macro drill-down: null | 'protein' | 'carb' | 'fat' | 'fiber'
  const [open, setOpen] = useState(null)

  // USDA search state machine
  // status: 'idle' | 'prompt' | 'loading' | 'results' | 'fetching'
  const USDA_IDLE = { status: 'idle', term: '', parsedGrams: null, results: [], error: null }
  const [usda, setUsda]       = useState(USDA_IDLE)
  // Configure panel state — set when matched food has variants
  const [pending, setPending] = useState(null)
  // Active meal context — applied to every entry logged until changed
  const [meal, setMeal] = useState('Breakfast')

  useEffect(() => { saveTodayLog(log) }, [log])

  const totals = calcTotals(log)

  // ── addEntry: local lookup → variant configure panel → USDA fallback ───────
  function addEntry(text) {
    const { food, grams, displayQty, rest } = tryResolve(text)

    if (food) {
      setUsda(USDA_IDLE)
      setError('')

      if (food.variants) {
        // Food has variants — open configure panel instead of logging directly.
        // Default amount: for gram-type foods use resolved grams; for piece/serving
        // back-convert grams → count so "2 eggs" pre-fills the stepper at 2.
        const isGram = !food.unit || food.unit.type === 'gram'
        const defaultAmt = isGram
          ? String(grams)
          : String(Math.max(1, Math.round(grams / food.unit.gramsEach)))
        setPending({ food, variantId: food.variants[0].id, amount: defaultAmt })
        return
      }

      // Single-profile food — log immediately
      setPending(null)
      setLog(prev => [...prev, { uid: crypto.randomUUID(), food, grams, variantId: null, meal, displayQty }])
      setInput('')
      return
    }

    if (!text.trim()) { setError('Type a food to log.'); return }

    if (!USDA_KEY) {
      setError(
        `No local match for "${rest}". ` +
        `Set VITE_USDA_API_KEY in web/.env.local to enable USDA database search.`
      )
      return
    }

    // No local match + key present → show USDA prompt
    setPending(null)
    setUsda({ status: 'prompt', term: rest, parsedGrams: grams, results: [], error: null })
  }

  // ── Confirm a configured entry (from ConfigurePanel) ───────────────────────
  function confirmPending(food, variantId, grams, displayQty) {
    setLog(prev => [...prev, { uid: crypto.randomUUID(), food, grams, variantId, meal, displayQty }])
    setInput('')
    setPending(null)
    setError('')
  }

  // ── USDA search ─────────────────────────────────────────────────────────────
  async function searchUsda() {
    if (!USDA_KEY) return
    const { term } = usda
    setUsda(s => ({ ...s, status: 'loading', error: null }))
    try {
      const url =
        `https://api.nal.usda.gov/fdc/v1/foods/search` +
        `?query=${encodeURIComponent(term)}` +
        `&api_key=${USDA_KEY}` +
        `&pageSize=8` +
        `&dataType=Foundation,SR%20Legacy`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setUsda(s => ({ ...s, status: 'results', results: data.foods || [] }))
    } catch (e) {
      setUsda(s => ({
        ...s, status: 'results', results: [],
        error: `USDA search failed: ${e.message}`,
      }))
    }
  }

  // ── Pick a USDA result → fetch full details → add to log ───────────────────
  async function pickUsda(result) {
    if (!USDA_KEY) return
    setUsda(s => ({ ...s, status: 'fetching' }))
    try {
      const url = `https://api.nal.usda.gov/fdc/v1/food/${result.fdcId}?api_key=${USDA_KEY}`
      const res  = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const food = mapUsdaFood(data)
      usdaCachePut(food)

      // Use grams from the original query if the user specified them (e.g. "200g mango"),
      // otherwise default to 100 g (food.perUnit.grams).
      const grams      = usda.parsedGrams ?? food.perUnit.grams
      const displayQty = `${grams}g`

      setLog(prev => [...prev, { uid: crypto.randomUUID(), food, grams, variantId: null, meal, displayQty }])
      setInput('')
      setUsda(USDA_IDLE)
    } catch (e) {
      setUsda(s => ({
        ...s, status: 'results',
        error: `Failed to load food details: ${e.message}`,
      }))
    }
  }

  function removeEntry(uid) {
    setLog(prev => prev.filter(e => e.uid !== uid))
  }

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'short', month: 'long', day: 'numeric',
  })

  return (
    <div>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 22, fontWeight: 750, color: 'var(--txt)', lineHeight: 1.2 }}>
          Nutrition log
        </h1>
        <p style={{ fontSize: 13, color: 'var(--txt3)', marginTop: 4 }}>
          {today} · target {TARGETS.kcal.toLocaleString()} kcal
        </p>
      </div>

      {/* ── Macro totals strip ───────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 12 }}>
        {MACROS.map(m => (
          <MacroStat key={m.key} macro={m}
            value={m.key === 'kcal' ? totals.kcal : totals[m.key]}
            target={TARGETS[m.key]}
            onClick={m.key !== 'kcal' ? () => setOpen(o => o === m.key ? null : m.key) : undefined}
            isOpen={open === m.key}
          />
        ))}
      </div>

      {/* ── Drill-down panel (protein / carb / fat / fiber) ─────────────────── */}
      {open && <DrillDown key={open} macroKey={open} log={log} />}

      {/* ── Log food card ────────────────────────────────────────────────────── */}
      <Card style={{ marginBottom: 14, padding: '20px 22px' }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--txt)', marginBottom: 14 }}>
          Log food
        </div>

        {/* Input row */}
        <form onSubmit={e => { e.preventDefault(); if (input.trim()) addEntry(input) }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              value={input}
              onChange={e => { setInput(e.target.value); if (error) setError('') }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder='"200g chicken breast"  ·  "2 eggs"  ·  "1 scoop whey"'
              style={{
                flex: 1, height: 42, padding: '0 14px',
                border: `1.5px solid ${focused ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-sm)', background: 'var(--bg)',
                fontSize: 14, color: 'var(--txt)', outline: 'none',
                transition: 'border-color .15s',
              }}
            />
            <button
              type="submit"
              disabled={!input.trim()}
              style={{
                height: 42, padding: '0 22px',
                background: input.trim() ? 'var(--primary)' : 'var(--surface2)',
                color: input.trim() ? '#fff' : 'var(--txt3)',
                border: 'none', borderRadius: 'var(--radius-sm)',
                fontSize: 14, fontWeight: 600,
                cursor: input.trim() ? 'pointer' : 'not-allowed',
                transition: 'background .15s, color .15s',
              }}
            >
              Log
            </button>
          </div>
        </form>

        {/* Inline error (local-only no-match or no API key) */}
        {error && (
          <div style={{
            marginTop: 10, fontSize: 12.5, color: 'var(--coral)',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>!</span>
            {error}
          </div>
        )}

        {/* Configure panel — variant picker + amount + live preview */}
        {pending && (
          <ConfigurePanel
            pending={pending}
            setPending={setPending}
            onConfirm={confirmPending}
          />
        )}

        {/* USDA search panel — shown when no local match and key is present */}
        {usda.status !== 'idle' && (
          <UsdaPanel
            usda={usda}
            onSearch={searchUsda}
            onPick={pickUsda}
            onDismiss={() => setUsda(USDA_IDLE)}
          />
        )}

        {/* Quick-add chips */}
        <div style={{ marginTop: 16 }}>
          <div style={{
            fontSize: 11, color: 'var(--txt3)', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: .6, marginBottom: 8,
          }}>
            Quick add
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {CHIPS.map(chip => (
              <button
                key={chip}
                type="button"
                onClick={() => addEntry(chip)}
                style={{
                  height: 30, padding: '0 12px',
                  border: '1px solid var(--border)', borderRadius: 99,
                  fontSize: 12.5, fontWeight: 500,
                  color: 'var(--txt2)', background: 'var(--bg)',
                  cursor: 'pointer', transition: 'all .12s',
                }}
                onMouseEnter={e => Object.assign(e.currentTarget.style, {
                  borderColor: 'var(--primary)', color: 'var(--primary)', background: 'var(--primary-soft)',
                })}
                onMouseLeave={e => Object.assign(e.currentTarget.style, {
                  borderColor: 'var(--border)', color: 'var(--txt2)', background: 'var(--bg)',
                })}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* ── Meal selector ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 12, color: 'var(--txt3)', fontWeight: 500, flexShrink: 0 }}>
          Logging for:
        </span>
        {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map(m => (
          <button
            key={m}
            type="button"
            onClick={() => setMeal(m)}
            style={{
              height: 30, padding: '0 14px', borderRadius: 99,
              border: `1.5px solid ${meal === m ? 'var(--primary)' : 'var(--border)'}`,
              background: meal === m ? 'var(--primary-soft)' : 'none',
              color: meal === m ? 'var(--primary)' : 'var(--txt3)',
              fontSize: 12.5, fontWeight: meal === m ? 650 : 450,
              cursor: 'pointer', transition: 'all .12s',
            }}
          >
            {m}
          </button>
        ))}
      </div>

      {/* ── Log list card ────────────────────────────────────────────────────── */}
      <Card>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: log.length ? 14 : 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--txt)' }}>
              Today's log
            </span>
            {log.length > 0 && (
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '1px 8px', borderRadius: 99,
                color: 'var(--primary)', background: 'var(--primary-soft)',
              }}>
                {log.length} item{log.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          {log.length > 0 && (
            <button
              type="button"
              onClick={() => setLog([])}
              style={{
                fontSize: 12, color: 'var(--txt3)', cursor: 'pointer',
                padding: '3px 10px', borderRadius: 6,
                border: '1px solid var(--border)', background: 'none',
              }}
            >
              Clear all
            </button>
          )}
        </div>

        {/* Empty state */}
        {log.length === 0 && (
          <div style={{ textAlign: 'center', padding: '44px 0', color: 'var(--txt3)' }}>
            <div style={{
              width: 48, height: 48, margin: '0 auto 14px', borderRadius: '50%',
              border: '2px dashed var(--border2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, fontWeight: 300, color: 'var(--border2)',
            }}>
              +
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--txt2)', marginBottom: 4 }}>
              Nothing logged yet
            </div>
            <div style={{ fontSize: 12.5 }}>
              Type a food above or tap a quick-add chip to start
            </div>
          </div>
        )}

        {/* Log entries — grouped by meal in fixed order */}
        {log.length > 0 && (
          <div>
            {['Breakfast', 'Lunch', 'Dinner', 'Snacks']
              .map(mealName => ({
                mealName,
                entries: log.filter(e => (e.meal ?? 'Snacks') === mealName),
              }))
              .filter(g => g.entries.length > 0)
              .map(({ mealName, entries }, gIdx) => {
                const mealKcal = Math.round(
                  entries.reduce((s, e) => s + (scale(getProfile(e).macros.kcal, e.grams) || 0), 0)
                )
                const mealProt = Math.round(
                  entries.reduce((s, e) => s + (scale(getProfile(e).macros.protein, e.grams) || 0), 0) * 10
                ) / 10

                return (
                  <div key={mealName}>
                    {/* Meal group header */}
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 0 6px',
                      borderTop: gIdx > 0 ? '1px solid var(--border)' : 'none',
                    }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: 'var(--txt3)',
                        textTransform: 'uppercase', letterSpacing: 0.7,
                      }}>
                        {mealName}
                      </span>
                      <span style={{ fontSize: 11.5, color: 'var(--txt3)' }}>
                        {mealKcal.toLocaleString()} kcal · {mealProt}g protein
                      </span>
                    </div>

                    {/* Entries within this meal */}
                    {entries.map((entry, i) => {
                      const prof = getProfile(entry)
                      const kcal = Math.round(scale(prof.macros.kcal,    entry.grams))
                      const prot = Math.round(scale(prof.macros.protein, entry.grams) * 10) / 10
                      const cat  = CAT_STYLE[entry.food.category] || CAT_STYLE.protein
                      const init = entry.food.name
                        .split(/[\s,]+/).filter(Boolean)
                        .slice(0, 2).map(w => w[0].toUpperCase()).join('')

                      return (
                        <div
                          key={entry.uid}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0',
                            borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                          }}
                        >
                          {/* Category avatar */}
                          <div style={{
                            width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                            background: cat.soft, color: cat.color,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 800,
                          }}>
                            {init}
                          </div>

                          {/* Name + amount */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: 13.5, fontWeight: 600, color: 'var(--txt)', lineHeight: 1.3,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {entry.food.name}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--txt3)', marginTop: 2 }}>
                              {entry.displayQty}
                              {entry.variantId && entry.food.variants && (
                                <span style={{ marginLeft: 5 }}>
                                  · {entry.food.variants.find(v => v.id === entry.variantId)?.label}
                                </span>
                              )}
                              {entry.food.brand && (
                                <span style={{ marginLeft: 5, color: 'var(--border2)' }}>
                                  · {entry.food.brand}
                                </span>
                              )}
                              {entry.food.category === 'usda' && (
                                <span style={{ marginLeft: 5, color: 'var(--violet)', fontWeight: 600, fontSize: 10.5 }}>
                                  USDA
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Kcal + protein */}
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--txt)' }}>
                              {kcal.toLocaleString()} kcal
                            </div>
                            <div style={{ fontSize: 11.5, color: 'var(--txt3)', marginTop: 2 }}>
                              {prot}g protein
                            </div>
                          </div>

                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => removeEntry(entry.uid)}
                            aria-label={`Remove ${entry.food.name}`}
                            style={{
                              width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                              border: '1px solid var(--border)', background: 'none',
                              cursor: 'pointer', display: 'flex', alignItems: 'center',
                              justifyContent: 'center', fontSize: 15, lineHeight: 1,
                              color: 'var(--txt3)', transition: 'all .12s',
                            }}
                            onMouseEnter={e => Object.assign(e.currentTarget.style, {
                              borderColor: 'var(--coral)', color: 'var(--coral)', background: 'var(--coral-soft)',
                            })}
                            onMouseLeave={e => Object.assign(e.currentTarget.style, {
                              borderColor: 'var(--border)', color: 'var(--txt3)', background: 'none',
                            })}
                          >
                            ×
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
          </div>
        )}

        {/* USDA attribution */}
        {log.some(e => e.food.category === 'usda') && (
          <div style={{
            marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--border)',
            fontSize: 11.5, color: 'var(--txt3)', lineHeight: 1.6,
          }}>
            Values from USDA FoodData Central. "Not reported" (null) means USDA has no value for that food.
          </div>
        )}
      </Card>
    </div>
  )
}
