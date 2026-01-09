import { binByProbability, brierScore, summaryStats, filterBySegments } from '@/lib/calibration';

type Item = {
  p: number;
  y: number;
  source?: string;
  createdAt?: Date;
};

const sampleItems: Item[] = [
  { p: 0.1, y: 0, source: 'singleOdds', createdAt: new Date() },
  { p: 0.2, y: 0, source: 'devigPair', createdAt: new Date() },
  { p: 0.3, y: 1, source: 'override', createdAt: new Date() },
  { p: 0.7, y: 1, source: 'devigPair', createdAt: new Date() },
  { p: 0.9, y: 1, source: 'override', createdAt: new Date() },
];

describe('binByProbability', () => {
  test('bins probabilities and computes averages and deltas', () => {
    const bins = [0, 0.25, 0.5, 0.75, 1.0];
    const result = binByProbability(
      sampleItems,
      i => i.p,
      i => i.y,
      bins,
    );
    expect(result).toHaveLength(4);
    const bin1 = result[0]; // 0-0.25: items with p 0.1 and 0.2
    expect(bin1.count).toBe(2);
    expect(bin1.avgPredicted).toBeCloseTo((0.1 + 0.2) / 2);
    expect(bin1.hitRate).toBeCloseTo(0); // both misses
    const bin3 = result[2]; // 0.5-0.75: item with p 0.7 hit
    expect(bin3.count).toBe(1);
    expect(bin3.hitRate).toBeCloseTo(1);
  });

  test('returns null metrics for empty bins', () => {
    const bins = [0, 0.5, 1.0];
    const result = binByProbability([], i => i.p, i => i.y, bins);
    expect(result[0].count).toBe(0);
    expect(result[0].avgPredicted).toBeNull();
  });
});

describe('brierScore', () => {
  test('computes mean squared error', () => {
    const items: Item[] = [
      { p: 0.2, y: 0 },
      { p: 0.8, y: 1 },
    ];
    const score = brierScore(items, i => i.p, i => i.y);
    const expected = ((0.2 - 0) ** 2 + (0.8 - 1) ** 2) / 2;
    expect(score).toBeCloseTo(expected);
  });

  test('returns null when no valid items', () => {
    const score = brierScore([], i => i.p, i => i.y);
    expect(score).toBeNull();
  });
});

describe('summaryStats', () => {
  test('computes hit rate, avg predicted, delta, brier', () => {
    const stats = summaryStats(sampleItems, i => i.p, i => i.y);
    expect(stats.count).toBe(sampleItems.length);
    expect(stats.hitRate).toBeCloseTo(3 / 5);
    expect(stats.avgPredicted).toBeCloseTo((0.1 + 0.2 + 0.3 + 0.7 + 0.9) / 5);
    expect(stats.delta).toBeCloseTo((3 / 5) - ((0.1 + 0.2 + 0.3 + 0.7 + 0.9) / 5));
    expect(stats.brier).not.toBeNull();
  });

  test('handles empty input', () => {
    const stats = summaryStats([], i => i.p, i => i.y);
    expect(stats.count).toBe(0);
    expect(stats.hitRate).toBeNull();
    expect(stats.brier).toBeNull();
  });
});

describe('filterBySegments', () => {
  test('filters by source', () => {
    const filtered = filterBySegments(
      sampleItems,
      i => i.source,
      i => i.createdAt,
      { source: 'devigPair' },
    );
    expect(filtered.every(i => i.source === 'devigPair')).toBe(true);
  });

  test('filters by date range', () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 40);
    const items: Item[] = [
      { p: 0.5, y: 1, source: 'override', createdAt: new Date() },
      { p: 0.5, y: 0, source: 'override', createdAt: oldDate },
    ];
    const filtered = filterBySegments(
      items,
      i => i.source,
      i => i.createdAt,
      { dateRangeDays: 30 },
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].createdAt && filtered[0].createdAt.getTime()).toBeGreaterThan(oldDate.getTime());
  });
});
