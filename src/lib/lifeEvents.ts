import type { LifeEvent } from './types'

// IMPORTANT: annualCost is a real (today's-money) yearly cost.
// annualCostYears is how long that cost applies during retirement.
// Most life events have a finite duration — they don't last the full retirement.
// The calculator computes the present value over annualCostYears, not the full retirement.

export const LIFE_EVENTS: LifeEvent[] = [
  {
    id: 'one_child',
    label: '1 Child',
    description: 'Raising a child through school, college, and wedding — costs end once the child becomes financially independent',
    icon: '👶',
    costLabel: '~₹3.5L/yr for ~22 years',
    annualCost: 350000,
    annualCostYears: 22, // birth to financial independence
    corpusReduction: 0,
  },
  {
    id: 'two_children',
    label: '2 Children',
    description: 'Raising two children through school, college, and weddings',
    icon: '👶👶',
    costLabel: '~₹6L/yr for ~22 years',
    annualCost: 600000,
    annualCostYears: 22,
    corpusReduction: 0,
  },
  {
    id: 'dependent_parent',
    label: 'Dependent Parent',
    description: 'Supporting an elderly parent for ~10 years covering medical, living, and care costs',
    icon: '👴',
    costLabel: '₹1.2L/yr for 10 years + ₹3L upfront',
    annualCost: 120000,
    annualCostYears: 10, // realistic dependency window
    corpusReduction: 300000,
  },
  {
    id: 'home_purchase',
    label: 'Home Purchase',
    description: 'Down payment on a home before retirement — national average across Tier 1, 2, and 3 cities',
    icon: '🏠',
    costLabel: '₹50L one-time reduction to your savings',
    annualCost: 0,
    annualCostYears: 0,
    corpusReduction: 5000000,
  },
  {
    id: 'health_event',
    label: 'Major Health Event',
    description: 'Serious illness or surgery (cardiac, cancer, dialysis) with ongoing treatment for ~10 years',
    icon: '🏥',
    costLabel: '₹40L upfront + ₹1.5L/yr for 10 years',
    annualCost: 150000,
    annualCostYears: 10,
    corpusReduction: 4000000,
  },
  {
    id: 'job_loss',
    label: 'Job Loss / Career Break',
    description: 'Unemployment or career break of 1–2 years: missed investments, emergency expenses, and possible loan',
    icon: '💼',
    costLabel: '₹15L one-time reduction to your savings',
    annualCost: 0,
    annualCostYears: 0,
    corpusReduction: 1500000,
  },
  {
    id: 'divorce',
    label: 'Divorce / Separation',
    description: 'Legal costs, asset split, and potential alimony — significant one-time financial impact',
    icon: '⚖️',
    costLabel: '₹25L one-time reduction to your savings',
    annualCost: 0,
    annualCostYears: 0,
    corpusReduction: 2500000,
  },
  {
    id: 'disability',
    label: 'Disability / Long-term Illness',
    description: 'Permanent disability or chronic illness with ongoing care costs (15-year planning window)',
    icon: '🩼',
    costLabel: '₹20L upfront + ₹1.2L/yr for 15 years',
    annualCost: 120000,
    annualCostYears: 15,
    corpusReduction: 2000000,
  },
]
