/**
 * Constantes do sistema de investimentos
 */

// Taxa de rendimento diário fixa: 5% ao dia
export const DAILY_YIELD_PERCENTAGE = 0.05;

// Limites de investimento
export const INVESTMENT_LIMITS = {
  MIN: 50,      // R$ 50,00
  MAX: 50000,   // R$ 50.000,00
  STEP: 10,     // Incremento do slider: R$ 10,00
} as const;

// Cálculos derivados
export const MONTHLY_YIELD_PERCENTAGE = DAILY_YIELD_PERCENTAGE * 30; // 150% (1.5)
export const MONTHLY_ROI_PERCENTAGE = MONTHLY_YIELD_PERCENTAGE * 100; // 150%

/**
 * Calcula o rendimento diário baseado no valor investido
 * @param investedAmount - Valor investido em reais
 * @returns Rendimento diário em reais
 */
export function calculateDailyYield(investedAmount: number): number {
  return investedAmount * DAILY_YIELD_PERCENTAGE;
}

/**
 * Calcula o rendimento mensal baseado no valor investido
 * @param investedAmount - Valor investido em reais
 * @returns Rendimento mensal em reais (30 dias)
 */
export function calculateMonthlyYield(investedAmount: number): number {
  return calculateDailyYield(investedAmount) * 30;
}

/**
 * Calcula o ROI mensal em percentual
 * @param investedAmount - Valor investido em reais
 * @returns ROI mensal em percentual (sempre 150%)
 */
export function calculateMonthlyROI(investedAmount: number): number {
  if (investedAmount <= 0) return 0;
  return (calculateMonthlyYield(investedAmount) / investedAmount) * 100;
}
