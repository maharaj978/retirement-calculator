import { useState, useMemo, useEffect, useRef } from 'react'
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
import ShareCard from '../components/ShareCard'
import TradeoffSlider from '../components/TradeoffSlider'
import { trackCalculation, trackModeSwitch, trackLifeEventToggled, trackCityChanged, trackShareClicked } from '../lib/analytics'

export default function HomePage() {
  const cardRef = useRef<HTMLDivElement>(null!)
  const [sharing, setSharing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [mode, setMode] = useState<'goal' | 'reverse'>('goal')
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

  // Track calculation with 2s debounce so we capture settled values, not every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputs.monthlyIncome > 0) {
        trackCalculation(inputs, outputs)
      }
    }, 2000)
    return () => clearTimeout(timer)
  }, [inputs, outputs])

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

  const APP_URL = 'https://retirement-calculator-kappa-three.vercel.app/'

  function buildShareText() {
    const corpus = outputs.requiredCorpus
    const corpusStr = corpus >= 1e7
      ? `₹${(corpus / 1e7).toFixed(1)} Cr`
      : `₹${(corpus / 1e5).toFixed(0)}L`
    const retireAge = inputs.retirementAge
    const isCovered = outputs.projectedCorpus >= outputs.requiredCorpus
    const status = isCovered
      ? `and I'm on track`
      : `still figuring out how to get there`

    return `Finally sat down and calculated my retirement number.\n\nTo retire at ${retireAge}, I need to save ${corpusStr} — ${status}.\n\nCurious what yours looks like? ${APP_URL}`
  }

  async function handleShare() {
    if (!cardRef.current || sharing) return
    setSharing(true)
    try {
      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2 })

      const res = await fetch(dataUrl)
      const blob = await res.blob()
      const file = new File([blob], 'retirement-plan.png', { type: 'image/png' })

      const shareText = buildShareText()
      const canShareWithFile = typeof navigator.share === 'function'
        && typeof navigator.canShare === 'function'
        && navigator.canShare({ files: [file] })

      if (canShareWithFile) {
        trackShareClicked('native')
        await navigator.share({ files: [file], text: shareText })
      } else if (typeof navigator.share === 'function') {
        trackShareClicked('native')
        await navigator.share({ title: 'Retirement Planner', text: shareText, url: APP_URL })
      } else {
        trackShareClicked('clipboard')
        await navigator.clipboard.writeText(APP_URL)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      }
    } catch (e) {
      if (e instanceof Error && e.name !== 'AbortError') {
        console.error('Share failed', e)
      }
    } finally {
      setSharing(false)
    }
  }

  function handleToggleLifeEvent(id: string) {
    setInputs((prev) => {
      const isSelected = prev.selectedLifeEvents.includes(id)
      trackLifeEventToggled(id, !isSelected)
      const selected = isSelected
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
    <div className="space-y-6 pb-16">
      <div className="pt-2">
        <h1 className="text-3xl font-semibold tracking-tight text-[#181818]">Your Retirement Plan</h1>
        <p className="text-sm text-zinc-500 mt-1.5">Fill in your details and see your personalised forecast.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-8 lg:gap-12 items-start">
        {/* Left column: inputs — toggle lives here so it matches the column width */}
        <div className="space-y-6">
          <div className="flex bg-zinc-100 rounded-xl p-1 gap-1">
            <button
              type="button"
              onClick={() => { setMode('goal'); trackModeSwitch('goal') }}
              className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'goal' ? 'bg-white text-[#181818] shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              Goal Mode
            </button>
            <button
              type="button"
              onClick={() => { setMode('reverse'); trackModeSwitch('reverse') }}
              className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'reverse' ? 'bg-white text-[#181818] shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              Reality Mode
            </button>
          </div>
          <InputPanel
            inputs={inputs}
            spendPct={spendPct}
            savePct={savePct}
            mode={mode}
            onIncomeChange={handleIncomeChange}
            onSpendPctChange={handleSpendPctChange}
            onSavePctChange={handleSavePctChange}
            onFieldChange={handleFieldChange}
          />
          <CityPicker
            selectedId={inputs.retirementCityId}
            onChange={(id) => { setInputs((prev) => ({ ...prev, retirementCityId: id })); trackCityChanged(id) }}
          />
          <LifeEventsPanel
            selected={inputs.selectedLifeEvents}
            onToggle={handleToggleLifeEvent}
            lifeEventImpact={lifeEventImpact}
          />
        </div>

        {/* Right column: sticky on desktop */}
        <div className="space-y-6 lg:sticky lg:top-[4.5rem] lg:self-start">
          <RetirementSnapshot outputs={outputs} inputs={inputs} mode={mode} />

          <DeepDiveSection scenarios={outputs.scenarios} outputs={outputs} inputs={inputs} />

          {/* SIP What-If card — only in goal mode when there's a gap */}
          {mode === 'goal' && outputs.projectedCorpus < outputs.requiredCorpus && (
            <TradeoffSlider
              requiredCorpus={outputs.requiredCorpus}
              currentAge={inputs.currentAge}
              retirementAge={inputs.retirementAge}
              currentSavings={inputs.currentSavings}
              epfBalance={inputs.epfBalance}
              preRetirementReturn={inputs.preRetirementReturn}
            />
          )}

          {/* Share button — below the charts */}
          <button
            type="button"
            onClick={handleShare}
            disabled={sharing}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-zinc-200 bg-white text-sm font-medium text-zinc-700 hover:border-zinc-400 hover:text-[#181818] transition-colors disabled:opacity-50"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
              <polyline points="16 6 12 2 8 6"/>
              <line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
            {sharing ? 'Generating...' : copied ? 'Link copied!' : 'Share this planner'}
          </button>
        </div>
      </div>

      {/* Hidden share card — rendered off-screen for image capture */}
      <div style={{ position: 'fixed', top: -9999, left: -9999, zIndex: -1, pointerEvents: 'none' }}>
        <ShareCard outputs={outputs} inputs={inputs} cardRef={cardRef} />
      </div>
    </div>
  )
}
