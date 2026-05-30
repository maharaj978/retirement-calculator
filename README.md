# Retirement Calculator

An Indian retirement planner that answers one question: **how much do you need, and are you on track?**

Built for real Indian financial context — EPF, LTCG tax, 6% inflation, city cost-of-living, and life events that actually happen.

## Features

- **Salary-first input** — enter take-home pay, use sliders to split it between spending and investing
- **Retirement goal bar** — visual gap between what you're on track for vs what you need
- **Action card** — tells you exactly how much more to invest, or when to retire instead
- **Life events** — select events (child, dependent parent, health crisis, job loss) that adjust your plan
- **City cost adjustment** — retire in Mumbai vs a Tier 3 town changes the required corpus significantly
- **5 chart tabs** — savings over time, monthly income vs expenses, depletion speed, accumulation journey, inflation impact
- **Sanity hints** — every input flags unrealistic values (retire at 75, savings rate of 80%, return below inflation)
- **Market crash scenario** — always-visible stat showing how a 30% crash at retirement affects longevity
- **localStorage persistence** — inputs saved automatically, no re-entry on next visit

## Stack

- React 19 + Vite + TypeScript
- Tailwind CSS v3
- Recharts
- Geist font

## Running locally

```bash
npm install
npm run dev
```

App runs at `http://localhost:5173` (or `5174` if that port is taken).

```bash
npm run build   # production build + TypeScript check
```

## Project structure

```
src/
  lib/
    calculator.ts       # all calculation logic (pure functions)
    types.ts            # CalculatorInputs, CalculatorOutputs, etc.
    constants.ts        # defaults, tax constants
    lifeEvents.ts       # life event definitions
    retirementCities.ts # city cost multipliers
  components/
    InputPanel.tsx      # salary, sliders, assumptions
    RetirementSnapshot.tsx  # goal, gap bar, action card, stats
    DeepDiveSection.tsx # scenario cards + 5 chart tabs
    CityPicker.tsx      # city selection
    LifeEventsPanel.tsx # life events
    Tooltip.tsx         # fixed-position tooltip
  pages/
    HomePage.tsx        # root state + localStorage persistence
```

## Calculation approach

- Required corpus: present value of inflation-adjusted annuity over `expectedLifespan - retirementAge` years
- Withdrawal simulation: year-by-year with LTCG tax on gains (12.5% above ₹1.25L/yr exemption)
- City multiplier scales expenses at retirement
- All three scenario SWRs (3%, 4%, 6%) run independently of the user's chosen withdrawal rate

## Indian context assumptions

| Parameter | Default | Notes |
|---|---|---|
| Inflation | 6% | India's long-term average |
| Pre-retirement return | 12% | Diversified equity mutual funds |
| Post-retirement return | 8% | Conservative balanced portfolio |
| Withdrawal rate | 4% | Classic safe withdrawal rate |
| EPF return | 8.5% | Hardcoded (EPFO historical average) |
| LTCG tax | 12.5% | Above ₹1.25L annual exemption |
| Normal retirement age | 58–62 | App flags anything above 68 |
