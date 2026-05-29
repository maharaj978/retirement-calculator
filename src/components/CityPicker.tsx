import { RETIREMENT_CITIES, getCityById } from '../lib/retirementCities'
import Tooltip from './Tooltip'

interface Props {
  selectedId: string
  onChange: (id: string) => void
}

const TIER_LABELS = { tier1: 'Tier 1', tier2: 'Tier 2', tier3: 'Tier 3 / Town' }

function formatRs(n: number) {
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(0)}L`
  return `₹${n.toLocaleString('en-IN')}`
}

export default function CityPicker({ selectedId, onChange }: Props) {
  const selected = getCityById(selectedId)
  const tier1Cities = RETIREMENT_CITIES.filter((c) => c.tier === 'tier1')
  const otherCities = RETIREMENT_CITIES.filter((c) => c.tier !== 'tier1')

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-6">
      <div className="flex items-center gap-2 mb-1">
        <h2 className="text-base font-semibold text-[#181818]">Where Will You Retire?</h2>
        <Tooltip text="The city you retire in significantly affects how much you need. Mumbai costs ~3× more than a small town. This adjusts your monthly expenses accordingly." />
      </div>
      <p className="text-xs text-zinc-400 mb-5">Adjusts your cost of living at retirement</p>

      <div className="mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-2">Tier 1 Cities</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {tier1Cities.map((city) => {
            const isSelected = selectedId === city.id
            return (
              <button
                key={city.id}
                type="button"
                onClick={() => onChange(city.id)}
                className={`text-left px-3 py-2.5 rounded-lg border transition-all duration-150 ${
                  isSelected
                    ? 'border-[#181818] bg-zinc-50'
                    : 'border-zinc-200 bg-white hover:border-zinc-400'
                }`}
              >
                <div className={`text-sm font-medium ${isSelected ? 'text-[#181818]' : 'text-zinc-700'}`}>
                  {city.label}
                </div>
                <div className="text-xs text-zinc-400 mt-0.5">~{formatRs(city.exampleMonthly)}/mo</div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {otherCities.map((city) => {
          const isSelected = selectedId === city.id
          return (
            <button
              key={city.id}
              type="button"
              onClick={() => onChange(city.id)}
              className={`text-left px-3 py-2.5 rounded-lg border transition-all duration-150 ${
                isSelected
                  ? 'border-[#181818] bg-zinc-50'
                  : 'border-zinc-200 bg-white hover:border-zinc-400'
              }`}
            >
              <div className={`text-sm font-medium ${isSelected ? 'text-[#181818]' : 'text-zinc-700'}`}>
                {city.label}
              </div>
              <div className="text-xs text-zinc-400 mt-0.5">~{formatRs(city.exampleMonthly)}/mo</div>
            </button>
          )
        })}
      </div>

      <div className="px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-zinc-800">
              {selected.label}
              <span className="ml-2 text-xs font-normal text-zinc-400">{TIER_LABELS[selected.tier]}</span>
            </div>
            <div className="text-xs text-zinc-500 mt-0.5">{selected.description}</div>
            <div className="text-xs text-zinc-400 mt-1">e.g. {selected.examples}</div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-base font-bold text-[#181818]">~{formatRs(selected.exampleMonthly)}</div>
            <div className="text-xs text-zinc-400">/mo couple</div>
          </div>
        </div>
        <div className="mt-2 text-xs text-zinc-700 font-medium">
          {selected.costMultiplier > 1
            ? `~${Math.round((selected.costMultiplier - 1) * 100)}% more than a mid-range city: savings adjusted up.`
            : selected.costMultiplier < 1
            ? `~${Math.round((1 - selected.costMultiplier) * 100)}% less than a metro: savings adjusted down.`
            : 'Baseline city cost: no adjustment.'}
        </div>
      </div>
    </div>
  )
}
