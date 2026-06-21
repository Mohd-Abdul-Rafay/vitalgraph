import { useProfile } from '../context/ProfileContext.jsx'
import { GOALS } from '../data/foodData.js'

// Placeholder consumed values — replaced when nutrition log is shared across pages
const PLACEHOLDER = {
  consumed: 646,
  protein: { value: 111, unit: 'g', kcalPer: 4 },
  carbs:   { value: 24,  unit: 'g', kcalPer: 4 },
  fat:     { value: 10,  unit: 'g', kcalPer: 9 },
  fiber:   { value: 3,   unit: 'g', kcalPer: 0 },
  micros: [
    { label: 'Iron',        value: 3.3,  rda: 18,   unit: 'mg', pct: 18 },
    { label: 'Calcium',     value: 355,  rda: 1000, unit: 'mg', pct: 36 },
    { label: 'Potassium',   value: 1102, rda: 3400, unit: 'mg', pct: 32 },
    { label: 'Vitamin A',   value: 520,  rda: 900,  unit: 'μg', pct: 58 },
    { label: 'Vitamin C',   value: 12.8, rda: 90,   unit: 'mg', pct: 14 },
  ],
}

const MACRO_STYLE = {
  protein: { color: 'var(--primary)',      soft: 'var(--primary-soft)', letter: 'P' },
  carbs:   { color: 'var(--blue)',         soft: 'var(--blue-soft)',    letter: 'C' },
  fat:     { color: 'var(--amber)',        soft: 'var(--amber-soft)',   letter: 'F' },
  fiber:   { color: 'var(--coral)',        soft: 'var(--coral-soft)',   letter: 'Fb' },
}

const FUTURE = [
  {
    title: 'Wearable sync',
    desc: 'Recovery, HRV, sleep quality, and resting heart rate — unified with your nutrition.',
    color: 'var(--violet)', soft: 'var(--violet-soft)', letter: 'W', tag: 'Planned',
    tagColor: 'var(--violet)', tagBg: 'var(--violet-soft)',
  },
  {
    title: 'Health reports',
    desc: 'Upload lab panels and bloodwork. VitalGraph reads and contextualizes them.',
    color: 'var(--blue)', soft: 'var(--blue-soft)', letter: 'R', tag: 'Planned',
    tagColor: 'var(--blue)', tagBg: 'var(--blue-soft)',
  },
  {
    title: 'AI Coach',
    desc: 'Cross-source AI that connects your nutrition, recovery, and health data over time.',
    color: 'var(--primary)', soft: 'var(--primary-soft)', letter: 'AI', tag: 'In progress',
    tagColor: 'var(--primary)', tagBg: 'var(--primary-soft)',
  },
]

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function Card({ children, style }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '20px 22px',
      boxShadow: 'var(--shadow-sm)',
      ...style,
    }}>
      {children}
    </div>
  )
}

function MacroCard({ id, macro, target }) {
  const { value, unit } = macro
  const { color, soft, letter } = MACRO_STYLE[id]
  const pct = Math.min(value / (target || 1) * 100, 100)
  const label = id.charAt(0).toUpperCase() + id.slice(1)

  return (
    <Card style={{ padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 8,
          background: soft, color, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 800, letterSpacing: -.3, flexShrink: 0,
        }}>
          {letter}
        </div>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--txt2)' }}>{label}</span>
      </div>

      <div style={{ marginBottom: 12 }}>
        <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--txt)', lineHeight: 1 }}>
          {value}
        </span>
        <span style={{ fontSize: 13, color: 'var(--txt3)', marginLeft: 3 }}>
          /{target}{unit}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 5, borderRadius: 99, background: 'var(--border)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, borderRadius: 99,
          background: color, transition: 'width .4s ease',
        }} />
      </div>
    </Card>
  )
}

