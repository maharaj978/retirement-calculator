import { useState } from 'react'

interface Props {
  requiredCorpus: number
  currentAge: number
  retirementAge: number
  currentSavings: number
  epfBalance: number
  preRetirementReturn: number
}

function formatMonthly(n: number): string {
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)}L/mo`
  return `₹${Math.round(n).toLocaleString('en-IN')}/mo`
}

function formatRs(n: number): string {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)}L`
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

function sipFV(monthly: number, mr: number, years: number): number {
  const m = years * 12
  return mr > 0 ? monthly * ((Math.pow(1 + mr, m) - 1) / mr) * (1 + mr) : monthly * m
}

function yearsToGoal(
  monthlyAmount: number,
  targetCorpus: number,
  existingCorpus: number,
  annualReturn: number,
): number | null {
  if (monthlyAmount === 0 && existingCorpus < targetCorpus) return null
  const mr = Math.pow(1 + annualReturn, 1 / 12) - 1
  for (let y = 1; y <= 50; y++) {
    const sip = sipFV(monthlyAmount, mr, y)
    const lump = existingCorpus * Math.pow(1 + annualReturn, y)
    if (sip + lump >= targetCorpus) return y
  }
  return null
}

const SIP_STEPS = [0, 2000, 3000, 5000, 7500, 10000, 15000, 20000, 25000, 30000, 40000, 50000]
const MILESTONES = [
  { label: '₹5K', idx: 3 },
  { label: '₹10K', idx: 5 },
  { label: '₹25K', idx: 8 },
  { label: '₹50K', idx: 11 },
]

