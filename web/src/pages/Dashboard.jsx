import { useNavigate } from 'react-router-dom'
import { useProfile } from '../context/ProfileContext.jsx'
import { GOALS, MICRO_META } from '../data/foodData.js'
import { Drumstick, Wheat, Droplet, Leaf } from 'lucide-react'
import { loadLogForDate } from '../lib/logStorage.js'
import { calcTotals } from '../lib/nutrition.js'

const MACRO_STYLE = {
  protein: { color: 'var(--primary)', soft: 'var(--primary-soft)', Icon: Drumstick },
  carbs:   { color: 'var(--blue)',    soft: 'var(--blue-soft)',    Icon: Wheat     },
  fat:     { color: 'var(--amber)',   soft: 'var(--amber-soft)',   Icon: Droplet   },
  fiber:   { color: 'var(--coral)',   soft: 'var(--coral-soft)',   Icon: Leaf      },
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

// Returns the ISO date string (YYYY-MM-DD, UTC) for N days ago, matching todayStr's convention.
function dateStrOffset(daysAgo) {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - daysAgo)
  return d.toISOString().slice(0, 10)
}

// Averages kcal, macros, and all MICRO_META fields over the last 7 days.
// Only counts days with at least one logged entry — sparse weeks average honestly.
// Returns { avg: { kcal, protein, carb, fat, fiber, micro }, daysLogged }
// or { avg: null, daysLogged: 0 } when nothing has been logged.
function calcWeeklyAvg() {
  const logged = [0, 1, 2, 3, 4, 5, 6]
    .map(n => loadLogForDate(dateStrOffset(n)))
    .filter(log => log.length > 0)
    .map(log => calcTotals(log))

  const daysLogged = logged.length
  if (daysLogged === 0) return { avg: null, daysLogged: 0 }

  const microKeys  = Object.keys(MICRO_META)
  const microInit  = Object.fromEntries(microKeys.map(k => [k, 0]))

  const sum = logged.reduce(
    (acc, t) => {
      const micro = { ...acc.micro }
      microKeys.forEach(k => { micro[k] += t.micro[k] || 0 })
      return {
        kcal:    acc.kcal    + t.kcal,
        protein: acc.protein + t.protein,
        carb:    acc.carb    + t.carb,
        fat:     acc.fat     + t.fat,
        fiber:   acc.fiber   + t.fiber,
        micro,
      }
    },
    { kcal: 0, protein: 0, carb: 0, fat: 0, fiber: 0, micro: microInit },
  )

  // micro values left un-rounded — MicroCard rounds to 1 dp internally
  const micro = Object.fromEntries(microKeys.map(k => [k, sum.micro[k] / daysLogged]))

  return {
    avg: {
      kcal:    Math.round(sum.kcal    / daysLogged),
      protein: Math.round(sum.protein / daysLogged),
      carb:    Math.round(sum.carb    / daysLogged),
      fat:     Math.round(sum.fat     / daysLogged),
      fiber:   Math.round(sum.fiber   / daysLogged),
      micro,
    },
    daysLogged,
  }
}

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
  const { color, soft, Icon } = MACRO_STYLE[id]
  const pct = Math.min(value / (target || 1) * 100, 100)
  const label = id.charAt(0).toUpperCase() + id.slice(1)

  return (
    <Card style={{ padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 8,
          background: soft, color, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={16} strokeWidth={2.1}/>
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
  const pct = Math.min(consumed / (target || 1), 1)

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

function EnergyCard({ consumed, target, pKcal, cKcal, fKcal }) {
  const rem = Math.max(target - pKcal - cKcal - fKcal, 0)

  const legend = [
    { label: 'Protein',   kcal: pKcal, color: 'var(--primary)' },
    { label: 'Carbs',     kcal: cKcal, color: 'var(--blue)'    },
    { label: 'Fat',       kcal: fKcal, color: 'var(--amber)'   },
    { label: 'Remaining', kcal: rem,   color: 'var(--border2)' },
  ]

  return (
    <Card style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--txt)', marginBottom: 20 }}>
        7-day average
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
        <CalorieRing consumed={consumed} target={target} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
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

function MicroCard({ micro }) {
  return (
    <Card style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--txt)' }}>Micronutrients</div>
        <div style={{ fontSize: 11.5, color: 'var(--txt3)', marginTop: 2 }}>
          The part other apps hide
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {Object.entries(MICRO_META).map(([key, { label, unit, rda }]) => {
          const value = Math.round((micro[key] || 0) * 10) / 10
          const pct   = (value / rda) * 100
          const good  = pct >= 70
          const barColor    = good ? 'var(--primary)' : 'var(--amber)'
          const status      = good ? 'good' : 'low'
          const statusColor = good ? 'var(--primary)' : 'var(--amber)'
          return (
            <div key={key}>
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
  const navigate = useNavigate()
  const { avg, daysLogged } = calcWeeklyAvg()

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'short', month: 'long', day: 'numeric',
  })
  const goalLabel = profile ? (GOALS.find(g => g.id === profile.goal)?.label ?? profile.goal) : 'Recomp'

  const consumed = avg ? avg.kcal                      : 0
  const pKcal    = avg ? Math.round(avg.protein * 4)   : 0
  const cKcal    = avg ? Math.round(avg.carb    * 4)   : 0
  const fKcal    = avg ? Math.round(avg.fat     * 9)   : 0

  const macroRows = avg ? [
    { id: 'protein', macro: { value: avg.protein, unit: 'g' }, target: targets.protein },
    { id: 'carbs',   macro: { value: avg.carb,    unit: 'g' }, target: targets.carb   },
    { id: 'fat',     macro: { value: avg.fat,     unit: 'g' }, target: targets.fat    },
    { id: 'fiber',   macro: { value: avg.fiber,   unit: 'g' }, target: targets.fiber  },
  ] : []

  return (
    <div>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', marginBottom: 20, gap: 16,
      }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 750, color: 'var(--txt)', lineHeight: 1.2 }}>
            {greeting()}, Rafay
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--txt3)', marginTop: 5 }}>
            {daysLogged > 0
              ? `${today} · 7-day avg · ${daysLogged} of 7 days logged · ${goalLabel}`
              : `${today} · ${goalLabel}`}
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

      {daysLogged === 0 ? (

        /* Empty state — strong CTA to the Nutrition page */
        <Card style={{ padding: '44px 32px', textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--txt)', marginBottom: 10 }}>
            No data yet
          </div>
          <p style={{
            fontSize: 14, color: 'var(--txt3)', lineHeight: 1.65,
            maxWidth: 380, margin: '0 auto 28px',
          }}>
            Log at least one day of food to see your 7-day trends here.
          </p>
          <button
            onClick={() => navigate('/nutrition')}
            style={{
              height: 42, padding: '0 28px',
              background: 'var(--primary)', color: '#fff',
              border: 'none', borderRadius: 'var(--radius-sm)',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
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
            Start logging →
          </button>
        </Card>

      ) : (
        <>
          {/* Macro cards — 7-day averages */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
            {macroRows.map(({ id, macro, target }) => (
              <MacroCard key={id} id={id} macro={macro} target={target} />
            ))}
          </div>

          {/* Energy ring + Micros — 7-day averages */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.35fr', gap: 14, marginBottom: 20 }}>
            <EnergyCard consumed={consumed} target={targets.kcal} pKcal={pKcal} cKcal={cKcal} fKcal={fKcal} />
            <MicroCard micro={avg.micro} />
          </div>
        </>
      )}

      {/* Future features */}
      <FutureCard />
    </div>
  )
}
