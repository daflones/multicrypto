/**
 * Constantes do sistema de investimentos
 * 
 * REGRAS:
 * - Duração: 60 dias
 * - Rendimento: 5% ao dia
 * - Limite máximo: 300% do capital investido
 * - Finalização automática ao atingir 300%
 */

// Taxa de rendimento diário fixa: 5% ao dia
export const DAILY_YIELD_PERCENTAGE = 0.05;

// Duração e limites do investimento
export const INVESTMENT_DURATION_DAYS = 60;
export const MAX_TOTAL_RETURN_PERCENTAGE = 3.0; // 300% do capital

// Limites de investimento
export const INVESTMENT_LIMITS = {
  MIN: 50,      // R$ 50,00
  MAX: 50000,   // R$ 50.000,00
  STEP: 10,     // Incremento do slider: R$ 10,00
} as const;

/**
 * Calcula o rendimento diário baseado no valor investido
 * @param investedAmount - Valor investido em reais
 * @returns Rendimento diário em reais
 */
export function calculateDailyYield(investedAmount: number): number {
  return investedAmount * DAILY_YIELD_PERCENTAGE;
}

/**
 * Calcula o rendimento total em 60 dias (limitado a 300%)
 * @param investedAmount - Valor investido em reais
 * @returns Rendimento total em reais (máximo 300% do capital)
 */
export function calculateTotalYield(investedAmount: number): number {
  const maxReturn = investedAmount * MAX_TOTAL_RETURN_PERCENTAGE;
  const dailyYield = calculateDailyYield(investedAmount);
  const totalIn60Days = dailyYield * INVESTMENT_DURATION_DAYS;
  
  // Retorna o menor valor: rendimento em 60 dias ou limite de 300%
  return Math.min(totalIn60Days, maxReturn);
}

/**
 * Calcula quantos dias são necessários para atingir 300%
 * @param investedAmount - Valor investido em reais
 * @returns Número de dias para atingir o limite de 300%
 */
export function calculateDaysToMaxReturn(investedAmount: number): number {
  const dailyYield = calculateDailyYield(investedAmount);
  const maxReturn = investedAmount * MAX_TOTAL_RETURN_PERCENTAGE;
  
  return Math.ceil(maxReturn / dailyYield);
}

/**
 * Calcula o ROI total do investimento (sempre 300%)
 * @param investedAmount - Valor investido em reais
 * @returns ROI total em percentual (300%)
 */
export function calculateTotalROI(investedAmount: number): number {
  if (investedAmount <= 0) return 0;
  return MAX_TOTAL_RETURN_PERCENTAGE * 100; // 300%
}

/**
 * Calcula o ROI mensal baseado na duração real
 * @param investedAmount - Valor investido em reais
 * @returns ROI mensal em percentual
 */
export function calculateMonthlyROI(investedAmount: number): number {
  if (investedAmount <= 0) return 0;
  
  const daysToComplete = calculateDaysToMaxReturn(investedAmount);
  const totalROI = calculateTotalROI(investedAmount);
  
  // ROI mensal = (ROI total / dias para completar) * 30
  return (totalROI / daysToComplete) * 30;
}
