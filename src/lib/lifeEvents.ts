import type { LifeEvent } from './types'

export const LIFE_EVENTS: LifeEvent[] = [
  {
    id: 'one_child',
    label: '1 Child',
    description: 'Raising a child through school + college + wedding',
    icon: '👶',
    costLabel: '~₹2.2L/yr added to retirement number',
    extraAnnualCost: () => 220000,
    corpusReduction: () => 0,
  },
  {
    id: 'two_children',
    label: '2 Children',
    description: 'Raising two children through school + college + weddings',
    icon: '👶👶',
    costLabel: '~₹3.5L/yr added to retirement number',
    extraAnnualCost: () => 350000,
    corpusReduction: () => 0,
  },
  {
    id: 'dependent_parent',
    label: 'Dependent Parent',
    description: 'Supporting an elderly parent for ~5 years (medical + living)',
    icon: '👴',
    costLabel: '~₹6L total (5 yrs × ₹1.2L), spread across retirement',
    extraAnnualCost: (_currentAge: number, retirementAge: number) => {
      const retirementYears = Math.max(100 - retirementAge, 1)
      return 600000 / retirementYears
    },
    corpusReduction: () => 0,
  },
  {
    id: 'home_purchase',
    label: 'Home Purchase',
    description: 'Down payment or full purchase of a home before retirement',
    icon: '🏠',
    costLabel: '₹50L one-time reduction to your savings',
    extraAnnualCost: () => 0,
    corpusReduction: () => 5000000,
  },
  {
    id: 'health_event',
    label: 'Major Health Event',
    description: 'Serious illness or surgery (self or spouse): e.g. cardiac, cancer, dialysis at a good hospital',
    icon: '🏥',
    costLabel: '₹40L upfront + ₹1.5L/yr ongoing care',
    extraAnnualCost: () => 150000,
    corpusReduction: () => 4000000,
  },
  {
    id: 'job_loss',
    label: 'Job Loss / Career Break',
    description: 'Unexpected unemployment or career break of 1–2 years: gap in SIP + emergency fund drain',
    icon: '💼',
    costLabel: '₹10L corpus reduction (savings gap + emergency spend)',
    extraAnnualCost: () => 0,
    corpusReduction: () => 1000000,
  },
  {
    id: 'divorce',
    label: 'Divorce / Separation',
    description: 'Legal costs, asset split, and potential alimony: significant one-time financial impact',
    icon: '⚖️',
    costLabel: '₹25L one-time reduction to your corpus',
    extraAnnualCost: () => 0,
    corpusReduction: () => 2500000,
  },
  {
    id: 'disability',
    label: 'Disability / Long-term Illness',
    description: 'Permanent disability or chronic illness reducing earning ability and adding care costs',
    icon: '🩼',
    costLabel: '₹20L corpus reduction + ₹1.2L/yr care expenses',
    extraAnnualCost: (_currentAge: number, retirementAge: number) => {
      const retirementYears = Math.max(100 - retirementAge, 1)
      return 1200000 / retirementYears
    },
    corpusReduction: () => 2000000,
  },
]
