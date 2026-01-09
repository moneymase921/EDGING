'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { legProbabilityWithDevig, normalizeProbability } from '@/lib/math/odds';
import { expectedValueSingle, rtpSingle } from '@/lib/math/slip';
import { useUser } from '@/lib/UserContext';
import { PageContainer, PageHeader, Card, Input, Select, StatValue, PillButton, Message } from '@/components/ui';

type LegInputMode = 'direct' | 'singleOdds' | 'devigPair';

export default function SinglePage() {
  const { username, isLoading } = useUser();
  const router = useRouter();
  const [mode, setMode] = useState<LegInputMode>('direct');
  const [odds, setOdds] = useState('');
  const [overOddsSingle, setOverOddsSingle] = useState('');
  const [underOddsSingle, setUnderOddsSingle] = useState('');
  const [sideSingle, setSideSingle] = useState<'over' | 'under'>('over');
  const [probabilityOverrideSingle, setProbabilityOverrideSingle] = useState('');
  const [payoutMultiplier, setPayoutMultiplier] = useState('2.0');

  const [pChosenSingle, setPChosenSingle] = useState<number | null>(null);
  const [pImpSingle, setPImpSingle] = useState<number | null>(null);
  const [pFairSingle, setPFairSingle] = useState<number | null>(null);
  const [vigPercentSingle, setVigPercentSingle] = useState<number | null>(null);
  const [sourceSingle, setSourceSingle] = useState<string | null>(null);
  const [errorSingle, setErrorSingle] = useState<string | null>(null);
  const [ev, setEv] = useState<number | null>(null);
  const [rtp, setRtp] = useState<number | null>(null);

  useEffect(() => {
    const result = legProbabilityWithDevig({
      side: sideSingle,
      americanOddsSingle: odds,
      probabilityOverride: probabilityOverrideSingle,
      overOdds: overOddsSingle,
      underOdds: underOddsSingle,
    });

    setPChosenSingle(result.pChosen);
    setPImpSingle(result.pImp || null);
    setPFairSingle(result.pFair || null);
    setVigPercentSingle(result.vigPercent || null);
    setSourceSingle(result.source);
    setErrorSingle(result.error || null);

    const parsedPayoutMultiplier = parseFloat(payoutMultiplier);
    if (result.pChosen !== null && !isNaN(result.pChosen) && !isNaN(parsedPayoutMultiplier) && parsedPayoutMultiplier >= 0) {
      setEv(expectedValueSingle(result.pChosen, parsedPayoutMultiplier));
      setRtp(rtpSingle(result.pChosen, parsedPayoutMultiplier));
    } else {
      setEv(null);
      setRtp(null);
    }
  }, [odds, overOddsSingle, underOddsSingle, sideSingle, probabilityOverrideSingle, payoutMultiplier]);

  const payoutInputClass = ev !== null 
    ? (ev > 0 ? 'border-emerald-500/40' : ev < 0 ? 'border-rose-500/40' : '') 
    : '';

  const setInputMode = (next: LegInputMode) => {
    setMode(next);
    if (next === 'direct') {
      setOdds('');
      setOverOddsSingle('');
      setUnderOddsSingle('');
    }
    if (next === 'singleOdds') {
      setProbabilityOverrideSingle('');
      setOverOddsSingle('');
      setUnderOddsSingle('');
    }
    if (next === 'devigPair') {
      setProbabilityOverrideSingle('');
      setOdds('');
    }
  };

  // Sensitivity data
  const sensitivityData = (() => {
    if (pChosenSingle === null || isNaN(pChosenSingle) || ev === null || isNaN(ev)) return [];
    const payout = parseFloat(payoutMultiplier);
    if (isNaN(payout) || payout < 1) return [];
    
    const adjustments = [-0.03, -0.02, -0.01, 0, 0.01, 0.02, 0.03];
    return adjustments.map(adj => {
      const adjustedP = normalizeProbability(pChosenSingle + adj);
      const adjustedEv = expectedValueSingle(adjustedP, payout);
      return { adjustment: adj * 100, pWin: adjustedP, ev: adjustedEv };
    });
  })();

  const hasInvalidInput = (
    (pChosenSingle !== null && isNaN(pChosenSingle)) || 
    (ev !== null && isNaN(ev)) || 
    (rtp !== null && isNaN(rtp)) || 
    (parseFloat(payoutMultiplier) < 0 && !isNaN(parseFloat(payoutMultiplier)))
  );

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
        title="Single-Leg Calculator"
        subtitle="Compute EV and RTP for a single bet. Choose an input mode below."
        active="single"
      />

      <div className="max-w-2xl space-y-6">
        {/* Input Mode Selection */}
        <Card>
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold text-slate-100">Probability Input</h2>
            <div className="flex gap-2">
              <PillButton active={mode === 'direct'} onClick={() => setInputMode('direct')}>Direct Prob</PillButton>
              <PillButton active={mode === 'singleOdds'} onClick={() => setInputMode('singleOdds')}>Single Odds</PillButton>
              <PillButton active={mode === 'devigPair'} onClick={() => setInputMode('devigPair')}>Over/Under</PillButton>
            </div>
          </div>

          <div className="space-y-4">
            {mode === 'direct' && (
              <Input
                label="Direct Probability (0-1)"
                value={probabilityOverrideSingle}
                onChange={setProbabilityOverrideSingle}
                placeholder="e.g., 0.52"
              />
            )}

            {mode === 'singleOdds' && (
              <Input
                label="American Odds"
                value={odds}
                onChange={setOdds}
                placeholder="e.g., -110 or +150"
              />
            )}

            {mode === 'devigPair' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input label="Over Odds" value={overOddsSingle} onChange={setOverOddsSingle} placeholder="e.g., -110" />
                <Input label="Under Odds" value={underOddsSingle} onChange={setUnderOddsSingle} placeholder="e.g., -110" />
                <Select
                  label="Chosen Side"
                  value={sideSingle}
                  onChange={v => setSideSingle(v as 'over' | 'under')}
                  options={[{ value: 'over', label: 'Over' }, { value: 'under', label: 'Under' }]}
                />
              </div>
            )}

            <Input
              label="Payout Multiplier (X)"
              value={payoutMultiplier}
              onChange={setPayoutMultiplier}
              placeholder="e.g., 2.0"
              type="number"
              inputClassName={payoutInputClass}
            />
          </div>
        </Card>

        {/* Probabilities & Source */}
        <Card title="Probabilities & Source">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {pChosenSingle !== null && !isNaN(pChosenSingle) && (
              <StatValue label="Chosen Probability" value={`${(pChosenSingle * 100).toFixed(2)}%`} size="lg" />
            )}
            {pImpSingle !== null && !isNaN(pImpSingle) && sourceSingle === 'singleOdds' && (
              <StatValue label="Implied (single odds)" value={`${(pImpSingle * 100).toFixed(2)}%`} color="muted" />
            )}
            {pImpSingle !== null && !isNaN(pImpSingle) && sourceSingle === 'devigPair' && (
              <StatValue label="Implied (pair side)" value={`${(pImpSingle * 100).toFixed(2)}%`} color="muted" />
            )}
            {pFairSingle !== null && !isNaN(pFairSingle) && (
              <StatValue label="Fair (de-vigged)" value={`${(pFairSingle * 100).toFixed(2)}%`} />
            )}
            {vigPercentSingle !== null && !isNaN(vigPercentSingle) && (
              <StatValue label="Vig/Overround" value={`${vigPercentSingle.toFixed(2)}%`} color="muted" />
            )}
            {sourceSingle !== null && (
              <StatValue label="Source" value={sourceSingle} color="muted" />
            )}
          </div>
        </Card>

        {/* Results */}
        <Card title="Expected Value & RTP">
          <div className="grid grid-cols-2 gap-6 mb-4">
            {ev !== null && !isNaN(ev) && (
              <div className="flex flex-col">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-0.5">Expected Value (EV)</span>
                <span className={`font-semibold text-2xl transition-colors ${ev > 0 ? 'text-emerald-400' : ev < 0 ? 'text-rose-400' : 'text-slate-100'}`}>
                  {ev.toFixed(4)}
                </span>
              </div>
            )}
            {rtp !== null && !isNaN(rtp) && (
              <div className="flex flex-col">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-0.5">Return to Player (RTP)</span>
                <span className={`font-semibold text-2xl transition-colors ${rtp > 1 ? 'text-emerald-400' : rtp < 1 ? 'text-rose-400' : 'text-slate-100'}`}>
                  {(rtp * 100).toFixed(2)}%
                </span>
                <span className={`text-xs ${rtp > 1 ? 'text-emerald-400/70' : rtp < 1 ? 'text-rose-400/70' : 'text-slate-500'}`}>
                  ({rtp >= 1 ? '+' : ''}{((rtp - 1) * 100).toFixed(2)}% vs 100%)
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Sensitivity Analysis */}
        {sensitivityData.length > 0 && (
          <Card title="Sensitivity Analysis">
            <p className="text-xs text-slate-500 mb-4">How EV changes if your probability estimate is off by a few percentage points.</p>
            <div className="overflow-x-auto rounded-xl border border-slate-700/40 bg-slate-900/30">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/40">
                    <th className="py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wide text-left">p Adjustment</th>
                    <th className="py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wide text-right">Adjusted p</th>
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
          Priority: direct override → de-vig pair → single odds. Single-leg EV assumes 1 unit stake. No correlation adjustments.
        </p>

        {/* Errors */}
        {errorSingle && <Message variant="error">Error: {errorSingle}</Message>}
        {hasInvalidInput && (
          <Message variant="error">Invalid input. Please enter valid numbers for odds and a non-negative payout multiplier.</Message>
        )}
      </div>
    </PageContainer>
  );
}
