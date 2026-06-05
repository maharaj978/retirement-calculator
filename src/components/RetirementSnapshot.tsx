import type { CalculatorOutputs, CalculatorInputs } from '../lib/types'

function formatRs(n: number): string {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)}L`
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

function formatMonthly(n: number): string {
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)}L/mo`
  return `₹${Math.round(n).toLocaleString('en-IN')}/mo`
}

function pct(n: number) { return Math.round(n) }

interface Props {
  outputs: CalculatorOutputs
  inputs: CalculatorInputs
  mode: 'goal' | 'reverse'
}

export default function RetirementSnapshot({ outputs, inputs, mode }: Props) {
  const {
    requiredCorpus, projectedCorpus, additionalSIPNeeded,
    monthlyIncomeInTodaysMoney, savingsRate,
    lastsUntilAge, lastsUntilAgeStressed, onTrackAge,
  } = outputs
  const { retirementAge, expectedLifespan, monthlyExpenses, monthlySIP, inflationRate, currentAge } = inputs

  const retirementYears = expectedLifespan - retirementAge
  const gap = Math.max(requiredCorpus - projectedCorpus, 0)
  const isCovered = projectedCorpus >= requiredCorpus
  const fillPct = requiredCorpus > 0 ? Math.min((projectedCorpus / requiredCorpus) * 100, 100) : 100
  const barColor = isCovered ? 'bg-[#16a34a]' : fillPct >= 70 ? 'bg-[#d97706]' : 'bg-[#dc2626]'

  const additionalRetireAge = onTrackAge !== null ? onTrackAge : null
  const retireLater = additionalRetireAge !== null ? additionalRetireAge - retirementAge : null

  // Plan is impossible if user can't afford the additional SIP from their disposable income.
  // Disposable = take-home minus current expenses minus current SIP.
  const disposableIncome = Math.max(inputs.monthlyIncome - monthlyExpenses - monthlySIP, 0)
  const isImpossiblePlan = !isCovered && inputs.monthlyIncome > 0 && additionalSIPNeeded > disposableIncome
  const isImmediateDepletion = projectedCorpus > 0 && lastsUntilAge <= retirementAge + 1

  // Human-readable framing
  const coverageFraction = requiredCorpus > 0 ? projectedCorpus / requiredCorpus : 0
  const coverageLabel =
    coverageFraction >= 1 ? 'fully covered' :
    coverageFraction >= 0.75 ? 'three-quarters of the way there' :
    coverageFraction >= 0.5 ? 'about halfway there' :
    coverageFraction >= 0.25 ? 'about a quarter of the way there' :
    'just getting started'

  const yearsToRetirement = retirementAge - currentAge
  const expensesAtRetirementMonthly = monthlyExpenses * Math.pow(1 + inflationRate, yearsToRetirement)

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-6">

      {/* Section A + B: mode-aware */}
      {mode === 'reverse' ? (
        /* REVERSE MODE: headline is the earliest retirement age */
        <div className="space-y-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-3">When You Can Retire</p>
            {onTrackAge !== null ? (
              <>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  Based on what you're saving, you can retire at:
                </p>
                <p className="text-5xl font-bold text-[#181818] mt-2 mb-1 tabular-nums">
                  Age {onTrackAge}
                </p>
                <p className="text-sm text-zinc-500">
                  That's <span className="font-semibold text-[#181818]">{onTrackAge - currentAge} years from now.</span>
                </p>
                <p className="text-sm text-zinc-500 mt-1">
                  You'll have{' '}
                  <span className="font-semibold text-[#181818]">{formatRs(projectedCorpus)}</span>{' '}
                  by then, enough for{' '}
                  <span className="font-semibold text-[#181818]">{formatMonthly(monthlyIncomeInTodaysMoney)}</span>{' '}
                  per month in today's money, for {expectedLifespan - onTrackAge} years.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  At your current savings rate, you won't build enough to retire comfortably by age 75.
                </p>
                <p className="text-sm text-zinc-500 mt-2">
                  You're projected to save{' '}
                  <span className="font-semibold text-[#dc2626]">{formatRs(projectedCorpus)}</span>{' '}
                  by age 75. You need{' '}
                  <span className="font-semibold text-[#181818]">{formatRs(requiredCorpus)}</span>.
                </p>
              </>
            )}
          </div>

          {/* Progress bar — shows how close to the goal */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-zinc-400">₹0</span>
              <span className="text-xs text-zinc-400">{formatRs(requiredCorpus)} needed</span>
            </div>
            <div className="relative h-2.5 bg-zinc-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                style={{ width: `${fillPct}%` }}
              />
            </div>
            <p className="text-xs text-zinc-400 mt-1.5">
              Projected {formatRs(projectedCorpus)} ({Math.round(fillPct)}% of goal)
            </p>
          </div>
        </div>
      ) : (
        /* GOAL MODE: original layout */
        <>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-3">Your Retirement Goal</p>

            <p className="text-sm text-zinc-600 leading-relaxed">
              To stop working at <span className="font-semibold text-[#181818]">{retirementAge}</span> and
              live comfortably until <span className="font-semibold text-[#181818]">{expectedLifespan}</span>, you
              need to have saved:
            </p>

            <p className="text-3xl font-bold text-[#181818] mt-2 mb-1 tabular-nums">{formatRs(requiredCorpus)}</p>

            <p className="text-sm text-zinc-500 leading-relaxed">
              That pays you{' '}
              <span className="font-semibold text-[#181818]">{formatMonthly(monthlyIncomeInTodaysMoney)}</span>{' '}
              every month, the same buying power as your{' '}
              <span className="font-semibold text-[#181818]">{formatMonthly(monthlyExpenses)} today</span>,
              adjusted for rising prices, for {retirementYears} years.
            </p>

            {yearsToRetirement > 0 && (
              <p className="text-xs text-zinc-400 mt-1.5">
                By age {retirementAge}, prices will have risen enough that {formatMonthly(monthlyExpenses)}/mo today
                will cost {formatMonthly(expensesAtRetirementMonthly)}, that's {Math.round(inflationRate * 100)}% inflation every year for {yearsToRetirement} years.
              </p>
            )}
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-3">Where You Stand</p>

            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-zinc-400">₹0</span>
              <span className="text-xs text-zinc-400">{formatRs(requiredCorpus)} goal</span>
            </div>
            <div className="relative h-2.5 bg-zinc-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                style={{ width: `${fillPct}%` }}
              />
            </div>

            <div className="mt-3">
              {isCovered ? (
                <p className="text-sm leading-relaxed text-zinc-700">
                  At your current savings rate, you're projected to reach{' '}
                  <span className="font-semibold text-[#16a34a]">{formatRs(projectedCorpus)}</span> by age {retirementAge} -
                  that's <span className="font-semibold text-[#16a34a]">more than you need</span>. You're on track.
                </p>
              ) : (
                <p className="text-sm leading-relaxed text-zinc-700">
                  At your current savings rate, you'll reach{' '}
                  <span className="font-semibold text-[#181818]">{formatRs(projectedCorpus)}</span> by age {retirementAge} -
                  you're <span className="font-semibold text-[#181818]">{coverageLabel}</span>.
                  You're still <span className="font-semibold text-[#dc2626]">{formatRs(gap)} short</span> of your goal.
                </p>
              )}

              {!isCovered && (
                <p className="text-xs text-zinc-400 mt-1">
                  You're investing {formatMonthly(monthlySIP)}, which is {pct(savingsRate)}% of your income.
                  {savingsRate < 20 && ' Most retirement planners recommend at least 20%.'}
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Critical alerts */}
      {isImmediateDepletion && (
        <div className="pl-4 pr-4 py-3 rounded-r-xl border-l-4 border-[#dc2626] bg-[#dc2626]/5">
          <p className="text-sm font-semibold text-[#dc2626]">Your savings would run out almost immediately after retiring</p>
          <p className="text-xs text-zinc-600 mt-1">
            With what you're on track to save, the money runs out within a year of stopping work.
            You'd need to significantly increase your monthly investment or work a few more years.
          </p>
        </div>
      )}
      {isImpossiblePlan && !isImmediateDepletion && (
        <div className="pl-4 pr-4 py-3 rounded-r-xl border-l-4 border-[#dc2626] bg-[#dc2626]/5">
          <p className="text-sm font-semibold text-[#dc2626]">This goal isn't reachable with your current income</p>
          <p className="text-xs text-zinc-600 mt-1">
            Closing the gap requires investing an extra {formatMonthly(additionalSIPNeeded)} every month, but you only
            have {formatMonthly(disposableIncome)} left after your current expenses and savings.
            More realistic options: retire a few years later, move to a lower-cost city, or plan for a smaller monthly budget in retirement.
          </p>
        </div>
      )}

      {/* Section C: What to do */}
      {mode === 'reverse' ? (
        <div className={`pl-4 pr-4 py-4 rounded-r-xl border-l-4 ${
          onTrackAge !== null ? 'border-[#16a34a] bg-[#16a34a]/5' : 'border-[#d97706] bg-[#d97706]/5'
        }`}>
          {onTrackAge !== null ? (
            <div className="space-y-2.5">
              <p className="text-sm font-semibold text-zinc-800">Want to retire even earlier?</p>
              <div className="flex items-start gap-2.5">
                <span className="text-[#d97706] font-bold flex-shrink-0 mt-0.5">1.</span>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  <span className="font-semibold text-zinc-800">Save more.</span>{' '}
                  Increasing your monthly investment by even{' '}
                  {formatMonthly(additionalSIPNeeded > 0 ? Math.min(additionalSIPNeeded, monthlySIP * 0.3) : monthlySIP * 0.2)}{' '}
                  can pull your retirement date 2-3 years earlier.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-[#d97706] font-bold flex-shrink-0 mt-0.5">2.</span>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  <span className="font-semibold text-zinc-800">Move to a lower-cost city.</span>{' '}
                  Retiring in a Tier 2 or Tier 3 city reduces how much you need — use the city picker on the left.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              <p className="text-sm font-semibold text-zinc-800">To make retirement possible, try:</p>
              <div className="flex items-start gap-2.5">
                <span className="text-[#d97706] font-bold flex-shrink-0 mt-0.5">1.</span>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  <span className="font-semibold text-zinc-800">Increase your monthly investment.</span>{' '}
                  You'd need to invest {formatMonthly(monthlySIP + additionalSIPNeeded)} to retire by your planned lifespan.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-[#d97706] font-bold flex-shrink-0 mt-0.5">2.</span>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  <span className="font-semibold text-zinc-800">Plan to retire in a smaller city.</span>{' '}
                  A lower cost of living means a smaller corpus target, which is more achievable.
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className={`pl-4 pr-4 py-4 rounded-r-xl border-l-4 ${
          isCovered ? 'border-[#16a34a] bg-[#16a34a]/5' : 'border-[#d97706] bg-[#d97706]/5'
        }`}>
          {isCovered ? (
            <div>
              <p className="text-sm font-semibold text-[#16a34a] mb-1">You're on track</p>
              <p className="text-sm text-zinc-600 leading-relaxed">
                Keep investing {formatMonthly(monthlySIP)} every month and don't stop.
                Consistency is more important than the amount, even missing a few months sets you back.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-zinc-800">To close the gap, you have a few options:</p>
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <span className="text-[#d97706] font-bold flex-shrink-0 mt-0.5">1.</span>
                  <p className="text-sm text-zinc-600 leading-relaxed">
                    <span className="font-semibold text-zinc-800">Increase your monthly investment to {formatMonthly(monthlySIP + additionalSIPNeeded)}.</span>{' '}
                    That's {formatMonthly(additionalSIPNeeded)} more per month than you invest now.
                    Even a smaller increase helps, the earlier you start, the more it compounds.
                  </p>
                </div>
                {retireLater !== null && retireLater > 0 && (
                  <div className="flex items-start gap-2.5">
                    <span className="text-[#d97706] font-bold flex-shrink-0 mt-0.5">2.</span>
                    <p className="text-sm text-zinc-600 leading-relaxed">
                      <span className="font-semibold text-zinc-800">Work until {additionalRetireAge} instead of {retirementAge}.</span>{' '}
                      {retireLater} extra year{retireLater !== 1 ? 's' : ''} of saving, and {retireLater} fewer years of withdrawing -
                      makes a significant difference.
                    </p>
                  </div>
                )}
                <div className="flex items-start gap-2.5">
                  <span className="text-[#d97706] font-bold flex-shrink-0 mt-0.5">{retireLater && retireLater > 0 ? '3' : '2'}.</span>
                  <p className="text-sm text-zinc-600 leading-relaxed">
                    <span className="font-semibold text-zinc-800">Plan to spend less after retiring.</span>{' '}
                    If you move to a smaller city or cut lifestyle costs in retirement, you need a smaller corpus to begin with.
                    Use the city picker on the left to see the difference.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Section D: Quick Stats, plain labels, no tooltips needed */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-zinc-100">
        <div>
          <p className="text-[11px] text-zinc-400 mb-1">You can spend per month</p>
          <p className="text-base font-bold tabular-nums text-[#181818]">{formatMonthly(monthlyIncomeInTodaysMoney)}</p>
          <p className="text-[10px] text-zinc-400 mt-0.5 leading-snug">in today's money</p>
        </div>
        <div>
          <p className="text-[11px] text-zinc-400 mb-1">You're saving</p>
          <p className={`text-base font-bold tabular-nums ${savingsRate >= 20 ? 'text-[#16a34a]' : savingsRate >= 10 ? 'text-[#d97706]' : 'text-[#dc2626]'}`}>
            {savingsRate.toFixed(0)}%
          </p>
          <p className="text-[10px] text-zinc-400 mt-0.5">of your income</p>
        </div>
        <div>
          <p className="text-[11px] text-zinc-400 mb-1">Money lasts until</p>
          <p className={`text-base font-bold tabular-nums ${lastsUntilAge >= expectedLifespan ? 'text-[#16a34a]' : 'text-[#dc2626]'}`}>
            Age {lastsUntilAge}
          </p>
          <p className={`text-[10px] mt-0.5 ${lastsUntilAge >= expectedLifespan ? 'text-[#16a34a]' : 'text-[#dc2626]'}`}>
            {lastsUntilAge >= expectedLifespan
              ? `${lastsUntilAge - expectedLifespan > 0 ? `${lastsUntilAge - expectedLifespan} yrs past your goal` : 'exactly your goal'}`
              : `runs out ${expectedLifespan - lastsUntilAge} yrs early`}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-zinc-400 mb-1">If markets crash 30%</p>
          <p className={`text-base font-bold tabular-nums ${lastsUntilAgeStressed >= expectedLifespan ? 'text-[#16a34a]' : 'text-[#dc2626]'}`}>
            Age {lastsUntilAgeStressed}
          </p>
          <p className={`text-[10px] mt-0.5 ${lastsUntilAgeStressed >= expectedLifespan ? 'text-[#16a34a]' : 'text-[#dc2626]'}`}>
            {lastsUntilAgeStressed >= expectedLifespan ? 'still covered' : `${expectedLifespan - lastsUntilAgeStressed} yrs short`}
          </p>
        </div>
      </div>

      {/* Tradeoff slider: only in goal mode when there's a gap and onTrackAge is known */}

    </div>
  )
}
