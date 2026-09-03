const formatter = new Intl.NumberFormat("en-LK", {
  style: "currency",
  currency: "LKR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatLKR(amount: number): string {
  return formatter.format(amount);
}
