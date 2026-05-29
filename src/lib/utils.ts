export function formatCurrency(amount: number): string {
  if (Math.abs(amount) >= 1e7) {
    return `₹${(amount / 1e7).toFixed(2)} Cr`
  }
  if (Math.abs(amount) >= 1e5) {
    return `₹${(amount / 1e5).toFixed(1)}L`
  }
  return `₹${Math.round(amount).toLocaleString('en-IN')}`
}

export function formatMonthly(amount: number): string {
  if (Math.abs(amount) >= 1e5) {
    return `₹${(amount / 1e5).toFixed(1)}L/mo`
  }
  return `₹${Math.round(amount).toLocaleString('en-IN')}/mo`
}
