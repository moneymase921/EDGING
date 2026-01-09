import { expectedValueSingle, rtpSingle, slipWinProbIndependent, expectedValueSlip, rtpSlip } from '@/lib/math/slip';

describe('expectedValueSingle', () => {
  // Break-even cases
  test('should return 0 for pWin 0.5 and payoutMultiplier 2.0', () => {
    expect(expectedValueSingle(0.5, 2.0)).toBeCloseTo(0);
  });

  // Positive EV
  test('should return positive EV for pWin 0.6 and payoutMultiplier 2.0', () => {
    expect(expectedValueSingle(0.6, 2.0)).toBeCloseTo(0.2);
  });

  // Negative EV
  test('should return negative EV for pWin 0.4 and payoutMultiplier 2.0', () => {
    expect(expectedValueSingle(0.4, 2.0)).toBeCloseTo(-0.2);
  });

  // Varying payout multipliers
  test('should return positive EV for pWin 0.5 and payoutMultiplier 2.25', () => {
    expect(expectedValueSingle(0.5, 2.25)).toBeCloseTo(0.125);
  });

  // Edge Cases / Invalid Inputs
  test('should return NaN for pWin less than 0', () => {
    expect(expectedValueSingle(-0.1, 2.0)).toBeNaN();
  });

  test('should return NaN for pWin greater than 1', () => {
    expect(expectedValueSingle(1.1, 2.0)).toBeNaN();
  });

  test('should return NaN for payoutMultiplier less than 0', () => {
    expect(expectedValueSingle(0.5, -1.0)).toBeNaN();
  });

  test('should return NaN for NaN pWin input', () => {
    expect(expectedValueSingle(NaN, 2.0)).toBeNaN();
  });

  test('should return NaN for NaN payoutMultiplier input', () => {
    expect(expectedValueSingle(0.5, NaN)).toBeNaN();
  });
});

describe('rtpSingle', () => {
  // Break-even cases
  test('should return 1.0 for pWin 0.5 and payoutMultiplier 2.0', () => {
    expect(rtpSingle(0.5, 2.0)).toBeCloseTo(1.0);
  });

  // Positive RTP
  test('should return positive RTP for pWin 0.6 and payoutMultiplier 2.0', () => {
    expect(rtpSingle(0.6, 2.0)).toBeCloseTo(1.2);
  });

  // Negative RTP (not possible with valid inputs, but testing logic)
  test('should return RTP < 1.0 for pWin 0.4 and payoutMultiplier 2.0', () => {
    expect(rtpSingle(0.4, 2.0)).toBeCloseTo(0.8);
  });

  // Varying payout multipliers
  test('should return RTP > 1.0 for pWin 0.5 and payoutMultiplier 2.25', () => {
    expect(rtpSingle(0.5, 2.25)).toBeCloseTo(1.125);
  });

  // Edge Cases / Invalid Inputs
  test('should return NaN for pWin less than 0', () => {
    expect(rtpSingle(-0.1, 2.0)).toBeNaN();
  });

  test('should return NaN for pWin greater than 1', () => {
    expect(rtpSingle(1.1, 2.0)).toBeNaN();
  });

  test('should return NaN for payoutMultiplier less than 0', () => {
    expect(rtpSingle(0.5, -1.0)).toBeNaN();
  });

  test('should return NaN for NaN pWin input', () => {
    expect(rtpSingle(NaN, 2.0)).toBeNaN();
  });

  test('should return NaN for NaN payoutMultiplier input', () => {
    expect(rtpSingle(0.5, NaN)).toBeNaN();
  });
});

describe('slipWinProbIndependent', () => {
  test('should calculate p1 * p2 correctly', () => {
    expect(slipWinProbIndependent(0.5, 0.5)).toBeCloseTo(0.25);
    expect(slipWinProbIndependent(0.6, 0.7)).toBeCloseTo(0.42);
  });

  test('should return NaN for p1 less than 0', () => {
    expect(slipWinProbIndependent(-0.1, 0.5)).toBeNaN();
  });

  test('should return NaN for p1 greater than 1', () => {
    expect(slipWinProbIndependent(1.1, 0.5)).toBeNaN();
  });

  test('should return NaN for p2 less than 0', () => {
    expect(slipWinProbIndependent(0.5, -0.1)).toBeNaN();
  });

  test('should return NaN for p2 greater than 1', () => {
    expect(slipWinProbIndependent(0.5, 1.1)).toBeNaN();
  });

  test('should return NaN for NaN p1 input', () => {
    expect(slipWinProbIndependent(NaN, 0.5)).toBeNaN();
  });

  test('should return NaN for NaN p2 input', () => {
    expect(slipWinProbIndependent(0.5, NaN)).toBeNaN();
  });
});

describe('expectedValueSlip', () => {
  test('should behave identically to expectedValueSingle with valid pSlip', () => {
    expect(expectedValueSlip(0.25, 2.0)).toBeCloseTo(expectedValueSingle(0.25, 2.0));
    expect(expectedValueSlip(0.6, 2.25)).toBeCloseTo(expectedValueSingle(0.6, 2.25));
  });

  test('should return NaN for NaN pSlip input', () => {
    expect(expectedValueSlip(NaN, 2.0)).toBeNaN();
  });

  test('should return NaN for invalid payoutMultiplier', () => {
    expect(expectedValueSlip(0.5, -1.0)).toBeNaN();
  });
});

describe('rtpSlip', () => {
  test('should behave identically to rtpSingle with valid pSlip', () => {
    expect(rtpSlip(0.25, 2.0)).toBeCloseTo(rtpSingle(0.25, 2.0));
    expect(rtpSlip(0.6, 2.25)).toBeCloseTo(rtpSingle(0.6, 2.25));
  });

  test('should return NaN for NaN pSlip input', () => {
    expect(rtpSlip(NaN, 2.0)).toBeNaN();
  });

  test('should return NaN for invalid payoutMultiplier', () => {
    expect(rtpSlip(0.5, -1.0)).toBeNaN();
  });
});
