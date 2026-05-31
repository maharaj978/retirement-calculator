import { useState } from 'react'
import type { CalculatorInputs } from '../lib/types'
import Tooltip from './Tooltip'

interface Props {
  inputs: CalculatorInputs
  spendPct: number
  savePct: number
  mode: 'goal' | 'reverse'
  onIncomeChange: (value: number) => void
  onSpendPctChange: (pct: number) => void
  onSavePctChange: (pct: number) => void
  onFieldChange: (field: keyof CalculatorInputs, value: number) => void
}

function toIndianLocale(n: number): string {
  return Math.round(n).toLocaleString('en-IN')
}

function formatRs(amount: number): string {
  if (amount >= 1e7) return `₹${(amount / 1e7).toFixed(2)} Cr`
  if (amount >= 1e5) return `₹${(amount / 1e5).toFixed(1)}L`
  return `₹${toIndianLocale(amount)}`
}

type HintLevel = 'green' | 'amber' | 'red' | 'gray'

const hintColors: Record<HintLevel, string> = {
  green: 'text-[#16a34a]',
  amber: 'text-[#d97706]',
  red: 'text-[#dc2626]',
  gray: 'text-zinc-400',
}

function HintLine({ text, level }: { text: string; level: HintLevel }) {
  return <p className={`text-xs mt-1 ${hintColors[level]}`}>{text}</p>
}

// Savings benchmark: roughly how much you should have saved by your age
// Adapted from Fidelity's rule for Indian context (based on annual income)
function savingsBenchmark(age: number, annualIncome: number): { multiplier: number; target: number } {
  const breakpoints = [
    [25, 0.5], [30, 1], [35, 2], [40, 3], [45, 5], [50, 7], [55, 9], [60, 11],
  ] as [number, number][]
  let multiplier = 0
  for (let i = 0; i < breakpoints.length - 1; i++) {
    const [a1, m1] = breakpoints[i]
    const [a2, m2] = breakpoints[i + 1]
    if (age >= a1 && age <= a2) {
      multiplier = m1 + ((age - a1) / (a2 - a1)) * (m2 - m1)
      break
    }
  }
  if (age < 25) multiplier = 0
  if (age > 60) multiplier = 11
  return { multiplier: parseFloat(multiplier.toFixed(1)), target: annualIncome * multiplier }
}

function FormattedInput({
  value,
  onChange,
  step = 1000,
  className = '',
  placeholder = '0',
}: {
  value: number
  onChange: (v: number) => void
  step?: number
  className?: string
  placeholder?: string
}) {
  const [localVal, setLocalVal] = useState('')
  const [focused, setFocused] = useState(false)

  return (
    <input
      type={focused ? 'text' : 'text'}
      inputMode="numeric"
      value={focused ? localVal : toIndianLocale(value)}
      step={step}
      placeholder={placeholder}
      onFocus={() => {
        // Show raw number when editing so backspace works freely
        setLocalVal(value === 0 ? '' : String(value))
        setFocused(true)
      }}
      onBlur={() => {
        setFocused(false)
        const v = parseFloat(localVal.replace(/,/g, ''))
        onChange(isNaN(v) || v < 0 ? 0 : v)
      }}
      onChange={(e) => setLocalVal(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
      }}
      className={className}
    />
  )
}

interface SliderRowProps {
  label: string
  accentColor: string
  dotColor: string
  pct: number
  amount: number
  onChange: (v: number) => void
  tooltip: string
  idealMin: number
  idealMax: number
  hint: { text: string; level: HintLevel }
}

function SliderRow({ label, accentColor, dotColor, pct, amount, onChange, tooltip, idealMin, idealMax, hint }: SliderRowProps) {
  // Place tick marks at idealMin and idealMax on the track
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${dotColor}`} />
          <span className="text-sm font-medium text-zinc-700">{label}</span>
          <Tooltip text={tooltip} />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[10px] text-[#16a34a] font-medium">ideal {idealMin}–{idealMax}%</span>
          <span className="font-semibold text-[#181818] w-9 text-right">{pct}%</span>
          <span className="text-zinc-400 w-24 text-right tabular-nums">{formatRs(amount)}/mo</span>
        </div>
      </div>
      <div className="relative">
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={pct}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full relative z-10"
          style={{
            accentColor,
            color: accentColor,
            background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${pct}%, #f4f4f5 ${pct}%, #f4f4f5 100%)`,
            borderRadius: '999px',
          }}
        />
      </div>
      <HintLine text={hint.text} level={hint.level} />
    </div>
  )
}

