import { LIFE_EVENTS } from '../lib/lifeEvents'
import Tooltip from './Tooltip'

interface Props {
  selected: string[]
  onToggle: (id: string) => void
  lifeEventImpact: number
}

export default function LifeEventsPanel({ selected, onToggle, lifeEventImpact }: Props) {
  const hasSelected = selected.length > 0
  const impactCr = lifeEventImpact / 1e7

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-6">
      <div className="flex items-center gap-2 mb-1">
        <h2 className="text-base font-semibold text-[#181818]">Life Events</h2>
        <Tooltip text="Select events that apply to you. Each one adjusts your retirement plan based on real average costs in India." />
      </div>
      <p className="text-xs text-zinc-400 mb-4">Unexpected events that can affect your plan</p>

      <div className="grid grid-cols-2 gap-2">
        {LIFE_EVENTS.map((event) => {
          const isSelected = selected.includes(event.id)
          return (
            <button
              key={event.id}
              type="button"
              onClick={() => onToggle(event.id)}
              className={`text-left p-3 rounded-lg border transition-all duration-150 ${
                isSelected
                  ? 'border-[#181818] bg-zinc-50'
                  : 'border-zinc-200 bg-white hover:border-zinc-400'
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg leading-none mt-0.5">{event.icon}</span>
                <div className="min-w-0">
                  <div className={`text-sm font-medium leading-tight ${isSelected ? 'text-[#181818]' : 'text-zinc-700'}`}>
                    {event.label}
                  </div>
                  <div className="text-xs text-zinc-400 mt-0.5 leading-snug">{event.costLabel}</div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {hasSelected && (
        <div className="mt-4 pl-4 pr-3 py-3 border-l-4 border-[#d97706] bg-[#d97706]/5 rounded-r-lg">
          <p className="text-sm text-zinc-700">
            Life events add{' '}
            <span className="font-semibold text-[#181818]">
              {impactCr >= 0.01 ? `₹${impactCr.toFixed(2)} Cr` : `₹${Math.round(lifeEventImpact).toLocaleString('en-IN')}`}
            </span>{' '}
            to your retirement plan
          </p>
        </div>
      )}
    </div>
  )
}
