/**
 * Normalizes a probability to be between 0 and 1.
 * If input is outside this range, it will be clamped.
 * @param prob The probability input.
 * @returns Normalized probability (0-1).
 */
export function normalizeProbability(prob: number): number {
  if (typeof prob !== 'number' || isNaN(prob)) {
    return NaN;
  }
  return Math.max(0, Math.min(1, prob));
}

/**
 * Calculates the probability for a single leg, preferring direct probability over American odds.
 * @param input An object containing either americanOdds or probability.
 * @returns The calculated probability (0-1), or NaN for invalid input.
 */
export function legProbability(input: { americanOdds?: number; probability?: number }): number {
  if (typeof input.probability === 'number' && !isNaN(input.probability)) {
    return normalizeProbability(input.probability);
  } else if (typeof input.americanOdds === 'number' && !isNaN(input.americanOdds)) {
    return americanToImpliedProb(input.americanOdds);
  }
  return NaN;
}

/**
 * Calculates overround, vig percentage, and de-vigged fair probabilities for a two-way market.
 * @param pOverImp Implied probability for the 'Over' side (0-1).
 * @param pUnderImp Implied probability for the 'Under' side (0-1).
 * @returns An object containing overround, vigPercent, pOverFair, and pUnderFair, or NaN for invalid inputs.
 */
export function devigTwoWayMarket(pOverImp: number, pUnderImp: number): {
  overround: number;
  vigPercent: number;
  pOverFair: number;
  pUnderFair: number;
} {
  if (typeof pOverImp !== 'number' || isNaN(pOverImp) || pOverImp < 0 || pOverImp > 1 ||
      typeof pUnderImp !== 'number' || isNaN(pUnderImp) || pUnderImp < 0 || pUnderImp > 1) {
    return { overround: NaN, vigPercent: NaN, pOverFair: NaN, pUnderFair: NaN };
  }

  const overround = pOverImp + pUnderImp - 1;
  const vigPercent = overround * 100;

  // If both implied probabilities sum to 0 (e.g., both are 0), fair probabilities are undefined.
  // Also if overround is <= -1, the implied probabilities are nonsensical for de-vigging.
  if ((pOverImp + pUnderImp) === 0 || overround <= -1) {
    return { overround, vigPercent, pOverFair: NaN, pUnderFair: NaN };
  }

  const sumP = pOverImp + pUnderImp;
  const pOverFair = pOverImp / sumP;
  const pUnderFair = pUnderImp / sumP;

  return { overround, vigPercent, pOverFair, pUnderFair };
}

/**
 * Converts American odds to implied probability.
 * @param odds American odds (e.g., -110, +150).
 * @returns Implied probability as a decimal (0-1), or NaN for invalid input.
 */
export function americanToImpliedProb(odds: number): number {
  if (typeof odds !== 'number' || isNaN(odds) || odds === 0) {
    return NaN; // Handle invalid or zero odds
  }

  if (odds > 0) {
    return 100 / (odds + 100);
  } else {
    return Math.abs(odds) / (Math.abs(odds) + 100);
  }
}

/**
 * Calculates the probability for a single leg with de-vigging logic.
 * Precedence: probabilityOverride > devigPair > americanOddsSingle.
 * @param input Object containing side, optional odds/probability inputs.
 * @returns Object with pChosen, pImp, pFair, vigPercent, source, and error if any.
 */
export function legProbabilityWithDevig({
  side,
  americanOddsSingle,
  probabilityOverride,
  overOdds,
  underOdds,
}: {
  side: 'over' | 'under';
  americanOddsSingle?: string;
  probabilityOverride?: string;
  overOdds?: string;
  underOdds?: string;
}): { pChosen: number | null; pImp?: number; pFair?: number; vigPercent?: number; source: "override" | "singleOdds" | "devigPair"; error?: string } {
  // 1. Check for probabilityOverride
  const parsedProbabilityOverride = parseFloat(probabilityOverride || '');
  if (probabilityOverride !== undefined && probabilityOverride !== '') {
    if (isNaN(parsedProbabilityOverride)) {
      // If user typed something non-numeric, treat as invalid override and continue to other inputs
    } else {
      return { pChosen: normalizeProbability(parsedProbabilityOverride), source: "override" };
    }
  }

  // 2. Check for devigPair (overOdds and underOdds)
  const parsedOverOdds = parseFloat(overOdds || '');
  const parsedUnderOdds = parseFloat(underOdds || '');

  // If user provided both sides but one/both are non-numeric, surface a devigPair format error
  if ((overOdds !== undefined && overOdds !== '') && (underOdds !== undefined && underOdds !== '') && (isNaN(parsedOverOdds) || isNaN(parsedUnderOdds))) {
    return { pChosen: null, source: "devigPair", error: "Invalid Over/Under odds format." };
  }

  if (!isNaN(parsedOverOdds) && !isNaN(parsedUnderOdds) && overOdds !== '' && underOdds !== '') {
    const pOverImp = americanToImpliedProb(parsedOverOdds);
    const pUnderImp = americanToImpliedProb(parsedUnderOdds);

    if (isNaN(pOverImp) || isNaN(pUnderImp)) {
      return { pChosen: null, source: "devigPair", error: "Invalid Over/Under odds format." };
    }

    const devigged = devigTwoWayMarket(pOverImp, pUnderImp);
    if (isNaN(devigged.pOverFair) || isNaN(devigged.pUnderFair)) {
      return { pChosen: null, source: "devigPair", error: "Cannot calculate fair probability from provided odds." };
    }

    const pChosen = side === 'over' ? devigged.pOverFair : devigged.pUnderFair;
    return {
      pChosen: pChosen,
      pImp: side === 'over' ? pOverImp : pUnderImp,
      pFair: pChosen,
      vigPercent: devigged.vigPercent,
      source: "devigPair",
    };
  }

  // 3. Check for americanOddsSingle
  const parsedAmericanOddsSingle = parseFloat(americanOddsSingle || '');
  if (americanOddsSingle !== undefined && americanOddsSingle !== '') {
    if (isNaN(parsedAmericanOddsSingle)) {
      return { pChosen: null, source: "singleOdds", error: "Invalid single American odds format." };
    }
    const pImp = americanToImpliedProb(parsedAmericanOddsSingle);
    if (isNaN(pImp)) {
      return { pChosen: null, source: "singleOdds", error: "Invalid single American odds format." };
    }
    return { pChosen: pImp, pImp: pImp, source: "singleOdds" };
  }

  // 4. No valid input
  return { pChosen: null, source: "singleOdds", error: "No valid probability input provided." };
}