interface NumberFieldProps {
  label: string
  value: number
  onChange: (v: number) => void
  prefix?: string
  suffix?: string
  step?: number
  tooltip: string
  hint?: { text: string; level: HintLevel }
}

function NumberField({ label, value, onChange, prefix, suffix, step = 1000, tooltip, hint }: NumberFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <label className="text-sm font-medium text-zinc-600">{label}</label>
        <Tooltip text={tooltip} />
      </div>
      <div className="flex items-center gap-1.5">
        {prefix && <span className="text-zinc-400 text-sm">{prefix}</span>}
        <FormattedInput
          value={value}
          onChange={onChange}
          step={step}
          className="border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#181818] focus:border-transparent w-full"
        />
        {suffix && <span className="text-zinc-400 text-sm whitespace-nowrap">{suffix}</span>}
      </div>
      {hint && <HintLine text={hint.text} level={hint.level} />}
    </div>
  )
}

function lifespanHint(lifespan: number): { text: string; level: HintLevel } {
  if (lifespan <= 75) return { text: 'Short horizon: consider planning to 85+. One spouse in a couple often lives past 80.', level: 'amber' }
  if (lifespan <= 85) return { text: 'Common planning horizon, but consider 90+: couples should plan for the longer-lived spouse.', level: 'green' }
  return { text: 'Safe choice: your savings need to work harder but you won\'t outlive your money.', level: 'green' }
}

function retirementAgeHint(currentAge: number, retirementAge: number): { text: string; level: HintLevel } {
  const gap = retirementAge - currentAge
  // Flag unrealistic retirement ages for Indian context
  if (retirementAge > 68) return { text: `Working until ${retirementAge} is past the typical Indian retirement age of 58–62. Most EPF withdrawals are at 58. Are you sure?`, level: 'red' }
  if (currentAge >= 60) return { text: `You're already at or past the typical retirement age. Plan for drawing down your corpus, not accumulating more.`, level: 'amber' }
  if (gap < 5) return { text: `Only ${gap} year${gap !== 1 ? 's' : ''} to retire: almost no time to build a corpus. This plan is very difficult to execute.`, level: 'red' }
  if (gap < 10) return { text: `${gap} years: very aggressive. You'll need a high savings rate (40%+) to reach your goal.`, level: 'red' }
  if (gap < 15) return { text: `${gap} years: challenging but doable with a savings rate of 30%+.`, level: 'amber' }
  if (gap <= 25) return { text: `${gap} years: good runway. Stay consistent with your monthly investment.`, level: 'green' }
  return { text: `${gap} years: plenty of time. Even a moderate investment will compound significantly.`, level: 'green' }
}

function spendHint(pct: number): { text: string; level: HintLevel } {
  if (pct < 35) return { text: 'Very frugal: great for building wealth fast.', level: 'green' }
  if (pct <= 55) return { text: 'Good balance between living well and saving.', level: 'green' }
  if (pct <= 70) return { text: 'A bit high: try to bring this below 55% over time.', level: 'amber' }
  return { text: 'High spending leaves little room to save: consider reducing fixed costs.', level: 'red' }
}

function saveHint(pct: number): { text: string; level: HintLevel } {
  if (pct < 10) return { text: 'Too low: aim for at least 20% to retire comfortably.', level: 'red' }
  if (pct < 20) return { text: `${pct}% is a start: try to reach 20% as your income grows.`, level: 'amber' }
  if (pct <= 30) return { text: `${pct}% is a healthy savings rate. Well done.`, level: 'green' }
  if (pct <= 60) return { text: `${pct}% is aggressive: great for early retirement. Make sure your lifestyle is sustainable.`, level: 'green' }
  return { text: `${pct}% is not sustainable long-term: leaves only ${100 - pct}% for all living expenses, taxes, and emergencies. Aim for 30–40%.`, level: 'amber' }
}

