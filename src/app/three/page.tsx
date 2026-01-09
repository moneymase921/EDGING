'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { legProbabilityWithDevig, normalizeProbability } from '@/lib/math/odds';
import { slipWinProbIndependent, expectedValueSlip, rtpSlip, expectedValueSingle } from '@/lib/math/slip';
import { useUser } from '@/lib/UserContext';
import { PageContainer, PageHeader, Card, Input, Select, StatRow, PillButton } from '@/components/ui';

type LegInputMode = 'direct' | 'singleOdds' | 'devigPair';

type LegState = {
  prob: string;
  over: string;
  under: string;
  side: 'over' | 'under';
  odds: string;
  p: number | null;
  source: string | null;
  pImp: number | null;
  pFair: number | null;
};

export default function ThreePage() {
  const { username, isLoading } = useUser();
  const router = useRouter();

  const [modes, setModes] = useState<LegInputMode[]>(['direct', 'direct', 'direct']);
  const [legs, setLegs] = useState<LegState[]>([
    { prob: '', over: '', under: '', side: 'over', odds: '', p: null, source: null, pImp: null, pFair: null },
    { prob: '', over: '', under: '', side: 'over', odds: '', p: null, source: null, pImp: null, pFair: null },
    { prob: '', over: '', under: '', side: 'over', odds: '', p: null, source: null, pImp: null, pFair: null },
  ]);
  const [pSlip, setPSlip] = useState<number | null>(null);
  const [slipEv, setSlipEv] = useState<number | null>(null);
  const [slipRtp, setSlipRtp] = useState<number | null>(null);
  const [slipPayoutMultiplier, setSlipPayoutMultiplier] = useState('2.0');

  useEffect(() => {
    const updated = legs.map(l => {
      const r = legProbabilityWithDevig({
        side: l.side,
        americanOddsSingle: l.odds,
        probabilityOverride: l.prob,
        overOdds: l.over,
        underOdds: l.under,
      });
      return { ...l, p: r.pChosen, source: r.source, pImp: r.pImp ?? null, pFair: r.pFair ?? null };
    });
    const pVals = updated.map(l => l.p).filter(p => p !== null && !isNaN(p as number)) as number[];
    if (pVals.length === 3) {
      const p12 = slipWinProbIndependent(pVals[0], pVals[1]);
      const combined = slipWinProbIndependent(p12, pVals[2]);
      setPSlip(combined);
      const m = parseFloat(slipPayoutMultiplier);
      if (!isNaN(m) && m >= 1) {
        setSlipEv(expectedValueSlip(combined, m));
        setSlipRtp(rtpSlip(combined, m));
      } else {
        setSlipEv(null);
        setSlipRtp(null);
      }
    } else {
      setPSlip(null);
      setSlipEv(null);
      setSlipRtp(null);
    }
    setLegs(updated);
  }, [legs.map(l => [l.prob, l.over, l.under, l.side, l.odds]).flat(), slipPayoutMultiplier].flat());

  const payoutInputClass = slipEv !== null 
    ? (slipEv > 0 ? 'border-emerald-500/40' : slipEv < 0 ? 'border-rose-500/40' : '') 
    : '';

  function setMode(idx: number, mode: LegInputMode) {
    setModes(prev => {
      const next = [...prev];
      next[idx] = mode;
      return next;
    });
    if (mode === 'direct') {
      updateLeg(idx, { odds: '', over: '', under: '' });
    }
    if (mode === 'singleOdds') {
      updateLeg(idx, { prob: '', over: '', under: '' });
    }
    if (mode === 'devigPair') {
      updateLeg(idx, { prob: '', odds: '' });
    }
  }

  function updateLeg(idx: number, partial: Partial<LegState>) {
    setLegs(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...partial };
      return next;
    });
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

  // Redirect to login if no username
  useEffect(() => {
    if (!isLoading && !username) {
      router.push('/login');
    }
  }, [username, isLoading, router]);

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

  return (
    <PageContainer>
      <PageHeader
        title="Three-Leg Slip Calculator"
        subtitle="Enter probabilities for three legs. EV and sensitivity update live."
        active="three"
      />

      {/* Leg Inputs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {legs.map((leg, idx) => (
          <Card key={idx}>
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-lg font-semibold text-slate-100">Leg {idx + 1}</h2>
              <div className="flex gap-1.5">
                <PillButton active={modes[idx] === 'direct'} onClick={() => setMode(idx, 'direct')}>Direct</PillButton>
                <PillButton active={modes[idx] === 'singleOdds'} onClick={() => setMode(idx, 'singleOdds')}>Odds</PillButton>
                <PillButton active={modes[idx] === 'devigPair'} onClick={() => setMode(idx, 'devigPair')}>De-vig</PillButton>
              </div>
            </div>

            <div className="space-y-3">
              {modes[idx] === 'direct' && (
                <Input label="Direct Probability (0-1)" value={leg.prob} onChange={v => updateLeg(idx, { prob: v })} placeholder="e.g., 0.52" />
              )}
              {modes[idx] === 'singleOdds' && (
                <Input label="American Odds" value={leg.odds} onChange={v => updateLeg(idx, { odds: v })} placeholder="e.g., -110" />
              )}
              {modes[idx] === 'devigPair' && (
                <>
                  <Input label="Over Odds" value={leg.over} onChange={v => updateLeg(idx, { over: v })} placeholder="-110" />
                  <Input label="Under Odds" value={leg.under} onChange={v => updateLeg(idx, { under: v })} placeholder="-110" />
                  <Select
                    label="Chosen Side"
                    value={leg.side}
                    onChange={v => updateLeg(idx, { side: v as 'over' | 'under' })}
                    options={[{ value: 'over', label: 'Over' }, { value: 'under', label: 'Under' }]}
                  />
                </>
              )}
            </div>

            {/* Leg Results */}
            <div className="mt-4 pt-4 border-t border-slate-800/50 space-y-2">
              <StatRow label="Chosen Probability" value={leg.p !== null && !isNaN(leg.p) ? `${(leg.p * 100).toFixed(2)}%` : '—'} />
              {leg.pImp !== null && !isNaN(leg.pImp) && <StatRow label="Implied" value={`${(leg.pImp * 100).toFixed(2)}%`} color="muted" />}
              {leg.pFair !== null && !isNaN(leg.pFair) && <StatRow label="Fair (de-vigged)" value={`${(leg.pFair * 100).toFixed(2)}%`} />}
              <StatRow label="Source" value={leg.source || '—'} color="muted" />
            </div>
          </Card>
        ))}
      </div>

      {/* Slip Statistics */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Payout Input */}
          <div className="space-y-4">
            <Input
              label="Payout Multiplier (X)"
              value={slipPayoutMultiplier}
              onChange={setSlipPayoutMultiplier}
              placeholder="e.g., 2.0"
              type="number"
              inputClassName={payoutInputClass}
            />
          </div>

          {/* Slip Results */}
          <div className="lg:col-span-3">
            <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wide">Slip Statistics (Live)</h3>
            <div className="grid grid-cols-3 gap-6">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-0.5">Slip Win Probability</span>
                <span className="font-semibold text-2xl text-slate-100">
                  {pSlip !== null && !isNaN(pSlip) ? `${(pSlip * 100).toFixed(2)}%` : '—'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-0.5">Expected Value (EV)</span>
                <span className={`font-semibold text-2xl transition-colors ${slipEv !== null && slipEv > 0 ? 'text-emerald-400' : slipEv !== null && slipEv < 0 ? 'text-rose-400' : 'text-slate-100'}`}>
                  {slipEv !== null && !isNaN(slipEv) ? slipEv.toFixed(4) : '—'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-0.5">Return to Player (RTP)</span>
                <span className={`font-semibold text-2xl transition-colors ${slipRtp !== null && slipRtp > 1 ? 'text-emerald-400' : slipRtp !== null && slipRtp < 1 ? 'text-rose-400' : 'text-slate-100'}`}>
                  {slipRtp !== null && !isNaN(slipRtp) ? `${(slipRtp * 100).toFixed(2)}%` : '—'}
                </span>
                {slipRtp !== null && !isNaN(slipRtp) && (
                  <span className={`text-xs ${slipRtp > 1 ? 'text-emerald-400/70' : slipRtp < 1 ? 'text-rose-400/70' : 'text-slate-500'}`}>
                    ({slipRtp >= 1 ? '+' : ''}{((slipRtp - 1) * 100).toFixed(2)}% vs 100%)
                  </span>
                )}
              </div>
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
        Assumes leg independence; pSlip = p1 × p2 × p3 (pairwise). Priority per leg: direct override → de-vig pair → single odds. EV assumes 1 unit stake.
      </p>
    </PageContainer>
  );
}
