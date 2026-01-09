import {
  americanToImpliedProb,
  normalizeProbability,
  legProbability,
  devigTwoWayMarket,
  legProbabilityWithDevig,
} from '@/lib/math/odds';

describe('americanToImpliedProb', () => {
  test('should return 0.5 for +100 odds', () => {
    expect(americanToImpliedProb(100)).toBeCloseTo(0.5);
  });

  test('should return approximately 0.2857 for +250 odds', () => {
    expect(americanToImpliedProb(250)).toBeCloseTo(100 / (250 + 100));
  });

  test('should return approximately 0.5238 for -110 odds', () => {
    expect(americanToImpliedProb(-110)).toBeCloseTo(110 / (110 + 100));
  });

  test('should return approximately 0.7674 for -330 odds', () => {
    expect(americanToImpliedProb(-330)).toBeCloseTo(330 / (330 + 100));
  });

  test('should return NaN for 0 odds', () => {
    expect(americanToImpliedProb(0)).toBeNaN();
  });

  test('should return NaN for NaN input', () => {
    expect(americanToImpliedProb(NaN)).toBeNaN();
  });

  test('should handle very large positive odds', () => {
    expect(americanToImpliedProb(Number.MAX_SAFE_INTEGER)).toBeCloseTo(100 / (Number.MAX_SAFE_INTEGER + 100));
  });

  test('should handle very large negative odds', () => {
    expect(americanToImpliedProb(Number.MIN_SAFE_INTEGER)).toBeCloseTo(
      Math.abs(Number.MIN_SAFE_INTEGER) / (Math.abs(Number.MIN_SAFE_INTEGER) + 100),
    );
  });
});

describe('normalizeProbability', () => {
  test('should return the same value for probabilities between 0 and 1', () => {
    expect(normalizeProbability(0.5)).toBeCloseTo(0.5);
    expect(normalizeProbability(0)).toBeCloseTo(0);
    expect(normalizeProbability(1)).toBeCloseTo(1);
  });

  test('should clamp values less than 0 to 0', () => {
    expect(normalizeProbability(-0.1)).toBeCloseTo(0);
    expect(normalizeProbability(-100)).toBeCloseTo(0);
  });

  test('should clamp values greater than 1 to 1', () => {
    expect(normalizeProbability(1.1)).toBeCloseTo(1);
    expect(normalizeProbability(100)).toBeCloseTo(1);
  });

  test('should return NaN for NaN input', () => {
    expect(normalizeProbability(NaN)).toBeNaN();
  });

  test('should return NaN for non-numeric input', () => {
    expect(normalizeProbability(parseFloat('abc'))).toBeNaN();
  });
});

describe('legProbability', () => {
  test('should prefer direct probability if both are provided', () => {
    expect(legProbability({ americanOdds: -110, probability: 0.6 })).toBeCloseTo(0.6);
  });

  test('should calculate from americanOdds if probability is not provided', () => {
    expect(legProbability({ americanOdds: -110 })).toBeCloseTo(0.5238095238);
  });

  test('should return NaN if no valid input is provided', () => {
    expect(legProbability({})).toBeNaN();
    expect(legProbability({ americanOdds: NaN })).toBeNaN();
    expect(legProbability({ probability: NaN })).toBeNaN();
  });

  test('should return NaN for invalid American odds', () => {
    expect(legProbability({ americanOdds: 0 })).toBeNaN();
  });

  test('should normalize direct probability input', () => {
    expect(legProbability({ probability: 1.5 })).toBeCloseTo(1);
    expect(legProbability({ probability: -0.5 })).toBeCloseTo(0);
  });
});

