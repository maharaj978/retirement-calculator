import { useState } from 'react'
import Tooltip from './Tooltip'

interface Props {
  lastsUntilAge: number
  lastsUntilAgeStressed: number
  expectedLifespan: number
}

export default function StressTestCard({ lastsUntilAge, lastsUntilAgeStressed, expectedLifespan }: Props) {
  const [enabled, setEnabled] = useState(false)
  const diff = lastsUntilAge - lastsUntilAgeStressed
  const crashShortfall = expectedLifespan - lastsUntilAgeStressed

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold text-zinc-800">Market Crash Scenario</span>
          <Tooltip text="Simulates a 30% market crash right at the start of your retirement: the worst time it can happen. Assumes you keep spending the same amount, showing the worst-case impact." />
        </div>
        {/* shadcn-style toggle */}
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => setEnabled((v) => !v)}
          className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#181818] focus:ring-offset-2 ${
            enabled ? 'bg-[#181818]' : 'bg-zinc-200'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 mt-0.5 ${
              enabled ? 'translate-x-4' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      <p className="text-xs text-zinc-400 mt-1 mb-4">
        30% crash at retirement, same spending maintained
      </p>

      {!enabled ? (
        <div className="text-sm text-zinc-600">
          Savings last until{' '}
          <span className="font-bold text-[#16a34a] text-base">Age {lastsUntilAge}</span>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-6">
            <div>
              <div className="text-[11px] text-zinc-400 mb-0.5 uppercase tracking-wide">Normal</div>
              <div className="text-xl font-bold text-[#16a34a]">Age {lastsUntilAge}</div>
            </div>
            <div className="text-zinc-300 text-lg">→</div>
            <div>
              <div className="text-[11px] text-zinc-400 mb-0.5 uppercase tracking-wide">After crash</div>
              <div className="text-xl font-bold text-[#dc2626]">Age {lastsUntilAgeStressed}</div>
            </div>
            {diff > 0 && (
              <div className="ml-auto">
                <div className="text-xs font-semibold text-[#dc2626] bg-[#dc2626]/5 border border-[#dc2626]/20 px-2 py-1 rounded-md">
                  −{diff} yr{diff !== 1 ? 's' : ''}
                </div>
              </div>
            )}
          </div>
          {crashShortfall > 0 ? (
            <p className="text-xs text-[#dc2626] bg-[#dc2626]/5 border border-[#dc2626]/20 rounded-md px-3 py-2">
              A 30% crash would mean savings run out {crashShortfall} year{crashShortfall !== 1 ? 's' : ''} before your planned age of {expectedLifespan}.
            </p>
          ) : (
            <p className="text-xs text-[#16a34a] bg-[#16a34a]/5 border border-[#16a34a]/20 rounded-md px-3 py-2">
              Even after a 30% crash, your savings outlast your planned lifespan. You have a buffer.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
