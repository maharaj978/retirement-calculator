import { useState, useMemo, useEffect } from 'react'
import type { CalculatorInputs } from '../lib/types'
import { DEFAULT_INPUTS } from '../lib/constants'

const STORAGE_KEY = 'retirement-planner-inputs'

function loadInputs(): CalculatorInputs & { spendPct: number; savePct: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      // Merge with defaults so new fields added later don't break
      return { ...DEFAULT_INPUTS, monthlyExpenses: DEFAULT_INPUTS.monthlyIncome * 0.5, monthlySIP: DEFAULT_INPUTS.monthlyIncome * 0.25, spendPct: 50, savePct: 25, ...parsed }
    }
  } catch {
    // ignore parse errors
  }
  return { ...DEFAULT_INPUTS, monthlyExpenses: DEFAULT_INPUTS.monthlyIncome * 0.5, monthlySIP: DEFAULT_INPUTS.monthlyIncome * 0.25, spendPct: 50, savePct: 25 }
}
import { calculate } from '../lib/calculator'
import InputPanel from '../components/InputPanel'
import CityPicker from '../components/CityPicker'
import LifeEventsPanel from '../components/LifeEventsPanel'
import RetirementSnapshot from '../components/RetirementSnapshot'
import DeepDiveSection from '../components/DeepDiveSection'

export default function HomePage() {
  const saved = loadInputs()
  const [spendPct, setSpendPct] = useState(saved.spendPct)
  const [savePct, setSavePct] = useState(saved.savePct)

  const [inputs, setInputs] = useState<CalculatorInputs>(() => {
    const { spendPct: _s, savePct: _v, ...rest } = saved
    return rest as CalculatorInputs
  })

  // Persist to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...inputs, spendPct, savePct }))
    } catch {
      // ignore storage errors (e.g. private mode quota)
    }
  }, [inputs, spendPct, savePct])

  const outputs = useMemo(() => calculate(inputs), [inputs])

  function handleIncomeChange(value: number) {
    setInputs((prev) => ({
      ...prev,
      monthlyIncome: value,
      monthlyExpenses: value * (spendPct / 100),
      monthlySIP: value * (savePct / 100),
    }))
  }

  function handleSpendPctChange(pct: number) {
    setSpendPct(pct)
    setInputs((prev) => ({ ...prev, monthlyExpenses: prev.monthlyIncome * (pct / 100) }))
  }

  function handleSavePctChange(pct: number) {
    setSavePct(pct)
    setInputs((prev) => ({ ...prev, monthlySIP: prev.monthlyIncome * (pct / 100) }))
  }

  function handleFieldChange(field: keyof CalculatorInputs, value: number) {
    setInputs((prev) => ({ ...prev, [field]: value }))
  }

  function handleToggleLifeEvent(id: string) {
    setInputs((prev) => {
      const selected = prev.selectedLifeEvents.includes(id)
        ? prev.selectedLifeEvents.filter((e) => e !== id)
        : [...prev.selectedLifeEvents, id]
      return { ...prev, selectedLifeEvents: selected }
    })
  }

  const lifeEventImpact = useMemo(() => {
    const baseOutputs = calculate({ ...inputs, selectedLifeEvents: [] })
    const requiredIncrease = Math.max(outputs.requiredCorpus - baseOutputs.requiredCorpus, 0)
    const corpusHit = Math.max(baseOutputs.projectedCorpus - outputs.projectedCorpus, 0)
    return requiredIncrease + corpusHit
  }, [inputs, outputs.requiredCorpus, outputs.projectedCorpus])

  return (
    <div className="space-y-8 pb-16">
      <div className="pt-2">
        <h1 className="text-3xl font-semibold tracking-tight text-[#181818]">Your Retirement Plan</h1>
        <p className="text-sm text-zinc-500 mt-1.5">Fill in your details and see your personalised forecast.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-8 lg:gap-12 items-start">
        {/* Left column: inputs */}
        <div className="space-y-6">
          <InputPanel
            inputs={inputs}
            spendPct={spendPct}
            savePct={savePct}
            onIncomeChange={handleIncomeChange}
            onSpendPctChange={handleSpendPctChange}
            onSavePctChange={handleSavePctChange}
            onFieldChange={handleFieldChange}
          />
          <CityPicker
            selectedId={inputs.retirementCityId}
            onChange={(id) => setInputs((prev) => ({ ...prev, retirementCityId: id }))}
          />
          <LifeEventsPanel
            selected={inputs.selectedLifeEvents}
            onToggle={handleToggleLifeEvent}
            lifeEventImpact={lifeEventImpact}
          />
        </div>

        {/* Right column: sticky on desktop */}
        <div className="space-y-6 lg:sticky lg:top-[4.5rem] lg:self-start">
          <RetirementSnapshot outputs={outputs} inputs={inputs} />
<DeepDiveSection scenarios={outputs.scenarios} outputs={outputs} inputs={inputs} />
        </div>
      </div>
    </div>
  )
}
