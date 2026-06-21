import { useNavigate } from 'react-router-dom'
import { useProfile } from '../context/ProfileContext.jsx'
import { ACTIVITY, GOALS } from '../data/foodData.js'

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

function StatRow({ label, value, unit }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      padding: '8px 0', borderBottom: '1px solid var(--border)',
    }}>
      <span style={{ fontSize: 13, color: 'var(--txt2)' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--txt)' }}>
        {value}
        {unit
          ? <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--txt3)', marginLeft: 4 }}>{unit}</span>
          : null}
      </span>
    </div>
  )
}

const MACRO_CONFIG = [
  { key: 'kcal',    label: 'Calories', unit: 'kcal', color: 'var(--primary)', soft: 'var(--primary-soft)' },
  { key: 'protein', label: 'Protein',  unit: 'g',    color: 'var(--primary)', soft: 'var(--primary-soft)' },
  { key: 'carb',    label: 'Carbs',    unit: 'g',    color: 'var(--blue)',    soft: 'var(--blue-soft)'    },
  { key: 'fat',     label: 'Fat',      unit: 'g',    color: 'var(--amber)',   soft: 'var(--amber-soft)'   },
  { key: 'fiber',   label: 'Fiber',    unit: 'g',    color: 'var(--coral)',   soft: 'var(--coral-soft)'   },
]

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 11.5, fontWeight: 700, color: 'var(--txt3)',
      textTransform: 'uppercase', letterSpacing: .6, marginBottom: 10,
    }}>
      {children}
    </div>
  )
}

export default function Profile() {
  const { profile, targets } = useProfile()
  const navigate = useNavigate()

  if (!profile) {
    return (
      <div style={{ maxWidth: 480 }}>
        <h1 style={{ fontSize: 22, fontWeight: 750, color: 'var(--txt)', marginBottom: 6 }}>My profile</h1>
        <p style={{ fontSize: 13, color: 'var(--txt3)', marginBottom: 22 }}>
          No profile set up yet. Complete onboarding to see your stats here.
        </p>
        <button onClick={() => navigate('/plan')} style={{
          height: 40, padding: '0 24px', background: 'var(--primary)', color: '#fff',
          border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>
          Set up profile
        </button>
      </div>
    )
  }

  const actLabel  = ACTIVITY.find(a => a.id === profile.activityLevel)?.label ?? profile.activityLevel
  const goalLabel = GOALS.find(g => g.id === profile.goal)?.label ?? profile.goal
  const lbs       = Math.round(profile.weightKg * 2.2046 * 10) / 10
  const targetLbs = Math.round(profile.targetWeightKg * 2.2046 * 10) / 10
  const heightFt  = Math.floor(profile.heightCm / 30.48)
  const heightIn  = Math.round((profile.heightCm % 30.48) / 2.54)

  return (
    <div style={{ maxWidth: 600 }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        marginBottom: 28, gap: 16,
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 750, color: 'var(--txt)', lineHeight: 1.2 }}>
            My profile
          </h1>
          <p style={{ fontSize: 13, color: 'var(--txt3)', marginTop: 4 }}>
            {goalLabel} · {targets.kcal.toLocaleString()} kcal/day
          </p>
        </div>
        <button onClick={() => navigate('/plan')} style={{
          height: 38, padding: '0 20px', background: 'var(--primary)', color: '#fff',
          border: 'none', borderRadius: 'var(--radius-sm)',
          fontSize: 13.5, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
          boxShadow: '0 2px 8px rgba(19,184,138,.25)',
        }}>
          Edit plan &amp; targets
        </button>
      </div>

      {/* Body stats */}
      <SectionLabel>Body stats</SectionLabel>
      <Card style={{ padding: '4px 22px', marginBottom: 20 }}>
        <StatRow label="Age"            value={`${profile.age}`}           unit="yr" />
        <StatRow label="Sex"            value={profile.sex === 'male' ? 'Male' : 'Female'} />
        <StatRow label="Height"         value={`${profile.heightCm} cm`}   unit={`(${heightFt}′ ${heightIn}″)`} />
        <StatRow label="Current weight" value={`${profile.weightKg} kg`}   unit={`(${lbs} lbs)`} />
        <StatRow label="Target weight"  value={`${profile.targetWeightKg} kg`} unit={`(${targetLbs} lbs)`} />
        <StatRow label="Activity"       value={actLabel} />
      </Card>

      {/* Goal */}
      <SectionLabel>Goal</SectionLabel>
      <Card style={{ padding: '4px 22px', marginBottom: 20 }}>
        <StatRow label="Goal"   value={goalLabel} />
        {profile.goal === 'fat_loss'    && <StatRow label="Deficit"  value={`${profile.deficitPct}%`} unit="below TDEE" />}
        {profile.goal === 'muscle_gain' && <StatRow label="Surplus"  value={`${profile.surplusPct}%`} unit="above TDEE" />}
        {targets._meta && (
          <>
            <StatRow label="BMR"  value={targets._meta.bmr.toLocaleString()}  unit="kcal (Mifflin-St Jeor)" />
            <StatRow label="TDEE" value={targets._meta.tdee.toLocaleString()} unit="kcal" />
          </>
        )}
      </Card>

      {/* Daily targets */}
      <SectionLabel>
        Daily targets
        {profile.manualTargets && (
          <span style={{ color: 'var(--violet)', marginLeft: 8, textTransform: 'none', letterSpacing: 0, fontWeight: 600 }}>
            · manual override active
          </span>
        )}
      </SectionLabel>
      <Card style={{ padding: '18px 22px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {MACRO_CONFIG.map(m => (
            <div key={m.key} style={{ textAlign: 'center' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9,
                background: m.soft, color: m.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 800, margin: '0 auto 8px',
              }}>
                {m.label.slice(0, 3).toUpperCase()}
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--txt)', lineHeight: 1 }}>
                {m.key === 'kcal' ? targets.kcal.toLocaleString() : targets[m.key]}
              </div>
              <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 3 }}>{m.unit}</div>
              <div style={{ fontSize: 11.5, fontWeight: 500, color: m.color, marginTop: 2 }}>{m.label}</div>
            </div>
          ))}
        </div>
      </Card>

    </div>
  )
}
