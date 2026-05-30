import { useState } from 'react'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import type { ScenarioResult, CalculatorOutputs, CalculatorInputs } from '../lib/types'
import ScenarioCard from './ScenarioCard'

interface Props {
  scenarios: ScenarioResult[]
  outputs: CalculatorOutputs
  inputs: CalculatorInputs
}

const SCENARIO_LABELS = ['Conservative', 'Moderate', 'Aggressive'] as const
const SCENARIO_COLORS = ['#16a34a', '#181818', '#dc2626'] as const

// ── Chart data builders ──────────────────────────────────────────────────────

function buildSavingsOverTime(scenarios: ScenarioResult[], retirementAge: number, expectedLifespan: number) {
  const maxAge = Math.min(Math.max(...scenarios.map((s) => s.lastsUntilAge), expectedLifespan), 100)
  const data: Record<string, number | string>[] = []
  for (let age = retirementAge; age <= maxAge; age++) {
    const row: Record<string, number | string> = { age }
    scenarios.forEach((s, i) => {
      const pt = s.corpusOverTime.find((p) => p.age === age)
      if (pt && pt.corpus > 0) row[SCENARIO_LABELS[i]] = parseFloat((pt.corpus / 1e7).toFixed(2))
    })
    data.push(row)
  }
  return data
}

function buildMonthlyIncomeData(scenarios: ScenarioResult[], inputs: CalculatorInputs, outputs: CalculatorOutputs) {
  const { retirementAge, expectedLifespan, inflationRate } = inputs
  const data: Record<string, number | string>[] = []
  for (let age = retirementAge; age <= Math.min(expectedLifespan, 100); age++) {
    const yr = age - retirementAge
    const row: Record<string, number | string> = { age }
    scenarios.forEach((s, i) => {
      row[SCENARIO_LABELS[i]] = parseFloat((s.monthlyIncome * Math.pow(1 + inflationRate, yr) / 1e5).toFixed(2))
    })
    row['Expenses'] = parseFloat((outputs.expensesAtRetirement * Math.pow(1 + inflationRate, yr) / 1e5).toFixed(2))
    data.push(row)
  }
  return data
}

function buildDepletionData(scenarios: ScenarioResult[], retirementAge: number, expectedLifespan: number) {
  const maxAge = Math.min(Math.max(...scenarios.map((s) => s.lastsUntilAge), expectedLifespan), 100)
  const data: Record<string, number | string>[] = []
  for (let age = retirementAge; age <= maxAge; age++) {
    const row: Record<string, number | string> = { age }
    scenarios.forEach((s, i) => {
      // Drive depletion from lastsUntilAge: simulator stops emitting once corpus hits 0
      if (age > s.lastsUntilAge) {
        row[SCENARIO_LABELS[i]] = 0
        return
      }
      const pt = s.corpusOverTime.find((p) => p.age === age)
      const base = s.corpusOverTime[0]?.corpus ?? 1
      if (pt && base > 0) {
        row[SCENARIO_LABELS[i]] = parseFloat((Math.max(pt.corpus / base, 0) * 100).toFixed(1))
      }
    })
    data.push(row)
  }
  return data
}

function buildAccumulationData(inputs: CalculatorInputs, outputs: CalculatorOutputs) {
  const { currentAge, retirementAge, monthlySIP, currentSavings, epfBalance, preRetirementReturn } = inputs
  const mr = Math.pow(1 + preRetirementReturn, 1 / 12) - 1
  const requiredCr = parseFloat((outputs.requiredCorpus / 1e7).toFixed(2))
  const data: { age: number; projected: number; required: number }[] = []
  for (let age = currentAge; age <= retirementAge; age++) {
    const y = age - currentAge
    const m = y * 12
    const sipFV = mr > 0 ? monthlySIP * ((Math.pow(1 + mr, m) - 1) / mr) * (1 + mr) : monthlySIP * m
    const savFV = currentSavings * Math.pow(1 + preRetirementReturn, y)
    const epfFV = epfBalance * Math.pow(1 + 0.085, y)
    data.push({
      age,
      projected: parseFloat(((sipFV + savFV + epfFV) / 1e7).toFixed(2)),
      required: requiredCr,
    })
  }
  return data
}

