import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ACTIVITY, GOALS } from '../data/foodData.js'
import { calcTargets, applyBalance } from '../lib/profile.js'
import { CONTENT_WIDTH_NARROW } from '../lib/widths.js'

// ── Shared style helpers ──────────────────────────────────────────────────────
const inp = (w) => ({
  height: 38, width: w, padding: '0 10px',
  border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
  background: 'var(--surface)', fontSize: 14, color: 'var(--txt)',
  outline: 'none',
})

const primaryBtnStyle = {
  height: 40, padding: '0 24px', background: 'var(--primary)', color: '#fff',
  border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
}

function Card({ children, style }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '20px 22px',
      boxShadow: 'var(--shadow-sm)', ...style,
    }}>
      {children}
    </div>
  )
}

function GhostBtn({ onClick, children, style }) {
  return (
    <button onClick={onClick} style={{
      height: 34, padding: '0 12px', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)', background: 'none',
      fontSize: 12.5, color: 'var(--txt2)', cursor: 'pointer', ...style,
    }}>
      {children}
    </button>
  )
}

function FieldRow({ label, err, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)', marginBottom: 7 }}>{label}</div>
      {children}
      {err && <div style={{ fontSize: 11.5, color: 'var(--coral)', marginTop: 5 }}>{err}</div>}
    </div>
  )
}

