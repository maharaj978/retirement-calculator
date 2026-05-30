# Claude Onboarding — Retirement Calculator

## What this is
Personal side project. **Not Salesforce/work.** Indian retirement planner web app built with the owner (maharaj.ma). No enterprise constraints, no deployment pipeline — just ship and iterate.

## Running the app
```bash
npm run dev        # starts at http://localhost:5174 (5173 is often taken by another project)
npm run build      # TypeScript check + Vite production build
```

## Stack
- React 19 + Vite + TypeScript (strict, `verbatimModuleSyntax` on — use `import type`)
- Tailwind CSS v3 (config: `tailwind.config.js`)
- Recharts (all charts)
- No UI component libraries — Tailwind only

## Design system
- Font: Geist (loaded from Google Fonts in `index.html`)
- Primary color: `#181818` (near-black, not pure black)
- Status colors: `#16a34a` success, `#d97706` warning, `#dc2626` danger
- Neutral palette: zinc scale (`zinc-50` through `zinc-900`)
- Cards: `rounded-xl border border-zinc-200 bg-white` — no shadows
- Tooltips: white bg, zinc-200 border, zinc-700 text (light theme)
- No em dashes (`—`) anywhere in UI copy — use `:` or `-` instead

## Architecture

### Data flow
```
HomePage (state) → calculate(inputs) → CalculatorOutputs → display components
```

All calculation logic lives in `src/lib/calculator.ts` — components only display, never calculate.

### Key files
| File | Purpose |
|---|---|
| `src/lib/types.ts` | All interfaces: `CalculatorInputs`, `CalculatorOutputs`, `ScenarioResult`, `LifeEvent` |
| `src/lib/constants.ts` | `DEFAULT_INPUTS`, LTCG tax constants, scenario SWRs |
| `src/lib/calculator.ts` | Pure calculation engine — accumulation, withdrawal simulation, scenarios |
| `src/lib/lifeEvents.ts` | 8 life event definitions with corpus reduction + annual cost functions |
| `src/lib/retirementCities.ts` | City cost multipliers (Tier 1/2/3) applied to retirement expenses |
| `src/pages/HomePage.tsx` | Root state holder — all inputs + localStorage persistence |
| `src/components/InputPanel.tsx` | Left column: salary anchor, spend/save sliders, assumptions section |
| `src/components/RetirementSnapshot.tsx` | Right column top: goal headline, gap bar, action card, 4-stat row |
| `src/components/DeepDiveSection.tsx` | Scenario cards (always visible) + 5-tab chart section |
| `src/components/CityPicker.tsx` | City selection grid affecting cost multiplier |
| `src/components/LifeEventsPanel.tsx` | Unexpected life event checkboxes |
| `src/components/Tooltip.tsx` | Fixed-position tooltip (uses `getBoundingClientRect` to escape overflow containers) |

### Inputs state
`spendPct` and `savePct` are separate UI state (not in `CalculatorInputs`) — they drive `monthlyExpenses` and `monthlySIP` as percentages of `monthlyIncome`. All state is persisted to `localStorage` under key `retirement-planner-inputs`.

### Calculator notes
- Required corpus uses **present value of annuity** formula (not SWR-based) so `expectedLifespan` actually affects the number
- LTCG tax applied to investment gains only (not full withdrawal) — 12.5% above ₹1.25L annual exemption
- City multiplier scales `monthlyExpenses` at retirement
- `onTrackAge` returns `null` if corpus never reaches target (not `MAX_AGE=100`)
- Withdrawal simulation stops emitting `corpusOverTime` entries once corpus hits 0 (early return)

## UI philosophy
- **Easy by default, complex on demand** — inputs use sliders + percentage allocation, not raw number inputs
- **Plain English everywhere** — no "corpus", "SWR", "SIP" in main output text; jargon only in tooltips
- **Indian context** — ₹, crores/lakhs formatting, 6% inflation default, 58-62 typical retirement age, EPF at 8.5%
- **Sanity hints** — every input field shows contextual advice; red flags for impossible plans (additionalSIPNeeded > income, corpus depletes at retirement, pre-return ≤ inflation)

## What NOT to do
- Don't add external UI component libraries
- Don't use pure black (`#000000`) — use `#181818`
- Don't add em dashes to UI copy
- Don't put calculation logic in components — keep it in `calculator.ts`
- Don't use `gray-*` Tailwind classes — use `zinc-*`
- TypeScript strict: always use `import type` for type-only imports

## Owner preferences
- Sonnet for implementation, Opus for planning
- Build in stages, verify each stage before next
- Ask before opening PRs or pushing to git
