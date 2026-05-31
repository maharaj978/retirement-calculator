import type { CalculatorOutputs, CalculatorInputs } from '../lib/types'

interface Props {
  outputs: CalculatorOutputs
  inputs: CalculatorInputs
  cardRef: React.RefObject<HTMLDivElement>
}

function fmt(n: number): string {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(1)} Cr`
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)}L`
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

function fmtMo(n: number): string {
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)}L/mo`
  return `₹${Math.round(n).toLocaleString('en-IN')}/mo`
}

export default function ShareCard({ outputs, inputs, cardRef }: Props) {
  const { requiredCorpus, projectedCorpus, monthlyIncomeInTodaysMoney, lastsUntilAge } = outputs
  const { retirementAge, expectedLifespan, currentAge } = inputs

  const fillPct = requiredCorpus > 0 ? Math.min((projectedCorpus / requiredCorpus) * 100, 100) : 100
  const isCovered = projectedCorpus >= requiredCorpus
  const lastsOk = lastsUntilAge >= expectedLifespan

  const yearsToRetire = retirementAge - currentAge
  const retirementDuration = expectedLifespan - retirementAge

  const coverageLabel = isCovered ? 'On track' : fillPct >= 75 ? 'Almost there' : fillPct >= 50 ? 'Halfway there' : 'Getting started'

  return (
    // 360×640 — 9:16, rendered off-screen
    <div
      ref={cardRef}
      style={{
        width: 360,
        height: 640,
        fontFamily: "'Geist', 'Inter', system-ui, sans-serif",
        background: 'linear-gradient(145deg, #1e1b4b 0%, #312e81 35%, #4c1d95 70%, #5b21b6 100%)',
        display: 'flex',
        flexDirection: 'column',
        padding: '32px 28px 24px',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decoration circles */}
      <div style={{
        position: 'absolute', top: -60, right: -60,
        width: 200, height: 200, borderRadius: '50%',
        background: 'rgba(255,255,255,0.04)',
      }} />
      <div style={{
        position: 'absolute', bottom: 80, left: -40,
        width: 160, height: 160, borderRadius: '50%',
        background: 'rgba(255,255,255,0.03)',
      }} />

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: 'white',
          }}>R</div>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 500 }}>
            Retirement Planner
          </span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>
          retire at {retirementAge} · live until {expectedLifespan} · {yearsToRetire} years to build
        </p>
      </div>

      {/* Status badge — text only, no emoji (avoids render issues on non-Apple devices) */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: isCovered ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.1)',
        borderRadius: 20, padding: '6px 14px',
        marginBottom: 20, alignSelf: 'flex-start',
        border: isCovered ? '1px solid rgba(74,222,128,0.3)' : '1px solid rgba(255,255,255,0.1)',
      }}>
        <span style={{ color: isCovered ? '#4ade80' : 'white', fontSize: 13, fontWeight: 700 }}>{coverageLabel}</span>
      </div>

      {/* Main number */}
      <div style={{ marginBottom: 8 }}>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Retirement goal
        </p>
        <p style={{ color: 'white', fontSize: 42, fontWeight: 700, margin: 0, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
          {fmt(requiredCorpus)}
        </p>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: '4px 0 0' }}>
          = {fmtMo(monthlyIncomeInTodaysMoney)} in today's money, for {retirementDuration} years
        </p>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Projected: {fmt(projectedCorpus)}</span>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{Math.round(fillPct)}%</span>
        </div>
        <div style={{ height: 8, background: 'rgba(255,255,255,0.12)', borderRadius: 999 }}>
          <div style={{
            height: '100%', borderRadius: 999,
            width: `${fillPct}%`,
            background: isCovered
              ? 'linear-gradient(90deg, #4ade80, #16a34a)'
              : fillPct >= 60
              ? 'linear-gradient(90deg, #fbbf24, #d97706)'
              : 'linear-gradient(90deg, #f87171, #dc2626)',
          }} />
        </div>
      </div>

      {/* 3 stat pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 'auto' }}>
        <div style={{
          flex: 1, background: 'rgba(255,255,255,0.08)',
          borderRadius: 12, padding: '12px 10px', textAlign: 'center',
        }}>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Monthly</p>
          <p style={{ color: 'white', fontSize: 15, fontWeight: 700, margin: 0 }}>{fmtMo(monthlyIncomeInTodaysMoney)}</p>
        </div>
        <div style={{
          flex: 1, background: 'rgba(255,255,255,0.08)',
          borderRadius: 12, padding: '12px 10px', textAlign: 'center',
        }}>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Retire at</p>
          <p style={{ color: 'white', fontSize: 15, fontWeight: 700, margin: 0 }}>{retirementAge}</p>
        </div>
        <div style={{
          flex: 1,
          background: lastsOk ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)',
          borderRadius: 12, padding: '12px 10px', textAlign: 'center',
        }}>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Lasts until</p>
          <p style={{ color: lastsOk ? '#4ade80' : '#f87171', fontSize: 15, fontWeight: 700, margin: 0 }}>Age {lastsUntilAge}</p>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '20px 0 16px' }} />

      {/* CTA */}
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, margin: '0 0 6px' }}>
          What's your retirement number?
        </p>
        <div style={{
          display: 'inline-block',
          background: 'white',
          borderRadius: 8,
          padding: '8px 20px',
        }}>
          <span style={{ color: '#1e1b4b', fontSize: 13, fontWeight: 700 }}>
            Try it free → calculator-kappa-three.vercel.app
          </span>
        </div>
      </div>
    </div>
  )
}