function SegButtons({ value, opts, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {opts.map(o => (
        <button key={o.v} onClick={() => onChange(o.v)} style={{
          height: 34, padding: '0 18px', fontSize: 13,
          fontWeight: value === o.v ? 600 : 400,
          border: `1.5px solid ${value === o.v ? 'var(--primary)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-sm)', cursor: 'pointer',
          background: value === o.v ? 'var(--primary-soft)' : 'var(--surface)',
          color: value === o.v ? 'var(--primary)' : 'var(--txt2)',
          transition: 'all .12s',
        }}>
          {o.l}
        </button>
      ))}
    </div>
  )
}

function RadioCard({ selected, onClick, children }) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
      marginBottom: 7, userSelect: 'none',
      background: selected ? 'var(--primary-soft)' : 'var(--surface)',
      border: `1.5px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
      transition: 'all .12s',
    }}>
      <div style={{
        width: 14, height: 14, borderRadius: '50%', flexShrink: 0, marginTop: 2,
        border: `2px solid ${selected ? 'var(--primary)' : 'var(--border2)'}`,
        background: selected ? 'var(--primary)' : 'transparent',
        transition: 'all .12s',
      }} />
      {children}
    </div>
  )
}

// ── Form helpers ──────────────────────────────────────────────────────────────
const DEFAULT_FORM = {
  age: '', sex: 'male',
  heightCm: '', heightUnit: 'cm', heightFt: '', heightIn: '',
  weightKg: '', weightUnit: 'kg', weightLbs: '',
  targetWeightKg: '', targetWeightLbs: '',
  activityLevel: 'moderate', goal: 'recomp',
  deficitPct: 20, surplusPct: 10,
  manualMode: false,
  manualKcal: '', manualProtein: '', manualCarb: '', manualFat: '', manualWarn: '',
}

export function profileToForm(p) {
  if (!p) return DEFAULT_FORM
  return {
    age: String(p.age ?? ''),
    sex: p.sex ?? 'male',
    heightCm: String(p.heightCm ?? ''),
    heightUnit: 'cm', heightFt: '', heightIn: '',
    weightKg: String(p.weightKg ?? ''),
    weightUnit: 'kg', weightLbs: '',
    targetWeightKg: String(p.targetWeightKg ?? ''),
    targetWeightLbs: '',
    activityLevel: p.activityLevel ?? 'moderate',
    goal: p.goal ?? 'recomp',
    deficitPct: p.deficitPct ?? 20,
    surplusPct: p.surplusPct ?? 10,
    manualMode: !!p.manualTargets,
    manualKcal:    p.manualTargets ? String(p.manualTargets.kcal)    : '',
    manualProtein: p.manualTargets ? String(p.manualTargets.protein) : '',
    manualCarb:    p.manualTargets ? String(p.manualTargets.carb)    : '',
    manualFat:     p.manualTargets ? String(p.manualTargets.fat)     : '',
    manualWarn: '',
  }
}

// ── Main component ────────────────────────────────────────────────────────────
// Props:
//   onSave(profile)    — called with validated profile when user saves
//   onCancel()         — optional; shown as Cancel button (for edit mode in Plan.jsx)
//   initialProfile     — pre-populates the form (for Plan.jsx edit mode)
export default function Onboarding({ onSave, onCancel, initialProfile }) {
  const navigate = useNavigate()
  const [form, setForm] = useState(() => profileToForm(initialProfile))
  const [step, setStep] = useState(0)
  const [errs, setErrs] = useState({})

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // ── Canonical metric values (always in SI) ────────────────────────────────
  const mH = form.heightUnit === 'cm'
    ? parseFloat(form.heightCm) || 0
    : Math.round(parseFloat(form.heightFt || 0) * 30.48 + parseFloat(form.heightIn || 0) * 2.54)
  const mW = form.weightUnit === 'kg'
    ? parseFloat(form.weightKg) || 0
    : Math.round(parseFloat(form.weightLbs || 0) / 2.2046 * 10) / 10
  const mT = form.weightUnit === 'kg'
    ? parseFloat(form.targetWeightKg) || 0
    : Math.round(parseFloat(form.targetWeightLbs || 0) / 2.2046 * 10) / 10

  // ── Unit toggles ──────────────────────────────────────────────────────────
  function toggleH() {
    const u = form.heightUnit === 'cm' ? 'imperial' : 'cm'
    if (u === 'imperial' && mH) {
      setForm(f => ({ ...f, heightUnit: 'imperial',
        heightFt: String(Math.floor(mH / 30.48)),
        heightIn: String(Math.round((mH % 30.48) / 2.54)) }))
    } else if (u === 'cm' && mH) {
      setForm(f => ({ ...f, heightUnit: 'cm', heightCm: String(mH) }))
    } else {
      set('heightUnit', u)
    }
  }

  function toggleW() {
    const u = form.weightUnit === 'kg' ? 'lbs' : 'kg'
    if (u === 'lbs' && mW) {
      setForm(f => ({ ...f, weightUnit: 'lbs',
        weightLbs:       String(Math.round(mW * 2.2046 * 10) / 10),
        targetWeightLbs: String(mT ? Math.round(mT * 2.2046 * 10) / 10 : '') }))
    } else if (u === 'kg' && mW) {
      setForm(f => ({ ...f, weightUnit: 'kg',
        weightKg:       String(mW),
        targetWeightKg: String(mT || '') }))
    } else {
      set('weightUnit', u)
    }
  }

  // ── Validation ────────────────────────────────────────────────────────────
  function validate() {
    const e = {}
    if (!form.age || +form.age < 13 || +form.age > 99) e.age = 'Enter age 13–99'
    if (mH < 100 || mH > 250) e.height = 'Enter a valid height (100–250 cm)'
    if (mW < 30 || mW > 300) e.weight = 'Enter a valid weight (30–300 kg / 66–660 lbs)'
    if (mT < 30 || mT > 300) e.targetWeight = 'Enter a valid target weight'
    setErrs(e)
    return !Object.keys(e).length
  }

  // ── Live plan preview (recalculates on every form change) ─────────────────
  const preview = (mH && mW && +form.age) ? calcTargets({
    age: +form.age, sex: form.sex, heightCm: mH, weightKg: mW, targetWeightKg: mT,
    activityLevel: form.activityLevel, goal: form.goal,
    deficitPct:  Math.min(Math.max(+form.deficitPct  || 20, 5), 25),
    surplusPct:  Math.min(Math.max(+form.surplusPct  || 10, 5), 20),
  }) : null

  // ── Auto-balance state ────────────────────────────────────────────────────
  const floor         = form.sex === 'male' ? 1500 : 1200
  const manualKcalNum = Math.round(parseFloat(form.manualKcal) || 0)
  const manualTotal   = form.manualMode
    ? Math.round(
        (parseFloat(form.manualProtein) || 0) * 4 +
        (parseFloat(form.manualCarb)    || 0) * 4 +
        (parseFloat(form.manualFat)     || 0) * 9)
    : null

  function onManualChange(field, val) {
    const ctx = {
      weightKg:        mW,
      currentKcal:     parseFloat(form.manualKcal)    || 0,
      currentProtein:  parseFloat(form.manualProtein) || 0,
      currentFat:      parseFloat(form.manualFat)     || 0,
    }
    const result = applyBalance(field, val, ctx)
    if (!result) { set(field, val); return }

    const updates = { [field]: val, manualWarn: result.warn ?? '' }
    if (result.protein != null) updates.manualProtein = String(result.protein)
    if (result.fat     != null) updates.manualFat     = String(result.fat)
    if (result.carb    != null) updates.manualCarb    = String(result.carb)
    setForm(f => ({ ...f, ...updates }))
    setErrs(e => ({ ...e, manual: undefined }))
  }

  function toggleManual() {
    if (!form.manualMode && preview) {
      setForm(f => ({ ...f, manualMode: true, manualWarn: '',
        manualKcal:    String(preview.kcal),
        manualProtein: String(preview.protein),
        manualCarb:    String(preview.carb),
        manualFat:     String(preview.fat) }))
    } else {
      set('manualMode', !form.manualMode)
    }
    setErrs(e => ({ ...e, manual: undefined }))
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  function doSave() {
    let manualTargets = null
    if (form.manualMode) {
      const mk = Math.round(parseFloat(form.manualKcal)    || 0)
      const mp = Math.round(parseFloat(form.manualProtein) || 0)
      const mc = Math.max(0, Math.round(parseFloat(form.manualCarb) || 0))
      const mf = Math.round(parseFloat(form.manualFat)     || 0)
      if (mk <= 0 || mp <= 0 || mf <= 0) {
        setErrs(e => ({ ...e, manual: 'Calories, protein, and fat must all be above zero.' }))
        return
      }
      if (mk < floor) {
        setErrs(e => ({ ...e, manual: `Calorie target must be at least ${floor.toLocaleString()} kcal (safety minimum for ${form.sex === 'male' ? 'men' : 'women'}).` }))
        return
      }
      manualTargets = { kcal: mk, protein: mp, carb: mc, fat: mf }
    }
    onSave({
      age:    +form.age, sex: form.sex,
      heightCm: mH, weightKg: mW, targetWeightKg: mT,
      activityLevel: form.activityLevel, goal: form.goal,
      deficitPct: Math.min(Math.max(+form.deficitPct || 20, 5), 25),
      surplusPct: Math.min(Math.max(+form.surplusPct || 10, 5), 20),
      manualTargets,
    })
    navigate('/dashboard', { replace: true })
  }

  // ── Shared wrapper ────────────────────────────────────────────────────────
  const wrap = (stepLabel, children) => (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '40px 20px 72px',
    }}>
      {/* Brand header */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)', letterSpacing: -.5 }}>
          VitalGraph
        </div>
        <div style={{ fontSize: 12, color: 'var(--txt3)', marginTop: 3 }}>{stepLabel}</div>
      </div>
      {/* Onboarding renders via Layout's early return (no profile yet), bypassing the
          app shell and Outlet entirely. The route-handle width system never applies here,
          so this component constrains its own width using the shared constant directly. */}
      <div style={{ width: '100%', maxWidth: CONTENT_WIDTH_NARROW }}>{children}</div>
    </div>
  )

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 0 — Body metrics
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 0) return wrap('Step 1 of 2 — Body stats', (
    <>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 22, fontWeight: 750, color: 'var(--txt)', marginBottom: 4 }}>
          Set up your profile
        </h1>
        <p style={{ fontSize: 13, color: 'var(--txt3)', lineHeight: 1.5 }}>
          Your stats are used to calculate personalised calorie and macro targets using the Mifflin-St Jeor formula.
        </p>
      </div>

      <Card style={{ padding: '22px 22px 6px', marginBottom: 18 }}>

        <FieldRow label="Age" err={errs.age}>
          <input type="number" min="13" max="99" placeholder="e.g. 28"
            value={form.age} style={inp(96)}
            onChange={e => set('age', e.target.value)} />
        </FieldRow>

        <FieldRow label="Sex">
          <SegButtons value={form.sex}
            opts={[{ v: 'male', l: 'Male' }, { v: 'female', l: 'Female' }]}
            onChange={v => set('sex', v)} />
        </FieldRow>

        <FieldRow label="Height" err={errs.height}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {form.heightUnit === 'cm'
              ? <input type="number" placeholder="e.g. 178" value={form.heightCm}
                  style={inp(88)} onChange={e => set('heightCm', e.target.value)} />
              : <>
                  <input type="number" placeholder="ft" value={form.heightFt}
                    style={inp(56)} onChange={e => set('heightFt', e.target.value)} />
                  <span style={{ fontSize: 13, color: 'var(--txt3)' }}>ft</span>
                  <input type="number" placeholder="in" value={form.heightIn}
                    style={inp(56)} onChange={e => set('heightIn', e.target.value)} />
                  <span style={{ fontSize: 13, color: 'var(--txt3)' }}>in</span>
                </>
            }
            <GhostBtn onClick={toggleH}>
              {form.heightUnit === 'cm' ? '↔ ft / in' : '↔ cm'}
            </GhostBtn>
          </div>
        </FieldRow>

        <FieldRow label="Current weight" err={errs.weight}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {form.weightUnit === 'kg'
              ? <input type="number" placeholder="e.g. 80" value={form.weightKg}
                  style={inp(88)} onChange={e => set('weightKg', e.target.value)} />
              : <input type="number" placeholder="e.g. 176" value={form.weightLbs}
                  style={inp(88)} onChange={e => set('weightLbs', e.target.value)} />
            }
            <span style={{ fontSize: 13, color: 'var(--txt3)' }}>{form.weightUnit}</span>
            <GhostBtn onClick={toggleW}>
              {form.weightUnit === 'kg' ? '↔ lbs' : '↔ kg'}
            </GhostBtn>
          </div>
        </FieldRow>

        <FieldRow label="Target weight" err={errs.targetWeight}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {form.weightUnit === 'kg'
              ? <input type="number" placeholder="e.g. 75" value={form.targetWeightKg}
                  style={inp(88)} onChange={e => set('targetWeightKg', e.target.value)} />
              : <input type="number" placeholder="e.g. 165" value={form.targetWeightLbs}
                  style={inp(88)} onChange={e => set('targetWeightLbs', e.target.value)} />
            }
            <span style={{ fontSize: 13, color: 'var(--txt3)' }}>{form.weightUnit}</span>
          </div>
        </FieldRow>

        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)', marginBottom: 10 }}>
            Activity level
          </div>
          {ACTIVITY.map(a => (
            <RadioCard key={a.id}
              selected={form.activityLevel === a.id}
              onClick={() => set('activityLevel', a.id)}>
              <div>
                <div style={{ fontSize: 13, fontWeight: form.activityLevel === a.id ? 600 : 400, color: 'var(--txt)' }}>
                  {a.label}
                </div>
                <div style={{ fontSize: 12, color: 'var(--txt3)', marginTop: 1 }}>{a.desc}</div>
              </div>
            </RadioCard>
          ))}
        </div>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        {onCancel && <GhostBtn onClick={onCancel}>Cancel</GhostBtn>}
        <button type="button" onClick={() => { if (validate()) setStep(1) }} style={primaryBtnStyle}>
          Calculate my plan →
        </button>
      </div>
    </>
  ))

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 1 — Goal + targets + manual override
  // ══════════════════════════════════════════════════════════════════════════
  return wrap('Step 2 of 2 — Your plan', (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <GhostBtn onClick={() => setStep(0)}>← Back</GhostBtn>
        <h1 style={{ fontSize: 22, fontWeight: 750, color: 'var(--txt)' }}>Your plan</h1>
      </div>

      {/* BMR / TDEE derivation note */}
      {preview && (
        <Card style={{ padding: '12px 16px', marginBottom: 12 }}>
          <div style={{ fontSize: 12.5 }}>
            <span style={{ fontWeight: 600, color: 'var(--txt)' }}>Mifflin-St Jeor BMR:</span>
            <span style={{ color: 'var(--txt2)' }}>
              {' '}{preview._meta.bmr.toLocaleString()} kcal
              {' · ×'}{preview._meta.actMult} ({preview._meta.act}) = TDEE{' '}
            </span>
            <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
              {preview._meta.tdee.toLocaleString()} kcal
            </span>
          </div>
        </Card>
      )}

      {/* Goal selector */}
      <Card style={{ padding: '16px 18px 10px', marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)', marginBottom: 12 }}>Goal</div>

        {GOALS.map(g => (
          <RadioCard key={g.id} selected={form.goal === g.id} onClick={() => set('goal', g.id)}>
            <div>
              <div style={{ fontSize: 13, fontWeight: form.goal === g.id ? 600 : 400, color: 'var(--txt)' }}>
                {g.label}
              </div>
              <div style={{ fontSize: 12, color: 'var(--txt3)', marginTop: 1 }}>{g.desc}</div>
            </div>
          </RadioCard>
        ))}

        {/* Deficit slider */}
        {form.goal === 'fat_loss' && (
          <div style={{ marginTop: 10, padding: '12px 14px', background: 'var(--surface2)', borderRadius: 10 }}>
            <div style={{ fontSize: 12.5, color: 'var(--txt2)', marginBottom: 8 }}>
              Deficit:{' '}
              <span style={{ fontWeight: 600, color: 'var(--txt)' }}>{form.deficitPct}%</span>
              {' '}below TDEE
              {preview && <span style={{ color: 'var(--txt3)' }}> → {preview.kcal.toLocaleString()} kcal/day</span>}
            </div>
            <input type="range" min="5" max="25" step="1" value={form.deficitPct}
              style={{ width: '100%', accentColor: 'var(--primary)' }}
              onChange={e => set('deficitPct', +e.target.value)} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--txt3)', marginTop: 3 }}>
              <span>5% — gentle</span><span>25% — aggressive</span>
            </div>
            {preview && preview.kcal <= preview._meta.floor && (
              <div style={{ fontSize: 11.5, color: 'var(--amber)', marginTop: 6 }}>
                Capped at safety minimum — {preview._meta.floor.toLocaleString()} kcal/day
              </div>
            )}
          </div>
        )}

        {/* Surplus slider */}
        {form.goal === 'muscle_gain' && (
          <div style={{ marginTop: 10, padding: '12px 14px', background: 'var(--surface2)', borderRadius: 10 }}>
            <div style={{ fontSize: 12.5, color: 'var(--txt2)', marginBottom: 8 }}>
              Surplus:{' '}
              <span style={{ fontWeight: 600, color: 'var(--txt)' }}>{form.surplusPct}%</span>
              {' '}above TDEE
              {preview && <span style={{ color: 'var(--txt3)' }}> → {preview.kcal.toLocaleString()} kcal/day</span>}
            </div>
            <input type="range" min="5" max="20" step="1" value={form.surplusPct}
              style={{ width: '100%', accentColor: 'var(--primary)' }}
              onChange={e => set('surplusPct', +e.target.value)} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--txt3)', marginTop: 3 }}>
              <span>5% — lean bulk</span><span>20% — aggressive</span>
            </div>
          </div>
        )}
      </Card>

      {/* Live targets preview */}
      {preview && (
        <Card style={{ padding: '16px 18px', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)', marginBottom: 4 }}>
            Daily targets
          </div>
          {[
            { label: 'Calories', val: preview.kcal.toLocaleString(), unit: 'kcal', note: 'target per day' },
            { label: 'Protein',  val: preview.protein, unit: 'g', note: '1.0 g/lb bodyweight — muscle retention & growth' },
            { label: 'Fat',      val: preview.fat,     unit: 'g', note: '25% of calories (min 0.3 g/lb essential)' },
            { label: 'Carbs',    val: preview.carb,    unit: 'g', note: 'remaining calories after protein & fat' },
            { label: 'Fiber',    val: preview.fiber,   unit: 'g', note: '14 g per 1,000 kcal (DRI basis)' },
          ].map(row => (
            <div key={row.label} style={{
              display: 'flex', alignItems: 'baseline', gap: 8,
              padding: '7px 0', borderTop: '1px solid var(--border)',
            }}>
              <span style={{ minWidth: 66, fontSize: 13, color: 'var(--txt2)' }}>{row.label}</span>
              <span style={{ fontSize: 17, fontWeight: 700, minWidth: 50, color: 'var(--txt)', fontVariantNumeric: 'tabular-nums' }}>
                {row.val}
              </span>
              <span style={{ fontSize: 11.5, color: 'var(--txt3)' }}>{row.unit} · {row.note}</span>
            </div>
          ))}
          <div style={{
            fontSize: 11.5, color: 'var(--txt3)', marginTop: 12, lineHeight: 1.65,
            borderTop: '1px solid var(--border)', paddingTop: 10,
          }}>
            Evidence-based starting points — adjust based on your body's response over 2–4 weeks.
            Not medical advice. Consult a qualified professional for personalised guidance.
          </div>
        </Card>
      )}

      {/* Manual override */}
      <ManualEditor
        form={form} floor={floor}
        manualKcalNum={manualKcalNum} manualTotal={manualTotal}
        onManualChange={onManualChange} toggleManual={toggleManual}
        errs={errs}
      />

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
        {onCancel && <GhostBtn onClick={onCancel}>Cancel</GhostBtn>}
        <GhostBtn onClick={() => setStep(0)}>← Back</GhostBtn>
        <button type="button" onClick={doSave} style={primaryBtnStyle}>
          Save &amp; start tracking →
        </button>
      </div>
    </>
  ))
}

