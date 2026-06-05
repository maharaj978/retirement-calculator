import type { CalculatorInputs, CalculatorOutputs, ScenarioResult } from './types'
import { LTCG_TAX_RATE, LTCG_EXEMPTION, MAX_AGE, CRASH_FACTOR, DEFAULT_INPUTS, SCENARIO_SWRS } from './constants'
import { LIFE_EVENTS } from './lifeEvents'
import { getCityById } from './retirementCities'

function monthlyRate(annualRate: number): number {
  return Math.pow(1 + annualRate, 1 / 12) - 1
}

// Present value of an inflation-growing annuity (in today's-money payments).
// payment = first payment, realReturn = post-return adjusted for inflation, n = years.
function pvAnnuity(payment: number, realReturn: number, n: number): number {
  if (n <= 0 || payment <= 0) return 0
  if (Math.abs(realReturn) < 1e-9) return payment * n
  return payment * (1 - Math.pow(1 + realReturn, -n)) / realReturn
}

// Sum corpus reductions and the *PV of finite-duration annual costs* for selected life events.
// extraCorpusNeeded = PV (at retirement) of all the inflation-adjusted yearly burdens for their stated durations.
function lifeEventAdjustments(
  selectedIds: string[],
  realReturn: number,
  retirementYears: number,
): { extraCorpusNeeded: number; corpusReduction: number } {
  let extraCorpusNeeded = 0
  let corpusReduction = 0
  for (const id of selectedIds) {
    const event = LIFE_EVENTS.find((e) => e.id === id)
    if (!event) continue
    corpusReduction += event.corpusReduction
    if (event.annualCost > 0 && event.annualCostYears > 0) {
      // Cap event duration to remaining retirement years
      const duration = Math.min(event.annualCostYears, retirementYears)
      extraCorpusNeeded += pvAnnuity(event.annualCost, realReturn, duration)
    }
  }
  return { extraCorpusNeeded, corpusReduction }
}

