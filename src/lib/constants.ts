export const LTCG_TAX_RATE = 0.125
export const LTCG_EXEMPTION = 125000
export const MAX_AGE = 100
export const CRASH_FACTOR = 0.70 // 30% market crash

export const DEFAULT_INPUTS = {
  currentAge: 30,
  retirementAge: 45,
  expectedLifespan: 85,
  monthlyIncome: 100000,
  monthlyExpenses: 50000,
  currentSavings: 0,
  epfBalance: 0,
  monthlySIP: 25000,
  preRetirementReturn: 0.12,
  postRetirementReturn: 0.08,
  inflationRate: 0.06,
  withdrawalRate: 0.04,
  otherRetirementIncome: 0,
  retirementCityId: 'bangalore',
  selectedLifeEvents: [] as string[],
}

export const SCENARIO_SWRS = [0.03, 0.04, 0.06] as const
export const SCENARIO_LABELS = ['Conservative', 'Moderate', 'Aggressive'] as const
