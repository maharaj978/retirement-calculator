import posthog from 'posthog-js'
import type { CalculatorInputs, CalculatorOutputs } from './types'

export function trackCalculation(inputs: CalculatorInputs, outputs: CalculatorOutputs) {
  posthog.capture('retirement_calculated', {
    current_age: inputs.currentAge,
    retirement_age: inputs.retirementAge,
    expected_lifespan: inputs.expectedLifespan,
    monthly_income: inputs.monthlyIncome,
    savings_rate_pct: Math.round(outputs.savingsRate),
    city: inputs.retirementCityId,
    life_events: inputs.selectedLifeEvents,
    required_corpus_cr: parseFloat((outputs.requiredCorpus / 1e7).toFixed(2)),
    projected_corpus_cr: parseFloat((outputs.projectedCorpus / 1e7).toFixed(2)),
    is_on_track: outputs.projectedCorpus >= outputs.requiredCorpus,
    on_track_age: outputs.onTrackAge,
    lasts_until_age: outputs.lastsUntilAge,
  })
}

export function trackModeSwitch(mode: 'goal' | 'reverse') {
  posthog.capture('mode_switched', { mode })
}

export function trackLifeEventToggled(eventId: string, selected: boolean) {
  posthog.capture('life_event_toggled', { event_id: eventId, selected })
}

export function trackCityChanged(cityId: string) {
  posthog.capture('city_changed', { city: cityId })
}

export function trackShareClicked(method: 'native' | 'clipboard') {
  posthog.capture('share_clicked', { method })
}
