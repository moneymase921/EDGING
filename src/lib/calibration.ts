export type BinResult = {
  rangeLabel: string;
  count: number;
  avgPredicted: number | null;
  hitRate: number | null;
  delta: number | null; // hitRate - avgPredicted
};

export type SummaryStats = {
  count: number;
  hitRate: number | null;
  avgPredicted: number | null;
  delta: number | null;
  brier: number | null;
};

export type SegmentFilterOptions = {
  source?: string;
  dateRangeDays?: 7 | 30 | 90;
};

const defaultBins = Array.from({ length: 21 }, (_, i) => i * 0.05); // 0.00 to 1.00 step 0.05

export function binByProbability<T>(
  items: T[],
  getP: (item: T) => number | null | undefined,
  getY: (item: T) => number | null | undefined,
  bins: number[] = defaultBins,
): BinResult[] {
  if (bins.length < 2) {
    throw new Error('bins must have at least two edges');
  }

  const binResults: { sumP: number; sumY: number; count: number; label: string }[] = [];
  for (let i = 0; i < bins.length - 1; i++) {
    const low = bins[i];
    const high = bins[i + 1];
    const label = `${low.toFixed(2)}–${high.toFixed(2)}`;
    binResults.push({ sumP: 0, sumY: 0, count: 0, label });
  }

  items.forEach(item => {
    const p = getP(item);
    const y = getY(item);
    if (p === null || p === undefined || Number.isNaN(p) || y === null || y === undefined || Number.isNaN(y)) {
      return;
    }
    // Clamp p into [0,1]
    const pClamped = Math.max(0, Math.min(1, p));
    const yClamped = y <= 0 ? 0 : 1;

    // Find bin
    for (let i = 0; i < bins.length - 1; i++) {
      const low = bins[i];
      const high = bins[i + 1];
      const inBin = i === bins.length - 2 ? pClamped >= low && pClamped <= high : pClamped >= low && pClamped < high;
      if (inBin) {
        binResults[i].sumP += pClamped;
        binResults[i].sumY += yClamped;
        binResults[i].count += 1;
        break;
      }
    }
  });

  return binResults.map(bin => {
    if (bin.count === 0) {
      return { rangeLabel: bin.label, count: 0, avgPredicted: null, hitRate: null, delta: null };
    }
    const avgPred = bin.sumP / bin.count;
    const hitRate = bin.sumY / bin.count;
    return {
      rangeLabel: bin.label,
      count: bin.count,
      avgPredicted: avgPred,
      hitRate,
      delta: hitRate - avgPred,
    };
  });
}

export function brierScore<T>(items: T[], getP: (item: T) => number | null | undefined, getY: (item: T) => number | null | undefined): number | null {
  if (items.length === 0) return null;
  let sum = 0;
  let n = 0;
  for (const item of items) {
    const p = getP(item);
    const y = getY(item);
    if (p === null || p === undefined || Number.isNaN(p) || y === null || y === undefined || Number.isNaN(y)) continue;
    const pClamped = Math.max(0, Math.min(1, p));
    const yClamped = y <= 0 ? 0 : 1;
    sum += Math.pow(pClamped - yClamped, 2);
    n += 1;
  }
  return n === 0 ? null : sum / n;
}

export function summaryStats<T>(items: T[], getP: (item: T) => number | null | undefined, getY: (item: T) => number | null | undefined): SummaryStats {
  const count = items.length;
  if (count === 0) {
    return { count: 0, hitRate: null, avgPredicted: null, delta: null, brier: null };
  }
  let sumP = 0;
  let sumY = 0;
  let n = 0;
  for (const item of items) {
    const p = getP(item);
    const y = getY(item);
    if (p === null || p === undefined || Number.isNaN(p) || y === null || y === undefined || Number.isNaN(y)) continue;
    const pClamped = Math.max(0, Math.min(1, p));
    const yClamped = y <= 0 ? 0 : 1;
    sumP += pClamped;
    sumY += yClamped;
    n += 1;
  }
  if (n === 0) {
    return { count, hitRate: null, avgPredicted: null, delta: null, brier: null };
  }
  const avgPredicted = sumP / n;
  const hitRate = sumY / n;
  return {
    count,
    hitRate,
    avgPredicted,
    delta: hitRate - avgPredicted,
    brier: brierScore(items, getP, getY),
  };
}

export function filterBySegments<T>(
  items: T[],
  getSource: (item: T) => string | undefined,
  getCreatedAt: (item: T) => Date | undefined,
  options: SegmentFilterOptions,
): T[] {
  return items.filter(item => {
    const src = getSource(item);
    if (options.source && options.source !== 'all' && src !== options.source) return false;

    if (options.dateRangeDays) {
      const created = getCreatedAt(item);
      if (!created) return false;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - options.dateRangeDays);
      if (created < cutoff) return false;
    }
    return true;
  });
}
