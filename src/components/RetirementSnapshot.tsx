import type { CalculatorOutputs, CalculatorInputs } from '../lib/types'
import Tooltip from './Tooltip'

function formatRs(n: number): string {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)}L`
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

function formatMonthly(n: number): string {
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)}L/mo`
  return `₹${Math.round(n).toLocaleString('en-IN')}/mo`
}

interface Props {
  outputs: CalculatorOutputs
  inputs: CalculatorInputs
}

export default function RetirementSnapshot({ outputs, inputs }: Props) {
  const { requiredCorpus, projectedCorpus, additionalSIPNeeded,
    monthlyIncomeInTodaysMoney, expensesAtRetirement, savingsRate,
    lastsUntilAge, lastsUntilAgeStressed, onTrackAge } = outputs
  const { retirementAge, expectedLifespan, monthlyExpenses, monthlySIP, inflationRate } = inputs

  const gap = Math.max(requiredCorpus - projectedCorpus, 0)
  const isCovered = projectedCorpus >= requiredCorpus
  const fillPct = requiredCorpus > 0 ? Math.min((projectedCorpus / requiredCorpus) * 100, 100) : 100
  const barColor = isCovered ? 'bg-[#16a34a]' : fillPct >= 70 ? 'bg-[#d97706]' : 'bg-[#dc2626]'
  const gapColor = isCovered ? 'text-[#16a34a]' : fillPct >= 70 ? 'text-[#d97706]' : 'text-[#dc2626]'

  const longevityDiff = lastsUntilAge - expectedLifespan
  const longevityColor = longevityDiff >= 0 ? 'text-[#16a34a]' : 'text-[#dc2626]'
  const longevityNote = longevityDiff >= 0
    ? `${longevityDiff} yr${longevityDiff !== 1 ? 's' : ''} past your goal`
    : `${Math.abs(longevityDiff)} yr${Math.abs(longevityDiff) !== 1 ? 's' : ''} short of goal`

  const additionalRetireAge = onTrackAge !== null ? onTrackAge : null
  const retireLater = additionalRetireAge !== null ? additionalRetireAge - retirementAge : null
  const spendReduction = requiredCorpus > 0 ? (gap / requiredCorpus) * monthlyExpenses * 0.5 : 0

  // Sanity flags
  const isImpossiblePlan = !isCovered && inputs.monthlyIncome > 0 && additionalSIPNeeded > inputs.monthlyIncome
  const isImmediateDepletion = projectedCorpus > 0 && lastsUntilAge <= retirementAge + 1

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-6">

      {/* Section A: The Goal */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-2">Your Retirement Goal</p>
        <h2 className="text-2xl font-semibold text-[#181818] leading-snug tracking-tight">
          Retire at {retirementAge}, live until {expectedLifespan} -{' '}
          <span className="text-[#181818] font-semibold">save {formatRs(requiredCorpus)}</span>
        </h2>
        <p className="text-sm text-zinc-500 mt-2 flex items-center gap-1">
          That's {formatMonthly(monthlyIncomeInTodaysMoney)} per month in today's money, for {expectedLifespan - retirementAge} years.
          <Tooltip text="This is what your monthly budget would feel like today. In reality, you'll withdraw more each year as prices rise: but it'll buy the same things." />
        </p>
      </div>

      {/* Section B: The Gap Bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-zinc-400">₹0</span>
          <span className="text-xs font-medium text-zinc-500">{formatRs(requiredCorpus)} goal</span>
        </div>
        <div className="relative h-2.5 bg-zinc-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${fillPct}%` }}
          />
        </div>
        <div className="flex items-start justify-between mt-2">
          <div>
            {isCovered ? (
              <p className="text-sm font-semibold text-[#16a34a]">
                On track: projected {formatRs(projectedCorpus)} ✓
              </p>
            ) : (
              <p className={`text-sm font-semibold ${gapColor}`}>
                Projected {formatRs(projectedCorpus)} · {formatRs(gap)} to go
              </p>
            )}
            <p className="text-xs text-zinc-400 mt-0.5">
              Based on ₹{Math.round(monthlySIP / 1000)}K/mo investment by age {retirementAge}
            </p>
          </div>
          <span className={`text-xs font-bold tabular-nums ${gapColor}`}>{Math.round(fillPct)}%</span>
        </div>
      </div>

      {/* Critical alerts: shown above action card when plan is broken */}
      {isImmediateDepletion && (
        <div className="pl-4 pr-4 py-3 rounded-r-xl border-l-4 border-[#dc2626] bg-[#dc2626]/5">
          <p className="text-sm font-semibold text-[#dc2626]">⚠ Critical: Savings run out within 1 year of retiring</p>
          <p className="text-xs text-[#dc2626]/80 mt-0.5">
            Your projected savings are far too small to sustain even 1 year of retirement. Increase your monthly investment significantly or extend your working years.
          </p>
        </div>
      )}
      {isImpossiblePlan && !isImmediateDepletion && (
        <div className="pl-4 pr-4 py-3 rounded-r-xl border-l-4 border-[#dc2626] bg-[#dc2626]/5">
          <p className="text-sm font-semibold text-[#dc2626]">⚠ This plan needs more than your current income to work</p>
          <p className="text-xs text-[#dc2626]/80 mt-1 space-y-1">
            Closing the gap requires investing {formatMonthly(additionalSIPNeeded)}/month: more than your income of {formatMonthly(inputs.monthlyIncome)}.
            Consider: working {Math.min(10, (onTrackAge ?? retirementAge + 10) - retirementAge)} more years, moving to a lower-cost city, or significantly reducing retirement expenses.
          </p>
        </div>
      )}

      {/* Section C: Action Card */}
      <div className={`pl-4 pr-4 py-3.5 rounded-r-xl border-l-4 ${
        isCovered
          ? 'border-[#16a34a] bg-[#16a34a]/5'
          : 'border-[#d97706] bg-[#d97706]/5'
      }`}>
        {isCovered ? (
          <div>
            <p className="text-sm font-semibold text-[#16a34a]">✓ You're on track</p>
            <p className="text-xs text-[#16a34a]/80 mt-0.5">
              Keep your {formatMonthly(monthlySIP)} monthly investment going and you'll hit your goal.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-zinc-800">To close the {formatRs(gap)} gap:</p>
            <div className="space-y-1.5">
              <div className="flex items-start gap-2">
                <span className="text-[#d97706] font-bold mt-0.5 flex-shrink-0 text-xs">→</span>
                <p className="text-xs text-zinc-700">
                  <span className="font-semibold">Invest {formatMonthly(monthlySIP + additionalSIPNeeded)}/month</span>
                  {additionalSIPNeeded > 0 && (
                    <span className="text-zinc-500"> (₹{Math.round(additionalSIPNeeded / 1000)}K more/mo)</span>
                  )}
                </p>
              </div>
              {retireLater !== null && retireLater > 0 && (
                <div className="flex items-start gap-2">
                  <span className="text-[#d97706] font-bold mt-0.5 flex-shrink-0 text-xs">→</span>
                  <p className="text-xs text-zinc-700">
                    <span className="font-semibold">Retire at {additionalRetireAge} instead of {retirementAge}</span>
                    <span className="text-zinc-500"> (+{retireLater} yr{retireLater !== 1 ? 's' : ''} to save)</span>
                  </p>
                </div>
              )}
              {spendReduction > 5000 && (
                <div className="flex items-start gap-2">
                  <span className="text-[#d97706] font-bold mt-0.5 flex-shrink-0 text-xs">→</span>
                  <p className="text-xs text-zinc-700">
                    <span className="font-semibold">Spend {formatMonthly(spendReduction)} less/month</span>
                    <span className="text-zinc-500"> after retiring</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Section D: Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-zinc-100">
        <div>
          <p className="text-[11px] text-zinc-400 mb-1">Monthly spend</p>
          <p className="text-base font-bold tabular-nums text-[#181818]">{formatMonthly(monthlyIncomeInTodaysMoney)}</p>
          <p className="text-[10px] text-zinc-400 mt-0.5 leading-snug">
            ₹{Math.round(monthlyExpenses / 1000)}K → {formatRs(expensesAtRetirement)}/mo
            <br/>prices rise ~{Math.round(inflationRate * 100)}%/yr
          </p>
        </div>
        <div>
          <p className="text-[11px] text-zinc-400 mb-1 flex items-center gap-0.5">
            Savings rate
            <Tooltip text="% of income you invest monthly. Aim for 20–30%." />
          </p>
          <p className={`text-base font-bold tabular-nums ${savingsRate >= 20 ? 'text-[#16a34a]' : savingsRate >= 10 ? 'text-[#d97706]' : 'text-[#dc2626]'}`}>
            {savingsRate.toFixed(0)}%
          </p>
          <p className="text-[10px] text-zinc-400 mt-0.5">of income</p>
        </div>
        <div>
          <p className="text-[11px] text-zinc-400 mb-1 flex items-center gap-0.5">
            Money lasts
            <Tooltip text="How long your retirement savings will last, accounting for returns, inflation, and tax on investment gains." />
          </p>
          <p className={`text-base font-bold tabular-nums ${longevityColor}`}>Age {lastsUntilAge}</p>
          <p className={`text-[10px] mt-0.5 ${longevityColor}`}>{longevityNote}</p>
        </div>
        <div>
          <p className="text-[11px] text-zinc-400 mb-1 flex items-center gap-0.5">
            After 30% crash
            <Tooltip text="If markets crash 30% right at retirement and you keep spending the same: worst-case scenario for how long your savings last." />
          </p>
          <p className={`text-base font-bold tabular-nums ${lastsUntilAgeStressed >= expectedLifespan ? 'text-[#16a34a]' : 'text-[#dc2626]'}`}>
            Age {lastsUntilAgeStressed}
          </p>
          <p className={`text-[10px] mt-0.5 ${lastsUntilAgeStressed >= expectedLifespan ? 'text-[#16a34a]' : 'text-[#dc2626]'}`}>
            {lastsUntilAgeStressed >= expectedLifespan
              ? 'Still covered ✓'
              : `${expectedLifespan - lastsUntilAgeStressed} yr${expectedLifespan - lastsUntilAgeStressed !== 1 ? 's' : ''} short`}
          </p>
        </div>
      </div>
    </div>
  )
}
