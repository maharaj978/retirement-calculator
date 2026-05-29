import type { CalculatorInputs, CalculatorOutputs, ScenarioResult } from './types'
import { LTCG_TAX_RATE, LTCG_EXEMPTION, MAX_AGE, CRASH_FACTOR, DEFAULT_INPUTS, SCENARIO_SWRS } from './constants'
import { LIFE_EVENTS } from './lifeEvents'
import { getCityById } from './retirementCities'

function monthlyRate(annualRate: number): number {
  return Math.pow(1 + annualRate, 1 / 12) - 1
}

function lifeEventAdjustments(inputs: CalculatorInputs): { extraAnnualCost: number; corpusReduction: number } {
  let extraAnnualCost = 0
  let corpusReduction = 0
  for (const id of inputs.selectedLifeEvents) {
    const event = LIFE_EVENTS.find((e) => e.id === id)
    if (event) {
      extraAnnualCost += event.extraAnnualCost(inputs.currentAge, inputs.retirementAge)
      corpusReduction += event.corpusReduction()
    }
  }
  return { extraAnnualCost, corpusReduction }
}

function calculateAccumulation(inputs: CalculatorInputs) {
  const { currentAge, retirementAge, expectedLifespan, monthlyExpenses, currentSavings, epfBalance, monthlySIP, preRetirementReturn, postRetirementReturn, inflationRate, withdrawalRate, otherRetirementIncome } = inputs
  const years = retirementAge - currentAge
  const retirementDuration = Math.max(expectedLifespan - retirementAge, 1)

  const { extraAnnualCost, corpusReduction } = lifeEventAdjustments(inputs)
  const cityMultiplier = getCityById(inputs.retirementCityId).costMultiplier

  const monthlyExpenseAtRetirement = monthlyExpenses * Math.pow(1 + inflationRate, years) * cityMultiplier
  const otherIncomeAtRetirement = otherRetirementIncome * Math.pow(1 + inflationRate, years)
  const netMonthlyExpense = Math.max(monthlyExpenseAtRetirement - otherIncomeAtRetirement, 0)
  const annualExpenseAtRetirement = netMonthlyExpense * 12 + extraAnnualCost

  // Required corpus: present value of inflation-adjusted annuity over retirement duration.
  // Real return = (1 + postReturn) / (1 + inflation) - 1, applied over retirementDuration years.
  const realReturn = (1 + postRetirementReturn) / (1 + inflationRate) - 1
  const requiredCorpus = realReturn > 0
    ? annualExpenseAtRetirement * (1 - Math.pow(1 + realReturn, -retirementDuration)) / realReturn
    : annualExpenseAtRetirement * retirementDuration // edge case: zero real return

  const mr = monthlyRate(preRetirementReturn)
  const months = years * 12
  const sipCorpus = mr > 0 ? monthlySIP * ((Math.pow(1 + mr, months) - 1) / mr) * (1 + mr) : monthlySIP * months
  const savingsCorpus = currentSavings * Math.pow(1 + preRetirementReturn, years)
  const epfCorpus = epfBalance * Math.pow(1 + 0.085, years)
  const projectedCorpus = Math.max(sipCorpus + savingsCorpus + epfCorpus - corpusReduction, 0)

  const savingsRate = inputs.monthlyIncome > 0 ? (monthlySIP / inputs.monthlyIncome) * 100 : 0

  let onTrackAge: number | null = null
  for (let targetAge = retirementAge; targetAge <= MAX_AGE; targetAge++) {
    const y = targetAge - currentAge
    const m = y * 12
    const sc = mr > 0 ? monthlySIP * ((Math.pow(1 + mr, m) - 1) / mr) * (1 + mr) : monthlySIP * m
    const lump = currentSavings * Math.pow(1 + preRetirementReturn, y)
    const epf = epfBalance * Math.pow(1 + 0.085, y)
    const proj = Math.max(sc + lump + epf - corpusReduction, 0)

    const mExpAtTarget = monthlyExpenses * Math.pow(1 + inflationRate, y) * cityMultiplier
    const oiAtTarget = otherRetirementIncome * Math.pow(1 + inflationRate, y)
    const netExpAtTarget = Math.max(mExpAtTarget - oiAtTarget, 0)
    const annExpAtTarget = netExpAtTarget * 12 + extraAnnualCost
    const durationAtTarget = Math.max(expectedLifespan - targetAge, 1)
    const reqAtTarget = realReturn > 0
      ? annExpAtTarget * (1 - Math.pow(1 + realReturn, -durationAtTarget)) / realReturn
      : annExpAtTarget * durationAtTarget

    if (proj >= reqAtTarget) {
      onTrackAge = targetAge
      break
    }
  }

  const monthlyIncomeAtRetirement = (projectedCorpus * withdrawalRate) / 12
  const monthlyIncomeInTodaysMoney = monthlyIncomeAtRetirement / Math.pow(1 + inflationRate, years)

  // Additional monthly SIP needed to close the gap
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
    monthlyExpenseAtRetirement, // raw inflated expense (before other income subtraction)
    monthlyIncomeAtRetirement,
    monthlyIncomeInTodaysMoney,
    savingsRate,
    additionalSIPNeeded,
  }
}

function simulateWithdrawal(
  startingCorpus: number,
  annualExpenseAtRetirement: number,
  retirementAge: number,
  postRetirementReturn: number,
  inflationRate: number,
  maxAge: number,
): { lastsUntilAge: number; totalWithdrawn: number; corpusOverTime: { age: number; corpus: number }[] } {
  let corpus = startingCorpus
  let totalWithdrawn = 0
  const corpusOverTime: { age: number; corpus: number }[] = [{ age: retirementAge, corpus }]

  for (let i = 0; i <= maxAge - retirementAge; i++) {
    const annualWithdrawal = annualExpenseAtRetirement * Math.pow(1 + inflationRate, i)
    const annualGain = corpus * postRetirementReturn
    const taxableGain = Math.max(annualGain - LTCG_EXEMPTION, 0)
    const tax = taxableGain * LTCG_TAX_RATE
    const grossWithdrawal = annualWithdrawal + tax

    corpus = corpus * (1 + postRetirementReturn) - grossWithdrawal

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
    const { lastsUntilAge, totalWithdrawn, corpusOverTime } = simulateWithdrawal(
      projectedCorpus,
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

  const { lastsUntilAge } = simulateWithdrawal(
    projectedCorpus, annualExpenseAtRetirement, safeInputs.retirementAge,
    safeInputs.postRetirementReturn, safeInputs.inflationRate, safeInputs.expectedLifespan,
  )

  const stressedCorpus = projectedCorpus * CRASH_FACTOR
  const { lastsUntilAge: lastsUntilAgeStressed } = simulateWithdrawal(
    stressedCorpus, annualExpenseAtRetirement, safeInputs.retirementAge,
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
