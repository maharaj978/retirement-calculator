export interface RetirementCity {
  id: string
  label: string
  tier: 'tier1' | 'tier2' | 'tier3'
  costMultiplier: number // relative to a baseline mid-range lifestyle
  exampleMonthly: number // approx ₹/month for a comfortable retired couple
  description: string
  examples: string // comma-separated city names shown in UI
}

export const RETIREMENT_CITIES: RetirementCity[] = [
  // Tier 1: high cost, city-specific
  {
    id: 'mumbai',
    label: 'Mumbai',
    tier: 'tier1',
    costMultiplier: 1.45,
    exampleMonthly: 120000,
    description: 'Most expensive city. High rent, premium services, transport.',
    examples: 'Bandra, Powai, Andheri',
  },
  {
    id: 'delhi',
    label: 'Delhi / NCR',
    tier: 'tier1',
    costMultiplier: 1.30,
    exampleMonthly: 105000,
    description: 'High cost, especially in south Delhi and Gurugram.',
    examples: 'South Delhi, Gurugram, Noida',
  },
  {
    id: 'bangalore',
    label: 'Bangalore',
    tier: 'tier1',
    costMultiplier: 1.25,
    exampleMonthly: 100000,
    description: 'High rent and dining. Relatively affordable vs Mumbai/Delhi.',
    examples: 'Indiranagar, Koramangala, Whitefield',
  },
  {
    id: 'chennai',
    label: 'Chennai',
    tier: 'tier1',
    costMultiplier: 1.15,
    exampleMonthly: 90000,
    description: 'Cheaper than Bangalore. Good healthcare, moderate lifestyle costs.',
    examples: 'Anna Nagar, Adyar, OMR',
  },
  {
    id: 'hyderabad',
    label: 'Hyderabad',
    tier: 'tier1',
    costMultiplier: 1.15,
    exampleMonthly: 90000,
    description: 'Among the most affordable Tier 1 cities. Low property prices.',
    examples: 'Banjara Hills, Gachibowli, Jubilee Hills',
  },
  {
    id: 'pune',
    label: 'Pune',
    tier: 'tier1',
    costMultiplier: 1.10,
    exampleMonthly: 85000,
    description: 'Pleasant climate, good hospitals, slightly lower costs than Bangalore.',
    examples: 'Koregaon Park, Aundh, Wakad',
  },
  // Tier 2
  {
    id: 'tier2',
    label: 'Tier 2 City',
    tier: 'tier2',
    costMultiplier: 0.75,
    exampleMonthly: 60000,
    description: 'Comfortable lifestyle at significantly lower cost. Good connectivity.',
    examples: 'Jaipur, Kochi, Chandigarh, Indore, Nagpur, Coimbatore',
  },
  // Tier 3
  {
    id: 'tier3',
    label: 'Tier 3 / Town',
    tier: 'tier3',
    costMultiplier: 0.50,
    exampleMonthly: 40000,
    description: 'Minimal cost of living. Best for those with family or property there.',
    examples: 'Mysuru, Udaipur, Pondicherry, Aligarh, smaller towns',
  },
]

export const DEFAULT_CITY_ID = 'bangalore'

export function getCityById(id: string): RetirementCity {
  return RETIREMENT_CITIES.find((c) => c.id === id) ?? RETIREMENT_CITIES.find((c) => c.id === DEFAULT_CITY_ID)!
}