function buildInflationData(inputs: CalculatorInputs) {
  const { currentAge, retirementAge, expectedLifespan, inflationRate, monthlyExpenses } = inputs
  const mid = Math.round((retirementAge + expectedLifespan) / 2)
  const milestones = [
    { label: 'Today', years: 0 },
    { label: `Age ${retirementAge}`, years: retirementAge - currentAge },
    { label: `Age ${mid}`, years: mid - currentAge },
    { label: `Age ${expectedLifespan}`, years: expectedLifespan - currentAge },
  ]
  return milestones.map(({ label, years }) => ({
    label,
    expenses: Math.round(monthlyExpenses * Math.pow(1 + inflationRate, years)),
    purchasing: Math.round(100000 / Math.pow(1 + inflationRate, years)),
  }))
}

// ── Shared chart config ──────────────────────────────────────────────────────

const AXIS_STYLE = { fontSize: 11, fill: '#a1a1aa' }
const GRID_COLOR = '#f4f4f5'
const TOOLTIP_STYLE = { fontSize: 12, borderRadius: 8, border: '1px solid #e4e4e7', boxShadow: 'none' }

const TABS = ['Savings Over Time', 'Monthly Income', 'Depletion Speed', 'Accumulation', 'Inflation Impact']

function InsightBox({ text }: { text: string }) {
  return (
    <div className="mt-4 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg">
      <p className="text-xs font-medium text-zinc-700 leading-relaxed">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#181818] mr-2 mb-0.5 align-middle" />
        {text}
      </p>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export default function DeepDiveSection({ scenarios, outputs, inputs }: Props) {
  const [activeTab, setActiveTab] = useState(0)

  const savingsData = buildSavingsOverTime(scenarios, inputs.retirementAge, inputs.expectedLifespan)
  const monthlyData = buildMonthlyIncomeData(scenarios, inputs, outputs)
  const depletionData = buildDepletionData(scenarios, inputs.retirementAge, inputs.expectedLifespan)
  const accumData = buildAccumulationData(inputs, outputs)
  const inflationData = buildInflationData(inputs)

  // Pre-compute insight values
  const retirementYears = inputs.retirementAge - inputs.currentAge

  // Tab 1: which scenario lasts the longest and by how many years
  const modScenario = scenarios[1]
  const aggScenario = scenarios[2]
  const savingsInsight = modScenario && aggScenario
    ? `At 4% withdrawal, your savings last until age ${modScenario.lastsUntilAge}: ${modScenario.lastsUntilAge - aggScenario.lastsUntilAge} years longer than if you withdrew 6% per year.`
    : ''

  // Tab 2: whether moderate income keeps pace with expenses at lifespan age
  const lastMonthlyRow = monthlyData[monthlyData.length - 1]
  const modIncomeAtEnd = lastMonthlyRow ? (lastMonthlyRow['Moderate'] as number ?? 0) : 0
  const expAtEnd = lastMonthlyRow ? (lastMonthlyRow['Expenses'] as number ?? 0) : 0
  const incomeVsExpense = modIncomeAtEnd > 0 && expAtEnd > 0
    ? modIncomeAtEnd >= expAtEnd
      ? `By age ${inputs.expectedLifespan}, your moderate withdrawal income (₹${modIncomeAtEnd.toFixed(1)}L/mo) still covers your expenses (₹${expAtEnd.toFixed(1)}L/mo). You're holding up.`
      : `By age ${inputs.expectedLifespan}, your expenses (₹${expAtEnd.toFixed(1)}L/mo) exceed moderate withdrawal income (₹${modIncomeAtEnd.toFixed(1)}L/mo). Consider a lower withdrawal rate.`
    : ''

  // Tab 3: at age midpoint, what % remains for moderate scenario
  const midAge = Math.round((inputs.retirementAge + inputs.expectedLifespan) / 2)
  const midRow = depletionData.find((r) => r['age'] === midAge)
  const modPctAtMid = midRow ? (midRow['Moderate'] as number ?? 0) : 0
  const depletionInsight = modPctAtMid > 0
    ? `At age ${midAge}: halfway through retirement: you'd still have ${modPctAtMid.toFixed(0)}% of your savings left at the moderate (4%) withdrawal rate.`
    : `At the aggressive withdrawal rate, savings deplete before age ${inputs.expectedLifespan}. The moderate rate extends coverage by ${(scenarios[1]?.lastsUntilAge ?? 0) - (scenarios[2]?.lastsUntilAge ?? 0)} years.`

  // Tab 4: how much of the target is covered at retirement
  const lastAccum = accumData[accumData.length - 1]
  const projAtRetirement = lastAccum?.projected ?? 0
  const requiredCr = lastAccum?.required ?? 1
  const coveragePct = Math.round((projAtRetirement / requiredCr) * 100)
  const accumInsight = projAtRetirement > 0
    ? coveragePct >= 100
      ? `By age ${inputs.retirementAge}, your projected savings of ₹${projAtRetirement.toFixed(2)} Cr exceed your ₹${requiredCr.toFixed(2)} Cr target: you're fully funded.`
      : `By age ${inputs.retirementAge}, you're projected to reach ${coveragePct}% of your ₹${requiredCr.toFixed(2)} Cr target. To close the gap, you need ₹${(outputs.additionalSIPNeeded / 1000).toFixed(0)}K more per month.`
    : ''

  // Tab 5: inflation insight
  const purchasingAtRetirement = Math.round(100000 / Math.pow(1 + inputs.inflationRate, retirementYears))
  const inflationInsight = `At ${Math.round(inputs.inflationRate * 100)}% inflation: ₹1L today = ₹${purchasingAtRetirement.toLocaleString('en-IN')} in real terms by age ${inputs.retirementAge}. Over ${retirementYears} years, your money loses ${100 - Math.round(purchasingAtRetirement / 1000)}% of its value.`

  const insights = [savingsInsight, incomeVsExpense, depletionInsight, accumInsight, inflationInsight]

  return (
    <div className="space-y-6">

      {/* Scenario section: card wrapper */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-1">How Much Can You Withdraw?</p>
        <p className="text-xs text-zinc-400 mb-4">Three ways to use your savings in retirement. Each gives you a different income and lasts a different amount of time.</p>
        <div className="divide-y divide-zinc-200">
          {scenarios.map((scenario, i) => (
            <ScenarioCard
              key={scenario.swr}
              scenario={scenario}
              label={SCENARIO_LABELS[i]}
              isRecommended={i === 1}
              expectedLifespan={inputs.expectedLifespan}
            />
          ))}
        </div>
      </div>

      {/* Tabbed charts */}
      <div className="bg-white rounded-xl border border-zinc-200">
        {/* Tab bar */}
        <div className="overflow-x-auto">
          <div className="flex border-b border-zinc-200 min-w-max">
            {TABS.map((tab, i) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(i)}
                className={`px-4 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === i
                    ? 'text-[#181818] border-[#181818]'
                    : 'text-zinc-400 border-transparent hover:text-zinc-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Chart area */}
        <div className="p-5 space-y-4">

          {/* Insight box: shown for every tab */}
          {insights[activeTab] && <InsightBox text={insights[activeTab]} />}

          {/* Tab 1: Savings Over Time */}
          {activeTab === 0 && (
            <div>
              <p className="text-xs text-zinc-400 mb-3">Savings remaining across 3 withdrawal strategies (₹ Crore)</p>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={savingsData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                  <XAxis dataKey="age" tick={AXIS_STYLE} label={{ value: 'Age', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#a1a1aa' }} />
                  <YAxis tick={AXIS_STYLE} tickFormatter={(v) => `₹${v}Cr`} width={58} />
                  <RechartsTooltip formatter={(v, n) => [`₹${v} Cr`, n]} labelFormatter={(l) => `Age ${l}`} contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {SCENARIO_LABELS.map((label, i) => (
                    <Line key={label} type="monotone" dataKey={label} stroke={SCENARIO_COLORS[i]} strokeWidth={2} dot={false} connectNulls={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Tab 2: Monthly Income vs Expenses */}
          {activeTab === 1 && (
            <div>
              <p className="text-xs text-zinc-400 mb-3">Monthly withdrawal income vs expenses: both grow with inflation (₹ Lakh/mo)</p>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={monthlyData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                  <XAxis dataKey="age" tick={AXIS_STYLE} label={{ value: 'Age', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#a1a1aa' }} />
                  <YAxis tick={AXIS_STYLE} tickFormatter={(v) => `₹${v}L`} width={54} />
                  <RechartsTooltip formatter={(v, n) => [`₹${v}L/mo`, n]} labelFormatter={(l) => `Age ${l}`} contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {SCENARIO_LABELS.map((label, i) => (
                    <Line key={label} type="monotone" dataKey={label} stroke={SCENARIO_COLORS[i]} strokeWidth={2} dot={false} connectNulls={false} />
                  ))}
                  <Line type="monotone" dataKey="Expenses" stroke="#d97706" strokeWidth={2} strokeDasharray="5 3" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Tab 3: Depletion Speed */}
          {activeTab === 2 && (
            <div>
              <p className="text-xs text-zinc-400 mb-3">What % of your starting savings remains over time</p>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={depletionData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                  <XAxis dataKey="age" tick={AXIS_STYLE} label={{ value: 'Age', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#a1a1aa' }} />
                  <YAxis tick={AXIS_STYLE} tickFormatter={(v) => `${v}%`} width={42} domain={[0, 100]} />
                  <RechartsTooltip formatter={(v, n) => [`${v}%`, n]} labelFormatter={(l) => `Age ${l}`} contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <ReferenceLine y={50} stroke="#a1a1aa" strokeDasharray="4 3" label={{ value: '50%', fontSize: 10, fill: '#a1a1aa', position: 'right' }} />
                  {SCENARIO_LABELS.map((label, i) => (
                    <Area key={label} type="monotone" dataKey={label} stroke={SCENARIO_COLORS[i]} fill={SCENARIO_COLORS[i]} fillOpacity={0.07} strokeWidth={2} dot={false} connectNulls={false} />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Tab 4: Accumulation Journey */}
          {activeTab === 3 && (
            <div>
              <p className="text-xs text-zinc-400 mb-3">Your savings growth from today to retirement vs your target (₹ Crore)</p>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={accumData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                  <XAxis dataKey="age" tick={AXIS_STYLE} label={{ value: 'Age', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#a1a1aa' }} />
                  <YAxis tick={AXIS_STYLE} tickFormatter={(v) => `₹${v}Cr`} width={58} />
                  <RechartsTooltip formatter={(v, n) => [`₹${v} Cr`, n]} labelFormatter={(l) => `Age ${l}`} contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="projected" name="Projected Savings" stroke="#181818" fill="#181818" fillOpacity={0.06} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="required" name="Target" stroke="#dc2626" strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Tab 5: Inflation Impact */}
          {activeTab === 4 && (
            <div>
              <p className="text-xs text-zinc-400 mb-3">Monthly expenses and ₹1L purchasing power at each life stage</p>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={inflationData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }} barGap={4} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                  <XAxis dataKey="label" tick={AXIS_STYLE} />
                  <YAxis tick={AXIS_STYLE} tickFormatter={(v) => `₹${Math.round(v / 1000)}K`} width={54} />
                  <RechartsTooltip formatter={(v, n) => [`₹${Number(v).toLocaleString('en-IN')}`, n]} contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="expenses" name="Monthly Expenses" fill="#181818" fillOpacity={0.85} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="purchasing" name="₹1L buying power" fill="#a1a1aa" fillOpacity={0.6} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
