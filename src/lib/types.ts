export interface CalculatorInputs {
  currentAge: number
  retirementAge: number
  expectedLifespan: number // user-stated planning horizon
  monthlyIncome: number // current monthly take-home (for savings rate display)
  monthlyExpenses: number
  currentSavings: number // mutual funds, stocks, FDs etc.
  epfBalance: number // EPF/PPF/NPS balance
  monthlySIP: number
  preRetirementReturn: number // annual %, e.g. 0.12
  postRetirementReturn: number // annual %, e.g. 0.08
  inflationRate: number // annual %, e.g. 0.06
  withdrawalRate: number // annual %, e.g. 0.04
  otherRetirementIncome: number // monthly ₹ from rental/pension in retirement
  retirementCityId: string // city ID from retirementCities.ts
  selectedLifeEvents: string[] // array of life event IDs
}

export interface LifeEvent {
  id: string
  label: string
  description: string
  icon: string
  costLabel: string
  // Annual cost during retirement (e.g., child support, parent care)
  annualCost: number
  // How many years the annual cost applies during retirement (capped by lifespan)
  // 0 means no recurring cost
  annualCostYears: number
  // One-time cost taken out of the corpus at retirement (e.g., home purchase)
  corpusReduction: number
}

export interface ScenarioResult {
  swr: number
  monthlyIncome: number
  lastsUntilAge: number
  totalLifetimeWithdrawal: number
  corpusOverTime: { age: number; corpus: number }[]
}

export interface CalculatorOutputs {
  requiredCorpus: number
  projectedCorpus: number
  onTrackAge: number | null
  monthlyIncomeAtRetirement: number
  monthlyIncomeInTodaysMoney: number
  expensesAtRetirement: number // inflated monthly expenses at retirement
  lastsUntilAge: number
  lastsUntilAgeStressed: number
  isCorpusSufficient: boolean // lastsUntilAge >= expectedLifespan
  additionalSIPNeeded: number // extra monthly investment needed to close the gap
  scenarios: ScenarioResult[]
  savingsRate: number
}
