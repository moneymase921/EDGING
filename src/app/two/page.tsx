'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { legProbabilityWithDevig, normalizeProbability } from '@/lib/math/odds';
import { slipWinProbIndependent, expectedValueSlip, rtpSlip, expectedValueSingle } from '@/lib/math/slip';
import { SlipSnapshot, LegSnapshot, ProbabilitySource } from '@/lib/types';
import { loadSlips, saveSlip } from '../actions';
import { useUser } from '@/lib/UserContext';
import { PageContainer, PageHeader, Card, Input, Select, StatRow, PillButton, Button, Message } from '@/components/ui';

type LegInputMode = 'direct' | 'singleOdds' | 'devigPair';

export default function TwoPage() {
  const { username, isLoading } = useUser();
  const router = useRouter();

  const [leg1Mode, setLeg1Mode] = useState<LegInputMode>('direct');
  const [leg1Odds, setLeg1Odds] = useState('');
  const [leg1OverOdds, setLeg1OverOdds] = useState('');
  const [leg1UnderOdds, setLeg1UnderOdds] = useState('');
  const [leg1Side, setLeg1Side] = useState<'over' | 'under'>('over');
  const [leg1Prob, setLeg1Prob] = useState('');

  const [leg2Mode, setLeg2Mode] = useState<LegInputMode>('direct');
  const [leg2Odds, setLeg2Odds] = useState('');
  const [leg2OverOdds, setLeg2OverOdds] = useState('');
  const [leg2UnderOdds, setLeg2UnderOdds] = useState('');
  const [leg2Side, setLeg2Side] = useState<'over' | 'under'>('over');
  const [leg2Prob, setLeg2Prob] = useState('');

  const [slipPayoutMultiplier, setSlipPayoutMultiplier] = useState('2.0');

  const [p1, setP1] = useState<number | null>(null);
  const [p1Imp, setP1Imp] = useState<number | null>(null);
  const [p1Fair, setP1Fair] = useState<number | null>(null);
  const [p1VigPercent, setP1VigPercent] = useState<number | null>(null);
  const [p1Source, setP1Source] = useState<string | null>(null);
  const [p1Error, setP1Error] = useState<string | null>(null);

  const [p2, setP2] = useState<number | null>(null);
  const [p2Imp, setP2Imp] = useState<number | null>(null);
  const [p2Fair, setP2Fair] = useState<number | null>(null);
  const [p2VigPercent, setP2VigPercent] = useState<number | null>(null);
  const [p2Source, setP2Source] = useState<string | null>(null);
  const [p2Error, setP2Error] = useState<string | null>(null);

  const [pSlip, setPSlip] = useState<number | null>(null);
  const [slipEv, setSlipEv] = useState<number | null>(null);
  const [slipRtp, setSlipRtp] = useState<number | null>(null);

  const [slips, setSlips] = useState<SlipSnapshot[]>([]);
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);

  // Redirect to login if no username
  useEffect(() => {
    if (!isLoading && !username) {
      router.push('/login');
    }
  }, [username, isLoading, router]);

  // Load slips when username is available
  useEffect(() => {
    if (username) {
      loadSlips(username).then(setSlips);
    }
  }, [username]);

  useEffect(() => {
    const leg1Result = legProbabilityWithDevig({
      side: leg1Side,
      americanOddsSingle: leg1Odds,
      probabilityOverride: leg1Prob,
      overOdds: leg1OverOdds,
      underOdds: leg1UnderOdds,
    });
    setP1(leg1Result.pChosen);
    setP1Imp(leg1Result.pImp || null);
    setP1Fair(leg1Result.pFair || null);
    setP1VigPercent(leg1Result.vigPercent || null);
    setP1Source(leg1Result.source);
    setP1Error(leg1Result.error || null);

    const leg2Result = legProbabilityWithDevig({
      side: leg2Side,
      americanOddsSingle: leg2Odds,
      probabilityOverride: leg2Prob,
      overOdds: leg2OverOdds,
      underOdds: leg2UnderOdds,
    });
    setP2(leg2Result.pChosen);
    setP2Imp(leg2Result.pImp || null);
    setP2Fair(leg2Result.pFair || null);
    setP2VigPercent(leg2Result.vigPercent || null);
    setP2Source(leg2Result.source);
    setP2Error(leg2Result.error || null);

    if (leg1Result.pChosen !== null && !isNaN(leg1Result.pChosen) && leg2Result.pChosen !== null && !isNaN(leg2Result.pChosen)) {
      const combinedPSlip = slipWinProbIndependent(leg1Result.pChosen, leg2Result.pChosen);
      setPSlip(combinedPSlip);
      const parsedSlipPayoutMultiplier = parseFloat(slipPayoutMultiplier);
      if (!isNaN(parsedSlipPayoutMultiplier) && parsedSlipPayoutMultiplier >= 1) {
        setSlipEv(expectedValueSlip(combinedPSlip, parsedSlipPayoutMultiplier));
        setSlipRtp(rtpSlip(combinedPSlip, parsedSlipPayoutMultiplier));
      } else {
        setSlipEv(null);
        setSlipRtp(null);
      }
    } else {
      setPSlip(null);
      setSlipEv(null);
      setSlipRtp(null);
    }
  }, [leg1Odds, leg1OverOdds, leg1UnderOdds, leg1Side, leg1Prob, leg2Odds, leg2OverOdds, leg2UnderOdds, leg2Side, leg2Prob, slipPayoutMultiplier]);

  const payoutInputClass = slipEv !== null 
    ? (slipEv > 0 ? 'border-emerald-500/40' : slipEv < 0 ? 'border-rose-500/40' : '') 
    : '';

  const setLegMode = (which: 1 | 2, mode: LegInputMode) => {
    if (which === 1) {
      setLeg1Mode(mode);
      if (mode === 'direct') { setLeg1Odds(''); setLeg1OverOdds(''); setLeg1UnderOdds(''); }
      if (mode === 'singleOdds') { setLeg1Prob(''); setLeg1OverOdds(''); setLeg1UnderOdds(''); }
      if (mode === 'devigPair') { setLeg1Prob(''); setLeg1Odds(''); }
    } else {
      setLeg2Mode(mode);
      if (mode === 'direct') { setLeg2Odds(''); setLeg2OverOdds(''); setLeg2UnderOdds(''); }
      if (mode === 'singleOdds') { setLeg2Prob(''); setLeg2OverOdds(''); setLeg2UnderOdds(''); }
      if (mode === 'devigPair') { setLeg2Prob(''); setLeg2Odds(''); }
    }
  };

  const handleSaveSlip = async () => {
    if (p1 === null || p2 === null || pSlip === null || slipEv === null || slipRtp === null || !slipPayoutMultiplier) {
      setConfirmationMessage('Cannot save an invalid slip. Please ensure all probabilities and payouts are valid.');
      return;
    }

    const leg1Snapshot: LegSnapshot = {
      id: `leg1-${Date.now()}`,
      chosenSide: leg1Side,
      probabilitySource: p1Source as ProbabilitySource,
      pChosen: p1,
      pImp: p1Imp || undefined,
      pFair: p1Fair || undefined,
      vigPercent: p1VigPercent || undefined,
      probabilityOverrideInput: leg1Prob || undefined,
      singleOddsInput: leg1Odds || undefined,
      overOddsInput: leg1OverOdds || undefined,
      underOddsInput: leg1UnderOdds || undefined,
    };

    const leg2Snapshot: LegSnapshot = {
      id: `leg2-${Date.now()}`,
      chosenSide: leg2Side,
      probabilitySource: p2Source as ProbabilitySource,
      pChosen: p2,
      pImp: p2Imp || undefined,
      pFair: p2Fair || undefined,
      vigPercent: p2VigPercent || undefined,
      probabilityOverrideInput: leg2Prob || undefined,
      singleOddsInput: leg2Odds || undefined,
      overOddsInput: leg2OverOdds || undefined,
      underOddsInput: leg2UnderOdds || undefined,
    };

    const newSlip: SlipSnapshot = {
      id: `slip-${Date.now()}`,
      createdAt: new Date().toISOString(),
      payoutMultiplierX: parseFloat(slipPayoutMultiplier),
      legs: [leg1Snapshot, leg2Snapshot],
      pSlip: pSlip,
      ev: slipEv,
      rtp: slipRtp,
      status: 'pending',
    };

    if (!username) return;
    await saveSlip(username, newSlip);
    setSlips(await loadSlips(username));
    setConfirmationMessage('Slip saved successfully!');
    setTimeout(() => setConfirmationMessage(null), 2000);
  };

  // Show loading while checking auth
  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </main>
    );
  }

  if (!username) {
    return null; // Will redirect
  }

  // Sensitivity data
  const sensitivityData = (() => {
    if (pSlip === null || isNaN(pSlip) || slipEv === null || isNaN(slipEv)) return [];
    const payout = parseFloat(slipPayoutMultiplier);
    if (isNaN(payout) || payout < 1) return [];
    
    const adjustments = [-0.03, -0.02, -0.01, 0, 0.01, 0.02, 0.03];
    return adjustments.map(adj => {
      const adjustedP = normalizeProbability(pSlip + adj);
      const adjustedEv = expectedValueSingle(adjustedP, payout);
      return { adjustment: adj * 100, pWin: adjustedP, ev: adjustedEv };
    });
  })();

  const canSave = p1 !== null && p2 !== null && pSlip !== null && slipEv !== null && slipRtp !== null && 
    !isNaN(parseFloat(slipPayoutMultiplier)) && parseFloat(slipPayoutMultiplier) >= 1 && 
    p1Error === null && p2Error === null;

  return (
    <PageContainer>
      <PageHeader
        title="Two-Leg Slip Calculator"
        subtitle="Enter probabilities for two legs. EV and sensitivity update live."
        active="two"
      />

      {/* Leg Inputs - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Leg 1 */}
        <Card>
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold text-slate-100">Leg 1</h2>
            <div className="flex gap-1.5">
              <PillButton active={leg1Mode === 'direct'} onClick={() => setLegMode(1, 'direct')}>Direct</PillButton>
              <PillButton active={leg1Mode === 'singleOdds'} onClick={() => setLegMode(1, 'singleOdds')}>Odds</PillButton>
              <PillButton active={leg1Mode === 'devigPair'} onClick={() => setLegMode(1, 'devigPair')}>De-vig</PillButton>
            </div>
          </div>

          <div className="space-y-3">
            {leg1Mode === 'direct' && (
              <Input label="Direct Probability (0-1)" value={leg1Prob} onChange={setLeg1Prob} placeholder="e.g., 0.52" />
            )}
            {leg1Mode === 'singleOdds' && (
              <Input label="American Odds" value={leg1Odds} onChange={setLeg1Odds} placeholder="e.g., -110" />
            )}
            {leg1Mode === 'devigPair' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Over Odds" value={leg1OverOdds} onChange={setLeg1OverOdds} placeholder="-110" />
                  <Input label="Under Odds" value={leg1UnderOdds} onChange={setLeg1UnderOdds} placeholder="-110" />
                </div>
                <Select
                  label="Chosen Side"
                  value={leg1Side}
                  onChange={v => setLeg1Side(v as 'over' | 'under')}
                  options={[{ value: 'over', label: 'Over' }, { value: 'under', label: 'Under' }]}
                />
              </>
            )}
          </div>

          {/* Leg 1 Results */}
          <div className="mt-4 pt-4 border-t border-slate-800/50 space-y-2">
            {p1 !== null && !isNaN(p1) && <StatRow label="Chosen Probability" value={`${(p1 * 100).toFixed(2)}%`} />}
            {p1Imp !== null && !isNaN(p1Imp) && <StatRow label="Implied" value={`${(p1Imp * 100).toFixed(2)}%`} color="muted" />}
            {p1Fair !== null && !isNaN(p1Fair) && <StatRow label="Fair (de-vigged)" value={`${(p1Fair * 100).toFixed(2)}%`} />}
            {p1VigPercent !== null && !isNaN(p1VigPercent) && <StatRow label="Vig" value={`${p1VigPercent.toFixed(2)}%`} color="muted" />}
            {p1Source && <StatRow label="Source" value={p1Source} color="muted" />}
            {p1Error && <Message variant="error">{p1Error}</Message>}
          </div>
        </Card>

        {/* Leg 2 */}
        <Card>
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold text-slate-100">Leg 2</h2>
            <div className="flex gap-1.5">
              <PillButton active={leg2Mode === 'direct'} onClick={() => setLegMode(2, 'direct')}>Direct</PillButton>
              <PillButton active={leg2Mode === 'singleOdds'} onClick={() => setLegMode(2, 'singleOdds')}>Odds</PillButton>
              <PillButton active={leg2Mode === 'devigPair'} onClick={() => setLegMode(2, 'devigPair')}>De-vig</PillButton>
            </div>
          </div>

          <div className="space-y-3">
            {leg2Mode === 'direct' && (
              <Input label="Direct Probability (0-1)" value={leg2Prob} onChange={setLeg2Prob} placeholder="e.g., 0.52" />
            )}
            {leg2Mode === 'singleOdds' && (
              <Input label="American Odds" value={leg2Odds} onChange={setLeg2Odds} placeholder="e.g., -110" />
            )}
            {leg2Mode === 'devigPair' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Over Odds" value={leg2OverOdds} onChange={setLeg2OverOdds} placeholder="-110" />
                  <Input label="Under Odds" value={leg2UnderOdds} onChange={setLeg2UnderOdds} placeholder="-110" />
                </div>
                <Select
                  label="Chosen Side"
                  value={leg2Side}
                  onChange={v => setLeg2Side(v as 'over' | 'under')}
                  options={[{ value: 'over', label: 'Over' }, { value: 'under', label: 'Under' }]}
                />
              </>
            )}
          </div>

          {/* Leg 2 Results */}
          <div className="mt-4 pt-4 border-t border-slate-800/50 space-y-2">
            {p2 !== null && !isNaN(p2) && <StatRow label="Chosen Probability" value={`${(p2 * 100).toFixed(2)}%`} />}
            {p2Imp !== null && !isNaN(p2Imp) && <StatRow label="Implied" value={`${(p2Imp * 100).toFixed(2)}%`} color="muted" />}
            {p2Fair !== null && !isNaN(p2Fair) && <StatRow label="Fair (de-vigged)" value={`${(p2Fair * 100).toFixed(2)}%`} />}
            {p2VigPercent !== null && !isNaN(p2VigPercent) && <StatRow label="Vig" value={`${p2VigPercent.toFixed(2)}%`} color="muted" />}
            {p2Source && <StatRow label="Source" value={p2Source} color="muted" />}
            {p2Error && <Message variant="error">{p2Error}</Message>}
          </div>
        </Card>
      </div>

      {/* Slip Statistics */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Payout Input + Save */}
          <div className="space-y-4">
            <Input
              label="Payout Multiplier (X)"
              value={slipPayoutMultiplier}
              onChange={setSlipPayoutMultiplier}
              placeholder="e.g., 2.0"
              type="number"
              inputClassName={payoutInputClass}
            />
            <Button onClick={handleSaveSlip} disabled={!canSave} className="w-full">
              Save Current Slip
            </Button>
            {confirmationMessage && <Message variant="success">{confirmationMessage}</Message>}
          </div>

          {/* Slip Results */}
          <div className="lg:col-span-3">
            <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wide">Slip Statistics (Live)</h3>
            <div className="grid grid-cols-3 gap-6">
              {pSlip !== null && !isNaN(pSlip) && (
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-0.5">Slip Win Probability</span>
                  <span className="font-semibold text-2xl text-slate-100">{(pSlip * 100).toFixed(2)}%</span>
                </div>
              )}
              {slipEv !== null && !isNaN(slipEv) && (
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-0.5">Expected Value (EV)</span>
                  <span className={`font-semibold text-2xl transition-colors ${slipEv > 0 ? 'text-emerald-400' : slipEv < 0 ? 'text-rose-400' : 'text-slate-100'}`}>
                    {slipEv.toFixed(4)}
                  </span>
                </div>
              )}
              {slipRtp !== null && !isNaN(slipRtp) && (
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-0.5">Return to Player (RTP)</span>
                  <span className={`font-semibold text-2xl transition-colors ${slipRtp > 1 ? 'text-emerald-400' : slipRtp < 1 ? 'text-rose-400' : 'text-slate-100'}`}>
                    {(slipRtp * 100).toFixed(2)}%
                  </span>
                  <span className={`text-xs ${slipRtp > 1 ? 'text-emerald-400/70' : slipRtp < 1 ? 'text-rose-400/70' : 'text-slate-500'}`}>
                    ({slipRtp >= 1 ? '+' : ''}{((slipRtp - 1) * 100).toFixed(2)}% vs 100%)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Sensitivity Analysis */}
      {sensitivityData.length > 0 && (
        <Card title="Sensitivity Analysis" className="mb-6">
          <p className="text-xs text-slate-500 mb-4">How slip EV changes if combined probability (pSlip) is adjusted by a few percentage points.</p>
          <div className="overflow-x-auto rounded-xl border border-slate-700/40 bg-slate-900/30">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/40">
                  <th className="py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wide text-left">pSlip Adjustment</th>
                  <th className="py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wide text-right">Adjusted pSlip</th>
                  <th className="py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wide text-right">Adjusted EV</th>
                </tr>
              </thead>
              <tbody>
                {sensitivityData.map((row, index) => (
                  <tr 
                    key={index} 
                    className={`border-b border-slate-800/30 last:border-b-0 ${row.ev > 0 ? 'bg-emerald-500/10' : row.ev < 0 ? 'bg-rose-500/10' : ''}`}
                  >
                    <td className="py-2.5 px-4 text-slate-300">{row.adjustment > 0 ? '+' : ''}{row.adjustment}%</td>
                    <td className="py-2.5 px-4 text-right text-slate-300">{(row.pWin * 100).toFixed(2)}%</td>
                    <td className={`py-2.5 px-4 text-right font-semibold ${row.ev > 0 ? 'text-emerald-400' : row.ev < 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                      {row.ev.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Assumptions */}
      <p className="text-xs text-slate-500">
        Assumes leg independence; pSlip = p1 × p2. Priority per leg: direct override → de-vig pair → single odds. EV assumes 1 unit stake.
      </p>
    </PageContainer>
  );
}