// ── Manual override section ───────────────────────────────────────────────────
// Extracted so Plan.jsx can also use it inline.
export function ManualEditor({ form, floor, manualKcalNum, manualTotal, onManualChange, toggleManual, errs }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)',
      marginBottom: 14, overflow: 'hidden',
    }}>
      {/* Toggle header */}
      <div onClick={toggleManual} style={{
        padding: '14px 18px', cursor: 'pointer',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        userSelect: 'none',
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>
            {form.manualMode ? 'Manual targets — active' : 'Adjust targets manually'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--txt3)', marginTop: 2 }}>
            {form.manualMode
              ? 'Auto-balanced — macros always sum to your calorie target'
              : 'Override the calculated values; macros auto-balance as you type'}
          </div>
        </div>
        <span style={{ fontSize: 12, color: 'var(--txt3)', flexShrink: 0, marginLeft: 12 }}>
          {form.manualMode ? '▲' : '▼'}
        </span>
      </div>

      {form.manualMode && (
        <div style={{ padding: '0 18px 18px', borderTop: '1px solid var(--border)' }}>

          {/* Calorie master control */}
          <div style={{ marginTop: 14, marginBottom: 16, padding: '12px 14px', background: 'var(--surface2)', borderRadius: 10 }}>
            <div style={{ fontSize: 12.5, color: 'var(--txt2)', marginBottom: 6 }}>
              Calorie target
              <span style={{ color: 'var(--txt3)' }}> — changing this recalculates all macros from science defaults</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="number" min={floor} value={form.manualKcal}
                style={{
                  height: 38, width: 110, padding: '0 10px',
                  border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface)', fontSize: 14, color: 'var(--txt)', outline: 'none',
                }}
                onChange={e => onManualChange('manualKcal', e.target.value)} />
              <span style={{ fontSize: 13, color: 'var(--txt3)' }}>kcal / day</span>
            </div>
            {manualKcalNum > 0 && manualKcalNum < floor && (
              <div style={{ fontSize: 11.5, color: 'var(--amber)', marginTop: 7 }}>
                Below safe minimum ({floor.toLocaleString()} kcal for {form.sex === 'male' ? 'men' : 'women'}) — raise before saving.
              </div>
            )}
          </div>

          {/* Macro fields */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12.5, color: 'var(--txt2)', marginBottom: 10 }}>
              Macros
              <span style={{ color: 'var(--txt3)' }}>
                {' — '}protein is the anchor; carbs flex when P / F change; fat flexes when C changes
              </span>
            </div>
            {[
              { label: 'Protein', field: 'manualProtein', cal: 4, note: 'anchor' },
              { label: 'Carbs',   field: 'manualCarb',    cal: 4, note: 'flexes ← P or F change' },
              { label: 'Fat',     field: 'manualFat',     cal: 9, note: 'flexes ← C change' },
            ].map(({ label, field, cal, note }) => {
              const grams = parseFloat(form[field]) || 0
              const pct   = manualKcalNum > 0 ? Math.round(grams * cal / manualKcalNum * 100) : 0
              return (
                <div key={field} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
                  <span style={{ minWidth: 56, fontSize: 13, color: 'var(--txt2)' }}>{label}</span>
                  <input type="number" min="0" value={form[field]}
                    style={{
                      height: 36, width: 90, padding: '0 10px',
                      border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
                      background: 'var(--surface)', fontSize: 14, color: 'var(--txt)', outline: 'none',
                    }}
                    onChange={e => onManualChange(field, e.target.value)} />
                  <span style={{ fontSize: 12.5, color: 'var(--txt3)' }}>g</span>
                  {manualKcalNum > 0 && (
                    <span style={{ fontSize: 11.5, color: 'var(--txt3)', minWidth: 30 }}>{pct}%</span>
                  )}
                  <span style={{ fontSize: 10.5, color: 'var(--txt3)', marginLeft: 'auto', textAlign: 'right' }}>
                    {note}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Balance status */}
          {manualKcalNum > 0 && manualTotal !== null && (() => {
            const diff = manualTotal - manualKcalNum
            const ok   = Math.abs(diff) <= 2
            return (
              <div style={{
                fontSize: 12.5, padding: '8px 12px', borderRadius: 8, marginBottom: 8,
                background: ok ? 'var(--primary-soft)' : 'var(--amber-soft)',
                border: `1px solid ${ok ? 'var(--primary-mid)' : 'var(--amber)'}`,
              }}>
                {ok
                  ? <span style={{ color: 'var(--primary)' }}>
                      ✓ {manualTotal.toLocaleString()} kcal from macros — on target
                    </span>
                  : <span style={{ color: 'var(--amber)' }}>
                      Macros total {manualTotal.toLocaleString()} kcal vs {manualKcalNum.toLocaleString()} target ({diff > 0 ? '+' : ''}{diff} kcal rounding gap)
                    </span>
                }
              </div>
            )
          })()}

          {/* Auto-balance constraint warning */}
          {form.manualWarn && (
            <div style={{
              fontSize: 11.5, color: 'var(--amber)', padding: '8px 12px', borderRadius: 8,
              marginBottom: 8, background: 'var(--amber-soft)', border: '1px solid var(--amber)',
            }}>
              {form.manualWarn}
            </div>
          )}

          {errs.manual && (
            <div style={{ fontSize: 11.5, color: 'var(--coral)', marginTop: 4 }}>{errs.manual}</div>
          )}
        </div>
      )}
    </div>
  )
}
