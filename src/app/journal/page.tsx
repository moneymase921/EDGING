'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SlipSnapshot, LegResult, SlipStatus } from '@/lib/types';
import { loadSlips, updateSlip, deleteSlip } from '../actions';
import { useUser } from '@/lib/UserContext';
import { PageContainer, PageHeader, Card, Select, StatValue, StatRow, Button, Badge, Message } from '@/components/ui';

export default function JournalPage() {
  const { username, isLoading } = useUser();
  const router = useRouter();
  
  const [slips, setSlips] = useState<SlipSnapshot[]>([]);
  const [filterStatus, setFilterStatus] = useState<SlipStatus | 'all'>('pending');
  const [settleInputs, setSettleInputs] = useState<Record<string, { leg1Result?: LegResult; leg2Result?: LegResult }>>({});
  const [settleError, setSettleError] = useState<string | null>(null);
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

  const filteredSlips = slips.filter(slip => filterStatus === 'all' || slip.status === filterStatus);
  const totalSlips = slips.length;
  const pendingCount = slips.filter(s => s.status === 'pending').length;
  const settledCount = slips.filter(s => s.status === 'settled').length;
  const totalRealizedProfit = slips.reduce((sum, s) => sum + (s.realizedProfitUnits || 0), 0);
  const averageRealizedProfit = settledCount > 0 ? totalRealizedProfit / settledCount : 0;

  const profitColor = totalRealizedProfit > 0 ? 'positive' : totalRealizedProfit < 0 ? 'negative' : 'default';
  const avgProfitColor = averageRealizedProfit > 0 ? 'positive' : averageRealizedProfit < 0 ? 'negative' : 'default';

  const handleSettleInputChange = (slipId: string, legKey: 'leg1Result' | 'leg2Result', value: LegResult | '') => {
    setSettleInputs(prev => ({
      ...prev,
      [slipId]: { ...prev[slipId], [legKey]: value || undefined },
    }));
    setSettleError(null);
  };

  const handleSettleSlip = async (slipId: string, leg1Result: LegResult, leg2Result: LegResult) => {
    if (!username) return;
    const slipToUpdate = slips.find(s => s.id === slipId);
    if (!slipToUpdate) return;
    const updatedSlip = { ...slipToUpdate };
    updatedSlip.leg1Result = leg1Result;
    updatedSlip.leg2Result = leg2Result;
    if (leg1Result === 'hit' && leg2Result === 'hit') {
      updatedSlip.slipResult = 'win';
      updatedSlip.realizedReturnX = updatedSlip.payoutMultiplierX;
    } else {
      updatedSlip.slipResult = 'loss';
      updatedSlip.realizedReturnX = 0;
    }
    updatedSlip.realizedProfitUnits = (updatedSlip.realizedReturnX || 0) - 1;
    updatedSlip.status = 'settled';
    await updateSlip(username, updatedSlip);
    setSlips(await loadSlips(username));
  };

  const handleSubmitSettle = async (slipId: string) => {
    const inputs = settleInputs[slipId] || {};
    if (!inputs.leg1Result || !inputs.leg2Result) {
      setSettleError('Please select results for both legs before settling.');
      return;
    }
    await handleSettleSlip(slipId, inputs.leg1Result, inputs.leg2Result);
    setSettleInputs(prev => ({ ...prev, [slipId]: {} }));
    setSettleError(null);
    setConfirmationMessage('Slip settled successfully.');
    setTimeout(() => setConfirmationMessage(null), 2000);
  };

  const handleDeleteSlip = async (id: string) => {
    if (!username) return;
    await deleteSlip(username, id);
    setSlips(await loadSlips(username));
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

  return (
    <PageContainer>
      <PageHeader
        title="Bet Journal"
        subtitle="Track your slips, settle outcomes, and monitor performance."
        active="journal"
      />

      {/* Summary Stats */}
      <Card className="mb-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wide">Summary Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          <StatValue label="Total Slips" value={totalSlips} />
          <StatValue label="Pending" value={pendingCount} />
          <StatValue label="Settled" value={settledCount} />
          <StatValue label="Total Profit (Units)" value={totalRealizedProfit.toFixed(2)} color={profitColor as 'positive' | 'negative' | 'default'} />
          <StatValue label="Avg Profit/Slip" value={averageRealizedProfit.toFixed(2)} color={avgProfitColor as 'positive' | 'negative' | 'default'} />
        </div>
      </Card>

      {/* Filter Controls */}
      <div className="flex gap-3 mb-6">
        <Button
          variant={filterStatus === 'pending' ? 'primary' : 'secondary'}
          onClick={() => setFilterStatus('pending')}
        >
          Pending ({pendingCount})
        </Button>
        <Button
          variant={filterStatus === 'all' ? 'primary' : 'secondary'}
          onClick={() => setFilterStatus('all')}
        >
          All ({totalSlips})
        </Button>
      </div>

      {/* Confirmation Message */}
      {confirmationMessage && <Message variant="success">{confirmationMessage}</Message>}

      {/* Slips List */}
      {filteredSlips.length === 0 ? (
        <Card>
          <p className="text-slate-400 text-center py-8">No slips to display for the current filter.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSlips.map(slip => {
            const evColor = slip.ev > 0 ? 'positive' : slip.ev < 0 ? 'negative' : 'default';
            
            return (
              <Card key={slip.id}>
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs text-slate-500">{new Date(slip.createdAt).toLocaleString()}</p>
                    <p className="text-xl font-bold text-slate-100 mt-1">{slip.payoutMultiplierX}x Payout</p>
                  </div>
                  <Badge variant={slip.status === 'pending' ? 'warning' : slip.slipResult === 'win' ? 'success' : 'error'}>
                    {slip.status === 'pending' ? 'Pending' : slip.slipResult?.toUpperCase()}
                  </Badge>
                </div>

                {/* Slip Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <StatValue label="Win Probability" value={`${(slip.pSlip * 100).toFixed(2)}%`} size="sm" />
                  <StatValue label="EV" value={slip.ev.toFixed(4)} color={evColor as 'positive' | 'negative' | 'default'} size="sm" />
                  <StatValue label="RTP" value={`${(slip.rtp * 100).toFixed(2)}%`} size="sm" />
                </div>

                {/* Legs */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {slip.legs.map((leg, legIdx) => (
                    <div key={leg.id} className="rounded-xl bg-slate-800/30 p-3">
                      <p className="text-xs font-semibold text-slate-400 mb-2">Leg {legIdx + 1}</p>
                      <div className="space-y-1">
                        <StatRow label="Side" value={leg.chosenSide} color="muted" />
                        <StatRow label="Source" value={leg.probabilitySource} color="muted" />
                        <StatRow label="pChosen" value={`${(leg.pChosen * 100).toFixed(2)}%`} />
                        {leg.pImp !== undefined && <StatRow label="pImp" value={`${(leg.pImp * 100).toFixed(2)}%`} color="muted" />}
                        {leg.pFair !== undefined && <StatRow label="pFair" value={`${(leg.pFair * 100).toFixed(2)}%`} color="muted" />}
                        {leg.vigPercent !== undefined && <StatRow label="Vig" value={`${leg.vigPercent.toFixed(2)}%`} color="muted" />}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Settle Form or Results */}
                {slip.status === 'pending' ? (
                  <div className="rounded-xl bg-slate-800/30 p-4">
                    <h3 className="text-sm font-semibold text-slate-300 mb-3">Settle This Slip</h3>
                    <div className="flex flex-wrap items-end gap-4">
                      <div className="flex-1 min-w-[120px]">
                        <label className="text-xs text-slate-400 block mb-1">Leg 1 Result</label>
                        <select
                          className="w-full rounded-lg border border-slate-700/50 bg-slate-900/60 px-3 py-2 text-slate-100 text-sm"
                          value={settleInputs[slip.id]?.leg1Result || ''}
                          onChange={(e) => handleSettleInputChange(slip.id, 'leg1Result', e.target.value as LegResult | '')}
                        >
                          <option value="">Select</option>
                          <option value="hit">Hit</option>
                          <option value="miss">Miss</option>
                        </select>
                      </div>
                      <div className="flex-1 min-w-[120px]">
                        <label className="text-xs text-slate-400 block mb-1">Leg 2 Result</label>
                        <select
                          className="w-full rounded-lg border border-slate-700/50 bg-slate-900/60 px-3 py-2 text-slate-100 text-sm"
                          value={settleInputs[slip.id]?.leg2Result || ''}
                          onChange={(e) => handleSettleInputChange(slip.id, 'leg2Result', e.target.value as LegResult | '')}
                        >
                          <option value="">Select</option>
                          <option value="hit">Hit</option>
                          <option value="miss">Miss</option>
                        </select>
                      </div>
                      <Button onClick={() => handleSubmitSettle(slip.id)}>
                        Submit Results
                      </Button>
                    </div>
                    {settleError && <Message variant="error">{settleError}</Message>}
                  </div>
                ) : (
                  <div className="rounded-xl bg-slate-800/30 p-4">
                    <div className="grid grid-cols-3 gap-4">
                      <StatValue 
                        label="Result" 
                        value={slip.slipResult?.toUpperCase() || '—'} 
                        color={slip.slipResult === 'win' ? 'positive' : 'negative'} 
                      />
                      <StatValue 
                        label="Realized Return" 
                        value={`${slip.realizedReturnX?.toFixed(2)}x`} 
                      />
                      <StatValue 
                        label="Profit (Units)" 
                        value={slip.realizedProfitUnits?.toFixed(2) || '—'} 
                        color={slip.realizedProfitUnits !== undefined && slip.realizedProfitUnits > 0 ? 'positive' : 'negative'} 
                      />
                    </div>
                  </div>
                )}

                {/* Delete Button */}
                <div className="mt-4 pt-4 border-t border-slate-800/50">
                  <Button variant="danger" onClick={() => handleDeleteSlip(slip.id)}>
                    Delete Slip
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
