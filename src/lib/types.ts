export type LegResult = "hit" | "miss";
export type SlipStatus = "pending" | "settled";
export type ProbabilitySource = "override" | "devigPair" | "singleOdds";

export interface LegSnapshot {
  id: string;
  description?: string; // optional, allow blank
  chosenSide: "over" | "under";
  probabilitySource: ProbabilitySource;
  pChosen: number;
  pImp?: number;
  pFair?: number;
  vigPercent?: number;
  // Inputs used
  probabilityOverrideInput?: string;
  singleOddsInput?: string;
  overOddsInput?: string;
  underOddsInput?: string;
}

export interface SlipSnapshot {
  id: string;
  createdAt: string; // ISO string
  payoutMultiplierX: number;
  legs: [LegSnapshot, LegSnapshot];
  pSlip: number;
  ev: number;
  rtp: number;
  status: SlipStatus;
  // Outcome when settled
  leg1Result?: LegResult;
  leg2Result?: LegResult;
  slipResult?: "win" | "loss";
  realizedReturnX?: number; // if win, equals payoutMultiplierX, else 0
  realizedProfitUnits?: number; // realizedReturnX - 1
}
