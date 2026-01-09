/**
 * Calculates the Expected Value (EV) for a single-leg bet with a 1-unit stake.
 * EV = pWin * (payoutMultiplier - 1) - (1 - pWin)
 * @param pWin Probability of winning (0-1).
 * @param payoutMultiplier The payout multiplier (e.g., 2.0 for 2x stake back total).
 * @returns Expected Value.
 */
export function expectedValueSingle(pWin: number, payoutMultiplier: number): number {
  if (typeof pWin !== 'number' || isNaN(pWin) || pWin < 0 || pWin > 1 ||
      typeof payoutMultiplier !== 'number' || isNaN(payoutMultiplier) || payoutMultiplier < 0) {
    return NaN;
  }
  return pWin * (payoutMultiplier - 1) - (1 - pWin);
}

/**
 * Calculates the Return To Player (RTP) for a single-leg bet.
 * RTP = pWin * payoutMultiplier
 * @param pWin Probability of winning (0-1).
 * @param payoutMultiplier The payout multiplier (e.g., 2.0 for 2x stake back total).
 * @returns Return To Player as a decimal (e.g., 1.0 for 100%).
 */
export function rtpSingle(pWin: number, payoutMultiplier: number): number {
  if (typeof pWin !== 'number' || isNaN(pWin) || pWin < 0 || pWin > 1 ||
      typeof payoutMultiplier !== 'number' || isNaN(payoutMultiplier) || payoutMultiplier < 0) {
    return NaN;
  }
  return pWin * payoutMultiplier;
}

/**
 * Calculates the win probability for a two-leg slip, assuming independence.
 * pSlip = p1 * p2
 * @param p1 Probability of winning leg 1 (0-1).
 * @param p2 Probability of winning leg 2 (0-1).
 * @returns The overall slip win probability (0-1).
 */
export function slipWinProbIndependent(p1: number, p2: number): number {
  if (typeof p1 !== 'number' || isNaN(p1) || p1 < 0 || p1 > 1 ||
      typeof p2 !== 'number' || isNaN(p2) || p2 < 0 || p2 > 1) {
    return NaN;
  }
  return p1 * p2;
}

/**
 * Calculates the Expected Value (EV) for a slip with a 1-unit stake.
 * EV = pSlip * (payoutMultiplier - 1) - (1 - pSlip)
 * @param pSlip The overall win probability for the slip (0-1).
 * @param payoutMultiplier The payout multiplier for the slip.
 * @returns Expected Value.
 */
export function expectedValueSlip(pSlip: number, payoutMultiplier: number): number {
  return expectedValueSingle(pSlip, payoutMultiplier); // Reusing single-leg EV logic
}

/**
 * Calculates the Return To Player (RTP) for a slip.
 * RTP = pSlip * payoutMultiplier
 * @param pSlip The overall win probability for the slip (0-1).
 * @param payoutMultiplier The payout multiplier for the slip.
 * @returns Return To Player as a decimal.
 */
export function rtpSlip(pSlip: number, payoutMultiplier: number): number {
  return rtpSingle(pSlip, payoutMultiplier); // Reusing single-leg RTP logic
}

/**
 * Calculates the Expected Value (EV) and Return to Player (RTP) for a given slip.
 * Assumes independence between legs for MVP.
 * @param slip The Slip object containing legs with fair probabilities.
 * @param payoutConfig The PayoutConfig applicable to the slip.
 * @returns An object containing the calculated EV and RTP.
 */
export function calculateSlipEvAndRTP(slip: any, payoutConfig: any): { ev: number; rtp: number } {
  // Implementation will involve calculating probabilities for each possible outcome
  // (e.g., 2 of 3 legs win, 1 of 3 legs win) and applying payout multipliers.
  // This will be a more complex combinatorial calculation.
  // For MVP, we will start with a simpler assumption, then expand.
  return { ev: NaN, rtp: NaN }; // Placeholder
}