function calculateAccumulation(inputs: CalculatorInputs) {
  const { currentAge, retirementAge, expectedLifespan, monthlyExpenses, currentSavings, epfBalance, monthlySIP, preRetirementReturn, postRetirementReturn, inflationRate, withdrawalRate, otherRetirementIncome } = inputs
  const years = retirementAge - currentAge
  const retirementDuration = Math.max(expectedLifespan - retirementAge, 1)

  const realReturn = (1 + postRetirementReturn) / (1 + inflationRate) - 1

  const { extraCorpusNeeded, corpusReduction } = lifeEventAdjustments(
    inputs.selectedLifeEvents, realReturn, retirementDuration,
  )

  const cityMultiplier = getCityById(inputs.retirementCityId).costMultiplier

  // Expense in retirement-year money (today's lifestyle, inflated, scaled to city)
  const monthlyExpenseAtRetirement = monthlyExpenses * Math.pow(1 + inflationRate, years) * cityMultiplier
  const annualExpenseAtRetirement = monthlyExpenseAtRetirement * 12

  // Pension/rental income: NOMINAL — does NOT grow with inflation in real Indian context.
  // The nominal monthly amount stays the same. Its real value erodes over retirement.
  const pensionMonthly = otherRetirementIncome
  // PV of a fixed-nominal stream at the post-retirement return (no inflation indexing)
  // Equivalent to: each year, pension is the same ₹X. Discounted nominally at post-return.
  const nominalAnnuityPV = (annualPmt: number, rate: number, n: number): number => {
    if (n <= 0 || annualPmt <= 0) return 0
    if (Math.abs(rate) < 1e-9) return annualPmt * n
    return annualPmt * (1 - Math.pow(1 + rate, -n)) / rate
  }
  const pensionPV = nominalAnnuityPV(pensionMonthly * 12, postRetirementReturn, retirementDuration)

  // Required corpus = PV of inflation-adjusted base expenses
  //                 + PV of life-event annual costs (already PV'd above)
  //                 - PV of nominal pension/rental income
  const baseExpensesPV = pvAnnuity(annualExpenseAtRetirement, realReturn, retirementDuration)
  const requiredCorpus = Math.max(baseExpensesPV + extraCorpusNeeded - pensionPV, 0)

  const mr = monthlyRate(preRetirementReturn)
  const months = years * 12
  const sipCorpus = mr > 0 ? monthlySIP * ((Math.pow(1 + mr, months) - 1) / mr) * (1 + mr) : monthlySIP * months
  const savingsCorpus = currentSavings * Math.pow(1 + preRetirementReturn, years)
  const epfCorpus = epfBalance * Math.pow(1 + 0.085, years)
  const projectedCorpus = Math.max(sipCorpus + savingsCorpus + epfCorpus - corpusReduction, 0)

  const savingsRate = inputs.monthlyIncome > 0 ? (monthlySIP / inputs.monthlyIncome) * 100 : 0

  // On-track age: walk forward, checking when projection first meets requirement
  let onTrackAge: number | null = null
  for (let targetAge = retirementAge; targetAge <= MAX_AGE; targetAge++) {
    const y = targetAge - currentAge
    const m = y * 12
    const sc = mr > 0 ? monthlySIP * ((Math.pow(1 + mr, m) - 1) / mr) * (1 + mr) : monthlySIP * m
    const lump = currentSavings * Math.pow(1 + preRetirementReturn, y)
    const epf = epfBalance * Math.pow(1 + 0.085, y)
    const proj = Math.max(sc + lump + epf - corpusReduction, 0)

    const mExpAtTarget = monthlyExpenses * Math.pow(1 + inflationRate, y) * cityMultiplier
    const annExpAtTarget = mExpAtTarget * 12
    const durationAtTarget = Math.max(expectedLifespan - targetAge, 1)
    const baseExpensesPVAtTarget = pvAnnuity(annExpAtTarget, realReturn, durationAtTarget)

    // Re-PV life events to the new retirement age (their durations are still capped by remaining time)
    const { extraCorpusNeeded: extraAtTarget } = lifeEventAdjustments(
      inputs.selectedLifeEvents, realReturn, durationAtTarget,
    )
    // Pension stays nominal regardless of when you retire
    const pensionPVAtTarget = nominalAnnuityPV(pensionMonthly * 12, postRetirementReturn, durationAtTarget)

    const reqAtTarget = Math.max(baseExpensesPVAtTarget + extraAtTarget - pensionPVAtTarget, 0)

    if (proj >= reqAtTarget) {
      onTrackAge = targetAge
      break
    }
  }

  const monthlyIncomeAtRetirement = (projectedCorpus * withdrawalRate) / 12
  const monthlyIncomeInTodaysMoney = monthlyIncomeAtRetirement / Math.pow(1 + inflationRate, years)

  const gap = Math.max(requiredCorpus - projectedCorpus, 0)
  let additionalSIPNeeded = 0
  if (gap > 0 && mr > 0 && months > 0) {
    additionalSIPNeeded = gap / (((Math.pow(1 + mr, months) - 1) / mr) * (1 + mr))
  }

  return {
    requiredCorpus,
    projectedCorpus,
    onTrackAge,
    annualExpenseAtRetirement,
    monthlyExpenseAtRetirement,
    monthlyIncomeAtRetirement,
    monthlyIncomeInTodaysMoney,
    savingsRate,
    additionalSIPNeeded,
  }
}

// Withdrawal simulation with realistic LTCG.
// Tracks cost basis. Tax is applied only to the gain portion of units actually sold.
function simulateWithdrawal(
  startingCorpus: number,
  startingCostBasis: number,
  annualExpenseAtRetirement: number,
  retirementAge: number,
  postRetirementReturn: number,
  inflationRate: number,
  maxAge: number,
): { lastsUntilAge: number; totalWithdrawn: number; corpusOverTime: { age: number; corpus: number }[] } {
  let corpus = startingCorpus
  let costBasis = startingCostBasis
  let totalWithdrawn = 0
  const corpusOverTime: { age: number; corpus: number }[] = [{ age: retirementAge, corpus }]

  for (let i = 0; i <= maxAge - retirementAge; i++) {
    // Grow corpus first (start-of-year growth)
    corpus = corpus * (1 + postRetirementReturn)

    const annualWithdrawal = annualExpenseAtRetirement * Math.pow(1 + inflationRate, i)

    // Realized gain: portion of the units sold that represents profit, not principal.
    // gainRatio = (corpus - costBasis) / corpus
    // If we withdraw W rupees of units, the gain in that withdrawal = W * gainRatio
    const gainRatio = corpus > 0 ? Math.max((corpus - costBasis) / corpus, 0) : 0
    const realizedGain = annualWithdrawal * gainRatio
    const taxableGain = Math.max(realizedGain - LTCG_EXEMPTION, 0)
    const tax = taxableGain * LTCG_TAX_RATE
    const grossWithdrawal = annualWithdrawal + tax

    // Reduce cost basis proportionally to the withdrawal
    if (corpus > 0) {
      costBasis = costBasis * (1 - grossWithdrawal / corpus)
      if (costBasis < 0) costBasis = 0
    }

    corpus = corpus - grossWithdrawal

    if (corpus <= 0) {
      return { lastsUntilAge: retirementAge + i, totalWithdrawn, corpusOverTime }
    }

    totalWithdrawn += annualWithdrawal
    corpusOverTime.push({ age: retirementAge + i + 1, corpus })
  }

  return { lastsUntilAge: maxAge, totalWithdrawn, corpusOverTime }
}

