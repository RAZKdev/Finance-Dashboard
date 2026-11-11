/**
 * Format currency number to Indonesian Rupiah (IDR) format.
 * Example: 28389980 -> "Rp 28.389.980"
 */
export function formatRupiah(amount: number, withPrefix = true): string {
  if (isNaN(amount) || !isFinite(amount)) {
    return withPrefix ? 'Rp 0' : '0';
  }
  const rounded = Math.round(amount);
  const formatted = rounded.toLocaleString('id-ID');
  return withPrefix ? `Rp ${formatted}` : formatted;
}

/**
 * Format compact Rupiah for tight spaces or charts.
 * Example: 18500000 -> "Rp 18,5 Jt"
 */
export function formatCompactRupiah(amount: number): string {
  if (isNaN(amount) || !isFinite(amount)) return 'Rp 0';
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (abs >= 1_000_000_000) {
    const val = (abs / 1_000_000_000).toFixed(1).replace('.0', '').replace('.', ',');
    return `${sign}Rp ${val} Miliar`;
  }
  if (abs >= 1_000_000) {
    const val = (abs / 1_000_000).toFixed(1).replace('.0', '').replace('.', ',');
    return `${sign}Rp ${val} Jt`;
  }
  if (abs >= 1_000) {
    const val = (abs / 1_000).toFixed(0);
    return `${sign}Rp ${val} Rb`;
  }
  return `${sign}Rp ${Math.round(abs).toLocaleString('id-ID')}`;
}
