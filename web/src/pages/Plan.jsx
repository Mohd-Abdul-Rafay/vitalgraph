import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ACTIVITY, GOALS } from '../data/foodData.js'
import { calcTargets, applyBalance } from '../lib/profile.js'
import { useProfile } from '../context/ProfileContext.jsx'
import { profileToForm, ManualEditor } from './Onboarding.jsx'

// ── Shared style helpers (same as Onboarding) ─────────────────────────────────
const inp = (w) => ({
  height: 38, width: w, padding: '0 10px',
  border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
  background: 'var(--surface)', fontSize: 14, color: 'var(--txt)', outline: 'none',
})

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

function GhostBtn({ onClick, children }) {
  return (
    <button onClick={onClick} style={{
      height: 34, padding: '0 12px', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)', background: 'none',
      fontSize: 12.5, color: 'var(--txt2)', cursor: 'pointer',
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
          fontWeight: value === o.v ? 600 : 400, cursor: 'pointer',
          border: `1.5px solid ${value === o.v ? 'var(--primary)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-sm)',
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

function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: subtitle ? 3 : 0 }}>
        <div style={{ width: 3, height: 18, background: 'var(--primary)', borderRadius: 2, flexShrink: 0 }} />
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--txt)' }}>{title}</span>
      </div>
      {subtitle && <div style={{ fontSize: 12.5, color: 'var(--txt3)', marginLeft: 13 }}>{subtitle}</div>}
    </div>
  )
}

// ── AI plan explainer ─────────────────────────────────────────────────────────
// Sends the saved profile + computed targets to POST /explain-plan on the
// FastAPI backend. If VITE_BACKEND_URL is unset (e.g. Vercel frontend-only
// deploy), ExplainCard renders a coming-soon state instead of a button that
// would immediately error. Set VITE_BACKEND_URL=http://localhost:8000 locally.
const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL ?? '').trim() || null
const EXPLAIN_IDLE = { status: 'idle', text: '', error: '' }

function ExplainCard() {
  const { profile, targets } = useProfile()
  const [explain, setExplain] = useState(EXPLAIN_IDLE)

  // Clear stale explanation when the saved profile/targets change
  useEffect(() => { setExplain(EXPLAIN_IDLE) }, [profile])

  if (!targets._meta) return null  // manual-override targets have no _meta — skip

  // Backend not configured — intentional coming-soon state (mirrors sidebar SOON treatment)
  if (!BACKEND_URL) {
    return (
      <Card style={{ padding: '18px 22px', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--txt)' }}>
            AI plan explainer
          </span>
          <span style={{
            fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
            color: 'var(--violet)', background: 'var(--violet-soft)',
          }}>
            SOON
          </span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--txt3)', lineHeight: 1.55 }}>
          Plain-language explanation of your personalised targets — how your BMR,
          TDEE, and macro splits were calculated — powered by AI.
        </p>
      </Card>
    )
  }

  async function fetchExplanation() {
    setExplain({ status: 'loading', text: '', error: '' })
    try {
      const res = await fetch(`${BACKEND_URL}/explain-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age:             profile.age,
          sex:             profile.sex,
          height:          profile.heightCm,
          weight:          profile.weightKg,
          target_weight:   profile.targetWeightKg || null,
          activity_level:  profile.activityLevel,
          goal:            profile.goal,
          bmr:             targets._meta.bmr,
          tdee:            targets._meta.tdee,
          calorie_target:  targets.kcal,
          protein_g:       targets.protein,
          carb_g:          targets.carb,
          fat_g:           targets.fat,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setExplain({ status: 'error', text: '', error: data.detail || `Server error ${res.status}` })
        return
      }
      setExplain({ status: 'done', text: data.explanation, error: '' })
    } catch {
      setExplain({
        status: 'error', text: '',
        error: "Couldn't reach the AI service — make sure the backend server is running (port 8000).",
      })
    }
  }

  const loading = explain.status === 'loading'

  return (
    <Card style={{ padding: '18px 22px', marginBottom: 24 }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--txt)', marginBottom: 2 }}>
            AI plan explanation
          </div>
          <div style={{ fontSize: 12, color: 'var(--txt3)' }}>
            Explains your targets and the science behind them
          </div>
        </div>
        <button
          onClick={fetchExplanation}
          disabled={loading}
          style={{
            height: 36, padding: '0 18px', flexShrink: 0,
            background: loading ? 'var(--primary-mid)' : 'var(--primary)',
            color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)',
            fontSize: 13, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.8 : 1,
            transition: 'background .15s',
          }}
        >
          {loading ? 'Thinking…' : explain.status === 'done' ? 'Refresh' : 'Explain my plan'}
        </button>
      </div>

      {/* Error */}
      {explain.status === 'error' && (
        <div style={{
          marginTop: 14, padding: '12px 14px', borderRadius: 8,
          background: 'rgba(220,80,60,.07)', border: '1px solid rgba(180,60,60,.25)',
          fontSize: 13, color: 'var(--coral)', lineHeight: 1.55,
        }}>
          {explain.error}
        </div>
      )}

      {/* Explanation */}
      {explain.status === 'done' && (
        <div style={{ marginTop: 16 }}>
          <div style={{
            height: 1, background: 'var(--border)', marginBottom: 14,
          }} />
          {explain.text.split(/\n\n+/).map((para, i) => (
            <p key={i} style={{
              margin: '0 0 10px', fontSize: 13.5, lineHeight: 1.7, color: 'var(--txt)',
            }}>
              {para.trim()}
            </p>
          ))}
          <div style={{
            marginTop: 8, paddingTop: 10, borderTop: '1px solid var(--border)',
            fontSize: 11.5, color: 'var(--txt3)', lineHeight: 1.6,
          }}>
            AI-generated guidance based on your targets. Not medical advice.
          </div>
        </div>
      )}
    </Card>
  )
}