function CalorieRing({ consumed, target }) {
  const r = 54, cx = 72, cy = 72
  const circ = 2 * Math.PI * r
  const pct = Math.min(consumed / target, 1)

  return (
    <svg viewBox="0 0 144 144" width={144} height={144} style={{ display: 'block' }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth={13} />
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke="var(--primary)" strokeWidth={13}
        strokeDasharray={`${pct * circ} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dasharray .5s ease' }}
      />
      <text x={cx} y={cy - 7} textAnchor="middle"
        fontSize="22" fontWeight="700" fill="var(--txt)" fontFamily="system-ui, sans-serif">
        {consumed.toLocaleString()}
      </text>
      <text x={cx} y={cx + 13} textAnchor="middle"
        fontSize="11" fill="var(--txt3)" fontFamily="system-ui, sans-serif">
        of {target.toLocaleString()} kcal
      </text>
    </svg>
  )
}

function EnergyCard({ consumed, target }) {
  const pKcal = PLACEHOLDER.protein.value * 4
  const cKcal = PLACEHOLDER.carbs.value * 4
  const fKcal = PLACEHOLDER.fat.value * 9
  const rem   = Math.max(target - pKcal - cKcal - fKcal, 0)

  const legend = [
    { label: 'Protein', kcal: pKcal, color: 'var(--primary)' },
    { label: 'Carbs',   kcal: cKcal, color: 'var(--blue)'    },
    { label: 'Fat',     kcal: fKcal, color: 'var(--amber)'   },
    { label: 'Remaining', kcal: rem, color: 'var(--border2)' },
  ]

  return (
    <Card style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--txt)', marginBottom: 20 }}>
        Today's energy
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
        <CalorieRing consumed={PLACEHOLDER.consumed} target={target} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', marginTop: 0 }}>
        {legend.map(({ label, kcal, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'var(--txt2)' }}>{label}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt)', marginLeft: 'auto' }}>
              {kcal}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}

function MicroCard() {
  return (
    <Card style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--txt)' }}>Micronutrients</div>
        <div style={{ fontSize: 11.5, color: 'var(--txt3)', marginTop: 2 }}>
          The part other apps hide
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {PLACEHOLDER.micros.map(({ label, value, rda, unit, pct }) => {
          const good = pct >= 70
          const barColor = good ? 'var(--primary)' : 'var(--amber)'
          const status = good ? 'good' : 'low'
          const statusColor = good ? 'var(--primary)' : 'var(--amber)'
          return (
            <div key={label}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 12.5, color: 'var(--txt)', fontWeight: 500 }}>{label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11.5, color: 'var(--txt3)' }}>
                    {value}/{rda}{unit}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
                    color: statusColor,
                    background: good ? 'var(--primary-soft)' : 'var(--amber-soft)',
                  }}>
                    {status}
                  </span>
                </div>
              </div>
              <div style={{ height: 5, borderRadius: 99, background: 'var(--border)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${Math.min(pct, 100)}%`,
                  borderRadius: 99, background: barColor,
                }} />
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function FutureCard() {
  return (
    <Card style={{ padding: '22px 24px' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt)' }}>
          The full picture — coming to VitalGraph
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--txt3)', marginTop: 3 }}>
          Nutrition is the foundation. Here's what's next.
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
        {FUTURE.map(({ title, desc, color, soft, letter, tag, tagColor, tagBg }) => (
          <div key={title} style={{
            padding: '16px 16px 18px',
            background: 'var(--bg)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 9, background: soft,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 800, color, marginBottom: 12,
            }}>
              {letter}
            </div>
            <div style={{ fontSize: 13, fontWeight: 650, color: 'var(--txt)', marginBottom: 6 }}>
              {title}
            </div>
            <div style={{ fontSize: 12, color: 'var(--txt3)', lineHeight: 1.55, marginBottom: 14 }}>
              {desc}
            </div>
            <span style={{
              fontSize: 10.5, fontWeight: 700, padding: '3px 8px', borderRadius: 5,
              color: tagColor, background: tagBg,
              border: `1px solid ${tagColor}30`,
            }}>
              {tag}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default function Dashboard() {
  const { profile, targets } = useProfile()
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'short', month: 'long', day: 'numeric',
  })

  const goalLabel = profile ? (GOALS.find(g => g.id === profile.goal)?.label ?? profile.goal) : 'Recomp'
  const consumed  = PLACEHOLDER.consumed

  const macroRows = [
    { id: 'protein', macro: PLACEHOLDER.protein, target: targets.protein },
    { id: 'carbs',   macro: PLACEHOLDER.carbs,   target: targets.carb   },
    { id: 'fat',     macro: PLACEHOLDER.fat,      target: targets.fat    },
    { id: 'fiber',   macro: PLACEHOLDER.fiber,    target: targets.fiber  },
  ]

  return (
    <div style={{ maxWidth: 1100 }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', marginBottom: 28, gap: 16,
      }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 750, color: 'var(--txt)', lineHeight: 1.2 }}>
            {greeting()}, Rafay
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--txt3)', marginTop: 5 }}>
            {today} · {consumed.toLocaleString()} of {targets.kcal.toLocaleString()} kcal · {goalLabel}
          </p>
        </div>
        <button style={{
          height: 38, padding: '0 20px', borderRadius: 'var(--radius-sm)',
          background: 'var(--primary)', color: '#fff',
          fontSize: 13.5, fontWeight: 600, flexShrink: 0, border: 'none', cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(19,184,138,.3)',
          transition: 'background .15s, box-shadow .15s',
        }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--primary-dark)'
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(19,184,138,.4)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'var(--primary)'
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(19,184,138,.3)'
          }}
        >
          Log food →
        </button>
      </div>

      {/* Macro cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        {macroRows.map(({ id, macro, target }) => (
          <MacroCard key={id} id={id} macro={macro} target={target} />
        ))}
      </div>

      {/* Energy ring + Micros */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.35fr', gap: 14, marginBottom: 20 }}>
        <EnergyCard consumed={consumed} target={targets.kcal} />
        <MicroCard />
      </div>

      {/* Future features */}
      <FutureCard />
    </div>
  )
}
