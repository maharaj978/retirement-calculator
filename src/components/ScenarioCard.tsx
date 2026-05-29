import type { ScenarioResult } from '../lib/types'
import { formatCurrency, formatMonthly } from '../lib/utils'
import Tooltip from './Tooltip'

interface Props {
  scenario: ScenarioResult
  label: string
  isRecommended?: boolean
}

export default function ScenarioCard({ scenario, label, isRecommended }: Props) {
  return (
    <div
      className={`rounded-xl border px-4 py-4 flex-shrink-0 w-56 ${
        isRecommended
          ? 'border-zinc-200 bg-zinc-50'
          : 'border-zinc-200 bg-white'
      }`}
    >
      {isRecommended && (
        <div className="text-[10px] font-semibold text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded-full inline-block mb-2 uppercase tracking-wide">
          Recommended
        </div>
      )}
      <div className="text-sm font-semibold text-zinc-800 mb-1">{label}</div>
      <div className="flex items-center gap-1 mb-4">
        <span className="text-xs text-zinc-400">Withdrawal</span>
        <span className="text-xs font-semibold text-zinc-600">{(scenario.swr * 100).toFixed(0)}%/yr</span>
        <Tooltip text="The % of your savings you withdraw each year. Lower = safer (money lasts longer), higher = more income but riskier." />
      </div>

      <div className="space-y-3">
        <div>
          <div className="text-[11px] text-zinc-400 uppercase tracking-wide">Monthly Income</div>
          <div className="text-lg font-bold text-[#181818] tabular-nums">{formatMonthly(scenario.monthlyIncome)}</div>
        </div>
        <div>
          <div className="text-[11px] text-zinc-400 uppercase tracking-wide">Savings Last Until</div>
          <div className={`text-lg font-bold tabular-nums ${
            scenario.lastsUntilAge >= 85 ? 'text-[#16a34a]' : scenario.lastsUntilAge >= 75 ? 'text-[#d97706]' : 'text-[#dc2626]'
          }`}>
            Age {scenario.lastsUntilAge}
          </div>
        </div>
        <div>
          <div className="text-[11px] text-zinc-400 uppercase tracking-wide">Total Withdrawn</div>
          <div className="text-sm font-semibold text-zinc-700 tabular-nums">{formatCurrency(scenario.totalLifetimeWithdrawal)}</div>
        </div>
      </div>
    </div>
  )
}