export default function TradeoffSlider({
  requiredCorpus, currentAge, retirementAge,
  currentSavings, epfBalance, preRetirementReturn,
}: Props) {
  const [sliderIdx, setSliderIdx] = useState(0)

  const sipAmount = SIP_STEPS[sliderIdx]
  const existingCorpus = currentSavings + epfBalance
  const mr = Math.pow(1 + preRetirementReturn, 1 / 12) - 1
  const yearsToPlanned = retirementAge - currentAge

  // Corpus breakdown at planned retirement age
  const existingGrown = existingCorpus * Math.pow(1 + preRetirementReturn, yearsToPlanned)
  const sipGrown = sipFV(sipAmount, mr, yearsToPlanned)
  const corpusAtPlannedAge = existingGrown + sipGrown

  // Years to hit goal with this SIP
  const yearsNeeded = yearsToGoal(sipAmount, requiredCorpus, existingCorpus, preRetirementReturn)
  const retireAtAge = yearsNeeded !== null ? currentAge + yearsNeeded : null
  const isBeforeTarget = retireAtAge !== null && retireAtAge <= retirementAge
  const isAfterTarget = retireAtAge !== null && retireAtAge > retirementAge

  // Bar widths — existing corpus and SIP as % of required
  const existingBarPct = Math.min((existingGrown / requiredCorpus) * 100, 100)
  const sipBarPct = Math.min((sipGrown / requiredCorpus) * 100, 100 - existingBarPct)
  const totalPct = Math.min(existingBarPct + sipBarPct, 100)
  const isFilled = totalPct >= 100

  // Compounding multiplier — how much ₹1 invested today becomes
  const compoundMultiplier = Math.pow(1 + preRetirementReturn, yearsToPlanned)

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-5">

      {/* Header */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-1">What If You Started a SIP?</p>
        <p className="text-sm text-zinc-600 leading-relaxed">
          A Nifty 50 index fund has averaged ~{Math.round(preRetirementReturn * 100)}% annually over 20 years.
          Drag to see how a monthly SIP changes your retirement picture.
        </p>
      </div>

      {/* Baseline — existing savings alone */}
      {existingCorpus > 0 && (
        <div className="px-3 py-2.5 bg-zinc-50 rounded-lg border border-zinc-100">
          <p className="text-xs text-zinc-500 leading-relaxed">
            Your existing savings of{' '}
            <span className="font-semibold text-[#181818]">{formatRs(existingCorpus)}</span>{' '}
            will grow to{' '}
            <span className="font-semibold text-[#181818]">{formatRs(existingGrown)}</span>{' '}
            by age {retirementAge} on their own — without any SIP.
            {existingGrown < requiredCorpus && (
              <> That's still <span className="font-semibold text-[#dc2626]">{formatRs(requiredCorpus - existingGrown)} short</span>. Drag below to fill the gap.</>
            )}
            {existingGrown >= requiredCorpus && (
              <> <span className="font-semibold text-[#16a34a]">That already covers your goal!</span></>
            )}
          </p>
        </div>
      )}

      {/* Slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-zinc-700">Monthly SIP amount</span>
          <span className="text-lg font-bold text-[#181818] tabular-nums">
            {sipAmount === 0 ? '₹0 (no SIP)' : formatMonthly(sipAmount)}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={SIP_STEPS.length - 1}
          step={1}
          value={sliderIdx}
          onChange={(e) => setSliderIdx(Number(e.target.value))}
          className="w-full"
          style={{
            '--sp': `${(sliderIdx / (SIP_STEPS.length - 1)) * 100}%`, color: '#181818',
            borderRadius: '999px',
          } as React.CSSProperties}
        />
        {/* Milestone labels */}
        <div className="relative mt-1.5 h-4">
          {MILESTONES.map(({ label, idx }) => (
            <span
              key={label}
              className="absolute text-[9px] text-zinc-400 -translate-x-1/2"
              style={{ left: `${(idx / (SIP_STEPS.length - 1)) * 100}%` }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Corpus bar — stacked existing + SIP */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-zinc-400">What you'd have at age {retirementAge}</span>
          <span className={`text-xs font-semibold tabular-nums ${isFilled ? 'text-[#16a34a]' : 'text-zinc-600'}`}>
            {formatRs(corpusAtPlannedAge)} / {formatRs(requiredCorpus)}
          </span>
        </div>
        <div className="relative h-2.5 bg-zinc-100 rounded-full overflow-hidden">
          {/* Existing savings portion */}
          {existingBarPct > 0 && (
            <div
              className="absolute left-0 top-0 h-full bg-zinc-400 rounded-l-full"
              style={{ width: `${existingBarPct}%` }}
            />
          )}
          {/* SIP portion */}
          {sipBarPct > 0 && (
            <div
              className="absolute top-0 h-full bg-[#181818] rounded-r-full"
              style={{ left: `${existingBarPct}%`, width: `${sipBarPct}%` }}
            />
          )}
        </div>
        {/* Bar legend — always visible to prevent layout shift */}
        <div className="flex items-center gap-4 mt-1.5">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-zinc-400 inline-block" />
            <span className="text-[10px] text-zinc-400">Existing savings</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-[#181818] inline-block" />
            <span className="text-[10px] text-zinc-400">New SIP</span>
          </div>
        </div>
      </div>

      {/* Result card */}
      <div className={`rounded-lg p-4 space-y-2 ${isFilled ? 'bg-[#16a34a]/5 border border-[#16a34a]/20' : 'bg-zinc-50'}`}>
        <>
            <div className="flex items-start gap-5 flex-wrap">
              <div>
                <p className="text-[10px] text-zinc-400 uppercase tracking-wide mb-0.5">Retire at</p>
                {sipAmount === 0 ? (
                  <>
                    <p className="text-xl font-bold text-zinc-300 tabular-nums">— —</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">drag slider to see</p>
                  </>
                ) : retireAtAge !== null ? (
                  <>
                    <p className={`text-xl font-bold tabular-nums ${isBeforeTarget ? 'text-[#16a34a]' : 'text-[#181818]'}`}>
                      Age {retireAtAge}
                    </p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      {isBeforeTarget
                        ? `${retirementAge - retireAtAge} yr${retirementAge - retireAtAge !== 1 ? 's' : ''} ahead of target`
                        : `${retireAtAge - retirementAge} yr${retireAtAge - retirementAge !== 1 ? 's' : ''} after target`}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-base font-bold text-[#dc2626]">After age {currentAge + 50}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">increase SIP to hit goal sooner</p>
                  </>
                )}
              </div>
              <div>
                <p className="text-[10px] text-zinc-400 uppercase tracking-wide mb-0.5">Compounding boost</p>
                <p className="text-xl font-bold text-[#181818] tabular-nums">{compoundMultiplier.toFixed(1)}x</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">₹1 invested today = ₹{compoundMultiplier.toFixed(1)} at {retirementAge}</p>
              </div>
            </div>

            {/* Plain English */}
            <p className="text-xs text-zinc-600 leading-relaxed pt-2 border-t border-zinc-200">
              {sipAmount === 0 && (
                existingCorpus > 0
                  ? <>Without a SIP, your savings alone won't close the gap. Drag the slider to see how even <span className="font-semibold text-[#181818]">₹2,000/month</span> changes things.</>
                  : <>No existing savings, no SIP. Start anywhere — even small amounts compound significantly. Drag the slider to see.</>
              )}
              {sipAmount > 0 && isBeforeTarget && retireAtAge !== null && (
                <>
                  A <span className="font-semibold text-[#181818]">{formatMonthly(sipAmount)}/month</span> SIP gets you to{' '}
                  <span className="font-semibold text-[#16a34a]">{formatRs(corpusAtPlannedAge)}</span> by age {retirementAge} —
                  your goal is covered {retirementAge - retireAtAge} years early.
                  Every rupee you invest today becomes ₹{compoundMultiplier.toFixed(0)} by then.
                </>
              )}
              {sipAmount > 0 && isAfterTarget && retireAtAge !== null && (
                <>
                  A <span className="font-semibold text-[#181818]">{formatMonthly(sipAmount)}/month</span> SIP
                  gets you to <span className="font-semibold text-[#181818]">{formatRs(corpusAtPlannedAge)}</span> by age {retirementAge} —
                  still <span className="font-semibold text-[#dc2626]">{formatRs(requiredCorpus - corpusAtPlannedAge)} short</span>.
                  You'd hit the goal at age {retireAtAge}. Increase the SIP to retire at {retirementAge}.
                </>
              )}
              {sipAmount > 0 && retireAtAge === null && (
                <>
                  At <span className="font-semibold text-[#181818]">{formatMonthly(sipAmount)}/month</span>,
                  you'd have <span className="font-semibold text-[#181818]">{formatRs(corpusAtPlannedAge)}</span> by age {retirementAge} —
                  not quite enough. Slide higher to close the gap.
                </>
              )}
            </p>
          </>
      </div>

      <p className="text-[10px] text-zinc-400">
        Based on {Math.round(preRetirementReturn * 100)}% annual return (Nifty 50 historical average). Past performance does not guarantee future results.
      </p>
    </div>
  )
}