describe('devigTwoWayMarket', () => {
  test('should correctly de-vig a symmetric market (-110/-110)', () => {
    const pOverImp = americanToImpliedProb(-110);
    const pUnderImp = americanToImpliedProb(-110);
    const result = devigTwoWayMarket(pOverImp, pUnderImp);

    expect(result.overround).toBeCloseTo(0.0476, 4);
    expect(result.vigPercent).toBeCloseTo(4.76, 2);
    expect(result.pOverFair).toBeCloseTo(0.5);
    expect(result.pUnderFair).toBeCloseTo(0.5);
  });

  test('should correctly de-vig a lopsided market (over -330 under +250)', () => {
    const pOverImp = americanToImpliedProb(-330);
    const pUnderImp = americanToImpliedProb(250);
    const result = devigTwoWayMarket(pOverImp, pUnderImp);

    // Values computed from implied probs; we assert properties + close approximations
    expect(result.overround).toBeCloseTo(pOverImp + pUnderImp - 1, 10);
    expect(result.vigPercent).toBeCloseTo((pOverImp + pUnderImp - 1) * 100, 10);
    expect(result.pOverFair + result.pUnderFair).toBeCloseTo(1.0, 10);
    expect(result.pOverFair).toBeCloseTo(pOverImp / (pOverImp + pUnderImp), 10);
    expect(result.pUnderFair).toBeCloseTo(pUnderImp / (pOverImp + pUnderImp), 10);
    expect(result.pOverFair + result.pUnderFair).toBeCloseTo(1.0);
  });

  test('should return NaN for invalid implied probabilities', () => {
    const result1 = devigTwoWayMarket(NaN, 0.5);
    expect(result1.pOverFair).toBeNaN();
    expect(result1.pUnderFair).toBeNaN();

    const result2 = devigTwoWayMarket(0.5, NaN);
    expect(result2.pOverFair).toBeNaN();
    expect(result2.pUnderFair).toBeNaN();
  });

  test('should return NaN for sum of implied probabilities being 0', () => {
    const result = devigTwoWayMarket(0, 0);
    expect(result.pOverFair).toBeNaN();
    expect(result.pUnderFair).toBeNaN();
  });

  test('should return NaN for implied probabilities out of 0-1 range', () => {
    const result1 = devigTwoWayMarket(-0.1, 0.5);
    expect(result1.pOverFair).toBeNaN();
    expect(result1.pUnderFair).toBeNaN();

    const result2 = devigTwoWayMarket(1.1, 0.5);
    expect(result2.pOverFair).toBeNaN();
    expect(result2.pUnderFair).toBeNaN();
  });
});

describe('legProbabilityWithDevig', () => {
  test('should prefer probabilityOverride if valid', () => {
    const result = legProbabilityWithDevig({
      side: 'over',
      probabilityOverride: '0.75',
      americanOddsSingle: '-110',
      overOdds: '-120',
      underOdds: '100',
    });
    expect(result.pChosen).toBeCloseTo(0.75);
    expect(result.source).toBe('override');
  });

  test('should normalize probabilityOverride', () => {
    const result1 = legProbabilityWithDevig({ side: 'over', probabilityOverride: '1.5' });
    expect(result1.pChosen).toBeCloseTo(1);

    const result2 = legProbabilityWithDevig({ side: 'over', probabilityOverride: '-0.5' });
    expect(result2.pChosen).toBeCloseTo(0);
  });

  test('should use devigPair if no valid probabilityOverride', () => {
    const result = legProbabilityWithDevig({
      side: 'over',
      americanOddsSingle: '-110',
      overOdds: '-120',
      underOdds: '100',
    });
    expect(result.pChosen).toBeCloseTo(0.5454545454545454 / (0.5454545454545454 + 0.5));
    expect(result.source).toBe('devigPair');
    expect(result.vigPercent).toBeCloseTo(4.545, 3);
  });

  test('should fall back to americanOddsSingle if no valid devigPair', () => {
    const result = legProbabilityWithDevig({
      side: 'over',
      americanOddsSingle: '-110',
      overOdds: '-120', // only one side provided, so invalid devigPair
    });
    expect(result.pChosen).toBeCloseTo(americanToImpliedProb(-110));
    expect(result.source).toBe('singleOdds');
  });

  test('should return error if no valid input is provided', () => {
    const result = legProbabilityWithDevig({ side: 'over' });
    expect(result.pChosen).toBeNull();
    expect(result.error).toBeDefined();
    expect(result.source).toBe('singleOdds');
  });

  test('should handle invalid odds formats in devigPair', () => {
    const result = legProbabilityWithDevig({
      side: 'over',
      overOdds: 'abc',
      underOdds: '100',
    });
    expect(result.pChosen).toBeNull();
    expect(result.error).toBe('Invalid Over/Under odds format.');
    expect(result.source).toBe('devigPair');
  });

  test('should handle invalid odds formats in americanOddsSingle', () => {
    const result = legProbabilityWithDevig({
      side: 'over',
      americanOddsSingle: 'abc',
    });
    expect(result.pChosen).toBeNull();
    expect(result.error).toBe('Invalid single American odds format.');
    expect(result.source).toBe('singleOdds');
  });
});