function advancedFieldHint(field: string, value: number, inputs: CalculatorInputs): { text: string; level: HintLevel } {
  const pct = Math.round(value * 100)
  const inflationPct = Math.round(inputs.inflationRate * 100)
  const postReturnPct = Math.round(inputs.postRetirementReturn * 100)

  if (field === 'preRetirementReturn') {
    if (pct <= inflationPct) return { text: `⚠ ${pct}% is at or below inflation (${inflationPct}%). Your real returns are 0% or negative: money isn't growing in real terms.`, level: 'red' }
    if (pct > 14) return { text: `${pct}% is optimistic: most equity funds average 10–12% long-term.`, level: 'amber' }
    if (pct < 8) return { text: `${pct}% is conservative. Equity returns are typically 10–12% in India.`, level: 'amber' }
    return { text: `${pct}% is reasonable for a diversified equity portfolio.`, level: 'green' }
  }
  if (field === 'postRetirementReturn') {
    if (pct > 10) return { text: `${pct}% is risky post-retirement. Consider 7–9% for a balanced portfolio.`, level: 'amber' }
    if (pct < 6) return { text: `${pct}% is very conservative: even a balanced fund should return 7–9%.`, level: 'amber' }
    return { text: `${pct}% is sensible. Note: 12.5% LTCG tax on gains reduces effective return to ~${(pct * (1 - 0.125)).toFixed(1)}%.`, level: 'green' }
  }
  if (field === 'inflationRate') {
    const yrs = inputs.retirementAge - inputs.currentAge
    const inflated = inputs.monthlyExpenses * Math.pow(1 + value, yrs)
    const baseText = `Your ₹${toIndianLocale(inputs.monthlyExpenses)}/mo grows to ${formatRs(inflated)}/mo at retirement.`
    if (pct < 5) return { text: `${pct}% may be too low: India's avg is ~6%. ${baseText}`, level: 'amber' }
    if (pct > 8) return { text: `${pct}% is high: use 6% unless you have a specific reason. ${baseText}`, level: 'amber' }
    return { text: `${pct}% matches India's historical avg. ${baseText}`, level: 'green' }
  }
  if (field === 'withdrawalRate') {
    if (pct >= postReturnPct) return { text: `⚠ ${pct}% withdrawal ≥ ${postReturnPct}% return: your corpus will shrink every year and deplete faster than expected.`, level: 'red' }
    if (pct > 5) return { text: `${pct}% is risky: high rates deplete savings faster. 3.5–4.5% is historically safer.`, level: 'red' }
    if (pct < 3) return { text: `${pct}% is very conservative: you'll need a much larger corpus.`, level: 'amber' }
    return { text: `${pct}% is in the safe zone. 4% has historically survived 30+ year retirements.`, level: 'green' }
  }
  return { text: '', level: 'gray' }
}

interface AssumptionFieldProps {
  label: string
  tooltip: string
  value: number // stored as decimal e.g. 0.12
  min: number   // in % e.g. 4
  max: number   // in % e.g. 20
  step: number  // in % e.g. 0.5
  onChange: (v: number) => void
  hint: { text: string; level: HintLevel }
}

