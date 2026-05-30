import type { ScenarioResult } from '../lib/types'

function formatMonthly(n: number): string {
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)}L/mo`
  return `₹${Math.round(n).toLocaleString('en-IN')}/mo`
}

function formatRs(n: number): string {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)}L`
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

const DESCRIPTIONS: Record<string, string> = {
  Conservative: 'You take out 3% of your savings each year. Less monthly income, but your money lasts much longer.',
  Moderate: 'You take out 4% each year. The classic rule used by most retirement planners worldwide.',
  Aggressive: 'You take out 6% each year. More to spend now, but your savings run out significantly sooner.',
}

interface Props {
  scenario: ScenarioResult
  label: string
  isRecommended?: boolean
  expectedLifespan: number
}

export default function ScenarioCard({ scenario, label, isRecommended, expectedLifespan }: Props) {
  const lastsColor =
    scenario.lastsUntilAge >= expectedLifespan ? 'text-[#16a34a]' :
    scenario.lastsUntilAge >= expectedLifespan - 10 ? 'text-[#d97706]' :
    'text-[#dc2626]'

  const shortfall = expectedLifespan - scenario.lastsUntilAge
  const longevityNote = scenario.lastsUntilAge >= expectedLifespan
    ? `${scenario.lastsUntilAge - expectedLifespan > 0 ? `${scenario.lastsUntilAge - expectedLifespan} yrs past your goal` : 'exactly your goal'}`
    : `runs out ${shortfall} yr${shortfall !== 1 ? 's' : ''} before your goal`

  return (
    <div className="py-4">
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`text-sm font-semibold ${isRecommended ? 'text-[#181818]' : 'text-zinc-700'}`}>{label}</span>
        {isRecommended && (
          <span className="text-[10px] font-semibold text-[#181818] bg-zinc-100 px-2 py-0.5 rounded-full uppercase tracking-wide">
            Recommended
          </span>
        )}
      </div>

      <p className="text-xs text-zinc-500 leading-relaxed mb-3">{DESCRIPTIONS[label]}</p>

      <div className="flex items-start gap-6 flex-wrap">
        <div>
          <p className="text-[10px] text-zinc-400 mb-0.5">Monthly income</p>
          <p className="text-lg font-bold tabular-nums text-[#181818]">{formatMonthly(scenario.monthlyIncome)}</p>
        </div>
        <div>
          <p className="text-[10px] text-zinc-400 mb-0.5">Money lasts until</p>
          <p className={`text-lg font-bold tabular-nums ${lastsColor}`}>Age {scenario.lastsUntilAge}</p>
          <p className={`text-[10px] mt-0.5 ${lastsColor}`}>{longevityNote}</p>
        </div>
        <div>
          <p className="text-[10px] text-zinc-400 mb-0.5">Total you can withdraw</p>
          <p className="text-sm font-semibold tabular-nums text-zinc-600">{formatRs(scenario.totalLifetimeWithdrawal)}</p>
          <p className="text-[10px] text-zinc-400 mt-0.5">over your retirement</p>
        </div>
      </div>
    </div>
  )
}