function calculateScenarios(projectedCorpus: number, inputs: CalculatorInputs): ScenarioResult[] {
  return SCENARIO_SWRS.map((swr) => {
    const annualWithdrawalForScenario = projectedCorpus * swr
    const monthlyIncome = annualWithdrawalForScenario / 12
    // For scenarios, assume cost basis is current invested amount (savings + epf + sip contributions).
    // Since we don't track contributions historically, use a reasonable default: 60% basis, 40% gains.
    // This avoids the worst overcharge while being conservative on tax.
    const startingCostBasis = projectedCorpus * 0.6
    const { lastsUntilAge, totalWithdrawn, corpusOverTime } = simulateWithdrawal(
      projectedCorpus,
      startingCostBasis,
      annualWithdrawalForScenario,
      inputs.retirementAge,
      inputs.postRetirementReturn,
      inputs.inflationRate,
      MAX_AGE,
    )
    return { swr, monthlyIncome, lastsUntilAge, totalLifetimeWithdrawal: totalWithdrawn, corpusOverTime }
  })
}

export function calculate(inputs: CalculatorInputs): CalculatorOutputs {
  const safeInputs: CalculatorInputs = {
    ...DEFAULT_INPUTS,
    ...inputs,
    retirementAge: Math.max(inputs.retirementAge, inputs.currentAge + 1),
    expectedLifespan: Math.max(inputs.expectedLifespan, inputs.retirementAge + 1),
  }

  const {
    requiredCorpus, projectedCorpus, onTrackAge, annualExpenseAtRetirement,
    monthlyExpenseAtRetirement, monthlyIncomeAtRetirement, monthlyIncomeInTodaysMoney,
    savingsRate, additionalSIPNeeded,
  } = calculateAccumulation(safeInputs)

  // Cost basis estimate for withdrawal: contributions, not current value.
  // Approximation: total contributed = currentSavings + epfBalance + (monthlySIP × months × inflation factor).
  // Since SIP contributions happen over many years, the effective basis is ~60-70% of corpus.
  const sipMonths = (safeInputs.retirementAge - safeInputs.currentAge) * 12
  const totalContributed = safeInputs.currentSavings + safeInputs.epfBalance + (safeInputs.monthlySIP * sipMonths)
  const estimatedCostBasis = Math.min(totalContributed, projectedCorpus * 0.85)

  const { lastsUntilAge } = simulateWithdrawal(
    projectedCorpus, estimatedCostBasis, annualExpenseAtRetirement, safeInputs.retirementAge,
    safeInputs.postRetirementReturn, safeInputs.inflationRate, safeInputs.expectedLifespan,
  )

  const stressedCorpus = projectedCorpus * CRASH_FACTOR
  const stressedCostBasis = estimatedCostBasis * CRASH_FACTOR
  const { lastsUntilAge: lastsUntilAgeStressed } = simulateWithdrawal(
    stressedCorpus, stressedCostBasis, annualExpenseAtRetirement, safeInputs.retirementAge,
    safeInputs.postRetirementReturn, safeInputs.inflationRate, safeInputs.expectedLifespan,
  )

  const scenarios = calculateScenarios(projectedCorpus, safeInputs)

  return {
    requiredCorpus,
    projectedCorpus,
    onTrackAge,
    monthlyIncomeAtRetirement,
    monthlyIncomeInTodaysMoney,
    expensesAtRetirement: monthlyExpenseAtRetirement,
    lastsUntilAge,
    lastsUntilAgeStressed,
    isCorpusSufficient: lastsUntilAge >= safeInputs.expectedLifespan,
    additionalSIPNeeded,
    scenarios,
    savingsRate,
  }
}