export default function Plan() {
  const { profile, saveProfile } = useProfile()
  const navigate = useNavigate()
  const [form, setForm] = useState(() => profileToForm(profile))
  const [errs, setErrs] = useState({})
  const [saved, setSaved] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // ── Canonical metric values ────────────────────────────────────────────────
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
    if (u === 'imperial' && mH)
      setForm(f => ({ ...f, heightUnit: 'imperial',
        heightFt: String(Math.floor(mH / 30.48)),
        heightIn: String(Math.round((mH % 30.48) / 2.54)) }))
    else if (u === 'cm' && mH)
      setForm(f => ({ ...f, heightUnit: 'cm', heightCm: String(mH) }))
    else set('heightUnit', u)
  }

  function toggleW() {
    const u = form.weightUnit === 'kg' ? 'lbs' : 'kg'
    if (u === 'lbs' && mW)
      setForm(f => ({ ...f, weightUnit: 'lbs',
        weightLbs: String(Math.round(mW * 2.2046 * 10) / 10),
        targetWeightLbs: String(mT ? Math.round(mT * 2.2046 * 10) / 10 : '') }))
    else if (u === 'kg' && mW)
      setForm(f => ({ ...f, weightUnit: 'kg', weightKg: String(mW), targetWeightKg: String(mT || '') }))
    else set('weightUnit', u)
  }

  // ── Live preview ──────────────────────────────────────────────────────────
  const preview = (mH && mW && +form.age) ? calcTargets({
    age: +form.age, sex: form.sex, heightCm: mH, weightKg: mW, targetWeightKg: mT,
    activityLevel: form.activityLevel, goal: form.goal,
    deficitPct: Math.min(Math.max(+form.deficitPct || 20, 5), 25),
    surplusPct: Math.min(Math.max(+form.surplusPct || 10, 5), 20),
  }) : null

  // ── Auto-balance ──────────────────────────────────────────────────────────
  const floor         = form.sex === 'male' ? 1500 : 1200
  const manualKcalNum = Math.round(parseFloat(form.manualKcal) || 0)
  const manualTotal   = form.manualMode
    ? Math.round((parseFloat(form.manualProtein) || 0) * 4 + (parseFloat(form.manualCarb) || 0) * 4 + (parseFloat(form.manualFat) || 0) * 9)
    : null

  function onManualChange(field, val) {
    const ctx = {
      weightKg: mW,
      currentKcal:    parseFloat(form.manualKcal)    || 0,
      currentProtein: parseFloat(form.manualProtein) || 0,
      currentFat:     parseFloat(form.manualFat)     || 0,
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
        manualKcal: String(preview.kcal), manualProtein: String(preview.protein),
        manualCarb: String(preview.carb), manualFat: String(preview.fat) }))
    } else {
      set('manualMode', !form.manualMode)
    }
    setErrs(e => ({ ...e, manual: undefined }))
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  function doSave() {
    const e = {}
    if (!form.age || +form.age < 13 || +form.age > 99) e.age = 'Enter age 13–99'
    if (mH < 100 || mH > 250) e.height = 'Enter a valid height'
    if (mW < 30 || mW > 300) e.weight = 'Enter a valid weight'
    if (mT < 30 || mT > 300) e.targetWeight = 'Enter a valid target weight'

    let manualTargets = null
    if (form.manualMode) {
      const mk = Math.round(parseFloat(form.manualKcal) || 0)
      const mp = Math.round(parseFloat(form.manualProtein) || 0)
      const mc = Math.max(0, Math.round(parseFloat(form.manualCarb) || 0))
      const mf = Math.round(parseFloat(form.manualFat) || 0)
      if (mk <= 0 || mp <= 0 || mf <= 0) e.manual = 'Calories, protein, and fat must all be above zero.'
      else if (mk < floor) e.manual = `Calorie target must be at least ${floor.toLocaleString()} kcal.`
      else manualTargets = { kcal: mk, protein: mp, carb: mc, fat: mf }
    }

    if (Object.keys(e).length) { setErrs(e); return }

    saveProfile({
      age: +form.age, sex: form.sex,
      heightCm: mH, weightKg: mW, targetWeightKg: mT,
      activityLevel: form.activityLevel, goal: form.goal,
      deficitPct: Math.min(Math.max(+form.deficitPct || 20, 5), 25),
      surplusPct: Math.min(Math.max(+form.surplusPct || 10, 5), 20),
      manualTargets,
    })
    setSaved(true)
    setTimeout(() => navigate('/dashboard'), 700)
  }

  return (
    <div>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 750, color: 'var(--txt)', lineHeight: 1.2 }}>
          Plan &amp; Targets
        </h1>
        <p style={{ fontSize: 13, color: 'var(--txt3)', marginTop: 4 }}>
          Edit your stats, goal, and calorie targets. Changes take effect immediately across the app.
        </p>
      </div>

      {/* ── Section 1: Body stats ──────────────────────────────────────────── */}
      <SectionHeader title="Body stats" />
      <Card style={{ padding: '22px 22px 6px', marginBottom: 24 }}>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
          <FieldRow label="Age" err={errs.age}>
            <input type="number" min="13" max="99" placeholder="e.g. 28"
              value={form.age} style={inp(96)} onChange={e => set('age', e.target.value)} />
          </FieldRow>
          <FieldRow label="Sex">
            <SegButtons value={form.sex}
              opts={[{ v: 'male', l: 'Male' }, { v: 'female', l: 'Female' }]}
              onChange={v => set('sex', v)} />
          </FieldRow>
        </div>

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
            <GhostBtn onClick={toggleH}>{form.heightUnit === 'cm' ? '↔ ft/in' : '↔ cm'}</GhostBtn>
          </div>
        </FieldRow>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
          <FieldRow label="Current weight" err={errs.weight}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {form.weightUnit === 'kg'
                ? <input type="number" placeholder="e.g. 80" value={form.weightKg}
                    style={inp(88)} onChange={e => set('weightKg', e.target.value)} />
                : <input type="number" placeholder="e.g. 176" value={form.weightLbs}
                    style={inp(88)} onChange={e => set('weightLbs', e.target.value)} />
              }
              <span style={{ fontSize: 13, color: 'var(--txt3)' }}>{form.weightUnit}</span>
              <GhostBtn onClick={toggleW}>{form.weightUnit === 'kg' ? '↔ lbs' : '↔ kg'}</GhostBtn>
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
        </div>

        <FieldRow label="Activity level">
          {ACTIVITY.map(a => (
            <RadioCard key={a.id} selected={form.activityLevel === a.id} onClick={() => set('activityLevel', a.id)}>
              <div>
                <div style={{ fontSize: 13, fontWeight: form.activityLevel === a.id ? 600 : 400, color: 'var(--txt)' }}>
                  {a.label}
                </div>
                <div style={{ fontSize: 12, color: 'var(--txt3)', marginTop: 1 }}>{a.desc}</div>
              </div>
            </RadioCard>
          ))}
        </FieldRow>
      </Card>

      {/* ── Section 2: Goal ────────────────────────────────────────────────── */}
      <SectionHeader title="Goal" />
      <Card style={{ padding: '16px 18px 10px', marginBottom: 24 }}>
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

      {/* ── Section 3: Live targets ────────────────────────────────────────── */}
      <SectionHeader
        title="Daily targets"
        subtitle={preview ? `Mifflin-St Jeor BMR: ${preview._meta.bmr.toLocaleString()} kcal · ×${preview._meta.actMult} (${preview._meta.act}) = TDEE ${preview._meta.tdee.toLocaleString()} kcal` : undefined}
      />
      {preview ? (
        <Card style={{ padding: '16px 18px', marginBottom: 24 }}>
          {[
            { label: 'Calories', val: preview.kcal.toLocaleString(), unit: 'kcal', note: 'target per day', color: 'var(--primary)' },
            { label: 'Protein',  val: preview.protein, unit: 'g', note: '1.0 g/lb bodyweight',  color: 'var(--primary)' },
            { label: 'Fat',      val: preview.fat,     unit: 'g', note: '25% of kcal (min 0.3 g/lb)', color: 'var(--amber)' },
            { label: 'Carbs',    val: preview.carb,    unit: 'g', note: 'remaining after P & F', color: 'var(--blue)' },
            { label: 'Fiber',    val: preview.fiber,   unit: 'g', note: '14 g / 1,000 kcal (DRI)',    color: 'var(--coral)' },
          ].map((row, i) => (
            <div key={row.label} style={{
              display: 'flex', alignItems: 'baseline', gap: 10,
              padding: '7px 0', borderTop: i > 0 ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: row.color, flexShrink: 0, marginBottom: 1,
              }} />
              <span style={{ minWidth: 60, fontSize: 13, color: 'var(--txt2)' }}>{row.label}</span>
              <span style={{ fontSize: 18, fontWeight: 700, minWidth: 52, color: 'var(--txt)', fontVariantNumeric: 'tabular-nums' }}>
                {row.val}
              </span>
              <span style={{ fontSize: 12, color: 'var(--txt3)' }}>{row.unit} · {row.note}</span>
            </div>
          ))}
          <div style={{ fontSize: 11.5, color: 'var(--txt3)', marginTop: 12, lineHeight: 1.65, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
            Evidence-based starting points — adjust based on your body's response over 2–4 weeks.
            Not medical advice. Consult a qualified professional for personalised guidance.
          </div>
        </Card>
      ) : (
        <Card style={{ padding: '18px', marginBottom: 24 }}>
          <div style={{ fontSize: 13, color: 'var(--txt3)' }}>
            Fill in your body stats above to see your computed targets.
          </div>
        </Card>
      )}

      {/* ── AI explanation ────────────────────────────────────────────────── */}
      <ExplainCard />

      {/* ── Section 4: Manual override ────────────────────────────────────── */}
      <SectionHeader title="Manual override" subtitle="Optional — override the science-based values with your own targets." />
      <ManualEditor
        form={form} floor={floor}
        manualKcalNum={manualKcalNum} manualTotal={manualTotal}
        onManualChange={onManualChange} toggleManual={toggleManual}
        errs={errs}
      />

      {/* Save row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
        {saved && (
          <span style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 500 }}>
            ✓ Saved — returning to dashboard…
          </span>
        )}
        <button
          onClick={doSave}
          disabled={saved}
          style={{
            height: 40, padding: '0 28px', background: saved ? 'var(--primary-mid)' : 'var(--primary)',
            color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)',
            fontSize: 14, fontWeight: 600, cursor: saved ? 'default' : 'pointer',
          }}
        >
          Save changes
        </button>
      </div>
    </div>
  )
}