function AssumptionField({ value, min, max, step, onChange }: AssumptionFieldProps) {
  const [localVal, setLocalVal] = useState(() => parseFloat((value * 100).toFixed(1)).toString())
  const [focused, setFocused] = useState(false)

  // Sync external value changes (e.g. reset) when not focused
  if (!focused) {
    const external = parseFloat((value * 100).toFixed(1)).toString()
    if (localVal !== external && !focused) {
      // Use a ref-style sync: only update display when external changes and we're not editing
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <input
          type="text"
          inputMode="decimal"
          value={focused ? localVal : parseFloat((value * 100).toFixed(1)).toString()}
          min={min}
          max={max}
          step={step}
          onFocus={() => {
            setLocalVal(parseFloat((value * 100).toFixed(1)).toString())
            setFocused(true)
          }}
          onChange={(e) => setLocalVal(e.target.value)}
          onBlur={() => {
            setFocused(false)
            const parsed = parseFloat(localVal)
            if (!isNaN(parsed) && parsed >= min && parsed <= max) {
              onChange(parsed / 100)
              setLocalVal(parseFloat((parsed).toFixed(1)).toString())
            } else {
              // Revert to last valid value
              setLocalVal(parseFloat((value * 100).toFixed(1)).toString())
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
            // Arrow up/down nudge by step
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
              e.preventDefault()
              const current = parseFloat(localVal) || value * 100
              const next = e.key === 'ArrowUp' ? current + step : current - step
              const clamped = Math.min(max, Math.max(min, parseFloat(next.toFixed(1))))
              setLocalVal(clamped.toString())
              onChange(clamped / 100)
            }
          }}
          className="w-20 border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#181818] focus:border-transparent tabular-nums"
        />
        <span className="text-zinc-400 text-sm">%</span>
      </div>
    </div>
  )
}

export default function InputPanel({ inputs, spendPct, savePct, mode, onIncomeChange, onSpendPctChange, onSavePctChange, onFieldChange }: Props) {
  const leftoverPct = 100 - spendPct - savePct
  const isOverAllocated = leftoverPct < 0

  const annualIncome = inputs.monthlyIncome * 12
  const { multiplier, target } = savingsBenchmark(inputs.currentAge, annualIncome)

  const totalSavings = inputs.currentSavings + inputs.epfBalance
  const savingsHint: { text: string; level: HintLevel } = inputs.currentAge >= 60
    ? { text: `At 60+, shift focus from accumulating to managing withdrawals from your existing savings.`, level: 'gray' }
    : annualIncome > 0
    ? totalSavings >= target
      ? { text: `At age ${inputs.currentAge}, aim for ${multiplier}× annual income (${formatRs(target)}). You're there ✓`, level: 'green' }
      : totalSavings >= target * 0.6
      ? { text: `At age ${inputs.currentAge}, aim for ${multiplier}× annual income (${formatRs(target)}). You're close.`, level: 'amber' }
      : { text: `At age ${inputs.currentAge}, aim for ${multiplier}× annual income (${formatRs(target)}).`, level: totalSavings === 0 ? 'gray' : 'amber' }
    : { text: `Rule of thumb: ${multiplier}× your annual income at age ${inputs.currentAge}.`, level: 'gray' }

  const advancedFields = [
    {
      field: 'preRetirementReturn' as keyof CalculatorInputs,
      label: 'Investment Return',
      sublabel: 'How much your money grows per year while you\'re still working. Indian equity mutual funds average around 12% over the long term.',
      tooltip: 'Annual return on your investments before retirement. 12% is a reasonable long-term average for Indian equity mutual funds. Use 8–9% if you prefer a conservative estimate.',
      min: 4, max: 20, step: 1,
    },
    {
      field: 'postRetirementReturn' as keyof CalculatorInputs,
      label: 'Return After Retiring',
      sublabel: 'Once retired, you\'ll likely move to safer investments. They grow slower but are more stable. 7–8% is typical.',
      tooltip: 'Expected annual return on your savings after you retire. Lower than pre-retirement because you\'ll likely move to safer, balanced funds.',
      min: 3, max: 15, step: 1,
    },
    {
      field: 'inflationRate' as keyof CalculatorInputs,
      label: 'Inflation Rate',
      sublabel: 'How fast prices rise every year. At 6%, something that costs ₹100 today will cost ₹179 in 10 years.',
      tooltip: 'India\'s long-term average is ~6%. This is why you need more money in retirement than you spend today.',
      min: 3, max: 12, step: 1,
    },
    {
      field: 'withdrawalRate' as keyof CalculatorInputs,
      label: 'Yearly Withdrawal',
      sublabel: 'What % of your savings you spend each year in retirement. 4% is the globally accepted safe amount that typically never runs out.',
      tooltip: 'The 4% rule: backed by 75+ years of market data: has historically never depleted a portfolio over 30 years. Go lower for longer retirement horizons.',
      min: 2, max: 10, step: 0.5,
    },
  ]

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-6">

      {/* Section: Ages */}
      <div>
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">Your Timeline</h3>
        <div className="space-y-5">
          {/* Current Age slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <label className="text-sm font-medium text-zinc-600">Current Age</label>
                <Tooltip text="Your age today." />
              </div>
              <span className="text-sm font-bold text-[#181818]">{inputs.currentAge} yrs</span>
            </div>
            <input
              type="range"
              min={18} max={70} step={1}
              value={inputs.currentAge}
              onChange={(e) => {
                const v = parseInt(e.target.value)
                onFieldChange('currentAge', v)
                // Keep retirement age at least 5 years ahead
                if (inputs.retirementAge <= v + 4) onFieldChange('retirementAge', v + 5)
              }}
              className="w-full"
              style={{
                background: `linear-gradient(to right, #181818 0%, #181818 ${(((inputs.currentAge - 18) / (70 - 18)) * 100) * 100}%, #f4f4f5 ${(((inputs.currentAge - 18) / (70 - 18)) * 100) * 100}%, #f4f4f5 100%)`,
                borderRadius: '999px',
              }}
            />
            <div className="flex justify-between text-[10px] text-zinc-300">
              <span>18</span><span>70</span>
            </div>
          </div>

          {/* Retire At slider — hidden in reverse mode */}
          {mode === 'goal' ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <label className="text-sm font-medium text-zinc-600">Retire At</label>
                  <Tooltip text="The age at which you want to stop working full-time." />
                </div>
                <span className="text-sm font-bold text-[#181818]">{inputs.retirementAge} yrs</span>
              </div>
              <input
                type="range"
                min={Math.min(inputs.currentAge + 5, 75)}
                max={75}
                step={1}
                value={inputs.retirementAge}
                onChange={(e) => onFieldChange('retirementAge', parseInt(e.target.value))}
                className="w-full"
                style={{
                  background: `linear-gradient(to right, #181818 0%, #181818 ${(((inputs.retirementAge - (inputs.currentAge + 5)) / (75 - (inputs.currentAge + 5))) * 100) * 100}%, #f4f4f5 ${(((inputs.retirementAge - (inputs.currentAge + 5)) / (75 - (inputs.currentAge + 5))) * 100) * 100}%, #f4f4f5 100%)`,
                  borderRadius: '999px',
                }}
              />
              <div className="flex justify-between text-[10px] text-zinc-300">
                <span>{inputs.currentAge + 5}</span><span>75</span>
              </div>
              <HintLine {...retirementAgeHint(inputs.currentAge, inputs.retirementAge)} />
            </div>
          ) : (
            <div className="flex items-center gap-2 py-2 px-3 bg-zinc-50 rounded-lg">
              <span className="text-xs text-zinc-400">Retire At</span>
              <span className="text-xs text-zinc-400">: calculated from your savings rate</span>
            </div>
          )}

          {/* Expected Lifespan slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <label className="text-sm font-medium text-zinc-600">Plan For Longevity Until</label>
                <Tooltip text="How long you want your retirement savings to last. Use your family's health history as a guide. Planning longer is safer: running out of money is a bigger risk than having extra." />
              </div>
              <span className="text-sm font-bold text-[#181818]">{inputs.expectedLifespan} yrs</span>
            </div>
            <input
              type="range"
              min={65} max={100} step={1}
              value={inputs.expectedLifespan}
              onChange={(e) => {
                const v = parseInt(e.target.value)
                onFieldChange('expectedLifespan', Math.max(v, inputs.retirementAge + 1))
              }}
              className="w-full"
              style={{
                background: `linear-gradient(to right, #181818 0%, #181818 ${(((inputs.expectedLifespan - 65) / (100 - 65)) * 100) * 100}%, #f4f4f5 ${(((inputs.expectedLifespan - 65) / (100 - 65)) * 100) * 100}%, #f4f4f5 100%)`,
                borderRadius: '999px',
              }}
            />
            <div className="flex justify-between text-[10px] text-zinc-400">
              <span>65</span><span>100</span>
            </div>
            <HintLine {...lifespanHint(inputs.expectedLifespan)} />
          </div>
        </div>
      </div>

      <div className="border-t border-zinc-50" />

      {/* Section: Income anchor */}
      <div>
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Your Monthly Take-Home</h3>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-zinc-500">₹</span>
          <FormattedInput
            value={inputs.monthlyIncome}
            onChange={onIncomeChange}
            step={5000}
            className="text-3xl font-bold text-[#181818] border-0 border-b-2 border-zinc-200 focus:border-[#181818] focus:outline-none w-full bg-transparent pb-1"
            placeholder="0"
          />
          <span className="text-sm text-zinc-400 whitespace-nowrap">/mo</span>
        </div>
      </div>

      <div className="border-t border-zinc-50" />

      {/* Section: Allocation sliders */}
      <div>
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">How You Split It</h3>
        <div className="space-y-6">
          <SliderRow
            label="Spend"
            accentColor="#181818"
            dotColor="bg-[#181818]"
            pct={spendPct}
            amount={inputs.monthlyExpenses}
            onChange={onSpendPctChange}
            tooltip="What % of your income goes to monthly expenses: rent, food, bills, lifestyle."
            idealMin={40}
            idealMax={55}
            hint={spendHint(spendPct)}
          />
          <SliderRow
            label="Monthly Investment"
            accentColor="#181818"
            dotColor="bg-zinc-500"
            pct={savePct}
            amount={inputs.monthlySIP}
            onChange={onSavePctChange}
            tooltip="The amount you invest every month: like a recurring deposit but in mutual funds. This is what builds your retirement savings."
            idealMin={20}
            idealMax={30}
            hint={saveHint(savePct)}
          />

          {/* Left over */}
          <div className={`flex items-center justify-between py-2 px-3 rounded-lg ${isOverAllocated ? 'bg-[#dc2626]/5' : 'bg-zinc-50'}`}>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isOverAllocated ? 'bg-[#dc2626]' : 'bg-zinc-300'}`} />
              <span className={`text-sm font-medium ${isOverAllocated ? 'text-[#dc2626]' : 'text-zinc-400'}`}>
                {isOverAllocated ? `Over-allocated by ${Math.abs(leftoverPct)}%` : 'Left over'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm tabular-nums">
              {!isOverAllocated && (
                <>
                  <span className="font-semibold text-zinc-400 w-9 text-right">{leftoverPct}%</span>
                  <span className="text-zinc-500 w-24 text-right">{formatRs(leftoverPct / 100 * inputs.monthlyIncome)}/mo</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-zinc-50" />

      {/* Section: What you already have */}
      <div>
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">What You Already Have</h3>
        <div className="space-y-4">
          <NumberField
            label="Savings & Investments"
            value={inputs.currentSavings}
            onChange={(v) => onFieldChange('currentSavings', v)}
            prefix="₹"
            step={10000}
            tooltip="Total value of your mutual funds, stocks, and FDs today (exclude EPF)."
            hint={savingsHint}
          />
          <NumberField
            label="EPF / PPF / NPS Balance"
            value={inputs.epfBalance}
            onChange={(v) => onFieldChange('epfBalance', v)}
            prefix="₹"
            step={10000}
            tooltip="Employee Provident Fund, PPF, or NPS balance. Grows at ~8.5% and is added to your retirement corpus."
          />
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <label className="text-sm font-medium text-zinc-600">Guaranteed Income in Retirement</label>
              <Tooltip text="Pension, rental income, annuity: any fixed monthly amount you'll receive after retiring. This directly reduces how much corpus you need to build." />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400 text-sm">₹</span>
              <FormattedInput
                value={inputs.otherRetirementIncome}
                onChange={(v) => onFieldChange('otherRetirementIncome', v)}
                step={500}
                className="border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#181818] focus:border-transparent w-full"
              />
              <span className="text-zinc-400 text-sm whitespace-nowrap">/mo</span>
            </div>
            {inputs.otherRetirementIncome > 0 && (
              <p className="text-xs text-[#16a34a] mt-0.5">
                This {formatRs(inputs.otherRetirementIncome)}/mo reduces your corpus target: your savings only need to cover the remaining expenses.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Assumptions */}
      <div className="border-t border-zinc-100 pt-5">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Assumptions</h3>
        <p className="text-xs text-zinc-400 mb-4">These are pre-filled with sensible defaults. Change them only if you have a reason to.</p>
        <div className="divide-y divide-zinc-100">
          {advancedFields.map(({ field, label, sublabel, min, max, step }) => {
            const rawVal = inputs[field] as number
            const hint = advancedFieldHint(field as string, rawVal, inputs)
            return (
              <div key={field} className="flex items-start justify-between gap-4 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-zinc-700">{label}</span>
                    <span className="text-[10px] text-zinc-400">{min}–{max}%</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">{sublabel}</p>
                  {hint.text && <HintLine text={hint.text} level={hint.level} />}
                </div>
                <AssumptionField
                  label=""
                  tooltip=""
                  value={rawVal}
                  min={min}
                  max={max}
                  step={step}
                  onChange={(v) => onFieldChange(field, v)}
                  hint={{ text: '', level: 'gray' }}
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
